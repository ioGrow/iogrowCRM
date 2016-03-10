import logging
import webapp2
import re
from google.appengine.ext import ndb
from google.appengine.ext.webapp.mail_handlers import InboundMailHandler
from iomodels.crmengine.notes import Note
from model import User,Userinfo
from django.utils.encoding import smart_str
from iograph import Node,Edge
from endpoints_helper import EndpointsHelper

class GetEmailsHandler(InboundMailHandler):
    def receive(self, mail_message):
        sender_id = mail_message.to.split("@")[0]
        try:
            bcc = mail_message.bcc.split("@")[0]
        except:
            bcc = 'undefined'
        user_id = 'undefined'
        if sender_id.isdigit():
            user_id=sender_id
        if bcc.isdigit():
            user_id=bcc
        user = User.get_by_gid(user_id)
        if user:
            sender_email=re.findall(r'[\w\.-]+@[\w\.-]+', mail_message.sender)
            if user.email==sender_email[0]:
                print 'authorized'
                html_bodies = mail_message.bodies('text/html')
                email_body = ''
                additional_emails = ' '
                for content_type, body in html_bodies:
                    decoded_html = smart_str(body.decode())
                    email_body+=decoded_html
                    additional_emails+=' ' + smart_str(mail_message.to)
                    try:
                        additional_emails+=' ' + smart_str(mail_message.bcc)
                    except:
                        pass
                    try:
                        additional_emails+=' ' + smart_str(mail_message.cc)
                    except:
                        pass
                re_emails = re.findall(r'[\w\.-]+@[\w\.-]+', email_body + additional_emails)
                emails = list(set(re_emails))
                print 'emails'
                print emails
                for email in emails:
                    generic_prop = ndb.GenericProperty()
                    generic_prop._name = 'email'
                    nodes = Node.query(generic_prop==email).fetch()
                    if len(nodes)>0:
                        for node in nodes:
                            parents_edge_list = Edge.list(
                                                      start_node = node.key,
                                                      kind = 'parents'
                                                      )
                            for edge in parents_edge_list['items']:
                                parent_key = edge.end_node
                                  # insert a note related to the parent node
                                note_author = Userinfo()
                                note_author.display_name = user.google_display_name
                                note_author.photo = user.google_public_profile_photo_url
                                note = Note(
                                            owner = user.google_user_id,
                                            organization = user.organization,
                                            author = note_author,
                                            title = mail_message.subject,
                                            content = email_body
                                        )
                                entityKey_async = note.put_async()
                                entityKey = entityKey_async.get_result()
                                Edge.insert(
                                            start_node = parent_key,
                                            end_node = entityKey,
                                            kind = 'topics',
                                            inverse_edge = 'parents'
                                        )
                                EndpointsHelper.update_edge_indexes(
                                                                parent_key=entityKey,
                                                                kind='topics',
                                                                indexed_edge=str(parent_key.id())
                                                                )
                    else:
                        pass
                          # We should create a lead related to this email
                          # and attach this email with this lead
            else:
                print user
                print mail_message.sender
                print 'not authorized'

        else:
            print 'user doesnt exist'





app = webapp2.WSGIApplication([GetEmailsHandler.mapping()], debug=True)

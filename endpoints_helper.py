 #!/usr/bin/python
 # -*- coding: utf-8 -*-
import base64
from email.mime.audio import MIMEAudio
from email.mime.base import MIMEBase
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import mimetypes
import os
from django.utils.encoding import smart_str
from google.appengine.api import search
from google.appengine.api import memcache
from apiclient.discovery import build
from google.appengine.api import taskqueue
from apiclient import errors
import httplib2
import endpoints
# gdata
import atom.data
import gdata.data
import gdata.contacts.client
import gdata.contacts.data
from gdata.gauth import OAuth2Token
from gdata.contacts.client import ContactsClient
from model import User

from highrise.pyrise import Highrise, Person, Company, Deal, Task, Tag, Case


FOLDERS = {
            'Account': 'accounts_folder',
            'Contact': 'contacts_folder',
            'Lead': 'leads_folder',
            'Opportunity': 'opportunities_folder',
            'Case': 'cases_folder',
            'Show': 'shows_folder',
            'Feedback': 'feedbacks_folder'
        }

class OAuth2TokenFromCredentials(OAuth2Token):
    def __init__(self, credentials):
        self.credentials = credentials
        super(OAuth2TokenFromCredentials, self).__init__(None, None, None, None)
        self.UpdateFromCredentials()

    def UpdateFromCredentials(self):
        self.client_id = self.credentials.client_id
        self.client_secret = self.credentials.client_secret
        self.user_agent = self.credentials.user_agent
        self.token_uri = self.credentials.token_uri
        self.access_token = self.credentials.access_token
        self.refresh_token = self.credentials.refresh_token
        self.token_expiry = self.credentials.token_expiry
        self._invalid = self.credentials.invalid

    def generate_authorize_url(self, *args, **kwargs): raise NotImplementedError
    def get_access_token(self, *args, **kwargs): raise NotImplementedError
    def revoke(self, *args, **kwargs): raise NotImplementedError
    def _extract_tokens(self, *args, **kwargs): raise NotImplementedError
    def _refresh(self, unused_request):
        self.credentials._refresh(httplib2.Http().request)
        self.UpdateFromCredentials()

class EndpointsHelper():
    INVALID_TOKEN = 'Invalid token'
    INVALID_GRANT = 'Invalid grant'
    NO_ACCOUNT = 'You don\'t have a i/oGrow account'
    
    @classmethod
    def send_message(cls,service, user_id, message):
        """Send an email message.

        Args:
          service: Authorized Gmail API service instance.
          user_id: User's email address. The special value "me"
          can be used to indicate the authenticated user.
          message: Message to be sent.

        Returns:
          Sent Message.
        """
        try:
            message = (service.users().messages().send(userId=user_id, body=message)
                     .execute())
            print 'Message Id: %s' % message['id']
            return message
        except errors.HttpError, error:
            print 'An error occurred: %s' % error
    @classmethod
    def create_message(cls,sender, to,cc,bcc, subject, message_html):
        """Create a message for an email.

        Args:
          sender: Email address of the sender.
          to: Email address of the receiver.
          subject: The subject of the email message.
          message_text: The text of the email message.

        Returns:
          An object containing a base64 encoded email object.
        """
        message = MIMEText(smart_str(message_html),'html')
        message['to'] = to
        message['cc'] = cc
        message['bcc'] = bcc
        message['from'] = sender
        message['subject'] = subject
        return {'raw': base64.urlsafe_b64encode(message.as_string())}

    @classmethod
    def update_edge_indexes(cls,parent_key,kind,indexed_edge):
        parent = parent_key.get()
        empty_string = lambda x: x if x else ""
        search_index = search.Index(name="GlobalIndex")
        search_document = search_index.get(str( parent_key.id() ) )
        data = {}
        data['id'] = parent_key.id()
        if search_document:
            for e in search_document.fields:
                if e.name == kind:
                    indexed_edge = empty_string(e.value) + ' ' + str(indexed_edge)
                data[e.name] = e.value
        data[kind] = indexed_edge
        parent.put_index(data)

    @classmethod
    def delete_document_from_index(cls,id):
        search_index = search.Index(name="GlobalIndex")
        search_index.delete(str(id))

    @classmethod
    def require_iogrow_user(cls):
        user = endpoints.get_current_user()
        if user is None:
            raise endpoints.UnauthorizedException(cls.INVALID_TOKEN)
        email = user.email().lower()
        user_from_email = User.get_by_email(email)
        if user_from_email is None:
            raise endpoints.UnauthorizedException(cls.NO_ACCOUNT)
        return user_from_email

    @classmethod
    def insert_folder(cls, user, folder_name, kind):
        try:
            credentials = user.google_credentials
            http = credentials.authorize(httplib2.Http(memcache))
            service = build('drive', 'v2', http=http)
            organization = user.organization.get()

            # prepare params to insert
            folder_params = {
                        'title': folder_name,
                        'mimeType':  'application/vnd.google-apps.folder'
            }#get the accounts_folder or contacts_folder or ..
            parent_folder = eval('organization.'+FOLDERS[kind])
            if parent_folder:
                folder_params['parents'] = [{'id': parent_folder}]

            # execute files.insert and get resource_id
            created_folder = service.files().insert(body=folder_params,fields='id').execute()
        except:
            raise endpoints.UnauthorizedException(cls.INVALID_GRANT)
        return created_folder

    @classmethod
    def move_folder(cls, user, folder, new_kind):
            credentials = user.google_credentials
            http = credentials.authorize(httplib2.Http(memcache))
            service = build('drive', 'v2', http=http)
            organization = user.organization.get()
            new_parent = eval('organization.' + FOLDERS[new_kind])
            params = {
              "parents":
              [
                {
                  "id": new_parent
                }
              ]
            }
            moved_folder = service.files().patch(**{
                                                    "fileId": folder,
                                                    "body": params,
                                                    "fields": 'id'
                                                    }).execute()
            return moved_folder
    @classmethod
    def read_file(cls, service, drive_file):
            """Download a file's content.

            Args:
                service: Drive API service instance.
                drive_file: Drive File instance.

            Returns:
                File's content if successful, None otherwise.
            """
            download_url = drive_file.get('downloadUrl')
            if download_url:
                print '======Download file=========='
                resp, content = service._http.request(download_url)
                if resp.status == 200:
                    print 'Status: %s' % resp
                    return content.replace('\x00', '')
                else:
                    print 'An error occurred: %s' % resp
                    return None
            else:
                # The file doesn't have any content stored on Drive.
                return None
    @classmethod
    def import_file(cls, user, file_id):
        credentials = user.google_credentials
        http = credentials.authorize(httplib2.Http(memcache))
        service = build('drive', 'v2', http=http)
        try:
            drive_file = service.files().get(fileId=file_id).execute()
            return cls.read_file(service,drive_file)
        except errors.HttpError, error:
            print 'An error occurred: %s' % error
            return None

    @classmethod
    def create_contact_group(cls,credentials):
        auth_token = OAuth2TokenFromCredentials(credentials)
        gd_client = ContactsClient()
        auth_token.authorize(gd_client)
        new_group = gdata.contacts.data.GroupEntry(title=atom.data.Title(text='ioGrow Contacts'))
        created_group = gd_client.CreateGroup(new_group)
        return created_group.id.text

    @classmethod
    def create_contact(cls,credentials,google_contact_schema):
        auth_token = OAuth2TokenFromCredentials(credentials)
        gd_client = ContactsClient()
        auth_token.authorize(gd_client)
        contact_entry = gd_client.CreateContact(google_contact_schema)
        return contact_entry.id.text
    @classmethod
    def share_related_documents_after_patch(cls,user,old_obj,new_obj):

        # from private to access
        if old_obj.access=='private' and new_obj.access=='public':
            users = User.query(User.organization==user.organization)
            for collaborator in users:
                if collaborator.email != user.email:
                    taskqueue.add(
                                    url='/workers/shareobjectdocument',
                                    params={
                                            'email': collaborator.email,
                                            'obj_key_str': old_obj.key.urlsafe()
                                            }
                                )
        if hasattr(old_obj,'profile_img_id'):
            if old_obj.profile_img_id != new_obj.profile_img_id and new_obj.profile_img_id !="":
                taskqueue.add(
                                url='/workers/sharedocument',
                                params={
                                        'user_email':user.email,
                                        'access': 'anyone',
                                        'resource_id': new_obj.profile_img_id
                                        }
                            )
        if hasattr(old_obj,'logo_img_id'):
            if old_obj.logo_img_id != new_obj.logo_img_id and new_obj.logo_img_id !="":
                taskqueue.add(
                                url='/workers/sharedocument',
                                params={
                                        'user_email':user.email,
                                        'access': 'anyone',
                                        'resource_id': new_obj.logo_img_id
                                        }
                            )
    @classmethod
    def who_has_access(cls,obj_key):
        acl = {}
        obj = obj_key.get()
        owner_gid = obj.owner
        owner = User.get_by_gid(owner_gid)
        collaborators = []
        edge_list = iograph.Edge.list(start_node=obj_key,kind='permissions')
        for edge in edge_list['items']:
            collaborator = edge.end_node.get()
            if collaborator:
                collaborators.append(collaborator)
        acl['owner'] = owner
        acl['collaborators'] = collaborators
        return acl

    @classmethod
    def highrise_import_peoples(cls,request):
        people = Person.all()
        return people
    @classmethod
    def highrise_import_companies(cls, request):
        
        Highrise.set_server(request.server_name)
        Highrise.auth(request.key)
        companies=Company.all()
        return companies
    @classmethod
    def highrise_import_company_details(cls, company_id):
        companie=Company.get(company_id)
        return companie

    @classmethod
    def highrise_import_opportunities(cls):
        Deals=Deal.all()
        return Deals
    @classmethod
    def highrise_import_tasks(cls):
        print "seeee"
        Tasks=Task.all()
        return Tasks
    @classmethod
    def highrise_import_tags(cls, request):
        Tags=Tag.all()
        return Tags
    @classmethod
    def highrise_import_cases(cls):
        Cases=Case.all()
        return Cases
    @classmethod
    def highrise_import_notes_of_person(cls, id):
        person=Person.get(id)
        notes=person.notes
        return notes
    @classmethod
    def highrise_import_tags_of_person(cls, request):
        person=Person.get(request.id)
        tags=person.tags
        return tags
    @classmethod
    def highrise_import_tasks_of_person(cls, id):
        person=Person.get(id)
        tasks=person.tasks
        return tasks
    @classmethod
    def highrise_import_notes_of_company(cls, request):
        company=Company.get(request.id)
        notes=company.notes
        return notes
    @classmethod
    def highrise_import_tags_of_company(cls, request):
        company=Company.get(request.id)
        tags=company.tags
        return tags
    @classmethod
    def highrise_import_tasks_of_company(cls, request):
        company=Company.get(request.id)
        tasks=company.tasks
        return tasks


class scor_new_lead():
    def predict(predd,tedd) :
        user = User.get_by_email('hakim@iogrow.com')
        credentials=user.google_credentials
        http = credentials.authorize(httplib2.Http())
        service=build('prediction','v1.6',http=http)
        result=service.trainedmodels().predict(project='987765099891',id='7',body={'input':{'csvInstance':['Sofware Engineer','Purchase List']}}).execute()
        return result
 #!/usr/bin/python
 # -*- coding: utf-8 -*-
import mechanize
from bs4 import BeautifulSoup
import cookielib
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
# import iograph
from highrise.pyrise import Highrise, Person

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
    def highrise_import(cls,request):
        Highrise.set_server('iogrow3')
        Highrise.auth('eee33d458c7982242b99d4b7f6b1d94d')
        people = Person.all()
        return people
    @classmethod
    def get_people_linkedin(cls,entityKey):
        pass



class scor_new_lead():
    def predict(predd,tedd) :
        user = User.get_by_email('hakim@iogrow.com')
        credentials=user.google_credentials
        http = credentials.authorize(httplib2.Http())
        service=build('prediction','v1.6',http=http)
        result=service.trainedmodels().predict(project='987765099891',id='7',body={'input':{'csvInstance':['Sofware Engineer','Purchase List']}}).execute()
        return result
class linked_in():
    def __init__(self):
        # Browser
        print "init broweser"
        br = mechanize.Browser()

        # Cookie Jar
        cj = cookielib.LWPCookieJar()
        br.set_cookiejar(cj)

        # Browser options
        br.set_handle_equiv(True)
        br.set_handle_gzip(True)
        br.set_handle_redirect(True)
        br.set_handle_referer(True)
        br.set_handle_robots(False)

        # Follows refresh 0 but not hangs on refresh > 0
        br.set_handle_refresh(mechanize._http.HTTPRefreshProcessor(), max_time=1)

        # Want debugging messages?
        #br.set_debug_http(True)
        #br.set_debug_redirects(True)
        #br.set_debug_responses(True)

        # User-Agent (this is cheating, ok?)
        br.addheaders = [('User-agent', 'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.0.1) Gecko/2008071615 Fedora/3.0.1-1.fc9 Firefox/3.0.1')]
        self.browser=br
    def open_url(self,url,name):
        r=self.browser.open(url)
        self.browser.response().read()
        self.browser.select_form(nr=1)
        self.browser.form['q']=name
        self.browser.submit()
        self.browser.response().read()
        link= self.browser.links(url_regex="linkedin")
        links=[l for l in link]
        if links : return self.browser.follow_link(links[0]).read()
    def get_profile_header(self,soup,person):
        # ***************************head***************************
        member_head=soup.find('div',{'id':'member-1'})
        full_name=member_head.find('span',{'class':'full-name'})
        given_name=full_name.find('span',{'class':'given-name'})
        family_name=full_name.find('span',{'class':'family-name'})
        person["given_name"]=given_name.text
        person["family_name"]=family_name.text
        # *******************************************************
        industry=member_head.find('dd',{'class':'industry'})
        if industry: person["industry"]=industry.text
        else : person["industry"]=''
        # ******************************************************
        locality=member_head.find('span',{'class':'locality'})
        if locality: person['locality']=locality.text
        else : person['locality']=''
        # ----------------------------------------------------
        headline=member_head.find('p',{'class':'headline-title title'})
        if headline:person['headline']=headline.text
        else : person['headline']=''
        #**********************************************************

        overview=soup.find('dl',{'id':'overview'})
        current_post=overview.find('dd',{'class':'summary-current'})
        # ---------------------------------------------------------
        tab=[]
        if current_post:
            for post in current_post.findAll('li'):
                tab.append(post.text.replace('\n',' '))
        person['current_post']=tab
        # ------------------------------------------------------------
        tab=[]
        past_post=overview.find('dd',{'class':'summary-past'})
        if past_post:
            for post in past_post.findAll('li'):
                tab.append(post.text.replace('\n',' '))
        person['past_post']=tab
        # ------------------------------------------------------------
        tab=[]
        formation=overview.find('dd',{'class':'summary-education'})
        if formation:
            for post in formation.findAll('li'):
                tab.append(post.text.replace('\n',' '))
        person['formation']=tab
        # -------------------------------------------------------------
        tab=[]
        formation=overview.find('dd',{'class':'websites'})
        if formation:
            for post in formation.findAll('li'):
                tab.append('www.linkedin.com'+post.a.get('href'))
        person['websites']=tab
        # -------------------------------------------------------------
        relation=overview.find('dd',{'class':'overview-connections'})
        r=None
        if relation:
            r=relation.p.strong.text
        person['relation']=r
    def get_exprience(self,soup):
        expriences={}
        exp={}
        profile_experience=soup.find('div',{'id':'profile-experience'})
        current_exprience=profile_experience.findAll('div',{'class':'position  first experience vevent vcard summary-current'})
        tab=[]
        if current_exprience:
            for ce in current_exprience:
                a=ce.find('span',{'class':'title'})
                if a: exp['title']=a.text
                a=ce.find('p',{'class':'period'})
                if a: exp['period']=a.text
                a=ce.find('span',{'class':'org summary'})
                if a: exp['organisation']=a.text
                a=ce.find('p',{'class':' description current-position'})
                if a: exp['description']=a.text
                tab.append(exp)
        expriences['current_exprience']=tab
        tab=[]
        exp={}
        past_exprience=profile_experience.findAll('div',{'class':'position   experience vevent vcard summary-past'})
        if past_exprience:
            for pe in past_exprience:
                a=pe.find('span',{'class':'title'})
                if a : exp['title']=a.text
                a=pe.find('p',{'class':'period'})
                if a : exp['period']=a.text
                a=pe.find('span',{'class':'org summary'})
                if a : exp['organisation']=a.text
                a=pe.find('p',{'class':' description past-position'})
                if a : exp['description']=a.text
                if a : tab.append(exp)
        expriences['past_exprience']=tab
        return expriences
    def get_resume(self,soup):
        resume_soup=soup.find('div',{'id':"profile-summary"})
        if resume_soup :
            resume=resume_soup.find('div',{'class':"content"})
            if  resume:return resume.text
    def get_certification(self,soup):
        certifications=[]
        certification={}
        certification_soup=soup.find('div',{'id':"profile-certifications"})
        if certification_soup :
            certif_soup=certification_soup.findAll('li',{'class':'certification'})
            if certif_soup:
                for c in certif_soup :
                    certification={}
                    certification['name']=c.h3.text
                    specific_soup=c.findAll('li')
                    tab=[]
                    if specific_soup: 
                        for sp in specific_soup:
                            tab.append(sp.text)
                        certification['specifics']=tab
                    certifications.append(certification)
        return certifications
    def get_skills (self,soup):
        tab=[]
        skills_soup=soup.find('div',{'id':"profile-skills"})
        if skills_soup:
            list_soup=skills_soup.findAll('li',{'class':'competency show-bean  '})
            if list_soup :
                for s in list_soup:
                    tab.append(s.text.replace('\n',''))
        return tab
        # print skills_soup
        # print current_exprience
    def scrape_linkedin(self,url,name):
        person={}
        html= self.open_url(url, name)
        if html:
            soup=BeautifulSoup(html)
            self.get_profile_header(soup,person)
            person['experiences']=self.get_exprience(soup)
            person['resume']=self.get_resume(soup)
            person['certifications']=self.get_certification(soup)
            person['skills']=self.get_skills(soup)

        print person
        return person

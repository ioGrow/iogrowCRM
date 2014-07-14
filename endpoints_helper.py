 #!/usr/bin/python
 # -*- coding: utf-8 -*-
from google.appengine.api import search
from google.appengine.api import memcache
from apiclient.discovery import build
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
                    print 'something before'
                    indexed_edge = empty_string(e.value) + ' ' + str(indexed_edge)
                    print 'something after'
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
    def highrise_import(cls,request):
        Highrise.set_server('iogrow3')
        Highrise.auth('eee33d458c7982242b99d4b7f6b1d94d')
        people = Person.all()
        return people



class scor_new_lead():
    def predict(predd,tedd) :
        user = User.get_by_email('hakim@iogrow.com')
        credentials=user.google_credentials
        http = credentials.authorize(httplib2.Http())
        service=build('prediction','v1.6',http=http)
        result=service.trainedmodels().predict(project='987765099891',id='7',body={'input':{'csvInstance':['Sofware Engineer','Purchase List']}}).execute()
        return result
class scrapy_linkedin:
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
        return self.browser.follow_link(links[0]).read()
    def scrape_linkedin(self,url,name):
        person={}
        html= self.open_url(url, name)
        soup=BeautifulSoup(html)
        # ******************************************************
        full_name=soup.find('span',{'class':'full-name'})
        given_name=full_name.find('span',{'class':'given-name'})
        family_name=full_name.find('span',{'class':'family-name'})
        person["given_name"]=given_name.text
        person["family_name"]=family_name.text
        # *******************************************************
        industry=soup.find('dd',{'class':'industry'}).text
        person["industry"]=industry
        # ******************************************************
        locality=soup.find('span',{'class':'locality'})
        person['locality']=locality.text
        # ----------------------------------------------------

        overview=soup.find('dl',{'id':'overview'})
        print overview
        print person

# !/usr/bin/python
# -*- coding: utf-8 -*-

import base64
import mimetypes
import os
from django.utils.encoding import smart_str
from email.mime.audio import MIMEAudio
from email.mime.base import MIMEBase
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import endpoints
import httplib2
from apiclient import errors
from apiclient.discovery import build
from google.appengine.api import memcache
from google.appengine.api import search
from google.appengine.api import taskqueue
from google.appengine.api import urlfetch

import atom.data
import gdata.data
import gdata.contacts.client
import gdata.contacts.data
from gdata.gauth import OAuth2Token
from gdata.contacts.client import ContactsClient
from model import User, Tokens
import iograph
from pyrise import Highrise, Person, Company, Deal, Task, Tag, Case
import tweepy as tweepy
from iomessages import TwitterProfileSchema, EmailSchema, AddressSchema, PhoneSchema
import time
import json
from google.appengine.api import app_identity
import cloudstorage as gcs

TOKEN_INFO_ENDPOINT = ('https://www.googleapis.com/oauth2/v1/tokeninfo' +
                       '?access_token=%s')

FOLDERS = {
    'Account': 'accounts_folder',
    'Contact': 'contacts_folder',
    'Lead': 'leads_folder',
    'Opportunity': 'opportunities_folder',
    'Case': 'cases_folder',
    'Show': 'shows_folder',
    'Feedback': 'feedbacks_folder'
}
_SAVED_TOKEN_DICT = {}


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


class EndpointsHelper:
    def __init__(self):
        pass

    INVALID_TOKEN = 'Invalid token'
    INVALID_GRANT = 'Invalid grant'
    NO_ACCOUNT = 'You don\'t have a i/oGrow account'

    @classmethod
    def create_gs_file(cls, file_name, csv):
        """Create a file.

        The retry_params specified in the open call will override the default
        retry params for this particular file handle.

        Args:
          filename: filename.
        """
        bucket_name = app_identity.get_default_gcs_bucket_name()
        bucket = '/' + bucket_name
        filename = bucket + '/' + file_name
        write_retry_params = gcs.RetryParams(backoff_factor=1.1)
        gcs_file = gcs.open(filename,
                            'w',
                            content_type='text/csv',
                            retry_params=write_retry_params)
        gcs_file.write(csv)
        gcs_file.close()

    @classmethod
    def send_message(cls, service, user_id, message):
        """Send an email message.

        Args:
          service: Authorized Gmail API service instance.
          user_id: User's email address. The special value "me"
          can be used to indicate the authenticated user.
          message: Message to be sent.

        Returns:
          Sent Message.
        """

        message = (service.users().messages().send(userId=user_id, body=message)
                   .execute())
        return message

    @classmethod
    def create_message(cls, sender, to, cc, bcc, subject, message_html):
        """Create a message for an email.

        Args:
          sender: Email address of the sender.
          to: Email address of the receiver.
          subject: The subject of the email message.
          message_text: The text of the email message.

        Returns:
          An object containing a base64 encoded email object.
        """
        message_html += '<p>Sent from my <a href="http://goo.gl/a5S8xZ">ioGrow account </a></p>'
        message = MIMEText(smart_str(message_html), 'html')
        message['to'] = to
        message['cc'] = cc
        message['bcc'] = bcc
        message['from'] = sender
        message['subject'] = subject
        return {'raw': base64.urlsafe_b64encode(message.as_string())}

    @classmethod
    def create_message_with_attachments(cls, user, sender, to, cc, bcc, subject, message_html, files):
        """Create a message for an email.
          Args:
            sender: Email address of the sender.
            to: Email address of the receiver.
            subject: The subject of the email message.
            message_text: The text of the email message.
            file_dir: The directory containing the file to be attached.
            filename: The name of the file to be attached.

          Returns:
            An object containing a base64 encoded email object.
        """
        message = MIMEMultipart()
        message['to'] = to
        message['cc'] = cc
        message['bcc'] = bcc
        message['from'] = sender
        message['subject'] = subject
        message_html += '<p>Sent from my <a href="http://goo.gl/a5S8xZ">ioGrow account </a></p>'
        msg = MIMEText(smart_str(message_html), 'html')
        message.attach(msg)
        for file_id in files:
            file_data = cls.get_file_from_drive(user, file_id)
            content_type = file_data['content_type']
            if content_type is None:
                content_type = 'application/octet-stream'
            main_type, sub_type = content_type.split('/', 1)
            if main_type == 'text':
                msg = MIMEText(file_data['content'], _subtype=sub_type)
            elif main_type == 'image':
                msg = MIMEImage(file_data['content'], _subtype=sub_type)
            elif main_type == 'audio':
                msg = MIMEAudio(file_data['content'], _subtype=sub_type)
            else:
                msg = MIMEBase(main_type, sub_type)
                msg.set_payload(file_data['content'])
            msg.add_header('Content-Disposition', 'attachment', filename=file_data['file_name'])
            message.attach(msg)

        return {'raw': base64.urlsafe_b64encode(message.as_string())}

    @classmethod
    def create_message_with_attchments_local_files(cls, sender, to, cc, bcc, subject, message_html):
        message = MIMEMultipart()
        message['to'] = to
        message['cc'] = cc
        message['bcc'] = bcc
        message['from'] = sender
        message['subject'] = subject
        message_html += '<p>Sent from my <a href="http://goo.gl/a5S8xZ">ioGrow account </a></p>'
        msg = MIMEText(smart_str(message_html), 'html')
        message.attach(msg)
        path = os.path.join('static/src/img/mail_images', 'sm-iogrow-true.png')
        content_type, encoding = mimetypes.guess_type(path)
        path2 = os.path.join('static/src/img/mail_images', 'Logo-iogrow.png')
        content_type2, encoding2 = mimetypes.guess_type(path2)
        main_type, sub_type = content_type.split('/', 1)
        main_type2, sub_type2 = content_type2.split('/', 1)

        if main_type == 'image':
            fp = open(path, 'rb')
            msg = MIMEImage(fp.read(), _subtype=sub_type)
            fp.close()
        if main_type2 == 'image':
            fp2 = open(path2, 'rb')
            msg2 = MIMEImage(fp2.read(), _subtype=sub_type)
            fp2.close()
        msg.add_header('Content-Disposition', 'attachment', filename="logo")
        msg.add_header("Content-ID", "<logo_cid>")
        message.attach(msg)
        msg2.add_header('Content-Disposition', 'attachment', filename="user")
        msg2.add_header("Content-ID", "<user_cid>")
        message.attach(msg2)
        return {'raw': base64.urlsafe_b64encode(message.as_string())}

    @classmethod
    def update_edge_indexes(cls, parent_key, kind, indexed_edge):
        try:
            parent = parent_key.get()
            if parent:
                empty_string = lambda x: smart_str(x) if x else ""
                search_index = search.Index(name="GlobalIndex")
                search_document = search_index.get(str(parent_key.id()))
                data = {'id': parent_key.id()}
                if search_document:
                    for e in search_document.fields:
                        if e.name == kind:
                            if isinstance(indexed_edge, basestring):
                                indexed_edge = '%s %s' % (empty_string(e.value), indexed_edge)
                            else:
                                indexed_edge = '%s %s' % (empty_string(e.value), str(indexed_edge))
                        data[e.name] = e.value
                data[kind] = indexed_edge
                parent.put_index(data)
        except:
            print 'ERROR: an error had occurred when updating edges index'

    @classmethod
    def delete_edge_indexes(cls, parent_key, kind, indexed_edge):
        parent = parent_key.get()
        empty_string = lambda x: x if x else ""
        search_index = search.Index(name="GlobalIndex")
        search_document = search_index.get(str(parent_key.id()))
        data = {'id': parent_key.id()}
        if search_document:
            for e in search_document.fields:
                if e.name == kind:
                    indexed_edge = empty_string(e.value).replace(str(indexed_edge), '')
                data[e.name] = e.value
        data[kind] = indexed_edge
        parent.put_index(data)

    @classmethod
    def get_data_from_index(cls, id):
        search_index = search.Index(name="GlobalIndex")
        search_document = search_index.get(id)
        data = {'id': id}
        if search_document:
            for e in search_document.fields:
                data[e.name] = e.value
        return data

    @classmethod
    def delete_document_from_index(cls, id):
        search_index = search.Index(name="GlobalIndex")
        search_index.delete(str(id))

    @classmethod
    def _get_user_id_from_id_token(cls, jwt):
        """Attempts to get Google+ User ID from ID Token.

           First calls endpoints.get_current_user() to assure there is a valid user.
          If it has already been called, there will be environment variables set
          so this will be a low-cost call (no network overhead).

          After this, we know the JWT is valid and can simply parse a value from it.

          Args:
            jwt: String, containing the JSON web token which acts as the ID Token.

          Returns:
            String containing the Google+ user ID or None if it can't be determined
              from the JWT.
        """
        segments = jwt.split('.')
        json_body = endpoints.users_id_token._urlsafe_b64decode(segments[1])
        try:
            parsed = json.loads(json_body)
            return parsed.get('sub')
        except:
            pass

    @classmethod
    def get_token_info(cls, token):
        """Get the token information from Google for the given credentials."""
        url = (TOKEN_INFO_ENDPOINT
               % token)
        return urlfetch.fetch(url)

    @classmethod
    def require_iogrow_user(cls, action=None):
        token = endpoints.users_id_token._get_token(None)
        token_stored = Tokens.query(Tokens.token == token).get()
        if token_stored:
            return token_stored.user.get()
        token = endpoints.users_id_token._get_token(None)
        # will get the token info from the dict
        token_info = _SAVED_TOKEN_DICT.get(token)
        if token_info is None:
            # will get the token info from network
            result = cls.get_token_info(token)
            if result.status_code != 200:
                raise endpoints.UnauthorizedException(cls.INVALID_TOKEN)
            token_info = json.loads(result.content)
            _SAVED_TOKEN_DICT[token] = token_info
        if 'email' not in token_info:
            raise endpoints.UnauthorizedException(cls.INVALID_TOKEN)
        email = token_info['email']
        user_from_email = User.get_by_email(email)
        if user_from_email is None:
            raise endpoints.UnauthorizedException(cls.NO_ACCOUNT)
        store_new_token = Tokens(token=token, user=user_from_email.key, email=user_from_email.email)
        store_new_token.put()

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
                'mimeType': 'application/vnd.google-apps.folder'
            }  # get the accounts_folder or contacts_folder or ..
            parent_folder = eval('organization.' + FOLDERS[kind])
            if parent_folder:
                folder_params['parents'] = [{'id': parent_folder}]

            # execute files.insert and get resource_id
            created_folder = service.files().insert(body=folder_params, fields='id').execute()
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
            resp, content = service._http.request(download_url)
            if resp.status == 200:
                return content.replace('\x00', '')
            else:
                print 'ERROR: an error occurred: %s' % resp
                return None
        else:
            # The file doesn't have any content stored on Drive.
            return None

    @classmethod
    def import_file(cls, user, file_id):
        credentials = user.google_credentials
        http = credentials.authorize(httplib2.Http())
        service = build('drive', 'v2', http=http)
        try:
            drive_file = service.files().get(fileId=file_id).execute()
            return cls.read_file(service, drive_file)
        except errors.HttpError, error:
            print 'ERROR: An error occurred: %s' % error
            raise endpoints.UnauthorizedException(cls.INVALID_GRANT)

    @classmethod
    def get_file_from_drive(cls, user, file_id):
        credentials = user.google_credentials
        http = credentials.authorize(httplib2.Http())
        service = build('drive', 'v2', http=http)
        try:
            drive_file = service.files().get(fileId=file_id).execute()
            file_data = {
                'content_type': drive_file.get('mimeType'),
                'file_name': drive_file.get('title')
            }
            download_url = drive_file.get('downloadUrl')
            if download_url:
                resp, content = service._http.request(download_url)
                if resp.status == 200:
                    file_data['content'] = content
                else:
                    print 'ERROR: An error occurred: %s' % resp
                    raise endpoints.UnauthorizedException(cls.INVALID_GRANT)
            return file_data
        except errors.HttpError, error:
            print 'ERROR: An error occurred: %s' % error
            raise endpoints.UnauthorizedException(cls.INVALID_GRANT)

    @classmethod
    def create_contact_group(cls, credentials):
        auth_token = OAuth2TokenFromCredentials(credentials)
        gd_client = ContactsClient()
        auth_token.authorize(gd_client)
        new_group = gdata.contacts.data.GroupEntry(title=atom.data.Title(text='ioGrow Contacts'))
        created_group = gd_client.CreateGroup(new_group)
        return created_group.id.text

    @classmethod
    def list_google_contacts(cls, credentials):
        auth_token = OAuth2TokenFromCredentials(credentials)
        gd_client = ContactsClient()
        auth_token.authorize(gd_client)
        query = gdata.contacts.client.ContactsQuery()
        query.max_results = 10
        feed = gd_client.GetContacts(q=query)
        for i, entry in enumerate(feed.entry):
            if entry.name:
                print '\n%s %s' % (i + 1, smart_str(entry.name.full_name.text))
            try:
                contact_image = gd_client.GetPhoto(entry)
            except:
                print 'ERROR: not found'

    @classmethod
    def create_contact(cls, credentials, google_contact_schema):
        auth_token = OAuth2TokenFromCredentials(credentials)
        gd_client = ContactsClient()
        auth_token.authorize(gd_client)
        contact_entry = gd_client.CreateContact(google_contact_schema)
        return contact_entry.id.text

    @classmethod
    def share_related_documents_after_patch(cls, user, old_obj, new_obj):

        # from private to access
        if old_obj.access == 'private' and new_obj.access == 'public':
            users = User.query(User.organization == user.organization)
            for collaborator in users:
                if collaborator.email != user.email:
                    taskqueue.add(
                        url='/workers/shareobjectdocument',
                        queue_name='iogrow-low',
                        params={
                            'email': collaborator.email,
                            'obj_key_str': old_obj.key.urlsafe()
                        }
                    )
        if hasattr(old_obj, 'profile_img_id'):
            if old_obj.profile_img_id != new_obj.profile_img_id and new_obj.profile_img_id != "":
                taskqueue.add(
                    url='/workers/sharedocument',
                    queue_name='iogrow-low',
                    params={
                        'user_email': user.email,
                        'access': 'anyone',
                        'resource_id': new_obj.profile_img_id
                    }
                )
        if hasattr(old_obj, 'logo_img_id'):
            if old_obj.logo_img_id != new_obj.logo_img_id and new_obj.logo_img_id != "":
                taskqueue.add(
                    url='/workers/sharedocument',
                    queue_name='iogrow-low',
                    params={
                        'user_email': user.email,
                        'access': 'anyone',
                        'resource_id': new_obj.logo_img_id
                    }
                )

    @classmethod
    def who_has_access(cls, obj_key):
        acl = {}
        obj = obj_key.get()
        owner_gid = obj.owner
        owner = User.get_by_gid(owner_gid)
        collaborators = []
        edge_list = iograph.Edge.list(start_node=obj_key, kind='permissions')
        for edge in edge_list['items']:
            collaborator = edge.end_node.get()
            if collaborator:
                collaborators.append(collaborator)
        acl['owner'] = owner
        acl['collaborators'] = collaborators
        return acl

    @classmethod
    def highrise_import_peoples(cls, request):
        people = Person.all()
        return people

    @classmethod
    def highrise_import_companies(cls, request):

        Highrise.set_server(request.server_name)
        Highrise.auth(request.key)
        companies = Company.all()
        return companies

    @classmethod
    def highrise_import_company_details(cls, company_id):
        companie = Company.get(company_id)
        return companie

    @classmethod
    def highrise_import_opportunities(cls):
        Deals = Deal.all()
        return Deals

    @classmethod
    def highrise_import_tasks(cls):
        Tasks = Task.all()
        return Tasks

    @classmethod
    def highrise_import_tags(cls, request):
        Tags = Tag.all()
        return Tags

    @classmethod
    def highrise_import_cases(cls):
        Cases = Case.all()
        return Cases

    @classmethod
    def highrise_import_notes_of_person(cls, id):
        person = Person.get(id)
        notes = person.notes
        return notes

    @classmethod
    def highrise_import_tags_of_person(cls, request):
        person = Person.get(request.id)
        tags = person.tags
        return tags

    @classmethod
    def highrise_import_tasks_of_person(cls, id):
        person = Person.get(id)
        tasks = person.tasks
        return tasks

    @classmethod
    def highrise_import_notes_of_company(cls, request):
        company = Company.get(request.id)
        notes = company.notes
        return notes

    @classmethod
    def highrise_import_tags_of_company(cls, request):
        company = Company.get(request.id)
        tags = company.tags
        return tags

    @classmethod
    def highrise_import_tasks_of_company(cls, request):
        company = Company.get(request.id)
        tasks = company.tasks
        return tasks

    @classmethod
    def twitter_import_people(cls, screen_name):
        credentials = {
            'consumer_key': 'vk9ivGoO3YZja5bsMUTQ',
            'consumer_secret': 't2mSb7zu3tu1FyQ9s3M4GOIl0PfwHC7CTGDcOuSZzZ4',
            'access_token_key': '1157418127-gU3bUzLK0MgTA9pzWvgMpwD6E0R4Wi1dWp8FV9W',
            'access_token_secret': 'k8C5jEYh4F4Ej2C4kDasHWx61ZWPzi9MgzpbNCevoCwSH'
        }
        auth = tweepy.OAuthHandler(credentials['consumer_key'], credentials['consumer_secret'])
        auth.set_access_token(credentials['access_token_key'], credentials['access_token_secret'])
        api = tweepy.API(auth)
        user = api.get_user(screen_name=screen_name)
        profile_schema = TwitterProfileSchema(
        )
        if 'location' in user.__dict__:
            profile_schema.location = user.location
        if 'last_tweet_retweeted' in user.__dict__:
            profile_schema.last_tweet_retweeted = user.last_tweet_retweeted
        if 'url' in user.__dict__:
            profile_schema.url_of_user_their_company = user.url
        if 'screen_name' in user.__dict__:
            profile_schema.screen_name = user.screen_name
        if 'name' in user.__dict__:
            profile_schema.name = user.name
        if 'followers_count' in user.__dict__:
            profile_schema.followers_count = user.followers_count
        if 'friends_count' in user.__dict__:
            profile_schema.friends_count = user.friends_count

        if 'description' in user.__dict__:
            profile_schema.description_of_user = user.description
        if 'lang' in user.__dict__:
            profile_schema.lang = user.lang
        if 'statuses_count' in user.__dict__:
            profile_schema.nbr_tweets = user.statuses_count
        if 'created_at' in user.__dict__:
            profile_schema.created_at = user.created_at.strftime("%Y-%m-%dT%H:%M:00.000")
        if 'lang' in user.__dict__:
            profile_schema.language = user.lang
        if 'status' in user.__dict__:
            if 'retweet_count' in user.status.__dict__:
                profile_schema.last_tweet_retweet_count = user.status.retweet_count
            if 'favorite_count' in user.status.__dict__:
                profile_schema.last_tweet_favorite_count = user.status.favorite_count
            if 'text' in user.status.__dict__:
                profile_schema.last_tweet_text = user.status.text
        if 'profile_image_url_https' in user.__dict__:
            profile_schema.profile_image_url_https = user.profile_image_url_https
        if 'id' in user.__dict__:
            profile_schema.id = user.id
        if 'profile_banner_url' in user.__dict__:
            profile_schema.profile_banner_url = user.profile_banner_url

        return profile_schema


    @classmethod
    def import_addresses_from_outlook(cls, row):
        empty_string = lambda x: x if x else ""
        addresses = []
        for index in [24, 25, 26]:
            if row[index]:
                addresses.append(AddressSchema(
                    street=empty_string(unicode(row[index], errors='ignore')),
                    city=empty_string(unicode(row[28], errors='ignore')),
                    state=empty_string(unicode(row[29], errors='ignore')),
                    postal_code=empty_string(unicode(row[30], errors='ignore')),
                    country=empty_string(unicode(row[31], errors='ignore')),

                ))
        for index in [50, 51, 52]:
            if row[index]:
                addresses.append(AddressSchema(
                    street=empty_string(unicode(row[index], errors='ignore')),
                    city=empty_string(unicode(row[54], errors='ignore')),
                    state=empty_string(unicode(row[55], errors='ignore')),
                    postal_code=empty_string(unicode(row[56], errors='ignore')),
                    country=empty_string(unicode(row[57], errors='ignore')),

                ))
        return addresses

    @classmethod
    def import_emails_from_outlook(cls, row):
        emails = []
        indexes = [14, 15, 16]
        for key in indexes:
            if row[key]:
                emails.append(EmailSchema(email=row[key]))
        return emails

    @classmethod
    def import_phones_from_outlook(cls, row):
        phones = []
        work_phones_indexes = [17, 38, 39, 41]
        for index in work_phones_indexes:
            if row[index]:
                phones.append(PhoneSchema(
                    type='work',
                    number=unicode(row[index], errors='ignore')
                )
                )
        fax_indexes = [22, 40]
        for index in fax_indexes:
            if row[index]:
                phones.append(PhoneSchema(
                    type='fax',
                    number=unicode(row[index], errors='ignore')
                )
                )
        home_phones_indexes = [18, 19]
        for index in home_phones_indexes:
            if row[index]:
                phones.append(PhoneSchema(
                    type='home',
                    number=unicode(row[index], errors='ignore')
                )
                )
        if row[20]:
            phones.append(PhoneSchema(
                type='mobile',
                number=unicode(row[20], errors='ignore')
            )
            )
        return phones


class scor_new_lead:
    def __init__(self):
        pass

    def predict(predd, tedd):
        user = User.get_by_email('hakim@iogrow.com')
        credentials = user.google_credentials
        http = credentials.authorize(httplib2.Http())
        service = build('prediction', 'v1.6', http=http)
        result = service.trainedmodels().predict(project='935370948155-qm0tjs62kagtik11jt10n9j7vbguok9d', id='7', body={
            'input': {'csvInstance': ['Sofware Engineer', 'Purchase List']}}).execute()
        return result

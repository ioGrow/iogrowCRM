import endpoints
from google.appengine.ext import ndb
from protorpc import remote
from endpoints_proto_datastore.ndb import EndpointsAliasProperty
from endpoints_proto_datastore.ndb import EndpointsModel
from iomodels.crmengine.accounts import Account
from iomodels.crmengine.contacts import Contact
from iomodels.crmengine.campaigns import Campaign
from iomodels.crmengine.notes import Note,Topic
from iomodels.crmengine.tasks import Task
from iomodels.crmengine.events import Event
from iomodels.crmengine.shows import Show
from model import User,Group,Member
import model
import auth_util
from google.appengine.api import mail
import httplib2
from apiclient.discovery import build
from apiclient import errors
from protorpc import messages
from protorpc import message_types


# The ID of javascript client authorized to access to our api
# This client_id could be generated on the Google API console
CLIENT_ID = '330861492018.apps.googleusercontent.com'
SCOPES = ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/drive']


class SearchRequest(messages.Message):
    """Greeting that stores a message."""
    q = messages.StringField(1)

class SearchResult(messages.Message):
    """Greeting that stores a message."""
    id = messages.StringField(1)
    title = messages.StringField(2)
    kind = messages.StringField(3)


class SearchResults(messages.Message):
    """Collection of Greetings."""
    items = messages.MessageField(SearchResult, 1, repeated=True)


TEST_RESULTS = SearchResults(items=[
    SearchResult(id='2358',title='Goolge',kind='Account'),
    SearchResult(id='9852',title='Assem Chelli',kind='Contact'),

])

@endpoints.api(name='crmengine', version='v1', description='I/Ogrow CRM APIs',allowed_client_ids=[CLIENT_ID,
                                   endpoints.API_EXPLORER_CLIENT_ID],scopes=SCOPES)
class CrmEngineApi(remote.Service):
  
  @staticmethod
  def init_drive_folder(credentials,folder_name,parent=None):
      """Return the public Google+ profile data for the given user."""
      http = httplib2.Http()
      driveservice = build('drive', 'v2', http=http)
      print credentials
      credentials.authorize(http)

      folder = {
                'title': folder_name,
                'mimeType': 'application/vnd.google-apps.folder'          
      }
      if parent:
        folder['parents'] = [{'id': parent}]
      try:
        created_folder = driveservice.files().insert(body=folder).execute()
        return created_folder['id']
      except errors.HttpError, error:
        print 'An error occured: %s' % error
        return None
  
  # TEDJ_29_10_write annotation to reference wich model for example @Account to refernce Account model
  @Contact.method(user_required=True,path='contacts', http_method='POST', name='contacts.insert')
  def ContactInsert(self, my_model):

    # Here, since the schema includes an ID, it is possible that the entity
    # my_model has an ID, hence we could be specifying a new ID in the datastore
    # or overwriting an existing entity. If no ID is included in the ProtoRPC
    # request, then no key will be set in the model and the ID will be set after
    # the put completes, as in basic/main.py.

    # In either case, the datastore ID from the entity will be returned in the
    # ProtoRPC response message.
    
    user = endpoints.get_current_user()
    if user is None:
        raise endpoints.UnauthorizedException('You must authenticate!' )
    user_from_email = model.User.query(model.User.email == user.email()).get()
    if user_from_email is None:
      raise endpoints.UnauthorizedException('You must sign-in!' )
    # Todo: Check permissions
    my_model.owner = user_from_email.key
    my_model.put()
    return my_model



         
  @Contact.method(request_fields=('id',),
                  path='contacts/{id}', http_method='GET', name='contacts.get')
  def ContactGet(self, my_model):
    # Since the field "id" is included, when it is set from the ProtoRPC
    # message, the decorator attempts to retrieve the entity by its ID. If the
    # entity was retrieved, the boolean from_datastore on the entity will be
    # True, otherwise it will be False. In this case, if the entity we attempted
    # to retrieve was not found, we return an HTTP 404 Not Found.

    # For more details on the behavior of setting "id", see the sample
    # custom_alias_properties/main.py.
    if not my_model.from_datastore:
      raise endpoints.NotFoundException('Contact not found.')
    return my_model

  # This is identical to the example in basic/main.py, however since the
  # ProtoRPC schema for the model now includes "id", all the values in "items"
  # will also contain an "id".
 
  @Contact.query_method(user_required=True,query_fields=('limit', 'order', 'pageToken'),path='contacts', name='contacts.list')
  def ContactList(self, query):
    return query

  @Account.method(user_required=True,path='accounts', http_method='POST', name='accounts.insert')
  def AccountInsert(self, my_model):

    
    
    user = endpoints.get_current_user()
    if user is None:
        raise endpoints.UnauthorizedException('You must authenticate!' )
    user_from_email = model.User.query(model.User.email == user.email()).get()
    if user_from_email is None:
      raise endpoints.UnauthorizedException('You must sign-in!' )
    # Todo: Check permissions
    my_model.owner = user_from_email.key
    # get the accounts folder id 
    organization = user_from_email.organization.get()
    all_accounts_folder = organization.accounts_folder
    # init folder for this account
    credentials = user_from_email.google_credentials

    drive_folder = self.init_drive_folder(credentials,my_model.name,all_accounts_folder)
    my_model.drive_folder = drive_folder


    my_model.put()
    return my_model

  @Account.method(request_fields=('id',),path='accounts/{id}', http_method='GET', name='accounts.get')
  def AccountGet(self, my_model):
    if not my_model.from_datastore:
      raise endpoints.NotFoundException('Account not found.')
    return my_model

  @Account.query_method(user_required=True,query_fields=('limit', 'order', 'pageToken'),path='accounts', name='accounts.list')
  def AccountList(self, query):
    return query







  


  ##############################Notes API##################################""""
  @Note.method(user_required=True,path='notes', http_method='POST', name='notes.insert')
  def NoteInsert(self, my_model):

    # Here, since the schema includes an ID, it is possible that the entity
    # my_model has an ID, hence we could be specifying a new ID in the datastore
    # or overwriting an existing entity. If no ID is included in the ProtoRPC
    # request, then no key will be set in the model and the ID will be set after
    # the put completes, as in basic/main.py.

    # In either case, the datastore ID from the entity will be returned in the
    # ProtoRPC response message.



    
    user = endpoints.get_current_user()
    if user is None:
        raise endpoints.UnauthorizedException('You must authenticate!' )
    user_from_email = model.User.query(model.User.email == user.email()).get()
    if user_from_email is None:
      raise endpoints.UnauthorizedException('You must sign-in!' )
    # Todo: Check permissions
    note_author = model.User()
    note_author.google_display_name = user_from_email.google_display_name
    my_model.author = note_author
    my_model.put()
    

    return my_model

  ################################ Topic API ##################################
  @Topic.query_method(user_required=True,query_fields=('about_kind','about_item', 'limit', 'order', 'pageToken'),path='topics', name='topics.list')
  def TopicList(self, query):
    
    return query

  ################################ Tasks API ##################################
  @Task.method(user_required=True,path='tasks', http_method='POST', name='tasks.insert')
  def TaskInsert(self, my_model):

    # Here, since the schema includes an ID, it is possible that the entity
    # my_model has an ID, hence we could be specifying a new ID in the datastore
    # or overwriting an existing entity. If no ID is included in the ProtoRPC
    # request, then no key will be set in the model and the ID will be set after
    # the put completes, as in basic/main.py.

    # In either case, the datastore ID from the entity will be returned in the
    # ProtoRPC response message.

    user = endpoints.get_current_user()
    if user is None:
        raise endpoints.UnauthorizedException('You must authenticate!' )
    user_from_email = model.User.query(model.User.email == user.email()).get()
    if user_from_email is None:
      raise endpoints.UnauthorizedException('You must sign-in!' )
    # Todo: Check permissions
    task_owner = model.User()
    task_owner.google_display_name = user_from_email.google_display_name
    my_model.owner = task_owner
    my_model.put()
    

    return my_model
  @Task.query_method(user_required=True,query_fields=('about_kind','about_item','status', 'due', 'limit', 'order', 'pageToken'),path='tasks', name='tasks.list')
  def TaskList(self, query):
    
    return query
  ################################ Events API ##################################
  @Event.method(user_required=True,path='events', http_method='POST', name='events.insert')
  def EventInsert(self, my_model):

    # Here, since the schema includes an ID, it is possible that the entity
    # my_model has an ID, hence we could be specifying a new ID in the datastore
    # or overwriting an existing entity. If no ID is included in the ProtoRPC
    # request, then no key will be set in the model and the ID will be set after
    # the put completes, as in basic/main.py.

    # In either case, the datastore ID from the entity will be returned in the
    # ProtoRPC response message.

    user = endpoints.get_current_user()
    if user is None:
        raise endpoints.UnauthorizedException('You must authenticate!' )
    user_from_email = model.User.query(model.User.email == user.email()).get()
    if user_from_email is None:
      raise endpoints.UnauthorizedException('You must sign-in!' )
    # Todo: Check permissions
    task_owner = model.User()
    task_owner.google_display_name = user_from_email.google_display_name
    my_model.owner = task_owner
    my_model.put()
    

    return my_model
  @Event.query_method(user_required=True,query_fields=('about_kind','about_item','status', 'starts_at','ends_at', 'limit', 'order', 'pageToken'),path='events', name='events.list')
  def EventList(self, query):
    
    return query
###################################### Users API ################################################
  @User.method(user_required=True,path='users', http_method='POST', name='users.insert')
  def UserInsert(self, my_model):

    
    
    user = endpoints.get_current_user()
    if user is None:
        raise endpoints.UnauthorizedException('You must authenticate!' )
    user_from_email = model.User.query(model.User.email == user.email()).get()
    if user_from_email is None:
      raise endpoints.UnauthorizedException('You must sign-in!' )
    # Todo: Check permissions
    my_model.organization = user_from_email.organization
    my_model.status = 'invited'
    profile = model.Profile.query(model.Profile.name=='Standard User', model.Profile.organization==user_from_email.organization).get()
    my_model.init_user_config(user_from_email.organization,profile.key)
    my_model.put()
    confirmation_url = "http://iogrow-dev.appspot.com/sign-in?id=" + str(my_model.id) + '&'
    sender_address = "ioGrow notifications <notifications@iogrow-dev.appspotmail.com>"
    subject = "Confirm your registration"
    body = """
Thank you for creating an account! Please confirm your email address by
clicking on the link below:

%s
""" % confirmation_url

    mail.send_mail(sender_address, my_model.email , subject, body)
    return my_model

  @User.method(request_fields=('id',),path='users/{id}', http_method='GET', name='users.get')
  def UserGet(self, my_model):
    if not my_model.from_datastore:
      raise endpoints.NotFoundException('Account not found.')
    return my_model

  @User.query_method(user_required=True,query_fields=('limit', 'order', 'pageToken'),path='users', name='users.list')
  def UserList(self, query):
    return query

###################################### Groups API ################################################
  @Group.method(user_required=True,path='groups', http_method='POST', name='groups.insert')
  def GroupInsert(self, my_model):

    
    
    user = endpoints.get_current_user()
    if user is None:
        raise endpoints.UnauthorizedException('You must authenticate!' )
    user_from_email = model.User.query(model.User.email == user.email()).get()
    if user_from_email is None:
      raise endpoints.UnauthorizedException('You must sign-in!' )
    # Todo: Check permissions
    my_model.organization = user_from_email.organization
    
    my_model.put()
    
    return my_model

  @Group.method(request_fields=('id',),path='groups/{id}', http_method='GET', name='groups.get')
  def GroupGet(self, my_model):
    if not my_model.from_datastore:
      raise endpoints.NotFoundException('Account not found.')
    return my_model

  @Group.query_method(user_required=True,query_fields=('limit', 'order', 'pageToken'),path='groups', name='groups.list')
  def GroupList(self, query):
    return query
###################################### Members API ################################################
  @Member.method(user_required=True,path='members', http_method='POST', name='members.insert')
  def MemberInsert(self, my_model):

    
    
    user = endpoints.get_current_user()
    if user is None:
        raise endpoints.UnauthorizedException('You must authenticate!' )
    user_from_email = model.User.query(model.User.email == user.email()).get()
    if user_from_email is None:
      raise endpoints.UnauthorizedException('You must sign-in!' )
    # Todo: Check permissions
    my_model.organization = user_from_email.organization
    
    my_model.put()
    
    return my_model

  @Member.method(request_fields=('id',),path='members/{id}', http_method='GET', name='members.get')
  def MemberGet(self, my_model):
    if not my_model.from_datastore:
      raise endpoints.NotFoundException('Account not found.')
    return my_model

  @Member.query_method(user_required=True,query_fields=('limit', 'order','groupKey', 'pageToken'),path='members', name='members.list')
  def MemberList(self, query):
    return query
###################################### Shows API ################################
################################ Events API ##################################
  @Show.method(user_required=True,path='shows', http_method='POST', name='shows.insert')
  def ShowInsert(self, my_model):

    # Here, since the schema includes an ID, it is possible that the entity
    # my_model has an ID, hence we could be specifying a new ID in the datastore
    # or overwriting an existing entity. If no ID is included in the ProtoRPC
    # request, then no key will be set in the model and the ID will be set after
    # the put completes, as in basic/main.py.

    # In either case, the datastore ID from the entity will be returned in the
    # ProtoRPC response message.

    user = endpoints.get_current_user()
    if user is None:
        raise endpoints.UnauthorizedException('You must authenticate!' )
    user_from_email = model.User.query(model.User.email == user.email()).get()
    if user_from_email is None:
      raise endpoints.UnauthorizedException('You must sign-in!' )
    # Todo: Check permissions
    task_owner = model.User()
    task_owner.google_display_name = user_from_email.google_display_name
    my_model.owner = task_owner
    my_model.put()
    

    return my_model
  @Show.query_method(user_required=True,query_fields=('is_published','status', 'starts_at','ends_at', 'limit', 'order', 'pageToken'),path='shows', name='shows.list')
  def ShowList(self, query):
    
    return query
  @Show.method(request_fields=('id',),path='shows/{id}', http_method='GET', name='shows.get')
  def ShowGet(self, my_model):
    if not my_model.from_datastore:
      raise endpoints.NotFoundException('Show not found.')
    return my_model


  ################################### Search API ################################
  @endpoints.method(SearchRequest, SearchResults,
                      path='search', http_method='GET',
                      name='search')
  def search_method(self, unused_request):
        return TEST_RESULTS
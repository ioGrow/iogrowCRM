import endpoints
from google.appengine.ext import ndb
from google.appengine.api import search 

from protorpc import remote
from google.appengine.datastore.datastore_query import Cursor
from endpoints_proto_datastore.ndb import EndpointsAliasProperty
from endpoints_proto_datastore.ndb import EndpointsModel
from iomodels.crmengine.accounts import Account
from iomodels.crmengine.contacts import Contact
from iomodels.crmengine.campaigns import Campaign
from iomodels.crmengine.notes import Note,Topic
from iomodels.crmengine.tasks import Task
from iomodels.crmengine.opportunities import Opportunity
from iomodels.crmengine.events import Event
from iomodels.crmengine.documents import Document

from iomodels.crmengine.shows import Show

from iomodels.crmengine.leads import Lead
from iomodels.crmengine.cases import Case
from iomodels.crmengine.products import Product
from iomodels.crmengine.comments import Comment

from model import User,Userinfo,Group,Member,Permission
import model
import logging
import auth_util
from google.appengine.api import mail
import httplib2
from apiclient.discovery import build
from oauth2client.client import flow_from_clientsecrets
from oauth2client.tools import run
from apiclient import errors
from protorpc import messages
from protorpc import message_types
from google.appengine.api import memcache


# The ID of javascript client authorized to access to our api
# This client_id could be generated on the Google API console
CLIENT_ID = '987765099891.apps.googleusercontent.com'
SCOPES = ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/drive']
OBJECTS = {'Account': Account,'Contact': Contact,'Case':Case,'Lead':Lead,'Opportunity':Opportunity}
FOLDERS = {'Account': 'accounts_folder','Contact': 'contacts_folder','Lead':'leads_folder','Opportunity':'opportunities_folder','Case':'cases_folder','Show':'shows_folder'}

class SearchRequest(messages.Message):
    q = messages.StringField(1)
    limit = messages.IntegerField(2)
    pageToken = messages.StringField(3)

class AttachmentSchema(messages.Message):
    id = messages.StringField(1)
    title = messages.StringField(2)
    mimeType = messages.StringField(3)
    embedLink = messages.StringField(4)
class MultipleAttachmentRequest(messages.Message):
    about_kind = messages.StringField(1)
    about_item = messages.StringField(2)
    items = messages.MessageField(AttachmentSchema, 3, repeated=True)


class SearchResult(messages.Message):
    id = messages.StringField(1)
    title = messages.StringField(2)
    type = messages.StringField(3)
    rank = messages.IntegerField(4)


class SearchResults(messages.Message):
   
    items = messages.MessageField(SearchResult, 1, repeated=True)
    nextPageToken = messages.StringField(2)

class AccountSearchResult(messages.Message):
    id = messages.StringField(1)
    entityKey  = messages.StringField(2)
    name = messages.StringField(3)

class AccountSearchResults(messages.Message):
   
    items = messages.MessageField(AccountSearchResult, 1, repeated=True)
    nextPageToken = messages.StringField(2)

class ContactSearchResult(messages.Message):
    id = messages.StringField(1)
    entityKey  = messages.StringField(2)
    firstname = messages.StringField(3)
    lastname = messages.StringField(4)
    account_name = messages.StringField(5)
    account = messages.StringField(6)

class ContactSearchResults(messages.Message):
   
    items = messages.MessageField(ContactSearchResult, 1, repeated=True)
    nextPageToken = messages.StringField(2)
   


class AuthorSchema(messages.Message):

    google_user_id = messages.StringField(1)
    display_name = messages.StringField(2)
    google_public_profile_url = messages.StringField(3)
    photo = messages.StringField(4)

class DiscussionAboutSchema(messages.Message):

    kind = messages.StringField(1)
    id = messages.StringField(2)
    name = messages.StringField(3)
    
# Customized Discussion Response for notes.get API
class DiscussionResponse(messages.Message):
    
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    title = messages.StringField(3)
    content = messages.StringField(4)
    comments = messages.IntegerField(5)
    about = messages.MessageField(DiscussionAboutSchema,6)
    author = messages.MessageField(AuthorSchema,7)
# Customized Task Response for tasks.get API
class TaskResponse(messages.Message):
    
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    title = messages.StringField(3)
    due = messages.StringField(4)
    status = messages.StringField(5)
    comments = messages.IntegerField(6)
    about = messages.MessageField(DiscussionAboutSchema,7)
    author = messages.MessageField(AuthorSchema,8)
    completed_by = messages.MessageField(AuthorSchema,9)


@endpoints.api(name='crmengine', version='v1', description='I/Ogrow CRM APIs',allowed_client_ids=[CLIENT_ID,
                                   endpoints.API_EXPLORER_CLIENT_ID],scopes=SCOPES)
class CrmEngineApi(remote.Service):

  ID_RESOURCE = endpoints.ResourceContainer(
            message_types.VoidMessage,
            id=messages.StringField(1))
  
  
  # TEDJ_29_10_write annotation to reference wich model for example @Account to refernce Account model
  @Contact.method(user_required=True,path='contacts', http_method='POST', name='contacts.insert')
  def ContactInsert(self, my_model):

      user = endpoints.get_current_user()
      if user is None:
          raise endpoints.UnauthorizedException('You must authenticate!' )
      user_from_email = model.User.query(model.User.email == user.email()).get()
      if user_from_email is None:
          raise endpoints.UnauthorizedException('You must sign-in!' )
      # OAuth flow
      try:
          credentials = user_from_email.google_credentials
          http = credentials.authorize(httplib2.Http(memcache))
          service = build('drive', 'v2', http=http)
          organization = user_from_email.organization.get()

          # prepare params to insert
          folder_params = {
                      'title': my_model.firstname + ' ' + my_model.lastname,
                      'mimeType':  'application/vnd.google-apps.folder'         
          }#get the accounts_folder or contacts_folder or .. 
          
          parent_folder = organization.contacts_folder
          if parent_folder:
              folder_params['parents'] = [{'id': parent_folder}]
          
          # execute files.insert and get resource_id
          created_folder = service.files().insert(body=folder_params).execute()
      except:
          raise endpoints.UnauthorizedException('Invalid grant' )
          return
      # Todo: Check permissions
      my_model.owner = user_from_email.google_user_id
      my_model.organization = user_from_email.organization
      my_model.folder = created_folder['id']
      my_model.put()
      return my_model


  @Contact.method(user_required=True,
                http_method='PUT', path='contacts/{id}', name='contacts.update')
  def ContactUpdate(self, my_model):
    user = endpoints.get_current_user()
    if user is None:
        raise endpoints.UnauthorizedException('You must authenticate!' )
    user_from_email = model.User.query(model.User.email == user.email()).get()
    if user_from_email is None:
      raise endpoints.UnauthorizedException('You must sign-in!' )
    # Todo: Check permissions
    #my_model.owner = user_from_email.google_user_id
    #my_model.organization =  user_from_email.organization

    my_model.put()
    return my_model

  @Contact.method(user_required=True,
                http_method='PATCH', path='contacts/{id}', name='contacts.patch')
  def ContactPatch(self, my_model):
      user = endpoints.get_current_user()
      if user is None:
          raise endpoints.UnauthorizedException('You must authenticate!' )
      user_from_email = model.User.query(model.User.email == user.email()).get()
      if user_from_email is None:
        raise endpoints.UnauthorizedException('You must sign-in!' )
      # Todo: Check permissions

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
 
  @Contact.query_method(user_required=True,query_fields=('limit', 'order','account','account_name', 'pageToken'),path='contacts', name='contacts.list')
  def ContactList(self, query):
      user = endpoints.get_current_user()
      if user is None:
          raise endpoints.UnauthorizedException('You must authenticate!' )
      user_from_email = model.User.query(model.User.email == user.email()).get()
      if user_from_email is None:
        raise endpoints.UnauthorizedException('You must sign-in!' )
      return query.filter(ndb.OR(ndb.AND(Contact.access=='public',Contact.organization==user_from_email.organization),Contact.owner==user_from_email.google_user_id, Contact.collaborators_ids==user_from_email.google_user_id)).order(Contact._key)

  @endpoints.method(SearchRequest, ContactSearchResults,
                      path='contacts/search', http_method='POST',
                      name='contacts.search')
  def contact_search(self, request):
      user = endpoints.get_current_user()
      if user is None:
          raise endpoints.UnauthorizedException('You must authenticate!' )
      user_from_email = model.User.query(model.User.email == user.email()).get()
      if user_from_email is None:
          raise endpoints.UnauthorizedException('You must sign-in!' )
      
      #prepare the query
      query_string = request.q 
      query_string_next = unicode(request.q) + u"\ufffd"
      if request.limit:
          limit = int(request.limit)
      else:
          limit = 10

      query = Contact.query(ndb.AND(Contact.display_name>=query_string,Contact.display_name<query_string_next),ndb.OR(ndb.AND(Contact.access=='public',Contact.organization==user_from_email.organization),Contact.owner==user_from_email.google_user_id, Contact.collaborators_ids==user_from_email.google_user_id)).order(Contact.display_name,Contact._key)
      if request.pageToken:
          curs = Cursor(urlsafe=request.pageToken)
          results, next_curs, more = query.fetch_page(limit, start_cursor=curs)
      else:
          results, next_curs, more = query.fetch_page(limit)

      search_results = []
      for result in results:
          kwargs = {'id':str(result.key.id()),
                  'entityKey': result.key.urlsafe(),
                  'firstname': result.firstname,
                  'lastname':result.lastname,
                  'account_name':result.account_name,
                  'account':result.account.urlsafe()}
          search_results.append(ContactSearchResult(**kwargs))

      nextPageToken = None
      if more and next_curs:
          nextPageToken = next_curs.urlsafe()
        
      return ContactSearchResults(items = search_results,nextPageToken=nextPageToken)

  @Account.method(user_required=True,path='accounts', http_method='POST', name='accounts.insert')
  def AccountInsert(self, my_model):
      user = endpoints.get_current_user()
      if user is None:
          raise endpoints.UnauthorizedException('You must authenticate!' )
      user_from_email = model.User.query(model.User.email == user.email()).get()
      if user_from_email is None:
          raise endpoints.UnauthorizedException('You must sign-in!' )
      # OAuth flow
      try:
          credentials = user_from_email.google_credentials
          http = credentials.authorize(httplib2.Http(memcache))
          service = build('drive', 'v2', http=http)
          organization = user_from_email.organization.get()

          # prepare params to insert
          folder_params = {
                      'title': my_model.name,
                      'mimeType':  'application/vnd.google-apps.folder'         
          }#get the accounts_folder or contacts_folder or .. 
          
          parent_folder = organization.accounts_folder
          if parent_folder:
              folder_params['parents'] = [{'id': parent_folder}]
          
          # execute files.insert and get resource_id
          created_folder = service.files().insert(body=folder_params).execute()
      except:
          raise endpoints.UnauthorizedException('Invalid grant' )
          return
      # Todo: Check permissions
      my_model.owner = user_from_email.google_user_id
      my_model.organization = user_from_email.organization
      my_model.folder = created_folder['id']
      my_model.put()
      return my_model
  
  @Account.method(user_required=True,
                http_method='PUT', path='accounts/{id}', name='accounts.update')
  def AccountUpdate(self, my_model):
    user = endpoints.get_current_user()
    if user is None:
        raise endpoints.UnauthorizedException('You must authenticate!' )
    user_from_email = model.User.query(model.User.email == user.email()).get()
    if user_from_email is None:
      raise endpoints.UnauthorizedException('You must sign-in!' )
    # Todo: Check permissions
    #my_model.owner = user_from_email.google_user_id
    #my_model.organization =  user_from_email.organization

    my_model.put()
    return my_model

  @Account.method(user_required=True,
                http_method='PATCH', path='accounts/{id}', name='accounts.patch')
  def AccountPatch(self, my_model):
      user = endpoints.get_current_user()
      if user is None:
          raise endpoints.UnauthorizedException('You must authenticate!' )
      user_from_email = model.User.query(model.User.email == user.email()).get()
      if user_from_email is None:
        raise endpoints.UnauthorizedException('You must sign-in!' )
      # Todo: Check permissions
      if not my_model.from_datastore:
          raise endpoints.NotFoundException('Account not found.')
      patched_model_key = my_model.entityKey
      patched_model = ndb.Key(urlsafe=patched_model_key).get()
      print patched_model
      print my_model
      properties = Account().__class__.__dict__
      for p in properties.keys():
         
            if (eval('patched_model.'+p) != eval('my_model.'+p))and(eval('my_model.'+p)):
                exec('patched_model.'+p+'= my_model.'+p)
      

      patched_model.put()
      return patched_model

  @Account.method(request_fields=('id',),path='accounts/{id}', http_method='GET', name='accounts.get')
  def AccountGet(self, my_model):
    if not my_model.from_datastore:
      raise endpoints.NotFoundException('Account not found.')
    return my_model

  @Account.query_method(user_required=True,query_fields=('limit', 'order', 'pageToken'),path='accounts', name='accounts.list')
  
  def Account_List(self, query):
      user = endpoints.get_current_user()
      if user is None:
          raise endpoints.UnauthorizedException('You must authenticate!' )
      user_from_email = model.User.query(model.User.email == user.email()).get()
      if user_from_email is None:
        raise endpoints.UnauthorizedException('You must sign-in!' )
      return query.filter(ndb.OR(ndb.AND(Account.access=='public',Account.organization==user_from_email.organization),Account.owner==user_from_email.google_user_id, Account.collaborators_ids==user_from_email.google_user_id)).order(Account._key)

  @endpoints.method(SearchRequest, AccountSearchResults,
                      path='accounts/search', http_method='POST',
                      name='accounts.search')
  def account_search(self, request):
      user = endpoints.get_current_user()
      if user is None:
          raise endpoints.UnauthorizedException('You must authenticate!' )
      user_from_email = model.User.query(model.User.email == user.email()).get()
      if user_from_email is None:
          raise endpoints.UnauthorizedException('You must sign-in!' )
      
      #prepare the query
      query_string = request.q 
      query_string_next = unicode(request.q) + u"\ufffd"
      if request.limit:
          limit = int(request.limit)
      else:
          limit = 10

      query = Account.query(ndb.AND(Account.name>=query_string,Account.name<query_string_next,ndb.OR(ndb.AND(Account.access=='public',Account.organization==user_from_email.organization),Account.owner==user_from_email.google_user_id, Account.collaborators_ids==user_from_email.google_user_id))).order(Account.name,Account._key)
      if request.pageToken:
          curs = Cursor(urlsafe=request.pageToken)
          results, next_curs, more = query.fetch_page(limit, start_cursor=curs)
      else:
          results, next_curs, more = query.fetch_page(limit)

      search_results = []
      for result in results:
          kwargs = {'id':str(result.key.id()),
                  'entityKey': result.key.urlsafe(),
                  'name': result.name}
          search_results.append(AccountSearchResult(**kwargs))

      nextPageToken = None
      if more and next_curs:
          nextPageToken = next_curs.urlsafe()
        
      return AccountSearchResults(items = search_results,nextPageToken=nextPageToken) 
                               
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
    note_author = model.Userinfo()
    note_author.display_name = user_from_email.google_display_name
    note_author.photo = user_from_email.google_public_profile_photo_url
    my_model.author = note_author
    my_model.owner = user_from_email.google_user_id
    my_model.organization =  user_from_email.organization
    my_model.put()
    

    return my_model

  @Note.method(user_required=True,
                http_method='PUT', path='notes/{id}', name='notes.update')
  def NoteUpdate(self, my_model):
    user = endpoints.get_current_user()
    if user is None:
        raise endpoints.UnauthorizedException('You must authenticate!' )
    user_from_email = model.User.query(model.User.email == user.email()).get()
    if user_from_email is None:
      raise endpoints.UnauthorizedException('You must sign-in!' )
    # Todo: Check permissions
    #my_model.owner = user_from_email.google_user_id
    #my_model.organization =  user_from_email.organization

    my_model.put()
    return my_model

  @Note.method(user_required=True,
                http_method='PATCH', path='notes/{id}', name='notes.patch')
  def NotePatch(self, my_model):
      user = endpoints.get_current_user()
      if user is None:
          raise endpoints.UnauthorizedException('You must authenticate!' )
      user_from_email = model.User.query(model.User.email == user.email()).get()
      if user_from_email is None:
        raise endpoints.UnauthorizedException('You must sign-in!' )
      # Todo: Check permissions

      my_model.put()
      return my_model
         

  @endpoints.method(ID_RESOURCE, DiscussionResponse,
                      path='notes/{id}', http_method='GET',
                      name='notes.get')
  def NoteGet(self, request):
        user = endpoints.get_current_user()
        if user is None:
            raise endpoints.UnauthorizedException('You must authenticate!' )
        user_from_email = model.User.query(model.User.email == user.email()).get()
        if user_from_email is None:
          raise endpoints.UnauthorizedException('You must sign-in!' )
        try:
            note = Note.get_by_id(int(request.id))
            about_item_id = int(note.about_item)
            try:
                about_object = OBJECTS[note.about_kind].get_by_id(about_item_id)
                if note.about_kind == 'Contact' or note.about_kind == 'Lead':
                    about_name = about_object.firstname + ' ' + about_object.lastname
                else:
                    about_name = about_object.name
                about_response = DiscussionAboutSchema(kind=note.about_kind,
                                                       id=note.about_item,
                                                       name=about_name)
                author = AuthorSchema(google_user_id = note.author.google_user_id,
                                      display_name = note.author.display_name,
                                      google_public_profile_url = note.author.google_public_profile_url,
                                      photo = note.author.photo)
                

                response = DiscussionResponse(id=request.id,
                                              entityKey= note.key.urlsafe(),
                                              title= note.title,
                                              content= note.content,
                                              comments=note.comments,
                                              about=about_response,
                                              author= author)
                return response
            except (IndexError, TypeError):
                raise endpoints.NotFoundException('About object %s not found.' %
                                                  (request.id,))
            
            

            
        except (IndexError, TypeError):
            raise endpoints.NotFoundException('Note %s not found.' %
                                              (request.id,))


  ################################ Topic API ##################################
  @Topic.query_method(user_required=True,query_fields=('about_kind','about_item', 'limit', 'order', 'pageToken'),path='topics', name='topics.list')
  def TopicList(self, query):
    
    return query
  @Topic.method(request_fields=('id',),path='topics/{id}', http_method='GET', name='topics.get')
  def TopicGet(self, my_model):
    if not my_model.from_datastore:
      raise endpoints.NotFoundException('Topic not found.')
    return my_model



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
    
    my_model.owner = user_from_email.google_user_id
    my_model.organization =  user_from_email.organization
    author = model.Userinfo()
    author.google_user_id = user_from_email.google_user_id
    author.display_name = user_from_email.google_display_name
    author.photo = user_from_email.google_public_profile_photo_url
    my_model.author = author
    my_model.put()
    

    return my_model
  @Task.query_method(user_required=True,query_fields=('about_kind','about_item','status','id', 'due', 'limit', 'order', 'pageToken'),path='tasks', name='tasks.list')
  def TaskList(self, query):
    
    return query
  @endpoints.method(ID_RESOURCE, TaskResponse,
                      path='tasks/{id}', http_method='GET',
                      name='tasks.get')
  def task_get(self, request):
        user = endpoints.get_current_user()
        if user is None:
            raise endpoints.UnauthorizedException('You must authenticate!' )
        user_from_email = model.User.query(model.User.email == user.email()).get()
        if user_from_email is None:
          raise endpoints.UnauthorizedException('You must sign-in!' )
        try:
            task = Task.get_by_id(int(request.id))
            about_item_id = int(task.about_item)
            try:
                about_object = OBJECTS[task.about_kind].get_by_id(about_item_id)
                if task.about_kind == 'Contact' or task.about_kind == 'Lead':
                    about_name = about_object.firstname + ' ' + about_object.lastname
                else:
                    about_name = about_object.name
                about_response = DiscussionAboutSchema(kind=task.about_kind,
                                                       id=task.about_item,
                                                       name=about_name)
                author = AuthorSchema(google_user_id = task.author.google_user_id,
                                      display_name = task.author.display_name,
                                      google_public_profile_url = task.author.google_public_profile_url,
                                      photo = task.author.photo)
                completed_by = None
                if completed_by:
                    completed_by = AuthorSchema(google_user_id = task.completed_by.google_user_id,
                                      display_name = task.completed_by.display_name,
                                      google_public_profile_url = task.completed_by.google_public_profile_url,
                                      photo = task.completed_by.photo)

                

                response = TaskResponse(id=request.id,
                                              entityKey = task.key.urlsafe(),
                                              title = task.title,
                                              due = task.due.isoformat(),
                                              status = task.status,
                                              comments = task.comments,
                                              about = about_response,
                                              author = author,
                                              completed_by = completed_by )
                return response
            except (IndexError, TypeError):
                raise endpoints.NotFoundException('About object %s not found.' %
                                                  (request.id,))
            
            

            
        except (IndexError, TypeError):
            raise endpoints.NotFoundException('Note %s not found.' %
                                              (request.id,))

  # HKA 4.11.2013 Add Opportuity APIs
  @Opportunity.method(user_required=True,path='opportunities',http_method='POST',name='opportunities.insert')
  def OpportunityInsert(self, my_model):
      user = endpoints.get_current_user()
      if user is None:
          raise endpoints.UnauthorizedException('You must authenticate!' )
      user_from_email = model.User.query(model.User.email == user.email()).get()
      if user_from_email is None:
          raise endpoints.UnauthorizedException('You must sign-in!' )
      # OAuth flow
      try:
          credentials = user_from_email.google_credentials
          http = credentials.authorize(httplib2.Http(memcache))
          service = build('drive', 'v2', http=http)
          organization = user_from_email.organization.get()

          # prepare params to insert
          folder_params = {
                      'title': my_model.name,
                      'mimeType':  'application/vnd.google-apps.folder'         
          }#get the accounts_folder or contacts_folder or .. 
          
          parent_folder = organization.opportunities_folder
          if parent_folder:
              folder_params['parents'] = [{'id': parent_folder}]
          
          # execute files.insert and get resource_id
          created_folder = service.files().insert(body=folder_params).execute()
      except:
          raise endpoints.UnauthorizedException('Invalid grant' )
          return
      # Todo: Check permissions
      my_model.owner = user_from_email.google_user_id
      my_model.organization = user_from_email.organization
      my_model.folder = created_folder['id']
      my_model.put()
      return my_model

  @Opportunity.method(user_required=True,
                http_method='PUT', path='opportunities/{id}', name='opportunities.update')
  def OpportunityUpdate(self, my_model):
    user = endpoints.get_current_user()
    if user is None:
        raise endpoints.UnauthorizedException('You must authenticate!' )
    user_from_email = model.User.query(model.User.email == user.email()).get()
    if user_from_email is None:
      raise endpoints.UnauthorizedException('You must sign-in!' )
    # Todo: Check permissions
    #my_model.owner = user_from_email.google_user_id
    #my_model.organization =  user_from_email.organization

    my_model.put()
    return my_model

  @Opportunity.method(user_required=True,
                http_method='PATCH', path='opportunities/{id}', name='opportunities.patch')
  def OpportunityPatch(self, my_model):
      user = endpoints.get_current_user()
      if user is None:
          raise endpoints.UnauthorizedException('You must authenticate!' )
      user_from_email = model.User.query(model.User.email == user.email()).get()
      if user_from_email is None:
        raise endpoints.UnauthorizedException('You must sign-in!')
      # Todo: Check permissions
      my_model.put()
      return my_model

  @Opportunity.method(request_fields=('id',),path='opportunities/{id}', http_method='GET', name='opportunities.get')
  def OpportunityGet(self, my_model):
    if not my_model.from_datastore:
      raise endpoints.NotFoundException('Opportunity not found')
    return my_model
  @Opportunity.query_method(user_required=True,query_fields=('limit', 'order', 'pageToken','account'),path='opportunities', name='opportunities.list')
  def opportunity_list(self, query):

      user = endpoints.get_current_user()
      if user is None:
          raise endpoints.UnauthorizedException('You must authenticate!' )
      user_from_email = model.User.query(model.User.email == user.email()).get()
      if user_from_email is None:
        raise endpoints.UnauthorizedException('You must sign-in!' )
      
      return query.filter(ndb.OR(ndb.AND(Opportunity.access=='public',Opportunity.organization==user_from_email.organization),Opportunity.owner==user_from_email.google_user_id, Opportunity.collaborators_ids==user_from_email.google_user_id)).order(Opportunity._key)

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
    my_model.owner = user_from_email.google_user_id
    my_model.organization =  user_from_email.organization
    my_model.put()
    

    return my_model
  
  @Event.query_method(user_required=True,query_fields=('about_kind','about_item', 'starts_at','ends_at', 'limit', 'order', 'pageToken'),path='events', name='events.list')
  def EventList(self, query):
      return query
      
  @Event.method(request_fields=('id',),path='events/{id}', http_method='GET', name='events.get')
  def EventGet(self, my_model):
    if not my_model.from_datastore:
      raise endpoints.NotFoundException('Event not found')
    return my_model
  

# HKA 06.11.2013 Add Opportuity APIs
  @Lead.method(user_required=True,path='leads',http_method='POST',name='leads.insert')
  def LeadInsert(self, my_model):
      user = endpoints.get_current_user()
      if user is None:
          raise endpoints.UnauthorizedException('You must authenticate!' )
      user_from_email = model.User.query(model.User.email == user.email()).get()
      if user_from_email is None:
          raise endpoints.UnauthorizedException('You must sign-in!' )
      # OAuth flow
      try:
          credentials = user_from_email.google_credentials
          http = credentials.authorize(httplib2.Http(memcache))
          service = build('drive', 'v2', http=http)
          organization = user_from_email.organization.get()

          # prepare params to insert
          folder_params = {
                      'title': my_model.firstname + ' ' + my_model.lastname,
                      'mimeType':  'application/vnd.google-apps.folder'         
          }#get the accounts_folder or contacts_folder or .. 
          
          parent_folder = organization.leads_folder
          if parent_folder:
              folder_params['parents'] = [{'id': parent_folder}]
          
          # execute files.insert and get resource_id
          created_folder = service.files().insert(body=folder_params).execute()
      except:
          raise endpoints.UnauthorizedException('Invalid grant' )
          return
      # Todo: Check permissions
      my_model.owner = user_from_email.google_user_id
      my_model.organization = user_from_email.organization
      my_model.folder = created_folder['id']
      my_model.put()
      return my_model

  @Lead.method(user_required=True,
                http_method='PUT', path='leads/{id}', name='leads.update')
  def LeadUpdate(self, my_model):
    user = endpoints.get_current_user()
    if user is None:
        raise endpoints.UnauthorizedException('You must authenticate!' )
    user_from_email = model.User.query(model.User.email == user.email()).get()
    if user_from_email is None:
      raise endpoints.UnauthorizedException('You must sign-in!' )
    # Todo: Check permissions
    #my_model.owner = user_from_email.google_user_id
    #my_model.organization =  user_from_email.organization

    my_model.put()
    return my_model

  @Lead.method(user_required=True,
                http_method='PATCH', path='leads/{id}', name='leads.patch')
  def LeadPatch(self, my_model):
      user = endpoints.get_current_user()
      if user is None:
          raise endpoints.UnauthorizedException('You must authenticate!' )
      user_from_email = model.User.query(model.User.email == user.email()).get()
      if user_from_email is None:
        raise endpoints.UnauthorizedException('You must sign-in!')
      # Todo: Check permissions
      my_model.put()
      return my_model

  @Lead.method(request_fields=('id',),path='leads/{id}', http_method='GET', name='leads.get')
  def LeadGet(self, my_model):
    if not my_model.from_datastore:
      raise endpoints.NotFoundException('Lead not found')
    return my_model
  
  @Lead.query_method(user_required=True,query_fields=('limit', 'order', 'pageToken'),path='leads',name='leads.list')
  def LeadList(self,query):
      user = endpoints.get_current_user()
      if user is None:
          raise endpoints.UnauthorizedException('You must authenticate!' )
      user_from_email = model.User.query(model.User.email == user.email()).get()
      if user_from_email is None:
        raise endpoints.UnauthorizedException('You must sign-in!' )
      return query.filter(ndb.OR(ndb.AND(Lead.access=='public',Lead.organization==user_from_email.organization),Lead.owner==user_from_email.google_user_id, Lead.collaborators_ids==user_from_email.google_user_id)).order(Lead._key)
# HKA 07.11.2013 Add Cases APIs
  @Case.method(user_required=True,path='cases',http_method='POST',name='cases.insert')
  def CaseInsert(self, my_model):
      user = endpoints.get_current_user()
      if user is None:
          raise endpoints.UnauthorizedException('You must authenticate!' )
      user_from_email = model.User.query(model.User.email == user.email()).get()
      if user_from_email is None:
          raise endpoints.UnauthorizedException('You must sign-in!' )
      # OAuth flow
      try:
          credentials = user_from_email.google_credentials
          http = credentials.authorize(httplib2.Http(memcache))
          service = build('drive', 'v2', http=http)
          organization = user_from_email.organization.get()

          # prepare params to insert
          folder_params = {
                      'title': my_model.name,
                      'mimeType':  'application/vnd.google-apps.folder'         
          }#get the accounts_folder or contacts_folder or .. 
          
          parent_folder = organization.cases_folder
          if parent_folder:
              folder_params['parents'] = [{'id': parent_folder}]
          
          # execute files.insert and get resource_id
          created_folder = service.files().insert(body=folder_params).execute()
      except:
          raise endpoints.UnauthorizedException('Invalid grant' )
          return
      # Todo: Check permissions
      my_model.owner = user_from_email.google_user_id
      my_model.organization = user_from_email.organization
      my_model.folder = created_folder['id']
      my_model.put()
      return my_model

  @Case.method(user_required=True,
                http_method='PUT', path='cases/{id}', name='cases.update')
  def CaseUpdate(self, my_model):
    user = endpoints.get_current_user()
    if user is None:
        raise endpoints.UnauthorizedException('You must authenticate!' )
    user_from_email = model.User.query(model.User.email == user.email()).get()
    if user_from_email is None:
      raise endpoints.UnauthorizedException('You must sign-in!' )
    # Todo: Check permissions
    #my_model.owner = user_from_email.google_user_id
    #my_model.organization =  user_from_email.organization

    my_model.put()
    return my_model

  @Case.method(user_required=True,
                http_method='PATCH', path='cases/{id}', name='cases.patch')
  def CasePatch(self, my_model):
      user = endpoints.get_current_user()
      if user is None:
          raise endpoints.UnauthorizedException('You must authenticate!' )
      user_from_email = model.User.query(model.User.email == user.email()).get()
      if user_from_email is None:
        raise endpoints.UnauthorizedException('You must sign-in!' )
      # Todo: Check permissions
      if not my_model.from_datastore:
          raise endpoints.NotFoundException('Account not found.')
      patched_model_key = my_model.entityKey
      patched_model = ndb.Key(urlsafe=patched_model_key).get()
      print patched_model
      print my_model
      properties = Case().__class__.__dict__
      for p in properties.keys():
         
            if (eval('patched_model.'+p) != eval('my_model.'+p))and(eval('my_model.'+p)):
                exec('patched_model.'+p+'= my_model.'+p)
      

      patched_model.put()
      return patched_model

  @Case.method(request_fields=('id',),path='cases/{id}', http_method='GET', name='cases.get')
  def CaseGet(self, my_model):
    if not my_model.from_datastore:
      raise endpoints.NotFoundException('Case not found')
    return my_model
  
  @Case.query_method(user_required=True,query_fields=('limit', 'order', 'pageToken','account','description','type_case','priority','status'),path='cases',name='cases.list')
  def CaseList(self,query):
      user = endpoints.get_current_user()
      if user is None:
          raise endpoints.UnauthorizedException('You must authenticate!' )
      user_from_email = model.User.query(model.User.email == user.email()).get()
      if user_from_email is None:
        raise endpoints.UnauthorizedException('You must sign-in!' )
      return query.filter(ndb.OR(ndb.AND(Case.access=='public',Case.organization==user_from_email.organization),Case.owner==user_from_email.google_user_id, Case.collaborators_ids==user_from_email.google_user_id)).order(Case._key)
#HKA 07.11.2013   Add Campaign APIs
  @Campaign.method(user_required=True,path='campaigns',http_method='POST',name='campaigns.insert')
  def CampaignInsert(self, my_model):
    user = endpoints.get_current_user()
    if user is  None :
      raise endpoints.UnauthorizedException('You must be aunthenticated')
    user_from_email = model.User.query(model.User.email == user.email()).get()
    if user_from_email is None:
      raise endpoints.UnauthorizedException('You must sign-in ')
    my_model.owner = user_from_email.google_user_id
    my_model.organization =  user_from_email.organization
    my_model.put()
    return my_model

  @Campaign.method(user_required=True,
                http_method='PUT', path='campaigns/{id}', name='campaigns.update')
  def CampaignUpdate(self, my_model):
    user = endpoints.get_current_user()
    if user is None:
        raise endpoints.UnauthorizedException('You must authenticate!' )
    user_from_email = model.User.query(model.User.email == user.email()).get()
    if user_from_email is None:
      raise endpoints.UnauthorizedException('You must sign-in!' )
    # Todo: Check permissions
    #my_model.owner = user_from_email.google_user_id
    #my_model.organization =  user_from_email.organization

    my_model.put()
    return my_model

  @Campaign.method(user_required=True,
                http_method='PATCH', path='campaigns/{id}', name='campaigns.patch')
  def CampaignPatch(self, my_model):
      user = endpoints.get_current_user()
      if user is None:
          raise endpoints.UnauthorizedException('You must authenticate!' )
      user_from_email = model.User.query(model.User.email == user.email()).get()
      if user_from_email is None:
        raise endpoints.UnauthorizedException('You must sign-in!')
      # Todo: Check permissions
      my_model.put()
      return my_model

  @Campaign.method(request_fields=('id',),path='campaigns/{id}', http_method='GET', name='campaigns.get')
  def CampaignGet(self, my_model):
    if not my_model.from_datastore:
      raise endpoints.NotFoundException('Case not found')
    return my_model
  
  @Campaign.query_method(user_required=True,query_fields=('limit', 'order', 'pageToken'),path='campaigns',name='campaigns.list')
  def CampaignList(self,query):
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
    # OAuth flow
    try:
        oauth_flow = flow_from_clientsecrets('client_secrets.json',
            scope=SCOPES)

        
        credentials = user_from_email.google_credentials

        if credentials is None or credentials.invalid:
            new_credentials = run(flow, credentials)
        else:
            new_credentials = credentials
        http = new_credentials.authorize(httplib2.Http(memcache))
        organization = user_from_email.organization.get()
        folderid = organization.org_folder
        new_permission = {
                         'value': my_model.email,
                         'type': 'user',
                         'role': 'writer'                  
        }
        service = build('drive', 'v2', http=http)
        service.permissions().insert(fileId=folderid,sendNotificationEmails= False, body=new_permission).execute()
    except:
        raise endpoints.UnauthorizedException('Invalid grant' )
        return 

    invited_user = model.User.query(model.User.email == my_model.email).get()
    
    if invited_user is not None:
        if invited_user.organization == user_from_email.organization or invited_user.organization is None:
            invited_user.organization = user_from_email.organization
            invited_user.status = 'invited'
            profile = model.Profile.query(model.Profile.name=='Standard User', model.Profile.organization==user_from_email.organization).get()
            invited_user.init_user_config(user_from_email.organization,profile.key)
            invited_user_id = invited_user.key.id()
            my_model.id = invited_user_id
            invited_user.put()
        elif invited_user.organization is not None:
            raise endpoints.UnauthorizedException('User exist within another organization' )
            return

            
    else:
        my_model.organization = user_from_email.organization
        my_model.status = 'invited'
        profile = model.Profile.query(model.Profile.name=='Standard User', model.Profile.organization==user_from_email.organization).get()
        my_model.init_user_config(user_from_email.organization,profile.key)
        
        my_model.put()
        invited_user_id = my_model.id
        
    confirmation_url = "http://gcdc2013-iogrow.appspot.com//sign-in?id=" + str(invited_user_id) + '&'
    sender_address = "ioGrow notifications <notifications@gcdc2013-iogrow.appspotmail.com>"
    subject = "Confirm your registration"
    body = """
    Thank you for creating an account! Please confirm your email address by
    clicking on the link below:

    %s
    """ % confirmation_url

    mail.send_mail(sender_address, my_model.email , subject, body)
    return my_model

  @User.method(user_required=True,
                http_method='PUT', path='users/{id}', name='users.update')
  def UserUpdate(self, my_model):
    user = endpoints.get_current_user()
    if user is None:
        raise endpoints.UnauthorizedException('You must authenticate!' )
    user_from_email = model.User.query(model.User.email == user.email()).get()
    if user_from_email is None:
      raise endpoints.UnauthorizedException('You must sign-in!' )
    # Todo: Check permissions
    #my_model.owner = user_from_email.google_user_id
    #my_model.organization =  user_from_email.organization

    my_model.put()
    return my_model

  @User.method(user_required=True,
                http_method='PATCH', path='users/{id}', name='users.patch')
  def UserPatch(self, my_model):
      user = endpoints.get_current_user()
      if user is None:
          raise endpoints.UnauthorizedException('You must authenticate!' )
      user_from_email = model.User.query(model.User.email == user.email()).get()
      if user_from_email is None:
        raise endpoints.UnauthorizedException('You must sign-in!')
      # Todo: Check permissions
      my_model.put()
      return my_model
  
  
  @User.method(request_fields=('id',),path='users/{id}', http_method='GET', name='users.get')
  def UserGet(self, my_model):
    if not my_model.from_datastore:
      raise endpoints.NotFoundException('Account not found.')
    return my_model

  @User.query_method(user_required=True,query_fields=('limit', 'order', 'pageToken'),path='users', name='users.list')
  def UserList(self, query):
    user = endpoints.get_current_user()
    if user is None:
          raise endpoints.UnauthorizedException('You must authenticate!' )
    user_from_email = model.User.query(model.User.email == user.email()).get()
    if user_from_email is None:
        raise endpoints.UnauthorizedException('You must sign-in!' )
    organization = user_from_email.organization
    return query.filter(model.User.organization == organization)

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

  @Group.method(user_required=True,
                http_method='PUT', path='groups/{id}', name='groups.update')
  def GroupUpdate(self, my_model):
    user = endpoints.get_current_user()
    if user is None:
        raise endpoints.UnauthorizedException('You must authenticate!' )
    user_from_email = model.User.query(model.User.email == user.email()).get()
    if user_from_email is None:
      raise endpoints.UnauthorizedException('You must sign-in!' )
    # Todo: Check permissions
    #my_model.owner = user_from_email.google_user_id
    #my_model.organization =  user_from_email.organization

    my_model.put()
    return my_model

  @Group.method(user_required=True,
                http_method='PATCH', path='groups/{id}', name='groups.patch')
  def GroupPatch(self, my_model):
      user = endpoints.get_current_user()
      if user is None:
          raise endpoints.UnauthorizedException('You must authenticate!' )
      user_from_email = model.User.query(model.User.email == user.email()).get()
      if user_from_email is None:
        raise endpoints.UnauthorizedException('You must sign-in!')
      # Todo: Check permissions
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

  @Member.method(user_required=True,
                http_method='PUT', path='members/{id}', name='members.update')
  def MemberUpdate(self, my_model):
    user = endpoints.get_current_user()
    if user is None:
        raise endpoints.UnauthorizedException('You must authenticate!' )
    user_from_email = model.User.query(model.User.email == user.email()).get()
    if user_from_email is None:
      raise endpoints.UnauthorizedException('You must sign-in!' )
    # Todo: Check permissions
    #my_model.owner = user_from_email.google_user_id
    #my_model.organization =  user_from_email.organization

    my_model.put()
    return my_model

  @Member.method(user_required=True,
                http_method='PATCH', path='members/{id}', name='members.patch')
  def MemberPatch(self, my_model):
      user = endpoints.get_current_user()
      if user is None:
          raise endpoints.UnauthorizedException('You must authenticate!' )
      user_from_email = model.User.query(model.User.email == user.email()).get()
      if user_from_email is None:
        raise endpoints.UnauthorizedException('You must sign-in!')
      # Todo: Check permissions
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
    my_model.author = task_owner
    my_model.owner = user_from_email.google_user_id
    my_model.organization =  user_from_email.organization
    my_model.put()

    return my_model

  @Show.method(user_required=True,
                http_method='PUT', path='shows/{id}', name='shows.update')
  def ShowUpdate(self, my_model):
    user = endpoints.get_current_user()
    if user is None:
        raise endpoints.UnauthorizedException('You must authenticate!' )
    user_from_email = model.User.query(model.User.email == user.email()).get()
    if user_from_email is None:
      raise endpoints.UnauthorizedException('You must sign-in!' )
    # Todo: Check permissions
    #my_model.owner = user_from_email.google_user_id
    #my_model.organization =  user_from_email.organization

    my_model.put()
    return my_model

  @Show.method(user_required=True,
                http_method='PATCH', path='shows/{id}', name='shows.patch')
  def ShowPatch(self, my_model):
      user = endpoints.get_current_user()
      if user is None:
          raise endpoints.UnauthorizedException('You must authenticate!' )
      user_from_email = model.User.query(model.User.email == user.email()).get()
      if user_from_email is None:
        raise endpoints.UnauthorizedException('You must sign-in!')
      # Todo: Check permissions
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
                      path='search', http_method='POST',
                      name='search')
  def search_method(self, request):
      user = endpoints.get_current_user()
      if user is None:
          raise endpoints.UnauthorizedException('You must authenticate!' )
      user_from_email = model.User.query(model.User.email == user.email()).get()
      if user_from_email is None:
          raise endpoints.UnauthorizedException('You must sign-in!' )
      organization = str(user_from_email.organization.id())


      index = search.Index(name="GlobalIndex")
      #Show only objects where you have permissions
      query_string = request.q + ' AND (organization:' +organization+ ' AND (access:public OR (owner:'+ user_from_email.google_user_id +' OR collaborators:'+ user_from_email.google_user_id+')))'
      print query_string
      search_results = []
      count = 1
      limit = request.limit
      next_cursor = None
      if request.pageToken:
          cursor = search.Cursor(web_safe_string=request.pageToken)
      else:
          cursor = search.Cursor(per_result=True)
      if limit:
          options = search.QueryOptions(limit=limit,cursor=cursor)
      else:
          options = search.QueryOptions(cursor=cursor)    
      query = search.Query(query_string=query_string,options=options)
      try:
          if query:
              results = index.search(query)
              total_matches = results.number_found
              
              # Iterate over the documents in the results
              for scored_document in results:
                  kwargs = {
                      "id" : scored_document.doc_id, 
                      "rank" : scored_document.rank
                  }
                  for e in scored_document.fields:
                      if e.name in ["title","type"]:
                          kwargs[e.name]=e.value
                  search_results.append(SearchResult(**kwargs))
                  
                  next_cursor = scored_document.cursor.web_safe_string
              if next_cursor:
                  next_query_options = search.QueryOptions(limit=1,cursor=scored_document.cursor)
                  next_query = search.Query(query_string=query_string,options=next_query_options)
                  if next_query:
                      next_results = index.search(next_query)
                      if len(next_results.results)==0:
                          next_cursor = None


                      
                      
               
      except search.Error:
          logging.exception('Search failed')
      return SearchResults(items = search_results,nextPageToken=next_cursor)

################################### Permissions API ############################
###################################Not completed yet###########################""
  @Permission.method(user_required=True,path='permissions', http_method='POST', name='permissions.insert')
  def PermissionInsert(self, my_model):
      user = endpoints.get_current_user()
      if user is None:
          raise endpoints.UnauthorizedException('You must authenticate!' )
      user_from_email = model.User.query(model.User.email == user.email()).get()
      if user_from_email is None:
        raise endpoints.UnauthorizedException('You must sign-in!' )
      
      my_model.organization = user_from_email.organization
      my_model.created_by = user_from_email.google_user_id
      #Check if the user has permission to invite people
      perm_object = Permission()
      perm = perm_object.get_user_perm(user_from_email,my_model.about_kind,my_model.about_item)
      print perm
      if perm is None or perm.role == 'readonly':
          raise endpoints.UnauthorizedException('You dont have permission to share this')
      if my_model.type == 'user':
          #try to get informations about this user and check if is in the same organization
          invited_user = model.User.query(model.User.email == my_model.value,model.User.organization==user_from_email.organization).get()
          if invited_user is None:
              raise endpoints.UnauthorizedException('The user does not exist')
         
          my_model.value = invited_user.google_user_id
          my_model.organization = user_from_email.organization
          my_model.put()
              #update collaborators on this objects:
          item_id = int(my_model.about_item)
          item = OBJECTS[my_model.about_kind].get_by_id(item_id)
          userinfo = Userinfo()
          if item.collaborators_ids:
            item.collaborators_ids.append(invited_user.google_user_id)
            new_collaborator = userinfo.get_basic_info(invited_user)
            item.collaborators_list.append(new_collaborator)

          else:
            collaborators_ids = list()
            collaborators= list()
            collaborators_ids.append(invited_user.google_user_id)
            item.collaborators_ids = collaborators_ids
            new_collaborator = userinfo.get_basic_info(invited_user)
            collaborators.append(new_collaborator)
            item.collaborators_list = collaborators

          print item
          item.put()
      #Todo Check if type is group
      return my_model


  @Permission.method(user_required=True,
                http_method='PUT', path='permissions/{id}', name='permissions.update')
  def PermissionUpdate(self, my_model):
    user = endpoints.get_current_user()
    if user is None:
        raise endpoints.UnauthorizedException('You must authenticate!' )
    user_from_email = model.User.query(model.User.email == user.email()).get()
    if user_from_email is None:
      raise endpoints.UnauthorizedException('You must sign-in!' )
    # Todo: Check permissions
    #my_model.owner = user_from_email.google_user_id
    #my_model.organization =  user_from_email.organization

    my_model.put()
    return my_model

  @Permission.method(user_required=True,
                http_method='PATCH', path='permissions/{id}', name='permissions.patch')
  def PermissionPatch(self, my_model):
      user = endpoints.get_current_user()
      if user is None:
          raise endpoints.UnauthorizedException('You must authenticate!' )
      user_from_email = model.User.query(model.User.email == user.email()).get()
      if user_from_email is None:
        raise endpoints.UnauthorizedException('You must sign-in!')
      # Todo: Check permissions
      my_model.put()
      return my_model
  
  @Permission.method(request_fields=('id',),path='permissions/{id}', http_method='GET', name='permissions.get')
  def PermissionGet(self, my_model):
    if not my_model.from_datastore:
      raise endpoints.NotFoundException('Permission not found')
    return my_model
  
  @Permission.query_method(user_required=True,query_fields=('limit', 'order', 'pageToken'),path='permissions',name='permissions.list')
  def PermissionList(self,query):
     return query

# HKA 17.11.2013 Add Cases APIs
  @Comment.method(user_required=True,path='comments',http_method='POST',name='comments.insert')
  def CommentInsert(self, my_model):
    user = endpoints.get_current_user()
    if user is  None :
      raise endpoints.UnauthorizedException('You must be aunthenticated')
    user_from_email = model.User.query(model.User.email == user.email()).get()
    if user_from_email is None:
      raise endpoints.UnauthorizedException('You must sign-in ')
    #discussion_key = ndb.Key(urlsafe=my_model.discussion)
    #my_model.discussion = discussion_key
    my_model.owner = user_from_email.key
    my_model.put()
    return my_model


  @Comment.method(user_required=True,
                http_method='PUT', path='comments/{id}', name='comments.update')
  def CommentUpdate(self, my_model):
    user = endpoints.get_current_user()
    if user is None:
        raise endpoints.UnauthorizedException('You must authenticate!' )
    user_from_email = model.User.query(model.User.email == user.email()).get()
    if user_from_email is None:
      raise endpoints.UnauthorizedException('You must sign-in!' )
    # Todo: Check permissions
    #my_model.owner = user_from_email.google_user_id
    #my_model.organization =  user_from_email.organization

    my_model.put()
    return my_model

  @Comment.method(user_required=True,
                http_method='PATCH', path='comments/{id}', name='comments.patch')
  def CommentPatch(self, my_model):
      user = endpoints.get_current_user()
      if user is None:
          raise endpoints.UnauthorizedException('You must authenticate!' )
      user_from_email = model.User.query(model.User.email == user.email()).get()
      if user_from_email is None:
        raise endpoints.UnauthorizedException('You must sign-in!')
      # Todo: Check permissions
      my_model.put()
      return my_model


  @Comment.method(request_fields=('id',),path='comments/{id}', http_method='GET', name='comments.get')
  def CommentGet(self, my_model):
    if not my_model.from_datastore:
      raise endpoints.NotFoundException('Comment not found')
    return my_model
  
  @Comment.query_method(user_required=True,query_fields=('limit', 'order','discussion','updated_at', 'pageToken'),path='comments',name='comments.list')
  def CommentList(self,query):
     return query

          
################################ Documents API ##################################
  @endpoints.method(ID_RESOURCE, DiscussionResponse,
                      path='documents/{id}', http_method='GET',
                      name='documents.get')
  def document_get(self, request):
        user = endpoints.get_current_user()
        if user is None:
            raise endpoints.UnauthorizedException('You must authenticate!' )
        user_from_email = model.User.query(model.User.email == user.email()).get()
        if user_from_email is None:
          raise endpoints.UnauthorizedException('You must sign-in!' )
        try:
            document = Document.get_by_id(int(request.id))
            if document is None:
                raise endpoints.NotFoundException('Document not found.' %
                                              (request.id,))

            about_item_id = int(document.about_item)
            try:
                about_object = OBJECTS[document.about_kind].get_by_id(about_item_id)
                if document.about_kind == 'Contact' or document.about_kind == 'Lead':
                    about_name = about_object.firstname + ' ' + about_object.lastname
                else:
                    about_name = about_object.name
                about_response = DiscussionAboutSchema(kind=document.about_kind,
                                                       id=document.about_item,
                                                       name=about_name)
                author = AuthorSchema(google_user_id = document.author.google_user_id,
                                      display_name = document.author.display_name,
                                      google_public_profile_url = document.author.google_public_profile_url,
                                      photo = document.author.photo)
                

                response = DiscussionResponse(id=request.id,
                                              entityKey= document.key.urlsafe(),
                                              title= document.title,
                                              content= document.embedLink,
                                              comments=document.comments,
                                              about=about_response,
                                              author= author)
                return response
            except (IndexError, TypeError):
                raise endpoints.NotFoundException('About object %s not found.' %
                                                  (request.id,))
            
            

            
        except (IndexError, TypeError):
            raise endpoints.NotFoundException('Note %s not found.' %
                                              (request.id,))

  @Document.method(user_required=True,path='documents', http_method='POST', name='documents.insert')
  def DocumentInsert(self, my_model):

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

    # prepare google drive service
    credentials = user_from_email.google_credentials
    http = httplib2.Http()
    service = build('drive', 'v2', http=http)
    credentials.authorize(http)
    organization = user_from_email.organization.get()

    # prepare params to insert
    document = {
                'title': my_model.title,
                'mimeType': my_model.mimeType        
    }#get the accounts_folder or contacts_folder or .. 
    about_item_id = int(my_model.about_item)
    parent_object = OBJECTS[my_model.about_kind].get_by_id(about_item_id)
    if parent_object:
        parent_folder = parent_object.folder
        if parent_folder:
            document['parents'] = [{'id': parent_folder}]
    
    # execute files.insert and get resource_id
    created_document = service.files().insert(body=document).execute()
    my_model.resource_id = created_document['id']
    my_model.embedLink = created_document['embedLink']
    # insert in the datastore
    
    # Todo: Check permissions
    author = model.Userinfo()
    author.display_name = user_from_email.google_display_name
    author.photo = user_from_email.google_public_profile_photo_url
    my_model.owner = user_from_email.google_user_id
    my_model.author = author
    my_model.organization = user_from_email.organization
    my_model.put()
    
    return my_model

  @endpoints.method(MultipleAttachmentRequest, message_types.VoidMessage,
                      path='documents/attachfiles', http_method='POST',
                      name='documents.attachfiles')
  def attach_files(self, request):
      user = endpoints.get_current_user()
      if user is None:
          raise endpoints.UnauthorizedException('You must authenticate!' )
      user_from_email = model.User.query(model.User.email == user.email()).get()
      if user_from_email is None:
        raise endpoints.UnauthorizedException('You must sign-in!' )
      # Todo: Check permissions
      items = request.items
      author = model.Userinfo()
      author.display_name = user_from_email.google_display_name
      author.photo = user_from_email.google_public_profile_photo_url
      for item in items:
          document = Document(about_kind = request.about_kind,
                              about_item = request.about_item,
                              title = item.title,
                              resource_id = item.id,
                              mimeType = item.mimeType,
                              embedLink = item.embedLink,
                              owner = user_from_email.google_user_id,
                              organization = user_from_email.organization,
                              author=author,
                              comments = 0
                              )
          document.put()
      return message_types.VoidMessage()



  @Document.method(user_required=True,
                http_method='PUT', path='documents/{id}', name='documents.update')
  def DocumentUpdate(self, my_model):
    user = endpoints.get_current_user()
    if user is None:
        raise endpoints.UnauthorizedException('You must authenticate!' )
    user_from_email = model.User.query(model.User.email == user.email()).get()
    if user_from_email is None:
      raise endpoints.UnauthorizedException('You must sign-in!' )
    # Todo: Check permissions
    #my_model.owner = user_from_email.google_user_id
    #my_model.organization =  user_from_email.organization

    my_model.put()
    return my_model

  @Document.method(user_required=True,
                http_method='PATCH', path='documents/{id}', name='documents.patch')
  def DocumentPatch(self, my_model):
      user = endpoints.get_current_user()
      if user is None:
          raise endpoints.UnauthorizedException('You must authenticate!' )
      user_from_email = model.User.query(model.User.email == user.email()).get()
      if user_from_email is None:
        raise endpoints.UnauthorizedException('You must sign-in!')
      # Todo: Check permissions
      my_model.put()
      return my_model


  @Document.query_method(user_required=True,query_fields=('about_kind','about_item', 'limit', 'order', 'pageToken'),path='documents', name='documents.list')
  def DocumentList(self, query):
    return query      

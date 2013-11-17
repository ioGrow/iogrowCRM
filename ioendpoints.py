import endpoints
from google.appengine.ext import ndb
from google.appengine.api import search 

from protorpc import remote
from endpoints_proto_datastore.ndb import EndpointsAliasProperty
from endpoints_proto_datastore.ndb import EndpointsModel
from iomodels.crmengine.accounts import Account
from iomodels.crmengine.contacts import Contact
from iomodels.crmengine.campaigns import Campaign
from iomodels.crmengine.notes import Note,Topic
from iomodels.crmengine.tasks import Task
from iomodels.crmengine.opportunities import Opportunity
from iomodels.crmengine.events import Event

from iomodels.crmengine.shows import Show

from iomodels.crmengine.leads import Lead
from iomodels.crmengine.cases import Case

from model import User,Userinfo,Group,Member,Permission
import model
import logging
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
OBJECTS = {'Account': Account,'Contact': Contact}

class SearchRequest(messages.Message):
    q = messages.StringField(1)
    limit = messages.IntegerField(2)
    pageToken = messages.StringField(3)

class SearchResult(messages.Message):
    id = messages.StringField(1)
    title = messages.StringField(2)
    type = messages.StringField(3)
    rank = messages.IntegerField(4)


class SearchResults(messages.Message):
   
    items = messages.MessageField(SearchResult, 1, repeated=True)
    nextPageToken = messages.StringField(2)

class AuthorSchema(messages.Message):

    google_user_id = messages.StringField(1)
    display_name = messages.StringField(2)
    google_public_profile_url = messages.StringField(3)
    photo = messages.StringField(4)

class DiscussionAboutSchema(messages.Message):

    kind = messages.StringField(1)
    id = messages.IntegerField(2)
    name = messages.StringField(3)
    
# Customized Discussion Response for notes.get API
class DiscussionResponse(messages.Message):
    
    id = messages.IntegerField(1)
    entityKey = messages.StringField(2)
    title = messages.StringField(3)
    content = messages.StringField(4)
    comments = messages.IntegerField(5)
    about = messages.MessageField(DiscussionAboutSchema,6)
    author = messages.MessageField(AuthorSchema,7)


@endpoints.api(name='crmengine', version='v1', description='I/Ogrow CRM APIs',allowed_client_ids=[CLIENT_ID,
                                   endpoints.API_EXPLORER_CLIENT_ID],scopes=SCOPES)
class CrmEngineApi(remote.Service):

  ID_RESOURCE = endpoints.ResourceContainer(
            message_types.VoidMessage,
            id=messages.IntegerField(1, variant=messages.Variant.INT32))
  
  
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
      my_model.owner = user_from_email.google_user_id
      my_model.organization = user_from_email.organization
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
    my_model.owner = user_from_email.key
    


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
      
      


      my_model.put()
      return my_model
  @Account.method(request_fields=('id',),path='accounts/{id}', http_method='GET', name='accounts.get')
  def AccountGet(self, my_model):
    if not my_model.from_datastore:
      raise endpoints.NotFoundException('Account not found.')
    return my_model

  @Account.query_method(user_required=True,query_fields=('limit', 'order', 'pageToken'),path='accounts', name='accounts.list')
  def AccountList(self, query):
      user = endpoints.get_current_user()
      if user is None:
          raise endpoints.UnauthorizedException('You must authenticate!' )
      user_from_email = model.User.query(model.User.email == user.email()).get()
      if user_from_email is None:
        raise endpoints.UnauthorizedException('You must sign-in!' )
      return query.filter(ndb.OR(Account.owner==user_from_email.google_user_id,Account.collaborators_ids==user_from_email.google_user_id)).order(Account._key)







  


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
            note = Note.get_by_id(request.id)
            about_item_id = int(note.about_item)
            try:
                about_object = OBJECTS[note.about_kind].get_by_id(about_item_id)
                if note.about_kind == 'Contact' or note.about_kind == 'Lead':
                    about_name = about_object.firstname + ' ' + about_object.lastname
                else:
                    about_name = about_object.name
                about_response = DiscussionAboutSchema(kind=note.about_kind,
                                                       id=about_item_id,
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

  # HKA 4.11.2013 Add Opportuity APIs
  @Opportunity.method(user_required=True,path='opportunities',http_method='POST',name='opportunities.insert')
  def OpportunityInsert(self, my_model):
    user = endpoints.get_current_user()
    if user is  None :
      raise endpoints.UnauthorizedException('You must be aunthenticated')
    user_from_email = model.User.query(model.User.email == user.email()).get()
    if user_from_email is  None :
      raise endpoints.UnauthorizedException('You must sign-in ')
    my_model.owner = user_from_email.key
    my_model.put()
    return my_model
  
  @Opportunity.method(request_fields=('id',),path='opportunities/{id}', http_method='GET', name='opportunities.get')
  def OpportunityGet(self, my_model):
    if not my_model.from_datastore:
      raise endpoints.NotFoundException('Opportunity not found')
    return my_model
  
  @Opportunity.query_method(user_required=True,query_fields=('description','amount','limit', 'order', 'pageToken'),path='opportunities',name='opportunities.list')
  def OpportunityList(self,query):
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

# HKA 06.11.2013 Add Opportuity APIs
  @Lead.method(user_required=True,path='leads',http_method='POST',name='leads.insert')
  def LeadInsert(self, my_model):
    user = endpoints.get_current_user()
    if user is  None :
      raise endpoints.UnauthorizedException('You must be aunthenticated')
    user_from_email = model.User.query(model.User.email == user.email()).get()
    if user_from_email is None:
      raise endpoints.UnauthorizedException('You must sign-in ')
    my_model.owner = user_from_email.key
    my_model.put()
    return my_model
  
  @Lead.method(request_fields=('id',),path='leads/{id}', http_method='GET', name='leads.get')
  def LeadGet(self, my_model):
    if not my_model.from_datastore:
      raise endpoints.NotFoundException('Lead not found')
    return my_model
  
  @Lead.query_method(user_required=True,query_fields=('limit', 'order', 'pageToken'),path='leads',name='leads.list')
  def LeadList(self,query):
     return query
# HKA 07.11.2013 Add Cases APIs
  @Case.method(user_required=True,path='cases',http_method='POST',name='cases.insert')
  def CaseInsert(self, my_model):
    user = endpoints.get_current_user()
    if user is  None :
      raise endpoints.UnauthorizedException('You must be aunthenticated')
    user_from_email = model.User.query(model.User.email == user.email()).get()
    if user_from_email is None:
      raise endpoints.UnauthorizedException('You must sign-in ')
    my_model.owner = user_from_email.key
    my_model.put()
    return my_model
  
  @Case.method(request_fields=('id',),path='cases/{id}', http_method='GET', name='cases.get')
  def CaseGet(self, my_model):
    if not my_model.from_datastore:
      raise endpoints.NotFoundException('Case not found')
    return my_model
  
  @Case.query_method(user_required=True,query_fields=('limit', 'order', 'pageToken'),path='cases',name='cases.list')
  def CaseList(self,query):
     return query
#HKA 07.11.2013   Add Campaign APIs
  @Campaign.method(user_required=True,path='campaigns',http_method='POST',name='campaigns.insert')
  def CampaignInsert(self, my_model):
    user = endpoints.get_current_user()
    if user is  None :
      raise endpoints.UnauthorizedException('You must be aunthenticated')
    user_from_email = model.User.query(model.User.email == user.email()).get()
    if user_from_email is None:
      raise endpoints.UnauthorizedException('You must sign-in ')
    my_model.owner = user_from_email.key
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


          
      



      
      
      
      

  
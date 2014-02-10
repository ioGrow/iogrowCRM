"""

This file is the main part of ioGrow API. It contains all request, response
classes add to calling methods.

"""
# Standard libs
import pprint
import logging
import httplib2
import json
import datetime
import time

# Google libs
from google.appengine.ext import ndb
from google.appengine.api import search
from google.appengine.api import memcache
from google.appengine.datastore.datastore_query import Cursor
from google.appengine.api import mail
from oauth2client.client import flow_from_clientsecrets
from oauth2client.tools import run
from apiclient.discovery import build
from apiclient import errors
from protorpc import remote
from protorpc import messages
from protorpc import message_types
import endpoints

# Third party libs
from endpoints_proto_datastore.ndb import EndpointsModel

# Our libs
from iograph import InfoNode, Edge
from iomodels.crmengine.accounts import Account
from iomodels.crmengine.contacts import Contact
from iomodels.crmengine.notes import Note,Topic
from iomodels.crmengine.tasks import Task
from iomodels.crmengine.tags import Tag
from iomodels.crmengine.opportunities import Opportunity
from iomodels.crmengine.events import Event
from iomodels.crmengine.documents import Document
from iomodels.crmengine.shows import Show
from iomodels.crmengine.leads import Lead
from iomodels.crmengine.cases import Case
from iomodels.crmengine.products import Product
from iomodels.crmengine.comments import Comment
from iomodels.crmengine.opportunitystage import Opportunitystage
from iomodels.crmengine.leadstatuses import Leadstatus
from iomodels.crmengine.casestatuses import Casestatus
from iomodels.crmengine.feedbacks import Feedback
from iomodels.crmengine.needs import Need
from iomodels.crmengine.emails import IOEmail
from iomodels.crmengine.tags import Tag

from model import User, Organization, Profile, Userinfo, Group, Member, Permission, Contributor, Companyprofile

# The ID of javascript client authorized to access to our api
# This client_id could be generated on the Google API console
CLIENT_ID = '987765099891.apps.googleusercontent.com'
SCOPES = [
            'https://www.googleapis.com/auth/userinfo.email', 
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/calendar'
            ]
OBJECTS = {
            'Account': Account,
            'Contact': Contact,
            'Case': Case,
            'Lead':Lead,
            'Opportunity':Opportunity,
            'Show':Show,
            'Feedback':Feedback
         }
FOLDERS = {
            'Account': 'accounts_folder',
            'Contact': 'contacts_folder',
            'Lead': 'leads_folder',
            'Opportunity':'opportunities_folder',
            'Case':'cases_folder',
            'Show':'shows_folder',
            'Feedback':'feedbacks_folder'
        }

DISCUSSIONS = {
                'Task': {
                            'title':'task',
                            'url':'/#/tasks/show/'
                        },
                'Event':{
                            'title':'event',
                            'url':'/#/events/show/'
                        },
                 'Note':{
                            'title':'discussion',
                            'url': '/#/notes/show/'
                        }
              }
 # The message class that defines the author schema
class AuthorSchema(messages.Message):
    google_user_id = messages.StringField(1)
    display_name = messages.StringField(2)
    google_public_profile_url = messages.StringField(3)
    photo = messages.StringField(4)
    edgeKey = messages.StringField(5)
# The message class that defines the related to discussion about
class DiscussionAboutSchema(messages.Message):
    kind = messages.StringField(1)
    id = messages.StringField(2)
    name = messages.StringField(3)

class TagSchema(messages.Message):
    name  = messages.StringField(1)
    color = messages.StringField(2)
    edgeKey = messages.StringField(3)


class TaskSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    title = messages.StringField(3)
    due = messages.StringField(4)
    status = messages.StringField(5)
    status_color = messages.StringField(6)
    status_label = messages.StringField(7)
    comments = messages.IntegerField(8)
    about = messages.MessageField(DiscussionAboutSchema,9)
    created_by = messages.MessageField(AuthorSchema,10)
    completed_by = messages.MessageField(AuthorSchema,11)
    tags = messages.MessageField(TagSchema,12, repeated = True)
    assignees = messages.MessageField(AuthorSchema,13, repeated = True)
    created_at = messages.StringField(14)
    updated_at = messages.StringField(15)

class TaskRequest(messages.Message):
    limit = messages.IntegerField(1)
    pageToken = messages.StringField(2)
    order = messages.StringField(3)
    status = messages.StringField(4)
    tags = messages.StringField(5,repeated = True)
    owner = messages.StringField(6)
    assignee = messages.StringField(7)
class TaskListResponse(messages.Message):
    items = messages.MessageField(TaskSchema, 1, repeated=True)
    nextPageToken = messages.StringField(2)

class EdgeSchema(messages.Message):
    id = messages.StringField(1)
    entityKey  = messages.StringField(2)
    start_node = messages.StringField(3)
    end_node = messages.StringField(4)
    kind = messages.StringField(5)
class EdgeRequest(messages.Message):
    start_node = messages.StringField(1)
    end_node = messages.StringField(2)
    kind = messages.StringField(3)
    inverse_edge = messages.StringField(4)
class EdgesRequest(messages.Message):
    items = messages.MessageField(EdgeRequest, 1 , repeated=True)
class EdgesResponse(messages.Message):
    items = messages.MessageField(EdgeSchema, 1 , repeated=True)
# The message class that defines Record schema for InfoNode attributes
class RecordSchema(messages.Message):
    field = messages.StringField(1)
    value = messages.StringField(2)
    property_type = messages.StringField(3,default='StringProperty')
    is_indexed = messages.BooleanField(4)
class InfoNodeSchema(messages.Message):
    kind = messages.StringField(1,required=True)
    fields = messages.MessageField(RecordSchema, 2, repeated=True)
    parent = messages.StringField(3,required=True)
class InfoNodeResponse(messages.Message):
    id = messages.StringField(1)
    entityKey  = messages.StringField(2)
    kind = messages.StringField(3)
    fields = messages.MessageField(RecordSchema, 4, repeated=True)
    parent = messages.StringField(5)
#TODOS
# ADD PHONE SCHEMA, LISTOFPHONES SCHEMA, EMAILS, ADDRESSES,...
# ADD ANOTHER SCHEMA FOR CUSTOM FIELDS
class InfoNodeConnectionSchema(messages.Message):
    kind = messages.StringField(1,required=True)
    items = messages.MessageField(InfoNodeResponse, 2, repeated=True)
class InfoNodeListRequest(messages.Message):
    parent = messages.StringField(1,required=True)
    connections = messages.StringField(2,repeated=True)
class InfoNodeListResponse(messages.Message):
    items = messages.MessageField(InfoNodeConnectionSchema, 1, repeated=True)
# The message class that defines the SendEmail Request attributes
class EmailRequest(messages.Message):
    sender = messages.StringField(1)
    to = messages.StringField(2)
    cc = messages.StringField(3)
    bcc = messages.StringField(4)
    subject = messages.StringField(5)
    body = messages.StringField(6)
    about_kind = messages.StringField(7)
    about_item = messages.StringField(8)

# The message class that defines the Search Request attributes
class SearchRequest(messages.Message):
    q = messages.StringField(1, required= True)
    limit = messages.IntegerField(2)
    pageToken = messages.StringField(3)

# The message class that defines the Search Result attributes
class SearchResult(messages.Message):
    id = messages.StringField(1)
    title = messages.StringField(2)
    type = messages.StringField(3)
    rank = messages.IntegerField(4)

# The message class that defines a set of search results
class SearchResults(messages.Message):
    items = messages.MessageField(SearchResult, 1, repeated=True)
    nextPageToken = messages.StringField(2)

# The message class that defines the Live Search Result attributes
class LiveSearchResult(messages.Message):
    id = messages.StringField(1)
    title = messages.StringField(2)
    organization = messages.StringField(3)
    type = messages.StringField(4)
    rank = messages.IntegerField(5)

# The message class that defines a set of search results
class LiveSearchResults(messages.Message):
    items = messages.MessageField(LiveSearchResult, 1, repeated=True)
    nextPageToken = messages.StringField(2)

# The message class that defines the accounts.search response 
class AccountSearchResult(messages.Message):
    id = messages.StringField(1)
    entityKey  = messages.StringField(2)
    name = messages.StringField(3)

# The message class that defines a set of accounts.search results
class AccountSearchResults(messages.Message):
    items = messages.MessageField(AccountSearchResult, 1, repeated=True)
    nextPageToken = messages.StringField(2)

# The message class that defines the contacts.search response 
class ContactSearchResult(messages.Message):
    id = messages.StringField(1)
    entityKey  = messages.StringField(2)
    firstname = messages.StringField(3)
    lastname = messages.StringField(4)
    account_name = messages.StringField(5)
    account = messages.StringField(6)
    position = messages.StringField(7)

# The message class that defines a set of contacts.search results
class ContactSearchResults(messages.Message):
    items = messages.MessageField(ContactSearchResult, 1, repeated=True)
    nextPageToken = messages.StringField(2)

# The message class that defines the opportunities.search response 
class OpportunitySearchResult(messages.Message):
    id = messages.StringField(1)
    entityKey  = messages.StringField(2)
    title = messages.StringField(3)
    amount = messages.IntegerField(4)
    account_name = messages.StringField(5)

# The message class that defines a set of contacts.search results
class OpportunitySearchResults(messages.Message):
    items = messages.MessageField(OpportunitySearchResult, 1, repeated=True)
    nextPageToken = messages.StringField(2)

# The message class that defines the cases.search response 
class CaseSearchResult(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    title = messages.StringField(3)
    contact_name = messages.StringField(4)
    account_name = messages.StringField(5)
    status = messages.StringField(6)

# The message class that defines a set of cases.search results
class CaseSearchResults(messages.Message):
    items = messages.MessageField(CaseSearchResult, 1, repeated=True)
    nextPageToken = messages.StringField(2)
# The message class that defines the leads.search response 
class LeadSearchResult(messages.Message):
    id = messages.StringField(1)
    entityKey  = messages.StringField(2)
    firstname = messages.StringField(3)
    lastname = messages.StringField(4)
    company = messages.StringField(5)
    position = messages.StringField(6)
    status = messages.StringField(7)
# The message class that defines a set of leads.search results
class LeadSearchResults(messages.Message):
    items = messages.MessageField(LeadSearchResult, 1, repeated=True)
    nextPageToken = messages.StringField(2)
# The message class that defines a response for leads.convert api
class ConvertedLead(messages.Message):
    id = messages.IntegerField(1)
# The message class that defines the schema of Attachment 
class AttachmentSchema(messages.Message):
    id = messages.StringField(1)
    title = messages.StringField(2)
    mimeType = messages.StringField(3)
    embedLink = messages.StringField(4)
# The message class that defines the attributes of request to attache multiples files 
class MultipleAttachmentRequest(messages.Message):
    about_kind = messages.StringField(1)
    about_item = messages.StringField(2)
    items = messages.MessageField(AttachmentSchema, 3, repeated=True)


# The message class that defines Discussion Response for notes.get API
class DiscussionResponse(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    title = messages.StringField(3)
    content = messages.StringField(4)
    comments = messages.IntegerField(5)
    about = messages.MessageField(DiscussionAboutSchema,6)
    author = messages.MessageField(AuthorSchema,7)
# The message class that defines Customized Task Response for tasks.get API
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
# The message class that defines Customized Event Response for events.get API
class EventResponse(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    title = messages.StringField(3)
    starts_at = messages.StringField(4)
    ends_at = messages.StringField(5)
    where = messages.StringField(6)
    comments = messages.IntegerField(7)
    about = messages.MessageField(DiscussionAboutSchema,8)
    author = messages.MessageField(AuthorSchema,9)
# The message class that defines the shows.search response 
class ShowSearchResult(messages.Message):
    id = messages.StringField(1)
    entityKey  = messages.StringField(2)
    title = messages.StringField(3)
    starts_at = messages.StringField(4)
    ends_at = messages.StringField(5)
    status = messages.StringField(6)
# The message class that defines a set of shows.search results
class ShowSearchResults(messages.Message):
    items = messages.MessageField(ShowSearchResult, 1, repeated=True)
    nextPageToken = messages.StringField(2)
# The message class that defines the feedbacks.search response 
class FeedbackSearchResult(messages.Message):
    id = messages.StringField(1)
    entityKey  = messages.StringField(2)
    title = messages.StringField(3)
    type_feedback = messages.StringField(4)
    source = messages.StringField(5)
    status = messages.StringField(6)
# The message class that defines a set of feedbacks.search results
class FeedbackSearchResults(messages.Message):
    items = messages.MessageField(FeedbackSearchResult, 1, repeated=True)
    nextPageToken = messages.StringField(2)
# The message class that defines the feedbacks.search response 
class AddressSchema(messages.Message):
    lat = messages.StringField(1)
    lon = messages.StringField(2)
class CompanyProfileSchema(messages.Message):
    id = messages.StringField(1)
    name = messages.StringField(2)
    addresses = messages.MessageField(AddressSchema, 3, repeated=True)   
class CompanyProfileResponse(messages.Message):
    items = messages.MessageField(CompanyProfileSchema, 1, repeated=True)
    nextPageToken = messages.StringField(2)    
    

# The message class that defines a set of feedbacks.search results
class FeedbackSearchResults(messages.Message):
    items = messages.MessageField(FeedbackSearchResult, 1, repeated=True)
    nextPageToken = messages.StringField(2)


class EndpointsHelper(EndpointsModel):
    INVALID_TOKEN = 'Invalid token'
    INVALID_GRANT = 'Invalid grant'
    NO_ACCOUNT = 'You don\'t have a i/oGrow account'
    @classmethod
    def require_iogrow_user(cls):
        user = endpoints.get_current_user()
        if user is None:
            raise endpoints.UnauthorizedException(cls.INVALID_TOKEN)
        user_from_email = User.query(User.email == user.email()).get()
        if user_from_email is None:
            raise endpoints.UnauthorizedException(cls.NO_ACCOUNT)
        return user_from_email

    @classmethod
    def insert_folder(cls,user,folder_name,kind):
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
    def move_folder(cls,user,folder,new_kind):
        
            credentials = user.google_credentials
            http = credentials.authorize(httplib2.Http(memcache))
            service = build('drive', 'v2', http=http)
            organization = user.organization.get()
            new_parent = eval('organization.'+FOLDERS[new_kind])
            params = {
              "parents": 
              [
                {
                  "id": new_parent
                }
              ]
            }

            moved_folder = service.files().patch(fileId=folder,body=params,fields='id').execute()
        
            return moved_folder


@endpoints.api(name='iogrowlive', version='v1', description='i/oGrow Live APIs',allowed_client_ids=[CLIENT_ID,
                                   endpoints.API_EXPLORER_CLIENT_ID],scopes=SCOPES)
class LiveApi(remote.Service):

  ID_RESOURCE = endpoints.ResourceContainer(
            message_types.VoidMessage,
            id=messages.StringField(1))
  @Feedback.method(user_required=True,request_fields=('show_url','type_url', 'name','content'), path='feedbacks',http_method='POST',name='feedbacks.insert')
  def insert_feedback_live(self, my_model):
      user_from_email = EndpointsHelper.require_iogrow_user()
      who = Userinfo()
      who.display_name = user_from_email.google_display_name
      who.photo = user_from_email.google_public_profile_photo_url
      who.email = user_from_email.email

      my_model.who = who
      my_model.status = "Pending"
      if my_model.type_url == 'show' :
        show_id = int(my_model.show_url.split("/")[5])
        show = Show.get_by_id(show_id)
        my_model.related_to = show.key
        my_model.organization = show.organization
        my_model.owner = show.owner
        organization = show.organization.get()
        my_model.organization_name = organization.name
        my_model.source = "i/oGrow Live"
        my_model.put()
      if my_model.type_url == 'company':
        org_id = int(my_model.show_url.split("/")[5])
        org = Organization.get_by_id(org_id)
        org_key = org.key
        companyprof = Companyprofile.query(Companyprofile.organizationid==org_id).get()
        my_model.organization = org_key
        my_model.owner = companyprof.owner
        my_model.organization_name = companyprof.name
        my_model.source = "i/oGrow Live Company Page"
        my_model.put()

      return my_model
  @endpoints.method(SearchRequest, CompanyProfileResponse,
                      path='companies', http_method='POST',
                      name='companies.list')
  def list_comapnies(self, request):
      companies = Companyprofile.query().fetch()
      company_list = list()
      for company in companies:
          if company.addresses:
              addresses = list()
              for address in company.addresses:
                  latlon = AddressSchema(lat = address.lat,lon = address.lon)
                  addresses.append(latlon)
              company_profile = CompanyProfileSchema(id=str(company.organizationid),
                                                 name=company.name,
                                                 addresses=addresses)
              company_list.append(company_profile)
      return CompanyProfileResponse(items = company_list,nextPageToken=None)
  # Search API
  @endpoints.method(SearchRequest, LiveSearchResults,
                      path='search', http_method='POST',
                      name='search')
  def live_search_method(self, request):
      index = search.Index(name="ioGrowLiveIndex")
      #Show only objects where you have permissions
      query_string = request.q 
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
                      if e.name in ["title","organization","type"]:
                          kwargs[e.name]=e.value
                  search_results.append(LiveSearchResult(**kwargs))
                  
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
      return LiveSearchResults(items = search_results,nextPageToken=next_cursor)

@endpoints.api(name='androgrow', version='v1', description='AndroGrow APIs',allowed_client_ids=[CLIENT_ID,
                                   endpoints.API_EXPLORER_CLIENT_ID],scopes=SCOPES)
class EndGrow(remote.Service):
    @endpoints.method(SearchRequest, SearchRequest,
                          path='something/insert', http_method='POST',
                          name='something.insert')
    def something(self, request):
          
          return SearchRequest(q=request.q)
@endpoints.api(name='crmengine', version='v1', description='I/Ogrow CRM APIs',allowed_client_ids=[CLIENT_ID,
                                   endpoints.API_EXPLORER_CLIENT_ID],scopes=SCOPES)
class CrmEngineApi(remote.Service):

  ID_RESOURCE = endpoints.ResourceContainer(
            message_types.VoidMessage,
            id=messages.StringField(1))
  #Edges APIs
  # edges.insert api
  @endpoints.method(EdgesRequest, EdgesResponse,
                      path='edges/insert', http_method='POST',
                      name='edges.insert')
  def edges_insert(self, request):
      items = list()
      for item in request.items:
          start_node = ndb.Key(urlsafe=item.start_node)
          end_node = ndb.Key(urlsafe=item.end_node)
          
          edge_key = Edge.insert(start_node=start_node,
                                 end_node = end_node,
                                 kind = item.kind,
                                 inverse_edge = item.inverse_edge)
          items.append(EdgeSchema(id=str( edge_key.id() ), 
                                     entityKey = edge_key.urlsafe(),
                                     kind = item.kind,
                                     start_node = item.start_node,
                                     end_node= item.end_node ))
      return EdgesResponse(items=items)
  #Info Node APIs
  # infonode.insert api
  @endpoints.method(InfoNodeSchema, InfoNodeResponse,
                      path='infonode/insert', http_method='POST',
                      name='infonode.insert')
  def infonode_insert(self, request):
      parent_key = ndb.Key(urlsafe=request.parent)
      node = InfoNode(kind = request.kind, parent=parent_key)
      for record in request.fields:
          setattr(node,record.field,record.value)
      entityKey = node.put()
      return InfoNodeResponse(entityKey=entityKey.urlsafe(),kind=node.kind,fields=request.fields)
  # infonode.list api
  @endpoints.method(InfoNodeListRequest, InfoNodeListResponse,
                      path='infonode/list', http_method='POST',
                      name='infonode.list')
  def infonode_list_beta(self, request):
      parent_key = ndb.Key(urlsafe=request.parent)
      nodes = InfoNode.query(InfoNode.parent==parent_key).fetch()
      connections_dict = {}
      for node in nodes:
          if node.kind not in connections_dict.keys():
              connections_dict[node.kind] = list()
          node_fields = list()
          for key,value in node.to_dict().iteritems():
              if key not in['kind','parent','created_at','updated_at']:
                  record = RecordSchema(field=key,
                                    value = node.to_dict()[key])
                  node_fields.append(record)
          info_node = InfoNodeResponse(id = str( node.key.id() ),
                                       entityKey = node.key.urlsafe(),
                                       kind = node.kind,
                                       fields = node_fields,
                                       parent = node.parent.urlsafe()) 
          
          
          connections_dict[node.kind].append(info_node)
      connections_list = list() 
      for key,value in connections_dict.iteritems():
          if request.connections:
              if key in request.connections:
                  infonodeconnection = InfoNodeConnectionSchema(kind=key,items=value)
                  connections_list.append(infonodeconnection) 
          else:
              infonodeconnection = InfoNodeConnectionSchema(kind=key,items=value)
              connections_list.append(infonodeconnection)  
      
      return InfoNodeListResponse(items=connections_list) 
  
  @endpoints.method(TaskRequest, TaskListResponse,
                      path='tasks/listv2', http_method='POST',
                      name='tasks.listv2')
  def tasks_list_beta(self, request):
      user_from_email = EndpointsHelper.require_iogrow_user()
      curs = Cursor(urlsafe=request.pageToken)
      filtered_tasks = list()
      if request.limit:
          limit = int(request.limit)
      else:
          limit = 10
      items = list()
      date_to_string = lambda x: x.strftime("%Y-%m-%d") if x else ""
      date_time_to_string = lambda x: x.strftime("%Y-%m-%dT%H:%M:00.000") if x else ""
      filtered_tasks = list()
      you_can_loop = True
      count = 0
      while you_can_loop:
          if request.order:
              ascending = True
              if request.order.startswith('-'):
                  order_by = request.order[1:]
                  ascending = False
              else:
                  order_by = request.order
              
              attr = Task._properties.get(order_by)
              if attr is None:
                  raise AttributeError('Order attribute %s not defined.' % (attr_name,))
              if ascending:
                  tasks, next_curs, more = Task.query().filter(Task.organization==user_from_email.organization).order(+attr).fetch_page(limit, start_cursor=curs)
              else:
                  tasks, next_curs, more = Task.query().filter(Task.organization==user_from_email.organization).order(-attr).fetch_page(limit, start_cursor=curs)

          else:
              tasks, next_curs, more = Task.query().filter(Task.organization==user_from_email.organization).fetch_page(limit, start_cursor=curs)
          for task in tasks:
              if count<= limit:
                  is_filtered = True
                  if task.access == 'private' and task.owner!=user_from_email.google_user_id:
                      end_node_set = [user_from_email.key]
                      if not Edge.find(start_node=task.key,kind='permissions',end_node_set=end_node_set,operation='AND'):
                          is_filtered = False
                  if request.status and task.status!=request.status and is_filtered:
                      is_filtered = False 
                  if request.tags and is_filtered:
                      end_node_set = [ndb.Key(urlsafe=tag_key) for tag_key in request.tags]
                      if not Edge.find(start_node=task.key,kind='tags',end_node_set=end_node_set,operation='AND'):
                          is_filtered = False
                  if request.assignee and is_filtered:
                      end_node_set = [user_from_email.key]
                      if not Edge.find(start_node=task.key,kind='assignees',end_node_set=end_node_set,operation='AND'):
                          is_filtered = False
                  if request.owner and task.owner!=request.owner and is_filtered:
                      is_filtered = False
                  if is_filtered:
                      count = count + 1
                      #list of tags related to this task
                      edge_list = Edge.list(start_node=task.key,kind='tags')
                      tag_list = list()
                      for edge in edge_list:
                          tag_list.append( TagSchema(edgeKey = edge.key.urlsafe(),
                                          name = edge.end_node.get().name,
                                          color = edge.end_node.get().color))
                      #list of tags related to this task
                      edge_list = Edge.list(start_node=task.key,kind='assignees')
                      assignee_list = list()
                      for edge in edge_list:
                          assignee_list.append( AuthorSchema(edgeKey = edge.key.urlsafe(),
                                          google_user_id = edge.end_node.get().google_user_id,
                                          display_name = edge.end_node.get().google_display_name,
                                          google_public_profile_url = edge.end_node.get().google_public_profile_url,
                                          photo = edge.end_node.get().google_public_profile_photo_url) )

                      status_color = 'gray'
                      status_label = 'pending'
                      if task.due:
                          now = datetime.datetime.now()
                          diff = task.due - now
                          if diff.days>=0 and diff.days<=2:
                              status_color = 'orange'
                              status_label = 'soon: due in '+ str(diff.days) + ' days'
                          if diff.days<0:
                              status_color = 'red'
                              status_label = 'overdue'
                      if task.status == 'open':
                          status_color = 'green'
                          status_label = 'work in progress'
                      if task.status == 'closed':
                          status_color = 'white'
                          status_label = 'closed'

                                


                      task_schema = TaskSchema(
                                  id = str( task.key.id() ),
                                  entityKey = task.key.urlsafe(),
                                  title = task.title,
                                  status = task.status,
                                  status_color = status_color,
                                  status_label = status_label,
                                  comments = 0,
                                  about = DiscussionAboutSchema(),
                                  created_by = AuthorSchema(),
                                  completed_by = AuthorSchema(),
                                  tags = tag_list,
                                  assignees = assignee_list,
                                  created_at = date_time_to_string(task.created_at),
                                  updated_at = date_time_to_string(task.updated_at)
                                )
                      if task.due:
                          task_schema.due =  date_to_string(task.due)
                      items.append(task_schema)   
          if (count == limit):
              you_can_loop = False
          print '@@@@@@@@@@@@*********#######'
          print more
          print next_curs
          if more and next_curs:
              curs = next_curs

          else:
              you_can_loop = False
      print 'After the loop'
      print more
      print next_curs 
      
      if next_curs and more:
          next_curs_url_safe = next_curs.urlsafe() 
      else:
          next_curs_url_safe = None           
      return  TaskListResponse(items = items, nextPageToken = next_curs_url_safe)

  # Accounts APIs
  # accounts.insert api
  @Account.method(user_required=True,path='accounts', http_method='POST', name='accounts.insert')
  def AccountInsert(self, my_model):
      user_from_email = EndpointsHelper.require_iogrow_user()
      created_folder = EndpointsHelper.insert_folder(user_from_email,my_model.name,'Account')
      # Todo: Check permissions
      my_model.owner = user_from_email.google_user_id
      my_model.organization = user_from_email.organization
      my_model.folder = created_folder['id']
      my_model.put()
      return my_model
  # accounts.list api
  @Account.query_method(user_required=True,query_fields=('owner', 'limit', 'order', 'pageToken'),path='accounts', name='accounts.list')
  def Account_List(self, query):
      user_from_email = EndpointsHelper.require_iogrow_user()
      return query.filter(ndb.OR(ndb.AND(Account.access=='public',Account.organization==user_from_email.organization),Account.owner==user_from_email.google_user_id, Account.collaborators_ids==user_from_email.google_user_id)).order(Account._key)
  # accounts.get api
  @Account.method(request_fields=('id',),path='accounts/{id}', http_method='GET', name='accounts.get')
  def AccountGet(self, my_model):
    if not my_model.from_datastore:
      raise endpoints.NotFoundException('Account not found.')
    return my_model
  # accounts.update
  @Account.method(user_required=True,
                http_method='PUT', path='accounts/{id}', name='accounts.update')
  def AccountUpdate(self, my_model):
    user_from_email = EndpointsHelper.require_iogrow_user()
    # Todo: Check permissions
    #my_model.owner = user_from_email.google_user_id
    #my_model.organization =  user_from_email.organization

    my_model.put()
    return my_model
  # accounts.patch api
  @Account.method(user_required=True,
                http_method='PATCH', path='accounts/{id}', name='accounts.patch')
  def AccountPatch(self, my_model):
      user_from_email = EndpointsHelper.require_iogrow_user()
      # Todo: Check permissions
      if not my_model.from_datastore:
          raise endpoints.NotFoundException('Account not found.')
      patched_model_key = my_model.entityKey
      patched_model = ndb.Key(urlsafe=patched_model_key).get()
      print 'current model ***************'
      pprint.pprint(patched_model) 
      print 'to be updated ******************' 
      pprint.pprint(my_model) 
      properties = Account().__class__.__dict__
      for p in properties.keys():
          if (eval('patched_model.'+p) != eval('my_model.'+p))and(eval('my_model.'+p) and not(p in ['put','set_perm','put_index']) ):
                exec('patched_model.'+p+'= my_model.'+p)
      patched_model.put()
      return patched_model
  @Account.method(request_fields=('id',),
    response_message=message_types.VoidMessage,
    http_method ='DELETE',path='accounts/{id}',name='accounts.delete'
    )
  def AccountDelete(self,my_model):
    user_from_email=EndpointsHelper.require_iogrow_user()
    my_model.key.delete()
    return message_types.VoidMessage()
  
  
  # accounts.search api
  @endpoints.method(SearchRequest, AccountSearchResults,
                      path='accounts/search', http_method='POST',
                      name='accounts.search')
  def account_search(self, request):
      user_from_email = EndpointsHelper.require_iogrow_user()
      organization = str(user_from_email.organization.id())
      
      index = search.Index(name="GlobalIndex")
      #Show only objects where you have permissions
      query_string = request.q + ' type:Account AND (organization:' +organization+ ' AND (access:public OR (owner:'+ user_from_email.google_user_id +' OR collaborators:'+ user_from_email.google_user_id+')))'
      print query_string
      search_results = []
      count = 1
      if request.limit:
          limit = int(request.limit)
      else:
          limit = 10
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
                      'id' : scored_document.doc_id
                  }
                  for e in scored_document.fields:
                      if e.name in ["entityKey", "title"]:
                          if e.name == "title":
                              kwargs["name"] = e.value
                          else:
                              kwargs[e.name]=e.value
                  
                  search_results.append(AccountSearchResult(**kwargs))
                  
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
      return AccountSearchResults(items = search_results,nextPageToken=next_cursor) 
  # Contacts APIs
  # contacts.insert api
  @Contact.method(user_required=True,path='contacts', http_method='POST', name='contacts.insert')
  def ContactInsert(self, my_model):
      user_from_email = EndpointsHelper.require_iogrow_user()
      # OAuth flow
      folder_name = my_model.firstname + ' ' + my_model.lastname
      created_folder = EndpointsHelper.insert_folder(user_from_email,folder_name,'Contact')
      # Todo: Check permissions
      my_model.owner = user_from_email.google_user_id
      my_model.organization = user_from_email.organization
      my_model.folder = created_folder['id']
      my_model.put()
      return my_model
  # contacts.list api
  @Contact.query_method(user_required=True,query_fields=('owner','limit', 'order','account','account_name', 'pageToken'),path='contacts', name='contacts.list')
  def ContactList(self, query):
      user_from_email = EndpointsHelper.require_iogrow_user()
      return query.filter(ndb.OR(ndb.AND(Contact.access=='public',Contact.organization==user_from_email.organization),Contact.owner==user_from_email.google_user_id, Contact.collaborators_ids==user_from_email.google_user_id)).order(Contact._key)
  # contacts.get api        
  @Contact.method(request_fields=('id',),
                  path='contacts/{id}', http_method='GET', name='contacts.get')
  def ContactGet(self, my_model):
    if not my_model.from_datastore:
      raise endpoints.NotFoundException('Contact not found.')
    return my_model
  # contacts.update api
  @Contact.method(user_required=True,
                http_method='PUT', path='contacts/{id}', name='contacts.update')
  def ContactUpdate(self, my_model):
    user_from_email = EndpointsHelper.require_iogrow_user()
    # Todo: Check permissions
    #my_model.owner = user_from_email.google_user_id
    #my_model.organization =  user_from_email.organization

    my_model.put()
    return my_model
  
  # contacts.patch api
  @Contact.method(user_required=True,
                http_method='PATCH', path='contacts/{id}', name='contacts.patch')
  def ContactPatch(self, my_model):
      user_from_email = EndpointsHelper.require_iogrow_user()
      # Todo: Check permissions
      if not my_model.from_datastore:
          raise endpoints.NotFoundException('Contact not found.')
      patched_model_key = my_model.entityKey
      patched_model = ndb.Key(urlsafe=patched_model_key).get()
      properties = Contact().__class__.__dict__
      for p in properties.keys():
          if (eval('patched_model.'+p) != eval('my_model.'+p))and(eval('my_model.'+p) and not(p in ['put','set_perm','put_index']) ):
                exec('patched_model.'+p+'= my_model.'+p)
      patched_model.put()
      return patched_model
  @Contact.method(request_fields=('id',),
    response_message=message_types.VoidMessage,
    http_method ='DELETE',path='contacts/{id}',name='contacts.delete'
    )
  def ContactDelete(self,my_model):
    user_from_email=EndpointsHelper.require_iogrow_user()
    my_model.key.delete()
    return message_types.VoidMessage()
  
  #contacts.search api
  @endpoints.method(SearchRequest, ContactSearchResults,
                      path='contacts/search', http_method='POST',
                      name='contacts.search')
  def contact_search(self, request):
      user_from_email = EndpointsHelper.require_iogrow_user()
      organization = str(user_from_email.organization.id())
      
      index = search.Index(name="GlobalIndex")
      #Show only objects where you have permissions
      query_string = request.q + ' type:Contact AND (organization:' +organization+ ' AND (access:public OR (owner:'+ user_from_email.google_user_id +' OR collaborators:'+ user_from_email.google_user_id+')))'
      print query_string
      search_results = []
      count = 1
      if request.limit:
          limit = int(request.limit)
      else:
          limit = 10
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
                      'id' : scored_document.doc_id
                  }
                  for e in scored_document.fields:
                      if e.name in ["entityKey", "firstname","lastname","account","account_name","position"]:
                          kwargs[e.name]=e.value
                  
                  search_results.append(ContactSearchResult(**kwargs))
                  
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
      return ContactSearchResults(items = search_results,nextPageToken=next_cursor)
  # Opportunities APIs
  # opportunities.insert
  @Opportunity.method(user_required=True,path='opportunities',http_method='POST',name='opportunities.insert')
  def OpportunityInsert(self, my_model):
      user_from_email = EndpointsHelper.require_iogrow_user()
      # OAuth flow
      created_folder = EndpointsHelper.insert_folder(user_from_email,my_model.name,'Opportunity')
      # Todo: Check permissions
      my_model.owner = user_from_email.google_user_id
      my_model.organization = user_from_email.organization
      my_model.folder = created_folder['id']
      my_model.put()
      return my_model
  # opportunities.list api
  @Opportunity.query_method(user_required=True,query_fields=('limit', 'order', 'pageToken','owner','stagename', 'account','account_name','contact'),path='opportunities', name='opportunities.list')
  def opportunity_list(self, query):
      user_from_email = EndpointsHelper.require_iogrow_user()      
      return query.filter(ndb.OR(ndb.AND(Opportunity.access=='public',Opportunity.organization==user_from_email.organization),Opportunity.owner==user_from_email.google_user_id, Opportunity.collaborators_ids==user_from_email.google_user_id)).order(Opportunity._key)
  # opportunities.get api
  @Opportunity.method(request_fields=('id',),path='opportunities/{id}', http_method='GET', name='opportunities.get')
  def OpportunityGet(self, my_model):
    if not my_model.from_datastore:
      raise endpoints.NotFoundException('Opportunity not found')
    return my_model
  # opportunities.get api
  @Opportunity.method(user_required=True,
                http_method='PUT', path='opportunities/{id}', name='opportunities.update')
  def OpportunityUpdate(self, my_model):
    user_from_email = EndpointsHelper.require_iogrow_user()
    # Todo: Check permissions
    #my_model.owner = user_from_email.google_user_id
    #my_model.organization =  user_from_email.organization

    my_model.put()
    return my_model
  # opportunities.patch api 
  @Opportunity.method(user_required=True,
                http_method='PATCH', path='opportunities/{id}', name='opportunities.patch')
  def OpportunityPatch(self, my_model):
      user_from_email = EndpointsHelper.require_iogrow_user()
      # Todo: Check permissions
      my_model.put()
      return my_model
  @Opportunity.method(request_fields=('id',),
    response_message=message_types.VoidMessage,
    http_method ='DELETE',path='opportunities/{id}',name='opportunities.delete'
    )
  def OpportunityDelete(self,my_model):
    user_from_email=EndpointsHelper.require_iogrow_user()
    my_model.key.delete()
    return message_types.VoidMessage()
  # opportunities.search api 
  @endpoints.method(SearchRequest, OpportunitySearchResults,
                      path='opportunities/search', http_method='POST',
                      name='opportunities.search')
  def opportunities_search(self, request):
      user_from_email = EndpointsHelper.require_iogrow_user()
      organization = str(user_from_email.organization.id())
      
      index = search.Index(name="GlobalIndex")
      #Show only objects where you have permissions
      query_string = request.q + ' type:Opportunity AND (organization:' +organization+ ' AND (access:public OR (owner:'+ user_from_email.google_user_id +' OR collaborators:'+ user_from_email.google_user_id+')))'
      print query_string
      search_results = []
      count = 1
      if request.limit:
          limit = int(request.limit)
      else:
          limit = 10
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
                      'id' : scored_document.doc_id
                  }
                  for e in scored_document.fields:
                      if e.name in ["title","amount","account_name"]:
                          if e.name == "amount":
                              kwargs[e.name]=int(e.value)
                          else:    
                              kwargs[e.name]=e.value
                  
                  search_results.append(OpportunitySearchResult(**kwargs))
                  
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
      return OpportunitySearchResults(items = search_results,nextPageToken=next_cursor)
  #HKA 11.12.2013 Opportunitystage APIs
  @Opportunitystage.method(user_required=True,path='opportunitystage',http_method='POST',name='opportunitystages.insert')
  def OpportunitystageInsert(self,my_model):
    user_from_email = EndpointsHelper.require_iogrow_user()
    my_model.owner = user_from_email.google_user_id
    my_model.organization = user_from_email.organization
    my_model.put()
    return my_model
  @Opportunitystage.query_method(user_required=True,query_fields=('limit','order','pageToken'),path='opportunitystage',name='opportunitystages.list')
  def OpportunitystageList(self,query):
    user_from_email = EndpointsHelper.require_iogrow_user()
    return query.filter(Opportunitystage.organization==user_from_email.organization)
  @Opportunitystage.method(user_required=True,
    http_method='PATCH',path='opportunitystage/{id}',name='opportunitystages.patch')
  def OpportuntystagePatch(self,my_model):
    user_from_email = EndpointsHelper.require_iogrow_user()
    my_model.put()
    return my_model
  @Opportunitystage.method(request_fields=('id',),path='opportunitystage/{id}',http_method='GET',name='opportunitystages.get')
  def OpportunitystageGet(self,my_model):
    if not my_model.from_datastore:
      raise('Opportunity stage not found')
    return my_model
  @Opportunitystage.method(request_fields=('id',),
    response_message=message_types.VoidMessage,
    http_method ='DELETE',path='opportunitystage/{id}',name='opportunitystages.delete'
    )
  def OpportunitystageDelete(self,my_model):
    user_from_email=EndpointsHelper.require_iogrow_user()
    my_model.key.delete()
    return message_types.VoidMessage()


  # Leads APIs
  # leads.insert api
  @Lead.method(user_required=True,path='leads',http_method='POST',name='leads.insert')
  def LeadInsert(self, my_model):
      user_from_email = EndpointsHelper.require_iogrow_user()
      # OAuth flow
      folder_name = my_model.firstname + ' ' + my_model.lastname
      created_folder = EndpointsHelper.insert_folder(user_from_email,folder_name,'Lead')
      # Todo: Check permissions
      my_model.owner = user_from_email.google_user_id
      my_model.organization = user_from_email.organization
      my_model.folder = created_folder['id']
      my_model.put()
      return my_model

  # leads.list api
  @Lead.query_method(user_required=True,query_fields=('limit','owner','status','feedback','show','order', 'pageToken'),path='leads',name='leads.list')
  def LeadList(self,query):
      user_from_email = EndpointsHelper.require_iogrow_user()
      return query.filter(ndb.OR(ndb.AND(Lead.access=='public',Lead.organization==user_from_email.organization),Lead.owner==user_from_email.google_user_id, Lead.collaborators_ids==user_from_email.google_user_id)).order(Lead._key)
  # leads.get api
  @Lead.method(request_fields=('id',),path='leads/{id}', http_method='GET', name='leads.get')
  def LeadGet(self, my_model):
    if not my_model.from_datastore:
      raise endpoints.NotFoundException('Lead not found')
    return my_model
  # leads.update api
  @Lead.method(user_required=True,
                http_method='PUT', path='leads/{id}', name='leads.update')
  def LeadUpdate(self, my_model):
    user_from_email = EndpointsHelper.require_iogrow_user()
    # Todo: Check permissions
    #my_model.owner = user_from_email.google_user_id
    #my_model.organization =  user_from_email.organization

    my_model.put()
    return my_model
  # leads.patch api
  @Lead.method(user_required=True,
                http_method='PATCH', path='leads/{id}', name='leads.patch')
  def LeadPatch(self, my_model):
      user_from_email = EndpointsHelper.require_iogrow_user()
      # Todo: Check permissions
      if not my_model.from_datastore:
          raise endpoints.NotFoundException('Lead not found.')
      patched_model_key = my_model.entityKey
      patched_model = ndb.Key(urlsafe=patched_model_key).get()
      properties = Lead().__class__.__dict__
      for p in properties.keys():
          if (eval('patched_model.'+p) != eval('my_model.'+p))and(eval('my_model.'+p) and not(p in ['put','set_perm','put_index']) ):
                exec('patched_model.'+p+'= my_model.'+p)
      patched_model.put()
      return patched_model
  @Lead.method(request_fields=('id',),
    response_message=message_types.VoidMessage,
    http_method ='DELETE',path='leads/{id}',name='leads.delete'
    )
  def LeadDelete(self,my_model):
    user_from_email=EndpointsHelper.require_iogrow_user()
    my_model.key.delete()
    return message_types.VoidMessage()  
  # leads.convert api
  @endpoints.method(ID_RESOURCE, ConvertedLead,
                      path='leads/convert/{id}', http_method='POST',
                      name='leads.convert')
  def leads_convert(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        try:
            lead = Lead.get_by_id(int(request.id))
        except (IndexError, TypeError):
                raise endpoints.NotFoundException('Lead %s not found.' %
                                                  (request.id,))
        moved_folder = EndpointsHelper.move_folder(user_from_email,lead.folder,'Contact')
        contact = Contact(owner = lead.owner,
                              organization = lead.organization,
                              collaborators_ids = lead.collaborators_ids,
                              collaborators_list = lead.collaborators_list,
                              folder = moved_folder['id'],
                              firstname = lead.firstname,
                              lastname = lead.lastname,
                              title = lead.title)
        if lead.company:
                created_folder = EndpointsHelper.insert_folder(user_from_email,lead.company,'Account')
                account = Account(owner = lead.owner,
                                  organization = lead.organization,
                                  collaborators_ids = lead.collaborators_ids,
                                  collaborators_list = lead.collaborators_list,
                                  account_type = 'prospect',
                                  name=lead.company,
                                  folder = created_folder['id'])
                account.put()
                contact.account_name = lead.company
                contact.account = account.key
        contact.put()
        notes = Note.query().filter(Note.about_kind=='Lead',Note.about_item==str(lead.key.id())).fetch()
        for note in notes:
            note.about_kind = 'Contact'
            note.about_item = str(contact.key.id())
            note.put()
        tasks = Task.query().filter(Task.about_kind=='Lead',Task.about_item==str(lead.key.id())).fetch()
        for task in tasks:
            task.about_kind = 'Contact'
            task.about_item = str(contact.key.id())
            task.put()
        events = Event.query().filter(Event.about_kind=='Lead',Event.about_item==str(lead.key.id())).fetch()
        for event in events:
            event.about_kind = 'Contact'
            event.about_item = str(contact.key.id())
            event.put()
        lead.key.delete()
        
        return ConvertedLead(id = contact.key.id())
  # leads.search api 
  @endpoints.method(SearchRequest, LeadSearchResults,
                      path='leads/search', http_method='POST',
                      name='leads.search')
  def leads_search(self, request):
      user_from_email = EndpointsHelper.require_iogrow_user()
      organization = str(user_from_email.organization.id())
      
      index = search.Index(name="GlobalIndex")
      #Show only objects where you have permissions
      query_string = request.q + ' type:Lead AND (organization:' +organization+ ' AND (access:public OR (owner:'+ user_from_email.google_user_id +' OR collaborators:'+ user_from_email.google_user_id+')))'
      print query_string
      search_results = []
      count = 1
      if request.limit:
          limit = int(request.limit)
      else:
          limit = 10
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
                      'id' : scored_document.doc_id
                  }
                  for e in scored_document.fields:
                      if e.name in ["firstname","lastname","company","position", "status"]:
                          kwargs[e.name]=e.value
                  
                  search_results.append(LeadSearchResult(**kwargs))
                  
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
      return LeadSearchResults(items = search_results,nextPageToken=next_cursor)

  #HKA 14.12.2013 Lead status APIs
  @Leadstatus.method(user_required=True,path='leadstatuses',http_method='POST',name='leadstatuses.insert')
  def LeadstatusInsert(self,my_model):
    user_from_email = EndpointsHelper.require_iogrow_user()
    my_model.owner = user_from_email.google_user_id
    my_model.organization = user_from_email.organization
    my_model.put()
    return my_model
  @Leadstatus.query_method(user_required=True,query_fields=('limit','order','pageToken'),path='leadstatuses',name='leadstatuses.list')
  def LeadstatusList(self,query):
    user_from_email = EndpointsHelper.require_iogrow_user()
    return query.filter(Leadstatus.organization==user_from_email.organization)
  @Leadstatus.method(request_fields=('id',),path='leadstatuses/{id}',http_method='GET',name='leadstatuses.get')
  def LeadstatusGet(self,my_model):
    if not my_model.from_datastore:
      raise('Lead status not found')
    return my_model
  @Leadstatus.method(user_required=True,
    http_method='PATCH',path='leadstatuses/{id}',name='leadstatuses.patch')
  def LeadstatusPatch(self,my_model):
    user_from_email = EndpointsHelper.require_iogrow_user()
    my_model.put()
    return my_model
  @Leadstatus.method(request_fields=('id',),
    response_message=message_types.VoidMessage,
    http_method ='DELETE',path='leadstatuses/{id}',name='leadstatuses.delete'
    )
  def LeadstatusDelete(self,my_model):
    user_from_email=EndpointsHelper.require_iogrow_user()
    my_model.key.delete()
    return message_types.VoidMessage()
  #Needs API
  # needs.insert api 
  @Need.method(user_required=True,path='needs',http_method='POST',name='needs.insert')
  def need_insert(self, my_model):
      user_from_email = EndpointsHelper.require_iogrow_user()
      
      # Todo: Check permissions
      my_model.owner = user_from_email.google_user_id
      my_model.organization = user_from_email.organization
      #get the account or lead folder
      #my_model.folder = created_folder['id']
      my_model.put()
      return my_model
  # needs.get api
  # cases.get api
  @Need.method(request_fields=('id',),path='needs/{id}', http_method='GET', name='needs.get')
  def need_get(self, my_model):
    user_from_email = EndpointsHelper.require_iogrow_user()
    if not my_model.from_datastore:
      raise endpoints.NotFoundException('Need not found')
    return my_model
  @Need.method(user_required=True,
                http_method='PATCH', path='needs/{id}', name='needs.patch')
  def NeedPatch(self, my_model):
      user_from_email = EndpointsHelper.require_iogrow_user()
      # Todo: Check permissions
      if not my_model.from_datastore:
          raise endpoints.NotFoundException('Need not found.')
      patched_model_key = my_model.entityKey
      patched_model = ndb.Key(urlsafe=patched_model_key).get()
      print patched_model
      print my_model
      properties = Need().__class__.__dict__
      for p in properties.keys():
         
            if (eval('patched_model.'+p) != eval('my_model.'+p))and(eval('my_model.'+p)):
                exec('patched_model.'+p+'= my_model.'+p)
      

      patched_model.put()
      return patched_model
  # cases.list api
  @Need.query_method(user_required=True,query_fields=('limit', 'order', 'pageToken','about_kind','about_item', 'about_name',  'priority','need_status'),path='needs',name='needs.list')
  def need_list(self,query):
      user_from_email = EndpointsHelper.require_iogrow_user()
      return query.filter(ndb.OR(ndb.AND(Need.access=='public',Need.organization==user_from_email.organization),Need.owner==user_from_email.google_user_id, Need.collaborators_ids==user_from_email.google_user_id)).order(Need._key)


  # Cases API 
  # cases.insert api 
  @Case.method(user_required=True,path='cases',http_method='POST',name='cases.insert')
  def CaseInsert(self, my_model):
      user_from_email = EndpointsHelper.require_iogrow_user()
      created_folder = EndpointsHelper.insert_folder(user_from_email,my_model.name,'Case')
      # Todo: Check permissions
      my_model.owner = user_from_email.google_user_id
      my_model.organization = user_from_email.organization
      my_model.folder = created_folder['id']
      my_model.put()
      return my_model
  # cases.list api
  @Case.query_method(user_required=True,query_fields=('limit', 'order', 'pageToken','account','type_case','priority','status','contact'),path='cases',name='cases.list')
  def CaseList(self,query):
      user_from_email = EndpointsHelper.require_iogrow_user()
      return query.filter(ndb.OR(ndb.AND(Case.access=='public',Case.organization==user_from_email.organization),Case.owner==user_from_email.google_user_id, Case.collaborators_ids==user_from_email.google_user_id)).order(Case._key)
  # cases.get api
  @Case.method(request_fields=('id',),path='cases/{id}', http_method='GET', name='cases.get')
  def CaseGet(self, my_model):
    if not my_model.from_datastore:
      raise endpoints.NotFoundException('Case not found')
    return my_model
  # cases.update api
  @Case.method(user_required=True,
                http_method='PUT', path='cases/{id}', name='cases.update')
  def CaseUpdate(self, my_model):
    user_from_email = EndpointsHelper.require_iogrow_user()
    # Todo: Check permissions
    #my_model.owner = user_from_email.google_user_id
    #my_model.organization =  user_from_email.organization

    my_model.put()
    return my_model
  # cases.patch api
  @Case.method(user_required=True,
                http_method='PATCH', path='cases/{id}', name='cases.patch')
  def CasePatch(self, my_model):
      user_from_email = EndpointsHelper.require_iogrow_user()
      # Todo: Check permissions
      if not my_model.from_datastore:
          raise endpoints.NotFoundException('Case not found.')
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
  @Case.method(request_fields=('id',),
    response_message=message_types.VoidMessage,
    http_method ='DELETE',path='cases/{id}',name='cases.delete'
    )
  def CaseDelete(self,my_model):
    user_from_email=EndpointsHelper.require_iogrow_user()
    my_model.key.delete()
    return message_types.VoidMessage()
  # cases.search api 
  @endpoints.method(SearchRequest, CaseSearchResults,
                      path='cases/search', http_method='POST',
                      name='cases.search')
  def cases_search(self, request):
      user_from_email = EndpointsHelper.require_iogrow_user()
      organization = str(user_from_email.organization.id())
      
      index = search.Index(name="GlobalIndex")
      #Show only objects where you have permissions
      query_string = request.q + ' type:Case AND (organization:' +organization+ ' AND (access:public OR (owner:'+ user_from_email.google_user_id +' OR collaborators:'+ user_from_email.google_user_id+')))'
      print query_string
      search_results = []
      count = 1
      if request.limit:
          limit = int(request.limit)
      else:
          limit = 10
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
                      'id' : scored_document.doc_id
                  }
                  for e in scored_document.fields:
                      if e.name in ["title","contact_name","account_name","status"]:
                          kwargs[e.name]=e.value
                  
                  search_results.append(CaseSearchResult(**kwargs))
                  
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
      return CaseSearchResults(items = search_results,nextPageToken=next_cursor)
      #*******************************************#
  #HKA 14.12.2013 Case status APIs
  @Casestatus.method(user_required=True,path='casestatuses',http_method='POST',name='casestatuses.insert')
  def CasestatusInsert(self,my_model):
    user_from_email = EndpointsHelper.require_iogrow_user()
    my_model.owner = user_from_email.google_user_id
    my_model.organization = user_from_email.organization
    my_model.put()
    return my_model
  @Casestatus.query_method(user_required=True,query_fields=('limit','order','pageToken'),path='casestatuses',name='casestatuses.list')
  def CasestatusList(self,query):
    user_from_email = EndpointsHelper.require_iogrow_user()
    return query.filter(Casestatus.organization==user_from_email.organization)
  @Casestatus.method(request_fields=('id',),path='casestatuses/{id}',http_method='GET',name='casestatuses.get')
  def CasestatusGet(self,my_model):
    if not my_model.from_datastore:
      raise('Case status not found')
    return my_model
  @Casestatus.method(user_required=True,
    http_method='PATCH',path='casestatuses/{id}',name='casestatuses.patch')
  def CasestatusPatch(self,my_model):
    user_from_email = EndpointsHelper.require_iogrow_user()
    my_model.put()
    return my_model
  @Casestatus.method(request_fields=('id',),
    response_message=message_types.VoidMessage,
    http_method ='DELETE',path='casestatuses/{id}',name='casestatuses.delete'
    )
  def CasestatusDelete(self,my_model):
    user_from_email=EndpointsHelper.require_iogrow_user()
    my_model.key.delete()
    return message_types.VoidMessage()
  
  # Shows API
  # shows.insert api
  @Show.method(user_required=True,path='shows',http_method='POST',name='shows.insert')
  def shows_insert(self, my_model):
      user_from_email = EndpointsHelper.require_iogrow_user()
      # OAuth flow
      created_folder = EndpointsHelper.insert_folder(user_from_email,my_model.name,'Show')
      # Todo: Check permissions
      my_model.owner = user_from_email.google_user_id
      my_model.organization = user_from_email.organization
      organization = user_from_email.organization.get()
      my_model.organization_name = organization.name
      my_model.folder = created_folder['id']
      my_model.put()
      return my_model
  # shows.list api
  @Show.query_method(user_required=True,query_fields=('limit', 'order', 'pageToken','starts_at','ends_at','type_show'),path='shows', name='shows.list')
  def shows_list(self, query):
      user_from_email = EndpointsHelper.require_iogrow_user()      
      return query.filter(ndb.OR(ndb.AND(Show.access=='public',Show.organization==user_from_email.organization),Show.owner==user_from_email.google_user_id, Show.collaborators_ids==user_from_email.google_user_id)).order(Show._key)
  # shows.get api
  @Show.method(request_fields=('id',),path='shows/{id}', http_method='GET', name='shows.get')
  def shows_get(self, my_model):
    if not my_model.from_datastore:
      raise endpoints.NotFoundException('Show not found.')
    return my_model
  # shows.patch api
  @Show.method(user_required=True,
                http_method='PATCH', path='shows/{id}', name='shows.patch')
  def shows_patch(self, my_model):
      user_from_email = EndpointsHelper.require_iogrow_user()
      # Todo: Check permissions
      if not my_model.from_datastore:
          raise endpoints.NotFoundException('Show not found.')
      patched_model_key = my_model.entityKey
      patched_model = ndb.Key(urlsafe=patched_model_key).get()
      print patched_model
      print my_model
      properties = Show().__class__.__dict__
      for p in properties.keys():
         
            if (eval('patched_model.'+p) != eval('my_model.'+p))and(eval('my_model.'+p)):
                exec('patched_model.'+p+'= my_model.'+p)
      

      patched_model.put()
      return patched_model
  @Show.method(request_fields=('id',),
    response_message=message_types.VoidMessage,
    http_method ='DELETE',path='shows/{id}',name='shows.delete'
    )
  def ShowDelete(self,my_model):
    user_from_email=EndpointsHelper.require_iogrow_user()
    my_model.key.delete()
    return message_types.VoidMessage()
  # HKA 03.01.2014 Add shows.search
  @endpoints.method(SearchRequest, ShowSearchResults,
                      path='shows/search', http_method='POST',
                      name='shows.search')
  def shows_search(self, request):
      user_from_email = EndpointsHelper.require_iogrow_user()
      organization = str(user_from_email.organization.id())
      
      index = search.Index(name="GlobalIndex")
      #Show only objects where you have permissions
      query_string = request.q + ' type:Show AND (organization:' +organization+  ' AND type_show:Show'+' AND (access:public OR (owner:'+ user_from_email.google_user_id +' OR collaborators:'+ user_from_email.google_user_id+')))'
      print query_string
      search_results = []
      count = 1
      if request.limit:
          limit = int(request.limit)
      else:
          limit = 10
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
                      'id' : scored_document.doc_id
                  }
                  for e in scored_document.fields:
                      if e.name in ["title", "status","starts_at","ends_at"]:
                          kwargs[e.name]=e.value
                  
                  search_results.append(ShowSearchResult(**kwargs))
                  
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
      return ShowSearchResults(items = search_results,nextPageToken=next_cursor)
  # HKA 04.01.2014 Add showproducts.search (Product videos)
  @endpoints.method(SearchRequest, ShowSearchResults,
                      path='showproducts/search', http_method='POST',
                      name='showproducts.search')
  def showproducts_search(self, request):
      user_from_email = EndpointsHelper.require_iogrow_user()
      organization = str(user_from_email.organization.id())
      
      index = search.Index(name="GlobalIndex")
      #Show only objects where you have permissions
      query_string = request.q + ' type:Show AND (organization:' +organization+  ' AND type_show:Product_Video'+' AND (access:public OR (owner:'+ user_from_email.google_user_id +' OR collaborators:'+ user_from_email.google_user_id+')))'
      print query_string
      search_results = []
      count = 1
      if request.limit:
          limit = int(request.limit)
      else:
          limit = 10
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
                      'id' : scored_document.doc_id
                  }
                  for e in scored_document.fields:
                      if e.name in ["title", "status","starts_at","ends_at"]:
                          kwargs[e.name]=e.value
                  
                  search_results.append(ShowSearchResult(**kwargs))
                  
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
      return ShowSearchResults(items = search_results,nextPageToken=next_cursor)
  # HKA 04.01.2014
  @endpoints.method(SearchRequest, ShowSearchResults,
                      path='showcustomerstories/search', http_method='POST',
                      name='showcustomerstories.search')
  def showcustomerstories_search(self, request):
      user_from_email = EndpointsHelper.require_iogrow_user()
      organization = str(user_from_email.organization.id())
      
      index = search.Index(name="GlobalIndex")
      #Show only objects where you have permissions
      query_string = request.q + ' type:Show AND (organization:' +organization+  ' AND type_show:Customer_Story'+' AND (access:public OR (owner:'+ user_from_email.google_user_id +' OR collaborators:'+ user_from_email.google_user_id+')))'
      print query_string
      search_results = []
      count = 1
      if request.limit:
          limit = int(request.limit)
      else:
          limit = 10
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
                      'id' : scored_document.doc_id
                  }
                  for e in scored_document.fields:
                      if e.name in ["title", "status","starts_at","ends_at"]:
                          kwargs[e.name]=e.value
                  
                  search_results.append(ShowSearchResult(**kwargs))
                  
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
      return ShowSearchResults(items = search_results,nextPageToken=next_cursor)
  #feedbacks APIs
  @Feedback.method(user_required=True,path='feedbacks',http_method='POST',name='feedbacks.insert')
  def Feedbackinsert(self, my_model):
      user_from_email = EndpointsHelper.require_iogrow_user()
      my_model.owner = user_from_email.google_user_id
      my_model.organization = user_from_email.organization
      organization = user_from_email.organization.get()
      my_model.organization_name = organization.name
      my_model.put()
      return my_model
  # feedbacks.list api
  @Feedback.query_method(user_required=True,query_fields=('limit', 'order','status', 'pageToken','related_to'),path='feedbacks', name='feedbacks.list')
  def feedbacks_list(self, query):
      user_from_email = EndpointsHelper.require_iogrow_user()      
      return query.filter(ndb.OR(ndb.AND(Feedback.access=='public',Feedback.organization==user_from_email.organization),Feedback.owner==user_from_email.google_user_id, Feedback.collaborators_ids==user_from_email.google_user_id)).order(Feedback._key)
  # feedbacks.get api
  @Feedback.method(request_fields=('id',),path='feedbacks/{id}', http_method='GET', name='feedbacks.get')
  def feedbacks_get(self, my_model):
    if not my_model.from_datastore:
      raise endpoints.NotFoundException('Show not found.')
    return my_model
  # shows.patch api
  @Feedback.method(user_required=True,
                http_method='PATCH', path='feedbacks/{id}', name='feedbacks.patch')
  def feedbacks_patch(self, my_model):
      user_from_email = EndpointsHelper.require_iogrow_user()
      # Todo: Check permissions
      if not my_model.from_datastore:
          raise endpoints.NotFoundException('Feedback not found.')
      patched_model_key = my_model.entityKey
      patched_model = ndb.Key(urlsafe=patched_model_key).get()
      print patched_model
      print my_model
      properties = Feedback().__class__.__dict__
      for p in properties.keys():
         
            if (eval('patched_model.'+p) != eval('my_model.'+p))and(eval('my_model.'+p)):
                exec('patched_model.'+p+'= my_model.'+p)
      

      patched_model.put()
      return patched_model
  @Feedback.method(request_fields=('id',),
    response_message=message_types.VoidMessage,
    http_method ='DELETE',path='feedbacks/{id}',name='feedbacks.delete'
    )
  def FeedbackDelete(self,my_model):
    user_from_email=EndpointsHelper.require_iogrow_user()
    my_model.key.delete()
    return message_types.VoidMessage()
  # HKA 04.01.2014
  # leads.search api 
  @endpoints.method(SearchRequest, FeedbackSearchResults,
                      path='feedbacks/search', http_method='POST',
                      name='feedbacks.search')
  def feedbacks_search(self, request):
      user_from_email = EndpointsHelper.require_iogrow_user()
      organization = str(user_from_email.organization.id())
      
      index = search.Index(name="GlobalIndex")
      #Show only objects where you have permissions
      query_string = request.q + ' type:Feedback AND (organization:' +organization+ ' AND (access:public OR (owner:'+ user_from_email.google_user_id +' OR collaborators:'+ user_from_email.google_user_id+')))'
      print query_string
      search_results = []
      count = 1
      if request.limit:
          limit = int(request.limit)
      else:
          limit = 10
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
                      'id' : scored_document.doc_id
                  }
                  for e in scored_document.fields:
                      if e.name in ["title","type_feedback","source", "status"]:
                          kwargs[e.name]=e.value
                  
                  search_results.append(FeedbackSearchResult(**kwargs))
                  
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
      return FeedbackSearchResults(items = search_results,nextPageToken=next_cursor)
  # HKA 29.12.2013 Companyprofile APIs
  # companyprofiles.get api
  @Companyprofile.method(request_fields=('id',),path='companyprofiles/{id}', http_method='GET', name='companyprofiles.get')
  def companyprofile_get(self, request):
    user_from_email = EndpointsHelper.require_iogrow_user()
    orgid = request.id
    companyprofilequery = Companyprofile.query(Companyprofile.organizationid == orgid).fetch()
    if companyprofilequery is None:
        raise endpoints.NotFoundException('Companyprofile not found.')
    companyprofile = companyprofilequery[0]
    return companyprofile
  # companyprofiles.patch api
  @Companyprofile.method(user_required=True,
                http_method='PATCH', path='companyprofiles/{id}', name='companyprofiles.patch')
  def companyprofile_patch(self, my_model):
      user_from_email = EndpointsHelper.require_iogrow_user()
      # Todo: Check permissions
      if not my_model.from_datastore:
          raise endpoints.NotFoundException('Companyprofile not found.')
      patched_model_key = my_model.entityKey
      patched_model = ndb.Key(urlsafe=patched_model_key).get()
      
      print my_model
      properties = Companyprofile().__class__.__dict__
      for p in properties.keys():
         
            if (eval('patched_model.'+p) != eval('my_model.'+p))and(eval('my_model.'+p)  and not(p in ['put','set_perm','put_index']) ):
                exec('patched_model.'+p+'= my_model.'+p)
      print '@@@@@@@@@@@@@@@@@@@@@@@@@@@'
      print patched_model          
      patched_model.put()
      return patched_model
  # topics.list api
  @Topic.query_method(user_required=True,query_fields=('about_kind','about_item', 'limit', 'order', 'pageToken'),path='topics', name='topics.list')
  def TopicList(self, query):
      return query

  # comments.insert api 
  @Comment.method(user_required=True,path='comments',http_method='POST',name='comments.insert')
  def CommentInsert(self, my_model):
      user_from_email = EndpointsHelper.require_iogrow_user()
      #discussion_key = ndb.Key(urlsafe=my_model.discussion)
      #my_model.discussion = discussion_key
      comment_author = Userinfo()
      comment_author.display_name = user_from_email.google_display_name
      comment_author.photo = user_from_email.google_public_profile_photo_url
      my_model.author = comment_author
      my_model.owner = user_from_email.google_user_id
      my_model.put()
      return my_model
  # comments.list api
  @Comment.query_method(user_required=True,query_fields=('limit', 'order','discussion', 'pageToken'),path='comments',name='comments.list')
  def CommentList(self,query):
     return query
  # comments.get api
  @Comment.method(request_fields=('id',),path='comments/{id}', http_method='GET', name='comments.get')
  def CommentGet(self, my_model):
      if not my_model.from_datastore:
        raise endpoints.NotFoundException('Comment not found')
      return my_model
      
  # comments.update api
  @Comment.method(user_required=True,
                http_method='PUT', path='comments/{id}', name='comments.update')
  def CommentUpdate(self, my_model):
      user_from_email = EndpointsHelper.require_iogrow_user()
      # Todo: Check permissions
      #my_model.owner = user_from_email.google_user_id
      #my_model.organization =  user_from_email.organization

      my_model.put()
      return my_model
  # comments.patch api 
  @Comment.method(user_required=True,
                http_method='PATCH', path='comments/{id}', name='comments.patch')
  def CommentPatch(self, my_model):
      user_from_email = EndpointsHelper.require_iogrow_user()
      # Todo: Check permissions
      my_model.put()
      return my_model

  # contributors.insert api
  @Contributor.method(user_required=True,path='contributors', http_method='POST', name='contributors.insert')
  def insert_contributor(self, my_model):
      user_from_email = EndpointsHelper.require_iogrow_user()
      
      # Todo: Check permissions
      my_model.created_by = user_from_email.google_user_id
      my_model.organization = user_from_email.organization
      discussion_key = my_model.discussionKey
      discussion_kind = discussion_key.kind() 
      discussion =  discussion_key.get()
      my_model.put()
      confirmation_url = "http://gcdc2013-iogrow.appspot.com"+DISCUSSIONS[discussion_kind]['url']+str(discussion_key.id())
      print confirmation_url
      sender_address =  my_model.name + " <notifications@gcdc2013-iogrow.appspotmail.com>"
      subject = "You're involved in this "+ DISCUSSIONS[discussion_kind]['title'] +": "+discussion.title
      print subject
      body = """
      %s involved you in this %s 

      %s
      """ % (user_from_email.google_display_name,DISCUSSIONS[discussion_kind]['title'],confirmation_url)
      mail.send_mail(sender_address, my_model.value , subject, body)
      return my_model
  # contributors.list api
  @Contributor.query_method(user_required=True,query_fields=('discussionKey', 'limit', 'order', 'pageToken'),path='contributors', name='contributors.list')
  def contributor_list(self, query):
      return query
  
  # notes.insert api
  @Note.method(user_required=True,path='notes', http_method='POST', name='notes.insert')
  def NoteInsert(self, my_model):
    user_from_email = EndpointsHelper.require_iogrow_user()
    # Todo: Check permissions
    note_author = Userinfo()
    note_author.display_name = user_from_email.google_display_name
    note_author.photo = user_from_email.google_public_profile_photo_url
    my_model.author = note_author
    my_model.owner = user_from_email.google_user_id
    my_model.organization =  user_from_email.organization
    my_model.put()
    return my_model

  # tags.list api
  @Tag.query_method(user_required=True,query_fields=('about_kind', 'limit', 'order', 'pageToken','color'),path='tags', name='tags.list')
  def tags_list(self, query):
      user_from_email = EndpointsHelper.require_iogrow_user()
      return query.filter(Tag.organization==user_from_email.organization)
  @Tag.method(request_fields=('id',),response_message=message_types.VoidMessage,
    http_method ='DELETE',path='tags/{id}',name='tags.delete')
  def TagDelete(self,my_model):
    user_from_email=EndpointsHelper.require_iogrow_user()
    print '*********************************'
    print my_model
    my_model.key.delete()
    return message_types.VoidMessage() 
  @Tag.method(user_required=True,path='tags', http_method='POST', name='tags.insert')
  def TagInsert(self, my_model):
    user_from_email = EndpointsHelper.require_iogrow_user()
    my_model.organization = user_from_email.organization
    my_model.owner = user_from_email.google_user_id
    my_model.put()
    return my_model

  # notes.get api
  @endpoints.method(ID_RESOURCE, DiscussionResponse,
                      path='notes/{id}', http_method='GET',
                      name='notes.get')
  def NoteGet(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
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

  # notes.update api
  @Note.method(user_required=True,
                http_method='PUT', path='notes/{id}', name='notes.update')
  def NoteUpdate(self, my_model):
    user_from_email = EndpointsHelper.require_iogrow_user()
    # Todo: Check permissions
    #my_model.owner = user_from_email.google_user_id
    #my_model.organization =  user_from_email.organization

    my_model.put()
    return my_model
  # notes.patch api
  @Note.method(user_required=True,
                http_method='PATCH', path='notes/{id}', name='notes.patch')
  def NotePatch(self, my_model):
      user_from_email = EndpointsHelper.require_iogrow_user()
      # Todo: Check permissions

      my_model.put()
      return my_model
  # Documents APIs
  # documents.insert api
  @Document.method(user_required=True,path='documents', http_method='POST', name='documents.insert')
  def DocumentInsert(self, my_model):
    user_from_email = EndpointsHelper.require_iogrow_user()
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
    author = Userinfo()
    author.google_user_id = user_from_email.google_user_id
    author.display_name = user_from_email.google_display_name
    author.photo = user_from_email.google_public_profile_photo_url
    my_model.author = author
    my_model.comments = 0
    my_model.owner = user_from_email.google_user_id
    my_model.organization = user_from_email.organization
    my_model.put()
    
    return my_model
  # documents.attachfiles api
  @endpoints.method(MultipleAttachmentRequest, message_types.VoidMessage,
                      path='documents/attachfiles', http_method='POST',
                      name='documents.attachfiles')
  def attach_files(self, request):
      user_from_email = EndpointsHelper.require_iogrow_user()
      # Todo: Check permissions
      items = request.items
      author = Userinfo()
      author.google_user_id = user_from_email.google_user_id
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
  
  # documents.list api
  @Document.query_method(user_required=True,query_fields=('about_kind','about_item', 'limit', 'order', 'pageToken'),path='documents', name='documents.list')
  def DocumentList(self, query):
    return query 
  # documents.get api
  @endpoints.method(ID_RESOURCE, DiscussionResponse,
                      path='documents/{id}', http_method='GET',
                      name='documents.get')
  def document_get(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
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
  # documents.update api
  @Document.method(user_required=True,
                http_method='PUT', path='documents/{id}', name='documents.update')
  def DocumentUpdate(self, my_model):
    user_from_email = EndpointsHelper.require_iogrow_user()
    # Todo: Check permissions
    #my_model.owner = user_from_email.google_user_id
    #my_model.organization =  user_from_email.organization

    my_model.put()
    return my_model
  # documents.patch api
  @Document.method(user_required=True,
                http_method='PATCH', path='documents/{id}', name='documents.patch')
  def DocumentPatch(self, my_model):
      user_from_email = EndpointsHelper.require_iogrow_user()
      # Todo: Check permissions
      my_model.put()
      return my_model
  # Tasks APIs
  # tasks.insert api
  @Task.method(user_required=True,path='tasks', http_method='POST', name='tasks.insert')
  def TaskInsert(self, my_model):
      user_from_email = EndpointsHelper.require_iogrow_user()
      # Todo: Check permissions
      if my_model.due:
          #insert an event on google calendar
          try:
                credentials = user_from_email.google_credentials
                http = credentials.authorize(httplib2.Http(memcache))
                service = build('calendar', 'v3', http=http)
                # prepare params to insert
                params = {
                 "start": 
                  {
                    "date": my_model.due.strftime("%Y-%m-%d")
                  },
                 "end": 
                  {
                    "date": my_model.due.strftime("%Y-%m-%d")
                  },
                  "summary": my_model.title,
                  
                                
                }
                
                created_event = service.events().insert(calendarId='primary',body=params).execute()
          except:
                raise endpoints.UnauthorizedException('Invalid grant' )
                return
      
      my_model.owner = user_from_email.google_user_id
      my_model.organization =  user_from_email.organization
      author = Userinfo()
      author.google_user_id = user_from_email.google_user_id
      author.display_name = user_from_email.google_display_name
      author.photo = user_from_email.google_public_profile_photo_url
      my_model.author = author
      my_model.status = 'pending'
      my_model.put()
      return my_model
  # tasks.patch api
  @Task.method(user_required=True,
                http_method='PATCH', path='tasks/{id}', name='tasks.patch')
  def task_patch(self, my_model):
      user_from_email = EndpointsHelper.require_iogrow_user()
      # Todo: Check permissions
      if not my_model.from_datastore:
          raise endpoints.NotFoundException('Task not found.')
      patched_model_key = my_model.entityKey
      patched_model = ndb.Key(urlsafe=patched_model_key).get()
      print 'current model ***************'
      pprint.pprint(patched_model) 
      print 'to be updated ******************' 
      pprint.pprint(my_model) 
      properties = Task().__class__.__dict__
      for p in properties.keys():
          if (eval('patched_model.'+p) != eval('my_model.'+p))and(eval('my_model.'+p) and not(p in ['put','set_perm','put_index']) ):
                exec('patched_model.'+p+'= my_model.'+p)
      patched_model.put()
      return patched_model
            
            

            
  # tasks.list api
  @Task.query_method(user_required=True,query_fields=('about_kind','about_item','status','id', 'due', 'limit', 'order', 'pageToken'),path='tasks', name='tasks.list')
  def TaskList(self, query):
      return query
  # tasks.get api
  @endpoints.method(ID_RESOURCE, TaskResponse,
                      path='tasks/{id}', http_method='GET',
                      name='tasks.get')
  def task_get(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
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

                
                if task.due:
                    due_date = task.due.isoformat()
                else:
                    due_date = None
                response = TaskResponse(id=request.id,
                                              entityKey = task.key.urlsafe(),
                                              title = task.title,
                                              due = due_date,
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
  #Tags Api
  # events.insert api
  @Event.method(user_required=True,path='events', http_method='POST', name='events.insert')
  def EventInsert(self, my_model):
    user_from_email = EndpointsHelper.require_iogrow_user()
    # Todo: Check permissions
    #insert an event on google calendar
    #insert an event on google calendar
    try:
        credentials = user_from_email.google_credentials
        http = credentials.authorize(httplib2.Http(memcache))
        service = build('calendar', 'v3', http=http)
              # prepare params to insert
        
        params = {
               "start": 
                {
                  "dateTime": my_model.starts_at.strftime("%Y-%m-%dT%H:%M:00.000+01:00")
                },
               "end": 
                {
                  "dateTime": my_model.ends_at.strftime("%Y-%m-%dT%H:%M:00.000+01:00")
                },
                "summary": my_model.title,
                "location": my_model.where,
                "reminders": 
                {
                  "overrides": 
                  [
                    {
                      "method": 'email',
                      "minutes": 30
                    }
                  ],
                  "useDefault": False
                }

        }
        
        created_event = service.events().insert(calendarId='primary',body=params).execute()
        
    except:
        raise endpoints.UnauthorizedException('Invalid grant' )
        return    
    author = Userinfo()
    author.google_user_id = user_from_email.google_user_id
    author.display_name = user_from_email.google_display_name
    author.photo = user_from_email.google_public_profile_photo_url
    my_model.author = author
    my_model.comments = 0
    my_model.owner = user_from_email.google_user_id
    my_model.organization =  user_from_email.organization
    my_model.put()
    

    return my_model
  # events.list api
  @Event.query_method(user_required=True,query_fields=('about_kind','about_item','id','status', 'starts_at','ends_at', 'limit', 'order', 'pageToken'),path='events', name='events.list')
  def EventList(self, query):
      return query     
  # events.get api
  @endpoints.method(ID_RESOURCE, EventResponse,
                      path='events/{id}', http_method='GET',
                      name='events.get')
  def event_get(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        try:
            event = Event.get_by_id(int(request.id))
            about_item_id = int(event.about_item)
            try:
                about_object = OBJECTS[event.about_kind].get_by_id(about_item_id)
                if event.about_kind == 'Contact' or event.about_kind == 'Lead':
                    about_name = about_object.firstname + ' ' + about_object.lastname
                else:
                    about_name = about_object.name
                about_response = DiscussionAboutSchema(kind=event.about_kind,
                                                       id=event.about_item,
                                                       name=about_name)
                author = AuthorSchema(google_user_id = event.author.google_user_id,
                                      display_name = event.author.display_name,
                                      google_public_profile_url = event.author.google_public_profile_url,
                                      photo = event.author.photo)
                response = EventResponse(id=request.id,
                                              entityKey = event.key.urlsafe(),
                                              title = event.title,
                                              starts_at = event.starts_at.isoformat(),
                                              ends_at = event.ends_at.isoformat(),
                                              where = event.where,
                                              comments = event.comments,
                                              about = about_response,
                                              author = author)
                return response
            except (IndexError, TypeError):
                raise endpoints.NotFoundException('About object %s not found.' %
                                                  (request.id,))
               
        except (IndexError, TypeError):
            raise endpoints.NotFoundException('EVent %s not found.' %
                                              (request.id,))

        
  # users.insert api
  @User.method(path='users', http_method='POST', name='users.insert')
  def UserInsert(self, my_model):
    user_from_email = EndpointsHelper.require_iogrow_user()
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

    invited_user = User.query( User.email == my_model.email).get()
    
    if invited_user is not None:
        if invited_user.organization == user_from_email.organization or invited_user.organization is None:
            invited_user.organization = user_from_email.organization
            invited_user.status = 'invited'
            profile =  Profile.query(Profile.name=='Standard User', Profile.organization==user_from_email.organization).get()
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
        profile = Profile.query(Profile.name=='Standard User', Profile.organization==user_from_email.organization).get()
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

  # users.list api
  @User.query_method(user_required=True,query_fields=('limit', 'order', 'pageToken'),path='users', name='users.list')
  def UserList(self, query):
    user_from_email = EndpointsHelper.require_iogrow_user()
    organization = user_from_email.organization
    return query.filter(User.organization == organization)

  # users.get api
  @User.method(request_fields=('id',),path='users/{id}', http_method='GET', name='users.get')
  def UserGet(self, my_model):
    if not my_model.from_datastore:
      raise endpoints.NotFoundException('Account not found.')
    return my_model

  # users.update api
  @User.method(user_required=True,
                http_method='PUT', path='users/{id}', name='users.update')
  def UserUpdate(self, my_model):
    user_from_email = EndpointsHelper.require_iogrow_user()
    # Todo: Check permissions
    #my_model.owner = user_from_email.google_user_id
    #my_model.organization =  user_from_email.organization

    my_model.put()
    return my_model
  # users.patch api
  @User.method(user_required=True,
                http_method='PATCH', path='users/{id}', name='users.patch')
  def UserPatch(self, my_model):
      user_from_email = EndpointsHelper.require_iogrow_user()
      # Todo: Check permissions
      my_model.put()
      return my_model
  # Groups API
  # groups.insert api
  @Group.method(user_required=True,path='groups', http_method='POST', name='groups.insert')
  def GroupInsert(self, my_model):
    user_from_email = EndpointsHelper.require_iogrow_user()
    # Todo: Check permissions
    my_model.organization = user_from_email.organization
    
    my_model.put()
    
    return my_model
  # groups.list api
  @Group.query_method(user_required=True,query_fields=('limit', 'order', 'pageToken'),path='groups', name='groups.list')
  def GroupList(self, query):
    return query
  # groups.get api
  @Group.method(request_fields=('id',),path='groups/{id}', http_method='GET', name='groups.get')
  def GroupGet(self, my_model):
    if not my_model.from_datastore:
      raise endpoints.NotFoundException('Account not found.')
    return my_model
  # groups.update api
  @Group.method(user_required=True,
                http_method='PUT', path='groups/{id}', name='groups.update')
  def GroupUpdate(self, my_model):
    user_from_email = EndpointsHelper.require_iogrow_user()
    # Todo: Check permissions
    #my_model.owner = user_from_email.google_user_id
    #my_model.organization =  user_from_email.organization

    my_model.put()
    return my_model
  # groups.patch api
  @Group.method(user_required=True,
                http_method='PATCH', path='groups/{id}', name='groups.patch')
  def GroupPatch(self, my_model):
      user_from_email = EndpointsHelper.require_iogrow_user()
      # Todo: Check permissions
      my_model.put()
      return my_model
  # members.insert api
  @Member.method(user_required=True,path='members', http_method='POST', name='members.insert')
  def MemberInsert(self, my_model):
      user_from_email = EndpointsHelper.require_iogrow_user()
      # Todo: Check permissions
      my_model.organization = user_from_email.organization
      
      my_model.put()
      
      return my_model
  # members.list api
  @Member.query_method(user_required=True,query_fields=('limit', 'order','groupKey', 'pageToken'),path='members', name='members.list')
  def MemberList(self, query):
    return query
  # members.get api
  @Member.method(request_fields=('id',),path='members/{id}', http_method='GET', name='members.get')
  def MemberGet(self, my_model):
    if not my_model.from_datastore:
      raise endpoints.NotFoundException('Account not found.')
    return my_model
  # members.update api
  @Member.method(user_required=True,
                http_method='PUT', path='members/{id}', name='members.update')
  def MemberUpdate(self, my_model):
    user_from_email = EndpointsHelper.require_iogrow_user()
    # Todo: Check permissions
    #my_model.owner = user_from_email.google_user_id
    #my_model.organization =  user_from_email.organization

    my_model.put()
    return my_model
  # members.patch api
  @Member.method(user_required=True,
                http_method='PATCH', path='members/{id}', name='members.patch')
  def MemberPatch(self, my_model):
      user_from_email = EndpointsHelper.require_iogrow_user()
      # Todo: Check permissions
      my_model.put()
      return my_model
  # Permissions APIs (Sharing Settings)
  # permissions.insert api
  @Permission.method(user_required=True,path='permissions', http_method='POST', name='permissions.insert')
  def PermissionInsert(self, my_model):
      user_from_email = EndpointsHelper.require_iogrow_user()
      
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
          invited_user = User.query( User.email == my_model.value, User.organization==user_from_email.organization).get()
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

  # permissions.list api
  @Permission.query_method(user_required=True,query_fields=('limit', 'order', 'pageToken'),path='permissions',name='permissions.list')
  def PermissionList(self,query):
     return query 
  # permissions.get api
  @Permission.method(request_fields=('id',),path='permissions/{id}', http_method='GET', name='permissions.get')
  def PermissionGet(self, my_model):
    if not my_model.from_datastore:
      raise endpoints.NotFoundException('Permission not found')
    return my_model
  # permissions.update api
  @Permission.method(user_required=True,
                http_method='PUT', path='permissions/{id}', name='permissions.update')
  def PermissionUpdate(self, my_model):
    user_from_email = EndpointsHelper.require_iogrow_user()
    # Todo: Check permissions
    #my_model.owner = user_from_email.google_user_id
    #my_model.organization =  user_from_email.organization

    my_model.put()
    return my_model
  # permissions.patch api
  @Permission.method(user_required=True,
                http_method='PATCH', path='permissions/{id}', name='permissions.patch')
  def PermissionPatch(self, my_model):
      user_from_email = EndpointsHelper.require_iogrow_user()
      # Todo: Check permissions
      my_model.put()
      return my_model

  #emails.send api
  @endpoints.method(EmailRequest, message_types.VoidMessage,
                      path='emails/send', http_method='POST',
                      name='emails.send')
  def send_email(self, request):
      user = EndpointsHelper.require_iogrow_user()
      if user is None:
          raise endpoints.UnauthorizedException('Invalid token.')
      message = mail.EmailMessage()
      message.sender = user.google_display_name + " < io-"+ user.google_user_id+"@gcdc2013-iogrow.appspotmail.com>"
      message.reply_to = user.email
      if not mail.is_email_valid(request.to):
          raise endpoints.UnauthorizedException('Invalid email.')
      message.to = request.to
      if request.cc:
          message.cc = request.cc
      if request.bcc:
          message.bcc = request.bcc
      message.subject = request.subject
      message.html = request.body
      message.send()
      note = Note()
      note_author = Userinfo()
      note_author.display_name = user.google_display_name
      note_author.photo = user.google_public_profile_photo_url
      note.author = note_author
      note.owner = user.google_user_id
      note.organization =  user.organization
      note.title = 'Email: '+ request.subject
      note.content = request.body
      note.about_kind = request.about_kind
      note.about_item = request.about_item
      note.put()
      
      return message_types.VoidMessage()
  # Search API
  @endpoints.method(SearchRequest, SearchResults,
                      path='search', http_method='POST',
                      name='search')
  def search_method(self, request):
      user_from_email = EndpointsHelper.require_iogrow_user()
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

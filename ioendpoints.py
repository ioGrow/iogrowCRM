
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
from google.appengine.api import taskqueue
from google.appengine.api import mail
from oauth2client.client import flow_from_clientsecrets
from oauth2client.tools import run
from apiclient.discovery import build
from google.appengine.datastore.datastore_query import Cursor
from protorpc import remote
from protorpc import messages
from protorpc import message_types
import endpoints
# Third party libraries
from endpoints_proto_datastore.ndb import EndpointsModel

# Our libraries
from iograph import Node,Edge,RecordSchema,InfoNodeResponse,InfoNodeConnectionSchema,InfoNodeListResponse
from iomodels.crmengine.accounts import Account,AccountGetRequest,AccountSchema,AccountListRequest,AccountListResponse,AccountSearchResult,AccountSearchResults,AccountInsertRequest
from iomodels.crmengine.contacts import Contact,ContactGetRequest,ContactInsertRequest,ContactSchema,ContactListRequest,ContactListResponse,ContactSearchResults,ContactImportRequest
from iomodels.crmengine.notes import Note, Topic, AuthorSchema,TopicSchema,TopicListResponse,DiscussionAboutSchema,NoteSchema
from iomodels.crmengine.tasks import Task,TaskSchema,TaskRequest,TaskListResponse,TaskInsertRequest
#from iomodels.crmengine.tags import Tag
from iomodels.crmengine.opportunities import Opportunity,UpdateStageRequest,OpportunitySchema,OpportunityInsertRequest,OpportunityListRequest,OpportunityListResponse,OpportunitySearchResults,OpportunityGetRequest
from iomodels.crmengine.events import Event,EventInsertRequest,EventSchema,EventPatchRequest,EventListRequest,EventListResponse
from iomodels.crmengine.documents import Document,DocumentInsertRequest,DocumentSchema,MultipleAttachmentRequest
from iomodels.crmengine.shows import Show
from iomodels.crmengine.leads import Lead,LeadFromTwitterRequest,LeadInsertRequest,LeadListRequest,LeadListResponse,LeadSearchResults,LeadGetRequest,LeadSchema
from iomodels.crmengine.cases import Case,CaseGetRequest,CaseInsertRequest,CaseSchema,CaseListRequest,CaseSchema,CaseListResponse,CaseSearchResults
#from iomodels.crmengine.products import Product
from iomodels.crmengine.comments import Comment
from iomodels.crmengine.opportunitystage import Opportunitystage
from iomodels.crmengine.leadstatuses import Leadstatus
from iomodels.crmengine.casestatuses import Casestatus
from iomodels.crmengine.feedbacks import Feedback
from iomodels.crmengine.needs import Need,NeedInsertRequest,NeedListResponse,NeedSchema
from blog import Article,ArticleInsertRequest,ArticleSchema,ArticleListResponse
#from iomodels.crmengine.emails import Email
from iomodels.crmengine.tags import Tag,TagSchema,TagListRequest,TagListResponse
from model import User
from model import Organization
from model import Profile
from model import Userinfo
from model import Group
from model import Member
from model import Permission
from model import Contributor
from model import Companyprofile
from model import Invitation
from search_helper import SEARCH_QUERY_MODEL
from endpoints_helper import EndpointsHelper
import iomessages


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
            'Lead': Lead,
            'Opportunity': Opportunity,
            'Show': Show,
            'Feedback': Feedback
         }
FOLDERS = {
            'Account': 'accounts_folder',
            'Contact': 'contacts_folder',
            'Lead': 'leads_folder',
            'Opportunity': 'opportunities_folder',
            'Case': 'cases_folder',
            'Show': 'shows_folder',
            'Feedback': 'feedbacks_folder'
        }

DISCUSSIONS = {
                'Task': {
                            'title': 'task',
                            'url': '/#/tasks/show/'
                        },
                'Event': {
                            'title': 'event',
                            'url': '/#/events/show/'
                        },
                 'Note': {
                            'title': 'discussion',
                            'url':  '/#/notes/show/'
                        }
        }
INVERSED_EDGES = {
            'tags': 'tagged_on',
            'tagged_on': 'tags'

         }
ADMIN_EMAILS = ['tedj.meabiou@gmail.com','hakim@iogrow.com','mezianeh3@gmail.com']


def LISTING_QUERY(query, access, organization, owner, collaborators, order):
    return query.filter(
                            ndb.OR(
                                   ndb.AND(
                                           Contact.access == access,
                                           Contact.organization == organization
                                           ),
                                   Contact.owner == owner,
                                   Contact.collaborators_ids == collaborators
                                   )
                        ).order(order)



 # The message class that defines the EntityKey schema
class EntityKeyRequest(messages.Message):
    entityKey = messages.StringField(1)

 # The message class that defines the ListRequest schema
class ListRequest(messages.Message):
    limit = messages.IntegerField(1)
    pageToken = messages.StringField(2)
    tags = messages.StringField(3,repeated = True)
    order = messages.StringField(4)

class NoteInsertRequest(messages.Message):
    about = messages.StringField(1,required=True)
    title = messages.StringField(2,required=True)
    content = messages.StringField(3)

class CommentInsertRequest(messages.Message):
    about = messages.StringField(1,required=True)
    content = messages.StringField(2,required=True)

class CommentSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    author = messages.MessageField(AuthorSchema, 3, required = True)
    content = messages.StringField(4,required=True)
    created_at = messages.StringField(5)
    updated_at = messages.StringField(6)

class CommentListRequest(messages.Message):
    about = messages.StringField(1)
    limit = messages.IntegerField(2)
    pageToken = messages.StringField(3)

class CommentListResponse(messages.Message):
    items = messages.MessageField(CommentSchema, 1, repeated=True)
    nextPageToken = messages.StringField(2)

class EdgeSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
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
    items = messages.MessageField(EdgeSchema, 1, repeated=True)

class InfoNodeSchema(messages.Message):
    kind = messages.StringField(1, required=True)
    fields = messages.MessageField(RecordSchema, 2, repeated=True)
    parent = messages.StringField(3, required=True)

class InfoNodePatchRequest(messages.Message):
    entityKey = messages.StringField(1, required=True)
    fields = messages.MessageField(RecordSchema, 2, repeated=True)
    parent = messages.StringField(3, required=True)
    kind = messages.StringField(4)

class InfoNodePatchResponse(messages.Message):
    entityKey = messages.StringField(1, required=True)
    fields = messages.MessageField(RecordSchema, 2, repeated=True)

class InfoNodeListRequest(messages.Message):
    parent = messages.StringField(1, required=True)
    connections = messages.StringField(2, repeated=True)

# The message class that defines the SendEmail Request attributes
class EmailRequest(messages.Message):
    sender = messages.StringField(1)
    to = messages.StringField(2)
    cc = messages.StringField(3)
    bcc = messages.StringField(4)
    subject = messages.StringField(5)
    body = messages.StringField(6)
    about = messages.StringField(7)

# The message class that defines the Search Request attributes
class SearchRequest(messages.Message):
    q = messages.StringField(1, required=True)
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
# The message class that defines a response for leads.convert API
class ConvertedLead(messages.Message):
    id = messages.IntegerField(1)

# The message class that defines Discussion Response for notes.get API
class DiscussionResponse(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    title = messages.StringField(3)
    content = messages.StringField(4)
    comments = messages.IntegerField(5)
    about = messages.MessageField(DiscussionAboutSchema, 6)
    author = messages.MessageField(AuthorSchema, 7)


# The message class that defines Customized Task Response for tasks.get API
class TaskResponse(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    title = messages.StringField(3)
    due = messages.StringField(4)
    status = messages.StringField(5)
    comments = messages.IntegerField(6)
    about = messages.MessageField(DiscussionAboutSchema, 7)
    author = messages.MessageField(AuthorSchema, 8)
    completed_by = messages.MessageField(AuthorSchema, 9)


# The message class that defines Customized Event Response for events.get API
class EventResponse(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    title = messages.StringField(3)
    starts_at = messages.StringField(4)
    ends_at = messages.StringField(5)
    where = messages.StringField(6)
    comments = messages.IntegerField(7)
    about = messages.MessageField(DiscussionAboutSchema, 8)
    author = messages.MessageField(AuthorSchema, 9)


# The message class that defines the shows.search response
class ShowSearchResult(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
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
    entityKey = messages.StringField(2)
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

class PermissionRequest(messages.Message):
    type = messages.StringField(1,required=True)
    value = messages.StringField(2,required=True)


class PermissionInsertRequest(messages.Message):
    about = messages.StringField(1,required=True)
    items = messages.MessageField(PermissionRequest, 2, repeated=True)



@endpoints.api(
               name='blogengine',
               version='v1',
               description='ioGrow Blog APIs',
               allowed_client_ids=[
                                   CLIENT_ID,
                                   endpoints.API_EXPLORER_CLIENT_ID
                                   ]
               )
class BlogEngineApi(remote.Service):

    ID_RESOURCE = endpoints.ResourceContainer(
            message_types.VoidMessage,
            id=messages.StringField(1))

    # Search API
    @endpoints.method(SearchRequest, SearchResults,
                        path='search', http_method='POST',
                        name='search')
    def blog_search_method(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        organization = str(user_from_email.organization.id())
        index = search.Index(name="GlobalIndex")
        #Show only objects where you have permissions
        query_string = request.q + ' AND (organization:' +organization+ ' AND (access:public OR (owner:'+ user_from_email.google_user_id +' OR collaborators:'+ user_from_email.google_user_id+')))'
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
                result = index.search(query)
                #total_matches = results.number_found
                # Iterate over the documents in the results
                if len(result.results) == limit + 1:
                    next_cursor = result.results[-1].cursor.web_safe_string
                else:
                    next_cursor = None
                results = result.results[:limit]
                for scored_document in results:
                    kwargs = {
                        "id" : scored_document.doc_id,
                        "rank" : scored_document.rank
                    }
                    for e in scored_document.fields:
                        if e.name in ["title","type"]:
                            kwargs[e.name]=e.value
                    search_results.append(SearchResult(**kwargs))
        except search.Error:
            logging.exception('Search failed')
        return SearchResults(items = search_results,nextPageToken=next_cursor)
    # articles.insert api
    @endpoints.method(ArticleInsertRequest, ArticleSchema,
                      path='articles/insert', http_method='POST',
                      name='articles.insert')
    def article_insert_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        if user_from_email.email in ADMIN_EMAILS:
            return Article.insert(
                            user_from_email = user_from_email,
                            request = request
                            )
        else:
            raise endpoints.UnauthorizedException('You don\'t have permissions.')

    # articles.list api
    @endpoints.method(ListRequest, ArticleListResponse,
                      path='articles/list', http_method='POST',
                      name='articles.list')
    def article_list_beta(self, request):
        return Article.list(
                            request = request
                            )
    # articles.list api
    @endpoints.method(ID_RESOURCE, ArticleSchema,
                      path='articles/get', http_method='POST',
                      name='articles.get')
    def article_get_beta(self, request):
        return Article.get_schema(
                            id = request.id
                            )

    # tags.attachtag api v2
    @endpoints.method(iomessages.AddTagSchema, TagSchema,
                      path='tags/attach', http_method='POST',
                      name='tags.attach')
    def attach_tag(self, request):
        user_from_email = User.get_by_email('tedj.meabiou@gmail.com')
        return Tag.attach_tag(
                                user_from_email = user_from_email,
                                request = request
                            )
    # tags.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='tags', http_method='DELETE',
                      name='tags.delete')
    def delete_tag(self, request):
        user_from_email = User.get_by_email('tedj.meabiou@gmail.com')
        tag_key = ndb.Key(urlsafe=request.entityKey)
        Edge.delete_all(start_node=tag_key)
        tag_key.delete()
        return message_types.VoidMessage()

    # tags.insert api
    @Tag.method(path='tags', http_method='POST', name='tags.insert')
    def TagInsert(self, my_model):
        user_from_email = User.get_by_email('tedj.meabiou@gmail.com')
        my_model.organization = user_from_email.organization
        my_model.owner = user_from_email.google_user_id
        my_model.put()
        return my_model
    # tags.list api v2
    @endpoints.method(TagListRequest, TagListResponse,
                      path='tags/list', http_method='POST',
                      name='tags.list')
    def blog_tag_list(self, request):
        user_from_email = User.get_by_email('tedj.meabiou@gmail.com')
        return Tag.list_by_kind(
                            user_from_email = user_from_email,
                            kind = request.about_kind
                            )

@endpoints.api(
               name='crmengine',
               version='v1',
               description='I/Ogrow CRM APIs',
               allowed_client_ids=[
                                   CLIENT_ID,
                                   endpoints.API_EXPLORER_CLIENT_ID
                                   ]
               )
class CrmEngineApi(remote.Service):

    ID_RESOURCE = endpoints.ResourceContainer(
            message_types.VoidMessage,
            id=messages.StringField(1))

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
                result = index.search(query)
                #total_matches = results.number_found
                # Iterate over the documents in the results
                if len(result.results) == limit + 1:
                    next_cursor = result.results[-1].cursor.web_safe_string
                else:
                    next_cursor = None
                results = result.results[:limit]
                for scored_document in results:
                    kwargs = {
                        "id" : scored_document.doc_id,
                        "rank" : scored_document.rank
                    }
                    for e in scored_document.fields:
                        if e.name in ["title","type"]:
                            kwargs[e.name]=e.value
                    search_results.append(SearchResult(**kwargs))
        except search.Error:
            logging.exception('Search failed')
        return SearchResults(items = search_results,nextPageToken=next_cursor)


    # Accounts APIs
    # accounts.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='accounts', http_method='DELETE',
                      name='accounts.delete')
    def account_delete(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        entityKey = ndb.Key(urlsafe=request.entityKey)
        if Node.check_permission(user_from_email,entityKey.get()):
            Edge.delete_all_cascade(start_node = entityKey)
            return message_types.VoidMessage()
        else:
            raise endpoints.UnauthorizedException('You don\'t have permissions.')

    # accounts.insert api v2
    @endpoints.method(AccountInsertRequest, AccountSchema,
                      path='accounts/insert', http_method='POST',
                      name='accounts.insert')
    def accounts_insert_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Account.insert(
                                user_from_email = user_from_email,
                                request = request
                            )
    # accounts.get api v2
    @endpoints.method(AccountGetRequest, AccountSchema,
                      path='accounts/getv2', http_method='POST',
                      name='accounts.getv2')
    def accounts_get_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Account.get_schema(
                                    user_from_email = user_from_email,
                                    request = request
                                )

    # accounts.list api v2
    @endpoints.method(AccountListRequest, AccountListResponse,
                      path='accounts/listv2', http_method='POST',
                      name='accounts.listv2')
    def accounts_list_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Account.list(
                            user_from_email = user_from_email,
                            request = request
                            )
    # accounts.patch API
    @Account.method(
                    user_required=True,
                    http_method='PATCH',
                    path='accounts/{id}',
                    name='accounts.patch'
                    )
    def AccountPatch(self, my_model):
        # user_from_email = EndpointsHelper.require_iogrow_user()
        # Todo: Check permissions
        user = EndpointsHelper.require_iogrow_user()
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
            patched_p = eval('patched_model.' + p)
            my_p = eval('my_model.' + p)
            if (patched_p != my_p) \
            and (my_p and not(p in ['put', 'set_perm', 'put_index'])):
                exec('patched_model.' + p + '= my_model.' + p)
        patched_model.put()
        if my_model.logo_img_id:
            if patched_model.folder:
                credentials = user.google_credentials
                http = credentials.authorize(httplib2.Http(memcache))
                service = build('drive', 'v2', http=http)
                params = {
                          'parents': [{'id': patched_model.folder}]
                        }
                service.files().patch(
                                    fileId=my_model.logo_img_id,
                                    body=params,
                                    fields='id').execute()
        return patched_model

    # accounts.search API
    @endpoints.method(SearchRequest, AccountSearchResults,
                        path='accounts/search', http_method='POST',
                        name='accounts.search')
    def account_search(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Account.search(
                            user_from_email = user_from_email,
                            request = request
                            )
    # Cases API
    # cases.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='cases', http_method='DELETE',
                      name='cases.delete')
    def case_delete(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        entityKey = ndb.Key(urlsafe=request.entityKey)
        if Node.check_permission(user_from_email,entityKey.get()):
            Edge.delete_all_cascade(start_node = entityKey)
            return message_types.VoidMessage()
        else:
            raise endpoints.UnauthorizedException('You don\'t have permissions.')

    # cases.getv2 api
    @endpoints.method(CaseGetRequest, CaseSchema,
                      path='cases/getv2', http_method='POST',
                      name='cases.getv2')
    def case_get_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Case.get_schema(
                            user_from_email = user_from_email,
                            request = request
                            )

    # cases.insertv2 api
    @endpoints.method(CaseInsertRequest, CaseSchema,
                      path='cases/insertv2', http_method='POST',
                      name='cases.insertv2')
    def case_insert_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Case.insert(
                            user_from_email = user_from_email,
                            request = request
                            )
    # cases.list api v2
    @endpoints.method(CaseListRequest, CaseListResponse,
                      path='cases/listv2', http_method='POST',
                      name='cases.listv2')
    def case_list_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Case.list(
                        user_from_email = user_from_email,
                        request = request
                        )
    # cases.patch API
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

    # cases.search API
    @endpoints.method(SearchRequest, CaseSearchResults,
                        path='cases/search', http_method='POST',
                        name='cases.search')
    def cases_search(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Case.search(
                            user_from_email = user_from_email,
                            request = request
                            )

    # Cases status apis
    # casestatuses.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='casestatuses', http_method='DELETE',
                      name='casestatuses.delete')
    def casestatuses_delete(self, request):
        entityKey = ndb.Key(urlsafe=request.entityKey)
        Edge.delete_all_cascade(start_node = entityKey)
        return message_types.VoidMessage()


    # casestatuses.get api
    @Casestatus.method(
                       request_fields=('id',),
                       path='casestatuses/{id}',
                       http_method='GET',
                       name='casestatuses.get'
                       )
    def CasestatusGet(self, my_model):
        if not my_model.from_datastore:
            raise('Case status not found')
        return my_model

    # casestatuses.insert api
    @Casestatus.method(
                       user_required=True,
                       path='casestatuses',
                       http_method='POST',
                       name='casestatuses.insert'
                       )
    def CasestatusInsert(self, my_model):
        user_from_email = EndpointsHelper.require_iogrow_user()
        my_model.owner = user_from_email.google_user_id
        my_model.organization = user_from_email.organization
        my_model.put()
        return my_model

    # casestatuses.list api
    @Casestatus.query_method(
                             user_required=True,
                             query_fields=(
                                           'limit',
                                           'order',
                                           'pageToken'
                                           ),
                             path='casestatuses',
                             name='casestatuses.list'
                             )
    def CasestatusList(self, query):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return query.filter(Casestatus.organization == user_from_email.organization)


    # casestatuses.patch api
    @Casestatus.method(
                       user_required=True,
                       http_method='PATCH',
                       path='casestatuses/{id}',
                       name='casestatuses.patch'
                       )
    def CasestatusPatch(self, my_model):
        #user_from_email = EndpointsHelper.require_iogrow_user()
        my_model.put()
        return my_model

    # Comments APIs
    # comments.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='comments', http_method='DELETE',
                      name='comments.delete')
    def comment_delete(self, request):
        entityKey = ndb.Key(urlsafe=request.entityKey)
        Edge.delete_all_cascade(start_node = entityKey)
        return message_types.VoidMessage()

    # comments.insert v2 api
    @endpoints.method(CommentInsertRequest, CommentSchema,
                        path='comments/insertv2', http_method='POST',
                        name='comments.insertv2')
    def comment_insert(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        parent_key = ndb.Key(urlsafe=request.about)
        parent = parent_key.get()
        # insert topics edge if this is the first comment
        if parent_key.kind() != 'Note' and parent.comments == 0:
            edge_list = Edge.list(
                                start_node=parent_key,
                                kind='parents'
                                )
            for edge in edge_list['items']:
                topic_parent = edge.end_node
                Edge.insert(
                    start_node = topic_parent,
                    end_node = parent_key,
                    kind = 'topics',
                    inverse_edge = 'parents'
                )
        parent.comments = parent.comments + 1
        parent.put()
        comment_author = Userinfo()
        comment_author.display_name = user_from_email.google_display_name
        comment_author.photo = user_from_email.google_public_profile_photo_url
        comment = Comment(
                    owner = user_from_email.google_user_id,
                    organization = user_from_email.organization,
                    author = comment_author,
                    content = request.content
                )
        entityKey_async = comment.put_async()
        entityKey = entityKey_async.get_result()
        Edge.insert(
                    start_node = parent_key,
                    end_node = entityKey,
                    kind = 'comments',
                    inverse_edge = 'parents'
                )
        author_schema = AuthorSchema(
                                google_user_id = comment.author.google_user_id,
                                display_name = comment.author.display_name,
                                google_public_profile_url = comment.author.google_public_profile_url,
                                photo = comment.author.photo
                            )
        comment_schema = CommentSchema(
                                        id = str(entityKey.id()),
                                        entityKey = entityKey.urlsafe(),
                                        author =  author_schema,
                                        content = comment.content,
                                        created_at = comment.created_at.isoformat(),
                                        updated_at = comment.updated_at.isoformat()
                                    )
        return comment_schema

    # comments.listv2 v2 api
    @endpoints.method(CommentListRequest, CommentListResponse,
                        path='comments/listv2', http_method='POST',
                        name='comments.listv2')
    def comment_list(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        comment_list = []
        parent_key = ndb.Key(urlsafe = request.about)
        comment_edge_list = Edge.list(
                                start_node = parent_key,
                                kind='comments',
                                limit=request.limit,
                                pageToken=request.pageToken,
                                order = 'ASC'
                                )
        for edge in comment_edge_list['items']:
            comment = edge.end_node.get()
            author_schema = AuthorSchema(
                                google_user_id = comment.author.google_user_id,
                                display_name = comment.author.display_name,
                                google_public_profile_url = comment.author.google_public_profile_url,
                                photo = comment.author.photo
                            )
            comment_schema = CommentSchema(
                                        id = str(edge.end_node.id()),
                                        entityKey = edge.end_node.urlsafe(),
                                        author =  author_schema,
                                        content = comment.content,
                                        created_at = comment.created_at.isoformat(),
                                        updated_at = comment.updated_at.isoformat()
                                    )
            comment_list.append(comment_schema)
        if comment_edge_list['next_curs'] and comment_edge_list['more']:
            comment_next_curs = comment_edge_list['next_curs'].urlsafe()
        else:
            comment_next_curs = None
        return CommentListResponse(
                                    items = comment_list,
                                    nextPageToken = comment_next_curs
                                )

    # comments.patch API
    @Comment.method(
                    user_required=True,
                    http_method='PATCH',
                    path='comments/{id}',
                    name='comments.patch'
                    )
    def CommentPatch(self, my_model):
        # user_from_email = EndpointsHelper.require_iogrow_user()
        # TODO: Check permissions
        my_model.put()
        return my_model

    # Contacts APIs
    # contacts.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='contacts', http_method='DELETE',
                      name='contacts.delete')
    def contact_delete(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        entityKey = ndb.Key(urlsafe=request.entityKey)
        if Node.check_permission(user_from_email,entityKey.get()):
            Edge.delete_all_cascade(start_node = entityKey)
            return message_types.VoidMessage()
        else:
            raise endpoints.UnauthorizedException('You don\'t have permissions.')


    # contacts.insertv2 api
    @endpoints.method(ContactInsertRequest, ContactSchema,
                      path='contacts/insertv2', http_method='POST',
                      name='contacts.insertv2')
    def contact_insert_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Contact.insert(
                            user_from_email = user_from_email,
                            request = request
                            )

    # contacts.import api
    @endpoints.method(ContactImportRequest, message_types.VoidMessage,
                      path='contacts/import', http_method='POST',
                      name='contacts.import')
    def contact_import_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        Contact.import_from_csv(
                            user_from_email = user_from_email,
                            request = request
                            )
        return message_types.VoidMessage()

    # contacts.get api v2
    @endpoints.method(ContactGetRequest, ContactSchema,
                      path='contacts/getv2', http_method='POST',
                      name='contacts.getv2')
    def contact_get_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Contact.get_schema(
                            user_from_email = user_from_email,
                            request = request
                            )
    # contacts.list api v2
    @endpoints.method(ContactListRequest, ContactListResponse,
                      path='contacts/listv2', http_method='POST',
                      name='contacts.listv2')
    def contact_list_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Contact.list(
                            user_from_email = user_from_email,
                            request = request
                            )

    # contacts.patch API
    @Contact.method(
                    user_required=True,
                    http_method='PATCH',
                    path='contacts/{id}',
                    name='contacts.patch'
                    )
    def ContactPatch(self, my_model):
        #user_from_email = EndpointsHelper.require_iogrow_user()
        # TODO: Check permissions
        if not my_model.from_datastore:
            raise endpoints.NotFoundException('Contact not found.')
        patched_model_key = my_model.entityKey
        patched_model = ndb.Key(urlsafe=patched_model_key).get()
        properties = Contact().__class__.__dict__
        for p in properties.keys():
            if (eval('patched_model.' + p) != eval('my_model.' + p)) \
            and(eval('my_model.' + p) and not(p in ['put', 'set_perm', 'put_index'])):
                exec('patched_model.' + p + '= my_model.' + p)
        patched_model.put()
        return patched_model

    #contacts.search API
    @endpoints.method(SearchRequest, ContactSearchResults,
                        path='contacts/search', http_method='POST',
                        name='contacts.search')
    def contact_search(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Contact.search(
                            user_from_email = user_from_email,
                            request = request
                            )



    # Contributors APIs
    # contributors.insert API
    @Contributor.method(
                        user_required=True,
                        path='contributors',
                        http_method='POST',
                        name='contributors.insert'
                        )
    def insert_contributor(self, my_model):
        user_from_email = EndpointsHelper.require_iogrow_user()
        # TODO: Check permissions
        my_model.created_by = user_from_email.google_user_id
        my_model.organization = user_from_email.organization
        discussion_key = my_model.discussionKey
        discussion_kind = discussion_key.kind()
        discussion = discussion_key.get()
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

    # contributors.list API
    @Contributor.query_method(user_required=True,query_fields=('discussionKey', 'limit', 'order', 'pageToken'),path='contributors', name='contributors.list')
    def contributor_list(self, query):
        return query

    # Documents APIs
    # documents.attachfiles API
    @endpoints.method(
                      MultipleAttachmentRequest,
                      message_types.VoidMessage,
                      path='documents/attachfiles',
                      http_method='POST',
                      name='documents.attachfiles'
                      )
    def attach_files(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        # Todo: Check permissions
        return Document.attach_files(
                            user_from_email = user_from_email,
                            request = request
                            )

    # documents.get API
    # documents.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='documents', http_method='DELETE',
                      name='documents.delete')
    def document_delete(self, request):
        entityKey = ndb.Key(urlsafe=request.entityKey)
        Edge.delete_all_cascade(start_node = entityKey)
        return message_types.VoidMessage()

    @endpoints.method(ID_RESOURCE, DocumentSchema,
                        path='documents/{id}', http_method='GET',
                        name='documents.get')
    def document_get(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Document.get_schema(
                                user_from_email = user_from_email,
                                request = request
                            )
    # documents.insertv2 api
    @endpoints.method(DocumentInsertRequest, DocumentSchema,
                      path='documents/insertv2', http_method='POST',
                      name='documents.insertv2')
    def document_insert_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Document.insert(
                            user_from_email = user_from_email,
                            request = request
                            )

     # documents.patch API
    @Document.method(user_required=True,
                  http_method='PATCH', path='documents/{id}', name='documents.patch')
    def DocumentPatch(self, my_model):
        user_from_email = EndpointsHelper.require_iogrow_user()
        # Todo: Check permissions
        my_model.put()
        return my_model

    #Edges APIs
    # edges.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='edges', http_method='DELETE',
                      name='edges.delete')
    def delete_edge(self, request):
        edge_key = ndb.Key(urlsafe=request.entityKey)
        Edge.delete(edge_key)
        return message_types.VoidMessage()

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
            EndpointsHelper.update_edge_indexes(
                                            parent_key = start_node,
                                            kind = item.kind,
                                            indexed_edge = str(end_node.id())
                                            )
            items.append(EdgeSchema(id=str( edge_key.id() ),
                                     entityKey = edge_key.urlsafe(),
                                     kind = item.kind,
                                     start_node = item.start_node,
                                     end_node= item.end_node ))
        return EdgesResponse(items=items)

    # Emails APIs
    #emails.send API
    @endpoints.method(EmailRequest, message_types.VoidMessage,
                        path='emails/send', http_method='POST',
                        name='emails.send')
    def send_email(self, request):
        print request, "rrrrrrrrrrrrrrss";
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
        parent_key = ndb.Key(urlsafe=request.about)
        note_author = Userinfo()
        note_author.display_name = user.google_display_name
        note_author.photo = user.google_public_profile_photo_url
        note = Note(
                    owner = user.google_user_id,
                    organization = user.organization,
                    author = note_author,
                    title = 'Email: '+ request.subject,
                    content = request.body
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
                                            parent_key = parent_key,
                                            kind = 'topics',
                                            indexed_edge = str(entityKey.id())
                                            )
        return message_types.VoidMessage()

    # Events APIs

    # events.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='events', http_method='DELETE',
                      name='events.delete')
    def event_delete(self, request):
        entityKey = ndb.Key(urlsafe=request.entityKey)
        Edge.delete_all_cascade(start_node = entityKey)
        return message_types.VoidMessage()

    # events.get API
    @endpoints.method(ID_RESOURCE, EventSchema,
                        path='events/{id}', http_method='GET',
                        name='events.get')
    def event_get(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Event.get_schema(
                                user_from_email = user_from_email,
                                request = request
                            )


    # events.insertv2 api
    @endpoints.method(EventInsertRequest, EventSchema,
                      path='events/insertv2', http_method='POST',
                      name='events.insertv2')
    def event_insert_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Event.insert(
                            user_from_email = user_from_email,
                            request = request
                            )

    # events.lists api
    @endpoints.method(EventListRequest, EventListResponse,
                      path='events/list', http_method='POST',
                      name='events.list')
    def event_list_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Event.list(
                            user_from_email = user_from_email,
                            request = request
                            )

    # events.patch api
    @endpoints.method(EventPatchRequest, message_types.VoidMessage,
                        path='events/patch', http_method='POST',
                        name='events.patch')
    def events_patch(self, request):
        event_key = ndb.Key(urlsafe = request.entityKey)
        event = event_key.get()

        if event is None:
            raise endpoints.NotFoundException('Event not found')
        event_patch_keys = ['title','starts_at','ends_at','description','where']
        date_props = ['starts_at','ends_at']
        patched = False
        for prop in event_patch_keys:
            new_value = getattr(request,prop)
            if new_value:
                if prop in date_props:
                    new_value = datetime.datetime.strptime(new_value,"%Y-%m-%dT%H:%M:00.000000")
                setattr(event,prop,new_value)
                patched = True
        if patched:
            event.put()
        return message_types.VoidMessage()
    # Groups API
    # groups.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='groups', http_method='DELETE',
                      name='groups.delete')
    def group_delete(self, request):
        entityKey = ndb.Key(urlsafe=request.entityKey)
        Edge.delete_all_cascade(start_node = entityKey)
        return message_types.VoidMessage()

    # groups.get API
    @Group.method(request_fields=('id',),path='groups/{id}', http_method='GET', name='groups.get')
    def GroupGet(self, my_model):
        if not my_model.from_datastore:
            raise endpoints.NotFoundException('Account not found.')
        return my_model

    # groups.insert API
    @Group.method(user_required=True,path='groups', http_method='POST', name='groups.insert')
    def GroupInsert(self, my_model):
        user_from_email = EndpointsHelper.require_iogrow_user()
        # Todo: Check permissions
        my_model.organization = user_from_email.organization
        my_model.put()
        return my_model

    # groups.list API
    @Group.query_method(user_required=True,query_fields=('limit', 'order', 'pageToken'),path='groups', name='groups.list')
    def GroupList(self, query):
        return query

    # groups.patch API
    @Group.method(user_required=True,
                  http_method='PATCH', path='groups/{id}', name='groups.patch')
    def GroupPatch(self, my_model):
        user_from_email = EndpointsHelper.require_iogrow_user()
        # Todo: Check permissions
        my_model.put()
        return my_model

    # Leads APIs
    # leads.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='leads', http_method='DELETE',
                      name='leads.delete')
    def lead_delete(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        entityKey = ndb.Key(urlsafe=request.entityKey)
        if Node.check_permission(user_from_email,entityKey.get()):
            Edge.delete_all_cascade(start_node = entityKey)
            return message_types.VoidMessage()
        else:
            raise endpoints.UnauthorizedException('You don\'t have permissions.')

    # leads.convert api
    @endpoints.method(ID_RESOURCE, LeadSchema,
                      path='leads/convertv2', http_method='POST',
                      name='leads.convertv2')
    def lead_convert_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Lead.convert(
                            user_from_email = user_from_email,
                            request = request
                            )
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

    # leads.from_twitter api
    @endpoints.method(LeadFromTwitterRequest, LeadSchema,
                      path='leads/from_twitter', http_method='POST',
                      name='leads.from_twitter')
    def lead_from_twitter(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Lead.from_twitter(
                            user_from_email = user_from_email,
                            request = request
                            )
    # leads.get api v2
    @endpoints.method(LeadGetRequest, LeadSchema,
                      path='leads/getv2', http_method='POST',
                      name='leads.getv2')
    def lead_get_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Lead.get_schema(
                            user_from_email = user_from_email,
                            request = request
                            )

    # leads.insertv2 api
    @endpoints.method(LeadInsertRequest, LeadSchema,
                      path='leads/insertv2', http_method='POST',
                      name='leads.insertv2')
    def lead_insert_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Lead.insert(
                            user_from_email = user_from_email,
                            request = request
                            )


    # leads.list api v2
    @endpoints.method(LeadListRequest, LeadListResponse,
                      path='leads/listv2', http_method='POST',
                      name='leads.listv2')
    def lead_list_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Lead.list(
                        user_from_email = user_from_email,
                        request = request
                        )
    # leads.patch API
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

    # leads.search API
    @endpoints.method(SearchRequest, LeadSearchResults,
                        path='leads/search', http_method='POST',
                        name='leads.search')
    def leads_search(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Lead.search(
                            user_from_email = user_from_email,
                            request = request
                            )

    # Lead status APIs
    # leadstatuses.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='leadstatuses', http_method='DELETE',
                      name='leadstatuses.delete')
    def leadstatuses_delete(self, request):
        entityKey = ndb.Key(urlsafe=request.entityKey)
        Edge.delete_all_cascade(start_node = entityKey)
        return message_types.VoidMessage()



    # leadstatuses.get api
    @Leadstatus.method(
                       request_fields=('id',),
                       path='leadstatuses/{id}',
                       http_method='GET',
                       name='leadstatuses.get'
                       )
    def LeadstatusGet(self,my_model):
        if not my_model.from_datastore:
            raise('Lead status not found')
        return my_model

    # leadstatuses.insert api
    @Leadstatus.method(
                       user_required=True,
                       path='leadstatuses',
                       http_method='POST',
                       name='leadstatuses.insert'
                       )
    def LeadstatusInsert(self, my_model):
        user_from_email = EndpointsHelper.require_iogrow_user()
        my_model.owner = user_from_email.google_user_id
        my_model.organization = user_from_email.organization
        my_model.put()
        return my_model

    # leadstatuses.list api
    @Leadstatus.query_method(
                             user_required=True,
                             query_fields=(
                                           'limit',
                                           'order',
                                           'pageToken'
                                           ),
                             path='leadstatuses',
                             name='leadstatuses.list'
                             )
    def LeadstatusList(self, query):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return query.filter(Leadstatus.organization==user_from_email.organization)

    # leadstatuses.patch api
    @Leadstatus.method(
                       user_required=True,
                       http_method='PATCH',
                       path='leadstatuses/{id}',
                       name='leadstatuses.patch'
                       )
    def LeadstatusPatch(self, my_model):
        user_from_email = EndpointsHelper.require_iogrow_user()
        my_model.put()
        return my_model

    # Members APIs
    # members.get API
    @Member.method(request_fields=('id',),path='members/{id}', http_method='GET', name='members.get')
    def MemberGet(self, my_model):
        if not my_model.from_datastore:
            raise endpoints.NotFoundException('Account not found.')
        return my_model

    # members.insert API
    @Member.method(user_required=True,path='members', http_method='POST', name='members.insert')
    def MemberInsert(self, my_model):
        user_from_email = EndpointsHelper.require_iogrow_user()
        # Todo: Check permissions
        my_model.organization = user_from_email.organization
        my_model.put()
        return my_model

    # members.list API
    @Member.query_method(user_required=True,query_fields=('limit', 'order','groupKey', 'pageToken'),path='members', name='members.list')
    def MemberList(self, query):
        return query

    # members.patch API
    @Member.method(user_required=True,
                  http_method='PATCH', path='members/{id}', name='members.patch')
    def MemberPatch(self, my_model):
        user_from_email = EndpointsHelper.require_iogrow_user()
        # Todo: Check permissions
        my_model.put()
        return my_model

    # members.update API
    @Member.method(user_required=True,
                  http_method='PUT', path='members/{id}', name='members.update')
    def MemberUpdate(self, my_model):
        user_from_email = EndpointsHelper.require_iogrow_user()
        # Todo: Check permissions
        #my_model.owner = user_from_email.google_user_id
        #my_model.organization =  user_from_email.organization
        my_model.put()
        return my_model

    # Needs APIs

    # needs.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='needs', http_method='DELETE',
                      name='needs.delete')
    def need_delete(self, request):
        entityKey = ndb.Key(urlsafe=request.entityKey)
        Edge.delete_all_cascade(start_node = entityKey)
        return message_types.VoidMessage()
    # needs.get api
    @Need.method(request_fields=('id',),path='needs/{id}', http_method='GET', name='needs.get')
    def need_get(self, my_model):
        user_from_email = EndpointsHelper.require_iogrow_user()
        if not my_model.from_datastore:
            raise endpoints.NotFoundException('Need not found')
        return my_model
    # needs.insert v2 api
    @endpoints.method(NeedInsertRequest, NeedSchema,
                      path='needs/insertv2', http_method='POST',
                      name='needs.insertv2')
    def need_insert_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Need.insert(
                            user_from_email = user_from_email,
                            request = request
                            )
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

    # needs.list api
    @Need.query_method(user_required=True,query_fields=('limit', 'order', 'pageToken','about_kind','about_item', 'about_name',  'priority','need_status'),path='needs',name='needs.list')
    def need_list(self,query):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return query.filter(ndb.OR(ndb.AND(Need.access=='public',Need.organization==user_from_email.organization),Need.owner==user_from_email.google_user_id, Need.collaborators_ids==user_from_email.google_user_id)).order(Need._key)

    # needs.patch api
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

    # Notes APIs
    # notes.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='notes', http_method='DELETE',
                      name='notes.delete')
    def note_delete(self, request):
        entityKey = ndb.Key(urlsafe=request.entityKey)
        Edge.delete_all_cascade(start_node = entityKey)
        return message_types.VoidMessage()
    # notes.get api
    @endpoints.method(ID_RESOURCE, NoteSchema,
                        path='notes/{id}', http_method='GET',
                        name='notes.get')
    def NoteGet(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Note.get_schema(
                            user_from_email = user_from_email,
                            request = request
                            )

    # notes.insert v2 api
    @endpoints.method(NoteInsertRequest, message_types.VoidMessage,
                        path='notes/insertv2', http_method='POST',
                        name='notes.insertv2')
    def note_insert(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        parent_key = ndb.Key(urlsafe=request.about)
        note_author = Userinfo()
        note_author.display_name = user_from_email.google_display_name
        note_author.photo = user_from_email.google_public_profile_photo_url
        note = Note(
                    owner = user_from_email.google_user_id,
                    organization = user_from_email.organization,
                    author = note_author,
                    title = request.title,
                    content = request.content
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
                                            parent_key = parent_key,
                                            kind = 'topics',
                                            indexed_edge = str(entityKey.id())
                                            )
        return message_types.VoidMessage()

    # notes.patch API
    @Note.method(user_required=True,
                    http_method='PATCH', path='notes/{id}', name='notes.patch')
    def NotePatch(self, my_model):
        user_from_email = EndpointsHelper.require_iogrow_user()
        # Todo: Check permissions
        my_model.put()
        return my_model

    # Info Node APIs
    # infonode.insert API
    @endpoints.method(InfoNodeSchema, InfoNodeResponse,
                        path='infonode/insert', http_method='POST',
                        name='infonode.insert')
    def infonode_insert(self, request):
        parent_key = ndb.Key(urlsafe=request.parent)
        node = Node(kind=request.kind)
        node_values = []
        for record in request.fields:
            setattr(node, record.field, record.value)
            node_values.append(str(record.value))
        entityKey_async = node.put_async()
        entityKey = entityKey_async.get_result()
        Edge.insert(
                    start_node = parent_key,
                    end_node = entityKey,
                    kind = 'infos',
                    inverse_edge = 'parents'
                )
        indexed_edge = '_' + request.kind + ' ' + " ".join(node_values)
        EndpointsHelper.update_edge_indexes(
                                            parent_key = parent_key,
                                            kind = 'infos',
                                            indexed_edge = indexed_edge
                                            )
        return InfoNodeResponse(
                                entityKey=entityKey.urlsafe(),
                                kind=node.kind,
                                fields=request.fields
                                )

    # infonode.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='infonode', http_method='DELETE',
                      name='infonode.delete')
    def infonode_delete(self, request):
        entityKey = ndb.Key(urlsafe=request.entityKey)
        Edge.delete_all_cascade(start_node = entityKey)
        return message_types.VoidMessage()

    # infonode.list API
    @endpoints.method(
                      InfoNodeListRequest,
                      InfoNodeListResponse,
                      path='infonode/list',
                      http_method='POST',
                      name='infonode.list')
    def infonode_list(self, request):
        parent_key = ndb.Key(urlsafe=request.parent)
        return Node.list_info_nodes(
                                    parent_key = parent_key,
                                    request = request
                                    )
    # infonode.patch api
    @endpoints.method(InfoNodePatchRequest, message_types.VoidMessage,
                        path='infonode/patch', http_method='POST',
                        name='infonode.patch')
    def infonode_patch(self, request):
        node_key = ndb.Key(urlsafe = request.entityKey)
        parent_key = ndb.Key(urlsafe = request.parent)
        node = node_key.get()
        node_values = []
        if node is None:
            raise endpoints.NotFoundException('Node not found')
        for record in request.fields:
            setattr(node, record.field, record.value)
            node_values.append(str(record.value))
        node.put()
        indexed_edge = '_' + node.kind + ' ' + " ".join(node_values)
        EndpointsHelper.update_edge_indexes(
                                            parent_key = parent_key,
                                            kind = 'infos',
                                            indexed_edge = indexed_edge
                                            )
        return message_types.VoidMessage()

    # Opportunities APIs
    # opportunities.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='opportunities', http_method='DELETE',
                      name='opportunities.delete')
    def opportunity_delete(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        entityKey = ndb.Key(urlsafe=request.entityKey)
        if Node.check_permission(user_from_email,entityKey.get()):
            Edge.delete_all_cascade(start_node = entityKey)
            return message_types.VoidMessage()
        else:
            raise endpoints.UnauthorizedException('You don\'t have permissions.')

    # opportunities.get api v2
    @endpoints.method(OpportunityGetRequest, OpportunitySchema,
                      path='opportunities/getv2', http_method='POST',
                      name='opportunities.getv2')
    def opportunity_get_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Opportunity.get_schema(
                            user_from_email = user_from_email,
                            request = request
                            )

    # opportunities.insertv2 api
    @endpoints.method(OpportunityInsertRequest, OpportunitySchema,
                      path='opportunities/insertv2', http_method='POST',
                      name='opportunities.insertv2')
    def opportunity_insert_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Opportunity.insert(
                            user_from_email = user_from_email,
                            request = request
                            )

    # opportunities.list api v2
    @endpoints.method(OpportunityListRequest, OpportunityListResponse,
                      path='opportunities/listv2', http_method='POST',
                      name='opportunities.listv2')
    def opportunity_list_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Opportunity.list(
                                user_from_email = user_from_email,
                                request = request
                            )

    # opportunities.patch api
    @Opportunity.method(
                        user_required=True,
                        http_method='PATCH',
                        path='opportunities/{id}',
                        name='opportunities.patch'
                        )
    def OpportunityPatch(self, my_model):
        #user_from_email = EndpointsHelper.require_iogrow_user()
        # Todo: Check permissions
        my_model.put()
        return my_model

    # opportunities.search api
    @endpoints.method(
                      SearchRequest, OpportunitySearchResults,
                      path='opportunities/search',
                      http_method='POST',
                      name='opportunities.search'
                      )
    def opportunities_search(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Opportunity.search(
                                user_from_email = user_from_email,
                                request = request
                                )
    # opportunities.update_stage api
    @endpoints.method(UpdateStageRequest, message_types.VoidMessage,
                      path='opportunities.update_stage', http_method='POST',
                      name='opportunities.update_stage')
    def opportunity_update_stage(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        Opportunity.update_stage(
                                user_from_email = user_from_email,
                                request = request
                                )
        return message_types.VoidMessage()

    # Opportunity stages APIs
    # opportunitystage.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='opportunitystages', http_method='DELETE',
                      name='opportunitystages.delete')
    def opportunitystage_delete(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        entityKey = ndb.Key(urlsafe=request.entityKey)
        Edge.delete_all_cascade(start_node = entityKey)
        return message_types.VoidMessage()



    # opportunitystages.get api
    @Opportunitystage.method(
                             request_fields=('id',),
                             path='opportunitystage/{id}',
                             http_method='GET',
                             name='opportunitystages.get'
                             )
    def OpportunitystageGet(self, my_model):
        if not my_model.from_datastore:
            raise('Opportunity stage not found')
        return my_model

    # opportunitystages.insert api
    @Opportunitystage.method(
                             user_required=True,
                             path='opportunitystage',
                             http_method='POST',
                             name='opportunitystages.insert'
                             )
    def OpportunitystageInsert(self, my_model):
        user_from_email = EndpointsHelper.require_iogrow_user()
        my_model.owner = user_from_email.google_user_id
        my_model.organization = user_from_email.organization
        my_model.put()
        return my_model

    # opportunitystages.list api
    @Opportunitystage.query_method(
                                   user_required=True,
                                   query_fields=(
                                                 'limit',
                                                 'order',
                                                 'pageToken'
                                                 ),
                                   path='opportunitystage',
                                   name='opportunitystages.list'
                                   )
    def OpportunitystageList(self, query):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return query.filter(Opportunitystage.organization == user_from_email.organization)

    # opportunitystages.patch api
    @Opportunitystage.method(
                             user_required=True,
                             http_method='PATCH',
                             path='opportunitystage/{id}',
                             name='opportunitystages.patch'
                             )
    def OpportunitystagePatch(self, my_model):
        user_from_email = EndpointsHelper.require_iogrow_user()
        my_model.put()
        return my_model

    # Permissions APIs (Sharing Settings)
    # permissions.insertv2 api
    @endpoints.method(PermissionInsertRequest, message_types.VoidMessage,
                      path='permissions/insertv2', http_method='POST',
                      name='permissions.insertv2')
    def permission_insert_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        about_key = ndb.Key(urlsafe=request.about)
        about = about_key.get()
        # check if the user can give permissions for this object
        if about.access == 'private' and about.owner!=user_from_email.google_user_id:
            end_node_set = [user_from_email.key]
            if not Edge.find(start_node=about_key,kind='permissions',end_node_set=end_node_set,operation='AND'):
                raise endpoints.NotFoundException('Permission denied')
        for item in request.items:
            if item.type == 'user':
                # get the user
                shared_with_user_key = ndb.Key(urlsafe = item.value)
                shared_with_user = shared_with_user_key.get()
                if shared_with_user:
                    # check if user is in the same organization
                    if shared_with_user.organization == about.organization:
                        # insert the edge
                        Edge.insert(
                                    start_node = about_key,
                                    end_node = shared_with_user_key,
                                    kind = 'permissions',
                                    inverse_edge = 'has_access_on'
                                )
                        # update indexes on search for collobaorators_id
                        indexed_edge = shared_with_user.google_user_id + ' '
                        EndpointsHelper.update_edge_indexes(
                                            parent_key = about_key,
                                            kind = 'collaborators',
                                            indexed_edge = indexed_edge
                                            )
                        shared_with_user = None
            elif item.type == 'group':
                pass
                # get the group
                # get the members of this group
                # for each member insert the edge
                # update indexes on search for  collaborators_id
        return message_types.VoidMessage()

    # Tags APIs
    # tags.attachtag api v2
    @endpoints.method(iomessages.AddTagSchema, TagSchema,
                      path='tags/attach', http_method='POST',
                      name='tags.attach')
    def attach_tag(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Tag.attach_tag(
                                user_from_email = user_from_email,
                                request = request
                            )
    # tags.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='tags', http_method='DELETE',
                      name='tags.delete')
    def delete_tag(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        tag_key = ndb.Key(urlsafe=request.entityKey)
        Edge.delete_all(start_node=tag_key)
        tag_key.delete()
        return message_types.VoidMessage()

    # tags.insert api
    @Tag.method(user_required=True,path='tags', http_method='POST', name='tags.insert')
    def TagInsert(self, my_model):
        user_from_email = EndpointsHelper.require_iogrow_user()
        my_model.organization = user_from_email.organization
        my_model.owner = user_from_email.google_user_id
        my_model.put()
        return my_model

    # tags.list api v2
    @endpoints.method(TagListRequest, TagListResponse,
                      path='tags/list', http_method='POST',
                      name='tags.list')
    def tag_list(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Tag.list_by_kind(
                            user_from_email = user_from_email,
                            kind = request.about_kind
                            )
    # Tasks APIs
    # edges.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='tasks/delete', http_method='DELETE',
                      name='tasks.delete')
    def delete_task(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        entityKey = ndb.Key(urlsafe=request.entityKey)
        Edge.delete_all_cascade(start_node = entityKey)
        return message_types.VoidMessage()
    # tasks.get api
    @endpoints.method(ID_RESOURCE, TaskSchema,
                      path='tasks/{id}', http_method='GET',
                      name='tasks.get')
    def task_get(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Task.get_schema(
                                user_from_email = user_from_email,
                                request = request
                            )
    # tasks.insertv2 api
    @endpoints.method(TaskInsertRequest, TaskSchema,
                      path='tasks/insertv2', http_method='POST',
                      name='tasks.insertv2')
    def tasks_insert_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Task.insert(
                    user_from_email = user_from_email,
                    request = request
                    )

    # tasks.listv2 api
    @endpoints.method(TaskRequest, TaskListResponse,
                      path='tasks/listv2', http_method='POST',
                      name='tasks.listv2')
    def tasks_list_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Task.list(
                        user_from_email = user_from_email,
                        request = request
                        )

    # tasks.patch api
    @endpoints.method(TaskSchema, TaskSchema,
                      path='tasks/patch', http_method='PATCH',
                      name='tasks.patch')
    def tasks_patch_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Task.patch(
                    user_from_email = user_from_email,
                    request = request
                    )

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
                new_credentials = run( oauth_flow, credentials)
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
            service.permissions().insert(fileId=folderid, sendNotificationEmails= False, body=new_permission).execute()
        except:
            raise endpoints.UnauthorizedException('Invalid grant' )
            return

        invited_user = User.get_by_email(my_model.email)
        send_notification_mail = False
        if invited_user is not None:
            if invited_user.organization == user_from_email.organization or invited_user.organization is None:
                invited_user.invited_by = user_from_email.key
                invited_user_key = invited_user.put_async()
                invited_user_async = invited_user_key.get_result()
                invited_user_id = invited_user_async.id()
                my_model.id = invited_user_id
                Invitation.insert(my_model.email,user_from_email)
                send_notification_mail = True
            elif invited_user.organization is not None:
                raise endpoints.UnauthorizedException('User exist within another organization' )
                return
        else:
            my_model.invited_by = user_from_email.key
            my_model.status = 'invited'
            invited_user_key = my_model.put_async()
            invited_user_async = invited_user_key.get_result()
            invited_user_id = invited_user_async.id()
            Invitation.insert(my_model.email,user_from_email)
            send_notification_mail = True

        if send_notification_mail:
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


    # users.list api v2
    @endpoints.method(message_types.VoidMessage, iomessages.UserListSchema,
                      path='users/list', http_method='POST',
                      name='users.list')
    def user_list(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return User.list(organization=user_from_email.organization)

    # users.patch API
    @User.method(user_required=True,
                  http_method='PATCH', path='users/{id}', name='users.patch')
    def UserPatch(self, my_model):
        #user_from_email = EndpointsHelper.require_iogrow_user()
        # Todo: Check permissions
        if not my_model.from_datastore:
            raise endpoints.NotFoundException('Account not found.')
        patched_model_key = my_model.entityKey
        patched_model = ndb.Key(urlsafe=patched_model_key).get()
        properties = User().__class__.__dict__
        for p in properties.keys():
            patched_p = eval('patched_model.' + p)
            my_p = eval('my_model.' + p)
            if (patched_p != my_p) \
            and (my_p and not(p in ['put', 'set_perm', 'put_index'])):
                exec('patched_model.' + p + '= my_model.' + p)
        patched_model.put()
        return patched_model

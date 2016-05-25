# -*- coding: utf-8 -*-
"""
This file is the main part of ioGrow API. It contains all request, response
classes add to calling methods.

"""

import ast
import datetime
import json
import logging
import re
from django.utils.encoding import smart_str

import endpoints
import httplib2
import requests
import stripe
from apiclient.discovery import build
from google.appengine.api import mail
from google.appengine.api import memcache
from google.appengine.api import search
from google.appengine.api import taskqueue
from google.appengine.ext import ndb
from iomodels.Licenses import License, LicenseSchema, LicenseInsertRequest
from iomodels.accounts import Account, AccountGetRequest, AccountPatchRequest, AccountSchema, \
    AccountListRequest, AccountListResponse, AccountSearchResults, AccountInsertRequest
from iomodels.cases import Case, UpdateStatusRequest, CasePatchRequest, CaseGetRequest, CaseInsertRequest, \
    CaseListRequest, CaseSchema, CaseListResponse, CaseSearchResults
from iomodels.casestatuses import Casestatus
from iomodels.comments import Comment
from iomodels.contacts import Contact, ContactGetRequest, ContactInsertRequest, ContactPatchSchema, \
    ContactSchema, ContactListRequest, ContactListResponse, ContactSearchResults, ContactImportRequest, \
    ContactImportHighriseRequest, DetailImportHighriseRequest, \
    InvitationRequest, ContactMergeRequest
from iomodels.documents import Document, DocumentInsertRequest, DocumentSchema, MultipleAttachmentRequest, \
    DocumentListResponse
from iomodels.events import Event, EventInsertRequest, EventSchema, EventPatchRequest, EventListRequest, \
    EventListResponse, EventFetchListRequest, EventFetchResults
from iomodels.leads import Lead, LeadPatchRequest, LeadInsertRequest, LeadListRequest, \
    LeadListResponse, LeadSearchResults, LeadGetRequest, LeadSchema, FLNameFilterRequest, LeadMergeRequest, \
    FLsourceFilterRequest
from iomodels.leadstatuses import Leadstatus
from iomodels.notes import Note, AuthorSchema, DiscussionAboutSchema, \
    NoteSchema
from iomodels.opportunities import Opportunity, OpportunityPatchRequest, UpdateStageRequest, \
    OpportunitySchema, OpportunityInsertRequest, OpportunityListRequest, OpportunityListResponse, \
    OpportunitySearchResults, OpportunityGetRequest, NewOpportunityListRequest, AggregatedOpportunitiesResponse, \
    OppTimeline
from iomodels.opportunitystage import Opportunitystage, OpportunitystagePatchListRequestSchema, \
    OpportunitystageListSchema
from iomodels.profiles import ProfileDeleteRequest, Keyword, KeywordListResponse
from iomodels.tags import Tag, TagSchema, TagListRequest, TagListResponse, TagInsertRequest
from iomodels.tasks import Task, TaskSchema, TaskRequest, TaskListResponse, TaskInsertRequest
from protorpc import message_types
from protorpc import messages
from protorpc import remote

import iomessages
from crm.iomodels.pipelines import Pipeline, PipelineInsertRequest, PipelineSchema, PipelineGetRequest, \
    PipelineListRequest, PipelineListResponse, \
    PipelinePatchRequest
from endpoints_helper import EndpointsHelper
from iograph import Node, Edge, RecordSchema, InfoNodeResponse, InfoNodeListResponse
from iomessages import LinkedinProfileSchema, TwitterProfileSchema, LinkedinCompanySchema
from iomessages import SubscriptionSchema, LicencesQuantityMessage, SubscriptionListSchema
from iomodels import config
from model import Contributor
from model import CountryCurrency
from model import CustomField
from model import Invitation
from model import Logo
from model import Organization
from model import User
from model import Userinfo
from people import linked_in

# The ID of javascript client authorized to access to our api
# This client_id could be generated on the Google API console
# **************Client_id---------------
CLIENT_ID = '935370948155-a4ib9t8oijcekj8ck6dtdcidnfof4u8q.apps.googleusercontent.com'

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

        'url': '/#/notes/show/'
    }
}

ADMIN_EMAILS = ['tedj.meabiou@gmail.com', 'hakim@iogrow.com', 'mezianeh3@gmail.com', 'ilyes@iogrow.com',
                'osidsoft@gmail.com']


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


# gd_client = gdata.contacts.client.ContactsClient(source='<var>gcdc2013-iogrow</var>')

stripe.api_key = config.STRIPE_API_KEY



class getLinkedinSchema(messages.Message):
    name = messages.StringField(1)
    title = messages.StringField(2)
    url = messages.StringField(3)


class getLinkedinListSchema(messages.Message):
    items = messages.MessageField(getLinkedinSchema, 1, repeated=True)


class LinkedinProfileRequest(messages.Message):
    firstname = messages.StringField(1)
    lastname = messages.StringField(2)
    title = messages.StringField(3)
    company = messages.StringField(4)


class LinkedinProfileRequestSchema(messages.Message):
    url = messages.StringField(1)

    # The message class that defines the EntityKey schema


class EntityKeyRequest(messages.Message):
    entityKey = messages.StringField(1)


class IDsRequest(messages.Message):
    ids = messages.StringField(1, repeated=True)


class LinkedinInsertRequest(messages.Message):
    keyword = messages.StringField(1)


class LinkedinInsertResponse(messages.Message):
    results = messages.StringField(1)


class LinkedinGetRequest(messages.Message):
    keywords = messages.StringField(1, repeated=True)


class LinkedinGetResponse(messages.Message):
    results = messages.StringField(1)


class LinkedinListRequestDB(messages.Message):
    keyword = messages.StringField(1)
    page = messages.IntegerField(2)
    limit = messages.IntegerField(3)


class LinkedinListResponseDB(messages.Message):
    results = messages.StringField(1)
    more = messages.BooleanField(2)
    KW_exist = messages.BooleanField(3)


class LinkedinInsertResponseKW(messages.Message):
    message = messages.StringField(1)
    exist = messages.BooleanField(2)
    has_results = messages.BooleanField(3)


class spiderStateRequest(messages.Message):
    jobId = messages.StringField(1)


class spiderStateResponse(messages.Message):
    state = messages.BooleanField(1)

    # The message class that defines the ListRequest schema


class ListRequest(messages.Message):
    limit = messages.IntegerField(1)
    pageToken = messages.StringField(2)
    tags = messages.StringField(3, repeated=True)
    order = messages.StringField(4)


# HADJI Hicham 
class getDocsRequest(messages.Message):
    id = messages.IntegerField(1, required=True)
    documents = messages.MessageField(ListRequest, 2)


class NoteInsertRequest(messages.Message):
    about = messages.StringField(1, required=True)
    title = messages.StringField(2, required=True)
    content = messages.StringField(3)


class CommentInsertRequest(messages.Message):
    about = messages.StringField(1, required=True)
    content = messages.StringField(2, required=True)


class CommentSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    author = messages.MessageField(AuthorSchema, 3, required=True)
    content = messages.StringField(4, required=True)
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
    items = messages.MessageField(EdgeRequest, 1, repeated=True)


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
    files = messages.MessageField(MultipleAttachmentRequest, 8)


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
    parent_id = messages.StringField(5)
    parent_kind = messages.StringField(6)
    entityKey = messages.StringField(7)


# The message class that defines a set of search results
class SearchResults(messages.Message):
    items = messages.MessageField(SearchResult, 1, repeated=True)
    nextPageToken = messages.StringField(2)


class inviteResult(messages.Message):
    id = messages.StringField(1)
    title = messages.StringField(2)
    type = messages.StringField(3)
    rank = messages.IntegerField(4)
    parent_id = messages.StringField(5)
    parent_kind = messages.StringField(6)
    entityKey = messages.StringField(7)
    emails = messages.StringField(8)


class inviteResults(messages.Message):
    items = messages.MessageField(inviteResult, 1, repeated=True)
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


# the message for colaborator request
class ColaboratorSchema(messages.Message):
    display_name = messages.StringField(1)
    email = messages.StringField(2)
    img = messages.StringField(3)
    entityKey = messages.StringField(4)
    google_user_id = messages.StringField(5)


class ColaboratorItem(messages.Message):
    items = messages.MessageField(ColaboratorSchema, 1, repeated=True)


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



class PermissionRequest(messages.Message):
    type = messages.StringField(1, required=True)
    value = messages.StringField(2, required=True)


class PermissionInsertRequest(messages.Message):
    about = messages.StringField(1, required=True)
    items = messages.MessageField(PermissionRequest, 2, repeated=True)


# LBA 21-10-2014
class PermissionDeleteRequest(messages.Message):
    about = messages.StringField(1, required=True)
    type = messages.StringField(2)
    value = messages.StringField(3)


# request message to got the feeds for the calendar . hadji hicham 14-07-2014.
class CalendarFeedsRequest(messages.Message):
    calendar_feeds_start = messages.StringField(1)
    calendar_feeds_end = messages.StringField(2)


# result to feed the calendar
class CalendarFeedsResult(messages.Message):
    id = messages.StringField(1)
    title = messages.StringField(2)
    where = messages.StringField(3)
    starts_at = messages.StringField(4)
    ends_at = messages.StringField(5)
    entityKey = messages.StringField(6)
    allday = messages.StringField(7)
    my_type = messages.StringField(8)
    backgroundColor = messages.StringField(9)
    status_label = messages.StringField(10)
    google_url = messages.StringField(11)
    timezone = messages.StringField(12)
    description = messages.StringField(13)


# results
class CalendarFeedsResults(messages.Message):
    items = messages.MessageField(CalendarFeedsResult, 1, repeated=True)


# hadji hicham - 21-07-2014 . permission request
class EventPermissionRequest(messages.Message):
    id = messages.StringField(1)
    access = messages.StringField(2)
    parent = messages.StringField(3)

class OrganizationRquest(messages.Message):
    organization = messages.StringField(1)


class OrganizationResponse(messages.Message):
    organizationName = messages.StringField(1)
    organizationNumberOfUser = messages.StringField(2)
    organizationNumberOfLicense = messages.StringField(3)
    licenses = messages.MessageField(LicenseSchema, 4, repeated=True)


# hadji hicham . 17/08/2014 .
class BillingRequest(messages.Message):
    token_id = messages.StringField(1)
    token_email = messages.StringField(2)
    customer_id = messages.StringField(3)
    organization = messages.StringField(4)
    organizationKey = messages.StringField(5)


class BillingResponse(messages.Message):
    response = messages.StringField(2)


class purchaseRequest(messages.Message):
    token = messages.StringField(1)
    plan = messages.StringField(2)
    nb_licenses = messages.StringField(3)
    billing_contact_firstname = messages.StringField(4)
    billing_contact_lastname = messages.StringField(5)
    billing_contact_email = messages.StringField(6)
    billing_contact_address = messages.StringField(7)
    billing_contact_phone_number = messages.StringField(8)


class purchaseResponse(messages.Message):
    transaction_balance = messages.StringField(1)
    transaction_message = messages.StringField(2)
    transaction_failed = messages.BooleanField(3)
    nb_licenses = messages.IntegerField(4)
    total_amount = messages.IntegerField(5)
    expires_on = messages.StringField(6)
    licenses_type = messages.StringField(7)


class deleteInvitedEmailRequest(messages.Message):
    emails = messages.StringField(1, repeated=True)


class MsgSchema(messages.Message):
    msg = messages.StringField(1)


class deleteUserEmailRequest(messages.Message):
    entityKeys = messages.StringField(1, repeated=True)


class setAdminRequest(messages.Message):
    entityKey = messages.StringField(1)
    is_admin = messages.BooleanField(2)


class BillingDetailsRequest(messages.Message):
    billing_company_name = messages.StringField(1)
    billing_contact_firstname = messages.StringField(2)
    billing_contact_lastname = messages.StringField(3)
    billing_contact_email = messages.StringField(4)
    billing_contact_address = messages.StringField(5)
    billing_contact_phone_number = messages.StringField(6)


# HADJI HICHAM - 08/02/2015- upload a new logo for the organization
class uploadlogorequest(messages.Message):
    fileUrl = messages.StringField(1)
    fileId = messages.StringField(2)


class LogoResponse(messages.Message):
    fileUrl = messages.StringField(1)
    custom_logo = messages.StringField(2)


class uploadlogoresponse(messages.Message):
    success = messages.StringField(1)


class SignatureRequest(messages.Message):
    signature = messages.StringField(1)


class ContactSynchronizeRequest(messages.Message):
    limit = messages.StringField(1)

@endpoints.api(
    name='crmengine',
    version='v1',
    scopes=["https://www.googleapis.com/auth/plus.login",
            "https://www.googleapis.com/auth/plus.profile.emails.read"],
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

    @endpoints.method(SearchRequest, SearchResults,
                      path='search', http_method='POST',
                      name='search')
    def search_method(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        organization = str(user_from_email.organization.id())
        index = search.Index(name="GlobalIndex")
        # Show only objects where you have permissions
        query_string = request.q + ' AND (organization:' + organization + ' AND (access:public OR (owner:' + user_from_email.google_user_id + ' OR collaborators:' + user_from_email.google_user_id + ')))'
        search_results = []
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
            options = search.QueryOptions(limit=limit, cursor=cursor)
        else:
            options = search.QueryOptions(cursor=cursor)
        query = search.Query(query_string=query_string, options=options)
        try:
            if query:
                result = index.search(query)
                # total_matches = results.number_found
                # Iterate over the documents in the results
                if len(result.results) == limit:
                    next_cursor = result.results[-1].cursor.web_safe_string
                else:
                    next_cursor = None
                results = result.results[:limit]
                for scored_document in results:
                    kwargs = {
                        "id": scored_document.doc_id,
                        "rank": scored_document.rank
                    }
                    for e in scored_document.fields:
                        if e.name in ["title", "type", "parent_id", "parent_kind", "entityKey"]:
                            kwargs[e.name] = e.value
                    search_results.append(SearchResult(**kwargs))
        except search.Error:
            logging.exception('Search failed')
        return SearchResults(items=search_results, nextPageToken=next_cursor)

    @endpoints.method(uploadlogorequest, uploadlogoresponse, path='organization/uploadlogo',
                      http_method='POST', name='organization.uploadlogo')
    def upload_logo(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        logo = Logo.query(Logo.organization == user_from_email.organization).get()
        if logo is None:
            new_logo_created = Logo(fileUrl=request.fileUrl, organization=user_from_email.organization)
            new_logo_created.put()
        else:
            logo.fileUrl = request.fileUrl
            logo.custom_logo = None
            logo.put()
        taskqueue.add(
            url='/workers/sharedocument',
            queue_name='iogrow-low',
            params={
                'user_email': user_from_email.email,
                'access': 'anyone',
                'resource_id': request.fileId
            }
        )
        return uploadlogoresponse(success="yes")

    # Accounts APIs
    # accounts.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='accounts', http_method='DELETE',
                      name='accounts.delete')
    def account_delete(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        entityKey = ndb.Key(urlsafe=request.entityKey)
        if Node.check_permission(user_from_email, entityKey.get()):
            Edge.delete_all_cascade(start_node=entityKey)
            return message_types.VoidMessage()
        else:
            raise endpoints.UnauthorizedException('You don\'t have permissions.')

    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='accounts/delete_all', http_method='POST',
                      name='accounts.delete_all')
    def accounts_delete_all(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        params = {"owner": user_from_email.google_user_id}
        taskqueue.add(
            url='/workers/delete_user_accounts',
            queue_name='iogrow-critical',
            payload=json.dumps(params)
        )
        return message_types.VoidMessage()

    # accounts.insert api v2
    @endpoints.method(AccountInsertRequest, AccountSchema,
                      path='accounts/insert', http_method='POST',
                      name='accounts.insert')
    def accounts_insert_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Account.insert(
            user_from_email=user_from_email,
            request=request
        )

    # accounts.get api v2
    @endpoints.method(AccountGetRequest, AccountSchema,
                      path='accounts/getv2', http_method='POST',
                      name='accounts.getv2')
    def accounts_get_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Account.get_schema(
            user_from_email=user_from_email,
            request=request
        )

    # accounts.list api v2
    @endpoints.method(AccountListRequest, AccountListResponse,
                      path='accounts/listv2', http_method='POST',
                      name='accounts.listv2')
    def accounts_list_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Account.list(
            user_from_email=user_from_email,
            request=request
        )

    # accounts.patch API
    @endpoints.method(AccountPatchRequest, AccountSchema,
                      path='accounts/patch', http_method='POST',
                      name='accounts.patch')
    def accounts_patch(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Account.patch(
            user_from_email=user_from_email,
            request=request
        )

    # accounts.search API
    @endpoints.method(SearchRequest, AccountSearchResults,
                      path='accounts/search', http_method='POST',
                      name='accounts.search')
    def account_search(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Account.search(
            user_from_email=user_from_email,
            request=request
        )

    # Accounts import apis
    @endpoints.method(ContactImportRequest, iomessages.MappingJobResponse,
                      path='accounts/import', http_method='POST',
                      name='accounts.import')
    def account_import_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Account.import_from_csv_first_step(
            user_from_email=user_from_email,
            request=request
        )

    # accounts.import_from_csv_second_step
    @endpoints.method(iomessages.MappingJobResponse, message_types.VoidMessage,
                      path='accounts/import_from_csv_second_step', http_method='POST',
                      name='accounts.import_from_csv_second_step')
    def account_import_after_mapping(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        items = []
        for item in request.items:
            items.append(
                {
                    'key': item.key,
                    'source_column': item.source_column,
                    'matched_column': item.matched_column
                }
            )
        token = endpoints.users_id_token._get_token(None)
        params = {
            'token': token,
            'job_id': request.job_id,
            'items': items,
            'email': user_from_email.email
        }
        taskqueue.add(
            url='/workers/account_import_second_step',
            queue_name='iogrow-critical',
            payload=json.dumps(params)
        )
        return message_types.VoidMessage()

    # Cases API
    # cases.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='cases', http_method='DELETE',
                      name='cases.delete')
    def case_delete(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        entityKey = ndb.Key(urlsafe=request.entityKey)
        if Node.check_permission(user_from_email, entityKey.get()):
            Edge.delete_all_cascade(start_node=entityKey)
            return message_types.VoidMessage()
        else:
            raise endpoints.UnauthorizedException('You don\'t have permissions.')

    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='cases/delete_all', http_method='POST',
                      name='cases.delete_all')
    def cases_delete_all(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        params = {'owner': user_from_email.google_user_id}
        print(params)
        print(user_from_email)
        taskqueue.add(
            url='/workers/delete_user_cases',
            queue_name='iogrow-critical',
            payload=json.dumps(params)
        )
        return message_types.VoidMessage()

    # cases.getv2 api
    @endpoints.method(CaseGetRequest, CaseSchema,
                      path='cases/getv2', http_method='POST',
                      name='cases.getv2')
    def case_get_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Case.get_schema(
            user_from_email=user_from_email,
            request=request
        )

    # cases.insertv2 api
    @endpoints.method(CaseInsertRequest, CaseSchema,
                      path='cases/insertv2', http_method='POST',
                      name='cases.insertv2')
    def case_insert_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Case.insert(
            user_from_email=user_from_email,
            request=request
        )

    # cases.list api v2
    @endpoints.method(CaseListRequest, CaseListResponse,
                      path='cases/listv2', http_method='POST',
                      name='cases.listv2')
    def case_list_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Case.list(
            user_from_email=user_from_email,
            request=request
        )

    # cases.patch API
    @endpoints.method(CasePatchRequest, CaseSchema,
                      path='cases/patch', http_method='POST',
                      name='cases.patch')
    def case_patch_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Case.patch(
            user_from_email=user_from_email,
            request=request
        )

    # cases.search API
    @endpoints.method(SearchRequest, CaseSearchResults,
                      path='cases/search', http_method='POST',
                      name='cases.search')
    def cases_search(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Case.search(
            user_from_email=user_from_email,
            request=request
        )

    # cases.update_status
    @endpoints.method(UpdateStatusRequest, message_types.VoidMessage,
                      path='cases.update_status', http_method='POST',
                      name='cases.update_status')
    def case_update_status(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        Case.update_status(
            user_from_email=user_from_email,
            request=request
        )
        return message_types.VoidMessage()

    # cases export
    @endpoints.method(OpportunityListRequest, message_types.VoidMessage,
                      path='cases/export', http_method='POST',
                      name='cases.export')
    def export_cases(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        token = endpoints.users_id_token._get_token(None)
        params = {
            "access_token": token,
            "tags": request.tags,
            "fileName": user_from_email.email + "_" + str(user_from_email.id),
            "email": user_from_email.email
        }
        print params
        requests.post("http://104.154.83.131:8080/api/export_case", data=json.dumps(params),
                      headers={'content-type': 'application/json'})
        return message_types.VoidMessage()

    # cases export by key
    @endpoints.method(IDsRequest, message_types.VoidMessage,
                      path='cases/export_keys', http_method='POST',
                      name='cases.export_keys')
    def export_cases_keys(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        token = endpoints.users_id_token._get_token(None)
        params = {
            "access_token": token,
            "IDs": request.ids,
            "fileName": user_from_email.email + "_" + str(user_from_email.id),
            "email": user_from_email.email
        }
        requests.post("http://104.154.83.131:8080/api/export_case_by_key", data=json.dumps(params),
                      headers={'content-type': 'application/json'})
        return message_types.VoidMessage()

    # Cases status apis
    # casestatuses.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='casestatuses', http_method='DELETE',
                      name='casestatuses.delete')
    def casestatuses_delete(self, request):
        entityKey = ndb.Key(urlsafe=request.entityKey)
        Edge.delete_all_cascade(start_node=entityKey)
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
            raise Exception('Case status not found')
        return my_model

    # casestatuses.insert api
    @Casestatus.method(

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

        http_method='PATCH',
        path='casestatuses/{id}',
        name='casestatuses.patch'
    )
    def CasestatusPatch(self, my_model):
        my_model.put()
        return my_model

    # Comments APIs
    # comments.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='comments', http_method='DELETE',
                      name='comments.delete')
    def comment_delete(self, request):
        entityKey = ndb.Key(urlsafe=request.entityKey)
        Edge.delete_all_cascade(start_node=entityKey)
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
                    start_node=topic_parent,
                    end_node=parent_key,
                    kind='topics',
                    inverse_edge='parents'
                )
        if not parent.comments:
            parent.comments = 1
        else:
            parent.comments += 1

        parent.put()
        comment_author = Userinfo()
        comment_author.display_name = user_from_email.google_display_name
        comment_author.photo = user_from_email.google_public_profile_photo_url
        comment_author.google_user_id = user_from_email.google_user_id
        comment = Comment(
            owner=user_from_email.google_user_id,
            organization=user_from_email.organization,
            author=comment_author,
            content=request.content,
            parent_id=str(parent.id),
            parent_kind=parent_key.kind()
        )
        entityKey_a = comment.put()
        entityKey = entityKey_a
        Edge.insert(
            start_node=parent_key,
            end_node=entityKey,
            kind='comments',
            inverse_edge='parents'
        )
        author_schema = AuthorSchema(
            google_user_id=comment.author.google_user_id,
            display_name=comment.author.display_name,
            google_public_profile_url=comment.author.google_public_profile_url,
            photo=comment.author.photo
        )
        collobarators = Node.list_permissions(parent)
        email_list = []
        for collaborator in collobarators:
            email_list.append(collaborator.email)
        to = ",".join(email_list)
        url = DISCUSSIONS[parent_key.kind()]['url'] + str(parent_key.id())
        body = '<p>#new comment, view details on ioGrow: <a href="http://app.iogrow.com/' + url + '">'
        body += parent.title
        body += '</a></p>'
        body += '<p>' + request.content + '</p>'
        taskqueue.add(
            url='/workers/send_email_notification',
            queue_name='iogrow-low',
            params={
                'user_email': user_from_email.email,
                'to': to,
                'subject': '[RE]: ' + parent.title,
                'body': body
            }
        )
        comment_schema = CommentSchema(
            id=str(entityKey.id()),
            entityKey=entityKey.urlsafe(),
            author=author_schema,
            content=comment.content,
            created_at=comment.created_at.isoformat(),
            updated_at=comment.updated_at.isoformat()
        )
        return comment_schema

    # comments.listv2 v2 api
    @endpoints.method(CommentListRequest, CommentListResponse,
                      path='comments/listv2', http_method='POST',
                      name='comments.listv2')
    def comment_list(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        comment_list = []
        parent_key = ndb.Key(urlsafe=request.about)
        comment_edge_list = Edge.list(
            start_node=parent_key,
            kind='comments',
            limit=request.limit,
            pageToken=request.pageToken,
            order='ASC'
        )
        for edge in comment_edge_list['items']:
            comment = edge.end_node.get()
            author_schema = AuthorSchema(
                google_user_id=comment.author.google_user_id,
                display_name=comment.author.display_name,
                google_public_profile_url=comment.author.google_public_profile_url,
                photo=comment.author.photo
            )
            comment_schema = CommentSchema(
                id=str(edge.end_node.id()),
                entityKey=edge.end_node.urlsafe(),
                author=author_schema,
                content=comment.content,
                created_at=comment.created_at.isoformat(),
                updated_at=comment.updated_at.isoformat()
            )
            comment_list.append(comment_schema)
        if comment_edge_list['next_curs'] and comment_edge_list['more']:
            comment_next_curs = comment_edge_list['next_curs'].urlsafe()
        else:
            comment_next_curs = None
        return CommentListResponse(
            items=comment_list,
            nextPageToken=comment_next_curs
        )

    # comments.patch API
    @Comment.method(

        http_method='PATCH',
        path='comments/{id}',
        name='comments.patch'
    )
    def CommentPatch(self, my_model):
        # TODO: Check permissions
        my_model.put()
        return my_model

    # HADJI HICHAM -23/10/2014 delete comments.
    @Comment.method(user_required=True, request_fields=('id',),
                    response_message=message_types.VoidMessage,
                    http_method='DELETE', path='Comment_delete/{id}', name='comments.delete')
    def comment_delete(self, comment):
        Edge.delete_all(comment.key)
        EndpointsHelper.delete_document_from_index(comment.id)
        comment.key.delete()
        return message_types.VoidMessage()

    # Contacts APIs
    # contacts.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='contacts', http_method='DELETE',
                      name='contacts.delete')
    def contact_delete(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        entityKey = ndb.Key(urlsafe=request.entityKey)
        if Node.check_permission(user_from_email, entityKey.get()):
            Edge.delete_all_cascade(start_node=entityKey)
            return message_types.VoidMessage()
        else:
            raise endpoints.UnauthorizedException('You don\'t have permissions.')

    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='contacts/delete_all', http_method='POST',
                      name='contacts.delete_all')
    def contacts_delete_all(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        params = {'owner': user_from_email.google_user_id}
        print(params)
        print(user_from_email)
        taskqueue.add(
            url='/workers/delete_user_contacts',
            queue_name='iogrow-critical',
            payload=json.dumps(params)
        )
        return message_types.VoidMessage()

    # contacts.insertv2 api
    @endpoints.method(ContactInsertRequest, ContactSchema,
                      path='contacts/insertv2', http_method='POST',
                      name='contacts.insertv2')
    def contact_insert_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Contact.insert(
            user_from_email=user_from_email,
            request=request
        )

    # contact.merge

    @endpoints.method(ContactMergeRequest, ContactSchema,
                      path='contacts/merge', http_method='POST',
                      name='contacts.merge')
    def contact_merge(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Contact.merge(user_from_email=user_from_email, contact_merge_request=request)

    @endpoints.method(FLNameFilterRequest, ContactListResponse,
                      path='contacts/filter', http_method='POST',
                      name='contacts.filter')
    def contact_filter(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Contact.filter_by_first_and_last_name_response(user_from_email=user_from_email, request=request)

    # contacts.import api
    @endpoints.method(ContactImportRequest, iomessages.MappingJobResponse,
                      path='contacts/import', http_method='POST',
                      name='contacts.import')
    def contact_import_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Contact.import_from_csv_first_step(
            user_from_email=user_from_email,
            request=request
        )

    # contacts.import api
    @endpoints.method(iomessages.MappingJobResponse, message_types.VoidMessage,
                      path='contacts/import_from_csv_second_step', http_method='POST',
                      name='contacts.import_from_csv_second_step')
    def contact_import_after_mapping(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        items = []
        for item in request.items:
            items.append(
                {
                    'key': item.key,
                    'source_column': item.source_column,
                    'matched_column': item.matched_column
                }
            )
        token = endpoints.users_id_token._get_token(None)
        params = {
            'token': token,
            'job_id': request.job_id,
            'items': items,
            'email': user_from_email.email
        }
        taskqueue.add(
            url='/workers/contact_import_second_step',
            queue_name='iogrow-critical',
            payload=json.dumps(params)
        )
        return message_types.VoidMessage()


    @endpoints.method(iomessages.CustomFieldInsertRequestSchema, iomessages.CustomFieldSchema,
                      path='customfield/insert', http_method='POST',
                      name='customfield.insert')
    def custom_fields_insert(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        order = CustomField.last_order_by_object(user_from_email, request.related_object) + 1
        custom_field = CustomField(
            name=request.name,
            related_object=request.related_object,
            field_type=request.field_type,
            help_text=request.help_text,
            options=request.options,
            scale_min=request.scale_min,
            scale_max=request.scale_max,
            label_min=request.label_min,
            label_max=request.label_max,
            order=order,
            owner=user_from_email.google_user_id,
            organization=user_from_email.organization
        )
        custom_field.put()
        return iomessages.CustomFieldSchema(
            id=str(custom_field.key.id()),
            entityKey=custom_field.key.urlsafe(),
            name=custom_field.name,
            related_object=custom_field.related_object,
            field_type=custom_field.field_type,
            help_text=custom_field.help_text,
            options=custom_field.options,
            scale_min=custom_field.scale_min,
            scale_max=custom_field.scale_max,
            label_min=custom_field.label_min,
            label_max=custom_field.label_max,
            order=custom_field.order,
            created_at=custom_field.created_at.strftime("%Y-%m-%dT%H:%M:00.000")
        )

    # customfield.list api
    @endpoints.method(iomessages.CustomFieldListRequestSchema, iomessages.CustomFieldListResponseSchema,
                      path='customfield/list', http_method='POST',
                      name='customfield.list')
    def custom_fields_list(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        custom_fields = CustomField.list_by_object(user_from_email, request.related_object)
        items = []
        for custom_field in custom_fields:
            custom_field_schema = iomessages.CustomFieldSchema(
                id=str(custom_field.key.id()),
                entityKey=custom_field.key.urlsafe(),
                name=custom_field.name,
                related_object=custom_field.related_object,
                field_type=custom_field.field_type,
                help_text=custom_field.help_text,
                options=custom_field.options,
                scale_min=custom_field.scale_min,
                scale_max=custom_field.scale_max,
                label_min=custom_field.label_min,
                label_max=custom_field.label_max,
                order=custom_field.order,
                created_at=custom_field.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                updated_at=custom_field.updated_at.strftime("%Y-%m-%dT%H:%M:00.000")
            )
            items.append(custom_field_schema)
        return iomessages.CustomFieldListResponseSchema(items=items)

    @endpoints.method(iomessages.CustomFieldPatchRequestSchema, message_types.VoidMessage,
                      path='customfield/patch', http_method='POST',
                      name='customfield.patch')
    def custom_fields_patch(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        customfield = CustomField.get_by_id(int(request.id))
        if customfield is None:
            raise endpoints.NotFoundException('Custom Field not found.')

        properties = ['name', 'field_type', 'help_text', 'options',
                      'scale_min', 'scale_max', 'label_min', 'label_max']
        for p in properties:
            if hasattr(request, p):
                if (eval('customfield.' + p) != eval('request.' + p)) \
                        and (eval('request.' + p)):
                    exec ('customfield.' + p + '= request.' + p)
        customfield.put()
        if request.order:
            CustomField.reorder(user_from_email, customfield, request.order)
        return message_types.VoidMessage()

    # customfield.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='customfield/delete', http_method='POST',
                      name='customfield.delete')
    def custom_fields_delete(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        custom_field_key = ndb.Key(urlsafe=request.entityKey)
        custom_field_key.delete()
        return message_types.VoidMessage()

    # highrise.import_peoples api
    @endpoints.method(ContactImportHighriseRequest, message_types.VoidMessage,
                      path='highrise/import_peoples', http_method='POST',
                      name='highrise.import_peoples')
    def highrise_import_peoples(self, request):
        user = EndpointsHelper.require_iogrow_user()
        accounts_keys = {}
        companies = EndpointsHelper.highrise_import_companies(request)
        for company_details in companies:
            phones = list()
            phone = iomessages.PhoneSchema()
            if len(company_details.contact_data.phone_numbers) != 0:
                phone.number = company_details.contact_data.phone_numbers[0].number
                phone.type = str(company_details.contact_data.phone_numbers[0].location)
            phones.append(phone)
            email = iomessages.EmailSchema()
            if len(company_details.contact_data.email_addresses) != 0:
                email.email = company_details.contact_data.email_addresses[0].address
            emails = list()
            emails.append(email)
            url = ""
            if len(company_details.contact_data.web_addresses) != 0:
                url = company_details.contact_data.web_addresses[0].url
            twitter_account = ""
            if len(company_details.contact_data.twitter_accounts) != 0:
                twitter_account = company_details.contact_data.twitter_accounts[0].username
            country = ""
            if len(company_details.contact_data.addresses) != 0:
                country = company_details.contact_data.addresses[0].country
            street = ""
            if len(company_details.contact_data.addresses) != 0:
                street = company_details.contact_data.addresses[0].street
            infonode = iomessages.InfoNodeRequestSchema(
                kind='company',
                fields=[
                    iomessages.RecordSchema(
                        field='url',
                        value=url
                    ),
                    iomessages.RecordSchema(
                        field='twitter_account',
                        value=twitter_account
                    ),
                    iomessages.RecordSchema(
                        field='country',
                        value=country
                    ),
                    iomessages.RecordSchema(
                        field='street',
                        value=street
                    )

                ]
            )
            infonodes = list()
            infonodes.append(infonode)
            account_request = AccountInsertRequest(
                name=company_details.name,
                emails=emails,
                logo_img_url=company_details.avatar_url,
                infonodes=infonodes,
                phones=phones
            )

            account_schema = Account.insert(user, account_request)
            accounts_keys[company_details.id] = ndb.Key(urlsafe=account_schema.entityKey)
        people = EndpointsHelper.highrise_import_peoples(request)
        contacts_keys = {}
        tasks_id = []
        for person in people:
            account_schema = ""
            if person.company_id != 0:
                company_details = EndpointsHelper.highrise_import_company_details(person.company_id)
                phones = list()
                phone = iomessages.PhoneSchema()
                if len(company_details.contact_data.phone_numbers) != 0:
                    phone.number = company_details.contact_data.phone_numbers[0].number
                    phone.type = str(company_details.contact_data.phone_numbers[0].location)
                phones.append(phone)
                email = iomessages.EmailSchema()

                if len(company_details.contact_data.email_addresses) != 0:
                    email.email = company_details.contact_data.email_addresses[0].address
                emails = list()
                emails.append(email)
                url = ""
                if len(company_details.contact_data.web_addresses) != 0:
                    url = company_details.contact_data.web_addresses[0].url
                twitter_account = ""
                if len(company_details.contact_data.twitter_accounts) != 0:
                    twitter_account = company_details.contact_data.twitter_accounts[0].username
                country = ""
                if len(company_details.contact_data.addresses) != 0:
                    country = company_details.contact_data.addresses[0].country
                street = ""
                if len(company_details.contact_data.addresses) != 0:
                    street = company_details.contact_data.addresses[0].street
                infonode = iomessages.InfoNodeRequestSchema(
                    kind='company',
                    fields=[
                        iomessages.RecordSchema(
                            field='url',
                            value=url
                        ),
                        iomessages.RecordSchema(
                            field='twitter_account',
                            value=twitter_account
                        ),
                        iomessages.RecordSchema(
                            field='country',
                            value=country
                        ),
                        iomessages.RecordSchema(
                            field='street',
                            value=street
                        )

                    ]
                )
                infonodes = list()
                infonodes.append(infonode)
                account_request = AccountInsertRequest(
                    name=person.company_name,
                    emails=emails,
                    logo_img_url=company_details.avatar_url,
                    infonodes=infonodes,
                    phones=phones
                )
                account_schema = Account.insert(user, account_request)

            # Store Persone
            if account_schema != "":
                key = account_schema.entityKey

            else:
                key = None

            infonodes = list()
            infonodes.append(infonode)
            phone = iomessages.PhoneSchema()
            if len(person.contact_data.phone_numbers) != 0:
                phone.number = person.contact_data.phone_numbers[0].number
            if len(person.contact_data.phone_numbers) != 0:
                phone.type = str(person.contact_data.phone_numbers[0].location)
            phones = list()
            phones.append(phone)
            contact_request = ContactInsertRequest(
                account=key,
                firstname=person.first_name,
                lastname=person.last_name,
                title=person.title,
                profile_img_url=person.avatar_url,
                infonodes=infonodes,
                phones=phones
            )

            contact_schema = Contact.insert(user, contact_request)
            contacts_keys[person.id] = ndb.Key(urlsafe=contact_schema.entityKey)
            if account_schema != "":
                Edge.insert(start_node=ndb.Key(urlsafe=account_schema.entityKey),
                            end_node=ndb.Key(urlsafe=contact_schema.entityKey),
                            kind='contacts',
                            inverse_edge='parents')

            tasks = EndpointsHelper.highrise_import_tasks_of_person(person.id)

            for task in tasks:
                tasks_id.append(task.id)
                assigne = EntityKeyRequest(
                    entityKey=contact_schema.entityKey
                )
                assignes = list()
                assignes.append(assigne)
                access = "private"
                if task.public == 'true':
                    access = "public"
                task_request = TaskInsertRequest(
                    title=task.body,
                    status=task.frame,
                    due=task.due_at.strftime("%d/%m/%Y"),
                    access=access,
                    assignees=assignes
                )
                task_schema = Task.insert(user, task_request)

            notes = list()
            try:
                notes = EndpointsHelper.highrise_import_notes_of_person(person.id)
            except Exception:
                print Exception
            for note in notes:
                print note.__dict__
                note_author = Userinfo()
                note_author.display_name = user.google_display_name
                note_author.photo = user.google_public_profile_photo_url
                note = Note(
                    owner=user.google_user_id,
                    organization=user.organization,
                    author=note_author,
                    title="",
                    content=note.body
                )
                entityKey_async = note.put_async()
                entityKey = entityKey_async.get_result()
                Edge.insert(
                    start_node=ndb.Key(urlsafe=contact_schema.entityKey),
                    end_node=entityKey,
                    kind='topics',
                    inverse_edge='parents'
                )
                EndpointsHelper.update_edge_indexes(
                    parent_key=ndb.Key(urlsafe=contact_schema.entityKey),
                    kind='topics',
                    indexed_edge=str(entityKey.id())
                )

        deals = EndpointsHelper.highrise_import_opportunities()
        i = 0
        for deal in deals:
            print i
            i += 1
            access = "private"
            if deal.visible_to == "Everyone":
                access = "public"
            if "name" in deal.party.__dict__.keys():
                # company
                if deal.party_id in accounts_keys.keys():
                    key = accounts_keys[deal.party_id]

                    opportunity_request = OpportunityInsertRequest(
                        name=deal.name,
                        description=deal.background,
                        account=key.urlsafe(),
                        duration=deal.duration,
                        currency=deal.currency,
                        amount_total=deal.price,
                        access=access
                    )
            else:
                # contact
                if deal.party_id in contacts_keys.keys():
                    key = contacts_keys[deal.party_id]
                    opportunity_request = OpportunityInsertRequest(
                        name=deal.name,
                        description=deal.background,
                        contact=key.urlsafe(),
                        duration=deal.duration,
                        currency=deal.currency,
                        amount_total=deal.price,
                        access=access
                    )

            Opportunity.insert(user, opportunity_request)

        # store tasks
        taskss = EndpointsHelper.highrise_import_tasks()
        for task in taskss:
            if task.id not in tasks_id:
                assignes = list()
                assignes.append(assigne)
                access = "private"
                if task.public == 'true':
                    access = "public"
                task_request = TaskInsertRequest(
                    title=task.body,
                    status=task.frame,
                    due=task.due_at.strftime("%d/%m/%Y"),
                    access=access
                )
                task_schema = Task.insert(user, task_request)
                print task_schema, "sehhhhhhhhhh"

        return message_types.VoidMessage()

    # highrise.import_companies apis
    @endpoints.method(ContactImportHighriseRequest, message_types.VoidMessage,
                      path='highrise/import_companies', http_method='POST',
                      name='highrise.import_companies')
    def highrise_import_companies(self, request):
        user = EndpointsHelper.require_iogrow_user()
        companies = EndpointsHelper.highrise_import_companies(request)
        for company in companies:
            company_details = EndpointsHelper.highrise_import_company_details(company.id)
            print company_details.contact_data.instant_messengers[0].__dict__
            phones = list()
            phone = iomessages.PhoneSchema(
                number=company_details.contact_data.phone_numbers[0].number
            )
            phones.append(phone)
            email = iomessages.EmailSchema(
                email=company_details.contact_data.email_addresses[0].address
            )
            emails = list()
            emails.append(email)
            infonode = iomessages.InfoNodeRequestSchema(
                kind='company',
                fields=[
                    iomessages.RecordSchema(
                        field='url',
                        value=company_details.contact_data.web_addresses[0].url
                    ),
                    iomessages.RecordSchema(
                        field='twitter_account',
                        value=company_details.contact_data.twitter_accounts[0].username
                    ),
                    iomessages.RecordSchema(
                        field='country',
                        value=company_details.contact_data.addresses[0].country
                    ),
                    iomessages.RecordSchema(
                        field='street',
                        value=company_details.contact_data.addresses[0].street
                    )

                ]
            )
            infonodes = list()
            infonodes.append(infonode)
            account_request = AccountInsertRequest(
                name=company.name,
                emails=emails,
                infonodes=infonodes,
                phones=phones
            )
            Account.insert(user, account_request)
        return message_types.VoidMessage()

    # highrise.import_opportunities api
    @endpoints.method(ContactImportHighriseRequest, message_types.VoidMessage,
                      path='highrise/import_opportunities', http_method='POST',
                      name='highrise.import_opportunities')
    def highrise_import_opportunities(self, request):
        opportunities = EndpointsHelper.highrise_import_opportunities(request)
        return message_types.VoidMessage()

    # highrise.import_tasks api
    @endpoints.method(ContactImportHighriseRequest, message_types.VoidMessage,
                      path='highrise/import_tasks', http_method='POST',
                      name='highrise.import_tasks')
    def highrise_import_tasks(self, request):
        tasks = EndpointsHelper.highrise_import_tasks(request)
        return message_types.VoidMessage()

    # highrise.import_tags api
    @endpoints.method(ContactImportHighriseRequest, message_types.VoidMessage,
                      path='highrise/import_tags', http_method='POST',
                      name='highrise.import_tags')
    def highrise_import_tags(self, request):
        tags = EndpointsHelper.highrise_import_tags(request)
        return message_types.VoidMessage()

    # highrise.import_cases api
    @endpoints.method(ContactImportHighriseRequest, message_types.VoidMessage,
                      path='highrise/import_cases', http_method='POST',
                      name='highrise.import_cases')
    def highrise_import_cases(self, request):
        cases = EndpointsHelper.highrise_import_cases(request)
        return message_types.VoidMessage()

    # highrise.import_notes_of_person api
    @endpoints.method(DetailImportHighriseRequest, message_types.VoidMessage,
                      path='highrise/import_notes_person', http_method='POST',
                      name='highrise.import_notes_person')
    def highrise_import_notes_of_person(self, request):
        notes = EndpointsHelper.highrise_import_notes_of_person(request)
        return message_types.VoidMessage()

    # highrise.import_tags_of_person api
    @endpoints.method(DetailImportHighriseRequest, message_types.VoidMessage,
                      path='highrise/import_tags_person', http_method='POST',
                      name='highrise.import_tags_person')
    def highrise_import_tags_of_person(self, request):
        tags = EndpointsHelper.highrise_import_tags_of_person(request)
        return message_types.VoidMessage()

    # highrise.import_tasks_of_person api
    @endpoints.method(DetailImportHighriseRequest, message_types.VoidMessage,
                      path='highrise/import_tasks_person', http_method='POST',
                      name='highrise.import_tasks_person')
    def highrise_import_tasks_of_person(self, request):
        user = EndpointsHelper.require_iogrow_user()
        return message_types.VoidMessage()

    # highrise.import_notes_of_company api
    @endpoints.method(DetailImportHighriseRequest, message_types.VoidMessage,
                      path='highrise/import_notes_company', http_method='POST',
                      name='highrise.import_notes_company')
    def highrise_import_notes_of_company(self, request):
        notes = EndpointsHelper.highrise_import_notes_of_company(request)
        return message_types.VoidMessage()

    # highrise.import_tags_of_company api
    @endpoints.method(DetailImportHighriseRequest, message_types.VoidMessage,
                      path='highrise/import_tags_company', http_method='POST',
                      name='highrise.import_tags_company')
    def highrise_import_tags_of_company(self, request):
        tags = EndpointsHelper.highrise_import_tags_of_company(request)
        return message_types.VoidMessage()

    # highrise.import_tasks_of_company api
    @endpoints.method(DetailImportHighriseRequest, message_types.VoidMessage,
                      path='highrise/import_tasks_company', http_method='POST',
                      name='highrise.import_tasks_company')
    def highrise_import_tasks_of_company(self, request):
        tasks = EndpointsHelper.highrise_import_tasks_of_company(request)
        return message_types.VoidMessage()

    # contacts.get api v2
    @endpoints.method(ContactGetRequest, ContactSchema,
                      path='contacts/getv2', http_method='POST',
                      name='contacts.getv2')
    def contact_get_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Contact.get_schema(
            user_from_email=user_from_email,
            request=request
        )

    # contacts.list api v2
    @endpoints.method(ContactListRequest, ContactListResponse,
                      path='contacts/listv2', http_method='POST',
                      name='contacts.listv2')
    def contact_list_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Contact.list(
            user_from_email=user_from_email,
            request=request
        )

    # contacts.patch API
    @endpoints.method(ContactPatchSchema, ContactSchema,
                      path='contacts/patch', http_method='POST',
                      name='contacts.patch')
    def contact_patch(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Contact.patch(
            user_from_email=user_from_email,
            request=request
        )

    # contacts.search API
    @endpoints.method(SearchRequest, ContactSearchResults,
                      path='contacts/search', http_method='POST',
                      name='contacts.search')
    def contact_search(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Contact.search(
            user_from_email=user_from_email,
            request=request
        )

    # Contributors APIs
    # contributors.insert API
    @Contributor.method(

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
        confirmation_url = "http://gcdc2013-iogrow.appspot.com" + DISCUSSIONS[discussion_kind]['url'] + str(
            discussion_key.id())
        print confirmation_url
        sender_address = my_model.name + " <notifications@gcdc2013-iogrow.appspotmail.com>"
        subject = "You're involved in this " + DISCUSSIONS[discussion_kind]['title'] + ": " + discussion.title
        print subject
        body = """
        %s involved you in this %s

        %s
        """ % (user_from_email.google_display_name, DISCUSSIONS[discussion_kind]['title'], confirmation_url)
        mail.send_mail(sender_address, my_model.value, subject, body)
        return my_model

    # contributors.list API
    @Contributor.query_method(query_fields=('discussionKey', 'limit', 'order', 'pageToken'), path='contributors',
                              name='contributors.list')
    def contributor_list(self, query):
        return query

    # Documents APIs
    # documents.attachfiles API
    @endpoints.method(
        MultipleAttachmentRequest,
        iomessages.FilesAttachedResponse,
        path='documents/attachfiles',
        http_method='POST',
        name='documents.attachfiles'
    )
    def attach_files(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        # Todo: Check permissions
        return Document.attach_files(
            user_from_email=user_from_email,
            request=request
        )

    # documents.get API
    # documents.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='documents', http_method='DELETE',
                      name='documents.delete')
    def document_delete(self, request):
        entityKey = ndb.Key(urlsafe=request.entityKey)
        Edge.delete_all_cascade(start_node=entityKey)
        return message_types.VoidMessage()

    @endpoints.method(ID_RESOURCE, DocumentSchema,
                      path='documents/{id}', http_method='GET',
                      name='documents.get')
    def document_get(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Document.get_schema(
            user_from_email=user_from_email,
            request=request
        )

    # documents.insertv2 api
    @endpoints.method(DocumentInsertRequest, DocumentSchema,
                      path='documents/insertv2', http_method='POST',
                      name='documents.insertv2')
    def document_insert_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Document.insert(
            user_from_email=user_from_email,
            request=request
        )

        # documents.patch API

    @Document.method(
        http_method='PATCH', path='documents/{id}', name='documents.patch')
    def DocumentPatch(self, my_model):
        user_from_email = EndpointsHelper.require_iogrow_user()

        # Todo: Check permissions
        my_model.put()
        return my_model

    # Edges APIs
    # edges.delete api
    @endpoints.method(iomessages.EdgeDeleteRequestSchema, message_types.VoidMessage,
                      path='edges', http_method='DELETE',
                      name='edges.delete')
    def delete_edge(self, request):
        if request.entityKey:
            edge_key = ndb.Key(urlsafe=request.entityKey)
            Edge.delete(edge_key)
        else:
            results = Edge.query(
                Edge.start_node == ndb.Key(urlsafe=request.start_node),
                Edge.end_node == ndb.Key(urlsafe=request.end_node),
                Edge.kind == request.kind
            ).fetch()
            for edge in results:
                Edge.delete(edge.key)
        return message_types.VoidMessage()

    # edges.insert api
    @endpoints.method(EdgesRequest, EdgesResponse,
                      path='edges/insert', http_method='POST',
                      name='edges.insert')
    def edges_insert(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        items = list()
        for item in request.items:
            start_node = ndb.Key(urlsafe=item.start_node)
            end_node = ndb.Key(urlsafe=item.end_node)
            task = start_node.get()
            assigned_to = end_node.get()
            if task.due is not None:
                taskqueue.add(
                    url='/workers/syncassignedtask',
                    queue_name='iogrow-low-task',
                    params={
                        'email': assigned_to.email,
                        'task_key': task.id,
                        'assigned_to': end_node
                    }
                )
            edge_key = Edge.insert(start_node=start_node,
                                   end_node=end_node,
                                   kind=item.kind,
                                   inverse_edge=item.inverse_edge)
            EndpointsHelper.update_edge_indexes(
                parent_key=start_node,
                kind=item.kind,
                indexed_edge=str(end_node.id())
            )
            items.append(EdgeSchema(id=str(edge_key.id()),
                                    entityKey=edge_key.urlsafe(),
                                    kind=item.kind,
                                    start_node=item.start_node,
                                    end_node=item.end_node))
        return EdgesResponse(items=items)

    # Emails APIs
    # emails.send API
    @endpoints.method(EmailRequest, message_types.VoidMessage,
                      path='emails/send', http_method='POST',
                      name='emails.send')
    def send_email(self, request):
        user = EndpointsHelper.require_iogrow_user()
        files_ids = []
        if request.subject:
            subject = request.subject
        else:
            subject = ""
        if request.files:
            files_ids = [item.id for item in request.files.items]
        taskqueue.add(
            url='/workers/send_gmail_message',
            queue_name='iogrow-critical',
            params={
                'email': user.email,
                'to': request.to,
                'cc': request.cc,
                'bcc': request.bcc,
                'subject': subject,
                'body': request.body,
                'files': files_ids
            }
        )
        attachments = None
        if request.files:
            attachments_request = request.files
            attachments = Document.attach_files(
                user_from_email=user,
                request=attachments_request
            )
        attachments_notes = ''
        if attachments:
            attachments_notes += '<ul class="list-unstyled">'
            for item in attachments.items:
                attachments_notes += '<li><a href="<%= item.embedLink %>">'
                attachments_notes += item.name
                attachments_notes += '</a></li>'
            attachments_notes += '</ul>'
        parent_key = ndb.Key(urlsafe=request.about)
        note_author = Userinfo()
        note_author.display_name = user.google_display_name
        note_author.photo = user.google_public_profile_photo_url
        note = Note(
            owner=user.google_user_id,
            organization=user.organization,
            author=note_author,
            title='Email: ' + subject,
            content=request.body + attachments_notes
        )
        entityKey_async = note.put_async()
        entityKey = entityKey_async.get_result()
        Edge.insert(
            start_node=parent_key,
            end_node=entityKey,
            kind='topics',
            inverse_edge='parents'
        )
        EndpointsHelper.update_edge_indexes(
            parent_key=parent_key,
            kind='topics',
            indexed_edge=str(entityKey.id())
        )
        return message_types.VoidMessage()

    # Events APIs

    # events.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='events', http_method='DELETE',
                      name='events.delete')
    def event_delete(self, request):
        entityKey = ndb.Key(urlsafe=request.entityKey)
        user_from_email = EndpointsHelper.require_iogrow_user()
        event = entityKey.get()
        taskqueue.add(
            url='/workers/syncdeleteevent',
            queue_name='iogrow-low-event',
            params={
                'email': user_from_email.email,
                'event_google_id': event.event_google_id
            }
        )
        Edge.delete_all_cascade(start_node=entityKey)
        return message_types.VoidMessage()

    # events.get API
    @endpoints.method(ID_RESOURCE, EventSchema,
                      path='events/{id}', http_method='GET',
                      name='events.get')
    def event_get(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Event.get_schema(
            user_from_email=user_from_email,
            request=request
        )

    # events.insertv2 api
    @endpoints.method(EventInsertRequest, EventSchema,
                      path='events/insertv2', http_method='POST',
                      name='events.insertv2')
    def event_insert_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Event.insert(
            user_from_email=user_from_email,
            request=request
        )

    # events.lists api
    @endpoints.method(EventListRequest, EventListResponse,
                      path='events/list', http_method='POST',
                      name='events.list')
    def event_list_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Event.list(
            user_from_email=user_from_email,
            request=request
        )

    # fetch events by start date end end date
    @endpoints.method(EventFetchListRequest, EventFetchResults,
                      path='events/list_fetch', http_method='POST',
                      name='events.list_fetch')
    def event_list_beta_fetch(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Event.listFetch(
            user_from_email=user_from_email,
            request=request
        )

    # events.patch api
    @endpoints.method(EventPatchRequest, message_types.VoidMessage,
                      path='events/patch', http_method='POST',
                      name='events.patch')
    def events_patch(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        if request.googleEvent == "true":
            taskqueue.add(
                url='/workers/syncpatchevent',
                queue_name='iogrow-low-event',
                params={
                    'email': user_from_email.email,
                    'starts_at': request.starts_at,
                    'ends_at': request.ends_at,
                    'summary': request.title,
                    'event_google_id': request.id,
                    'access': request.access,
                    'timezone': request.timezone
                }
            )

        else:
            event_key = ndb.Key(urlsafe=request.entityKey)
            event = event_key.get()

            if event is None:
                raise endpoints.NotFoundException('Event not found')
            if (event.owner != user_from_email.google_user_id) and not user_from_email.is_admin:
                raise endpoints.ForbiddenException('you are not the owner')
            event_patch_keys = ['title', 'starts_at', 'ends_at', 'description', 'where', 'allday', 'access', 'timezone']
            date_props = ['starts_at', 'ends_at']
            patched = False
            for prop in event_patch_keys:
                new_value = getattr(request, prop)
                if new_value:
                    if prop in date_props:
                        new_value = datetime.datetime.strptime(new_value, "%Y-%m-%dT%H:%M:00.000000")
                    setattr(event, prop, new_value)
                    patched = True
            if patched:
                taskqueue.add(
                    url='/workers/syncpatchevent',
                    queue_name='iogrow-low-event',
                    params={
                        'email': user_from_email.email,
                        'starts_at': request.starts_at,
                        'ends_at': request.ends_at,
                        'summary': request.title,
                        'event_google_id': event.event_google_id,
                        'access': request.access,
                        'timezone': request.timezone,
                        'location': request.where,
                        'description': request.description

                    }
                )

                event.put()

        return message_types.VoidMessage()

    # Leads APIs
    # leads.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='leads/delete', http_method='DELETE',
                      name='leads.delete')
    def lead_delete(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        entityKey = ndb.Key(urlsafe=request.entityKey)

        if Node.check_permission(user_from_email, entityKey.get()):
            Edge.delete_all_cascade(start_node=entityKey)
            return message_types.VoidMessage()
        else:
            raise endpoints.UnauthorizedException('You don\'t have permissions.')

    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='leads/delete_all', http_method='POST',
                      name='leads.delete_all')
    def lead_delete_all(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        params = {'owner': user_from_email.google_user_id}
        print(params)
        print(user_from_email)
        taskqueue.add(
            url='/workers/delete_user_leads',
            queue_name='iogrow-critical',
            payload=json.dumps(params)
        )
        return message_types.VoidMessage()

    # leads.convert api
    @endpoints.method(ID_RESOURCE, LeadSchema,
                      path='leads/convertv2', http_method='POST',
                      name='leads.convertv2')
    def lead_convert_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Lead.convert(
            user_from_email=user_from_email,
            request=request
        )

    # leads.get api v2
    @endpoints.method(LeadGetRequest, LeadSchema,
                      path='leads/getv2', http_method='POST',
                      name='leads.getv2')
    def lead_get_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Lead.get_schema(
            user_from_email=user_from_email,
            request=request
        )

        # leads.import api

    @endpoints.method(ContactImportRequest, iomessages.MappingJobResponse,
                      path='leads/import', http_method='POST',
                      name='leads.import')
    def lead_import_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Lead.import_from_csv_first_step(
            user_from_email=user_from_email,
            request=request
        )

    # leads.import api
    @endpoints.method(iomessages.MappingJobResponse, message_types.VoidMessage,
                      path='leads/import_from_csv_second_step', http_method='POST',
                      name='leads.import_from_csv_second_step')
    def lead_import_after_mapping(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        items = []
        for item in request.items:
            items.append(
                {
                    'key': item.key,
                    'source_column': item.source_column,
                    'matched_column': item.matched_column
                }
            )
        token = endpoints.users_id_token._get_token(None)
        params = {
            'token': token,
            'job_id': request.job_id,
            'items': items,
            'email': user_from_email.email
        }
        taskqueue.add(
            url='/workers/lead_import_second_step',
            queue_name='iogrow-critical',
            payload=json.dumps(params)
        )
        return message_types.VoidMessage()

    # leads export 
    @endpoints.method(LeadListRequest, message_types.VoidMessage,
                      path='leads/export', http_method='POST',
                      name='leads.export')
    def export_leads(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        token = endpoints.users_id_token._get_token(None)
        params = {
            "access_token": token,
            "tags": request.tags,
            "fileName": user_from_email.email + "_" + str(user_from_email.id),
            "email": user_from_email.email
        }
        print params
        r = requests.post("http://104.154.83.131:8080/api/export_lead", data=json.dumps(params),
                          headers={'content-type': 'application/json'})
        return message_types.VoidMessage()

    # leads export by key
    @endpoints.method(IDsRequest, message_types.VoidMessage,
                      path='leads/export_keys', http_method='POST',
                      name='leads.export_keys')
    def export_leads_keys(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        token = endpoints.users_id_token._get_token(None)
        params = {
            "access_token": token,
            "IDs": request.ids,
            "fileName": user_from_email.email + "_" + str(user_from_email.id),
            "email": user_from_email.email
        }
        print params
        r = requests.post("http://104.154.83.131:8080/api/export_lead_by_key", data=json.dumps(params),
                          headers={'content-type': 'application/json'})
        return message_types.VoidMessage()

    # leads.insertv2 api
    @endpoints.method(LeadInsertRequest, LeadSchema,
                      path='leads/insertv2', http_method='POST',
                      name='leads.insertv2')
    def lead_insert_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Lead.insert(user_from_email=user_from_email, request=request)

    @endpoints.method(LeadMergeRequest, LeadSchema,
                      path='leads/merge', http_method='POST',
                      name='leads.merge')
    def lead_merge(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Lead.merge(request=request, user_from_email=user_from_email)

    @endpoints.method(FLNameFilterRequest, LeadListResponse,
                      path='leads/filter', http_method='POST',
                      name='leads.filter')
    def lead_filter(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        response = Lead.filter_by_first_and_last_name_response(user_from_email=user_from_email, request=request)
        return response

    # HKA 06.10.2015 filter by si=ource API
    @endpoints.method(FLsourceFilterRequest, LeadListResponse,
                      path='leads/filterbysource', http_method='POST',
                      name='leads.filter_by_source')
    def lead_filter_by_source(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        response = Lead.filter_by_source(user_from_email=user_from_email, request=request)
        return response

    @endpoints.method(LeadListRequest, LeadListResponse,
                      path='leads/listv2', http_method='POST',
                      name='leads.listv2')
    def lead_list_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        lead_list = Lead.list(user_from_email=user_from_email, request=request)
        return lead_list

    # leads.patch API
    @endpoints.method(LeadPatchRequest, LeadSchema,
                      path='leads/patch', http_method='POST',
                      name='leads.patch')
    def lead_patch_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Lead.patch(
            user_from_email=user_from_email,
            request=request
        )

    # leads.search API
    @endpoints.method(SearchRequest, LeadSearchResults,
                      path='leads/search', http_method='POST',
                      name='leads.search')
    def leads_search(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Lead.search(
            user_from_email=user_from_email,
            request=request
        )

    # Lead status APIs
    # leadstatuses.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='leadstatuses', http_method='DELETE',
                      name='leadstatuses.delete')
    def leadstatuses_delete(self, request):
        entityKey = ndb.Key(urlsafe=request.entityKey)
        Edge.delete_all_cascade(start_node=entityKey)
        return message_types.VoidMessage()

    # leadstatuses.get api
    @Leadstatus.method(
        request_fields=('id',),
        path='leadstatuses/{id}',
        http_method='GET',
        name='leadstatuses.get'
    )
    def LeadstatusGet(self, my_model):
        if not my_model.from_datastore:
            raise Exception('Lead status not found')
        return my_model

    # leadstatuses.insert api
    @Leadstatus.method(

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
        return query.filter(Leadstatus.organization == user_from_email.organization)

    # leadstatuses.patch api
    @Leadstatus.method(

        http_method='PATCH',
        path='leadstatuses/{id}',
        name='leadstatuses.patch'
    )
    def LeadstatusPatch(self, my_model):
        user_from_email = EndpointsHelper.require_iogrow_user()
        my_model.put()
        return my_model

    # Notes APIs
    # notes.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='notes', http_method='DELETE',
                      name='notes.delete')
    def note_delete(self, request):
        entityKey = ndb.Key(urlsafe=request.entityKey)
        Edge.delete_all_cascade(start_node=entityKey)
        return message_types.VoidMessage()

    # notes.get api
    @endpoints.method(ID_RESOURCE, NoteSchema,
                      path='notes/{id}', http_method='GET',
                      name='notes.get')
    def NoteGet(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Note.get_schema(
            user_from_email=user_from_email,
            request=request
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
            owner=user_from_email.google_user_id,
            organization=user_from_email.organization,
            author=note_author,
            title=request.title,
            content=request.content
        )
        entityKey_async = note.put_async()
        entityKey = entityKey_async.get_result()
        Edge.insert(
            start_node=parent_key,
            end_node=entityKey,
            kind='topics',
            inverse_edge='parents'
        )
        EndpointsHelper.update_edge_indexes(
            parent_key=parent_key,
            kind='topics',
            indexed_edge=str(entityKey.id())
        )
        return message_types.VoidMessage()

    # notes.patch API
    @Note.method(
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
            if record.property_type == 'StringProperty_repeated':
                junkers = re.compile('[[" \]]')
                clean_str = ast.literal_eval(record.value)
                record_list_of_values = ast.literal_eval(clean_str)
                prop = ndb.StringProperty(record.field, repeated=True, indexed=False)
                prop._code_name = record.field
                node._properties[record.field] = prop
                prop._set_value(node, record_list_of_values)
            elif len(record.value) > 500:
                prop = ndb.TextProperty(record.field, indexed=False)
                prop._code_name = record.field
                node._properties[record.field] = prop
                prop._set_value(node, smart_str(record.value))
            else:
                setattr(
                    node,
                    record.field,
                    record.value
                )
            node_values.append(record.value)
            if record.property_type:
                setattr(
                    node,
                    'property_type',
                    record.property_type
                )
        entityKey_async = node.put_async()
        entityKey = entityKey_async.get_result()
        Edge.insert(
            start_node=parent_key,
            end_node=entityKey,
            kind='infos',
            inverse_edge='parents'
        )
        indexed_edge = '_' + request.kind + ' ' + " ".join(node_values)
        EndpointsHelper.update_edge_indexes(
            parent_key=parent_key,
            kind='infos',
            indexed_edge=indexed_edge
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
        Edge.delete_all_cascade(start_node=entityKey)
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
            parent_key=parent_key,
            request=request
        )

    # infonode.patch api
    @endpoints.method(InfoNodePatchRequest, message_types.VoidMessage,
                      path='infonode/patch', http_method='POST',
                      name='infonode.patch')
    def infonode_patch(self, request):
        node_key = ndb.Key(urlsafe=request.entityKey)
        parent_key = ndb.Key(urlsafe=request.parent)
        node = node_key.get()
        print "*******am right here******************"
        print node
        print "**************************************"
        node_values = []
        if node is None:
            raise endpoints.NotFoundException('Node not found')
        for record in request.fields:
            setattr(node, record.field, record.value)
            node_values.append(str(record.value))
        node.put()
        indexed_edge = '_' + node.kind + ' ' + " ".join(node_values)
        EndpointsHelper.update_edge_indexes(
            parent_key=parent_key,
            kind='infos',
            indexed_edge=indexed_edge
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

        if Node.check_permission(user_from_email, entityKey.get()):
            Edge.delete_all_cascade(start_node=entityKey)
            return message_types.VoidMessage()
        else:
            raise endpoints.UnauthorizedException('You don\'t have permissions.')

    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='opportunities/delete_all', http_method='POST',
                      name='opportunities.delete_all')
    def opportunities_delete_all(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        params = {'owner': user_from_email.google_user_id}

        taskqueue.add(
            url='/workers/delete_user_opportunities',
            queue_name='iogrow-critical',
            payload=json.dumps(params)
        )
        return message_types.VoidMessage()

    # opportunities.get api v2
    @endpoints.method(OpportunityGetRequest, OpportunitySchema,
                      path='opportunities/getv2', http_method='POST',
                      name='opportunities.getv2')
    def opportunity_get_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Opportunity.get_schema(
            user_from_email=user_from_email,
            request=request
        )

    # opportunities.decision.insert api
    @endpoints.method(iomessages.OppDecisionRequest, message_types.VoidMessage,
                      path='opportunities/decision/insert', http_method='POST',
                      name='opportunities.decision.insert')
    def opportunity_insert_decision(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        opportunity_key = ndb.Key(urlsafe=request.opportunityKey)
        contact_key = ndb.Key(urlsafe=request.contactKey)
        Edge.insert(
            start_node=opportunity_key,
            end_node=contact_key,
            kind='decision_by',
            inverse_edge='has_decision_on'
        )
        return message_types.VoidMessage()

    # opportunities.timeline.insert api
    @endpoints.method(iomessages.OppTimelineInsertRequest, message_types.VoidMessage,
                      path='opportunities/timeline/insert', http_method='POST',
                      name='opportunities.timeline.insert')
    def opportunity_insert_timeline(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        OppTimeline.insert(
            user_from_email=user_from_email,
            request=request
        )
        return message_types.VoidMessage()

    # opportunities.timeline.delete api
    @endpoints.method(iomessages.EntityKeyRequest, message_types.VoidMessage,
                      path='opportunities/timeline/delete', http_method='POST',
                      name='opportunities.timeline.delete')
    def opportunity_delete_timeline(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        OppTimeline.delete(
            user_from_email=user_from_email,
            request=request
        )
        return message_types.VoidMessage()

    # opportunities.isertv2 api
    @endpoints.method(OpportunityInsertRequest, OpportunitySchema,
                      path='opportunities/insertv2', http_method='POST',
                      name='opportunities.insertv2')
    def opportunity_insert_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        print request
        return Opportunity.insert(
            user_from_email=user_from_email,
            request=request
        )

    # opportunities.list api v2
    @endpoints.method(OpportunityListRequest, OpportunityListResponse,
                      path='opportunities/listv2', http_method='POST',
                      name='opportunities.listv2')
    def opportunity_list_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Opportunity.list(
            user_from_email=user_from_email,
            request=request
        )

    # opportunities export
    @endpoints.method(OpportunityListRequest, message_types.VoidMessage,
                      path='opportunities/export', http_method='POST',
                      name='opportunities.export')
    def export_opportunities(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        token = endpoints.users_id_token._get_token(None)
        params = {
            "access_token": token,
            "tags": request.tags,
            "fileName": user_from_email.email + "_" + str(user_from_email.id),
            "email": user_from_email.email
        }
        print params
        r = requests.post("http://104.154.83.131:8080/api/export_opportunity", data=json.dumps(params),
                          headers={'content-type': 'application/json'})
        return message_types.VoidMessage()

    # leads export by key
    @endpoints.method(IDsRequest, message_types.VoidMessage,
                      path='opportunities/export_keys', http_method='POST',
                      name='opportunities.export_keys')
    def export_opportunities_keys(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        token = endpoints.users_id_token._get_token(None)
        params = {
            "access_token": token,
            "IDs": request.ids,
            "fileName": user_from_email.email + "_" + str(user_from_email.id),
            "email": user_from_email.email
        }
        print params
        r = requests.post("http://104.154.83.131:8080/api/export_opportunity_by_key", data=json.dumps(params),
                          headers={'content-type': 'application/json'})
        return message_types.VoidMessage()

    # opportunities.list api v3
    @endpoints.method(NewOpportunityListRequest, AggregatedOpportunitiesResponse,
                      path='opportunities/listv3', http_method='POST',
                      name='opportunities.listv3')
    def opportunity_list_by_stage(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Opportunity.aggregate(
            user_from_email=user_from_email,
            request=request
        )

    # opportunities.patch api
    @endpoints.method(OpportunityPatchRequest, OpportunitySchema,
                      path='opportunities/patch', http_method='POST',
                      name='opportunities.patch')
    def opportunity_patch_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Opportunity.patch(
            user_from_email=user_from_email,
            request=request
        )

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
            user_from_email=user_from_email,
            request=request
        )

    # opportunities.update_stage api
    @endpoints.method(UpdateStageRequest, message_types.VoidMessage,
                      path='opportunities/update_stage', http_method='POST',
                      name='opportunities.update_stage')
    def opportunity_update_stage(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        Opportunity.update_stage(
            user_from_email=user_from_email,
            request=request
        )
        return message_types.VoidMessage()

    # pipeline  APIs
    # piplines.isertv2 api
    @endpoints.method(PipelineInsertRequest, PipelineSchema,
                      path='pipelines/insertv2', http_method='POST',
                      name='pipelines.insertv2')
    def pipeline_insert_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Pipeline.insert(
            user_from_email=user_from_email,
            request=request
        )

    # pipelines.get api v2
    @endpoints.method(PipelineGetRequest, PipelineSchema,
                      path='pipelines/getv2', http_method='POST',
                      name='pipelines.getv2')
    def pipeline_get_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Pipeline.get_schema(
            user_from_email=user_from_email,
            request=request
        )

    # pipelines.list api v2
    @endpoints.method(PipelineListRequest, PipelineListResponse,
                      path='pipelines/list', http_method='POST',
                      name='pipelines.list')
    def pipeline_list_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Pipeline.list(
            user_from_email=user_from_email,
            request=request
        )

    # pipelines.patch api v2
    @endpoints.method(PipelinePatchRequest, PipelineSchema,
                      path='pipelines/patch', http_method='POST',
                      name='pipelines.patch')
    def pipeline_patch_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Pipeline.patch(
            user_from_email=user_from_email,
            request=request
        )
        # pipelines.delete api v2

    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='pipelines/delete', http_method='POST',
                      name='pipelines.delete')
    def pipeline_delete_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        Pipeline.delete(
            user_from_email=user_from_email,
            request=request
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
        oppo = entityKey.get()
        opportunitystage = Opportunitystage.query(Opportunitystage.organization == user_from_email.organization).order(
            -Opportunitystage.stage_number).fetch()
        for os in opportunitystage:
            if os.stage_number != 0 and os.stage_number > oppo.stage_number:
                os.stage_number -= 1
                os.put()
        Edge.delete_all_cascade(start_node=entityKey)
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
            raise Exception('Opportunity stage not found')
        return my_model

    # opportunitystages.insert api
    @Opportunitystage.method(

        path='opportunitystage',
        http_method='POST',
        name='opportunitystages.insert'
    )
    def OpportunitystageInsert(self, my_model):
        user_from_email = EndpointsHelper.require_iogrow_user()
        my_model.owner = user_from_email.google_user_id
        my_model.organization = user_from_email.organization
        my_model.nbr_opportunity = 0
        count = 0
        opportunitystage = Opportunitystage.query(Opportunitystage.organization == user_from_email.organization).order(
            -Opportunitystage.stage_number).fetch(1)
        if opportunitystage:
            my_model.stage_number = opportunitystage[0].stage_number + 1

        # print opportunitystage
        my_model.amount_opportunity = 0
        my_model.put()
        return my_model

    # opportunitystages.list api
    @Opportunitystage.query_method(

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

        http_method='PATCH',
        path='opportunitystage/{id}',
        name='opportunitystages.patch'
    )
    def OpportunitystagePatch(self, my_model):
        user_from_email = EndpointsHelper.require_iogrow_user()
        my_model.put()
        return my_model

    @endpoints.method(OpportunitystagePatchListRequestSchema, OpportunitystageListSchema,
                      path='opportunitystages/patchlist', http_method='POST',
                      name='opportunitystages.patchlist'
                      )
    def OpportunitystagePatchList(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Opportunitystage.patch_list(user_from_email, request)

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
        if about.access == 'private' and about.owner != user_from_email.google_user_id:
            end_node_set = [user_from_email.key]
            if not Edge.find(start_node=about_key, kind='permissions', end_node_set=end_node_set, operation='AND'):
                raise endpoints.NotFoundException('Permission denied')
        for item in request.items:
            if item.type == 'user':
                # get the user
                shared_with_user_key = ndb.Key(urlsafe=item.value)
                shared_with_user = shared_with_user_key.get()
                if shared_with_user:
                    # check if user is in the same organization
                    if shared_with_user.organization == about.organization:
                        # insert the edge
                        taskqueue.add(
                            url='/workers/shareobjectdocument',
                            queue_name='iogrow-low',
                            params={
                                'email': shared_with_user.email,
                                'obj_key_str': about_key.urlsafe()
                            }
                        )
                        Edge.insert(
                            start_node=about_key,
                            end_node=shared_with_user_key,
                            kind='permissions',
                            inverse_edge='has_access_on'
                        )
                        # update indexes on search for collobaorators_id
                        indexed_edge = shared_with_user.google_user_id + ' '
                        EndpointsHelper.update_edge_indexes(
                            parent_key=about_key,
                            kind='collaborators',
                            indexed_edge=indexed_edge
                        )
                        shared_with_user = None
            elif item.type == 'group':
                pass
                # get the group
                # get the members of this group
                # for each member insert the edge
                # update indexes on search for  collaborators_id
        return message_types.VoidMessage()

    # LBA 19-10-14
    # Permissions APIs (Sharing Settings)
    # permissions.delete api
    @endpoints.method(PermissionDeleteRequest, message_types.VoidMessage,
                      path='permissions/delete', http_method='POST',
                      name='permissions.delete')
    def permission_delete(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        about_key = ndb.Key(urlsafe=request.about)
        about = about_key.get()
        # check if the user can give permissions for this object
        if about.access == 'private' and about.owner != user_from_email.google_user_id:
            end_node_set = [user_from_email.key]
            if not Edge.find(start_node=about_key, kind='permissions', end_node_set=end_node_set, operation='AND'):
                raise endpoints.NotFoundException('Permission denied')

        if request.type == 'user':
            # get the user
            shared_with_user_key = ndb.Key(urlsafe=request.value)
            shared_with_user = shared_with_user_key.get()
            if shared_with_user:
                # check if user is in the same organization
                if shared_with_user.organization == about.organization:
                    # insert the edge
                    taskqueue.add(
                        url='/workers/shareobjectdocument',
                        queue_name='iogrow-low',
                        params={
                            'email': shared_with_user.email,
                            'obj_key_str': about_key.urlsafe()
                        }
                    )
                    print about_key, shared_with_user_key
                    edge = Edge.query(
                        Edge.start_node == about_key,
                        Edge.end_node == shared_with_user_key,
                        Edge.kind == 'permissions'
                    ).fetch(1)
                    print edge
                    Edge.delete(edge[0].key)
                    # update indexes on search for collobaorators_id
                    indexed_edge = shared_with_user.google_user_id + ' '
                    EndpointsHelper.delete_edge_indexes(
                        parent_key=about_key,
                        kind='collaborators',
                        indexed_edge=indexed_edge
                    )
                    shared_with_user = None

                    # TODO : handle the case where type equal group
                    # elif item.type == 'group':
                    #     pass
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
            user_from_email=user_from_email,
            request=request
        )

    # tags patch api . hadji hicham 22-07-2014.
    @endpoints.method(iomessages.PatchTagSchema, message_types.VoidMessage,
                      path='tags/patch', http_method='POST',
                      name='tags.patch')
    def patch_tag(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        tag_key = ndb.Key(urlsafe=request.entityKey)
        tag = tag_key.get()

        if tag is None:
            raise endpoints.NotFoundException('Tag not found')
        tag_patch_keys = ['name']
        patched = False
        for prop in tag_patch_keys:
            new_value = getattr(request, prop)
            if new_value:
                setattr(tag, prop, new_value)
                patched = True
            tag.put()
        return message_types.VoidMessage()

    # tags.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='tags', http_method='DELETE',
                      name='tags.delete')
    def delete_tag(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        tag_key = ndb.Key(urlsafe=request.entityKey)
        Edge.delete_all_cascade(tag_key)
        return message_types.VoidMessage()


    @endpoints.method(TagInsertRequest, TagSchema,
                      path='tags/insert', http_method='POST',
                      name='tags.insert')
    def tag_insert(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Tag.insert(
            user_from_email=user_from_email,
            request=request
        )

    # tags.list api v2
    @endpoints.method(TagListRequest, TagListResponse,
                      path='tags/list', http_method='POST',
                      name='tags.list')
    def tag_list(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Tag.list_by_kind(
            user_from_email=user_from_email,
            kind=request.about_kind
        )

    # Tasks APIs
    # edges.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='tasks/delete', http_method='DELETE',
                      name='tasks.delete')
    def delete_task(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        entityKey = ndb.Key(urlsafe=request.entityKey)
        task = entityKey.get()
        edges = Edge.query().filter(Edge.kind == "assignees", Edge.start_node == entityKey)
        if task.due is not None:
            if edges:
                for edge in edges:
                    assigned_to = edge.end_node.get()
                    taskqueue.add(
                        url='/workers/syncassigneddeletetask',
                        queue_name='iogrow-low-task',
                        params={
                            'email': assigned_to.email,
                            'task_key': task.id,
                            'assigned_to': edge.end_node.get()
                        }
                    )
            taskqueue.add(
                url='/workers/syncdeletetask',
                queue_name='iogrow-low-task',
                params={
                    'email': user_from_email.email,
                    'task_google_id': task.task_google_id
                }
            )

        Edge.delete_all_cascade(start_node=entityKey)
        return message_types.VoidMessage()

    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='tasks/delete_all', http_method='POST',
                      name='tasks.delete_all')
    def tasks_delete_all(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        params = {'owner': user_from_email.google_user_id}
        print(params)
        print(user_from_email)
        taskqueue.add(
            url='/workers/delete_user_tasks',
            queue_name='iogrow-critical',
            payload=json.dumps(params)
        )
        return message_types.VoidMessage()

    # tasks.get api
    @endpoints.method(ID_RESOURCE, TaskSchema,
                      path='tasks/{id}', http_method='GET',
                      name='tasks.get')
    def task_get(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Task.get_schema(
            user_from_email=user_from_email,
            request=request
        )

    # tasks.insertv2 api
    @endpoints.method(TaskInsertRequest, TaskSchema,
                      path='tasks/insertv2', http_method='POST',
                      name='tasks.insertv2')
    def tasks_insert_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Task.insert(
            user_from_email=user_from_email,
            request=request
        )

    # tasks.listv2 api
    @endpoints.method(TaskRequest, TaskListResponse,
                      path='tasks/listv2', http_method='POST',
                      name='tasks.listv2')
    def tasks_list_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Task.list(
            user_from_email=user_from_email,
            request=request
        )

    # tasks.patch api
    @endpoints.method(TaskSchema, TaskSchema,
                      path='tasks/patch', http_method='PATCH',
                      name='tasks.patch')
    def tasks_patch_beta(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Task.patch(
            user_from_email=user_from_email,
            request=request
        )

    # tasks export
    @endpoints.method(OpportunityListRequest, message_types.VoidMessage,
                      path='tasks/export', http_method='POST',
                      name='tasks.export')
    def export_tasks(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        token = endpoints.users_id_token._get_token(None)
        params = {
            "access_token": token,
            "tags": request.tags,
            "fileName": user_from_email.email + "_" + str(user_from_email.id),
            "email": user_from_email.email
        }
        print params
        r = requests.post("http://104.154.83.131:8080/api/export_task", data=json.dumps(params),
                          headers={'content-type': 'application/json'})
        return message_types.VoidMessage()

    # tasks export by key
    @endpoints.method(IDsRequest, message_types.VoidMessage,
                      path='tasks/export_keys', http_method='POST',
                      name='tasks.export_keys')
    def export_tasks_keys(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        token = endpoints.users_id_token._get_token(None)
        params = {
            "access_token": token,
            "IDs": request.ids,
            "fileName": user_from_email.email + "_" + str(user_from_email.id),
            "email": user_from_email.email
        }
        print params
        r = requests.post("http://104.154.83.131:8080/api/export_task_by_key", data=json.dumps(params),
                          headers={'content-type': 'application/json'})
        return message_types.VoidMessage()

    @endpoints.method(SignatureRequest, message_types.VoidMessage, path='users/signature', http_method='POST',
                      name='users.signature')
    def UserSignature(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        user = User.query().filter(User.email == user_from_email.email).get()
        user.emailSignature = request.signature
        user.put()
        memcache.delete(user.email)
        memcache.add(user.email, user)
        return message_types.VoidMessage()

    # # users.insert api
    @endpoints.method(InvitationRequest, message_types.VoidMessage,
                      path='users/insert', http_method='POST',
                      name='users.insert')
    def user_insert(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        invitees = Invitation.list_invitees(user_from_email.organization)
        users = User.query(User.organization == user_from_email.organization).fetch()
        for invitee in invitees:
            if invitee['invited_mail'] == request.emails[0]:
                return message_types.VoidMessage()
        for user in users:
            if user.email == request.emails[0]:
                return message_types.VoidMessage()
        credentials = user_from_email.google_credentials
        http = credentials.authorize(httplib2.Http(memcache))
        service = build('gmail', 'v1', http=http)
        for email in request.emails:
            my_model = User()
            taskqueue.add(
                url='/workers/initpeertopeerdrive',
                queue_name='iogrow-low',
                params={
                    'invited_by_email': user_from_email.email,
                    'email': email,
                }
            )
            invited_user = User.get_by_email(email)
            send_notification_mail = False
            if invited_user is not None:
                if invited_user.organization == user_from_email.organization or invited_user.organization is None:
                    invited_user.invited_by = user_from_email.key
                    invited_user_key = invited_user.put_async()
                    invited_user_async = invited_user_key.get_result()
                    invited_user_id = invited_user_async.id()
                    my_model.id = invited_user_id
                    Invitation.insert(email, user_from_email)
                    send_notification_mail = True
                elif invited_user.organization is not None:
                    raise endpoints.UnauthorizedException('User exist within another organization')
            else:
                my_model.invited_by = user_from_email.key
                my_model.status = 'invited'
                my_model.is_admin = False
                invited_user_key = my_model.put_async()
                invited_user_async = invited_user_key.get_result()
                invited_user_id = invited_user_async.id()
                Invitation.insert(email, user_from_email)
                send_notification_mail = True

                if send_notification_mail:
                    confirmation_url = "http://app.iogrow.com/sign-in?id=" + str(invited_user_id) + '&'
                    cc = None
                    bcc = None
                    subject = "Invitation from " + user_from_email.google_display_name
                    html = "<html><head></head><body><div ><div style='margin-left:291px'><a href='app.iogrow.com'><img src='cid:user_cid'  style='width:130px;'/></div><div><h2 style='margin-left:130px ;font-family: sans-serif;color: rgba(137, 137, 137, 1);'></a><span style='color:#1C85BB'>" + user_from_email.google_display_name + "</span> has invited you to use ioGrow</h2><p style='margin-left: 30px;font-family: sans-serif;color: #5B5D62;font-size: 17px'>We are using ioGrow to collaborate, discover new customers and grow our business .It is a website where we manage our relationships with the customers .</p></div><div><a href='" + confirmation_url + "' style='margin-left: 259px;border: 2px solid #91ACFF;padding: 10px;border-radius: 18px;text-decoration: blink;background-color: #91ACFF;color: white;font-family: sans-serif;'>JOIN YOUR TEAM ON IOGROW</a> <br><hr style=' width: 439px;margin-left: 150px;margin-top: 28px;'><p style='margin-left:290px;font-family:sans-serif'><a href='app.iogrow.com' style='text-decoration: none;'><img src='cid:logo_cid'  alt='Logo'/> ioGrow (c)2015</a></p></div></div></body></html>"
                    message = EndpointsHelper.create_message_with_attchments_local_files(
                        user_from_email.google_display_name,
                        email,
                        cc,
                        bcc,
                        subject,
                        html
                    )

                    EndpointsHelper.send_message(service, 'me', message)
        else:
            print "Fail"
        return message_types.VoidMessage()

    # organizations.get api v2
    @endpoints.method(message_types.VoidMessage, iomessages.OrganizationAdminSchema,
                      path='organizations/get', http_method='POST',
                      name='organizations.get')
    def organization_get(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Organization.get_license_status(user_from_email.organization)

    # organizations.assign_license api v2
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='organizations/assign_license', http_method='POST',
                      name='organizations.assign_license')
    def organization_assign_license(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        user_key = ndb.Key(urlsafe=request.entityKey)
        Organization.assign_license(user_from_email.organization, user_key)
        return message_types.VoidMessage()

    # organizations.unassign_license api v2
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='organizations/unassign_license', http_method='POST',
                      name='organizations.unassign_license')
    def organization_unassign_license(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        user_key = ndb.Key(urlsafe=request.entityKey)
        Organization.unassign_license(user_from_email.organization, user_key)
        return message_types.VoidMessage()

    # users.list api v2
    @endpoints.method(message_types.VoidMessage, iomessages.UserListSchema,
                      path='users/list', http_method='POST',
                      name='users.list')
    def user_list(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return User.list(organization=user_from_email.organization)

    # users.sign_in api
    @endpoints.method(iomessages.UserSignInRequest, iomessages.UserSignInResponse,
                      path='users/sign_in', http_method='POST',
                      name='users.sign_in')
    def user_sing_in(self, request):
        return User.sign_in(request=request)

    # users.sign_up api
    @endpoints.method(iomessages.UserSignUpRequest, message_types.VoidMessage,
                      path='users/sign_up', http_method='POST',
                      name='users.sign_up')
    def user_sing_up(self, request):
        token = endpoints.users_id_token._get_token(None)
        # will get the token info from network
        result = EndpointsHelper.get_token_info(token)
        if result.status_code != 200:
            raise endpoints.UnauthorizedException('Invalid token')
        token_info = json.loads(result.content)
        if 'email' not in token_info:
            raise endpoints.UnauthorizedException('Invalid token')
        email = token_info['email']
        user = User(
            type='public_user',
            status='active',
            google_user_id=request.google_user_id,
            google_display_name=request.google_display_name,
            google_public_profile_url=request.google_public_profile_url,
            email=email,
            completed_tour=False,
            google_public_profile_photo_url=request.google_public_profile_photo_url,
            currency='USD',
            week_start='monday'
        )
        user.put()

        if CountryCurrency.get_by_code('US') is None:
            CountryCurrency.init()
            User.set_default_currency(user, self.request.headers.get('X-AppEngine-Country'))
            organ_name = email.partition("@")[2]
            Organization.create_instance(organ_name, user)

        return message_types.VoidMessage()

    # users.me api
    @endpoints.method(message_types.VoidMessage, message_types.VoidMessage,
                      path='users/me', http_method='POST',
                      name='users.me')
    def user_me(self, request):
        try:
            user_from_email = EndpointsHelper.require_iogrow_user()
            print user_from_email.organization
        except:
            raise endpoints.NotFoundException('User not found')
        return message_types.VoidMessage()

    @endpoints.method(message_types.VoidMessage, iomessages.UserListSchema,
                      path='users/customers', http_method='POST',
                      name='users.customers')
    def customers(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()

        items = []
        users = User.query(User.organization == user_from_email.organization)
        for user in users:
            user_schema = iomessages.UserSchema(
                id=str(user.key.id()),
                entityKey=user.key.urlsafe(),
                email=user.email,
                google_display_name=user.google_display_name,
                google_public_profile_url=user.google_public_profile_url,
                google_public_profile_photo_url=user.google_public_profile_photo_url,
                google_user_id=user.google_user_id,
                is_admin=user.is_admin,
                status=user.status,
                stripe_id=user.stripe_id
            )
            items.append(user_schema)
        invitees_list = []
        invitees = Invitation.list_invitees(user_from_email.organization)
        for invitee in invitees:
            invited_schema = iomessages.InvitedUserSchema(
                invited_mail=invitee['invited_mail'],
                invited_by=invitee['invited_by'],
                updated_at=invitee['updated_at'].strftime("%Y-%m-%dT%H:%M:00.000"),
                stripe_id=invitee['stripe_id']
            )
            invitees_list.append(invited_schema)
        return iomessages.UserListSchema(items=items, invitees=invitees_list)

    # users.patch API
    @endpoints.method(message_types.VoidMessage, iomessages.UserSchema,
                      path='user/get', http_method='POST',
                      name='user.get')
    def user_get(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        user_schema = User.get_schema(user_from_email=user_from_email)
        return user_schema

    @endpoints.method(iomessages.UserPatchRequest, iomessages.UserSchema,
                      path='users/patch', http_method='POST',
                      name='users.patch')
    def user_patch(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return User.patch(
            user_from_email=user_from_email, request=request
        )


    @endpoints.method(setAdminRequest, message_types.VoidMessage,
                      http_method='POST', path='users/setAdmin', name='users.setadmin')
    def setadmin(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        org_key = user_from_email.organization
        user = ndb.Key(urlsafe=request.entityKey).get()
        user.is_admin = request.is_admin
        user.put()
        if request.is_admin:
            Edge.insert(start_node=org_key, end_node=user.key, kind='admins', inverse_edge='parents')
        else:
            edge_key = Edge.query(Edge.end_node == user.key and Edge.kind == 'admins').get().key
            Edge.delete(edge_key)

        return message_types.VoidMessage()

    # hadji hicham 4/08/2014 -- get user by google user id
    @User.method(
        http_method='GET', path='users/{google_user_id}', name='users.get_user_by_gid')
    def UserGetByGId(self, my_model):
        user = User.query().filter(User.google_user_id == my_model.google_user_id).get()
        if not user:
            raise endpoints.NotFoundException('User not found')
        return user

    # this api to fetch tasks and events to feed the calendar . hadji hicham.14-07-2014
    @endpoints.method(CalendarFeedsRequest, CalendarFeedsResults,
                      path='calendar/feeds', http_method='POST', name='calendar.feeds')
    def get_feeds(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        author = Userinfo()
        author.google_user_id = user_from_email.google_user_id
        author.display_name = user_from_email.google_display_name
        author.photo = user_from_email.google_public_profile_photo_url
        calendar_feeds_start = datetime.datetime.strptime(request.calendar_feeds_start, "%Y-%m-%dT%H:%M:00.000000")
        calendar_feeds_end = datetime.datetime.strptime(request.calendar_feeds_end, "%Y-%m-%dT%H:%M:00.000000")
        timeMin = calendar_feeds_start.isoformat() + "+00:00"
        timeMax = calendar_feeds_end.isoformat() + "+00:00"
        # get events from google calendar
        eventsG = []
        try:
            credentials = user_from_email.google_credentials
            http = credentials.authorize(httplib2.Http(memcache))
            service = build('calendar', 'v3', http=http)
            page_token = None
            while True:
                eventsG = service.events().list(calendarId='primary', pageToken=page_token, timeMax=timeMax,
                                                timeMin=timeMin).execute()
                page_token = events.get('nextPageToken')
                # ,
                if not page_token:
                    break
        except:
            pass
        # filter this table
        events = Event.query().filter(Event.organization == user_from_email.organization,
                                      Event.starts_at >= calendar_feeds_start, Event.starts_at <= calendar_feeds_end)
        # filter this table .
        tasks = Task.query().filter(Task.organization == user_from_email.organization)
        feeds_results = []
        try:
            for evtG in eventsG['items']:
                exists = False
                for evt in events:
                    if evtG['id'] == str(evt.event_google_id):
                        exists = True
                desc = ""
                if not exists:
                    if 'description' in evtG.keys():
                        desc = evtG['description']
                    if 'date' in evtG['start'].keys():
                        start = evtG['start']['date'] + "T00:00:00.000000"
                        end = evtG['end']['date'] + "T00:00:00.000000"
                    else:
                        if "Z" not in evtG['start']['dateTime']:
                            if "+" not in evtG['start']['dateTime']:
                                start_event = evtG['start']['dateTime'][:19]
                                end_event = evtG['end']['dateTime'][:19]
                            else:
                                start, timezone = evtG['start']['dateTime'].split('+')
                                end, timezoon = evtG['end']['dateTime'].split('+')
                        else:
                            start, timezone = evtG['start']['dateTime'].split('Z')
                            end, timezoon = evtG['end']['dateTime'].split('Z')
                        start += ".000000"
                        end += '.000000'
                    kwargs0 = {
                        'id': evtG['id'],
                        'entityKey': "",
                        'title': evtG['summary'],
                        'starts_at': start,
                        'ends_at': end,
                        'where': "",
                        'my_type': "event",
                        'allday': "false",
                        'google_url': evtG['htmlLink'],
                        'timezone': ""
                    }
                    feeds_results.append(CalendarFeedsResult(**kwargs0))
        except:
            pass

        # get the new list of events.

        for event in events:
            start_event = event.starts_at.isoformat()
            end_event = event.ends_at.isoformat()
            description = event.description
            title = event.title
            for evtG in eventsG['items']:
                if evtG['id'] == str(event.event_google_id):
                    if evtG['description'] == event.description:
                        pass
                    else:
                        description = evtG['description']
                        event.description = description
                        event.put()
                    if evtG['summary'] == event.title:
                        pass
                    else:
                        title = evtG['summary']
                        event.title = title
                        event.put()

                    if evtG['start']['dateTime'] == event.starts_at.isoformat() + event.timezone:
                        pass
                    else:
                        print "****************evtG['start']['dateTime']****************"
                        print evtG['start']['dateTime']
                        print "*******************evtG['end']['dateTime']***************************"
                        print evtG['end']['dateTime']
                        print "****************************************************"
                        if "Z" not in evtG['start']['dateTime']:
                            if "+" not in evtG['start']['dateTime']:
                                print "*********hopa i am in - ***********"
                                print evtG['start']['dateTime']
                                start_event = evtG['start']['dateTime'][:19]
                                end_event = evtG['end']['dateTime'][:19]
                                print "****************start_event***********"
                                print start_event
                            else:
                                start_event, timezone_event = evtG['start']['dateTime'].split('+')
                                end_event, timezone_event = evtG['end']['dateTime'].split('+')

                        else:
                            start_event, timezone_event = evtG['start']['dateTime'].split('Z')
                            end_event, timezone_event = evtG['end']['dateTime'].split('Z')

                        start_event += ".000000"
                        end_event += '.000000'

            event_is_filtered = True
            if event.access == 'private' and event.owner != user_from_email.google_user_id:
                end_node_set = [user_from_email.key]
                if not Edge.find(start_node=event.key, kind='permissions', end_node_set=end_node_set, operation='AND'):
                    event_is_filtered = False
            # kwargs1={}
            if event_is_filtered:
                kwargs1 = {
                    'id': str(event.id),
                    'entityKey': event.entityKey,
                    'title': title,
                    'starts_at': start_event,
                    'ends_at': end_event,
                    'where': event.where,
                    'my_type': "event",
                    'allday': event.allday,
                    'timezone': event.timezone,
                    'description': description
                }
                feeds_results.append(CalendarFeedsResult(**kwargs1))
        for task in tasks:
            task_is_filtered = True
            if task.access == 'private' and task.owner != user_from_email.google_user_id:
                end_node_set = [user_from_email.key]
                if not Edge.find(start_node=task.key, kind='permissions', end_node_set=end_node_set, operation='AND'):
                    task_is_filtered = False
            if task_is_filtered:
                status_color = 'green'
                status_label = ''
                if task.due:
                    now = datetime.datetime.now()
                    diff = task.due - now
                    if 0 <= diff.days <= 2:
                        status_color = 'orange'
                        status_label = 'soon: due in ' + str(diff.days) + ' days'
                    elif diff.days < 0:
                        status_color = 'red'
                        status_label = 'overdue'
                    else:
                        status_label = 'due in ' + str(diff.days) + ' days'
                    if task.status == 'closed':
                        status_color = 'blue'
                        status_label = 'closed'
                if task.due is not None:
                    taskdue = task.due.isoformat()
                else:
                    taskdue = task.due
                kwargs2 = {
                    'id': str(task.id),
                    'entityKey': task.entityKey,
                    'title': task.title,
                    'starts_at': taskdue,
                    'my_type': "task",
                    'backgroundColor': status_color,
                    'status_label': status_label
                }
                feeds_results.append(CalendarFeedsResult(**kwargs2))
        return CalendarFeedsResults(items=feeds_results)

    # users.upgrade api v2
    @endpoints.method(message_types.VoidMessage, message_types.VoidMessage,
                      path='users/upgrade', http_method='POST',
                      name='users.upgrade')
    def upgrade_to_business(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        Organization.upgrade_to_business_version(user_from_email.organization)
        return message_types.VoidMessage()

    # arezki lebdiri 15/07/2014
    @endpoints.method(EntityKeyRequest, LinkedinCompanySchema,
                      path='company/linkedinCompany', http_method='POST',
                      name='company.getCompanyLinkedin')
    def get_company_linkedin(self, request):
        response = linked_in.get_company(request.entityKey)
        return response


    # arezki lebdiri 27/08/2014
    @endpoints.method(LinkedinProfileRequestSchema, LinkedinProfileSchema,
                      path='people/get', http_method='POST',
                      name='people.get')
    def linkedin_get(self, request):
        linkedin = linked_in()
        response = None
        pro = linkedin.scrape_linkedin_url(request.url)
        if pro:
            response = LinkedinProfileSchema(
                fullname=pro["full-name"],
                industry=pro["industry"],
                locality=pro["locality"],
                title=pro["title"],
                current_post=pro["current_post"],
                past_post=pro["past_post"],
                formations=pro["formations"],
                websites=pro["websites"],
                relation=pro["relation"],
                experiences=json.dumps(pro["experiences"]),
                education=json.dumps(pro["education"]),
                resume=pro["resume"],
                certifications=json.dumps(pro["certifications"]),
                profile_picture=pro['profile_picture']
            )
        return response

    @endpoints.method(LinkedinProfileRequestSchema, TwitterProfileSchema,
                      path='people/get_twitter', http_method='POST',
                      name='people.get_twitter')
    def twitter_get_people(self, request):
        screen_name = request.url
        print screen_name
        name = screen_name[screen_name.find("twitter.com/") + 12:]
        print name
        profile_schema = EndpointsHelper.twitter_import_people(name)
        return profile_schema


    # arezki lebdiri 15/07/2014
    @endpoints.method(LinkedinProfileRequest, getLinkedinListSchema,
                      path='people/linkedinProfileList', http_method='POST',
                      name='people.getLinkedinList')
    def get_people_linkedinList(self, request):
        empty_string = lambda x: x if x else ""
        linkedin = linked_in()
        keyword = empty_string(request.firstname) + " " + empty_string(request.lastname) + " " + empty_string(
            request.title) + " " + empty_string(request.company)
        pro = linkedin.open_url_list(keyword)
        items = []
        for p in pro:
            print smart_str(p["title"])
            items.append(getLinkedinSchema(title=p["title"], name=p["name"], url=p["url"]))
        return getLinkedinListSchema(items=items)

    @endpoints.method(LinkedinProfileRequest, getLinkedinListSchema,
                      path='company/linkedinCompanyList', http_method='POST',
                      name='company.getLinkedinList')
    def get_comapny_linkedinList(self, request):
        empty_string = lambda x: x if x else ""
        linkedin = linked_in()
        keyword = empty_string(request.firstname) + " " + empty_string(request.lastname) + " " + empty_string(
            request.company)
        pro = linkedin.open_company_list(keyword)
        items = []
        for p in pro:
            items.append(getLinkedinSchema(title=p["desc"], name=p["name"], url=p["url"]))
        return getLinkedinListSchema(items=items)

    @endpoints.method(LinkedinProfileRequestSchema, LinkedinCompanySchema,
                      path='company/linkedinCompany', http_method='POST',
                      name='company.getCompanyLinkedin')
    def get_company_linkedin(self, request):
        linkedin = linked_in()
        response = linkedin.get_company(request.url)
        return response

    @endpoints.method(LinkedinProfileRequest, getLinkedinListSchema,
                      path='people/twitterProfileList', http_method='POST',
                      name='people.getTwitterList')
    def get_people_twitterList(self, request):
        empty_string = lambda x: x if x else ""
        linkedin = linked_in()
        keyword = empty_string(request.firstname) + " " + empty_string(request.lastname) + " " + empty_string(
            request.company)
        pro = linkedin.open_url_twitter_list(keyword)
        items = []
        for p in pro:
            items.append(getLinkedinSchema(title=p["title"], name=p["name"], url=p["url"]))
        return getLinkedinListSchema(items=items)

    # contacts export
    @endpoints.method(ContactListRequest, message_types.VoidMessage,
                      path='contacts/export', http_method='POST',
                      name='contacts.export')
    def export_contacts(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        token = endpoints.users_id_token._get_token(None)
        params = {
            "access_token": token,
            "tags": request.tags or [],
            "fileName": user_from_email.email + "_" + str(user_from_email.id),
            "email": user_from_email.email
        }
        requests.post("http://104.154.83.131:8080/api/export_contact",
                      data=json.dumps(params, sort_keys=True, indent=4, separators=(',', ': ')),
                      headers={'content-type': 'application/json'})
        return message_types.VoidMessage()

    # contacts export by key
    @endpoints.method(IDsRequest, message_types.VoidMessage,
                      path='contacts/export_keys', http_method='POST',
                      name='contacts.export_keys')
    def export_contacts_keys(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        token = endpoints.users_id_token._get_token(None)
        params = {
            "access_token": token,
            "IDs": request.ids,
            "fileName": user_from_email.email + "_" + str(user_from_email.id),
            "email": user_from_email.email
        }
        print params
        requests.post("http://104.154.83.131:8080/api/export_contact_by_key", data=json.dumps(params),
                      headers={'content-type': 'application/json'})
        return message_types.VoidMessage()

    # accounts export
    @endpoints.method(AccountListRequest, message_types.VoidMessage,
                      path='accounts/export', http_method='POST',
                      name='accounts.export')
    def export_accounts(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        token = endpoints.users_id_token._get_token(None)
        params = {
            "access_token": token,
            "tags": request.tags,
            "fileName": user_from_email.email + "_" + str(user_from_email.id),
            "email": user_from_email.email
        }
        print params
        r = requests.post("http://104.154.83.131:8080/api/export_account", data=json.dumps(params),
                          headers={'content-type': 'application/json'})
        return message_types.VoidMessage()

    # accounts export by key
    @endpoints.method(IDsRequest, message_types.VoidMessage,
                      path='accounts/export_keys', http_method='POST',
                      name='accounts.export_keys')
    def export_accounts_keys(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        token = endpoints.users_id_token._get_token(None)
        params = {
            "access_token": token,
            "IDs": request.ids,
            "fileName": user_from_email.email + "_" + str(user_from_email.id),
            "email": user_from_email.email
        }
        print params
        r = requests.post("http://104.154.83.131:8080/api/export_account_by_key", data=json.dumps(params),
                          headers={'content-type': 'application/json'})
        return message_types.VoidMessage()

    # event permission
    @endpoints.method(EventPermissionRequest, message_types.VoidMessage,
                      path='events/permission', http_method='POST',
                      name='events.permission')
    def event_permission(self, request):
        if request.parent == "contact":
            contact_key = ndb.Key(Contact, int(request.id))
            edges = Edge.query().filter(Edge.kind == "events", Edge.start_node == contact_key)
        elif request.parent == "account":
            account_key = ndb.Key(Account, int(request.id))
            edges = Edge.query().filter(Edge.kind == "events", Edge.start_node == account_key)
        elif request.parent == "case":
            case_key = ndb.Key(Case, int(request.id))
            edges = Edge.query().filter(Edge.kind == "events", Edge.start_node == case_key)
        elif request.parent == "opportunity":
            opportunity_key = ndb.Key(Opportunity, int(request.id))
            edges = Edge.query().filter(Edge.kind == "events", Edge.start_node == opportunity_key)
        elif request.parent == "lead":
            lead_key = ndb.Key(Lead, int(request.id))
            edges = Edge.query().filter(Edge.kind == "events", Edge.start_node == lead_key)
        if edges:
            for edge in edges:
                event = edge.end_node.get()
                event.access = request.access
                event.put()
        return message_types.VoidMessage()

    # task permission
    @endpoints.method(EventPermissionRequest, message_types.VoidMessage,
                      path='tasks/permission', http_method='POST',
                      name='tasks.permission')
    def task_permission(self, request):
        if request.parent == "contact":
            contact_key = ndb.Key(Contact, int(request.id))
            edges = Edge.query().filter(Edge.kind == "tasks", Edge.start_node == contact_key)
        elif request.parent == "account":
            account_key = ndb.Key(Account, int(request.id))
            edges = Edge.query().filter(Edge.kind == "tasks", Edge.start_node == account_key)
        elif request.parent == "case":
            case_key = ndb.Key(Case, int(request.id))
            edges = Edge.query().filter(Edge.kind == "tasks", Edge.start_node == case_key)
        elif request.parent == "opportunity":
            opportunity_key = ndb.Key(Opportunity, int(request.id))
            edges = Edge.query().filter(Edge.kind == "tasks", Edge.start_node == opportunity_key)
        elif request.parent == "lead":
            lead_key = ndb.Key(Lead, int(request.id))
            edges = Edge.query().filter(Edge.kind == "tasks", Edge.start_node == lead_key)
        if edges:
            for edge in edges:
                task = edge.end_node.get()
                task.access = request.access
                task.put()
        return message_types.VoidMessage()

    # list colaborator arezki lebdiri 4-8-14
    @endpoints.method(EntityKeyRequest, ColaboratorItem,
                      path='permissions/get_colaborators', http_method='POST',
                      name='permissions.get_colaborators')
    def getColaborators(self, request):
        Key = ndb.Key(urlsafe=request.entityKey)
        tab = []
        for node in Node.list_permissions(Key.get()):
            tab.append(ColaboratorSchema(display_name=node.google_display_name,
                                         email=node.email,
                                         img=node.google_public_profile_photo_url,
                                         entityKey=node.entityKey,
                                         google_user_id=node.google_user_id

                                         )
                       )

        return ColaboratorItem(items=tab)

    # twitter.get_people api
    @endpoints.method(EntityKeyRequest, TwitterProfileSchema,
                      path='people/twitterprofile', http_method='POST',
                      name='people.gettwitter')
    def get_people_twitter(self, request):
        response = linked_in.get_people_twitter(request.entityKey)
        return response

    @endpoints.method(OrganizationRquest, OrganizationResponse, path='organization/info', http_method='GET',
                      name="users.get_organization")
    def get_organization_info(self, request):
        organization_Key = ndb.Key(urlsafe=request.organization)
        organization = organization_Key.get()
        Users = User.query().filter(User.organization == organization_Key).fetch()
        licenses = []
        licenses_list = License.query().filter(License.organization == organization_Key).fetch()
        for license in licenses_list:
            kwargs = {
                'id': str(license.id),
                'entityKey': license.entityKey,
                'organization': license.organization.urlsafe(),
                'amount': str(license.amount),
                'purchase_date': license.purchase_date.isoformat(),
                'who_purchased_it': license.who_purchased_it
            }

            licenses.append(kwargs)

        userslenght = len(Users)
        licenselenght = len(licenses_list)
        response = {'organizationName': organization.name,
                    'organizationNumberOfUser': str(userslenght),
                    'organizationNumberOfLicense': str(licenselenght),
                    'licenses': licenses

                    }
        return OrganizationResponse(**response)

    # *************** the licenses apis ***************************
    @endpoints.method(LicenseInsertRequest, LicenseSchema,
                      path='licenses/insert', http_method='POST',
                      name='licenses.insert')
    def license_insert(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return License.insert(
            user_from_email=user_from_email,
            request=request
        )

    # hadji hicham 26/08/2014. purchase license for user.
    @endpoints.method(BillingRequest, BillingResponse, path='billing/purchase_user', http_method='POST',
                      name="billing.purchase_lisence_for_user")
    def purchase_lisence_for_user(self, request):
        token = request.token_id

        cust = stripe.Customer.retrieve(request.customer_id)
        cust.card = token
        cust.save()
        charge = stripe.Charge.create(
            amount=2000,
            currency="usd",
            customer=cust.id,
            description="Charge for  " + request.token_email)
        cust.subscriptions.create(plan="iogrow_plan")

        return BillingResponse(response=token)

    # hadji hicham 26/08/2014 . purchase license for the company.
    @endpoints.method(BillingRequest, LicenseSchema, path='billing/purchase_org', http_method='POST',
                      name="billing.purchase_lisence_for_org")
    def purchase_lisence_for_org(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        token = request.token_id
        charge = stripe.Charge.create(
            amount=2000,
            currency="usd",
            card=token,
            description="license for the organization  " + request.organization)
        return License.insert(
            user_from_email=user_from_email,
            request=request
        )

    @endpoints.method(getDocsRequest, DocumentListResponse, path="tasks/get_docs", http_method="POST",
                      name="tasks.get_docs")
    def get_documents_attached(self, request):
        task = Task.get_by_id(int(request.id))
        return Document.list_by_parent(parent_key=task.key,
                                       request=request
                                       )

    @endpoints.method(getDocsRequest, DocumentListResponse, path="events/get_docs", http_method="POST",
                      name="events.get_docs")
    def get_documents_event_attached(self, request):
        event = Event.get_by_id(int(request.id))
        return Document.list_by_parent(parent_key=event.key,
                                       request=request)

    @endpoints.method(deleteInvitedEmailRequest, message_types.VoidMessage,
                      path="invite/delete",
                      http_method="POST",
                      name="invite.delete")
    def delete_invited_user(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        for x in xrange(0, len(request.emails)):
            Invitation.delete_by(request.emails[x])
        return message_types.VoidMessage()

    @endpoints.method(deleteUserEmailRequest, message_types.VoidMessage,
                      path="users/delete",
                      http_method="POST",
                      name="users.delete")
    def delete_users(self, request):
        # not complete yet 
        user_from_email = EndpointsHelper.require_iogrow_user()
        if user_from_email.is_admin:
            for i in xrange(len(request.entityKeys)):
                user_key = ndb.Key(urlsafe=request.entityKeys[i])
                if not user_key.get().is_admin:
                    user_key.delete()
        else:
            raise endpoints.UnauthorizedException("you are not authorised")

        return message_types.VoidMessage()

    @endpoints.method(BillingDetailsRequest, message_types.VoidMessage, path="users/saveBillingDetails",
                      http_method="POST", name="users.saveBillingDetails")
    def saveBillingDetails(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        organization = user_from_email.organization.get()
        organization.name = request.billing_company_name
        organization.billing_contact_firstname = request.billing_contact_firstname
        organization.billing_contact_lastname = request.billing_contact_lastname
        organization.billing_contact_email = request.billing_contact_email
        organization.billing_contact_address = request.billing_contact_address
        organization.billing_contact_phone_number = request.billing_contact_phone_number
        organization.put()
        return message_types.VoidMessage()

    @endpoints.method(message_types.VoidMessage, KeywordListResponse,
                      path='keywords/list', http_method='POST',
                      name='keywords.list')
    def keyword_list(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Keyword.list_keywords(
            user_from_email=user_from_email
        )

    @endpoints.method(ProfileDeleteRequest, KeywordListResponse,
                      path='keywords/delete', http_method='POST',
                      name='keywords.delete')
    def keyword_delete(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        Keyword.delete(request)
        return Keyword.list_keywords(
            user_from_email=user_from_email
        )

    @endpoints.method(message_types.VoidMessage, MsgSchema,
                      path='users/desactivate', http_method='POST',
                      name='users.desactivate')
    def desactivate_user(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        msg = User.desactivate(
            user_from_email=user_from_email
        )
        return MsgSchema(msg=msg)

    @endpoints.method(EntityKeyRequest, MsgSchema,
                      path='users/switch_org', http_method='POST',
                      name='users.switch_org')
    def switch_org(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        msg = User.switch_org(
            user_from_email=user_from_email,
            entityKey=request.entityKey
        )
        return MsgSchema(msg=msg)

    @endpoints.method(message_types.VoidMessage, LogoResponse,
                      path='company/get_logo', http_method='GET',
                      name='company.get_logo')
    def get_logo_url(self, request):
        organization = EndpointsHelper.require_iogrow_user().organization.get()
        logo = Logo.query(Logo.organization == organization.key).get()
        if logo:
            return LogoResponse(fileUrl=logo.fileUrl, custom_logo=logo.custom_logo)
        return LogoResponse()

    @endpoints.method(message_types.VoidMessage, message_types.VoidMessage,
                      path='company/switch_logo', http_method='GET',
                      name='company.switch_logo')
    def switch_logo(self, request):
        organization = EndpointsHelper.require_iogrow_user().organization.get()
        logo = Logo.query(Logo.organization == organization.key).get()
        if logo:
            if logo.fileUrl:
                logo.custom_logo = logo.fileUrl
                logo.fileUrl = None
            elif logo.custom_logo:
                logo.fileUrl = logo.custom_logo
                logo.custom_logo = None
            logo.put()

        return message_types.VoidMessage()

    @endpoints.method(response_message=SubscriptionSchema, http_method='GET',
                      name='subscription.get', path='subscription/get')
    def get_subscription(self, request):
        user = EndpointsHelper.require_iogrow_user()
        return user.get_subscription().get_schema()

    @endpoints.method(response_message=SubscriptionListSchema, http_method='GET',
                      name='subscription.list', path='subscription/list')
    def fetch_subscriptions(self, request):
        org_key = EndpointsHelper.require_iogrow_user().organization
        users = User.fetch_by_organization(org_key)
        data = [iomessages.UserSubscriptionSchema(subscription=user.get_subscription().get_schema(), email=user.email)
                for user in users]
        return SubscriptionListSchema(data=data)

    @endpoints.method(response_message=SubscriptionSchema, http_method='GET',
                      name='subscription.organization_get', path='subscription/organization_get')
    def get_org_subscription(self, request):
        organization = EndpointsHelper.require_iogrow_user().organization.get()
        return organization.get_subscription().get_schema()

    @endpoints.method(name='subscription.disable_auto_renew', path='subscription/disable_auto_renew')
    def disable_auto_renew(self, request):
        organization = EndpointsHelper.require_iogrow_user().organization.get()
        subscription = organization.subscription.get()
        try:
            customer = stripe.Customer.retrieve(organization.stripe_customer_id)
            customer.subscriptions.retrieve(subscription.stripe_subscription_id).delete(at_period_end=True)
            subscription.is_auto_renew = False
            subscription.put()
        except stripe.APIError:
            raise endpoints.NotFoundException("")
        return message_types.VoidMessage()

    @endpoints.method(name='subscription.enable_auto_renew', path='subscription/enable_auto_renew')
    def enable_auto_renew(self, request):
        organization = EndpointsHelper.require_iogrow_user().organization.get()
        subscription = organization.subscription.get()
        interval = subscription.plan.get().interval
        try:
            customer = stripe.Customer.retrieve(organization.stripe_customer_id)
            sub = customer.subscriptions.retrieve(subscription.stripe_subscription_id)
            sub.plan = '{}_{}'.format(config.PREMIUM, interval)
            sub.save()
            subscription.is_auto_renew = True
            subscription.put()
        except stripe.APIError:
            raise endpoints.NotFoundException("")
        return message_types.VoidMessage()

    @endpoints.method(name='subscription.by_new_licences', path='subscription/by_new_licences',
                      request_message=LicencesQuantityMessage)
    def by_new_licences(self, request):
        user = EndpointsHelper.require_iogrow_user()
        organization = user.organization.get()
        subscription = organization.get_subscription()
        quantity = request.quantity
        if quantity <= 0:
            raise endpoints.BadRequestException("Quantity should be a positive number")
        try:
            customer = stripe.Customer.retrieve(organization.stripe_customer_id)
            sub = customer.subscriptions.retrieve(subscription.stripe_subscription_id)
            sub.quantity += quantity
            sub.save()
            if user.subscription.get().plan.get().name != config.PREMIUM:
                user.set_subscription(organization.subscription.get())
                user.put()

            subscription.quantity += quantity
            subscription.put()
        except stripe.error.CardError, e:
            self.response.headers['Content-Type'] = 'application/json'
            self.response.write(e.message)
            self.response.set_status(e.http_status)
        return message_types.VoidMessage()

    @endpoints.method(name='organization.licenses_status', path='organization/licenses_status',
                      http_method='GET', response_message=iomessages.OrganizationSubscriptionStatusMessage)
    def get_organizations_licenses_status(self, request):
        org_key = EndpointsHelper.require_iogrow_user().organization
        users_count = User.count_by_organization(org_key)
        resp = iomessages.OrganizationSubscriptionStatusMessage(users_count=users_count)

        organization = org_key.get()
        subscription = organization.subscription.get()
        plan_key = subscription.plan
        plan = plan_key.get()
        if plan.name == config.PREMIUM:
            resp.assigned_licenses = organization.get_assigned_licenses()
            resp.licenses_bought = subscription.quantity
        return resp

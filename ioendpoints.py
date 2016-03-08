# -*- coding: utf-8 -*-
"""
This file is the main part of ioGrow API. It contains all request, response
classes add to calling methods.

"""
# Standard libs
import datetime
import json
import logging
from datetime import timedelta

import httplib2
from django.utils.encoding import smart_str

# Google libs
from google.appengine.ext import ndb
from google.appengine.api import search
from google.appengine.api import memcache
from google.appengine.api import taskqueue
from google.appengine.api import mail
from apiclient.discovery import build
from protorpc import remote
from protorpc import messages
import endpoints
from protorpc import message_types
import requests
# Third party libraries

# Our libraries
from iograph import Node, Edge, RecordSchema, InfoNodeResponse, InfoNodeListResponse
from iomodels.crmengine import config
from iomodels.crmengine.accounts import Account, AccountGetRequest, AccountPatchRequest, AccountSchema, \
    AccountListRequest, AccountListResponse, AccountSearchResults, AccountInsertRequest
from iomodels.crmengine.contacts import Contact, ContactGetRequest, ContactInsertRequest, ContactPatchSchema, \
    ContactSchema, ContactListRequest, ContactListResponse, ContactSearchResults, ContactImportRequest, \
    ContactImportHighriseRequest, DetailImportHighriseRequest, \
    InvitationRequest, ContactMergeRequest
from iomodels.crmengine.notes import Note, AuthorSchema, DiscussionAboutSchema, \
    NoteSchema
from iomodels.crmengine.payment import Subscription
from iomodels.crmengine.tasks import Task, TaskSchema, TaskRequest, TaskListResponse, TaskInsertRequest
# from iomodels.crmengine.tags import Tag
from iomodels.crmengine.opportunities import Opportunity, OpportunityPatchRequest, UpdateStageRequest, \
    OpportunitySchema, OpportunityInsertRequest, OpportunityListRequest, OpportunityListResponse, \
    OpportunitySearchResults, OpportunityGetRequest, NewOpportunityListRequest, AggregatedOpportunitiesResponse, \
    OppTimeline
from iomodels.crmengine.pipelines import Pipeline, PipelineInsertRequest, PipelineSchema, PipelineGetRequest, \
    PipelineListRequest, PipelineListResponse, \
    PipelinePatchRequest  # ,PipelinePatchRequest,UpdateStageRequest,PipelineListRequest,PipelineListResponse,PipelineSearchResults,PipelineGetRequest,NewPipelineListRequest,AggregatedOpportunitiesResponse
from iomodels.crmengine.events import Event, EventInsertRequest, EventSchema, EventPatchRequest, EventListRequest, \
    EventListResponse, EventFetchListRequest, EventFetchResults
from iomodels.crmengine.documents import Document, DocumentInsertRequest, DocumentSchema, MultipleAttachmentRequest, \
    DocumentListResponse
from iomodels.crmengine.shows import Show
from iomodels.crmengine.leads import Lead, LeadPatchRequest, LeadFromTwitterRequest, LeadInsertRequest, LeadListRequest, \
    LeadListResponse, LeadSearchResults, LeadGetRequest, LeadSchema, FLNameFilterRequest, LeadMergeRequest, \
    FLsourceFilterRequest, FullContactRequest
from iomodels.crmengine.cases import Case, UpdateStatusRequest, CasePatchRequest, CaseGetRequest, CaseInsertRequest, \
    CaseListRequest, CaseSchema, CaseListResponse, CaseSearchResults
# from iomodels.crmengine.products import Product
from iomodels.crmengine.comments import Comment
from iomodels.crmengine.Licenses import License, LicenseSchema, LicenseInsertRequest
from iomodels.crmengine.opportunitystage import Opportunitystage, OpportunitystagePatchListRequestSchema, \
    OpportunitystageListSchema
from iomodels.crmengine.leadstatuses import Leadstatus
from iomodels.crmengine.casestatuses import Casestatus
from iomodels.crmengine.feedbacks import Feedback
from iomodels.crmengine.needs import Need, NeedInsertRequest, NeedSchema
from iomodels.crmengine.tags import Tag, TagSchema, TagListRequest, TagListResponse, TagInsertRequest
from iomodels.crmengine.profiles import ProfileDeleteRequest, Keyword, KeywordListResponse
from lib.stripe.error import InvalidRequestError
from model import User
from model import Organization
from model import Userinfo
from model import Group
from model import Member
from model import Contributor
from model import Invitation
from model import TopicScoring
from model import LicenseModel
from model import TransactionModel
from model import Logo
from model import CustomField
from model import CountryCurrency
from endpoints_helper import EndpointsHelper
from discovery import Discovery
from people import linked_in
from operator import itemgetter
import iomessages
from iomessages import Scoring_Topics_Schema, Topics_Schema, Topic_Comparaison_Schema, TopicsResponse, \
    TweetResponseSchema, SubscriptionSchema
from ioreporting import Reports, ReportSchema
from iomessages import LinkedinProfileSchema, TwitterProfileSchema, KewordsRequest, TwitterRequest, tweetsResponse, \
    LinkedinCompanySchema, \
    Tweet_id
import stripe
import config as config_urls
import re
import ast

# google contacts
# import atom.data
# import gdata.data
# import gdata.contacts.client
# import gdata.contacts.data

# The ID of javascript client authorized to access to our api
# This client_id could be generated on the Google API console
# **************Client_id---------------
CLIENT_ID = '935370948155-a4ib9t8oijcekj8ck6dtdcidnfof4u8q.apps.googleusercontent.com'
# *************** Email address misleading from Google
# CLIENT_ID = '935370948155-j01mm81b35mb4pqt38sfigi7t6ivl1m4@developer.gserviceaccount.com'
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

        'url': '/#/notes/show/'
    },
    'Document': {
        'title': 'Document',
        'url': '/#/documents/show/'
    }
}

INVERSED_EDGES = {
    'tags': 'tagged_on',
    'tagged_on': 'tags'

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



class TwitterProfileRequest(messages.Message):
    firstname = messages.StringField(1)
    lastname = messages.StringField(2)


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


class CompanyProfileSchema(messages.Message):
    id = messages.StringField(1)
    name = messages.StringField(2)
    addresses = messages.MessageField(AddressSchema, 3, repeated=True)


class CompanyProfileResponse(messages.Message):
    items = messages.MessageField(CompanyProfileSchema, 1, repeated=True)
    nextPageToken = messages.StringField(2)


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


class ReportingRequest(messages.Message):
    user_google_id = messages.StringField(1)
    google_display_name = messages.StringField(2)
    organizationName = messages.StringField(3)
    sorted_by = messages.StringField(4)
    status = messages.StringField(5)
    source = messages.StringField(6)
    stage = messages.StringField(7)
    organization_id = messages.StringField(8)
    group_by = messages.StringField(9)
    nb_days = messages.IntegerField(10)


class ReportingResponseSchema(messages.Message):
    user_google_id = messages.StringField(1)
    count = messages.IntegerField(2)
    google_display_name = messages.StringField(3)
    email = messages.StringField(4)
    created_at = messages.StringField(5)
    count_account = messages.IntegerField(6)
    count_contacts = messages.IntegerField(7)
    count_leads = messages.IntegerField(8)
    count_tasks = messages.IntegerField(9)
    count_opporutnities = messages.IntegerField(10)
    updated_at = messages.StringField(11)
    amount = messages.IntegerField(12)
    organization_id = messages.StringField(13)
    organizationName = messages.StringField(14)
    status = messages.StringField(15)
    source = messages.StringField(16)
    stage = messages.StringField(17)
    Total = messages.IntegerField(18)
    Total_amount = messages.IntegerField(19)
    Growth_nb = messages.IntegerField(20)
    Growth_rate = messages.StringField(21)
    nb_users = messages.IntegerField(22)


class ReportingListResponse(messages.Message):
    items = messages.MessageField(ReportingResponseSchema, 1, repeated=True)


# hadji hicham 10/08/2014 -- Organization stuff .

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
    name='ioadmin',
    version='v1',
    scopes=["https://www.googleapis.com/auth/plus.login",
            "https://www.googleapis.com/auth/plus.profile.emails.read"],
    description='ioGrow Admin Console apis',
    allowed_client_ids=[
        CLIENT_ID,
        endpoints.API_EXPLORER_CLIENT_ID
    ]
)
class IoAdmin(remote.Service):
    ID_RESOURCE = endpoints.ResourceContainer(
        message_types.VoidMessage,
        id=messages.StringField(1))

    @endpoints.method(message_types.VoidMessage, iomessages.OrganizationAdminList,
                      path='organizations.list', http_method='POST',
                      name='organizations/list')
    def organization_list(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        if user_from_email.email not in ADMIN_EMAILS:
            raise endpoints.UnauthorizedException('You don\'t have permissions.')
        items = []
        organizations = Organization.query().fetch()
        for organization in organizations:
            owner = User.get_by_gid(organization.owner)
            owner_schema = None
            if owner:
                owner_schema = iomessages.UserSchema(
                    google_display_name=owner.google_display_name,
                    google_public_profile_photo_url=owner.google_public_profile_photo_url,
                    email=owner.email
                )
            nb_users = 0
            users = User.query(User.organization == organization.key).fetch()
            if users:
                nb_users = len(users)
            license_schema = None
            if organization.plan is None:
                res = LicenseModel.query(LicenseModel.name == 'free_trial').fetch(1)
                if res:
                    license = res[0]
                else:
                    license = LicenseModel(name='free_trial', payment_type='online', price=0, is_free=True, duration=30)
                    license.put()
                organization.plan = license.key
                organization.put_async()
            else:
                license = organization.plan.get()
            if license:
                license_schema = iomessages.LicenseModelSchema(
                    id=str(license.key.id()),
                    entityKey=license.key.urlsafe(),
                    name=license.name
                )

            now = datetime.datetime.now()
            if organization.licenses_expires_on:
                days_before_expiring = organization.licenses_expires_on - now
                expires_on = organization.licenses_expires_on
            else:
                expires_on = organization.created_at + datetime.timedelta(days=30)
                days_before_expiring = organization.created_at + datetime.timedelta(days=30) - now
            nb_licenses = 0
            if organization.nb_licenses:
                nb_licenses = organization.nb_licenses

            organizatoin_schema = iomessages.OrganizationAdminSchema(
                id=str(organization.key.id()),
                entityKey=organization.key.urlsafe(),
                name=organization.name,
                owner=owner_schema,
                nb_users=nb_users,
                nb_licenses=nb_licenses,
                license=license_schema,
                days_before_expiring=days_before_expiring.days + 1,
                expires_on=expires_on.isoformat(),
                created_at=organization.created_at.isoformat()
            )
            items.append(organizatoin_schema)
        items.sort(key=lambda x: x.nb_users)
        items.reverse()
        return iomessages.OrganizationAdminList(items=items)

    @endpoints.method(message_types.VoidMessage, iomessages.LicensesAdminList,
                      path='licenses.list', http_method='POST',
                      name='licenses/list')
    def licenses_list(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        if user_from_email.email not in ADMIN_EMAILS:
            raise endpoints.UnauthorizedException('You don\'t have permissions.')
        items = []
        results = LicenseModel.query().fetch()
        for item in results:
            license_schema = iomessages.LicenseModelSchema(
                id=str(item.key.id()),
                entityKey=item.key.urlsafe(),
                name=item.name,
                payment_type=item.payment_type,
                is_free=item.is_free,
                duration=item.duration
            )
            items.append(license_schema)
        return iomessages.LicensesAdminList(items=items)

    @endpoints.method(iomessages.UpdateOrganizationLicenseRequest, message_types.VoidMessage,
                      path='organizations.update_license', http_method='POST',
                      name='organizations/update_license')
    def update_license_from_admin(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        if user_from_email.email not in ADMIN_EMAILS:
            raise endpoints.UnauthorizedException('You don\'t have permissions.')
        organization_key = ndb.Key(urlsafe=request.entityKey)
        organization = organization_key.get()
        if organization is None:
            raise endpoints.NotFoundException('Organization not found')
        license_key = ndb.Key(urlsafe=request.license_key)
        if license_key is None:
            raise endpoints.NotFoundException('License not found')
        organization.plan = license_key
        if request.nb_licenses:
            organization.nb_licenses = request.nb_licenses
        if request.nb_days:
            now = datetime.datetime.now()
            organization.licenses_expires_on = now + datetime.timedelta(days=request.nb_days)

        organization.put()
        return message_types.VoidMessage()


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

    # Search API
    @endpoints.method(SearchRequest, inviteResults, path="autocomplete", http_method="POST", name="autocomplete")
    def autocomplete(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        email = user_from_email.email
        index = search.Index(name="GlobalIndex")
        # Show only objects where you have permissions
        query_string = request.q + 'type:Gcontact AND owner:' + user_from_email.google_user_id
        search_results = []
        count = 1
        # if request.limit:
        #     limit = int(request.limit)
        # else:
        #     limit = 10
        # next_cursor = None
        # if request.pageToken:
        #     cursor = search.Cursor(web_safe_string=request.pageToken)
        # else:
        #     cursor = search.Cursor(per_result=True)
        # if limit:
        #     options = search.QueryOptions(limit=limit,cursor=cursor)
        # else:
        #     options = search.QueryOptions(cursor=cursor)
        query = search.Query(query_string=query_string)
        try:
            if query:
                result = index.search(query)
                print "*************lets check this out results****************"
                print len(result.results)
                print "************************************************"
                next_cursor = ""
                # total_matches = results.number_found
                # Iterate over the documents in the results
                # if len(result.results) == limit + 1:
                #     next_cursor = result.results[-1].cursor.web_safe_string
                # else:
                #     next_cursor = None
                results = result.results
                for scored_document in results:
                    kwargs = {
                        "id": scored_document.doc_id,
                        "rank": scored_document.rank
                    }
                    for e in scored_document.fields:
                        if e.name in ["title", "type", "emails"]:
                            kwargs[e.name] = e.value
                    search_results.append(inviteResult(**kwargs))
        except search.Error:
            logging.exception('Search failed')
        return inviteResults(items=search_results, nextPageToken=next_cursor)

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
        # Reports.add_account(user_from_email,nbr=-1)
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
        # Reports.add_lead(user_from_email,nbr=-1)
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
        # Reports.add_lead(user_from_email,nbr=-1)
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
        r = requests.post("http://104.154.83.131:8080/api/export_case", data=json.dumps(params),
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
        print params
        r = requests.post("http://104.154.83.131:8080/api/export_case_by_key", data=json.dumps(params),
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
            raise ('Case status not found')
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
        # user_from_email = EndpointsHelper.require_iogrow_user()
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
        print "----------------that's it ----------------------"
        print parent.id
        print "-------------------------------------"
        print parent_key.kind()
        print "--------------------------------------"
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
            parent.comments = parent.comments + 1

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
        body = '<p>#new comment, view details on ioGrow: <a href="http://www.iogrow.com/' + url + '">'
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
        # user_from_email = EndpointsHelper.require_iogrow_user()
        # TODO: Check permissions
        print "************************"
        print my_model
        print "************************"

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
        # Reports.add_contact(user_from_email,nbr=-1)
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
        # Reports.add_lead(user_from_email,nbr=-1)
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

    # custom_fields APIs
    # customfield.insert api
    # @endpoints.method(ContactSynchronizeRequest, message_types.VoidMessage,
    #                   path='contacts/synchronize', http_method='POST',
    #                   name='contacts.synchronize')
    # def synchronize_google_contact(self, request):
    #     user_from_email = EndpointsHelper.require_iogrow_user()
    #     taskqueue.add(
    #             url='/workers/sync_contact_with_gontacts',
    #             queue_name='iogrow-gontact',
    #             params={
    #                 'key': user_from_email.key.urlsafe()
    #             }
    #     )
    #     return message_types.VoidMessage()

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
        ############
        # store other company == company.all()
        #############
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
        account_schema = ""
        people = EndpointsHelper.highrise_import_peoples(request)
        contacts_keys = {}
        tasks_id = []
        for person in people:
            ############
            # Store company if persone
            ################
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
            # create edge between account and persone
            if account_schema != "":
                Edge.insert(start_node=ndb.Key(urlsafe=account_schema.entityKey),
                            end_node=ndb.Key(urlsafe=contact_schema.entityKey),
                            kind='contacts',
                            inverse_edge='parents')

            #########
            # store tasks of person
            tasks = EndpointsHelper.highrise_import_tasks_of_person(person.id)

            for task in tasks:
                tasks_id.append(task.id)
                from iomodels.crmengine.tasks import EntityKeyRequest
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

            ###########
            # store notes of persons
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

        #########
        # store opporutnities of person
        deals = EndpointsHelper.highrise_import_opportunities()
        i = 0
        for deal in deals:
            print i
            i = i + 1
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
                # contact=Contact.get_key_by_name(user,deal)
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

            opportunity_schema = Opportunity.insert(user, opportunity_request)

        # store tasks
        taskss = ""
        taskss = EndpointsHelper.highrise_import_tasks()
        for task in taskss:
            print "tasssskk", task.__dict__
            print tasks_id, "iiiiiiiiiiiii", task.owner_id
            if task.id not in tasks_id:
                print "ineeeeeeeeeeeeee"
                print task.__dict__
                from iomodels.crmengine.tasks import EntityKeyRequest
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
            if task.due != None:
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
        if request.subject != None:
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
                attachments_notes += '<li><a href="/#/documents/show/' + item.id + '">'
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

    # Groups API
    # groups.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='groups', http_method='DELETE',
                      name='groups.delete')
    def group_delete(self, request):
        entityKey = ndb.Key(urlsafe=request.entityKey)
        Edge.delete_all_cascade(start_node=entityKey)
        return message_types.VoidMessage()

    # groups.get API
    @Group.method(request_fields=('id',), path='groups/{id}', http_method='GET', name='groups.get')
    def GroupGet(self, my_model):
        if not my_model.from_datastore:
            raise endpoints.NotFoundException('Account not found.')
        return my_model

    # groups.insert API
    @Group.method(path='groups', http_method='POST', name='groups.insert')
    def GroupInsert(self, my_model):
        user_from_email = EndpointsHelper.require_iogrow_user()
        # Todo: Check permissions
        my_model.organization = user_from_email.organization
        my_model.put()
        return my_model

    # groups.list API
    @Group.query_method(query_fields=('limit', 'order', 'pageToken'), path='groups', name='groups.list')
    def GroupList(self, query):
        return query

    # groups.patch API
    @Group.method(
        http_method='PATCH', path='groups/{id}', name='groups.patch')
    def GroupPatch(self, my_model):
        user_from_email = EndpointsHelper.require_iogrow_user()
        # Todo: Check permissions
        my_model.put()
        return my_model

    # Leads APIs
    # leads.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='leads/delete', http_method='DELETE',
                      name='leads.delete')
    def lead_delete(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        # Reports.add_lead(user_from_email,nbr=-1)
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
        # Reports.add_lead(user_from_email,nbr=-1)
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
        moved_folder = EndpointsHelper.move_folder(user_from_email, lead.folder, 'Contact')
        contact = Contact(owner=lead.owner,
                          organization=lead.organization,
                          collaborators_ids=lead.collaborators_ids,
                          collaborators_list=lead.collaborators_list,
                          folder=moved_folder['id'],
                          firstname=lead.firstname,
                          lastname=lead.lastname,
                          title=lead.title)
        if lead.company:
            created_folder = EndpointsHelper.insert_folder(user_from_email, lead.company, 'Account')
            account = Account(owner=lead.owner,
                              organization=lead.organization,
                              collaborators_ids=lead.collaborators_ids,
                              collaborators_list=lead.collaborators_list,
                              account_type='prospect',
                              name=lead.company,
                              folder=created_folder['id'])
            account.put()
            contact.account_name = lead.company
            contact.account = account.key
        contact.put()
        notes = Note.query().filter(Note.about_kind == 'Lead', Note.about_item == str(lead.key.id())).fetch()
        for note in notes:
            note.about_kind = 'Contact'
            note.about_item = str(contact.key.id())
            note.put()
        tasks = Task.query().filter(Task.about_kind == 'Lead', Task.about_item == str(lead.key.id())).fetch()
        for task in tasks:
            task.about_kind = 'Contact'
            task.about_item = str(contact.key.id())
            task.put()
        events = Event.query().filter(Event.about_kind == 'Lead', Event.about_item == str(lead.key.id())).fetch()
        for event in events:
            event.about_kind = 'Contact'
            event.about_item = str(contact.key.id())
            event.put()
        lead.key.delete()
        return ConvertedLead(id=contact.key.id())

    # leads.from_twitter api
    @endpoints.method(LeadFromTwitterRequest, LeadSchema,
                      path='leads/from_twitter', http_method='POST',
                      name='leads.from_twitter')
    def lead_from_twitter(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Lead.from_twitter(
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
            raise ('Lead status not found')
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

    # Members APIs
    # members.get API
    @Member.method(request_fields=('id',), path='members/{id}', http_method='GET', name='members.get')
    def MemberGet(self, my_model):
        if not my_model.from_datastore:
            raise endpoints.NotFoundException('Account not found.')
        return my_model

    #  members.insert API

    @Member.method(path='members', http_method='POST', name='members.insert')
    def MemberInsert(self, my_model):
        user_from_email = EndpointsHelper.require_iogrow_user()
        # Todo: Check permissions
        my_model.organization = user_from_email.organization
        my_model.put()
        return my_model

    # members.list API
    @Member.query_method(query_fields=('limit', 'order', 'groupKey', 'pageToken'), path='members', name='members.list')
    def MemberList(self, query):
        return query

    # members.patch API
    @Member.method(
        http_method='PATCH', path='members/{id}', name='members.patch')
    def MemberPatch(self, my_model):
        user_from_email = EndpointsHelper.require_iogrow_user()
        # Todo: Check permissions
        my_model.put()
        return my_model

    # members.update API
    @Member.method(
        http_method='PUT', path='members/{id}', name='members.update')
    def MemberUpdate(self, my_model):
        user_from_email = EndpointsHelper.require_iogrow_user()
        # Todo: Check permissions
        # my_model.owner = user_from_email.google_user_id
        # my_model.organization =  user_from_email.organization
        my_model.put()
        return my_model

    # Needs APIs

    # needs.delete api
    @endpoints.method(EntityKeyRequest, message_types.VoidMessage,
                      path='needs', http_method='DELETE',
                      name='needs.delete')
    def need_delete(self, request):
        entityKey = ndb.Key(urlsafe=request.entityKey)
        Edge.delete_all_cascade(start_node=entityKey)
        return message_types.VoidMessage()

    # needs.get api
    @Need.method(request_fields=('id',), path='needs/{id}', http_method='GET', name='needs.get')
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
            user_from_email=user_from_email,
            request=request
        )

    # needs.insert api
    @Need.method(path='needs', http_method='POST', name='needs.insert')
    def need_insert(self, my_model):
        user_from_email = EndpointsHelper.require_iogrow_user()
        # Todo: Check permissions
        my_model.owner = user_from_email.google_user_id
        my_model.organization = user_from_email.organization
        # get the account or lead folder
        # my_model.folder = created_folder['id']
        my_model.put()
        return my_model

    # needs.list api
    @Need.query_method(query_fields=(
            'limit', 'order', 'pageToken', 'about_kind', 'about_item', 'about_name', 'priority', 'need_status'),
        path='needs',
        name='needs.list')
    def need_list(self, query):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return query.filter(ndb.OR(ndb.AND(Need.access == 'public', Need.organization == user_from_email.organization),
                                   Need.owner == user_from_email.google_user_id,
                                   Need.collaborators_ids == user_from_email.google_user_id)).order(Need._key)

    # needs.patch api
    @Need.method(
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
            if (eval('patched_model.' + p) != eval('my_model.' + p)) and (eval('my_model.' + p)):
                exec ('patched_model.' + p + '= my_model.' + p)
        patched_model.put()
        return patched_model

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
                # record_list_of_values = junkers.sub('', record.value).split(',')
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
        opp = entityKey.get()
        # Reports.remove_opportunity(opp)

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
        # Reports.add_lead(user_from_email,nbr=-1)
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
        print "#################((((update stages]]]]]]###########"
        print ndb.Key(urlsafe=request.entityKey).get()
        print ndb.Key(urlsafe=request.stage).get()
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
            raise ('Opportunity stage not found')
        return my_model

    # opportunitystages.insert api
    @Opportunitystage.method(

        path='opportunitystage',
        http_method='POST',
        name='opportunitystages.insert'
    )
    def OpportunitystageInsert(self, my_model):
        print "my_model======================", my_model.from_datastore
        user_from_email = EndpointsHelper.require_iogrow_user()
        my_model.owner = user_from_email.google_user_id
        my_model.organization = user_from_email.organization
        my_model.nbr_opportunity = 0
        count = 0;
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

    # # tags.insert api
    # @Tag.method(path='tags', http_method='POST', name='tags.insert')
    # def TagInsert(self, my_model):
    #     print "tagggggggginsert11", my_model
    #     crawling_tweets=Crawling()
    #     crawling_tweets.keyword=my_model.name
    #     crawling_tweets.last_crawled_date=datetime.datetime.now()
    #     crawling_tweets.put()
    #     user_from_email = EndpointsHelper.require_iogrow_user()
    #     my_model.organization = user_from_email.organization
    #     my_model.owner = user_from_email.google_user_id
    #     keyy=my_model.put()
    #     list=[]
    #     tag=PatchTagSchema()
    #     tag.entityKey=keyy.urlsafe()
    #     tag.name=my_model.name
    #     list.append(tag)
    #     #if from oppportunity do'nt launch tweets api....
    #     Discovery.get_tweets(list,"recent")
    #     return my_model
    #     #launch frome here tasqueue
    # tags.insert api

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
        if task.due != None:
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
        # Reports.add_lead(user_from_email,nbr=-1)
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
    # @User.method(path='users', http_method='POST', name='users.insert')
    def UserInsert(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        organization = user_from_email.organization.get()
        license = organization.plan.get()
        invitees = Invitation.list_invitees(user_from_email.organization)
        users = User.query(User.organization == user_from_email.organization).fetch()
        for invitee in invitees:
            if invitee['invited_mail'] == request.emails[0]:
                return message_types.VoidMessage()
        for user in users:
            if user.email == request.emails[0]:
                return message_types.VoidMessage()
        nb_invitees = len(invitees)
        try:
            nb_license_available = organization.nb_licenses - organization.nb_used_licenses
        except:
            nb_license_available = 1
        if license.name == "life_time_free" or license.name == "freemium" or license.name == "premium_trial" or (
                        nb_license_available > 0 and nb_license_available > nb_invitees):
            credentials = user_from_email.google_credentials
            http = credentials.authorize(httplib2.Http(memcache))
            service = build('gmail', 'v1', http=http)
            # OAuth flow

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
                        return
                else:
                    my_model.invited_by = user_from_email.key
                    my_model.status = 'invited'
                    my_model.is_admin = False
                    # my_model.email = request.emails[0]
                    invited_user_key = my_model.put_async()
                    invited_user_async = invited_user_key.get_result()
                    invited_user_id = invited_user_async.id()
                    Invitation.insert(email, user_from_email)
                    send_notification_mail = True

                if send_notification_mail:
                    confirmation_url = "http://www.iogrow.com/sign-in?id=" + str(invited_user_id) + '&'
                    cc = None
                    bcc = None
                    subject = "Invitation from " + user_from_email.google_display_name
                    html = "<html><head></head><body><div ><div style='margin-left:291px'><a href='www.iogrow.com'><img src='cid:user_cid'  style='width:130px;'/></div><div><h2 style='margin-left:130px ;font-family: sans-serif;color: rgba(137, 137, 137, 1);'></a><span style='color:#1C85BB'>" + user_from_email.google_display_name + "</span> has invited you to use ioGrow</h2><p style='margin-left: 30px;font-family: sans-serif;color: #5B5D62;font-size: 17px'>We are using ioGrow to collaborate, discover new customers and grow our business .It is a website where we manage our relationships with the customers .</p></div><div><a href='" + confirmation_url + "' style='margin-left: 259px;border: 2px solid #91ACFF;padding: 10px;border-radius: 18px;text-decoration: blink;background-color: #91ACFF;color: white;font-family: sans-serif;'>JOIN YOUR TEAM ON IOGROW</a> <br><hr style=' width: 439px;margin-left: 150px;margin-top: 28px;'><p style='margin-left:290px;font-family:sans-serif'><a href='www.iogrow.com' style='text-decoration: none;'><img src='cid:logo_cid'  alt='Logo'/> ioGrow (c)2015</a></p></div></div></body></html>"
                    message = EndpointsHelper.create_message_with_attchments_local_files(
                        user_from_email.google_display_name,
                        email,
                        cc,
                        bcc,
                        subject,
                        html
                    )

                    EndpointsHelper.send_message(service, 'me', message)
                    # sender_address = user_from_email.google_display_name+" <notifications@gcdc2013-iogrow.appspotmail.com>"

                    # body = """
                    # Thank you for creating an account! Please confirm your email address by
                    # clicking on the link below:
                    # %s
                    # """ % confirmation_url

                    # body=user_from_email.google_display_name+"invited you to ioGrow:\n"+"We are using ioGrow to collaborate, discover new customers and grow our business \n"+"It is a website where we have discussions, share files and keep track of everything \n"+"related to our business.\n"+"Accept this invitation to get started : "+confirmation_url+"\n"+"For question and more : \n"+"Contact ioGrow at contact@iogrow.com."
                    # body=user_from_email.google_display_name+"invited you to ioGrow:\n"+"We are using ioGrow to collaborate, discover new customers and grow our business \n"+"It is a website where we have discussions, share files and keep track of everything \n"+"related to our business.\n"+"Accept this invitation to get started : "+confirmation_url+"\n"+"For question and more : \n"+"Contact ioGrow at contact@iogrow.com."
                    # body="<div >"+"<div style='margin-left:486px'>"+"<img src='/static/img/avatar_2x.png'  style='width:130px;border-radius: 69px;'/>"+"</div>"+"<div>"+"<h1 style='margin-left:303px ;font-family: sans-serif;color: #91ACFF;'>"+ "<span style='color:#1C85BB'>"+user_from_email.google_display_name+"</span>"+"has invited you to use ioGrow"+"</h1>"+"<p style='margin-left: 191px;font-family: monospace;color: #5B5D62;font-size: 17px'>"+"We are using ioGrow to collaborate, discover new customers and grow our business ."+"<br>"+"It is a website where we have discussions, share files and keep track of everything"+"<br>"+"<span style='margin-left:237px'>"+"related to our business."+"</span>"+"</p>"+"</div>"+"<div>"+"<a href='"+confirmation_url+"' style='margin-left: 420px;border: 2px solid #91ACFF;padding: 10px;border-radius: 18px;text-decoration: blink;background-color: #91ACFF;color: white;font-family: sans-serif;'>"+"JOIN YOUR TEAM ON IOGROW"+"</a> <br>"+"<hr style=' width: 439px;margin-left: 334px;margin-top: 28px;'>"+"<p style='margin-left:470px;font-family:sans-serif'>"+"<img src='/static/img/sm-iogrow-true.png'>"+" ioGrow (c)2015" +"</p>"+"</div>"+"</div>"

                    # mail.send_mail(sender_address, email , subject,body)
        else:
            print "piracy proccess has failed , ha ha ha !"
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
        token =  endpoints.users_id_token._get_token(None)
            # will get the token info from network
        result = EndpointsHelper.get_token_info(token)
        if result.status_code != 200:
            raise endpoints.UnauthorizedException('Invalid token')
        token_info = json.loads(result.content)
        if 'email' not in token_info:
            raise endpoints.UnauthorizedException('Invalid token')
        email = token_info['email']
        user = User(
            type = 'public_user',
            status = 'active',
            google_user_id = request.google_user_id,
            google_display_name = request.google_display_name,
            google_public_profile_url = request.google_public_profile_url,
            email = email,
            completed_tour = False,
            google_public_profile_photo_url = request.google_public_profile_photo_url,
            currency = 'USD',
            week_start = 'monday'
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
            #     invitenmbrOfLicenses=0
            #     inviteisLicensed=False
            #     edgeinvite=Edge.query().filter(Edge.start_node==user.key and Edge.kind=="licenses").fetch()
            #     if edgeinvite:
            #            invitenmbrOfLicenses=len(edge)
            #            inviteLicenseStatus='Active'
            #     else:
            #            inviteLicenseStatus='Not active'
            invited_schema = iomessages.InvitedUserSchema(
                invited_mail=invitee['invited_mail'],
                invited_by=invitee['invited_by'],
                updated_at=invitee['updated_at'].strftime("%Y-%m-%dT%H:%M:00.000"),
                # LicenseStatus= inviteLicenseStatus,
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

        #  if not my_model.from_datastore:
        #     raise endpoints.NotFoundException('Account not found.')
        # patched_model_key = my_model.entityKey
        # patched_model = ndb.Key(urlsafe=patched_model_key).get()
        # print "############################################"
        # properties = User().__class__.__dict__
        # for p in properties.keys():
        #     patched_p = eval('patched_model.' + p)
        #     my_p = eval('my_model.' + p)
        #     if (patched_p != my_p) \
        #     and (my_p and not(p in ['put', 'set_perm', 'put_index'])):
        #         exec('patched_model.' + p + '= my_model.' + p)
        #         print "************************************************"
        #         print p
        # patched_model.put()
        # memcache.set(user_from_email.email, patched_model)
        # print patched_model
        # return patched_model

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
        if user == None:
            raise endpoints.NotFoundException('User not found')
        return user
        # @User.method(
        #                    request_fields=('id',),
        #                    path='user/{id}',
        #                    http_method='GET',
        #                    name='user.get'
        #                    )
        # def UserGet(self,my_model):
        #     if not my_model.from_datastore:
        #         raise('Lead status not found')
        #     return my_model
        # hadji hicham 11/08/2014. get user by id

    # @endpoints.method(iomessages.customerRequest, iomessages.customerResponse,
    #                   http_method='GET', path='users/{id}', name='users.customer')
    # def Customer(self, request):
    #     user_from_email = EndpointsHelper.require_iogrow_user()
    #     cust = stripe.Customer.retrieve(request.id)
    #     charges_list = stripe.Charge.all(customer=request.id)
    #     subscriptions_list = cust.subscriptions.all()
    #
    #     subscriptions = []
    #     for subscription in subscriptions_list.data:
    #         kwargsubscription = {
    #             "id": subscription.id,
    #             "current_period_start": datetime.datetime.fromtimestamp(
    #                 int(subscription.current_period_start)).strftime('%Y-%m-%d %H:%M:%S'),
    #             "current_period_end": datetime.datetime.fromtimestamp(int(subscription.current_period_end)).strftime(
    #                 '%Y-%m-%d %H:%M:%S'),
    #             "status": str(subscription.status),
    #             "plan": subscription.plan.name
    #         }
    #         subscriptions.append(kwargsubscription)
    #
    #     kwargs = {
    #         "customer_id": cust.id,
    #         "email": cust.email,
    #         "google_public_profile_photo_url": cust.metadata.google_public_profile_photo_url,
    #         "google_display_name": cust.metadata.google_display_name,
    #         "google_user_id": cust.metadata.google_user_id,
    #         "subscriptions": subscriptions
    #     }
    #     # user=User.query().filter(User.id==my_model.id).get()
    #
    #     return iomessages.customerResponse(**kwargs)

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
                # must be improved !! ,timeMin=request.calendar_feeds_start,timeMax=request.calendar_feeds_end
                eventsG = service.events().list(calendarId='primary', pageToken=page_token, timeMax=timeMax,
                                                timeMin=timeMin).execute()
                page_token = events.get('nextPageToken')
                # ,
                if not page_token:
                    break
        except:
            pass
            # raise endpoints.UnauthorizedException('Invalid grant' )
        # filter this table
        events = Event.query().filter(Event.organization == user_from_email.organization,
                                      Event.starts_at >= calendar_feeds_start, Event.starts_at <= calendar_feeds_end)
        # filter this table .
        tasks = Task.query().filter(Task.organization == user_from_email.organization)
        feeds_results = []
        # , ,Task.due>=calendar_feeds_start,Task.due<=calendar_feeds_end
        try:
            for evtG in eventsG['items']:
                exists = False
                for evt in events:
                    if evtG['id'] == str(evt.event_google_id):
                        exists = True
                desc = ""
                if exists == False:
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
                        start = start + ".000000"
                        end = end + '.000000'
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
            # # datetime.combine(d, datetime.min.time())
            # evy=Event( owner = user_from_email.google_user_id,
            #     organization = user_from_email.organization,
            #     access = 'public',
            #     title = evtG['summary'],
            #     starts_at =datetime.datetime.strptime(start,"%Y-%m-%dT%H:%M:00.000000"),
            #     ends_at = datetime.datetime.strptime(end,"%Y-%m-%dT%H:%M:00.000000"),
            #     description = desc,
            #     author = author,
            #     event_google_id=evtG['id'],
            #     allday="false")
            # evy.put()
            # print "------------------yeah baby------------------"
            # print evtG
            # print "---------------------------------------------"
        # get the new list of events.

        for event in events:
            start_event = event.starts_at.isoformat()
            end_event = event.ends_at.isoformat()
            description = event.description
            title = event.title
            for evtG in eventsG['items']:
                if evtG['id'] == str(event.event_google_id):
                    print "**********yes i am in**************"
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

                        start_event = start_event + ".000000"
                        end_event = end_event + '.000000'

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
                    if diff.days >= 0 and diff.days <= 2:
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
                if task.due != None:
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
        print request.entityKey
        response = linked_in.get_company(request.entityKey)
        return response

    # arezki lebdiri 27/08/2014
    @endpoints.method(LinkedinListRequestDB, LinkedinListResponseDB,
                      path='linkedin/list_db', http_method='POST',
                      name='linkedin.list_db')
    def linkedin_list_db(self, request):
        if request.limit:
            limit = request.limit
        else:
            limit = 20
        if request.page:
            page = request.page
        else:
            page = 0
        skip = page * limit
        more = False
        params = {
            "query": {
                "multi_match": {
                    "query": request.keyword,
                    "fields": [
                        "fullname",
                        "locality",
                        "title"
                    ],
                    "tie_breaker": 0.5,
                    "minimum_should_match": "30%"
                }
            },
            "highlight": {
                "fields": {
                    "title": {},
                    "summary": {},
                    "experiences": {},
                    "fullname": {},
                    "locality": {}
                }
            }

        }
        params = json.dumps(params)

        r = requests.post(
            "http://104.154.66.240:9200/linkedin/profile/_search?size=" + str(limit) + "&from=" + str(skip),
            data=params)
        # r= requests.post("http://localhost:9200/linkedin/profile/_search?size="+str(limit)+"&from="+str(skip),data=params)
        results = r.json()
        total = results["hits"]["total"]
        if ((page + 1) * limit < total): more = True
        exist = requests.get("http://104.154.66.240:9200/linkedin/keywords/" + request.keyword)
        # exist = requests.get("http://localhost:9200/linkedin/keywords/"+request.keyword)

        return LinkedinListResponseDB(more=more, results=r.text, KW_exist=exist.json()["found"])

    @endpoints.method(LinkedinListRequestDB, LinkedinInsertResponseKW,
                      path='linkedin/insert_kw', http_method='POST',
                      name='linkedin.insert_kw')
    def linkedin_insert_kw(self, request):
        Bool = False
        message = ""
        exist = requests.get("http://104.154.66.240:9200/linkedin/keywords/" + request.keyword)
        # exist = requests.get("http://localhost:9200/linkedin/keywords/"+request.keyword)
        results = exist.json()
        print results

        print results["found"]
        if results["found"]:
            Bool = True
            message = "keyword exist"
        else:
            data = {
                "keyword": str(request.keyword)
            }
            data = json.dumps(data)
            insert = requests.put("http://104.154.66.240:9200/linkedin/keywords/" + request.keyword, data=data)
            # insert= requests.put("http://localhost:9200/linkedin/keywords/"+request.keyword,data=data)
            message = "keyword inserted"
        # print results
        return LinkedinInsertResponseKW(exist=Bool, message=message)

    @endpoints.method(LinkedinInsertRequest, LinkedinInsertResponse,
                      path='linkedin/startSpider', http_method='POST',
                      name='linkedin.startSpider')
    def linkedin_startSpider(self, request):
        r = requests.post("http://104.154.81.17:6800/schedule.json",  #
                          params={
                              "project": "linkedin",
                              "spider": "Linkedin",
                              "keyword": request.keyword
                          })
        data = {
            "keyword": str(request.keyword)
        }
        data = json.dumps(data)
        insert = requests.put("http://104.154.66.240:9200/linkedin/keywords/" + request.keyword, data=data)
        # insert= requests.put("http://localhost:9200/linkedin/keywords/"+request.keyword,data=data)
        print "############################################################################################"
        return LinkedinInsertResponse(results=r.text)

    @endpoints.method(spiderStateRequest, spiderStateResponse,
                      path='linkedin/spiderState', http_method='POST',
                      name='linkedin.spiderState')
    def linkedin_spiderState(self, request):
        r = requests.get("http://104.154.81.17:6800/listjobs.json",  #
                         # r= requests.get("http://localhost:6800/listjobs.json", #
                         params={
                             "project": "linkedin"
                         })
        state = False
        running = r.json()["running"]
        for job in running:
            if request.jobId == job["id"]:
                state = True
                break
        return spiderStateResponse(state=state)

    # arezki lebdiri 27/08/2014
    @endpoints.method(LinkedinProfileRequestSchema, LinkedinProfileSchema,
                      path='people/get', http_method='POST',
                      name='people.get')
    def linkedin_get(self, request):
        empty_string = lambda x: x if x else ""
        linkedin = linked_in()
        response = None
        pro = linkedin.scrape_linkedin_url(request.url)
        if (pro):
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
        # linkedin=linked_in()
        # screen_name=linkedin.scrap_twitter("Meziane","Hadjadj")
        linkedin = linked_in()
        screen_name = request.url
        print screen_name
        name = screen_name[screen_name.find("twitter.com/") + 12:]
        print name
        profile_schema = EndpointsHelper.twitter_import_people(name)
        return profile_schema

    # arezki lebdiri 15/07/2014
    @endpoints.method(LinkedinProfileRequest, LinkedinProfileSchema,
                      path='people/linkedinProfileV2', http_method='POST',
                      name='people.getLinkedinV2')
    def get_people_linkedinV2(self, request):
        empty_string = lambda x: x if x else ""
        linkedin = linked_in()
        keyword = empty_string(request.firstname) + " " + empty_string(request.lastname) + " " + empty_string(
                request.title)+ " " + empty_string(request.company)
        pro = linkedin.scrape_linkedin(keyword)
        response = LinkedinProfileSchema()
        if (pro):
            if linkedin.dice_coefficient(keyword, pro["full-name"]) >= 0.5:
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
                    resume=pro["resume"],
                    certifications=json.dumps(pro["certifications"]),
                    skills=pro["skills"],
                    profile_picture=pro['profile_picture']
                )

        return response

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

    # lead reporting api
    @endpoints.method(ReportingRequest, ReportingListResponse,
                      path='reporting/leads', http_method='POST',
                      name='reporting.leads')
    def lead_reporting(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        list_of_reports = []
        gid = request.user_google_id
        gname = request.google_display_name
        source = request.source
        status = request.status
        organization = request.organization_id
        created_at = ''
        group_by = request.group_by
        srcs = [None, 'Gmail', 'Gmail sync', 'LinkedIn', 'Twitter', 'ioGrow Live', 'Social Media', 'Web Site',
                'Phone Inquiry', 'Partner Referral', 'Purchased List', 'Other']

        if organization:
            organization_key = ndb.Key(Organization, int(organization))

        item_schema = ReportingResponseSchema()

        # if the user input google_user_id

        item_schema = None
        reporting = []
        if gid != None and gid != '':
            list_of_reports = []
            users = User.query(User.google_user_id == gid).fetch(1)
            if users:
                gname = users[0].google_display_name
                gmail = users[0].email
                created_at = users[0].created_at

            if not organization:
                organization_key = User.query(User.google_user_id == gid).fetch(1)[0].organization
                organization = ndb.Key.id(organization_key)

            if status != None and status != '' and source != None and source != '':
                leads = Lead.query(Lead.owner == gid, Lead.status == status, Lead.source == source).fetch()

            elif source != None and source != '':
                leads = Lead.query(Lead.owner == gid, Lead.source == source).fetch()

            elif status != None and status != '':
                leads = Lead.query(Lead.owner == gid, Lead.status == status).fetch()
            elif group_by:
                if group_by == 'status':

                    stts = Leadstatus.query(Leadstatus.organization == organization_key).fetch()
                    for stt in stts:
                        leads = Lead.query(Lead.organization == organization_key, Lead.status == stt.status).fetch()
                        list_of_reports.append((gid, gname, gmail, stt.status, len(leads), str(organization)))


                elif group_by == 'source':
                    for src in srcs:
                        leads = Lead.query(Lead.organization == organization_key, Lead.source == src).fetch()
                        list_of_reports.append((gid, gname, gmail, src, len(leads), str(organization)))


            else:
                leads = Lead.query(Lead.owner == gid).fetch()
            if not group_by:
                list_of_reports.append((gid, gname, len(leads), created_at))
                item_schema = ReportingResponseSchema(user_google_id=list_of_reports[0][0],
                                                      google_display_name=list_of_reports[0][1],
                                                      count=list_of_reports[0][2])

                reporting.append(item_schema)
                return ReportingListResponse(items=reporting)
            else:
                if group_by == 'status':

                    for item in list_of_reports:
                        item_schema = ReportingResponseSchema(user_google_id=item[0], google_display_name=item[1],
                                                              email=item[2], status=item[3], count=item[4],
                                                              organization_id=item[5])
                        reporting.append(item_schema)
                    return ReportingListResponse(items=reporting)
                if group_by == 'source':

                    for item in list_of_reports:
                        item_schema = ReportingResponseSchema(user_google_id=item[0], google_display_name=item[1],
                                                              email=item[2], source=item[3], count=item[4],
                                                              organization_id=item[5])
                        reporting.append(item_schema)
                    return ReportingListResponse(items=reporting)



        # if the user input name of user
        elif gname != None and gname != '':
            list_of_reports = []
            users = User.query(User.google_display_name == gname).fetch()
            if organization:
                organization_key = ndb.Key(Organization, int(organization))
                users = User.query(User.google_user_id == gid, User.organization == organization_key).fetch(1)

            for user in users:
                gid = user.google_user_id
                leads = Lead.query(Lead.owner == gid).fetch()
                gname = user.google_display_name
                gmail = user.email
                org_id = ndb.Key.id(user.organization)
                org_id = str(org_id)
                created_at = user.created_at
                list_of_reports.append((gid, gname, gmail, len(leads), created_at, org_id))

            reporting = []

            for item in list_of_reports:
                item_schema = ReportingResponseSchema(user_google_id=item[0], google_display_name=item[1],
                                                      email=item[2], count=item[3], created_at=item[4],
                                                      organization_id=item[5])
                reporting.append(item_schema)
            return ReportingListResponse(items=reporting)

        # if the user not input any think
        else:
            list_of_reports = []
            users = User.query().fetch()
            reporting = []
            if organization:
                organization_key = ndb.Key(Organization, int(organization))
                total_leads = len(Lead.query(Lead.organization == organization_key).fetch())
                if not group_by:
                    users = User.query(User.organization == organization_key).fetch()

                if not users:
                    users = User.query().fetch()
                if group_by:
                    if group_by == 'status':

                        stts = Leadstatus.query(Leadstatus.organization == organization_key).fetch()
                        for stt in stts:
                            leads = Lead.query(Lead.organization == organization_key, Lead.status == stt.status).fetch()
                            list_of_reports.append((stt.status, len(leads), str(organization), total_leads))


                    elif group_by == 'source':
                        for src in srcs:
                            leads = Lead.query(Lead.organization == organization_key, Lead.source == src).fetch()
                            list_of_reports.append((src, len(leads), str(organization), total_leads))

            if not group_by:

                for user in users:

                    gid = user.google_user_id
                    gname = user.google_display_name
                    org_id = ndb.Key.id(user.organization)
                    created_at = user.created_at
                    if not organization:
                        organization_key = User.query(User.google_user_id == gid).fetch(1)[0].organization

                        total_leads = len(Lead.query(Lead.organization == organization_key).fetch())

                    if status != None and status != '' and source != None and source != '':
                        leads = Lead.query(Lead.owner == gid, Lead.status == status, Lead.source == source).fetch()

                    elif source != None and source != '':
                        leads = Lead.query(Lead.owner == gid, Lead.source == source).fetch()

                    elif status != None and status != '':
                        leads = Lead.query(Lead.owner == gid, Lead.status == status).fetch()

                    else:
                        leads = Lead.query(Lead.owner == gid).fetch()

                    list_of_reports.append((gid, gname, len(leads), created_at, str(org_id), total_leads))

                list_of_reports.sort(key=itemgetter(2), reverse=True)

                for item in list_of_reports:
                    item_schema = ReportingResponseSchema(user_google_id=item[0], google_display_name=item[1],
                                                          count=item[2], organization_id=item[4], Total=item[5])
                    reporting.append(item_schema)
                return ReportingListResponse(items=reporting)
            else:
                if group_by == 'status':

                    for item in list_of_reports:
                        item_schema = ReportingResponseSchema(status=item[0], count=item[1], organization_id=item[2],
                                                              Total=item[3])
                        reporting.append(item_schema)
                    return ReportingListResponse(items=reporting)
                if group_by == 'source':

                    for item in list_of_reports:
                        item_schema = ReportingResponseSchema(source=item[0], count=item[1], organization_id=item[2],
                                                              Total=item[3])
                        reporting.append(item_schema)
                    return ReportingListResponse(items=reporting)




                    # opportunities reporting api

    @endpoints.method(ReportingRequest, ReportingListResponse,
                      path='reporting/opportunities', http_method='POST',
                      name='reporting.opportunities')
    def opportunities_reporting(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        list_of_reports = []
        gid = request.user_google_id
        gname = request.google_display_name
        stage = request.stage
        created_at = ''
        organization = request.organization_id
        item_schema = ReportingResponseSchema()
        group_by = request.group_by
        if organization:
            organization_key = ndb.Key(Organization, int(organization))

        # if the user input google_user_id
        reporting = []
        if gid != None and gid != '':
            list_of_reports = []
            users = User.query(User.google_user_id == gid).fetch(1)
            if users:
                gname = users[0].google_display_name
                gmail = users[0].email
                created_at = users[0].created_at

            opportunities = []
            if group_by:
                if not organization:
                    organization_key = User.query(User.google_user_id == gid).fetch(1)[0].organization
                    organization = ndb.Key.id(organization_key)

                if group_by == 'stage':
                    stages = Opportunitystage.query(Opportunitystage.organization == organization_key).fetch()
                    for stage in stages:
                        opportunitystage_key = ndb.Key(Opportunitystage, int(stage.id))
                        edges = Edge.query(Edge.kind == 'related_opportunities',
                                           Edge.start_node == opportunitystage_key).fetch()
                        amount = 0
                        for edge in edges:
                            opportunity_key = edge.end_node
                            opportunitie = Opportunity.get_by_id(ndb.Key.id(opportunity_key))
                            if opportunitie.owner == gid:
                                opportunities.append(opportunitie)
                                amount += opportunitie.amount_total
                        list_of_reports.append((gname, stage.name, len(opportunities), str(organization), amount))


            elif stage != None and stage != '':
                stages = Opportunitystage.query(Opportunitystage.organization == users[0].organization,
                                                Opportunitystage.name == stage).fetch()
                if stages:
                    opportunitystage_key = ndb.Key(Opportunitystage, int(stages[0].id))
                    edges = Edge.query(Edge.kind == 'related_opportunities', Edge.start_node == opportunitystage_key)
                    amount = 0
                    for edge in edges:
                        opportunity_key = edge.end_node
                        opportunitie = Opportunity.get_by_id(ndb.Key.id(opportunity_key))
                        if opportunitie.owner == gid:
                            opportunities.append(opportunitie)

                        amount += opportunitie.amount_total


                else:
                    amount = 0
                    opportunities = Opportunity.query(Opportunity.owner == gid).fetch()
                    for opportunity in opportunities:
                        amount += opportunity.amount_total

            else:

                amount = 0
                opportunities = Opportunity.query(Opportunity.owner == gid).fetch()
                for opportunity in opportunities:
                    amount += opportunity.amount_total

            if not group_by:
                list_of_reports.append((gid, gname, len(opportunities), created_at, amount))
                item_schema = ReportingResponseSchema(user_google_id=list_of_reports[0][0],
                                                      google_display_name=list_of_reports[0][1],
                                                      count=list_of_reports[0][2], amount=amount)

                reporting.append(item_schema)
                return ReportingListResponse(items=reporting)
            else:
                if group_by == 'stage':
                    for item in list_of_reports:
                        item_schema = ReportingResponseSchema(google_display_name=item[0], stage=item[1], count=item[2],
                                                              organization_id=item[3], amount=item[4])
                        reporting.append(item_schema)
                    return ReportingListResponse(items=reporting)



        # if the user input name of user
        elif gname != None and gname != '':
            list_of_reports = []
            users = User.query(User.google_display_name == gname).fetch()
            if organization:
                organization_key = ndb.Key(Organization, int(organization))
                users = User.query(User.google_display_name == gname, User.organzation == organization_key).fetch()

            for user in users:
                gid = user.google_user_id
                opportunities = Opportunity.query(Opportunity.owner == gid).fetch()
                gname = user.google_display_name
                gmail = user.email
                organization_id = user.organization
                if stage:
                    stages = Opportunitystage.query(Opportunitystage.organization == user.organization,
                                                    Opportunitystage.name == stage).fetch()

                    if stages:
                        opportunitystage_key = ndb.Key(Opportunitystage, int(stages[0].id))
                        edges = Edge.query(Edge.kind == 'related_opportunities',
                                           Edge.start_node == opportunitystage_key).fetch()
                        amount = 0
                        for edge in edges:
                            opportunity_key = edge.end_node
                            opportunitie = Opportunity.get_by_id(ndb.Key.id(opportunity_key))
                            if opportunitie.owner == gid:
                                opportunities.append(opportunitie)

                            amount += opportunitie.amount_total

                created_at = user.created_at
                list_of_reports.append((gid, gname, gmail, len(opportunities), created_at, organization, amount))

            reporting = []

            for item in list_of_reports:
                item_schema = ReportingResponseSchema(user_google_id=item[0], google_display_name=item[1],
                                                      email=item[2], count=item[3], organization_id=item[4],
                                                      amount=item[5])
                reporting.append(item_schema)
            return ReportingListResponse(items=reporting)

        # if the user not input any think
        else:
            reporting = []
            list_of_reports = []
            users = User.query().fetch()
            if organization:
                organization_key = ndb.Key(Organization, int(organization))
                users = User.query(User.organization == organization_key).fetch()
                opportunities = Opportunity.query(Opportunity.organization == organization_key).fetch()
                totalopp = len(opportunities)
                totalamount = 0
                for opportunity in opportunities:
                    totalamount += opportunity.amount_total
                if not users:
                    users = User.query().fetch()
                if group_by:
                    if group_by == 'stage':
                        stages = Opportunitystage.query(Opportunitystage.organization == organization_key).fetch()
                        for stage in stages:
                            opportunitystage_key = ndb.Key(Opportunitystage, int(stage.id))
                            edges = Edge.query(Edge.kind == 'related_opportunities',
                                               Edge.start_node == opportunitystage_key).fetch()
                            amount = 0
                            for edge in edges:
                                opportunity_key = edge.end_node
                                opportunitie = Opportunity.get_by_id(ndb.Key.id(opportunity_key))
                                amount += opportunitie.amount_total
                            list_of_reports.append(
                                (stage.name, len(edges), str(organization), amount, totalamount, totalopp))

            if not group_by:
                for user in users:
                    gid = user.google_user_id
                    gname = user.google_display_name
                    opportunities = Opportunity.query(Opportunity.owner == gid).fetch()
                    created_at = user.created_at
                    org_id = user.organization
                    if not organization:
                        organization_key = User.query(User.google_user_id == gid).fetch(1)[0].organization
                        users = User.query(User.organization == organization_key).fetch()
                        opportunities = Opportunity.query(Opportunity.organization == organization_key).fetch()
                        totalopp = len(opportunities)
                        totalamount = 0
                        for opportunity in opportunities:
                            totalamount += opportunity.amount_total
                    if stage:
                        stages = Opportunitystage.query(Opportunitystage.organization == users[0].organization,
                                                        Opportunitystage.name == stage).fetch()
                        if stages:
                            opportunitystage_key = ndb.Key(Opportunitystage, int(stages[0].id))
                            edges = Edge.query(Edge.kind == 'related_opportunities',
                                               Edge.start_node == opportunitystage_key).fetch()
                            amount = 0
                            for edge in edges:
                                opportunity_key = edge.end_node
                                opportunitie = Opportunity.get_by_id(ndb.Key.id(opportunity_key))
                                if opportunitie.owner == gid:
                                    opportunities.append(opportunitie)
                                amount += opportunitie.amount_total
                            list_of_reports.append(
                                (gid, gname, len(edges), created_at, str(org_id), amount, totalamount, totalopp))
                        else:
                            amount = 0
                            opportunities = Opportunity.query(Opportunity.owner == gid).fetch()
                            for opportunity in opportunities:
                                amount += opportunity.amount_total

                    else:

                        amount = 0
                        opportunities = Opportunity.query(Opportunity.owner == gid).fetch()
                        for opportunity in opportunities:
                            amount += opportunity.amount_total

                        list_of_reports.append(
                            (
                                gid, gname, len(opportunities), created_at, str(org_id), amount, totalamount, totalopp))

                list_of_reports.sort(key=itemgetter(2), reverse=True)

                for item in list_of_reports:
                    item_schema = ReportingResponseSchema(user_google_id=item[0], google_display_name=item[1],
                                                          count=item[2], organization_id=item[4], amount=item[5],
                                                          Total_amount=item[6], Total=item[7])
                    reporting.append(item_schema)
                return ReportingListResponse(items=reporting)
            else:
                if group_by == 'stage':
                    for item in list_of_reports:
                        item_schema = ReportingResponseSchema(stage=item[0], count=item[1], organization_id=item[2],
                                                              amount=item[3], Total_amount=item[4], Total=item[5])
                        reporting.append(item_schema)
                    return ReportingListResponse(items=reporting)

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
        r = requests.post("http://104.154.83.131:8080/api/export_contact",
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
        r = requests.post("http://104.154.83.131:8080/api/export_contact_by_key", data=json.dumps(params),
                          headers={'content-type': 'application/json'})
        return message_types.VoidMessage()

    # lead contact api
    @endpoints.method(ReportingRequest, ReportingListResponse,
                      path='reporting/contacts', http_method='POST',
                      name='reporting.contacts')
    def contact_reporting(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        list_of_reports = []
        gid = request.user_google_id
        gname = request.google_display_name
        created_at = ''
        item_schema = ReportingResponseSchema()
        # if the user input google_user_id
        if gid != None and gid != '':
            list_of_reports = []
            contacts = Contact.query(Lead.owner == gid).fetch()
            users = User.query(User.google_user_id == gid).fetch()
            if users != []:
                gname = users[0].google_display_name
                created_at = users[0].created_at
                list_of_reports.append((gid, gname, len(contacts), created_at))
                item_schema = ReportingResponseSchema(user_google_id=list_of_reports[0][0],
                                                      google_display_name=list_of_reports[0][1],
                                                      count=list_of_reports[0][2])
            reporting = []
            reporting.append(item_schema)
            return ReportingListResponse(items=reporting)

        # if the user input name of user
        elif gname != None and gname != '':
            list_of_reports = []
            users = User.query(User.google_display_name == gname).fetch()
            for user in users:
                gid = user.google_user_id
                contacts = Contact.query(Contact.owner == gid).fetch()
                gname = user.google_display_name
                gmail = user.email
                created_at = user.created_at
                list_of_reports.append((gid, gname, gmail, len(contacts), created_at))

            reporting = []

            for item in list_of_reports:
                item_schema = ReportingResponseSchema(user_google_id=item[0], google_display_name=item[1],
                                                      email=item[2], count=item[3])
                reporting.append(item_schema)
            return ReportingListResponse(items=reporting)

        # if the user input google_user_id
        else:
            users = User.query().fetch()
            list_of_reports = []
            for user in users:
                gid = user.google_user_id
                gname = user.google_display_name
                created_at = user.created_at
                contacts = Contact.query(Contact.owner == gid).fetch()
                list_of_reports.append((gid, gname, len(contacts), created_at))
            list_of_reports.sort(key=itemgetter(2), reverse=True)
            reporting = []
            for item in list_of_reports:
                item_schema = ReportingResponseSchema(user_google_id=item[0], google_display_name=item[1],
                                                      count=item[2])
                reporting.append(item_schema)
            return ReportingListResponse(items=reporting)

            # account reporting api

    @endpoints.method(ReportingRequest, ReportingListResponse,
                      path='reporting/accounts', http_method='POST',
                      name='reporting.accounts')
    def account_reporting(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        list_of_reports = []
        gid = request.user_google_id
        gname = request.google_display_name
        created_at = ''
        item_schema = ReportingResponseSchema()
        # if the user input google_user_id
        if gid != None and gid != '':
            list_of_reports = []
            accounts = Account.query(Account.owner == gid).fetch()
            users = User.query(User.google_user_id == gid).fetch()
            if users != []:
                gname = users[0].google_display_name
                created_at = users[0].created_at
                list_of_reports.append((gid, gname, len(accounts), created_at))
                item_schema = ReportingResponseSchema(user_google_id=list_of_reports[0][0],
                                                      google_display_name=list_of_reports[0][1],
                                                      count=list_of_reports[0][2])

            reporting = []
            reporting.append(item_schema)
            return ReportingListResponse(items=reporting)

        # if the user input name of user
        elif gname != None and gname != '':
            list_of_reports = []
            users = User.query(User.google_display_name == gname).fetch()
            for user in users:
                gid = user.google_user_id
                accounts = Account.query(Account.owner == gid).fetch()
                gname = user.google_display_name
                gmail = user.email
                created_at = user.created_at
                list_of_reports.append((gid, gname, gmail, len(accounts), created_at))

            reporting = []

            for item in list_of_reports:
                item_schema = ReportingResponseSchema(user_google_id=item[0], google_display_name=item[1],
                                                      email=item[2], count=item[3])
                reporting.append(item_schema)
            return ReportingListResponse(items=reporting)

        else:
            users = User.query().fetch()
            list_of_reports = []
            for user in users:
                gid = user.google_user_id
                gname = user.google_display_name
                accounts = Account.query(Account.owner == gid).fetch()
                created_at = user.created_at
                list_of_reports.append((gid, gname, len(accounts), created_at))

            list_of_reports.sort(key=itemgetter(2), reverse=True)
            reporting = []
            for item in list_of_reports:
                item_schema = ReportingResponseSchema(user_google_id=item[0], google_display_name=item[1],
                                                      count=item[2])
                reporting.append(item_schema)
            return ReportingListResponse(items=reporting)

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

    @endpoints.method(ReportingRequest, ReportingListResponse,
                      path='reporting/tasks', http_method='POST',
                      name='reporting.tasks')
    def task_reporting(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        list_of_reports = []
        gid = request.user_google_id
        gname = request.google_display_name
        created_at = ''
        item_schema = ReportingResponseSchema()
        # if the user input google_user_id
        if gid != None and gid != '':
            list_of_reports = []
            tasks = Task.query(Task.owner == gid).fetch()
            users = User.query(User.google_user_id == gid).fetch()
            if users != []:
                gname = users[0].google_display_name
                created_at = users[0].created_at
                list_of_reports.append((gid, gname, len(tasks), created_at))
                item_schema = ReportingResponseSchema(user_google_id=list_of_reports[0][0],
                                                      google_display_name=list_of_reports[0][1],
                                                      count=list_of_reports[0][2])
            reporting = []
            reporting.append(item_schema)
            return ReportingListResponse(items=reporting)

        # if the user input name of user
        elif gname != None and gname != '':
            list_of_reports = []
            users = User.query(User.google_display_name == gname).fetch()
            for user in users:
                gid = user.google_user_id
                tasks = Task.query(Task.owner == gid).fetch()
                gname = user.google_display_name
                gmail = user.email
                created_at = user.created_at
                list_of_reports.append((gid, gname, gmail, len(tasks), created_at))

            reporting = []
            for item in list_of_reports:
                item_schema = ReportingResponseSchema(user_google_id=item[0], google_display_name=item[1],
                                                      email=item[2], count=item[3])
                reporting.append(item_schema)
            return ReportingListResponse(items=reporting)

        # if the user input google_user_id
        else:
            users = User.query().fetch()
            list_of_reports = []
            for user in users:
                gid = user.google_user_id
                gname = user.google_display_name
                tasks = Task.query(Task.owner == gid).fetch()
                created_at = user.created_at
                list_of_reports.append((gid, gname, len(tasks), created_at))

            list_of_reports.sort(key=itemgetter(2), reverse=True)
            reporting = []
            for item in list_of_reports:
                item_schema = ReportingResponseSchema(user_google_id=item[0], google_display_name=item[1],
                                                      count=item[2])
                reporting.append(item_schema)

            return ReportingListResponse(items=reporting)
            # weekly Growth rate reporting api

    @endpoints.method(ReportingRequest, ReportingListResponse,
                      path='reporting/growth', http_method='POST',
                      name='reporting.growth')
    def growth_reporting(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        reporting = []
        query_user_date2 = User.query().fetch()
        nbr_users = len(query_user_date2)
        nb_days = request.nb_days
        if nb_days:
            query_user_date1 = User.query(User.created_at <= datetime.datetime.now() - timedelta(days=nb_days)).fetch()
        query_user_date1 = User.query(User.created_at <= datetime.datetime.now() - timedelta(days=7)).fetch()
        nb_user_date2 = len(query_user_date2)
        nb_user_date1 = len(query_user_date1)
        Growthnb = nb_user_date2 - nb_user_date1
        Growthrate = round(Growthnb / (nb_user_date1 + 1), 4) * 100
        item_schema = ReportingResponseSchema(nb_users=nbr_users, Growth_nb=Growthnb,
                                              Growth_rate=str(Growthrate) + ' %')
        reporting.append(item_schema)
        return ReportingListResponse(items=reporting)

    # summary activity reporting api
    @endpoints.method(ReportingRequest, ReportingListResponse,
                      path='reporting/summary', http_method='POST',
                      name='reporting.summary')
    def summary_reporting(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        list_of_reports = []
        orgName = request.organizationName
        gid = request.user_google_id
        gname = request.google_display_name
        orgName = request.organizationName
        created_at = ''
        item_schema = ReportingResponseSchema()
        # if the user input google_user_id
        if gid != None and gid != '':
            list_of_reports = []
            tasks = Task.query(Task.owner == gid).fetch()
            accounts = Account.query(Account.owner == gid).fetch()
            leads = Lead.query(Lead.owner == gid).fetch()
            contacts = Contact.query(Contact.owner == gid).fetch()
            users = User.query(User.google_user_id == gid).fetch()
            if users != []:
                gname = users[0].google_display_name
                gmail = users[0].email
                created_at = users[0].created_at
                list_of_reports.append(
                    (gid, gname, gmail, len(accounts), len(contacts), len(leads), len(tasks), created_at))
                item_schema = ReportingResponseSchema(user_google_id=list_of_reports[0][0],
                                                      google_display_name=list_of_reports[0][1],
                                                      email=list_of_reports[0][2], count_account=list_of_reports[0][3],
                                                      count_contacts=list_of_reports[0][4],
                                                      count_leads=list_of_reports[0][5],
                                                      count_tasks=list_of_reports[0][6])
            reporting = []
            reporting.append(item_schema)
            return ReportingListResponse(items=reporting)

        # if the user input name of user
        elif gname != None and gname != '':
            list_of_reports = []
            users = User.query(User.google_display_name == gname).fetch()
            for user in users:
                gid = user.google_user_id
                tasks = Task.query(Task.owner == gid).fetch()
                accounts = Account.query(Account.owner == gid).fetch()
                leads = Lead.query(Lead.owner == gid).fetch()
                contacts = Contact.query(Contact.owner == gid).fetch()
                gname = user.google_display_name
                gmail = user.email
                created_at = user.created_at
                list_of_reports.append(
                    (gid, gname, gmail, len(accounts), len(contacts), len(leads), len(tasks), created_at))

            reporting = []
            for item in list_of_reports:
                item_schema = ReportingResponseSchema(user_google_id=item[0], google_display_name=item[1],
                                                      email=item[2], count_account=item[3], count_contacts=item[4],
                                                      count_leads=item[5], count_tasks=item[6])
                reporting.append(item_schema)
            return ReportingListResponse(items=reporting)

            # show all users and their activity of an organization with the inpute of the name of the organization
        elif orgName != None and orgName != '':
            list_of_reports = []
            organzation = Organization.query(Organization.name == orgName).fetch()
            if organzation:
                for org in organzation:
                    users = User.query(User.organization == org.key).fetch()

                for user in users:
                    gid = user.google_user_id
                    tasks = Task.query(Task.owner == gid).fetch()
                    accounts = Account.query(Account.owner == gid).fetch()
                    leads = Lead.query(Lead.owner == gid).fetch()
                    contacts = Contact.query(Contact.owner == gid).fetch()
                    gname = user.google_display_name
                    created_at = user.created_at
                    updated_at = user.updated_at
                    organization = user.organization
                    opportunities = Opportunity.query(Opportunity.owner == gid).fetch()
                    gmail = user.email
                    created_at = user.created_at
                    list_of_reports.append((gid, gname, gmail, orgName, len(accounts), len(contacts), len(leads),
                                            len(tasks), len(opportunities), created_at, updated_at))

            reporting = []
            for item in list_of_reports:
                item_schema = ReportingResponseSchema(user_google_id=item[0], google_display_name=item[1],
                                                      email=item[2], organizationName=item[3], count_account=item[4],
                                                      count_contacts=item[5], count_leads=item[6], count_tasks=item[7],
                                                      count_opporutnities=item[8], created_at=str(item[9]),
                                                      updated_at=str(item[10]))
                reporting.append(item_schema)
            return ReportingListResponse(items=reporting)


            # show all users and their activity of an organization with the inpute of the name of the organization
        elif orgName != None and orgName != '':
            list_of_reports = []
            organzation = Organization.query(Organization.name == orgName).fetch()
            if organzation:
                for org in organzation:
                    users = User.query(User.organization == org.key).fetch()

                for user in users:
                    gid = user.google_user_id
                    tasks = Task.query(Task.owner == gid).fetch()
                    accounts = Account.query(Account.owner == gid).fetch()
                    leads = Lead.query(Lead.owner == gid).fetch()
                    contacts = Contact.query(Contact.owner == gid).fetch()
                    gname = user.google_display_name
                    created_at = user.created_at
                    updated_at = user.updated_at
                    organization = user.organization
                    opportunities = Opportunity.query(Opportunity.owner == gid).fetch()
                    gmail = user.email
                    created_at = user.created_at
                    list_of_reports.append((gid, gname, gmail, orgName, len(accounts), len(contacts), len(leads),
                                            len(tasks), len(opportunities), created_at, updated_at))

            reporting = []
            for item in list_of_reports:
                item_schema = ReportingResponseSchema(user_google_id=item[0], google_display_name=item[1],
                                                      email=item[2], organizationName=item[3], count_account=item[4],
                                                      count_contacts=item[5], count_leads=item[6], count_tasks=item[7],
                                                      count_opporutnities=item[8], created_at=str(item[9]),
                                                      updated_at=str(item[10]))
                reporting.append(item_schema)
            return ReportingListResponse(items=reporting)


            # if the user input google_user_id
        else:
            sorted_by = request.sorted_by
            users = User.query().order(-User.updated_at).fetch(300)
            if sorted_by == 'created_at':
                users = User.query().order(-User.created_at)

            list_of_reports = []
            for user in users:
                gid = user.google_user_id
                gname = user.google_display_name
                tasks = Task.query(Task.owner == gid).fetch()
                accounts = Account.query(Account.owner == gid).fetch()
                leads = Lead.query(Lead.owner == gid).fetch()
                opportunities = Opportunity.query(Opportunity.owner == gid).fetch()
                contacts = Contact.query(Contact.owner == gid).fetch()
                created_at = user.created_at
                updated_at = user.updated_at
                gmail = user.email
                organization = user.organization
                orgName = ''
                if organization:
                    orgName = organization.get().name
                list_of_reports.append((
                    gid, gname, gmail, orgName, len(accounts), len(contacts), len(leads), len(tasks),
                    len(opportunities), created_at, updated_at))

            if sorted_by == 'accounts':
                list_of_reports.sort(key=itemgetter(3), reverse=True)
            elif sorted_by == 'contacts':
                list_of_reports.sort(key=itemgetter(4), reverse=True)
            elif sorted_by == 'leads':
                list_of_reports.sort(key=itemgetter(5), reverse=True)
            elif sorted_by == 'tasks':
                list_of_reports.sort(key=itemgetter(6), reverse=True)
            # elif sorted_by=='created_at':
            #   list_of_reports.sort(key=itemgetter(7),reverse=True)
            # else:
            #    list_of_reports.sort(key=itemgetter(4),reverse=True)
            reporting = []
            for item in list_of_reports:
                item_schema = ReportingResponseSchema(user_google_id=item[0], google_display_name=item[1],
                                                      email=item[2], organizationName=item[3], count_account=item[4],
                                                      count_contacts=item[5], count_leads=item[6], count_tasks=item[7],
                                                      count_opporutnities=item[8], created_at=str(item[9]),
                                                      updated_at=str(item[10]))
                reporting.append(item_schema)

            return ReportingListResponse(items=reporting)

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

    # users.upgrade api v2
    @endpoints.method(message_types.VoidMessage, message_types.VoidMessage,
                      path='users/upgrade_early_birds', http_method='POST',
                      name='users.upgrade_early_birds')
    def upgrade_early_birds_to_business(self, request):
        users = User.query(User.type == 'early_bird').fetch(20)
        for user in users:
            Organization.upgrade_to_business_version(user.organization)
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

    @endpoints.method(KewordsRequest, tweetsResponse,
                      path='twitter/get_recent_tweets', http_method='POST',
                      name='twitter.get_recent_tweets')
    def twitter_get_recent_tweets(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()

        print "tagggggglist22"
        print request, "reqqqqqqqqqqq"
        if len(request.value) == 0:
            tagss = Tag.list_by_kind(user_from_email, "topics")
            val = []
            for tag in tagss.items:
                val.append(tag.name)
            request.value = val
            print request, "iffffffff"
        list_of_tweets = EndpointsHelper.get_tweets(request.value, "recent")
        return tweetsResponse(items=list_of_tweets)

    # @endpoints.method(KewordsRequest, tweetsResponse,
    #                   path='twitter/get_best_tweets', http_method='POST',
    #                   name='twitter.get_best_tweets')
    # def twitter_get_best_tweets(self, request):
    #     print request
    #     user_from_email = EndpointsHelper.require_iogrow_user()
    #     val=[]
    #     tagss=Tag.list_by_kind(user_from_email,"topics")
    #     for tag in tagss.items:
    #         val.append(tag.name)
    #     print val
    #     list_of_tweets=EndpointsHelper.get_tweets(val,"popular")
    #     # print list_of_tweets
    #     #tweetsschema=tweetsSchema()

    #     return tweetsResponse(items=list_of_tweets)

    #     return profile_schema
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
        # hadji hicham 26/08/2014 .
        # sub=cust.subscriptions
        # print "*******************************************************************"
        # print sub[0]
        # cust.subscriptions.create(plan="iogrow_plan")

    @endpoints.method(KewordsRequest, iomessages.DiscoverResponseSchema, path='twitter/get_best_tweets',
                      http_method='POST',
                      name='twitter.get_best_tweets')
    def get_best_tweets(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        loca = []
        if len(request.value) == 0:
            tags = Tag.list_by_kind(user_from_email, "topics")
            request.value = [tag.name for tag in tags.items]

        if len(request.value) != 0:
            results = Discovery.get_best_tweets(request.value)
        else:
            results = "null"
        print results, "iooo"
        return iomessages.DiscoverResponseSchema(results=results, more=False)

    @endpoints.method(iomessages.DiscoverRequestSchema, iomessages.DiscoverResponseSchema,
                      path='twitter/get_map', http_method='POST',
                      name='twitter.get_map')
    def get_map(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        loca = []
        if len(request.keywords) == 0:
            tags = Tag.list_by_kind(user_from_email, "topics")
            request.keywords = [tag.name for tag in tags.items]

        if len(request.keywords) != 0:
            payload = {'keywords[]': request.keywords}
            r = requests.get(config_urls.nodeio_server + "/twitter/map/list", params=payload)
            results = json.dumps(r.json()["results"])
        else:
            results = "null"
            # print results,'rtrrrrr'
            # print request.items.location,"rrrrrrrrrrrrrr"
            # liste=Counter(request.items[0].location).items()

            # location= TwitterMapsSchema()
            # geolocator = GoogleV3()
            # for result in results:
            #     #try:
            #     location= TwitterMapsSchema()
            #     print "vvv",result["key"].encode('utf-8'),"valll"
            #     result["key"] = result["key"].replace('_', ' ')
            #     print "vvv2",str(result["key"]).encode('utf-8'),"valll2"
            #     latlong=geolocator.geocode(str(result["key"]).encode('utf-8'))

            #     #latlong=geolocator.geocode(str(val[0]).encode('utf-8'))
            #     location.latitude=str(latlong[1][0]).encode('utf-8')
            #     location.longitude=str(latlong[1][1]).encode('utf-8')
            #     location.location=str(result["key"]).encode('utf-8')
            #     location.number=str(result["doc_count"]).encode('utf-8')
            #     loca.append(location)
            # except:
            #     print "error codec"
        # return TwitterMapsResponse(items=loca)
        return iomessages.DiscoverResponseSchema(results=results, more=False)

    # get_tweets_details
    @endpoints.method(Tweet_id, TweetResponseSchema,
                      path='twitter/get_tweets_details', http_method='POST',
                      name='twitter.get_tweets_details')
    def get_tweets_details(self, request):
        idp = request.tweet_id
        print idp, "idp"
        payload = {'tweet_id': idp}

        r = requests.get(config_urls.nodeio_server + "/twitter/posts/tweet_details", params=payload)

        result = json.dumps(r.json()["results"])
        # return (json.dumps(r.json()["results"]),r.json()["more"])

        # url="http://104.154.37.127:8091/get_tweet?idp="+str(idp)
        # tweet=requests.get(url=url)
        # result=json.dumps(tweet.json())

        return TweetResponseSchema(results=result)

    # get_twitter_map_tweets
    @endpoints.method(iomessages.DiscoverRequestSchema, iomessages.DiscoverResponseSchema,
                      path='twitter/get_tweets_map', http_method='POST',
                      name='twitter.get_tweets_map')
    def get_tweets_map(self, request):
        print request.language
        user_from_email = EndpointsHelper.require_iogrow_user()
        if len(request.keywords) == 0:
            tags = Tag.list_by_kind(user_from_email, "topics")
            request.keywords = [tag.name for tag in tags.items]
        location = request.language

        if len(request.keywords) != 0:
            payload = {'keywords[]': request.keywords, 'location': location}
            r = requests.get(config_urls.nodeio_server + "/twitter/map/map_tweets", params=payload)
            # r.json()["more"]
            result = json.dumps(r.json()["results"])

        else:
            results = "null"

        return iomessages.DiscoverResponseSchema(results=result)

    # get_twitter_influencers
    @endpoints.method(iomessages.DiscoverRequestSchema, iomessages.DiscoverResponseSchema,
                      path='twitter/get_influencers_v2', http_method='POST',
                      name='twitter.get_influencers_v2')
    def get_influencers_v2(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        if len(request.keywords) == 0:
            tags = Tag.list_by_kind(user_from_email, "topics")
            request.keywords = [tag.name for tag in tags.items]
        language = request.language
        if request.language == 'all':
            language = ""

        if len(request.keywords) != 0:
            payload = {'keywords[]': request.keywords, 'page': request.page, 'language': language}
            r = requests.get(config_urls.nodeio_server + "/twitter/influencers/list", params=payload)
            # r.json()["more"]
            result = json.dumps(r.json()["results"])
            more = r.json()["more"]

        else:
            result = "null"
            more = False

        # #print idp,"idp"
        # url="http://104.154.37.127:8091/list_influencers?keyword="+str(keyword)
        # tweet=requests.get(url=url)
        # result=json.dumps(tweet.json())

        return iomessages.DiscoverResponseSchema(results=result, more=more)

    # store_tweets_
    @endpoints.method(KewordsRequest, message_types.VoidMessage,
                      path='twitter/store_tweets', http_method='POST',
                      name='twitter.store_tweets')
    def store_tweets(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        # something wrong here meziane
        if len(request.value) == 0:
            tagss = Tag.list_by_kind(user_from_email, "topics")
            val = []
            for tag in tagss.items:
                val.append(tag)
        else:
            tagss = Tag.list_by_kind(user_from_email, "topics")
            val = []
            for tag in tagss.items:
                print tag.name, "equalll", request.value
                if tag.name == request.value[0]:
                    val.append(tag)
                    # val=request.value
        Discovery.get_tweets(val, "recent")

        return message_types.VoidMessage()

    # get_tweets_from_datastore
    @endpoints.method(TwitterRequest, tweetsResponse,
                      path='twitter/get_tweets_from_datastore', http_method='POST',
                      name='twitter.get_tweets_from_datastore')
    def get_tweets_from_datastore(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        if len(request.value) == 0:
            tags = Tag.list_by_kind(user_from_email, "topics")
            topics = [tag.name for tag in tags.items]
        else:
            topics = request.value
        results = Discovery.list_tweets_from_datastore(topics, request.limit, request.pageToken)
        return tweetsResponse(
            items=results['items'],
            nextPageToken=results['next_curs'],
            is_crawling=results['is_crawling']
        )

        return tweetsResponse(items=list)

    @endpoints.method(KewordsRequest, ReportSchema,
                      path='reports/get', http_method='POST',
                      name='reports.get')
    def get_reports(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        return Reports.reportQuery(user_from_email=user_from_email)

    @endpoints.method(KewordsRequest, message_types.VoidMessage,
                      path='twitter/delete_topic', http_method='POST',
                      name='twitter.delete_topic')
    def delete_topic(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        # url="http://104.154.37.127:8091/delete_keyword?keyword="+str(request.value[0])+"&organization="+str(user_from_email.organization.id())
        # requests.get(url=url)
        organization = user_from_email.organization.id()
        payload = {'keyword': str(request.value[0]), 'organization': organization}
        r = requests.get(config_urls.nodeio_server + "/twitter/crawlers/delete", params=payload)
        return message_types.VoidMessage()

    # delete_tweets
    @endpoints.method(KewordsRequest, message_types.VoidMessage,
                      path='twitter/delete_tweets', http_method='POST',
                      name='twitter.delete_tweets')
    def delete_tweets(self, request):
        Discovery.delete_tweets_by_name(request.value)
        return message_types.VoidMessage()

    # store_best_tweets_
    @endpoints.method(KewordsRequest, message_types.VoidMessage,
                      path='twitter/store_best_tweets', http_method='POST',
                      name='twitter.store_best_tweets')
    def store_best_tweets(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        # something wrong here meziane
        if len(request.value) == 0:
            print "yesss"
            tagss = Tag.list_by_kind(user_from_email, "topics")
            val = []
            for tag in tagss.items:
                val.append(tag)
        else:
            tagss = Tag.list_by_kind(user_from_email, "topics")
            val = []
            for tag in tagss.items:
                print tag.name, "equalll", request.value
                if tag.name == request.value[0]:
                    val.append(tag)
                    # val=request.value
        print val, "valllll"
        Discovery.get_tweets(val, "popular")

        return message_types.VoidMessage()

    # store_best_tweets_
    @endpoints.method(Topic_Comparaison_Schema, TopicsResponse,
                      path='twitter/get_topics_from_freebase', http_method='POST',
                      name='twitter.get_topics_from_freebase')
    def get_topics_from_freebase(self, request):
        result = Discovery.related_topics_between_keywords_and_tweets(request.keyword, request.tweet)

        return TopicsResponse(items=result["items"], score_total=result["score_total"])

    # get_last_tweets
    @endpoints.method(KewordsRequest, message_types.VoidMessage,
                      path='twitter/get_last_tweets', http_method='POST',
                      name='twitter.get_last_tweets')
    def get_last_tweets(self, request):
        result = Discovery.get_lasts_tweets(request.value)
        print result, "rrrrrrr"

        return message_types.VoidMessage()

    # get_topics_of_person_tweets
    @endpoints.method(KewordsRequest, Topics_Schema,
                      path='twitter/get_topics_of_person', http_method='POST',
                      name='twitter.get_topics_of_person')
    def get_topics_of_person(self, request):
        # get topics from resume
        list_of_topics = []
        score_total = 0.0

        resume = Discovery.get_resume_from_twitter(request.value)
        # ddddd
        topics = Discovery.get_topics_of_tweet(resume)
        result = topics["items"]
        for ele in result:
            qry = TopicScoring.query(TopicScoring.topic == ele.topic, TopicScoring.screen_name == request.value[0])
            results = qry.fetch()
            if len(results) != 0:
                results[0].value = results[0].value + 40.0
                results[0].put()
                topics_schema = Scoring_Topics_Schema()
                topics_schema.topic = results[0].topic
                topics_schema.score = results[0].score
                topics_schema.value = results[0].value
            else:
                ele.value = 60.0
                ele.screen_name = request.value[0]
                topics_schema = Scoring_Topics_Schema()
                topics_schema.topic = ele.topic
                topics_schema.score = ele.score
                topics_schema.value = ele.value
                ele.put()
            list_of_topics.append(topics_schema)

        # get topics from tweets
        result = Discovery.get_lasts_tweets(request.value)
        for ele in result:
            topics = Discovery.get_topics_of_tweet(ele['text'].encode('utf-8'))
            result = topics["items"]
            for ele in result:
                qry = TopicScoring.query(TopicScoring.topic == ele.topic, TopicScoring.screen_name == request.value[0])
                results = qry.fetch()
                if len(results) != 0:
                    # print results,"rrrrrrrrrreeeee"
                    results[0].value = results[0].value + 30.0
                    results[0].put()
                    topics_schema = Scoring_Topics_Schema()
                    topics_schema.topic = results[0].topic
                    topics_schema.score = results[0].score
                    topics_schema.value = results[0].value
                    for ele in list_of_topics:
                        if ele.topic == results[0].topic:
                            ele.score = results[0].score
                            ele.value = results[0].value
                    results = []
                else:
                    ele.value = 10.0
                    ele.screen_name = request.value[0]
                    topics_schema = Scoring_Topics_Schema()
                    topics_schema.topic = ele.topic
                    topics_schema.score = ele.score
                    topics_schema.value = ele.value
                    ele.put()
                    list_of_topics.append(topics_schema)

        # get topics from topics
        qry = TopicScoring.query(TopicScoring.screen_name == request.value[0])
        resultt = qry.fetch()
        for res in resultt:
            topics = Discovery.get_topics_of_tweet(res.topic.encode('utf-8'))
            result = topics["items"]
            for ele in result:
                qry = TopicScoring.query(TopicScoring.topic == ele.topic, TopicScoring.screen_name == request.value[0])
                results = qry.fetch()
                if len(results) != 0:
                    print results, "they existtttttt"
                    results[0].value = results[0].value + 30.0
                    results[0].put()
                    topics_schema = Scoring_Topics_Schema()
                    topics_schema.topic = results[0].topic
                    topics_schema.score = results[0].score
                    topics_schema.value = results[0].value
                    for ele in list_of_topics:
                        if ele.topic == results[0].topic:
                            ele.score = results[0].score
                            ele.value = results[0].value
                    results = []
                """else:
                    ele.value=10.0
                    ele.screen_name=request.value[0]
                    topics_schema=Scoring_Topics_Schema()
                    topics_schema.topic=ele.topic
                    topics_schema.score=ele.score
                    topics_schema.value=ele.value
                    ele.put()
                    list_of_topics.append(topics_schema)"""

            score_total = score_total + topics["score_total"]
        list_of_topics.sort(key=lambda x: x.value, reverse=True)
        print "lengthhhhhhhhhhhhhhhhh", len(list_of_topics)
        return Topics_Schema(items=list_of_topics, score_total=score_total)

    # init the reports for all users
    @endpoints.method(KewordsRequest, message_types.VoidMessage,
                      path='reports/initreports', http_method='POST',
                      name='reports.init')
    def init_reports(self, request):
        Reports.init_reports()
        return message_types.VoidMessage()

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

    @endpoints.method(iomessages.DiscoverRequestSchema, iomessages.DiscoverResponseSchema,
                      path="discover/get_tweets",
                      http_method="POST",
                      name="discover.get_tweets")
    def get_tweets(self, request):

        language = request.language
        if request.language == 'all':
            language = ""
        print language
        user_from_email = EndpointsHelper.require_iogrow_user()
        print user_from_email.language + "lan"
        if len(request.keywords) == 0:
            tags = Tag.list_by_kind(user_from_email, "topics")
            request.keywords = [tag.name for tag in tags.items]
        print language, "lazzz"
        if len(request.keywords) != 0:
            results, more = Discovery.list_tweets_from_nodeio(request, language)

        else:
            results = "null"
            more = False

        return iomessages.DiscoverResponseSchema(results=results, more=more)

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
        organization = user_from_email.organization.get()
        if user_from_email.is_admin:
            for x in xrange(0, len(request.entityKeys)):
                userToDelete = ndb.Key(urlsafe=request.entityKeys[x]).get()
                if userToDelete.is_admin:
                    pass
                else:
                    ndb.Key(urlsafe=request.entityKeys[x]).delete()
                    # Invitation.delete_by(request.emails[x])
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

    @endpoints.method(purchaseRequest, purchaseResponse,
                      path="users/purchase_lisences", http_method="POST", name="users.purchase_lisences")
    def purchase_licenses(self, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        email = user_from_email.email
        organization = user_from_email.organization.get()
        now = datetime.datetime.now()
        days_before_expiring = organization.licenses_expires_on - now
        organization_plan = organization.plan.get()
        token = request.token
        amount_ch = 0
        payment_switch_status = "f_m"
        check_point = days_before_expiring.days + 1
        if request.nb_licenses:
            if check_point <= 0:
                if request.plan == "month":
                    new_plan = LicenseModel.query(LicenseModel.name == 'crm_monthly_online').fetch(1)
                    amount_ch = int(new_plan[0].price * int(request.nb_licenses) * 100)
                    payment_switch_status = "f_m"
                elif request.plan == "year":
                    new_plan = LicenseModel.query(LicenseModel.name == 'crm_annual_online').fetch(1)
                    amount_ch = int(new_plan[0].price * int(request.nb_licenses) * 100)
                    payment_switch_status = "f_y"
            else:
                if request.plan == "month":
                    new_plan = LicenseModel.query(LicenseModel.name == 'crm_monthly_online').fetch(1)
                    if organization_plan.name == "free_trial":
                        amount_ch = int(new_plan[0].price * int(request.nb_licenses) * 100)
                        payment_switch_status = "f_m"

                    elif organization_plan.name == "crm_monthly_online":
                        monthly_unit = new_plan[0].price / 30
                        amount_ch = int(monthly_unit * int(days_before_expiring.days + 1) * 100)
                        payment_switch_status = "m_m"

                elif request.plan == "year":
                    new_plan = LicenseModel.query(LicenseModel.name == 'crm_annual_online').fetch(1)

                    if organization_plan.name == "free_trial":
                        amount_ch = int(new_plan[0].price * int(request.nb_licenses) * 100)
                        payment_switch_status = "f_y"

                    elif organization_plan.name == "crm_monthly_online":
                        amount_ch = int(new_plan[0].price * int(request.nb_licenses) * 100)
                        payment_switch_status = "m_y"
                    elif organization_plan.name == "crm_annual_online":
                        yearly_unit = new_plan[0].price / 365
                        amount_ch = int(yearly_unit * int(days_before_expiring.days + 1) * 100)
                        payment_switch_status = "y_y"

        try:

            charge = stripe.Charge.create(
                amount=amount_ch,  # amount in cents, again
                currency="usd",
                card=token,
                description=email
            )
            if charge:
                transaction = TransactionModel(organization=user_from_email.organization, charge=charge.id,
                                               amount=amount_ch)
                transaction.put()
                transaction_message = "charge succeed!"
                transaction_failed = False
                transaction_balance = charge.balance_transaction
                Organization.set_billing_infos(user_from_email.organization, request, payment_switch_status,
                                               new_plan[0].key, int(request.nb_licenses), int(new_plan[0].duration))
                # organization.nb_licenses=organization.nb_licenses+int(request.nb_licenses)
                # organization.plan=new_plan[0].key
                # now = datetime.datetime.now()
                # now_plus_exp_day=now+datetime.timedelta(days=int(new_plan[0].duration)) 
                # organization.licenses_expires_on=now_plus_exp_day
                # organization.billing_contact_firstname=request.billing_contact_firstname
                # organization.billing_contact_lastname=request.billing_contact_lastname
                # organization.billing_contact_email=request.billing_contact_email
                # organization.billing_contact_address=request.billing_contact_address
                # organization.billing_contact_phone_number=request.billing_contact_phone_number
                # organization.put()
                total_amount = amount_ch / 100
                list_emails = []
                list_emails.append(user_from_email.email)
                list_emails.append(request.billing_contact_email)
                body = '<h2>Congratulations !</h2><p style="font-size: 15px;">The payment is approved by your bank.You have now ' + request.nb_licenses + ' licences activated.&nbsp;</p><ul style="list-style: none; padding-left: 15px;"><li style="/* padding-top: 10px; */ padding-bottom: 10px;"> <strong>Company name :</strong> ' + organization.name + ' </li><li style=" padding-bottom: 10px;"> <strong>number of licenses :</strong> ' + request.nb_licenses + ' </li><li style=" padding-bottom: 10px;"> <strong>Total amount :</strong> ' + str(
                    total_amount) + ' $</li><li style="padding-bottom: 10px;"> <strong>Transaction reference : ' + transaction_balance + ' </strong> </li></ul>'
                if (request.billing_contact_email == None) or (user_from_email.email == request.billing_contact_email):

                    taskqueue.add(
                        url='/workers/send_email_notification',
                        queue_name='iogrow-low',
                        params={
                            'user_email': user_from_email.email,
                            'to': user_from_email.email,
                            'subject': '[RE]: Successful Payment operation',
                            'body': body
                        }
                    )
                else:
                    for x in xrange(0, 2):
                        taskqueue.add(
                            url='/workers/send_email_notification',
                            queue_name='iogrow-low',
                            params={
                                'user_email': user_from_email.email,
                                'to': list_emails[x],
                                'subject': '[RE]: Successful Payment operation',
                                'body': body
                            }
                        )

        except stripe.CardError, e:
            transaction_message = "charge failed!"
            transaction_failed = True
            print "error"

        return purchaseResponse(transaction_balance=transaction_balance, transaction_message=transaction_message
                                , transaction_failed=transaction_failed, nb_licenses=int(request.nb_licenses),
                                total_amount=total_amount
                                , expires_on=str(organization.licenses_expires_on), licenses_type=new_plan[0].name)

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

    @endpoints.method(FullContactRequest, message_types.VoidMessage,
                      path='fullContact/web_hook', http_method='POST',
                      name='fullContact.web_hook')
    def handel_web_hook(self, request):
        contact = request.contact
        params = request.params

        if not params:
            raise endpoints.NotFoundException("no google id provided")
        if not params.googleId:
            raise endpoints.NotFoundException("no google id provided")
        user = User.query(User.google_user_id == str(params.googleId)).get()
        if not user:
            raise endpoints.NotFoundException("no google id provided")
        Lead.create_lead_full_contact(contact, user, params.access)

        return message_types.VoidMessage()

    @endpoints.method(response_message=SubscriptionSchema, http_method='GET',
                      name='subscription.get', path='subscription/get')
    def get_subscription(self, request):
        organization = EndpointsHelper.require_iogrow_user().organization.get()
        return organization.get_subscription().get_schema()

    @endpoints.method(name='subscription.delete_from_stripe', path='subscription/delete_from_stripe')
    def delete_subscription(self, request):
        organization = EndpointsHelper.require_iogrow_user().organization.get()
        subscription = organization.subscription.get()
        try:
            customer = stripe.Customer.retrieve(organization.stripe_customer_id)
            customer.subscriptions.retrieve(subscription.stripe_subscription_id).delete()
            subscription.stripe_subscription_id = None
            subscription.put()
        except stripe.APIError:
            raise endpoints.NotFoundException("")
        return message_types.VoidMessage()

        # organization = EndpointsHelper.require_iogrow_user().organization.get()
        # subscription = organization.subscription
        # if subscription:
        #     sub_from_db = subscription.get()
        #     if sub_from_db.plan.get().name == config.PREMIUM:
        #         organization.set_subscription(Subscription.create_freemium_subscription())
        #         try:
        #             customer = stripe.Customer.retrieve(organization.stripe_customer_id)
        #             customer.subscriptions.retrieve(sub_from_db.stripe_subscription_id).delete()
        #         except stripe.APIError:
        #             raise endpoints.NotFoundException("")
        #         return message_types.VoidMessage()
        # raise endpoints.NotFoundException("")


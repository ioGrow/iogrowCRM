import csv
import datetime
import json
import logging
import re
import time

import endpoints
import model
import requests
from django.utils.encoding import smart_str
from google.appengine.api import app_identity
from google.appengine.api import search
from google.appengine.api import taskqueue
from google.appengine.datastore.datastore_query import Cursor
from google.appengine.ext import ndb
from protorpc import messages

import config
import iomessages
import tweepy
from endpoints_helper import EndpointsHelper
from endpoints_proto_datastore.ndb import EndpointsModel
from intercom import Intercom
from iograph import Node, Edge, InfoNodeListResponse
from iomodels.crmengine import contacts
from iomodels.crmengine.accounts import Account
from iomodels.crmengine.contacts import Contact, ContactInsertRequest
from iomodels.crmengine.documents import Document, DocumentListResponse
from iomodels.crmengine.events import Event, EventListResponse
from iomodels.crmengine.notes import Note, TopicListResponse
from iomodels.crmengine.opportunities import Opportunity, OpportunityListResponse
from iomodels.crmengine.payment import payment_required
from iomodels.crmengine.tags import Tag, TagSchema
from iomodels.crmengine.tasks import Task, TaskListResponse
from search_helper import tokenize_autocomplete, SEARCH_QUERY_MODEL

Intercom.app_id = 's9iirr8w'
Intercom.api_key = 'ae6840157a134d6123eb95ab0770879367947ad9'

ATTRIBUTES_MATCHING = {
    'firstname': ['First Name', 'Given Name', 'First name'],
    'lastname': ['Last Name', 'Family Name', 'Last name'],
    'title': ['Job Title', r'Organization\s*\d\s*-\s*Title', 'Title'],
    'company': ['Company', r'Organization\s*\d\s*-\s*Name'],
    'phones': [
        'Primary Phone', 'Home Phone', 'Mobile Phone', r'Phone\s*\d\s*-\s*Value',
        'Phone number - Work', 'Phone number - Mobile', 'Phone number - Home', 'Phone number - Other'
    ],
    'emails': [
        'E-mail Address', r'E-mail\s*\d\s*Address', r'E-mail\s*\d\s*-\s*Value',
        'Email address - Work', 'Email address - Home', 'Email address - Other'
    ],
    'addresses': [
        'Business Address', r'Address\s*\d\s*-\s*Formatted',
        'Address - Work Street', 'Address - Work City', 'Address - Home Street', 'Address - Home City'
    ],
    'sociallinks': [r'Facebook.', r'Twitter.', r'Linkedin.', r'Instagram.'
                    ],
    'websites': [
        'Web Page', 'Personal Web Page', r'Web.'
    ]
}

INFO_NODES = {
    'phones': {'default_field': 'number'},
    'emails': {'default_field': 'email'},
    'addresses': {'default_field': 'formatted'},
    'sociallinks': {'default_field': 'url'},
    'websites': {'default_field': 'url'}
}


# fullContact schemas
class EmailSchema(messages.Message):
    value = messages.StringField(1)
    type = messages.StringField(2)


class PhoneNumbersSchema(messages.Message):
    value = messages.StringField(1)
    type = messages.StringField(2)


class URLsSchema(messages.Message):
    value = messages.StringField(1)
    type = messages.StringField(2)


class PhotosSchema(messages.Message):
    value = messages.StringField(1)
    type = messages.StringField(2)


class AccountsSchema(messages.Message):
    urlString = messages.StringField(1)
    username = messages.StringField(2)


class OrganizationsSchema(messages.Message):
    name = messages.StringField(1)
    isPrimary = messages.BooleanField(2)
    title = messages.StringField(3)


class NameSchema(messages.Message):
    givenName = messages.StringField(1)
    familyName = messages.StringField(2)


class FullContactSchema(messages.Message):
    emails = messages.MessageField(EmailSchema, 1, repeated=True)
    name = messages.MessageField(NameSchema, 2)
    phoneNumbers = messages.MessageField(PhoneNumbersSchema, 3, repeated=True)
    organizations = messages.MessageField(OrganizationsSchema, 4, repeated=True)
    accounts = messages.MessageField(AccountsSchema, 5, repeated=True)
    urls = messages.MessageField(URLsSchema, 6, repeated=True)
    photos = messages.MessageField(PhotosSchema, 7, repeated=True)


class ParamsSchema(messages.Message):
    googleId = messages.StringField(1)
    access = messages.StringField(2, default='public')


class FullContactRequest(messages.Message):
    contact = messages.MessageField(FullContactSchema, 1)
    params = messages.MessageField(ParamsSchema, 2)


# end fullContact schemas

class LeadFromTwitterRequest(messages.Message):
    user_id = messages.IntegerField(1, required=True)


class LeadSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    firstname = messages.StringField(3)
    lastname = messages.StringField(4)
    company = messages.StringField(5)
    title = messages.StringField(6)
    tagline = messages.StringField(7)
    introduction = messages.StringField(8)
    infonodes = messages.MessageField(InfoNodeListResponse, 9)
    topics = messages.MessageField(TopicListResponse, 10)
    tasks = messages.MessageField(TaskListResponse, 11)
    events = messages.MessageField(EventListResponse, 12)
    documents = messages.MessageField(DocumentListResponse, 13)
    source = messages.StringField(14)
    status = messages.StringField(15)
    tags = messages.MessageField(TagSchema, 16, repeated=True)
    created_at = messages.StringField(17)
    updated_at = messages.StringField(18)
    access = messages.StringField(19)
    folder = messages.StringField(20)
    profile_img_id = messages.StringField(21)
    profile_img_url = messages.StringField(22)
    industry = messages.StringField(23)
    owner = messages.MessageField(iomessages.UserSchema, 24)
    opportunities = messages.MessageField(OpportunityListResponse, 25)
    emails = messages.MessageField(iomessages.EmailListSchema, 26)
    phones = messages.MessageField(iomessages.PhoneListSchema, 27)
    linkedin_url = messages.StringField(28)
    sociallinks = messages.MessageField(iomessages.SocialLinkListSchema, 29)
    cover_image = messages.StringField(30)
    linkedin_profile = messages.MessageField(iomessages.LinkedinProfileSchema ,31)



class LeadInsertRequest(messages.Message):
    firstname = messages.StringField(1)
    lastname = messages.StringField(2)
    title = messages.StringField(4)
    company = messages.StringField(3)
    access = messages.StringField(5)
    source = messages.StringField(6)
    status = messages.StringField(7)
    tagline = messages.StringField(8)
    introduction = messages.StringField(9)
    phones = messages.MessageField(iomessages.PhoneSchema, 10, repeated=True)
    emails = messages.MessageField(iomessages.EmailSchema, 11, repeated=True)
    addresses = messages.MessageField(iomessages.AddressSchema, 12, repeated=True)
    infonodes = messages.MessageField(iomessages.InfoNodeRequestSchema, 13, repeated=True)
    profile_img_id = messages.StringField(14)
    profile_img_url = messages.StringField(15)
    industry = messages.StringField(16)
    linkedin_url = messages.StringField(17)
    updated_at = messages.StringField(18)
    notes = messages.MessageField(iomessages.NoteInsertRequestSchema, 19, repeated=True)
    force = messages.BooleanField(20, default=False)
    cover_image = messages.StringField(21)
    linkedin_profile = messages.MessageField(iomessages.LinkedinProfileSchema ,22)

    # The message class that defines the ListRequest schema


class LeadMergeRequest(messages.Message):
    base_id = messages.IntegerField(1, required=True)
    new_lead = messages.MessageField(LeadInsertRequest, 2, required=True)

    # The message class that defines the ListRequest schema


class FLNameFilterRequest(messages.Message):
    # TODO: slkdjcfldkjslkjds
    firstname = messages.StringField(1)
    lastname = messages.StringField(2)
    # Add other fields here


class FLsourceFilterRequest(messages.Message):
    source = messages.StringField(1)


class ListRequest(messages.Message):
    limit = messages.IntegerField(1)
    pageToken = messages.StringField(2)


class LeadGetRequest(messages.Message):
    id = messages.IntegerField(1, required=True)
    topics = messages.MessageField(ListRequest, 2)
    tasks = messages.MessageField(ListRequest, 3)
    events = messages.MessageField(ListRequest, 4)
    documents = messages.MessageField(ListRequest, 5)
    opportunities = messages.MessageField(ListRequest, 6)


class LeadPatchRequest(messages.Message):
    id = messages.StringField(1)
    firstname = messages.StringField(2)
    lastname = messages.StringField(3)
    company = messages.StringField(4)
    title = messages.StringField(5)
    tagline = messages.StringField(6)
    introduction = messages.StringField(7)
    source = messages.StringField(8)
    status = messages.StringField(9)
    access = messages.StringField(10)
    profile_img_id = messages.StringField(11)
    profile_img_url = messages.StringField(12)
    industry = messages.StringField(13)
    owner = messages.StringField(14)
    linkedin_url = messages.StringField(16)
    cover_image = messages.StringField(17)
    linkedin_profile = messages.MessageField(iomessages.LinkedinProfileSchema ,18)
    phones = messages.MessageField(iomessages.PhoneSchema, 15, repeated=True)
    emails = messages.MessageField(iomessages.EmailSchema, 19, repeated=True)
    addresses = messages.MessageField(iomessages.AddressSchema, 20, repeated=True)
    notes = messages.MessageField(iomessages.NoteInsertRequestSchema, 21, repeated=True)
    infonodes = messages.MessageField(iomessages.InfoNodeRequestSchema, 22, repeated=True)



class LeadListRequest(messages.Message):
    limit = messages.IntegerField(1)
    pageToken = messages.StringField(2)
    order = messages.StringField(3)
    tags = messages.StringField(4, repeated=True)
    owner = messages.StringField(5)
    status = messages.StringField(6)
    source = messages.StringField(7)


class LeadListResponse(messages.Message):
    items = messages.MessageField(LeadSchema, 1, repeated=True)
    nextPageToken = messages.StringField(2)


class LeadExportListSchema(messages.Message):
    firstname = messages.StringField(1)
    lastname = messages.StringField(2)
    source = messages.StringField(3)
    company = messages.StringField(4)
    emails = messages.MessageField(iomessages.EmailListSchema, 5)
    phones = messages.MessageField(iomessages.PhoneListSchema, 6)
    addresses = messages.MessageField(iomessages.AddressListSchema, 7)
    # customfields=messages.MessageField(iomessages.customfieldsList,8)


class LeadExportListResponse(messages.Message):
    items = messages.MessageField(LeadExportListSchema, 1, repeated=True)


class LeadExportRequestSchema(messages.Message):
    leadKey = messages.StringField(1)


class LeadExportRequest(messages.Message):
    selectedKeys = messages.MessageField(LeadExportRequestSchema, 1, repeated=True)


class LeadSearchResult(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    firstname = messages.StringField(3)
    lastname = messages.StringField(4)
    company = messages.StringField(5)
    position = messages.StringField(6)
    status = messages.StringField(7)


class LeadSearchResults(messages.Message):
    items = messages.MessageField(LeadSearchResult, 1, repeated=True)
    nextPageToken = messages.StringField(2)


class Lead(EndpointsModel):
    _message_fields_schema = (
        'id', 'entityKey', 'folder', 'owner', 'access', 'collaborators_list', 'collaborators_ids', 'firstname',
        'lastname',
        'company', 'title', 'tagline', 'introduction', 'status', 'created_at', 'updated_at', 'show', 'show_name',
        'feedback', 'feedback_name', 'source', 'profile_img_id',
        'profile_img_url', 'industry', 'linkedin_url', 'cover_image')
    # Sharing fields
    owner = ndb.StringProperty()
    collaborators_list = ndb.StructuredProperty(model.Userinfo, repeated=True)
    collaborators_ids = ndb.StringProperty(repeated=True)
    organization = ndb.KeyProperty()
    folder = ndb.StringProperty()
    firstname = ndb.StringProperty()
    lastname = ndb.StringProperty()
    company = ndb.StringProperty()
    industry = ndb.StringProperty()
    title = ndb.StringProperty()
    department = ndb.StringProperty()
    description = ndb.TextProperty()
    source = ndb.StringProperty()
    status = ndb.StringProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    created_by = ndb.KeyProperty()
    show = ndb.KeyProperty()
    linkedin_profile = ndb.KeyProperty()
    show_name = ndb.StringProperty()
    feedback = ndb.KeyProperty()
    feedback_name = ndb.StringProperty()
    # public or private
    access = ndb.StringProperty()
    tagline = ndb.StringProperty()
    introduction = ndb.TextProperty()
    profile_img_id = ndb.StringProperty()
    profile_img_url = ndb.StringProperty()
    linkedin_url = ndb.StringProperty()
    cover_image = ndb.StringProperty()


    def put(self, **kwargs):
        if hasattr(self, 'updated_at'):
            self._properties['updated_at'].auto_now = False
        else:
            self.updated_at = datetime.datetime.now()
        ndb.Model.put(self, **kwargs)
        # self.put_index()
        # self.set_perm()

    def set_perm(self):
        about_item = str(self.key.id())

        perm = model.Permission(about_kind='Lead',
                                about_item=about_item,
                                type='user',
                                role='owner',
                                value=self.owner)
        perm.put()

    def put_index(self, data=None):
        try:
            """ index the element at each"""
            empty_string = lambda x: x if x else ""
            collaborators = " ".join(self.collaborators_ids)
            organization = str(self.organization.id())
            title_autocomplete = ','.join(tokenize_autocomplete(
                self.firstname + ' ' + self.lastname + ' ' + empty_string(self.title) + ' ' + empty_string(
                    self.company) + ' ' + empty_string(self.status)))
            # addresses = " \n".join(map(lambda x: " ".join([x.street,x.city,x.state, x.postal_code, x.country]), self.addresses))
            if data:
                print"@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
                print data
                search_key = ['infos', 'contacts', 'tags', 'collaborators']
                for key in search_key:
                    if key not in data.keys():
                        data[key] = ""
                my_document = search.Document(
                    doc_id=str(data['id']),
                    fields=[
                        search.TextField(name=u'type', value=u'Lead'),
                        search.TextField(name='title',
                                         value=empty_string(self.firstname) + " " + empty_string(self.lastname)),
                        search.TextField(name='entityKey', value=empty_string(self.key.urlsafe())),
                        search.TextField(name='organization', value=empty_string(organization)),
                        search.TextField(name='access', value=empty_string(self.access)),
                        search.TextField(name='owner', value=empty_string(self.owner)),
                        search.TextField(name='collaborators', value=data['collaborators']),
                        search.TextField(name='firstname', value=empty_string(self.firstname)),
                        search.TextField(name='lastname', value=empty_string(self.lastname)),
                        search.TextField(name='company', value=empty_string(self.company)),
                        search.TextField(name='industry', value=empty_string(self.industry)),
                        search.TextField(name='position', value=empty_string(self.title)),
                        search.TextField(name='department', value=empty_string(self.department)),
                        search.TextField(name='description', value=empty_string(self.description)),
                        search.TextField(name='source', value=empty_string(self.source)),
                        search.TextField(name='status', value=empty_string(self.status)),
                        search.DateField(name='created_at', value=self.created_at),
                        search.DateField(name='updated_at', value=self.updated_at),
                        search.TextField(name='show_name', value=empty_string(self.show_name)),
                        search.TextField(name='tagline', value=empty_string(self.tagline)),
                        search.TextField(name='introduction', value=empty_string(self.introduction)),
                        search.TextField(name='infos', value=data['infos']),
                        search.TextField(name='tags', value=data['tags']),
                        search.TextField(name='title_autocomplete', value=empty_string(title_autocomplete)),
                    ])
            else:
                print "###################################################################"
                my_document = search.Document(
                    doc_id=str(self.key.id()),
                    fields=[
                        search.TextField(name=u'type', value=u'Lead'),
                        search.TextField(name='title',
                                         value=empty_string(self.firstname) + " " + empty_string(self.lastname)),
                        search.TextField(name='organization', value=empty_string(organization)),
                        search.TextField(name='access', value=empty_string(self.access)),
                        search.TextField(name='owner', value=empty_string(self.owner)),
                        search.TextField(name='collaborators', value=collaborators),
                        search.TextField(name='firstname', value=empty_string(self.firstname)),
                        search.TextField(name='lastname', value=empty_string(self.lastname)),
                        search.TextField(name='company', value=empty_string(self.company)),
                        search.TextField(name='industry', value=empty_string(self.industry)),
                        search.TextField(name='position', value=empty_string(self.title)),
                        search.TextField(name='department', value=empty_string(self.department)),
                        search.TextField(name='description', value=empty_string(self.description)),
                        search.TextField(name='source', value=empty_string(self.source)),
                        search.TextField(name='status', value=empty_string(self.status)),
                        search.DateField(name='created_at', value=self.created_at),
                        search.DateField(name='updated_at', value=self.updated_at),
                        search.TextField(name='show_name', value=empty_string(self.show_name)),
                        search.TextField(name='tagline', value=empty_string(self.tagline)),
                        search.TextField(name='introduction', value=empty_string(self.introduction)),
                        search.TextField(name='title_autocomplete', value=empty_string(title_autocomplete)),
                    ])
            my_index = search.Index(name="GlobalIndex")
            my_index.put(my_document)
        except Exception, e:
            print 'error on saving lead to index'

    @classmethod
    def get_schema(cls, user_from_email, request):
        lead = Lead.get_by_id(int(request.id))
        if lead is None:
            raise endpoints.NotFoundException('Lead not found.')
        if not Node.check_permission(user_from_email, lead):
            raise endpoints.UnauthorizedException('You don\'t have permissions.')
        # list of tags related to this account
        tag_list = Tag.list_by_parent(lead.key)
        # list of infonodes
        infonodes = Node.list_info_nodes(
            parent_key=lead.key,
            request=request
        )
        # list of topics related to this account
        topics = None
        if request.topics:
            topics = Note.list_by_parent(
                parent_key=lead.key,
                request=request
            )
        tasks = None
        if request.tasks:
            tasks = Task.list_by_parent(
                parent_key=lead.key,
                request=request
            )
        events = None
        if request.events:
            events = Event.list_by_parent(
                parent_key=lead.key,
                request=request
            )
        documents = None
        if request.documents:
            documents = Document.list_by_parent(
                parent_key=lead.key,
                request=request
            )
        opportunities = None
        if request.opportunities:
            opportunities = Opportunity.list_by_parent(
                user_from_email=user_from_email,
                parent_key=lead.key,
                request=request
            )
        owner = model.User.get_by_gid(lead.owner)
        owner_schema = None
        if owner:
            owner_schema = iomessages.UserSchema(
                id=str(owner.id),
                email=owner.email,
                google_display_name=owner.google_display_name,
                google_public_profile_photo_url=owner.google_public_profile_photo_url,
                google_public_profile_url=owner.google_public_profile_url,
                google_user_id=owner.google_user_id
            )
        linkedin_profile_schema={}
        if lead.linkedin_profile :
            linkedin_profile = lead.linkedin_profile.get()
            linkedin_profile_schema=iomessages.LinkedinProfileSchema(
                lastname = linkedin_profile.lastname ,
                firstname = linkedin_profile.firstname ,
                industry =  linkedin_profile.industry ,
                locality =  linkedin_profile.locality ,
                title = linkedin_profile.headline ,
                current_post =  linkedin_profile.current_post ,
                past_post=linkedin_profile.past_post  ,
                formations=linkedin_profile.formations ,
                websites=linkedin_profile.websites ,
                relation=linkedin_profile.relation ,
                experiences=linkedin_profile.experiences ,
                resume=linkedin_profile.resume ,
                certifications=linkedin_profile.certifications ,
                skills=linkedin_profile.skills ,
                url=linkedin_profile.url ,
                languages=linkedin_profile.languages,
                phones=linkedin_profile.phones,
                emails=linkedin_profile.emails,

            )
        lead_schema = LeadSchema(
            id=str(lead.key.id()),
            entityKey=lead.key.urlsafe(),
            access=lead.access,
            firstname=lead.firstname,
            lastname=lead.lastname,
            title=lead.title,
            company=lead.company,
            source=lead.source,
            status=lead.status,
            tagline=lead.tagline,
            introduction=lead.introduction,
            tags=tag_list,
            topics=topics,
            tasks=tasks,
            events=events,
            documents=documents,
            opportunities=opportunities,
            infonodes=infonodes,
            profile_img_id=lead.profile_img_id,
            profile_img_url=lead.profile_img_url,
            linkedin_url=lead.linkedin_url,
            created_at=lead.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
            updated_at=lead.updated_at.strftime("%Y-%m-%dT%H:%M:00.000"),
            industry=lead.industry,
            cover_image=lead.cover_image,
            owner=owner_schema,
            linkedin_profile=linkedin_profile_schema
        )
        return lead_schema

    @classmethod
    def list(cls, user_from_email, request):
        if request.tags:
            return cls.filter_by_tag(user_from_email, request)
        curs = Cursor(urlsafe=request.pageToken)
        if request.limit:
            limit = int(request.limit)
        else:
            limit = 1000
        items = list()
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
                attr = cls._properties.get(order_by)
                if attr is None:
                    # TODO : attr_name variable definition
                    raise AttributeError('Order attribute %s not defined.' % ("attr_name",))
                if ascending:
                    leads, next_curs, more = cls.query().filter(cls.organization == user_from_email.organization).order(
                        +attr).fetch_page(limit, start_cursor=curs)
                else:
                    leads, next_curs, more = cls.query().filter(cls.organization == user_from_email.organization).order(
                        -attr).fetch_page(limit, start_cursor=curs)
            else:
                leads, next_curs, more = cls.query().filter(
                    cls.organization == user_from_email.organization).fetch_page(limit, start_cursor=curs)
            for lead in leads:
                if len(items) < limit:
                    is_filtered = True
                    if request.tags and is_filtered:
                        end_node_set = [ndb.Key(urlsafe=tag_key) for tag_key in request.tags]
                        if not Edge.find(start_node=lead.key, kind='tags', end_node_set=end_node_set, operation='AND'):
                            is_filtered = False
                    if request.owner and lead.owner != request.owner and is_filtered:
                        is_filtered = False
                    if request.status and lead.status != request.status and is_filtered:
                        is_filtered = False
                    if request.source and lead.source != request.source and is_filtered:
                        is_filtered = False
                    if is_filtered and Node.check_permission(user_from_email, lead):
                        count = count + 1
                        # list of tags related to this lead
                        tag_list = Tag.list_by_parent(parent_key=lead.key)
                        infonodes = Node.list_info_nodes(
                            parent_key=lead.key,
                            request=request
                        )
                        infonodes_structured = Node.to_structured_data(infonodes)
                        emails = None
                        if 'emails' in infonodes_structured.keys():
                            if hasattr(infonodes_structured['emails'], 'items'):
                                emails = infonodes_structured['emails']
                        phones = None
                        if 'phones' in infonodes_structured.keys():
                            if hasattr(infonodes_structured['phones'], 'items'):
                                phones = infonodes_structured['phones']
                        sociallinks = None
                        if 'sociallinks' in infonodes_structured.keys():
                            if hasattr(infonodes_structured['sociallinks'], 'items'):
                                sociallinks = infonodes_structured['sociallinks']
                        owner = model.User.get_by_gid(lead.owner)
                        owner_schema = None
                        if owner:
                            owner_schema = iomessages.UserSchema(
                                id=str(owner.id),
                                email=owner.email,
                                google_display_name=owner.google_display_name,
                                google_public_profile_photo_url=owner.google_public_profile_photo_url,
                                google_public_profile_url=owner.google_public_profile_url,
                                google_user_id=owner.google_user_id
                            )
                        lead_schema = LeadSchema(
                            id=str(lead.key.id()),
                            entityKey=lead.key.urlsafe(),
                            firstname=lead.firstname,
                            lastname=lead.lastname,
                            title=lead.title,
                            company=lead.company,
                            tags=tag_list,
                            emails=emails,
                            phones=phones,
                            sociallinks=sociallinks,
                            profile_img_id=lead.profile_img_id,
                            profile_img_url=lead.profile_img_url,
                            linkedin_url=lead.linkedin_url,
                            owner=owner_schema,
                            access=lead.access,
                            source=lead.source,
                            cover_image=lead.cover_image,
                            created_at=lead.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                            updated_at=lead.updated_at.strftime("%Y-%m-%dT%H:%M:00.000")
                        )
                        items.append(lead_schema)
            if (len(items) >= limit):
                you_can_loop = False
            if next_curs:
                if count >= limit:
                    next_curs_url_safe = next_curs.urlsafe()
                else:
                    next_curs_url_safe = curs.urlsafe()
            if next_curs:
                curs = next_curs
            else:
                you_can_loop = False
                next_curs_url_safe = None
        return LeadListResponse(items=items, nextPageToken=next_curs_url_safe)

    @classmethod
    def filter_by_tag(cls, user_from_email, request):
        items = []
        tag_keys = []
        for tag_key_str in request.tags:
            tag_keys.append(ndb.Key(urlsafe=tag_key_str))
        lead_keys = Edge.filter_by_set(tag_keys, 'tagged_on')
        leads = ndb.get_multi(lead_keys)
        for lead in leads:
            if lead is not None:
                is_filtered = True
                if request.owner and lead.owner != request.owner and is_filtered:
                    is_filtered = False
                if request.status and lead.status != request.status and is_filtered:
                    is_filtered = False
                if is_filtered and Node.check_permission(user_from_email, lead):
                    tag_list = Tag.list_by_parent(parent_key=lead.key)
                    infonodes = Node.list_info_nodes(
                        parent_key=lead.key,
                        request=request
                    )
                    infonodes_structured = Node.to_structured_data(infonodes)
                    emails = None
                    if 'emails' in infonodes_structured.keys():
                        emails = infonodes_structured['emails']
                    phones = None
                    if 'phones' in infonodes_structured.keys():
                        phones = infonodes_structured['phones']
                    sociallinks = None
                    if 'sociallinks' in infonodes_structured.keys():
                        if hasattr(infonodes_structured['sociallinks'], 'items'):
                            sociallinks = infonodes_structured['sociallinks']
                    owner = model.User.get_by_gid(lead.owner)
                    owner_schema = None
                    if owner:
                        owner_schema = iomessages.UserSchema(
                            id=str(owner.id),
                            email=owner.email,
                            google_display_name=owner.google_display_name,
                            google_public_profile_photo_url=owner.google_public_profile_photo_url,
                            google_public_profile_url=owner.google_public_profile_url,
                            google_user_id=owner.google_user_id
                        )
                    lead_schema = LeadSchema(
                        id=str(lead.key.id()),
                        entityKey=lead.key.urlsafe(),
                        firstname=lead.firstname,
                        lastname=lead.lastname,
                        title=lead.title,
                        company=lead.company,
                        emails=emails,
                        phones=phones,
                        sociallinks=sociallinks,
                        tags=tag_list,
                        owner=owner_schema,
                        access=lead.access,
                        source=lead.source,
                        profile_img_id=lead.profile_img_id,
                        profile_img_url=lead.profile_img_url,
                        linkedin_url=lead.linkedin_url,
                        created_at=lead.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                        updated_at=lead.updated_at.strftime("%Y-%m-%dT%H:%M:00.000")
                    )
                    items.append(lead_schema)
        return LeadListResponse(items=items)

    @classmethod
    def search(cls, user_from_email, request):
        organization = str(user_from_email.organization.id())
        index = search.Index(name="GlobalIndex")
        # Show only objects where you have permissions
        query_string = SEARCH_QUERY_MODEL % {
            "type": "Lead",
            "query": request.q,
            "organization": organization,
            "owner": user_from_email.google_user_id,
            "collaborators": user_from_email.google_user_id,
        }
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
                if len(result.results) == limit + 1:
                    next_cursor = result.results[-1].cursor.web_safe_string
                else:
                    next_cursor = None
                results = result.results[:limit]
                for scored_document in results:
                    kwargs = {
                        'id': scored_document.doc_id
                    }
                    for e in scored_document.fields:
                        if e.name in [
                            "firstname",
                            "lastname",
                            "company",
                            "position",
                            "status"
                        ]:
                            kwargs[e.name] = e.value
                    search_results.append(LeadSearchResult(**kwargs))

        except search.Error:
            logging.exception('Search failed')
        return LeadSearchResults(
            items=search_results,
            nextPageToken=next_cursor
        )

    @classmethod
    def get_by_first_and_last_name(cls, lead):
        lead = cls.query(cls.firstname == lead.firstname, cls.lastname == lead.lastname,
                         cls.owner == lead.owner).get()
        return lead

    @classmethod
    def fetch_by_first_and_last_name(cls, owner, first_name, last_name):
        leads = cls.query(cls.firstname == first_name, cls.lastname == last_name,
                          cls.owner == owner).fetch()
        return leads

    @classmethod
    def filter_by_first_and_last_name_response(cls, user_from_email, request):
        first_name = str(request.firstname).lower()
        last_name = str(request.lastname).lower()
        leads = cls.fetch_by_first_and_last_name(user_from_email.google_user_id, first_name, last_name)
        leads_list = []
        for lead in leads:
            leads_list.append(LeadSchema(
                id=str(lead.id),
                firstname=lead.firstname,
                lastname=lead.lastname,
                title=lead.title,
                company=lead.company,
                source=lead.source,
                status=lead.status,
                created_at=lead.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                updated_at=lead.updated_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                industry=lead.industry,
                linkedin_url=lead.linkedin_url,
                cover_image=lead.cover_image,
            ))
        resp = LeadListResponse(items=leads_list)
        return resp

    @classmethod
    def fetch_by_source(cls, owner, source):
        leads = cls.query(cls.source == source,
                          cls.owner == owner).fetch()
        return leads

    @classmethod
    def filter_by_source(cls, user_from_email, request):
        leads = cls.fetch_by_source(user_from_email.google_user_id, request.source)
        leads_list = []
        first_name = str(request.firstname).lower()
        last_name = str(request.lastname).lower()
        for lead in leads:
            leads_list.append(LeadSchema(
                id=str(lead.id),
                firstname=first_name,
                lastname=last_name,
                title=lead.title,
                company=lead.company,
                source=lead.source,
                status=lead.status,
                created_at=lead.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                updated_at=lead.updated_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                industry=lead.industry,
                linkedin_url=lead.linkedin_url,
                cover_image=lead.cover_image
            ))
        resp = LeadListResponse(items=leads_list)
        return resp

    @classmethod
    @payment_required()
    def insert(cls, user_from_email, request):
        first_name = smart_str(request.firstname).lower()
        last_name = smart_str(request.lastname).lower()
        linkedin_profile_key = None
        if request.linkedin_profile :
            linkedin_profile = model.LinkedinProfile(
                lastname = request.linkedin_profile.lastname ,
                firstname = request.linkedin_profile.firstname ,
                industry =  request.linkedin_profile.industry ,
                locality =  request.linkedin_profile.locality ,
                headline =  request.linkedin_profile.title ,
                current_post =  request.linkedin_profile.current_post or [] ,
                past_post=request.linkedin_profile.past_post or [] ,
                formations=request.linkedin_profile.formations ,
                websites=request.linkedin_profile.websites ,
                relation=request.linkedin_profile.relation ,
                experiences=request.linkedin_profile.experiences ,
                resume=request.linkedin_profile.resume ,
                certifications=request.linkedin_profile.certifications ,
                skills=request.linkedin_profile.skills ,
                url=request.linkedin_profile.url ,
                languages=request.linkedin_profile.languages,
                emails=request.linkedin_profile.emails,
                phones=request.linkedin_profile.phones
            )
            linkedin_profile_key= linkedin_profile.put()
        lead = cls(
            firstname=first_name,
            lastname=last_name,
            title=request.title,
            company=request.company,
            status="New",
            source=request.source,
            tagline=request.tagline,
            introduction=request.introduction,
            owner=user_from_email.google_user_id,
            organization=user_from_email.organization,
            access=request.access,
            profile_img_id=request.profile_img_id,
            profile_img_url=request.profile_img_url,
            linkedin_url=request.linkedin_url,
            industry=request.industry,
            cover_image=request.cover_image,
            linkedin_profile=linkedin_profile_key
        )

        lead_key = lead.put_async()
        lead_key_async = lead_key.get_result()
        for email in request.emails:
            Node.insert_info_node(
                lead_key_async,
                iomessages.InfoNodeRequestSchema(
                    kind='emails',
                    fields=[
                        iomessages.RecordSchema(
                            field='email',
                            value=email.email
                        )
                    ]
                )
            )
        for phone in request.phones:
            Node.insert_info_node(
                lead_key_async,
                iomessages.InfoNodeRequestSchema(
                    kind='phones',
                    fields=[
                        iomessages.RecordSchema(
                            field='type',
                            value=phone.type
                        ),
                        iomessages.RecordSchema(
                            field='number',
                            value=phone.number
                        )
                    ]
                )
            )
        for address in request.addresses:
            Node.insert_info_node(
                lead_key_async,
                iomessages.InfoNodeRequestSchema(
                    kind='addresses',
                    fields=[
                        iomessages.RecordSchema(
                            field='street',
                            value=address.street
                        ),
                        iomessages.RecordSchema(
                            field='city',
                            value=address.city
                        ),
                        iomessages.RecordSchema(
                            field='state',
                            value=address.state
                        ),
                        iomessages.RecordSchema(
                            field='postal_code',
                            value=address.postal_code
                        ),
                        iomessages.RecordSchema(
                            field='country',
                            value=address.country
                        ),
                        iomessages.RecordSchema(
                            field='formatted',
                            value=address.formatted
                        )
                    ]
                )
            )
        for infonode in request.infonodes:
            Node.insert_info_node(
                lead_key_async,
                iomessages.InfoNodeRequestSchema(
                    kind=infonode.kind,
                    fields=infonode.fields
                )
            )

        if request.profile_img_id:
            taskqueue.add(
                url='/workers/sharedocument',
                queue_name='iogrow-low',
                params={
                    'user_email': user_from_email.email,
                    'access': 'anyone',
                    'resource_id': request.profile_img_id
                }
            )
        if request.notes:
            for note_request in request.notes:
                note_author = model.Userinfo()
                note_author.display_name = user_from_email.google_display_name
                note_author.photo = user_from_email.google_public_profile_photo_url
                note = Note(
                    owner=user_from_email.google_user_id,
                    organization=user_from_email.organization,
                    author=note_author,
                    title=note_request.title,
                    content=note_request.content
                )
                entityKey_async = note.put_async()
                entityKey = entityKey_async.get_result()
                Edge.insert(
                    start_node=lead_key_async,
                    end_node=entityKey,
                    kind='topics',
                    inverse_edge='parents'
                )
                EndpointsHelper.update_edge_indexes(
                    parent_key=lead_key_async,
                    kind='topics',
                    indexed_edge=str(entityKey.id())
                )

        data = {'id': lead_key_async.id()}
        # lead.put_index(data)
        if request.updated_at:
            lead.updated_at = datetime.datetime.strptime(
                request.updated_at,
                "%Y-%m-%dT%H:%M:00"
            )
            if lead.updated_at:
                lead.put()
                print 'lead upated date ok'
        lead_schema = LeadSchema(
            id=str(lead_key_async.id()),
            entityKey=lead_key_async.urlsafe(),
            firstname=lead.firstname,
            lastname=lead.lastname,
            title=lead.title,
            company=lead.company,
            source=lead.source,
            status=lead.status,
            created_at=lead.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
            updated_at=lead.updated_at.strftime("%Y-%m-%dT%H:%M:00.000"),
            industry=lead.industry,
            cover_image=lead.cover_image,
            linkedin_url=lead.linkedin_url
        )
        if request.source:
            Intercom.create_event(
                event_name='mark as lead from ' + request.source,
                email=user_from_email.email
            )
        return lead_schema

    @classmethod
    def from_twitter(cls, user_from_email, request):
        try:
            credentials = {
                'consumer_key': 'YM7Glbdf9M9WyaaKh6DNOQ',
                'consumer_secret': 'CGDvSvuohsJF1YUJwDFc3EsuTg8BQvHplsYiv7h6Uw',
                'access_token_key': '50290670-HYBgH5DOmLB2LqRB1NXkA2Y28bMCfi5a0yvq9YWUw',
                'access_token_secret': 'UfehG5RWaTNZTwCEERImSeUVwVlXM6mY1ly3lYjiWaqIc'
            }
            auth = tweepy.OAuthHandler(credentials['consumer_key'], credentials['consumer_secret'])
            auth.set_access_token(credentials['access_token_key'], credentials['access_token_secret'])
            api = tweepy.API(auth)
            twitter_lead = api.get_user(user_id=request.user_id)
        except (IndexError, TypeError):
            raise endpoints.NotFoundException('an error has occurred try again %s' %
                                              (request.screen_name,))
        import_request = LeadInsertRequest(
            firstname=twitter_lead.name.split()[0],
            lastname=" ".join(twitter_lead.name.split()[1:]),
            introduction=twitter_lead.description,
            profile_img_url=twitter_lead.profile_image_url
        )
        lead = cls.insert(user_from_email, import_request)
        return lead

    @classmethod
    def convert(cls, user_from_email, request):
        try:
            lead = Lead.get_by_id(int(request.id))
        except (IndexError, TypeError):
            raise endpoints.NotFoundException('Lead %s not found.' %
                                              (request.id,))
        contact = Contact(
            owner=lead.owner,
            organization=lead.organization,
            access=lead.access,
            firstname=lead.firstname,
            lastname=lead.lastname,
            title=lead.title,
            tagline=lead.tagline,
            introduction=lead.introduction,
            profile_img_id=lead.profile_img_id,
            profile_img_url=lead.profile_img_url,
            cover_image=lead.cover_image
            # linkedin_url = lead.linkedin_url
        )

        contact_key = contact.put_async()
        contact_key_async = contact_key.get_result()
        if lead.company:
            account = Account(
                owner=lead.owner,
                organization=lead.organization,
                access=lead.access,
                account_type='prospect',
                name=lead.company
            )
            account_key = account.put_async()
            account_key_async = account_key.get_result()
            account_id = str(account_key_async.id())
            data = {'id': account_key_async.id()}
            account.put_index(data)
            Edge.insert(
                start_node=account_key_async,
                end_node=contact_key_async,
                kind='contacts',
                inverse_edge='parents'
            )
            EndpointsHelper.update_edge_indexes(
                parent_key=contact_key_async,
                kind='contacts',
                indexed_edge=account_id
            )
        tag_list = Tag.list_by_parent(lead.key)
        for tag in tag_list:
            new_tag = Tag(
                owner=contact.owner,
                name=tag.name,
                color=tag.color,
                about_kind='Contact',
                organization=contact.organization
            )
            tag_key = new_tag.put_async()
            tag_key_async = tag_key.get_result()
            edge_key = Edge.insert(
                start_node=contact_key_async,
                end_node=tag_key_async,
                kind='tags',
                inverse_edge='tagged_on'
            )
            EndpointsHelper.update_edge_indexes(
                parent_key=contact_key_async,
                kind='tags',
                indexed_edge=str(tag_key_async.id())
            )
            tag_edge_key = ndb.Key(urlsafe=tag.edgeKey)
            tag_edge_key.delete()
        edge_list = Edge.query(Edge.start_node == lead.key).fetch()
        for edge in edge_list:
            Edge.move(edge, contact_key_async)

        # add additional edges between the account and opportunities attached to the lead
        if lead.company:
            if account_key_async:
                opportunities_edge_list = Edge.list(
                    start_node=lead.key,
                    kind='opportunities'
                )
                for item in opportunities_edge_list['items']:
                    Edge.insert(start_node=account_key_async,
                                end_node=item.end_node,
                                kind='opportunities',
                                inverse_edge='parents')
                    EndpointsHelper.update_edge_indexes(
                        parent_key=item.end_node,
                        kind='opportunities',
                        indexed_edge=str(account_key_async.id())
                    )

        lead.key.delete()
        EndpointsHelper.delete_document_from_index(id=request.id)
        # Reports.add_lead(user_from_email,nbr=-1)
        # Reports.add_contact(user_from_email)
        return LeadSchema(id=str(contact_key_async.id()))

    @classmethod
    def patch(cls, user_from_email, request):
        lead = cls.get_by_id(int(request.id))
        print lead
        print lead.owner == user_from_email.google_user_id , user_from_email.is_admin
        if lead is None :
            raise endpoints.NotFoundException('Lead not found.')
        if (lead.owner != user_from_email.google_user_id) and not user_from_email.is_admin:
            raise endpoints.ForbiddenException('you are not the owner')
        EndpointsHelper.share_related_documents_after_patch(
            user_from_email,
            lead,
            request
        )
        properties = ['owner', 'firstname', 'lastname', 'company', 'title',
                      'tagline', 'introduction', 'source', 'status', 'access',
                      'profile_img_id', 'profile_img_url', 'industry', 'linkedin_url', 'cover_image']
        for p in properties:
            if hasattr(request, p):
                if (eval('lead.' + p) != eval('request.' + p)) \
                        and (eval('request.' + p) and not (p in ['put', 'set_perm', 'put_index'])):
                    exec ('lead.' + p + '= request.' + p)

        if request.linkedin_profile :
            if lead.linkedin_profile :
                linkedin_profile = lead.linkedin_profile.get()
                linkedin_profile.lastname = request.linkedin_profile.lastname
                linkedin_profile.firstname = request.linkedin_profile.firstname
                linkedin_profile.industry =  request.linkedin_profile.industry
                linkedin_profile.locality =  request.linkedin_profile.locality
                linkedin_profile.headline =  request.linkedin_profile.title
                linkedin_profile.current_post =  request.linkedin_profile.current_post or []
                linkedin_profile.past_post=request.linkedin_profile.past_post or []
                linkedin_profile.formations=request.linkedin_profile.formations
                linkedin_profile.websites=request.linkedin_profile.websites
                linkedin_profile.relation=request.linkedin_profile.relation
                linkedin_profile.experiences=request.linkedin_profile.experiences
                linkedin_profile.resume=request.linkedin_profile.resume
                linkedin_profile.certifications=request.linkedin_profile.certifications
                linkedin_profile.skills=request.linkedin_profile.skills
                linkedin_profile.url=request.linkedin_profile.url
                linkedin_profile.languages=request.linkedin_profile.languages
                linkedin_profile.phones=request.linkedin_profile.phones
                linkedin_profile.emails=request.linkedin_profile.emails
                linkedin_profile.put()
            else:
                linkedin_profile = model.LinkedinProfile(
                    lastname = request.linkedin_profile.lastname ,
                    firstname = request.linkedin_profile.firstname ,
                    industry =  request.linkedin_profile.industry ,
                    locality =  request.linkedin_profile.locality ,
                    headline =  request.linkedin_profile.title ,
                    current_post =  request.linkedin_profile.current_post or [] ,
                    past_post=request.linkedin_profile.past_post or [] ,
                    formations=request.linkedin_profile.formations ,
                    websites=request.linkedin_profile.websites ,
                    relation=request.linkedin_profile.relation ,
                    experiences=request.linkedin_profile.experiences ,
                    resume=request.linkedin_profile.resume ,
                    certifications=request.linkedin_profile.certifications ,
                    skills=request.linkedin_profile.skills ,
                    url=request.linkedin_profile.url ,
                    languages=request.linkedin_profile.languages ,
                    phones=request.linkedin_profile.phones ,
                    emails=request.linkedin_profile.emails ,
                )
                linkedin_profile_key= linkedin_profile.put()
                lead.linkedin_profile=linkedin_profile_key

        lead_key_async = lead.put_async().get_result()
        new_lead = request
        info_nodes = Node.list_info_nodes(lead_key_async, None)
        info_nodes_structured = Node.to_structured_data(info_nodes)
        emails = None
        if 'emails' in info_nodes_structured.keys():
            emails = info_nodes_structured['emails']
        for email in new_lead.emails:
            is_exist = False
            if emails:
                for em in emails.items:
                    if em.email == email.email:
                        is_exist = True
                        break
            if not is_exist:
                Node.insert_info_node(
                    lead_key_async,
                    iomessages.InfoNodeRequestSchema(
                        kind='emails',
                        fields=[
                            iomessages.RecordSchema(
                                field='email',
                                value=email.email
                            )
                        ]
                    )
                )
        addresses = None
        if 'addresses' in info_nodes_structured.keys():
            addresses = info_nodes_structured['addresses']

        for address in new_lead.addresses:
            is_exist = False
            if addresses:
                for em in addresses.items:
                    if em.formatted == address.formatted:
                        is_exist = True
                        break
            if not is_exist:
                Node.insert_info_node(
                    lead_key_async,
                    iomessages.InfoNodeRequestSchema(
                        kind='addresses',
                        fields=[
                            iomessages.RecordSchema(
                                field='street',
                                value=address.street
                            ),
                            iomessages.RecordSchema(
                                field='city',
                                value=address.city
                            ),
                            iomessages.RecordSchema(
                                field='state',
                                value=address.state
                            ),
                            iomessages.RecordSchema(
                                field='postal_code',
                                value=address.postal_code
                            ),
                            iomessages.RecordSchema(
                                field='country',
                                value=address.country
                            ),
                            iomessages.RecordSchema(
                                field='formatted',
                                value=address.formatted
                            )
                        ]
                    )
                )

        phones = None
        if 'phones' in info_nodes_structured.keys():
            phones = info_nodes_structured['phones']
        for phone in new_lead.phones:
            is_exist = False
            if phones:
                for em in phones.items:
                    if em.number == phone.number:
                        is_exist = True
                        break
            if not is_exist:
                Node.insert_info_node(
                    lead_key_async,
                    iomessages.InfoNodeRequestSchema(
                        kind='phones',
                        fields=[
                            iomessages.RecordSchema(
                                field='type',
                                value=phone.type
                            ),
                            iomessages.RecordSchema(
                                field='number',
                                value=phone.number
                            )
                        ]
                    )

                )
        for info_node in new_lead.infonodes:
            is_exist = contacts.is_the_same_node(info_node, info_nodes_structured)
            if not is_exist:
                Node.insert_info_node(
                    lead_key_async,
                    iomessages.InfoNodeRequestSchema(
                        kind=info_node.kind,
                        fields=info_node.fields
                    )
                )
        for note in new_lead.notes:
            note_author = model.Userinfo()
            note_author.display_name = user_from_email.google_display_name
            note_author.photo = user_from_email.google_public_profile_photo_url
            note = Note(
                owner=user_from_email.google_user_id,
                organization=user_from_email.organization,
                author=note_author,
                title=note.title,
                content=note.content
            )
            entity_key_async = note.put_async()
            entity_key = entity_key_async.get_result()
            Edge.insert(
                start_node=lead_key_async,
                end_node=entity_key,
                kind='topics',
                inverse_edge='parents'
            )
            EndpointsHelper.update_edge_indexes(
                parent_key=lead_key_async,
                kind='topics',
                indexed_edge=str(entity_key.id())
            )

        data = EndpointsHelper.get_data_from_index(str(lead.key.id()))
        lead.put_index(data)
        get_schema_request = LeadGetRequest(id=int(request.id))
        return cls.get_schema(user_from_email, get_schema_request)

    @classmethod
    def get_key_by_name(cls, user_from_email, firstname, lastname):
        lead = cls.query(
            cls.firstname == firstname,
            cls.lastname == lastname,
            cls.organization == user_from_email.organization
        ).get()
        if lead:
            return lead.key
        return None

    @classmethod
    def import_from_outlook_csv(cls, user_from_email, request, csv_file):
        empty_string = lambda x: x if x else ""
        csvreader = csv.reader(csv_file.splitlines())
        headings = csvreader.next()
        imported_accounts = {}
        for row in csvreader:
            try:
                contact_request = ContactInsertRequest(
                    firstname=empty_string(unicode(row[0], errors='ignore')),
                    lastname=empty_string(unicode(row[2], errors='ignore')),
                    title=empty_string(unicode(row[43], errors='ignore')),
                    emails=EndpointsHelper.import_emails_from_outlook(row),
                    phones=EndpointsHelper.import_phones_from_outlook(row),
                    addresses=EndpointsHelper.import_addresses_from_outlook(row),
                    access='public'
                )
                if row[42]:
                    from iomodels.crmengine.accounts import Account
                    # Check if the account exist to not duplicate it
                    if row[42] in imported_accounts.keys():
                        # check first if in those imported accounts
                        account_key_async = imported_accounts[row[42]]
                    else:
                        # search if it exists in the datastore
                        account = Account.get_key_by_name(
                            user_from_email=user_from_email,
                            name=row[42]
                        )
                        if account:
                            account_key_async = account
                        else:
                            # the account doesn't exist, create it
                            account = Account(
                                name=row[42],
                                owner=user_from_email.google_user_id,
                                organization=user_from_email.organization,
                                access='public'
                            )
                            account_key = account.put_async()
                            account_key_async = account_key.get_result()
                            data = {'id': account_key_async.id()}
                            account.put_index(data)
                            # add the account to imported accounts dictionary
                        imported_accounts[row[42]] = account_key_async
                    contact_request.account = account_key_async.urlsafe()
                cls.insert(user_from_email, contact_request)
            except:
                print 'an error has occured'

    @classmethod
    def import_from_outlook_csv(cls, user_from_email, request, csv_file):
        empty_string = lambda x: x if x else ""
        csvreader = csv.reader(csv_file.splitlines())
        headings = csvreader.next()
        imported_accounts = {}
        for row in csvreader:
            try:
                contact_request = LeadInsertRequest(
                    firstname=empty_string(unicode(row[0], errors='ignore')),
                    lastname=empty_string(unicode(row[2], errors='ignore')),
                    title=empty_string(unicode(row[43], errors='ignore')),
                    emails=EndpointsHelper.import_emails_from_outlook(row),
                    phones=EndpointsHelper.import_phones_from_outlook(row),
                    addresses=EndpointsHelper.import_addresses_from_outlook(row),
                    access='public'
                )
                if row[42]:
                    contact_request.company = row[42]
                cls.insert(user_from_email, contact_request)
            except:
                print 'an error has occured'

    @classmethod
    def export_csv_data(cls, user_from_email, request):
        selected_leads = True
        if not request.selectedKeys:
            selected_leads = False
        leads = Lead.query().filter(cls.organization == user_from_email.organization).fetch()
        leads_list = []
        for lead in leads:
            if selected_leads:
                get_lead = False
                for key in request.selectedKeys:
                    if key.leadKey == lead.key.urlsafe():
                        get_lead = True
                if not get_lead:
                    continue
            infonodes = Node.list_info_nodes(
                parent_key=lead.key,
                request=request
            )

            infonodes_structured = Node.to_structured_data(infonodes)
            # adress_structured=Node.to_structured_adress(infonodes)
            emails = None
            if 'emails' in infonodes_structured.keys():
                emails = infonodes_structured['emails']
            phones = None
            if 'phones' in infonodes_structured.keys():
                phones = infonodes_structured['phones']
            addresses = None
            if 'addresses' in infonodes_structured.keys():
                addresses = infonodes_structured['addresses']
            # customfields=None
            # if 'customfields' in infonodes_structured.keys():
            #     customfields=infonodes_structured['customfields']
            kwargs = {
                'firstname': lead.firstname,
                'lastname': lead.lastname,
                'source': lead.source,
                'company': lead.company,
                'emails': emails,
                'phones': phones,
                'addresses': addresses
            }
            leads_list.append(kwargs)
        return LeadExportListResponse(items=leads_list)

    @classmethod
    def import_from_csv(cls, user_from_email, request):
        # read the csv file from Google Drive
        csv_file = EndpointsHelper.import_file(user_from_email, request.file_id)
        ts = time.time()
        file_name = user_from_email.email + '_' + str(ts) + '.csv'
        EndpointsHelper.create_gs_file(file_name, csv_file)
        if request.file_type == 'outlook':
            cls.import_from_outlook_csv(user_from_email, request, csv_file)
        else:
            csvreader = csv.reader(csv_file.splitlines())
            headings = csvreader.next()
            i = 0
            # search for the matched columns in this csv
            # the mapping rules are in ATTRIBUTES_MATCHING
            matched_columns = {}
            for column in headings:
                for key in ATTRIBUTES_MATCHING.keys():
                    for index in ATTRIBUTES_MATCHING[key]:
                        pattern = '%s' % index
                        regex = re.compile(pattern)
                        match = regex.search(column)
                        if match:
                            matched_columns[i] = key
                i = i + 1
            # if is there some columns that match our mapping rules
            if len(matched_columns) > 0:
                # parse each row in the csv
                i = 0
                for row in csvreader:
                    try:
                        contact = {}
                        for key in matched_columns.keys():
                            if row[key]:
                                if matched_columns[key] in contact.keys():
                                    new_list = []
                                    if isinstance(contact[matched_columns[key]], list):
                                        existing_list = contact[matched_columns[key]]
                                        existing_list.append(unicode(row[key], errors='ignore'))
                                        contact[matched_columns[key]] = existing_list
                                    else:
                                        new_list.append(contact[matched_columns[key]])
                                        new_list.append(unicode(row[key], errors='ignore'))
                                        contact[matched_columns[key]] = new_list
                                else:
                                    contact[matched_columns[key]] = row[key].decode('cp1252')
                        # check if the contact has required fields
                        if 'firstname' in contact.keys() and 'lastname' in contact.keys():
                            # insert contact
                            contact_key_async = None
                            if contact_key_async is None:
                                for index in matched_columns:
                                    if matched_columns[index] not in contact.keys():
                                        contact[matched_columns[index]] = None

                                if (hasattr(contact, 'title')) == False:
                                    contact['title'] = ""
                                if (hasattr(contact, 'company')) == False:
                                    contact['company'] = ""
                                imported_contact = cls(
                                    firstname=contact['firstname'],
                                    lastname=contact['lastname'],
                                    title=contact['title'],
                                    company=contact['company'],
                                    owner=user_from_email.google_user_id,
                                    organization=user_from_email.organization,
                                    access='public'
                                )
                                contact_key = imported_contact.put_async()
                                contact_key_async = contact_key.get_result()
                            # insert info nodes
                            for attribute in contact.keys():
                                if contact[attribute]:
                                    if attribute in INFO_NODES.keys():
                                        # check if we have multiple value
                                        if isinstance(contact[attribute], list):
                                            for value in contact[attribute]:
                                                node = Node(kind=attribute)
                                                kind_dict = INFO_NODES[attribute]
                                                default_field = kind_dict['default_field']
                                                setattr(
                                                    node,
                                                    default_field,
                                                    value
                                                )
                                                entityKey_async = node.put_async()
                                                entityKey = entityKey_async.get_result()
                                                Edge.insert(
                                                    start_node=contact_key_async,
                                                    end_node=entityKey,
                                                    kind='infos',
                                                    inverse_edge='parents'
                                                )
                                                indexed_edge = '_' + attribute + ' ' + value
                                                EndpointsHelper.update_edge_indexes(
                                                    parent_key=contact_key_async,
                                                    kind='infos',
                                                    indexed_edge=smart_str(indexed_edge)
                                                )
                                        # signle info node                                            )
                                        else:
                                            node = Node(kind=attribute)
                                            kind_dict = INFO_NODES[attribute]
                                            default_field = kind_dict['default_field']
                                            setattr(
                                                node,
                                                default_field,
                                                contact[attribute]
                                            )
                                            entityKey_async = node.put_async()
                                            entityKey = entityKey_async.get_result()
                                            Edge.insert(
                                                start_node=contact_key_async,
                                                end_node=entityKey,
                                                kind='infos',
                                                inverse_edge='parents'
                                            )
                                            indexed_edge = '_' + attribute + ' ' + contact[attribute]
                                            EndpointsHelper.update_edge_indexes(
                                                parent_key=contact_key_async,
                                                kind='infos',
                                                indexed_edge=smart_str(indexed_edge)
                                            )
                    except Exception, e:
                        print 'an error has occured'
                        print e
                    i = i + 1

    @classmethod
    def import_row(cls, user_from_email, row, matched_columns, customfields_columns):
        # try:
        contact = {}
        contact_key_async = None
        for key in matched_columns.keys():
            key = int(key)
            if row[key]:
                if matched_columns[key] in contact.keys():
                    new_list = []
                    if isinstance(contact[matched_columns[key]], list):
                        existing_list = contact[matched_columns[key]]
                        existing_list.append(row[key])
                        contact[matched_columns[key]] = existing_list
                    else:
                        new_list.append(contact[matched_columns[key]])
                        new_list.append(row[key])
                        contact[matched_columns[key]] = new_list
                else:
                    contact[matched_columns[key]] = row[key]
        required_fields = False
        print '---------------------------------------------------------------'
        print contact
        print '---------------------------------------------------------------'
        # check if the contact has required fields
        if 'firstname' in contact.keys() and 'lastname' in contact.keys():
            if isinstance(contact['firstname'], basestring):
                name = contact['firstname'] + ' ' + contact['lastname']
                required_fields = True
        elif 'fullname' in contact.keys() and isinstance(contact['fullname'], basestring):
            name = contact['fullname']
            contact['firstname'] = name.split()[0]
            contact['lastname'] = " ".join(name.split()[1:])
            required_fields = True
        if required_fields:
            # check if this contact exist
            contact_key_async = cls.get_key_by_name(
                user_from_email=user_from_email,
                firstname=contact['firstname'],
                lastname=contact['lastname']
            )
            if contact_key_async is None:
                for index in matched_columns:
                    if matched_columns[index] not in contact.keys():
                        contact[matched_columns[index]] = None
                imported_contact = cls(
                    firstname=contact['firstname'],
                    lastname=contact['lastname'],
                    owner=user_from_email.google_user_id,
                    organization=user_from_email.organization,
                    access='public'
                )
                if 'company' in contact.keys():
                    imported_contact.company = contact['company']
                if 'title' in contact.keys():
                    imported_contact.title = contact['title']
                contact_key = imported_contact.put_async()
                contact_key_async = contact_key.get_result()
                # insert the edge between the contact and related account
                data = {'id': contact_key_async.id()}
                imported_contact.put_index(data)
            # insert info nodes
            for attribute in contact.keys():
                if contact[attribute]:
                    if attribute in INFO_NODES.keys():
                        # check if we have multiple value
                        if isinstance(contact[attribute], list):
                            for value in contact[attribute]:
                                node = Node(kind=attribute)
                                kind_dict = INFO_NODES[attribute]
                                default_field = kind_dict['default_field']
                                setattr(
                                    node,
                                    default_field,
                                    value
                                )
                                entityKey_async = node.put_async()
                                entityKey = entityKey_async.get_result()
                                Edge.insert(
                                    start_node=contact_key_async,
                                    end_node=entityKey,
                                    kind='infos',
                                    inverse_edge='parents'
                                )
                                indexed_edge = '_' + attribute + ' ' + value
                                EndpointsHelper.update_edge_indexes(
                                    parent_key=contact_key_async,
                                    kind='infos',
                                    indexed_edge=smart_str(indexed_edge)
                                )
                        # signle info node                                            )
                        else:
                            node = Node(kind=attribute)
                            kind_dict = INFO_NODES[attribute]
                            default_field = kind_dict['default_field']
                            setattr(
                                node,
                                default_field,
                                contact[attribute]
                            )
                            entityKey_async = node.put_async()
                            entityKey = entityKey_async.get_result()
                            Edge.insert(
                                start_node=contact_key_async,
                                end_node=entityKey,
                                kind='infos',
                                inverse_edge='parents'
                            )
                            indexed_edge = '_' + smart_str(attribute) + ' ' + contact[smart_str(attribute)]
                            EndpointsHelper.update_edge_indexes(
                                parent_key=contact_key_async,
                                kind='infos',
                                indexed_edge=smart_str(indexed_edge)
                            )
        if contact_key_async:
            for key in customfields_columns.keys():
                if row[key]:
                    Node.insert_info_node(
                        contact_key_async,
                        iomessages.InfoNodeRequestSchema(
                            kind='customfields',
                            fields=[
                                iomessages.RecordSchema(
                                    field=customfields_columns[key],
                                    value=row[key]
                                )
                            ]
                        )
                    )

    @classmethod
    def import_from_csv_first_step(cls, user_from_email, request):
        # read the csv file from Google Drive
        csv_file = EndpointsHelper.import_file(user_from_email, request.file_id)
        ts = time.time()
        file_name = user_from_email.email + '_' + str(ts) + '.csv'
        EndpointsHelper.create_gs_file(file_name, csv_file)
        bucket_name = app_identity.get_default_gcs_bucket_name()
        objects = [file_name]
        file_path = '/' + bucket_name + '/' + file_name
        csvreader = csv.reader(csv_file.splitlines())
        headings = csvreader.next()
        i = 0
        # search for the matched columns in this csv
        # the mapping rules are in ATTRIBUTES_MATCHING
        matched_columns = {}
        customfields_columns = {}
        for column in headings:
            matched = False
            for key in ATTRIBUTES_MATCHING.keys():
                for index in ATTRIBUTES_MATCHING[key]:
                    pattern = '%s' % index
                    regex = re.compile(pattern)
                    match = regex.search(column)
                    if match:
                        matched_columns[i] = key
                        matched = True
            if matched == False:
                customfields_columns[i] = column.decode('cp1252')
            i = i + 1
        imported_accounts = {}
        items = []
        row = csvreader.next()
        try:
            for k in range(0, i):
                if k in matched_columns.keys():
                    matched_column = matched_columns[k].decode('cp1252')
                else:
                    matched_column = None
                mapping_column = iomessages.MappingSchema(
                    key=k,
                    source_column=headings[k].decode('cp1252'),
                    matched_column=matched_column,
                    example_record=row[k].decode('cp1252')
                )
                items.append(mapping_column)
        except IndexError:
            print "index_out_of_range"
            pass
        number_of_records = sum(1 for r in csvreader) + 1
        # create a job that contains the following informations
        import_job = model.ImportJob(
            file_path=file_path,
            sub_jobs=number_of_records,
            stage='mapping',
            user=user_from_email.key)
        import_job.put()
        mapping_response = iomessages.MappingJobResponse(
            job_id=import_job.key.id(),
            number_of_records=number_of_records,
            items=items
        )
        return mapping_response

    @classmethod
    def import_from_csv_second_step(cls, user_from_email, job_id, items, token=None):
        import_job = model.ImportJob.get_by_id(job_id)
        matched_columns = {}
        customfields_columns = {}

        for item in items:
            if item['matched_column']:
                if item['matched_column'] == 'customfields':
                    customfields_columns[item['key']] = item['source_column']
                else:
                    matched_columns[item['key']] = item['matched_column']

        params = {
            'job_id': job_id,
            'file_path': import_job.file_path,
            'token': token,
            'matched_columns': matched_columns,
            'customfields_columns': customfields_columns
        }
        r = requests.post("http://104.154.83.131:8080/api/import_leads", data=json.dumps(params))

    @classmethod
    def merge(cls, request, user_from_email):
        lead = cls.get_by_id(int(request.base_id))
        new_lead = request.new_lead
        lead.company = new_lead.company or lead.company
        lead.title = new_lead.title or lead.title
        lead.industry = new_lead.industry or lead.industry
        lead.profile_img_id = new_lead.profile_img_id or lead.profile_img_id
        lead.profile_img_url = new_lead.profile_img_url or lead.profile_img_url
        lead_key = lead.put_async()
        lead_key_async = lead_key.get_result()
        info_nodes = Node.list_info_nodes(lead_key_async, None)
        info_nodes_structured = Node.to_structured_data(info_nodes)
        emails = None
        if 'emails' in info_nodes_structured.keys():
            emails = info_nodes_structured['emails']
        for email in new_lead.emails:
            is_exist = False
            if emails:
                for em in emails.items:
                    if em.email == email.email:
                        is_exist = True
                        break
            if not is_exist:
                Node.insert_info_node(
                    lead_key_async,
                    iomessages.InfoNodeRequestSchema(
                        kind='emails',
                        fields=[
                            iomessages.RecordSchema(
                                field='email',
                                value=email.email
                            )
                        ]
                    )
                )
        phones = None
        if 'phones' in info_nodes_structured.keys():
            phones = info_nodes_structured['phones']
        for phone in new_lead.phones:
            is_exist = False
            if phones:
                for em in phones.items:
                    if em.number == phone.number:
                        is_exist = True
                        break
            if not is_exist:
                Node.insert_info_node(
                    lead_key_async,
                    iomessages.InfoNodeRequestSchema(
                        kind='phones',
                        fields=[
                            iomessages.RecordSchema(
                                field='type',
                                value=phone.type
                            ),
                            iomessages.RecordSchema(
                                field='number',
                                value=phone.number
                            )
                        ]
                    )

                )
        for info_node in new_lead.infonodes:
            is_exist = contacts.is_the_same_node(info_node, info_nodes_structured)
            if not is_exist:
                Node.insert_info_node(
                    lead_key_async,
                    iomessages.InfoNodeRequestSchema(
                        kind=info_node.kind,
                        fields=info_node.fields
                    )
                )
        for note in new_lead.notes:
            note_author = model.Userinfo()
            note_author.display_name = user_from_email.google_display_name
            note_author.photo = user_from_email.google_public_profile_photo_url
            note = Note(
                owner=user_from_email.google_user_id,
                organization=user_from_email.organization,
                author=note_author,
                title=note.title,
                content=note.content
            )
            entityKey_async = note.put_async()
            entityKey = entityKey_async.get_result()
            Edge.insert(
                start_node=lead_key_async,
                end_node=entityKey,
                kind='topics',
                inverse_edge='parents'
            )
            EndpointsHelper.update_edge_indexes(
                parent_key=lead_key_async,
                kind='topics',
                indexed_edge=str(entityKey.id())
            )

        lead_schema = LeadSchema(
            id=str(lead.key.id()),
            entityKey=lead.key.urlsafe(),
            firstname=lead.firstname,
            lastname=lead.lastname,
            title=lead.title,
            company=lead.company,
            profile_img_id=lead.profile_img_id,
            profile_img_url=lead.profile_img_url,
            linkedin_url=lead.linkedin_url,
            access=lead.access,
            created_at=lead.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
            updated_at=lead.updated_at.strftime("%Y-%m-%dT%H:%M:00.000")
        )
        return lead_schema

    @classmethod
    def create_lead_full_contact(cls, contact, user, access):
        name = contact.name
        given_name = None
        family_name = None
        if name:
            given_name = name.givenName
            family_name = name.familyName

        # first_name=given_name, last_name=family_name, photos=photos, urls=urls,
        # emails=emails, phone_numbers=phone_numbers, organizations=organizations,
        # accounts=accounts
        first_name = str(given_name).lower()
        last_name = str(family_name).lower()
        contact_organizations = contact.organizations

        is_not_organization = not len(contact_organizations)
        lead = cls(
            firstname=first_name,
            lastname=last_name,
            status="New",
            owner=user.google_user_id,
            organization=user.organization,
            access=access,
            company=None if is_not_organization else contact_organizations[0].name,
            title=None if is_not_organization else contact_organizations[0].title
        )
        lead_key = lead.put_async()
        lead_key_async = lead_key.get_result()
        for email in contact.emails:
            Node.insert_info_node(
                lead_key_async,
                iomessages.InfoNodeRequestSchema(
                    kind='emails',
                    fields=[
                        iomessages.RecordSchema(
                            field='email',
                            value=email.value
                        )
                    ]
                )
            )

        for url in contact.urls:
            Node.insert_info_node(
                lead_key_async,
                iomessages.InfoNodeRequestSchema(
                    kind='websites',
                    fields=[
                        iomessages.RecordSchema(
                            field='url',
                            value=url.value
                        )
                    ]
                )
            )
        for account in contact.accounts:
            Node.insert_info_node(
                lead_key_async,
                iomessages.InfoNodeRequestSchema(
                    kind='sociallinks',
                    fields=[
                        iomessages.RecordSchema(
                            field='url',
                            value=account.urlString
                        )
                    ]
                )
            )
        for phone in contact.phoneNumbers:
            Node.insert_info_node(
                lead_key_async,
                iomessages.InfoNodeRequestSchema(
                    kind='phones',
                    fields=[
                        iomessages.RecordSchema(
                            field='type',
                            value=phone.type
                        ),
                        iomessages.RecordSchema(
                            field='number',
                            value=phone.value
                        )
                    ]
                )
            )

 #!/usr/bin/python
 # -*- coding: utf-8 -*-
import endpoints
import csv
import re
import json
from StringIO import StringIO
from django.utils.encoding import smart_str
from google.appengine.ext import ndb
from google.appengine.api import taskqueue
from google.appengine.datastore.datastore_query import Cursor
from endpoints_proto_datastore.ndb import EndpointsModel
from google.appengine.api import search
import gdata.contacts.data
from protorpc import messages
from search_helper import tokenize_autocomplete,SEARCH_QUERY_MODEL
from endpoints_helper import EndpointsHelper
from iomodels.crmengine.tags import Tag,TagSchema
from iomodels.crmengine.tasks import Task,TaskRequest,TaskListResponse
from iomodels.crmengine.events import Event,EventListResponse
from iograph import Node,Edge,InfoNodeListResponse
from iomodels.crmengine.notes import Note,TopicListResponse
from iomodels.crmengine.opportunities import Opportunity,OpportunityListResponse
from iomodels.crmengine.cases import Case,CaseListResponse
from iomodels.crmengine.documents import Document,DocumentListResponse
import model
import iomessages

ATTRIBUTES_MATCHING = {
    'firstname' : ['First Name', 'Given Name', 'First name'],
    'lastname':['Last Name', 'Family Name', 'Last name'],
    'title': ['Job Title', r'Organization\s*\d\s*-\s*Title', 'Title'],
    'account' : ['Company', r'Organization\s*\d\s*-\s*Name'],
    'phones': [
                'Primary Phone','Home Phone', 'Mobile Phone', r'Phone\s*\d\s*-\s*Value',
                'Phone number - Work', 'Phone number - Mobile', 'Phone number - Home', 'Phone number - Other'
            ],
    'emails': [
                'E-mail Address', r'E-mail\s*\d\s*Address', r'E-mail\s*\d\s*-\s*Value',
                'Email address - Work', 'Email address - Home', 'Email address - Other'
            ],
    'addresses' : [
                'Business Address', r'Address\s*\d\s*-\s*Formatted',
                'Address - Work Street', 'Address - Work City', 'Address - Home Street', 'Address - Home City'
            ]
}

INFO_NODES = {
    'phones' : {'default_field' : 'number'},
    'emails' : {'default_field' : 'email'},
    'addresses' : {'default_field' : 'formatted'}
}


class ContactImportHighriseRequest(messages.Message):
    key=messages.StringField(1, required=True)
    server_name=messages.StringField(2, required=True)

class ContactHighriseSchema(messages.Message):
    id=messages.IntegerField(1)
    first_name=messages.StringField(2)
    last_name=messages.StringField(3)
    title=messages.StringField(4)
    created_at=messages.StringField(5)
    visible_to=messages.StringField(6)
    updated_at=messages.StringField(7)
    company_id=messages.IntegerField(8)
    avatar_url=messages.StringField(9)
    company_name=messages.StringField(10)
    _server=messages.StringField(11)
    twitter_accounts=messages.StringField(12)
    instant_messengers=messages.StringField(13)
    phone_numbers=messages.StringField(14)
    email_addresses=messages.StringField(15)

class ContactHighriseResponse(messages.Message):
    items = messages.MessageField(ContactHighriseSchema, 1, repeated=True)

class ContactImportRequest(messages.Message):
    file_id = messages.StringField(1,required=True)
# The message class that defines the EntityKey schema
class EntityKeyRequest(messages.Message):
    entityKey = messages.StringField(1)

 # The message class that defines the ListRequest schema
class ListRequest(messages.Message):
    limit = messages.IntegerField(1)
    pageToken = messages.StringField(2)

class AccountSchema(messages.Message):
    id = messages.IntegerField(1)
    entityKey = messages.StringField(2)
    name = messages.StringField(3)

class ContactGetRequest(messages.Message):
    id = messages.IntegerField(1,required = True)
    topics = messages.MessageField(ListRequest, 2)
    tasks = messages.MessageField(ListRequest, 3)
    events = messages.MessageField(ListRequest, 4)
    opportunities = messages.MessageField(ListRequest, 5)
    cases = messages.MessageField(ListRequest, 6)
    documents = messages.MessageField(ListRequest, 7)

class ContactInsertRequest(messages.Message):
    account = messages.StringField(1)
    firstname = messages.StringField(2)
    lastname = messages.StringField(3)
    title = messages.StringField(4)
    access = messages.StringField(5)
    tagline = messages.StringField(6)
    introduction = messages.StringField(7)
    phones = messages.MessageField(iomessages.PhoneSchema,8, repeated = True)
    emails = messages.MessageField(iomessages.EmailSchema,9, repeated = True)
    addresses = messages.MessageField(iomessages.AddressSchema,10, repeated = True)
    infonodes = messages.MessageField(iomessages.InfoNodeRequestSchema,11, repeated = True)
    profile_img_id = messages.StringField(12)
    profile_img_url = messages.StringField(13)

class ContactSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    firstname = messages.StringField(3)
    lastname = messages.StringField(4)
    account = messages.MessageField(AccountSchema,5)
    title = messages.StringField(6)
    tagline = messages.StringField(7)
    introduction = messages.StringField(8)
    infonodes = messages.MessageField(InfoNodeListResponse,9)
    topics = messages.MessageField(TopicListResponse,10)
    tasks = messages.MessageField(TaskListResponse,11)
    events = messages.MessageField(EventListResponse,12)
    documents = messages.MessageField(DocumentListResponse,13)
    opportunities = messages.MessageField(OpportunityListResponse,14)
    cases = messages.MessageField(CaseListResponse,15)
    tags = messages.MessageField(TagSchema,16, repeated = True)
    created_at = messages.StringField(17)
    updated_at = messages.StringField(18)
    access = messages.StringField(19)
    phones = messages.MessageField(iomessages.PhoneListSchema,20)
    emails = messages.MessageField(iomessages.EmailListSchema,21)
    addresses = messages.MessageField(iomessages.AddressListSchema,22)
    profile_img_id = messages.StringField(23)
    profile_img_url = messages.StringField(24)

class ContactListRequest(messages.Message):
    limit = messages.IntegerField(1)
    pageToken = messages.StringField(2)
    order = messages.StringField(3)
    tags = messages.StringField(4,repeated = True)
    owner = messages.StringField(5)

class ContactListResponse(messages.Message):
    items = messages.MessageField(ContactSchema, 1, repeated=True)
    nextPageToken = messages.StringField(2)

# The message class that defines the contacts.search response
class ContactSearchResult(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    firstname = messages.StringField(3)
    lastname = messages.StringField(4)
    contacts = messages.StringField(5)
    account = messages.MessageField(AccountSchema,6)
    position = messages.StringField(7)

# The message class that defines a set of contacts.search results
class ContactSearchResults(messages.Message):
    items = messages.MessageField(ContactSearchResult, 1, repeated=True)
    nextPageToken = messages.StringField(2)

class Contact(EndpointsModel):
    _message_fields_schema = ('id','entityKey','owner', 'folder','created_at','updated_at',  'access','collaborators_list','collaborators_ids','display_name', 'firstname','lastname','title','company','account','account_name','introduction','tagline','profile_img_id','profile_img_url')
    # Sharing fields
    owner = ndb.StringProperty()
    collaborators_list = ndb.StructuredProperty(model.Userinfo,repeated=True)
    collaborators_ids = ndb.StringProperty(repeated=True)
    account = ndb.KeyProperty()
    account_name = ndb.StringProperty()
    organization = ndb.KeyProperty()
    folder = ndb.StringProperty()
    firstname = ndb.StringProperty()
    lastname = ndb.StringProperty()
    display_name = ndb.StringProperty(repeated=True)
    title = ndb.StringProperty()
    company = ndb.StringProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    department = ndb.StringProperty()
    description = ndb.StringProperty()

    # public or private
    access = ndb.StringProperty()
    tagline = ndb.StringProperty()
    introduction = ndb.StringProperty()
    phones = ndb.StructuredProperty(model.Phone,repeated=True)
    emails = ndb.StructuredProperty(model.Email,repeated=True)
    addresses = ndb.StructuredProperty(model.Address,repeated=True)
    websites = ndb.StructuredProperty(model.Website,repeated=True)
    sociallinks= ndb.StructuredProperty(model.Social,repeated=True)
    profile_img_id = ndb.StringProperty()
    profile_img_url = ndb.StringProperty()

    def put(self, **kwargs):

        ndb.Model.put(self, **kwargs)
        self.put_index()
        self.set_perm()

    def set_perm(self):
        about_item = str(self.key.id())

        perm = model.Permission(about_kind='Contact',
                         about_item=about_item,
                         type = 'user',
                         role = 'owner',
                         value = self.owner)
        perm.put()


    def put_index(self,data=None):
        empty_string = lambda x: x if x else ""
        collaborators = " ".join(self.collaborators_ids)
        organization = str(self.organization.id())
        emails = " ".join(map(lambda x: x.email,  self.emails))
        phones = " ".join(map(lambda x: x.number,  self.phones))
        websites = " ".join(map(lambda x: x.website,  self.websites))
        title_autocomplete = ','.join(tokenize_autocomplete(self.firstname + ' ' + self.lastname +' '+ empty_string(self.title)+ ' ' +empty_string(self.account_name)))
        #addresses = " \n".join(map(lambda x: " ".join([x.street,x.city,x.state, x.postal_code, x.country]) if x else "", self.addresses))
        if data:
            search_key = ['infos','contacts','tags','collaborators']
            for key in search_key:
                if key not in data.keys():
                    data[key] = ""
            my_document = search.Document(
            doc_id = str(data['id']),
            fields=[
                search.TextField(name=u'type', value=u'Contact'),
                search.TextField(name='title', value = empty_string(self.firstname) + " " + empty_string(self.lastname)),
                search.TextField(name='organization', value = empty_string(organization) ),
                search.TextField(name='entityKey',value=empty_string(self.key.urlsafe())),
                search.TextField(name='access', value = empty_string(self.access) ),
                search.TextField(name='owner', value = empty_string(self.owner) ),
                search.TextField(name='collaborators', value = data['collaborators']  ),
                search.TextField(name='firstname', value = empty_string(self.firstname) ),
                search.TextField(name='lastname', value = empty_string(self.lastname)),
                search.TextField(name='position', value = empty_string(self.title)),
                search.TextField(name='infos', value= data['infos']),
                search.TextField(name='tags', value= data['tags']),
                search.TextField(name='contacts', value= data['contacts']),
                search.TextField(name='title_autocomplete', value = empty_string(title_autocomplete)),
                ])
        else:
            my_document = search.Document(
            doc_id = str(self.key.id()),
            fields=[
                search.TextField(name=u'type', value=u'Contact'),
                search.TextField(name='title', value = empty_string(self.firstname) + " " + empty_string(self.lastname)),
                search.TextField(name='organization', value = empty_string(organization) ),
                search.TextField(name='entityKey',value=empty_string(self.key.urlsafe())),
                search.TextField(name='access', value = empty_string(self.access) ),
                search.TextField(name='owner', value = empty_string(self.owner) ),
                search.TextField(name='firstname', value = empty_string(self.firstname) ),
                search.TextField(name='lastname', value = empty_string(self.lastname)),
                search.TextField(name='position', value = empty_string(self.title)),
                search.TextField(name='title_autocomplete', value = empty_string(title_autocomplete)),
                ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)

    @classmethod
    def get_schema(cls,user_from_email,request):
        contact = Contact.get_by_id(int(request.id))
        if contact is None:
            raise endpoints.NotFoundException('Contact not found.')
        if not Node.check_permission( user_from_email, contact ):
            raise endpoints.UnauthorizedException('You don\'t have permissions.')
        parents_edge_list = Edge.list(
                                    start_node = contact.key,
                                    kind = 'parents',
                                    limit = 1
                                    )
        account_schema = None
        if len(parents_edge_list['items'])>0:
            account = parents_edge_list['items'][0].end_node.get()
            if account:
                account_schema = AccountSchema(
                                        id = int( account.key.id() ),
                                        entityKey = account.key.urlsafe(),
                                        name = account.name
                                        )
        #list of tags related to this account
        tag_list = Tag.list_by_parent(contact.key)
        # list of infonodes
        infonodes = Node.list_info_nodes(
                                        parent_key = contact.key,
                                        request = request
                                        )
        structured_data = Node.to_structured_data(infonodes)
        phones = None
        if 'phones' in structured_data.keys():
            phones = structured_data['phones']
        emails = None
        if 'emails' in structured_data.keys():
            emails = structured_data['emails']
        addresses = None
        if 'addresses' in structured_data.keys():
            addresses = structured_data['addresses']

        #list of topics related to this account
        topics = None
        if request.topics:
            topics = Note.list_by_parent(
                                        parent_key = contact.key,
                                        request = request
                                        )
        tasks = None
        if request.tasks:
            tasks = Task.list_by_parent(
                                        parent_key = contact.key,
                                        request = request
                                        )
        events = None
        if request.events:
            events = Event.list_by_parent(
                                        parent_key = contact.key,
                                        request = request
                                        )
        opportunities = None
        if request.opportunities:
            opportunities = Opportunity.list_by_parent(
                                            user_from_email = user_from_email,
                                            parent_key = contact.key,
                                            request = request
                                            )
        cases = None
        if request.cases:
            cases = Case.list_by_parent(
                                        user_from_email = user_from_email,
                                        parent_key = contact.key,
                                        request = request
                                        )
        documents = None
        if request.documents:
            documents = Document.list_by_parent(
                                        parent_key = contact.key,
                                        request = request
                                        )
        contact_schema = ContactSchema(
                                  id = str( contact.key.id() ),
                                  entityKey = contact.key.urlsafe(),
                                  access = contact.access,
                                  firstname = contact.firstname,
                                  lastname = contact.lastname,
                                  title = contact.title,
                                  account = account_schema,
                                  tagline = contact.tagline,
                                  introduction = contact.introduction,
                                  tags = tag_list,
                                  topics = topics,
                                  tasks = tasks,
                                  events = events,
                                  opportunities = opportunities,
                                  cases = cases,
                                  documents = documents,
                                  infonodes = infonodes,
                                  phones = phones,
                                  emails = emails,
                                  addresses = addresses,
                                  profile_img_id = contact.profile_img_id,
                                  profile_img_url = contact.profile_img_url,
                                  created_at = contact.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                                  updated_at = contact.updated_at.strftime("%Y-%m-%dT%H:%M:00.000")
                                )
        return  contact_schema
    @classmethod
    def list_by_parent(cls,user_from_email,parent_key,request):
        contact_list = []
        you_can_loop = True
        count = 0
        if request.contacts.limit:
            limit = int(request.contacts.limit)
        else:
            limit = 10
        contact_next_curs = request.contacts.pageToken
        while you_can_loop:
            edge_limit = int(request.contacts.limit) - count
            if edge_limit>0:
                contact_edge_list = Edge.list(
                                    start_node = parent_key,
                                    kind='contacts',
                                    limit=edge_limit,
                                    pageToken=contact_next_curs
                                    )
                for edge in contact_edge_list['items']:
                    contact = edge.end_node.get()
                    if Node.check_permission(user_from_email,contact):
                        count = count + 1
                        contact_list.append(
                                    ContactSchema(
                                               id = str(contact.key.id()),
                                               entityKey = contact.key.urlsafe(),
                                               firstname = contact.firstname,
                                               lastname = contact.lastname,
                                               title = contact.title
                                               )
                                    )
                if contact_edge_list['next_curs'] and contact_edge_list['more']:
                    contact_next_curs = contact_edge_list['next_curs'].urlsafe()
                else:
                    you_can_loop = False
                    contact_next_curs = None

            if (count == limit):
                you_can_loop = False

        return ContactListResponse(
                                    items = contact_list,
                                    nextPageToken = contact_next_curs
                                )
        if contact_edge_list['next_curs'] and contact_edge_list['more']:
            contact_next_curs = contact_edge_list['next_curs'].urlsafe()
        else:
            contact_next_curs = None
        return ContactListResponse(
                                    items = contact_list,
                                    nextPageToken = contact_next_curs
                                )
    @classmethod
    def list(cls,user_from_email,request):
        curs = Cursor(urlsafe=request.pageToken)
        if request.limit:
            limit = int(request.limit)
        else:
            limit = 10
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
                    raise AttributeError('Order attribute %s not defined.' % (attr_name,))
                if ascending:
                    contacts, next_curs, more =  cls.query().filter(cls.organization==user_from_email.organization).order(+attr).fetch_page(limit, start_cursor=curs)
                else:
                    contacts, next_curs, more = cls.query().filter(cls.organization==user_from_email.organization).order(-attr).fetch_page(limit, start_cursor=curs)
            else:
                contacts, next_curs, more = cls.query().filter(cls.organization==user_from_email.organization).fetch_page(limit, start_cursor=curs)
            for contact in contacts:
                if count<= limit:
                    is_filtered = True
                    if request.tags and is_filtered:
                        end_node_set = [ndb.Key(urlsafe=tag_key) for tag_key in request.tags]
                        if not Edge.find(start_node=contact.key,kind='tags',end_node_set=end_node_set,operation='AND'):
                            is_filtered = False
                    if request.owner and contact.owner!=request.owner and is_filtered:
                        is_filtered = False
                    if is_filtered and Node.check_permission( user_from_email, contact ):
                        count = count + 1
                        parents_edge_list = Edge.list(
                                                    start_node = contact.key,
                                                    kind = 'parents',
                                                    limit = 1
                                                    )
                        account_schema = None
                        if len(parents_edge_list['items'])>0:
                            account = parents_edge_list['items'][0].end_node.get()
                            if account:
                                account_schema = AccountSchema(
                                                        id = int( account.key.id() ),
                                                        entityKey = account.key.urlsafe(),
                                                        name = account.name
                                                        )
                        #list of tags related to this contact
                        tag_list = Tag.list_by_parent(parent_key = contact.key)
                        contact_schema = ContactSchema(
                                  id = str( contact.key.id() ),
                                  entityKey = contact.key.urlsafe(),
                                  firstname = contact.firstname,
                                  lastname = contact.lastname,
                                  title = contact.title,
                                  account = account_schema,
                                  tags = tag_list,
                                  profile_img_id = contact.profile_img_id,
                                  profile_img_url = contact.profile_img_url,
                                  created_at = contact.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                                  updated_at = contact.updated_at.strftime("%Y-%m-%dT%H:%M:00.000")
                                )
                        items.append(contact_schema)
            if (count == limit):
                you_can_loop = False
            if more and next_curs:
                curs = next_curs
            else:
                you_can_loop = False
        if next_curs and more:
            next_curs_url_safe = next_curs.urlsafe()
        else:
            next_curs_url_safe = None
        return  ContactListResponse(items = items, nextPageToken = next_curs_url_safe)

    @classmethod
    def search(cls,user_from_email,request):
        organization = str(user_from_email.organization.id())
        index = search.Index(name="GlobalIndex")
        #Show only objects where you have permissions
        query_string = SEARCH_QUERY_MODEL % {
                              "type": "Contact",
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
                    account_schema = None
                    for e in scored_document.fields:
                        if e.name in [
                                      "entityKey",
                                      "firstname",
                                      "lastname",
                                      "account",
                                      "contacts",
                                      "position"
                                      ]:
                            kwargs[e.name] = e.value
                            if e.name == 'contacts':
                                #get account_schema related to this contact
                                account_document = index.get( str( e.value ) )
                                if account_document:
                                    account_kwargs = {
                                                      'id':int(e.value)
                                                    }
                                    for field in account_document.fields:
                                        if field.name in ['entityKey','title']:
                                            if field.name == 'title':
                                                account_kwargs['name'] = field.value
                                            else:
                                                account_kwargs[field.name] = field.value
                                    kwargs['account'] = account_kwargs

                    search_results.append(ContactSearchResult(**kwargs))
        except search.Error:
            logging.exception('Search failed')
        return ContactSearchResults(
                                    items=search_results,
                                    nextPageToken=next_cursor
                                    )
    @classmethod
    def insert(cls,user_from_email,request):
        folder_name = request.firstname + ' ' + request.lastname
        contact = cls(
                    firstname = request.firstname,
                    lastname = request.lastname,
                    title = request.title,
                    tagline = request.tagline,
                    introduction = request.introduction,
                    owner = user_from_email.google_user_id,
                    organization = user_from_email.organization,
                    access = request.access,
                    profile_img_id = request.profile_img_id,
                    profile_img_url = request.profile_img_url
                    )
        contact_key = contact.put_async()
        contact_key_async = contact_key.get_result()
        for email in request.emails:
            Node.insert_info_node(
                        contact_key_async,
                        iomessages.InfoNodeRequestSchema(
                                                        kind='emails',
                                                        fields=[
                                                            iomessages.RecordSchema(
                                                            field = 'email',
                                                            value = email.email
                                                            )
                                                        ]
                                                    )
                                                )
        for phone in request.phones:
            Node.insert_info_node(
                        contact_key_async,
                        iomessages.InfoNodeRequestSchema(
                                                        kind='phones',
                                                        fields=[
                                                            iomessages.RecordSchema(
                                                            field = 'type',
                                                            value = phone.type
                                                            ),
                                                            iomessages.RecordSchema(
                                                            field = 'number',
                                                            value = phone.number
                                                            )
                                                        ]
                                                    )
                                                )
        for address in request.addresses:
            Node.insert_info_node(
                        contact_key_async,
                        iomessages.InfoNodeRequestSchema(
                                                        kind='addresses',
                                                        fields=[
                                                            iomessages.RecordSchema(
                                                            field = 'street',
                                                            value = address.street
                                                            ),
                                                            iomessages.RecordSchema(
                                                            field = 'city',
                                                            value = address.city
                                                            ),
                                                            iomessages.RecordSchema(
                                                            field = 'state',
                                                            value = address.state
                                                            ),
                                                            iomessages.RecordSchema(
                                                            field = 'postal_code',
                                                            value = address.postal_code
                                                            ),
                                                            iomessages.RecordSchema(
                                                            field = 'country',
                                                            value = address.country
                                                            ),
                                                            iomessages.RecordSchema(
                                                            field = 'formatted',
                                                            value = address.formatted
                                                            )
                                                        ]
                                                    )
                                                )
        for infonode in request.infonodes:
            Node.insert_info_node(
                        contact_key_async,
                        iomessages.InfoNodeRequestSchema(
                                                        kind = infonode.kind,
                                                        fields = infonode.fields
                                                    )
                                                )
        # taskqueue.add(
        #             url='/workers/createobjectfolder',
        #             params={
        #                     'kind': "Contact",
        #                     'folder_name': folder_name,
        #                     'email': user_from_email.email,
        #                     'obj_key':contact_key_async.urlsafe(),
        #                     'logo_img_id':request.profile_img_id
        #                     }
        #             )
        account_schema = None
        if request.account:
            account_key = ndb.Key(urlsafe=request.account)
            account = account_key.get()
            account_schema = AccountSchema(
                                        id = int( account_key.id() ),
                                        entityKey = request.account,
                                        name = account.name
                                        )
            # insert edges
            Edge.insert(start_node = account_key,
                      end_node = contact_key_async,
                      kind = 'contacts',
                      inverse_edge = 'parents')
            EndpointsHelper.update_edge_indexes(
                                            parent_key = contact_key_async,
                                            kind = 'contacts',
                                            indexed_edge = str(account_key.id())
                                            )

        else:
            data = {}
            data['id'] = contact_key_async.id()
            contact.put_index(data)
        if request.profile_img_id:
            taskqueue.add(
                            url='/workers/sharedocument',
                            params={
                                    'user_email':user_from_email.email,
                                    'access': 'anyone',
                                    'resource_id': request.profile_img_id
                                    }
                        )
        contact_schema = ContactSchema(
                                  id = str( contact_key_async.id() ),
                                  entityKey = contact_key_async.urlsafe(),
                                  firstname = contact.firstname,
                                  lastname = contact.lastname,
                                  title = contact.title,
                                  account = account_schema,
                                  created_at = contact.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                                  updated_at = contact.updated_at.strftime("%Y-%m-%dT%H:%M:00.000")
                                )
        taskqueue.add(
                    url='/workers/sync_contacts',
                    params={
                            'email': user_from_email.email,
                            'id':contact_schema.id
                            }
                    )
        return contact_schema
    @classmethod
    def get_key_by_name(cls,user_from_email,name):
        index = search.Index(name="GlobalIndex")
        options = search.QueryOptions(limit=1)
        query_string = 'type:Contact AND title:\"' + name +'\" AND organization:' + str(user_from_email.organization.id())
        query = search.Query(query_string=query_string, options=options)
        search_results = []
        try:
            if query:
                result = index.search(query)
                results = result.results
                for scored_document in results:
                    kwargs = {
                        'id': scored_document.doc_id
                    }
                    for e in scored_document.fields:
                        if e.name in [
                                      "entityKey",
                                      "firstname",
                                      "lastname",
                                      "account",
                                      "account_name",
                                      "position"
                                      ]:
                            kwargs[e.name] = e.value
                    search_results.append(ContactSearchResult(**kwargs))
        except search.Error:
            logging.exception('Search failed')
        if search_results:
            if search_results[0].entityKey:
                contact_key = ndb.Key(urlsafe=search_results[0].entityKey)
                return contact_key
        else:
            return None
    @classmethod
    def to_gcontact_schema(cls,contact_schema,group_membership_info=None):
        empty_string = lambda x: x if x else " "
        gcontact_schema = gdata.contacts.data.ContactEntry()
        full_name = contact_schema.firstname + ' ' + contact_schema.lastname
          # Set the contact's name.
        gcontact_schema.name = gdata.data.Name(
                  given_name=gdata.data.GivenName(text=contact_schema.firstname),
                  family_name=gdata.data.FamilyName(text=contact_schema.lastname),
                  full_name=gdata.data.FullName(text=full_name)
                )
        structured_data = Node.to_structured_data(contact_schema.infonodes)
        if 'emails' in structured_data.keys():
            for item in structured_data['emails'].items:
                gcontact_schema.email.append(
                                            gdata.data.Email(
                                                            address= item.email,
                                                            rel=gdata.data.WORK_REL,
                                                            display_name=full_name
                                                            )
                                            )
        phone_types = {
                        'work':gdata.data.WORK_REL,
                        'home':gdata.data.HOME_REL,
                        'mobile':gdata.data.MOBILE_REL,
                        'other':gdata.data.OTHER_REL
                    }
        if 'phones' in structured_data.keys():
            for item in structured_data['phones'].items:
                gcontact_schema.phone_number.append(
                                                    gdata.data.PhoneNumber(
                                                                text=item.number,
                                                                rel=phone_types[item.type]
                                                                )
                                                    )
        if 'addresses' in structured_data.keys():
                gcontact_schema.structured_postal_address.append(
                                                    gdata.data.StructuredPostalAddress(
                                                        rel=gdata.data.WORK_REL,
                                                        street=gdata.data.Street(text=empty_string(item.street)),
                                                        city=gdata.data.City(text=empty_string(item.city)),
                                                        region=gdata.data.Region(text=empty_string(item.state)),
                                                        postcode=gdata.data.Postcode(text=empty_string(item.postal_code)),
                                                        country=gdata.data.Country(text=empty_string(item.country))
                                                    )
                                        )

        # insert the contact on ioGrow contacts group
        if group_membership_info:
            gcontact_schema.group_membership_info.append(
                    gdata.contacts.data.GroupMembershipInfo(href=group_membership_info)
                                                        )
        return gcontact_schema

    @classmethod
    def gcontact_sync(cls,user,contact_schema):
        contact_key = ndb.Key(urlsafe=contact_schema.entityKey)
        google_contact_schema = cls.to_gcontact_schema(
                                                        contact_schema,
                                                        user.google_contacts_group
                                                    )
        created_contact=EndpointsHelper.create_contact(
                                                        user.google_credentials,
                                                        google_contact_schema
                                                    )
        # create a node to store the id of the created contact
        node = Node(
                    kind='gcontacts',
                    gcontact_id=created_contact,
                    user=user.email
                    )
        entityKey_async = node.put_async()
        entityKey = entityKey_async.get_result()
        Edge.insert(
                    start_node = contact_key,
                    end_node = entityKey,
                    kind = 'gcontacts',
                    inverse_edge = 'synced_with'
                )

    @classmethod
    def sync_with_google_contacts(cls,user_from_email,id):
        request = ContactGetRequest(id=int(id))
        contact_schema = cls.get_schema(user_from_email,request)
        contact_key = ndb.Key(urlsafe=contact_schema.entityKey)
        contact = contact_key.get()
        users = Node.list_permissions(contact)
        for user in users:
            cls.gcontact_sync(user,contact_schema)

    @classmethod
    def import_from_csv(cls,user_from_email,request):
        # read the csv file from Google Drive
        print (request)
        csv_file = EndpointsHelper.import_file(user_from_email,request.file_id)
        csvreader = csv.reader(csv_file.splitlines())
        headings = csvreader.next()
        i = 0
        # search for the matched columns in this csv
        # the mapping rules are in ATTRIBUTES_MATCHING
        matched_columns = {}
        for column in headings:
            for key in ATTRIBUTES_MATCHING.keys():
                for index in ATTRIBUTES_MATCHING[key]:
                    pattern = '%s'%index
                    regex = re.compile(pattern)
                    match = regex.search(column)
                    if match:
                        matched_columns[i] = key
            i = i + 1
        imported_accounts = {}
        # if is there some columns that match our mapping rules
        if len(matched_columns)>0:
            # parse each row in the csv
            for row in csvreader:
                    i = 0
                    contact = {}
                    for key in matched_columns.keys():
                        if row[key]:
                            # check if this contact is related to an account
                            if matched_columns[key] == 'account':
                                from iomodels.crmengine.accounts import Account
                                # Check if the account exist to not duplicate it
                                if row[key] in imported_accounts.keys():
                                    # check first if in those imported accounts
                                    account_key_async = imported_accounts[row[key]]
                                else:
                                    # search if it exists in the datastore
                                    account = Account.get_key_by_name(
                                                                    user_from_email= user_from_email,
                                                                    name = row[key]
                                                                    )
                                    if account:
                                        account_key_async = account
                                    else:
                                        # the account doesn't exist, create it
                                        account = Account(
                                                        name=row[key],
                                                        owner = user_from_email.google_user_id,
                                                        organization = user_from_email.organization,
                                                        access = 'public'
                                                        )
                                        account_key = account.put_async()
                                        account_key_async = account_key.get_result()
                                        # taskqueue.add(
                                        #             url='/workers/createobjectfolder',
                                        #             params={
                                        #                 'kind': "Account",
                                        #                 'folder_name': account.name,
                                        #                 'email': user_from_email.email,
                                        #                 'obj_key':account_key_async.urlsafe()
                                        #                 }
                                        #             )
                                        data = {}
                                        data['id'] = account_key_async.id()
                                        account.put_index(data)
                                    # add the account to imported accounts dictionary
                                    imported_accounts[row[key]] = account_key_async
                            # prepare the extracted contact info in a dictionary
                            # if has multiple value with for the same field
                            if matched_columns[key] in contact.keys():
                                new_list = []
                                if isinstance(contact[matched_columns[key]], list):
                                    existing_list = contact[matched_columns[key]]
                                    existing_list.append(row[key].decode('cp1252'))
                                    contact[matched_columns[key]] = existing_list
                                else:
                                    new_list.append(contact[matched_columns[key]])
                                    new_list.append(row[key].decode('cp1252'))
                                    contact[matched_columns[key]] = new_list
                            else:
                                contact[matched_columns[key]] = row[key].decode('cp1252')
                        i = i+1
                    # check if the contact has required fields
                    if 'firstname' in contact.keys() and 'lastname' in contact.keys():
                        # insert contact
                        name = contact['firstname'] + ' ' + contact['lastname']
                        # check if this contact exist
                        contact_key_async = Contact.get_key_by_name(
                                                                user_from_email= user_from_email,
                                                                name = smart_str(name)
                                                            )
                        if contact_key_async is None:
                            for key in matched_columns:
                                if matched_columns[key] not in contact.keys():
                                    contact[matched_columns[key]] = None

                            if (hasattr(contact,'title'))==False:
                                contact['title']=""
                            imported_contact  = cls(
                                                firstname = contact['firstname'],
                                                lastname = contact['lastname'],
                                                title = contact['title'],
                                                owner = user_from_email.google_user_id,
                                                organization = user_from_email.organization,
                                                access = 'public'
                                                )
                            contact_key = imported_contact.put_async()
                            contact_key_async = contact_key.get_result()
                            folder_name = contact['firstname'] + contact['lastname']
                            # taskqueue.add(
                            #                 url='/workers/createobjectfolder',
                            #                 params={
                            #                         'kind': "Contact",
                            #                         'folder_name': folder_name,
                            #                         'email': user_from_email.email,
                            #                         'obj_key':contact_key_async.urlsafe()
                            #                         }
                            #                 )
                        # insert the edge between the contact and related account
                        if 'account' in contact.keys():
                            if contact['account']:
                                    # insert edges
                                    Edge.insert(start_node = account_key_async,
                                              end_node = contact_key_async,
                                              kind = 'contacts',
                                              inverse_edge = 'parents')
                                    EndpointsHelper.update_edge_indexes(
                                                                    parent_key = contact_key_async,
                                                                    kind = 'contacts',
                                                                    indexed_edge = str(account_key_async.id())
                                                                    )

                            else:
                                data = {}
                                data['id'] = contact_key_async.id()
                                imported_contact. put_index(data)
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
                                                            start_node = contact_key_async,
                                                            end_node = entityKey,
                                                            kind = 'infos',
                                                            inverse_edge = 'parents'
                                                        )
                                                indexed_edge = '_' + attribute + ' ' + value
                                                EndpointsHelper.update_edge_indexes(
                                                                                    parent_key = contact_key_async,
                                                                                    kind = 'infos',
                                                                                    indexed_edge = smart_str(indexed_edge)
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
                                                        start_node = contact_key_async,
                                                        end_node = entityKey,
                                                        kind = 'infos',
                                                        inverse_edge = 'parents'
                                                        )
                                            indexed_edge = '_' + attribute + ' ' + contact[attribute]
                                            EndpointsHelper.update_edge_indexes(
                                                                                parent_key = contact_key_async,
                                                                                kind = 'infos',
                                                                                indexed_edge = smart_str(indexed_edge)
                                                                                )

import endpoints
import model
from google.appengine.api import search
from google.appengine.datastore.datastore_query import Cursor
from google.appengine.ext import ndb
from protorpc import messages

import iomessages
from endpoints_helper import EndpointsHelper
from endpoints_proto_datastore.ndb import EndpointsModel
from iograph import Node,Edge,InfoNodeListResponse
from iomessages import EmailListSchema, PhoneListSchema, AddressListSchema, SocialLinkSchema, SocialLinkListSchema
from iomodels.crmengine.casestatuses import CaseStatusSchema
from iomodels.crmengine.documents import Document,DocumentListResponse
from iomodels.crmengine.events import Event,EventListResponse
from iomodels.crmengine.notes import Note,TopicListResponse
from iomodels.crmengine.tags import Tag,TagSchema
from iomodels.crmengine.tasks import Task, TaskListResponse
from search_helper import tokenize_autocomplete,SEARCH_QUERY_MODEL


class UpdateStatusRequest(messages.Message):
    entityKey = messages.StringField(1,required=True)
    status = messages.StringField(2,required=True)

class AccountSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    name = messages.StringField(3)
    account_type = messages.StringField(4)
    industry = messages.StringField(5)
    tagline = messages.StringField(6)
    introduction = messages.StringField(7)
    access = messages.StringField(8)
    folder = messages.StringField(9)
    logo_img_id = messages.StringField(10)
    logo_img_url = messages.StringField(11)
    firstname = messages.StringField(12)
    lastname = messages.StringField(13)
    personal_account = messages.BooleanField(14)
    locations = messages.StringField(15, repeated=True)
    emails = messages.MessageField(iomessages.EmailListSchema, 16)
    addresses = messages.MessageField(iomessages.AddressListSchema, 17)
    phones = messages.MessageField(iomessages.PhoneListSchema, 18)
    websites = messages.StringField(19, repeated=True)
    sociallinks = messages.MessageField(SocialLinkListSchema, 20)

class ListRequest(messages.Message):
    limit = messages.IntegerField(1)
    pageToken = messages.StringField(2)

class CaseGetRequest(messages.Message):
    id = messages.IntegerField(1,required = True)
    topics = messages.MessageField(ListRequest, 2)
    tasks = messages.MessageField(ListRequest, 3)
    events = messages.MessageField(ListRequest, 4)
    documents = messages.MessageField(ListRequest, 5)

class CaseInsertRequest(messages.Message):
    name = messages.StringField(1)
    priority = messages.IntegerField(2)
    status = messages.StringField(3)
    account = messages.StringField(4)
    contact = messages.StringField(5)
    access = messages.StringField(6)
    infonodes = messages.MessageField(iomessages.InfoNodeRequestSchema,7,repeated=True)
    description = messages.StringField(8)

class CaseListRequest(messages.Message):
    limit = messages.IntegerField(1)
    pageToken = messages.StringField(2)
    order = messages.StringField(3)
    tags = messages.StringField(4,repeated = True)
    owner = messages.StringField(5)
    status = messages.StringField(6)
    probability = messages.StringField(7)
    priority = messages.IntegerField(8)

class CaseSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    name = messages.StringField(3)
    status = messages.StringField(4)
    folder = messages.StringField(5)
    type_case = messages.StringField(6)
    current_status = messages.MessageField(CaseStatusSchema,7)
    all_status = messages.MessageField(CaseStatusSchema,8,repeated = True)
    tags = messages.MessageField(TagSchema,9, repeated = True)
    infonodes = messages.MessageField(InfoNodeListResponse,10)
    topics = messages.MessageField(TopicListResponse,11)
    tasks = messages.MessageField(TaskListResponse,12)
    events = messages.MessageField(EventListResponse,13)
    documents = messages.MessageField(DocumentListResponse,14)
    created_at = messages.StringField(15)
    updated_at = messages.StringField(16)
    priority = messages.IntegerField(17)
    access = messages.StringField(18)
    description = messages.StringField(19)
    case_origin = messages.StringField(20)
    closed_date = messages.StringField(21)
    account = messages.MessageField(AccountSchema,22)
    contact = messages.MessageField(iomessages.ContactSchema,23)
    owner = messages.MessageField(iomessages.UserSchema,24)

class CasePatchRequest(messages.Message):
    id = messages.StringField(1)
    name = messages.StringField(2)
    status = messages.StringField(3)
    type_case = messages.StringField(4)
    priority = messages.IntegerField(5)
    access = messages.StringField(6)
    description = messages.StringField(7)
    case_origin = messages.StringField(8)
    closed_date = messages.StringField(9)
    owner = messages.StringField(10)

class CaseListResponse(messages.Message):
    items = messages.MessageField(CaseSchema, 1, repeated=True)
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

class Case(EndpointsModel):
    _message_fields_schema = ('id','entityKey','owner','folder', 'access','collaborators_list','collaborators_ids',  'name','status','type_case','priority','account','account_name','contact','contact_name','created_at','updated_at','type_case','description','case_origin','closed_date')
    # Sharing fields
    owner = ndb.StringProperty()
    collaborators_list = ndb.StructuredProperty(model.Userinfo,repeated=True)
    collaborators_ids = ndb.StringProperty(repeated=True)
    organization = ndb.KeyProperty()
    folder = ndb.StringProperty()
    account = ndb.KeyProperty()
    account_name = ndb.StringProperty()
    contact = ndb.KeyProperty()
    contact_name = ndb.StringProperty()
    name = ndb.StringProperty()
    status = ndb.StringProperty()
    type_case = ndb.StringProperty()
    industry = ndb.StringProperty()
    priority = ndb.IntegerProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    created_by = ndb.KeyProperty()
    description = ndb.StringProperty()
    case_origin = ndb.StringProperty()
    closed_date = ndb.DateTimeProperty()
    # public or private
    access = ndb.StringProperty()

    def put(self, **kwargs):
        ndb.Model.put(self, **kwargs)
        try:
            self.put_index()
        except:
            print 'error on saving document index'

    def set_perm(self):
        about_item = str(self.key.id())

        perm = model.Permission(about_kind='Case',
                         about_item=about_item,
                         type = 'user',
                         role = 'owner',
                         value = self.owner)
        perm.put()


    def put_index(self,data=None):
        """ index the element at each"""
        empty_string = lambda x: x if x else ""
        collaborators = " ".join(self.collaborators_ids)
        organization = str(self.organization.id())
        title_autocomplete = ','.join(tokenize_autocomplete(self.name + ' ' + empty_string(self.account_name) + ' ' + empty_string(self.contact_name)))
        if data:
            search_key = ['infos','cases','tags','collaborators']
            for key in search_key:
                if key not in data.keys():
                    data[key] = ""
            my_document = search.Document(
            doc_id = str(data['id']),
            fields=[
                search.TextField(name=u'type', value=u'Case'),
                search.TextField(name='organization', value = empty_string(organization) ),
                search.TextField(name='access', value = empty_string(self.access) ),
                search.TextField(name='owner', value = empty_string(self.owner) ),
                search.TextField(name='collaborators', value = data['collaborators'] ),
                search.TextField(name='title', value = empty_string(self.name) ),
                search.TextField(name='account_name', value = empty_string(self.account_name) ),
                search.TextField(name='contact_name', value = empty_string(self.contact_name) ),
                search.TextField(name='status', value = empty_string(self.status)),
                search.NumberField(name='priority', value = int(self.priority or 1)),
                search.DateField(name='created_at', value = self.created_at),
                search.DateField(name='updated_at', value = self.updated_at),
                search.TextField(name='infos', value= data['infos']),
                search.TextField(name='tags', value= data['tags']),
                search.TextField(name='cases', value= data['cases']),
                search.TextField(name='title_autocomplete', value = empty_string(title_autocomplete)),
                search.TextField(name='type_case', value = empty_string(self.type_case))
               ])
        else:
            my_document = search.Document(
            doc_id = str(self.key.id()),
            fields=[
                search.TextField(name=u'type', value=u'Case'),
                search.TextField(name='organization', value = empty_string(organization) ),
                search.TextField(name='access', value = empty_string(self.access) ),
                search.TextField(name='owner', value = empty_string(self.owner) ),
                search.TextField(name='collaborators', value = collaborators ),
                search.TextField(name='title', value = empty_string(self.name) ),
                search.TextField(name='account_name', value = empty_string(self.account_name) ),
                search.TextField(name='contact_name', value = empty_string(self.contact_name) ),
                search.TextField(name='status', value = empty_string(self.status)),
                search.NumberField(name='priority', value = int(self.priority)),
                search.DateField(name='created_at', value = self.created_at),
                search.DateField(name='updated_at', value = self.updated_at),
                search.TextField(name='title_autocomplete', value = empty_string(title_autocomplete)),
                search.TextField(name='type_case', value = empty_string(self.type_case))
               ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)

    @classmethod
    def get_schema(cls,user_from_email,request):
        case = cls.get_by_id(int(request.id))
        if case is None:
            raise endpoints.NotFoundException('Opportunity not found.')
        case_schema = None
        if Node.check_permission(user_from_email,case):
            parents_edge_list = Edge.list(
                                        start_node = case.key,
                                        kind = 'parents'
                                        )
            account_schema = None
            contact_schema = None
            for parent in parents_edge_list['items']:
                if parent.end_node.kind() == 'Account':
                    account = parent.end_node.get()
                    infonodes = Node.list_info_nodes(account.key, request)
                    info_nodes_structured = Node.to_structured_data(infonodes)

                    emails = EmailListSchema()
                    if 'emails' in info_nodes_structured.keys():
                            emails = info_nodes_structured['emails']

                    addresses = AddressListSchema()
                    if 'addresses' in info_nodes_structured.keys():
                            addresses = info_nodes_structured['addresses']

                    phones = PhoneListSchema()
                    if 'phones' in info_nodes_structured.keys():
                            phones = info_nodes_structured['phones']

                    social_links = SocialLinkListSchema()
                    if 'sociallinks' in info_nodes_structured.keys():
                            social_links = info_nodes_structured['sociallinks']

                    websites = []
                    if 'websites' in info_nodes_structured.keys():
                        sites = info_nodes_structured['websites']
                        for site in sites:
                            websites.append(site['url'])

                    account_schema = AccountSchema(
                                        id=str(account.key.id()),
                                        entityKey=account.key.urlsafe(),
                                        name=account.name,
                                        account_type=account.account_type,
                                        industry=account.industry,
                                        tagline=account.tagline,
                                        introduction=account.introduction,
                                        access=account.access,
                                        folder=account.folder,
                                        logo_img_id=account.logo_img_id,
                                        logo_img_url=account.logo_img_url,
                                        firstname=account.firstname,
                                        lastname=account.lastname,
                                        personal_account=account.personal_account,
                                        emails=emails,
                                        addresses=addresses,
                                        phones=phones,
                                        websites=websites,
                                        sociallinks=social_links
                    )

                elif parent.end_node.kind() == 'Contact':
                    contact = parent.end_node.get()
                    infonodes = Node.list_info_nodes(contact.key, request)
                    info_nodes_structured = Node.to_structured_data(infonodes)
                    emails = EmailListSchema()
                    if 'emails' in info_nodes_structured.keys():
                            emails = info_nodes_structured['emails']

                    addresses = AddressListSchema()
                    if 'addresses' in info_nodes_structured.keys():
                            addresses = info_nodes_structured['addresses']

                    phones = PhoneListSchema()
                    if 'phones' in info_nodes_structured.keys():
                            phones = info_nodes_structured['phones']

                    social_links = SocialLinkListSchema()
                    if 'sociallinks' in info_nodes_structured.keys():
                            social_links = info_nodes_structured['sociallinks']

                    websites = []
                    if 'websites' in info_nodes_structured.keys():
                        sites = info_nodes_structured['websites']
                        for site in sites:
                            websites.append(site['url'])

                    contact_schema = iomessages.ContactSchema(
                        id=str(contact.key.id()),
                        entityKey=contact.key.urlsafe(),
                        firstname=contact.firstname,
                        lastname=contact.lastname,
                        title=contact.title,
                        profile_img_id=contact.profile_img_id,
                        profile_img_url=contact.profile_img_url,
                        emails=emails,
                        addresses=addresses,
                        phones=phones,
                        websites=websites,
                        sociallinks=social_links,
                    )
            tag_list = Tag.list_by_parent(parent_key = case.key)
            # list of infonodes
            infonodes = Node.list_info_nodes(
                                            parent_key = case.key,
                                            request = request
                                            )
            #list of topics related to this account
            topics = None
            if request.topics:
                topics = Note.list_by_parent(
                                            parent_key = case.key,
                                            request = request
                                            )
            tasks = None
            if request.tasks:
                tasks = Task.list_by_parent(
                                            parent_key = case.key,
                                            request = request
                                            )
            events = None
            if request.events:
                events = Event.list_by_parent(
                                            parent_key = case.key,
                                            request = request
                                            )
            documents = None
            if request.documents:
                documents = Document.list_by_parent(
                                            parent_key = case.key,
                                            request = request
                                            )
            case_status_edges = Edge.list(
                                        start_node = case.key,
                                        kind = 'status',
                                        limit = 1
                                        )
            current_status_schema = None
            if len(case_status_edges['items'])>0:
                                current_status = case_status_edges['items'][0].end_node.get()
                                current_status_schema = CaseStatusSchema(
                                                                        name = current_status.status,
                                                                        status_changed_at = case_status_edges['items'][0].created_at.isoformat()
                                                                        )

            closed_date = None
            if case.closed_date:
                closed_date = case.closed_date.strftime("%Y-%m-%dT%H:%M:00.000")
            owner = model.User.get_by_gid(case.owner)
            owner_schema = None
            if owner:
                owner_schema = iomessages.UserSchema(
                                                    id = str(owner.id),
                                                    email = owner.email,
                                                    google_display_name = owner.google_display_name,
                                                    google_public_profile_photo_url=owner.google_public_profile_photo_url,
                                                    google_public_profile_url=owner.google_public_profile_url,
                                                    google_user_id = owner.google_user_id
                                                    )
            case_schema = CaseSchema(
                                      id = str( case.key.id() ),
                                      entityKey = case.key.urlsafe(),
                                      name = case.name,
                                      folder = case.folder,
                                      current_status = current_status_schema,
                                      priority = case.priority,
                                      tags = tag_list,
                                      topics = topics,
                                      tasks = tasks,
                                      events = events,
                                      documents = documents,
                                      infonodes = infonodes,
                                      access = case.access,
                                      description = case.description,
                                      case_origin = case.case_origin,
                                      closed_date = closed_date,
                                      type_case = case.type_case,
                                      account = account_schema,
                                      contact = contact_schema,
                                      created_at = case.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                                      updated_at = case.updated_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                                      owner = owner_schema
                                    )
            return case_schema
        else:
            raise endpoints.NotFoundException('Permission denied')

    @classmethod
    def filter_by_tag(cls,user_from_email,request):
        items = []
        tag_keys = []
        for tag_key_str in request.tags:
            tag_keys.append(ndb.Key(urlsafe=tag_key_str))
        cases_keys = Edge.filter_by_set(tag_keys,'tagged_on')
        cases = ndb.get_multi(cases_keys)
        for case in cases:
            if case is not None:
                is_filtered = True
                if request.owner and case.owner!=request.owner and is_filtered:
                    is_filtered = False
                if request.status and case.status!=request.status and is_filtered:
                    is_filtered = False
                if request.priority and case.priority!=request.priority and is_filtered:
                    is_filtered = False
                if is_filtered and Node.check_permission(user_from_email,case):
                    #list of tags related to this case
                    tag_list = Tag.list_by_parent(parent_key = case.key)
                    case_status_edges = Edge.list(
                                            start_node = case.key,
                                            kind = 'status',
                                            limit = 1
                                            )
                    current_status_schema = None
                    if len(case_status_edges['items'])>0:
                        current_status = case_status_edges['items'][0].end_node.get()
                        current_status_schema = CaseStatusSchema(
                                                                name = current_status.status,
                                                                status_changed_at = case_status_edges['items'][0].created_at.isoformat()
                                                                )
                    owner = model.User.get_by_gid(case.owner)
                    owner_schema = None
                    if owner:
                        owner_schema = iomessages.UserSchema(
                                                    id = str(owner.id),
                                                    email = owner.email,
                                                    google_display_name = owner.google_display_name,
                                                    google_public_profile_photo_url=owner.google_public_profile_photo_url,
                                                    google_public_profile_url=owner.google_public_profile_url,
                                                    google_user_id = owner.google_user_id
                                                    )
                    case_schema = CaseSchema(
                              id = str( case.key.id() ),
                              entityKey = case.key.urlsafe(),
                              name = case.name,
                              current_status = current_status_schema,
                              priority = case.priority,
                              owner=owner_schema,
                              access=case.access,
                              tags = tag_list,
                              created_at = case.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                              updated_at = case.updated_at.strftime("%Y-%m-%dT%H:%M:00.000")
                            )
                    items.append(case_schema)
        return  CaseListResponse(items = items)
    @classmethod
    def list(cls,user_from_email,request):
        if request.tags:
            return cls.filter_by_tag(user_from_email,request)
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
                    raise AttributeError('Order attribute %s not defined.' % (attr_name,))
                if ascending:
                    cases, next_curs, more =  cls.query().filter(cls.organization==user_from_email.organization).order(+attr).fetch_page(limit, start_cursor=curs)
                else:
                    cases, next_curs, more = cls.query().filter(cls.organization==user_from_email.organization).order(-attr).fetch_page(limit, start_cursor=curs)
            else:
                cases, next_curs, more = cls.query().filter(cls.organization==user_from_email.organization).fetch_page(limit, start_cursor=curs)
            for case in cases:
                if len(items) < limit:
                    is_filtered = True
                    if request.tags and is_filtered:
                        end_node_set = [ndb.Key(urlsafe=tag_key) for tag_key in request.tags]
                        if not Edge.find(start_node=case.key,kind='tags',end_node_set=end_node_set,operation='AND'):
                            is_filtered = False
                    if request.owner and case.owner!=request.owner and is_filtered:
                        is_filtered = False
                    if request.status and case.status!=request.status and is_filtered:
                        is_filtered = False
                    if request.priority and case.priority!=request.priority and is_filtered:
                        is_filtered = False
                    if is_filtered and Node.check_permission(user_from_email,case):
                        count = count + 1
                        #list of tags related to this case
                        tag_list = Tag.list_by_parent(parent_key = case.key)
                        case_status_edges = Edge.list(
                                                start_node = case.key,
                                                kind = 'status',
                                                limit = 1
                                                )
                        current_status_schema = None
                        if len(case_status_edges['items'])>0:
                            current_status = case_status_edges['items'][0].end_node.get()
                            current_status_schema = CaseStatusSchema(
                                                                    name = current_status.status,
                                                                    status_changed_at = case_status_edges['items'][0].created_at.isoformat()
                                                                   )

                        owner = model.User.get_by_gid(case.owner)
                        owner_schema = None
                        if owner:
                            owner_schema = iomessages.UserSchema(
                                                    id = str(owner.id),
                                                    email = owner.email,
                                                    google_display_name = owner.google_display_name,
                                                    google_public_profile_photo_url=owner.google_public_profile_photo_url,
                                                    google_public_profile_url=owner.google_public_profile_url,
                                                    google_user_id = owner.google_user_id
                                                    )
                        case_schema = CaseSchema(
                                  id = str( case.key.id() ),
                                  entityKey = case.key.urlsafe(),
                                  name = case.name,
                                  current_status = current_status_schema,
                                  priority = case.priority,
                                  tags = tag_list,
                                  owner=owner_schema,
                                  access=case.access,
                                  created_at = case.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                                  updated_at = case.updated_at.strftime("%Y-%m-%dT%H:%M:00.000")
                                )
                        items.append(case_schema)
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
        return  CaseListResponse(items = items, nextPageToken = next_curs_url_safe)

    @classmethod
    def search(cls,user_from_email,request):
        organization = str(user_from_email.organization.id())
        index = search.Index(name="GlobalIndex")
        #Show only objects where you have permissions
        query_string = SEARCH_QUERY_MODEL % {
                               "type": "Case",
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
                                      "title",
                                      "contact_name",
                                      "account_name",
                                      "status"
                                      ]:
                            kwargs[e.name] = e.value
                    search_results.append(CaseSearchResult(**kwargs))

        except search.Error:
            logging.exception('Search failed')
        return CaseSearchResults(
                                 items=search_results,
                                 nextPageToken=next_cursor
                                 )
    @classmethod
    def list_by_parent(cls,user_from_email,parent_key,request):
        case_list = []
        you_can_loop = True
        count = 0
        limit = int(request.cases.limit)
        case_next_curs = request.cases.pageToken
        while you_can_loop:
            edge_limit = int(request.cases.limit) - count
            if edge_limit>0:
                case_edge_list = Edge.list(
                                    start_node = parent_key,
                                    kind='cases',
                                    limit=edge_limit,
                                    pageToken=case_next_curs
                                    )
                for edge in case_edge_list['items']:
                    case = edge.end_node.get()
                    if Node.check_permission(user_from_email,case):
                        count = count + 1
                        tag_list = Tag.list_by_parent(parent_key = case.key)
                        case_status_edges = Edge.list(
                                                        start_node = case.key,
                                                        kind = 'status',
                                                        limit = 1
                                                    )
                        current_status_schema = None
                        if len(case_status_edges['items'])>0:
                            current_status = case_status_edges['items'][0].end_node.get()
                            current_status_schema = CaseStatusSchema(
                                                                    name = current_status.status,
                                                                    status_changed_at = case_status_edges['items'][0].created_at.isoformat()
                                                                   )
                        owner = model.User.get_by_gid(case.owner)
                        owner_schema = None
                        if owner:
                            owner_schema = iomessages.UserSchema(
                                                    id = str(owner.id),
                                                    email = owner.email,
                                                    google_display_name = owner.google_display_name,
                                                    google_public_profile_photo_url=owner.google_public_profile_photo_url,
                                                    google_public_profile_url=owner.google_public_profile_url,
                                                    google_user_id = owner.google_user_id
                                                    )
                        case_list.append(
                                        CaseSchema(
                                                id = str( case.key.id() ),
                                                entityKey = case.key.urlsafe(),
                                                name = case.name,
                                                current_status = current_status_schema,
                                                priority = case.priority,
                                                tags = tag_list,
                                                owner=owner_schema,
                                                access=case.access,
                                                created_at = case.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                                                updated_at = case.updated_at.strftime("%Y-%m-%dT%H:%M:00.000")
                                                )
                                        )
                if case_edge_list['next_curs'] and case_edge_list['more']:
                    case_next_curs = case_edge_list['next_curs'].urlsafe()
                else:
                    you_can_loop = False
                    case_next_curs = None

            if (count == limit):
                you_can_loop = False

        return CaseListResponse(
                                    items = case_list,
                                    nextPageToken = case_next_curs
                                )
    @classmethod
    def insert(cls,user_from_email,request):
        case = cls(
                    owner = user_from_email.google_user_id,
                    organization = user_from_email.organization,
                    access = request.access,
                    name = request.name,
                    priority = request.priority,
                    description = request.description
                    )
        case_key = case.put_async()
        case_key_async = case_key.get_result()
        # taskqueue.add(
        #             url='/workers/createobjectfolder',
        #             queue_name='iogrow-low',
        #             params={
        #                     'kind': "Case",
        #                     'folder_name': request.name,
        #                     'email': user_from_email.email,
        #                     'obj_key':case_key_async.urlsafe()
        #                     }
        #             )
        indexed = False
        status_key=None
        if request.status:
            status_key = ndb.Key(urlsafe=request.status)
            # insert edges
            Edge.insert(start_node = case_key_async ,
                      end_node = status_key,
                      kind = 'status',
                      inverse_edge = 'related_cases')
        if request.contact:
            contact_key = ndb.Key(urlsafe=request.contact)
            if contact_key:
                # insert edges
                Edge.insert(start_node = contact_key,
                          end_node = case_key_async,
                          kind = 'cases',
                          inverse_edge = 'parents')
                EndpointsHelper.update_edge_indexes(
                                                parent_key = case_key_async,
                                                kind = 'cases',
                                                indexed_edge = str(contact_key.id())
                                                )
                parents_edge_list = Edge.list(
                                    start_node = contact_key,
                                    kind = 'parents',
                                    limit = 1
                                    )
                if len(parents_edge_list['items'])>0:
                    request.account = parents_edge_list['items'][0].end_node.urlsafe()
                indexed = True
        if request.account:
            account_key = ndb.Key(urlsafe=request.account)
            if account_key:
                # insert edges
                Edge.insert(start_node = account_key,
                          end_node = case_key_async,
                          kind = 'cases',
                          inverse_edge = 'parents'
                          )
                EndpointsHelper.update_edge_indexes(
                                                parent_key = case_key_async,
                                                kind = 'cases',
                                                indexed_edge = str(account_key.id())
                                                )
                indexed = True
        for infonode in request.infonodes:
            Node.insert_info_node(
                            case_key_async,
                            iomessages.InfoNodeRequestSchema(
                                                            kind = infonode.kind,
                                                            fields = infonode.fields
                                                        )
                                                    )


        if not indexed:
            data = {}
            data['id'] = case_key_async.id()
            case.put_index(data)
        current_status_schema=None
        if status_key.get() :
            current_status_schema = CaseStatusSchema(
                                            name = status_key.get().status
                                          )

        case_schema = CaseSchema(
                                  id = str( case_key_async.id() ),
                                  entityKey = case_key_async.urlsafe(),
                                  name = case.name,
                                  current_status = current_status_schema,
                                  priority = case.priority,
                                  created_at = case.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                                  updated_at = case.updated_at.strftime("%Y-%m-%dT%H:%M:00.000")
                                )
        return case_schema

    @classmethod
    def patch(cls,user_from_email,request):
        case = cls.get_by_id(int(request.id))
        if case is None:
            raise endpoints.NotFoundException('Case not found.')
        if (case.owner != user_from_email.google_user_id) and not user_from_email.is_admin:
            raise endpoints.ForbiddenException('you are not the owner')
        EndpointsHelper.share_related_documents_after_patch(
                                                            user_from_email,
                                                            case,
                                                            request
                                                          )
        properties = ['owner', 'name', 'access','status', 'type_case', 'priority', 
                      'description','case_origin']
        for p in properties:
            if hasattr(request,p):
                if (eval('case.' + p) != eval('request.' + p)) \
                and(eval('request.' + p) and not(p in ['put', 'set_perm', 'put_index'])):
                    exec('case.' + p + '= request.' + p)
        if request.closed_date:
            closed_date = datetime.datetime.strptime(
                                                    request.closed_date,
                                                    "%Y-%m-%dT%H:%M:00.000000"
                                                )
            case.closed_date = closed_date
        case_key_async = case.put_async()
        data = EndpointsHelper.get_data_from_index(str( case.key.id() ))
        case.put_index(data)
        get_schema_request = CaseGetRequest(id=int(request.id))
        return cls.get_schema(user_from_email,get_schema_request)

    @classmethod
    def update_status(cls,user_from_email,request):
        case_key =  ndb.Key(urlsafe=request.entityKey)
        status_key = ndb.Key(urlsafe=request.status)
        # insert edges
        Edge.insert(start_node = case_key,
                  end_node = status_key,
                  kind = 'status',
                  inverse_edge = 'related_cases')




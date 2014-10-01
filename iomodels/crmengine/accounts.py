from google.appengine.ext import ndb
from google.appengine.api import memcache
from google.appengine.api import taskqueue
from google.appengine.datastore.datastore_query import Cursor
from endpoints_proto_datastore.ndb import EndpointsModel
from endpoints_proto_datastore import MessageFieldsSchema
from google.appengine.api import search
from protorpc import messages
import endpoints
from search_helper import tokenize_autocomplete,SEARCH_QUERY_MODEL
import model
from iomodels.crmengine.tags import Tag,TagSchema
from iomodels.crmengine.tasks import Task,TaskRequest,TaskListResponse
from iomodels.crmengine.events import Event,EventListResponse
from iomodels.crmengine.contacts import Contact,ContactListRequest,ContactListResponse,ContactInsertRequest
from iomodels.crmengine.opportunities import Opportunity,OpportunityListResponse
from iograph import Node,Edge,InfoNodeListResponse
from iomodels.crmengine.notes import Note,TopicListResponse
from iomodels.crmengine.cases import Case,CaseListResponse
from iomodels.crmengine.documents import Document,DocumentListResponse
from iomodels.crmengine.needs import Need, NeedListResponse
from endpoints_helper import EndpointsHelper
import iomessages
# from ioreporting import Reports
# The message class that defines the EntityKey schema
class EntityKeyRequest(messages.Message):
    entityKey = messages.StringField(1)

 # The message class that defines the ListRequest schema
class ListRequest(messages.Message):
    limit = messages.IntegerField(1)
    pageToken = messages.StringField(2)

class AccountGetRequest(messages.Message):
    id = messages.IntegerField(1,required = True)
    contacts = messages.MessageField(ListRequest, 2)
    topics = messages.MessageField(ListRequest, 3)
    tasks = messages.MessageField(ListRequest, 4)
    events = messages.MessageField(ListRequest, 5)
    opportunities = messages.MessageField(ListRequest, 6)
    cases = messages.MessageField(ListRequest, 7)
    documents = messages.MessageField(ListRequest, 8)
    needs = messages.MessageField(ListRequest, 9)

class AccountSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    name = messages.StringField(3)
    account_type = messages.StringField(4)
    industry = messages.StringField(5)
    tagline = messages.StringField(6)
    introduction = messages.StringField(7)
    tags = messages.MessageField(TagSchema,8, repeated = True)
    contacts = messages.MessageField(ContactListResponse,9)
    infonodes = messages.MessageField(InfoNodeListResponse,10)
    topics = messages.MessageField(TopicListResponse,11)
    tasks = messages.MessageField(TaskListResponse,12)
    events = messages.MessageField(EventListResponse,13)
    opportunities = messages.MessageField(OpportunityListResponse,14)
    cases = messages.MessageField(CaseListResponse,15)
    documents = messages.MessageField(DocumentListResponse,16)
    needs = messages.MessageField(NeedListResponse,17)
    created_at = messages.StringField(18)
    updated_at = messages.StringField(19)
    access = messages.StringField(20)
    folder = messages.StringField(21)
    logo_img_id = messages.StringField(22)
    logo_img_url = messages.StringField(23)
    owner = messages.MessageField(iomessages.UserSchema,24)

class AccountPatchRequest(messages.Message):
    id = messages.StringField(1)
    name = messages.StringField(3)
    account_type = messages.StringField(4)
    industry = messages.StringField(5)
    tagline = messages.StringField(6)
    introduction = messages.StringField(7)
    access = messages.StringField(8)
    logo_img_id = messages.StringField(9)
    logo_img_url = messages.StringField(10)
    owner = messages.StringField(11)

class AccountListRequest(messages.Message):
    limit = messages.IntegerField(1)
    pageToken = messages.StringField(2)
    order = messages.StringField(3)
    tags = messages.StringField(4,repeated = True)
    owner = messages.StringField(5)




class AccountListResponse(messages.Message):
    items = messages.MessageField(AccountSchema, 1, repeated=True)
    nextPageToken = messages.StringField(2)

# The message class that defines the Search Request attributes
class SearchRequest(messages.Message):
    q = messages.StringField(1, required=True)
    limit = messages.IntegerField(2)
    pageToken = messages.StringField(3)

# The message class that defines the accounts.search response
class AccountSearchResult(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    name = messages.StringField(3)

# The message class that defines a set of accounts.search results
class AccountSearchResults(messages.Message):
    items = messages.MessageField(AccountSearchResult, 1, repeated=True)
    nextPageToken = messages.StringField(2)

class AccountInsertRequest(messages.Message):
    name = messages.StringField(1)
    account_type = messages.StringField(2)
    industry = messages.StringField(3)
    access = messages.StringField(4)
    tagline = messages.StringField(5)
    introduction = messages.StringField(6)
    phones = messages.MessageField(iomessages.PhoneSchema,7, repeated = True)
    emails = messages.MessageField(iomessages.EmailSchema,8, repeated = True)
    addresses = messages.MessageField(iomessages.AddressSchema,9, repeated = True)
    infonodes = messages.MessageField(iomessages.InfoNodeRequestSchema,10, repeated = True)
    logo_img_id = messages.StringField(11)
    logo_img_url = messages.StringField(12)
    contacts = messages.MessageField(ContactInsertRequest,13,repeated=True)


class Account(EndpointsModel):
    _message_fields_schema = ('id','entityKey','created_at','updated_at', 'folder','access','collaborators_list','collaborators_ids','name','owner','account_type','industry','tagline','introduction','logo_img_id','logo_img_url')
    # Sharing fields
    owner = ndb.StringProperty()
    collaborators_list = ndb.StructuredProperty(model.Userinfo,repeated=True)
    collaborators_ids = ndb.StringProperty(repeated=True)
    organization = ndb.KeyProperty()
    folder = ndb.StringProperty()
    name = ndb.StringProperty()
    account_type = ndb.StringProperty()
    industry = ndb.StringProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    tagline = ndb.TextProperty()
    introduction =ndb.TextProperty()
    # public or private
    access = ndb.StringProperty()
    logo_img_id = ndb.StringProperty()
    logo_img_url = ndb.StringProperty()




    def put(self, **kwargs):
        ndb.Model.put(self, **kwargs)
        self.put_index()
        self.set_perm()

    def set_perm(self):
        about_item = str(self.key.id())

        perm = model.Permission(about_kind='Account',
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
        title_autocomplete = ','.join(tokenize_autocomplete(self.name))

        #addresses = " \n".join(map(lambda x: " ".join([x.street,x.city,x.state, str(x.postal_code), x.country]) if x else "", self.addresses))
        if data:
            search_key = ['infos','tags','collaborators']
            for key in search_key:
                if key not in data.keys():
                    data[key] = ""
            my_document = search.Document(
            doc_id = str(data['id']),
            fields=[
                search.TextField(name=u'type', value=u'Account'),
                search.TextField(name='organization', value = empty_string(organization) ),
                search.TextField(name='entityKey',value=empty_string(self.key.urlsafe())),
                search.TextField(name='access', value = empty_string(self.access) ),
                search.TextField(name='owner', value = empty_string(self.owner) ),
                search.TextField(name='collaborators', value = data['collaborators'] ),
                search.TextField(name='title', value = empty_string(self.name) ),
                search.TextField(name='account_type', value = empty_string(self.account_type)),
                search.TextField(name='industry', value = empty_string(self.industry)),
                search.DateField(name='created_at', value = self.created_at),
                search.DateField(name='updated_at', value = self.updated_at),
                search.TextField(name='industry', value = empty_string(self.industry)),
                search.TextField(name='tagline', value = empty_string(self.tagline)),
                search.TextField(name='introduction', value = empty_string(self.introduction)),
                search.TextField(name='infos', value= data['infos']),
                search.TextField(name='tags', value= data['tags']),
                search.TextField(name='title_autocomplete', value = empty_string(title_autocomplete)),
                #search.TextField(name='addresses', value = empty_string(addresses)),
               ])
        else:
            my_document = search.Document(
            doc_id = str(self.key.id()),
            fields=[
                search.TextField(name=u'type', value=u'Account'),
                search.TextField(name='organization', value = empty_string(organization) ),
                search.TextField(name='entityKey',value=empty_string(self.key.urlsafe())),
                search.TextField(name='access', value = empty_string(self.access) ),
                search.TextField(name='owner', value = empty_string(self.owner) ),
                search.TextField(name='collaborators', value = collaborators ),
                search.TextField(name='title', value = empty_string(self.name) ),
                search.TextField(name='account_type', value = empty_string(self.account_type)),
                search.TextField(name='industry', value = empty_string(self.industry)),
                search.DateField(name='created_at', value = self.created_at),
                search.DateField(name='updated_at', value = self.updated_at),
                search.TextField(name='industry', value = empty_string(self.industry)),
                search.TextField(name='tagline', value = empty_string(self.tagline)),
                search.TextField(name='introduction', value = empty_string(self.introduction)),
                search.TextField(name='title_autocomplete', value = empty_string(title_autocomplete)),
                #search.TextField(name='addresses', value = empty_string(addresses)),
               ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)

    @classmethod
    def get_schema(cls,user_from_email, request):
        account = Account.get_by_id(int(request.id))
        if account is None:
            raise endpoints.NotFoundException('Account not found.')
        account_schema = None
        if Node.check_permission(user_from_email,account):
            #list of tags related to this account
            tag_list = Tag.list_by_parent(account.key)
            # list of infonodes
            infonodes = Node.list_info_nodes(
                                            parent_key = account.key,
                                            request = request
                                            )
            #list of contacts to this account
            contacts = None
            if request.contacts:
                contacts = Contact.list_by_parent(
                                            user_from_email = user_from_email,
                                            parent_key = account.key,
                                            request = request
                                            )
            #list of topics related to this account
            topics = None
            if request.topics:
                topics = Note.list_by_parent(
                                            parent_key = account.key,
                                            request = request
                                            )
            tasks = None
            if request.tasks:
                tasks = Task.list_by_parent(
                                            parent_key = account.key,
                                            request = request
                                            )
            events = None
            if request.events:
                events = Event.list_by_parent(
                                            parent_key = account.key,
                                            request = request
                                            )
            needs = None
            if request.needs:
                needs = Need.list_by_parent(
                                            parent_key = account.key,
                                            request = request
                                            )
            opportunities = None
            if request.opportunities:
                opportunities = Opportunity.list_by_parent(
                                            user_from_email = user_from_email,
                                            parent_key = account.key,
                                            request = request
                                            )
            cases = None
            if request.cases:
                cases = Case.list_by_parent(
                                            user_from_email = user_from_email,
                                            parent_key = account.key,
                                            request = request
                                            )
            documents = None
            if request.documents:
                documents = Document.list_by_parent(
                                            parent_key = account.key,
                                            request = request
                                            )
            owner = model.User.get_by_gid(account.owner)
            owner_schema = iomessages.UserSchema(
                                                id = str(owner.id),
                                                email = owner.email,
                                                google_display_name = owner.google_display_name,
                                                google_public_profile_photo_url=owner.google_public_profile_photo_url,
                                                google_public_profile_url=owner.google_public_profile_url,
                                                google_user_id = owner.google_user_id
                                                )
            account_schema = AccountSchema(
                                      id = str( account.key.id() ),
                                      entityKey = account.key.urlsafe(),
                                      access = account.access,
                                      folder = account.folder,
                                      name = account.name,
                                      account_type = account.account_type,
                                      industry = account.industry,
                                      tagline = account.tagline,
                                      introduction = account.introduction,
                                      logo_img_id = account.logo_img_id,
                                      logo_img_url = account.logo_img_url,
                                      tags = tag_list,
                                      contacts = contacts,
                                      topics = topics,
                                      tasks = tasks,
                                      events = events,
                                      needs = needs,
                                      opportunities = opportunities,
                                      cases = cases,
                                      documents = documents,
                                      infonodes = infonodes,
                                      created_at = account.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                                      updated_at = account.updated_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                                      owner = owner_schema
                                    )
            return  account_schema
        else:
            raise endpoints.NotFoundException('Permission denied')


    @classmethod
    def patch(cls,user_from_email,request):
        print 'ok start'
        account = cls.get_by_id(int(request.id))
        if account is None:
            raise endpoints.NotFoundException('Account not found.')
        EndpointsHelper.share_related_documents_after_patch(
                                                            user_from_email,
                                                            account,
                                                            request
                                                          )
        print 'until prop ok print props'
        properties = ['owner', 'name', 'account_type', 'industry', 'tagline', 
                    'introduction', 'access', 'logo_img_id', 'logo_img_url']
        print properties
        for p in properties:
            print p
            print 'check'
            if hasattr(request,p):
                print 'ok'
                if (eval('account.' + p) != eval('request.' + p)) \
                and(eval('request.' + p) and not(p in ['put', 'set_perm', 'put_index'])):
                    exec('account.' + p + '= request.' + p)
        account_key_async = account.put_async()
        data = {}
        data['id'] = account.key.id()
        account.put_index(data)
        get_schema_request = AccountGetRequest(id=int(request.id))
        return cls.get_schema(user_from_email,get_schema_request)
    @classmethod
    def insert(cls,user_from_email,request):
        account=None
        account_key = cls.get_key_by_name(
                                        user_from_email= user_from_email,
                                        name = request.name
                                        )
        if account_key:
            account_key_async = account_key
        else:
            account = cls(
                        name = request.name,
                        account_type = request.account_type,
                        industry = request.industry,
                        tagline = request.tagline,
                        introduction = request.introduction,
                        owner = user_from_email.google_user_id,
                        organization = user_from_email.organization,
                        access = request.access,
                        logo_img_id = request.logo_img_id,
                        logo_img_url = request.logo_img_url
                        )
            account_key = account.put_async()
            account_key_async = account_key.get_result()
            # Reports.add_account(user_from_email)
            # taskqueue.add(
            #                 url='/workers/createobjectfolder',
            #                 queue_name='iogrow-low',
            #                 params={
            #                         'kind': "Account",
            #                         'folder_name': request.name,
            #                         'email': user_from_email.email,
            #                         'obj_key':account_key_async.urlsafe(),
            #                         'logo_img_id':request.logo_img_id
            #                         }
            #                 )
        if request.contacts:
            account_key_str = account_key_async.urlsafe()
            for contact in request.contacts:
                contact.account = account_key_str
                contact.access = request.access
                Contact.insert(user_from_email,contact)
        for email in request.emails:
            Node.insert_info_node(
                            account_key_async,
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
                            account_key_async,
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
                            account_key_async,
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
                            account_key_async,
                            iomessages.InfoNodeRequestSchema(
                                                            kind = infonode.kind,
                                                            fields = infonode.fields
                                                        )
                                                    )



        if account:
            data = {}
            data['id'] = account_key_async.id()
            account.put_index(data)
        if request.logo_img_id:
            taskqueue.add(
                            url='/workers/sharedocument',
                            queue_name='iogrow-low',
                            params={
                                    'user_email':user_from_email.email,
                                    'access': 'anyone',
                                    'resource_id': request.logo_img_id
                                    }
                        )
        taskqueue.add(
                            url='/workers/get_company_from_linkedin',
                            queue_name='iogrow-low',
                            params={'entityKey' :account_key_async.urlsafe()}
                        )
        taskqueue.add(
                            url='/workers/get_company_from_twitter',
                            queue_name='iogrow-low',
                            params={'entityKey' :account_key_async.urlsafe()}
                        )
        account_schema = AccountSchema(
                                  id = str( account_key_async.id() ),
                                  entityKey = account_key_async.urlsafe()
                                  )
        
        return account_schema
    @classmethod
    def list(cls,user_from_email,request):
        curs = Cursor(urlsafe=request.pageToken)
        if request.limit:
            limit = int(request.limit)
        else:
            limit = 10
        items = []
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
                    accounts, next_curs, more =  cls.query().filter(cls.organization==user_from_email.organization).order(+attr).fetch_page(limit, start_cursor=curs)
                else:
                    accounts, next_curs, more = cls.query().filter(cls.organization==user_from_email.organization).order(-attr).fetch_page(limit, start_cursor=curs)
            else:
                accounts, next_curs, more = cls.query().filter(cls.organization==user_from_email.organization).fetch_page(limit, start_cursor=curs)
            for account in accounts:
                if count<= limit:
                    is_filtered = True
                    if request.tags and is_filtered:
                        end_node_set = [ndb.Key(urlsafe=tag_key) for tag_key in request.tags]
                        if not Edge.find(start_node=account.key,kind='tags',end_node_set=end_node_set,operation='AND'):
                            is_filtered = False
                    if request.owner and account.owner!=request.owner and is_filtered:
                        is_filtered = False
                    if is_filtered and Node.check_permission(user_from_email,account):
                        count = count + 1
                        #list of tags related to this account
                        tag_list = Tag.list_by_parent(parent_key = account.key)
                        account_schema = AccountSchema(
                                  id = str( account.key.id() ),
                                  entityKey = account.key.urlsafe(),
                                  name = account.name,
                                  account_type = account.account_type,
                                  industry = account.industry,
                                  logo_img_id = account.logo_img_id,
                                  logo_img_url = account.logo_img_url,
                                  tags = tag_list,
                                  created_at = account.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                                  updated_at = account.updated_at.strftime("%Y-%m-%dT%H:%M:00.000")
                                )
                        items.append(account_schema)
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
        return  AccountListResponse(items = items, nextPageToken = next_curs_url_safe)

    @classmethod
    def search(cls,user_from_email,request):
        organization = str(user_from_email.organization.id())
        index = search.Index(name="GlobalIndex")
        #Show only objects where you have permissions
        query_string = SEARCH_QUERY_MODEL % {
                               "type": "Account",
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
            options = search.QueryOptions(limit=limit + 1, cursor=cursor)
        else:
            options = search.QueryOptions(cursor=cursor)
        query = search.Query(query_string=query_string, options=options)
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
                        'id': scored_document.doc_id
                    }
                    for e in scored_document.fields:
                        if e.name in ["entityKey", "title"]:
                            if e.name == "title":
                                kwargs["name"] = e.value
                            else:
                                kwargs[e.name] = e.value
                    search_results.append(AccountSearchResult(**kwargs))

        except search.Error:
            logging.exception('Search failed')
        return AccountSearchResults(
                                    items=search_results,
                                    nextPageToken=next_cursor
                                    )
    @classmethod
    def get_key_by_name(cls,user_from_email,name):
        index = search.Index(name="GlobalIndex")
        options = search.QueryOptions(limit=1)
        query_string = 'type:Account AND title:\"' + name +'\" AND organization:' + str(user_from_email.organization.id())
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
                        if e.name in ["entityKey", "title"]:
                            if e.name == "title":
                                kwargs["name"] = e.value
                            else:
                                kwargs[e.name] = e.value
                    search_results.append(AccountSearchResult(**kwargs))
        except search.Error:
            logging.exception('Search failed')
        if search_results:
            account_key = ndb.Key(urlsafe=search_results[0].entityKey)
            return account_key
        else:
            return None

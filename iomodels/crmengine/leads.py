import endpoints
from google.appengine.ext import ndb
from google.appengine.api import taskqueue
from google.appengine.datastore.datastore_query import Cursor
from google.appengine.api import search
from endpoints_proto_datastore.ndb import EndpointsModel
from protorpc import messages
from search_helper import tokenize_autocomplete,SEARCH_QUERY_MODEL
from endpoints_helper import EndpointsHelper
from iomodels.crmengine.tags import Tag,TagSchema
from iomodels.crmengine.tasks import Task,TaskRequest,TaskListResponse
from iomodels.crmengine.events import Event,EventListResponse
from iograph import Node,Edge,InfoNodeListResponse
from iomodels.crmengine.notes import Note,TopicListResponse
from iomodels.crmengine.documents import Document,DocumentListResponse
from iomodels.crmengine.contacts import Contact
from iomodels.crmengine.accounts import Account
from ioreporting import Reports
import model
import iomessages
import tweepy



class LeadFromTwitterRequest(messages.Message):
    user_id = messages.IntegerField(1,required=True)


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
    phones = messages.MessageField(iomessages.PhoneSchema,10, repeated = True)
    emails = messages.MessageField(iomessages.EmailSchema,11, repeated = True)
    addresses = messages.MessageField(iomessages.AddressSchema,12, repeated = True)
    infonodes = messages.MessageField(iomessages.InfoNodeRequestSchema,13, repeated = True)
    profile_img_id = messages.StringField(14)
    profile_img_url = messages.StringField(15)
    industry = messages.StringField(16)

 # The message class that defines the ListRequest schema
class ListRequest(messages.Message):
    limit = messages.IntegerField(1)
    pageToken = messages.StringField(2)

class LeadGetRequest(messages.Message):
    id = messages.IntegerField(1,required = True)
    topics = messages.MessageField(ListRequest, 2)
    tasks = messages.MessageField(ListRequest, 3)
    events = messages.MessageField(ListRequest, 4)
    documents = messages.MessageField(ListRequest, 5)

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

class LeadSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    firstname = messages.StringField(3)
    lastname = messages.StringField(4)
    company = messages.StringField(5)
    title = messages.StringField(6)
    tagline = messages.StringField(7)
    introduction = messages.StringField(8)
    infonodes = messages.MessageField(InfoNodeListResponse,9)
    topics = messages.MessageField(TopicListResponse,10)
    tasks = messages.MessageField(TaskListResponse,11)
    events = messages.MessageField(EventListResponse,12)
    documents = messages.MessageField(DocumentListResponse,13)
    source = messages.StringField(14)
    status = messages.StringField(15)
    tags = messages.MessageField(TagSchema,16, repeated = True)
    created_at = messages.StringField(17)
    updated_at = messages.StringField(18)
    access = messages.StringField(19)
    folder = messages.StringField(20)
    profile_img_id = messages.StringField(21)
    profile_img_url = messages.StringField(22)
    industry = messages.StringField(23)
    owner = messages.MessageField(iomessages.UserSchema,24)

class LeadListRequest(messages.Message):
    limit = messages.IntegerField(1)
    pageToken = messages.StringField(2)
    order = messages.StringField(3)
    tags = messages.StringField(4,repeated = True)
    owner = messages.StringField(5)
    status = messages.StringField(6)

class LeadListResponse(messages.Message):
    items = messages.MessageField(LeadSchema, 1, repeated=True)
    nextPageToken = messages.StringField(2)

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
    _message_fields_schema = ('id','entityKey','folder', 'owner', 'access','collaborators_list','collaborators_ids', 'firstname','lastname','company' ,'title','tagline','introduction','status','created_at','updated_at','show','show_name','feedback','feedback_name','source','profile_img_id',
'profile_img_url','industry')
    # Sharing fields
    owner = ndb.StringProperty()
    collaborators_list = ndb.StructuredProperty(model.Userinfo,repeated=True)
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
    show_name = ndb.StringProperty()
    feedback = ndb.KeyProperty()
    feedback_name = ndb.StringProperty()
    # public or private
    access = ndb.StringProperty()
    tagline = ndb.StringProperty()
    introduction = ndb.StringProperty()
    profile_img_id = ndb.StringProperty()
    profile_img_url = ndb.StringProperty()



    def put(self, **kwargs):
        ndb.Model.put(self, **kwargs)
        self.put_index()
        self.set_perm()

    def set_perm(self):
        about_item = str(self.key.id())

        perm = model.Permission(about_kind='Lead',
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
        title_autocomplete = ','.join(tokenize_autocomplete(self.firstname + ' ' + self.lastname +' '+ empty_string(self.title)+ ' ' +empty_string(self.company) + ' ' + empty_string(self.status)))
        #addresses = " \n".join(map(lambda x: " ".join([x.street,x.city,x.state, x.postal_code, x.country]), self.addresses))
        if data:
            search_key = ['infos','contacts','tags','collaborators']
            for key in search_key:
                if key not in data.keys():
                    data[key] = ""
            my_document = search.Document(
            doc_id = str(data['id']),
            fields=[
            search.TextField(name=u'type', value=u'Lead'),
            search.TextField(name='title', value = empty_string(self.firstname) + " " + empty_string(self.lastname)),
            search.TextField(name='organization', value = empty_string(organization) ),
            search.TextField(name='access', value = empty_string(self.access) ),
            search.TextField(name='owner', value = empty_string(self.owner) ),
            search.TextField(name='collaborators', value = data['collaborators']  ),
            search.TextField(name='firstname', value = empty_string(self.firstname) ),
            search.TextField(name='lastname', value = empty_string(self.lastname)),
            search.TextField(name='company', value = empty_string(self.company)),
            search.TextField(name='industry', value = empty_string(self.industry)),
            search.TextField(name='position', value = empty_string(self.title)),
            search.TextField(name='department', value = empty_string(self.department)),
            search.TextField(name='description', value = empty_string(self.description)),
            search.TextField(name='source', value = empty_string(self.source)),
            search.TextField(name='status', value = empty_string(self.status)),
            search.DateField(name='created_at', value = self.created_at),
            search.DateField(name='updated_at', value = self.updated_at),
            search.TextField(name='show_name', value = empty_string(self.show_name)),
            search.TextField(name='tagline', value = empty_string(self.tagline)),
            search.TextField(name='introduction', value = empty_string(self.introduction)),
            search.TextField(name='infos', value= data['infos']),
            search.TextField(name='tags', value= data['tags']),
            search.TextField(name='title_autocomplete', value = empty_string(title_autocomplete)),
           ])
        else:
            my_document = search.Document(
            doc_id = str(self.key.id()),
            fields=[
                search.TextField(name=u'type', value=u'Lead'),
                search.TextField(name='title', value = empty_string(self.firstname) + " " + empty_string(self.lastname)),
                search.TextField(name='organization', value = empty_string(organization) ),
                search.TextField(name='access', value = empty_string(self.access) ),
                search.TextField(name='owner', value = empty_string(self.owner) ),
                search.TextField(name='collaborators', value = collaborators ),
                search.TextField(name='firstname', value = empty_string(self.firstname) ),
                search.TextField(name='lastname', value = empty_string(self.lastname)),
                search.TextField(name='company', value = empty_string(self.company)),
                search.TextField(name='industry', value = empty_string(self.industry)),
                search.TextField(name='position', value = empty_string(self.title)),
                search.TextField(name='department', value = empty_string(self.department)),
                search.TextField(name='description', value = empty_string(self.description)),
                search.TextField(name='source', value = empty_string(self.source)),
                search.TextField(name='status', value = empty_string(self.status)),
                search.DateField(name='created_at', value = self.created_at),
                search.DateField(name='updated_at', value = self.updated_at),
                search.TextField(name='show_name', value = empty_string(self.show_name)),
                search.TextField(name='tagline', value = empty_string(self.tagline)),
                search.TextField(name='introduction', value = empty_string(self.introduction)),
                search.TextField(name='title_autocomplete', value = empty_string(title_autocomplete)),
               ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)

    @classmethod
    def get_schema(cls,user_from_email,request):
        lead = Lead.get_by_id(int(request.id))
        if lead is None:
            raise endpoints.NotFoundException('Lead not found.')
        if not Node.check_permission( user_from_email, lead ):
            raise endpoints.UnauthorizedException('You don\'t have permissions.')
        #list of tags related to this account
        tag_list = Tag.list_by_parent(lead.key)
        # list of infonodes
        infonodes = Node.list_info_nodes(
                                        parent_key = lead.key,
                                        request = request
                                        )
        #list of topics related to this account
        topics = None
        if request.topics:
            topics = Note.list_by_parent(
                                        parent_key = lead.key,
                                        request = request
                                        )
        tasks = None
        if request.tasks:
            tasks = Task.list_by_parent(
                                        parent_key = lead.key,
                                        request = request
                                        )
        events = None
        if request.events:
            events = Event.list_by_parent(
                                        parent_key = lead.key,
                                        request = request
                                        )
        documents = None
        if request.documents:
            documents = Document.list_by_parent(
                                        parent_key = lead.key,
                                        request = request
                                        )
        owner = model.User.get_by_gid(lead.owner)
        owner_schema = iomessages.UserSchema(
                                            id = str(owner.id),
                                            email = owner.email,
                                            google_display_name = owner.google_display_name,
                                            google_public_profile_photo_url=owner.google_public_profile_photo_url,
                                            google_public_profile_url=owner.google_public_profile_url,
                                            google_user_id = owner.google_user_id
                                            )
        lead_schema = LeadSchema(
                                  id = str( lead.key.id() ),
                                  entityKey = lead.key.urlsafe(),
                                  access = lead.access,
                                  firstname = lead.firstname,
                                  lastname = lead.lastname,
                                  title = lead.title,
                                  company = lead.company,
                                  source = lead.source,
                                  status = lead.status,
                                  tagline = lead.tagline,
                                  introduction = lead.introduction,
                                  tags = tag_list,
                                  topics = topics,
                                  tasks = tasks,
                                  events = events,
                                  documents = documents,
                                  infonodes = infonodes,
                                  profile_img_id = lead.profile_img_id,
                                  profile_img_url = lead.profile_img_url,
                                  created_at = lead.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                                  updated_at = lead.updated_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                                  industry = lead.industry,
                                  owner = owner_schema
                                )
        return  lead_schema
    @classmethod
    def list(cls,user_from_email,request):
        if request.tags:
            return cls.filter_by_tag(user_from_email,request)
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
                    leads, next_curs, more =  cls.query().filter(cls.organization==user_from_email.organization).order(+attr).fetch_page(limit, start_cursor=curs)
                else:
                    leads, next_curs, more = cls.query().filter(cls.organization==user_from_email.organization).order(-attr).fetch_page(limit, start_cursor=curs)
            else:
                leads, next_curs, more = cls.query().filter(cls.organization==user_from_email.organization).fetch_page(limit, start_cursor=curs)
            for lead in leads:
                if count<limit:
                    is_filtered = True
                    if request.tags and is_filtered:
                        end_node_set = [ndb.Key(urlsafe=tag_key) for tag_key in request.tags]
                        if not Edge.find(start_node=lead.key,kind='tags',end_node_set=end_node_set,operation='AND'):
                            is_filtered = False
                    if request.owner and lead.owner!=request.owner and is_filtered:
                        is_filtered = False
                    if request.status and lead.status!=request.status and is_filtered:
                        is_filtered = False
                    if is_filtered and Node.check_permission( user_from_email, lead ):
                        count = count + 1
                        #list of tags related to this lead
                        tag_list = Tag.list_by_parent(parent_key = lead.key)
                        lead_schema = LeadSchema(
                                  id = str( lead.key.id() ),
                                  entityKey = lead.key.urlsafe(),
                                  firstname = lead.firstname,
                                  lastname = lead.lastname,
                                  title = lead.title,
                                  company = lead.company,
                                  tags = tag_list,
                                  profile_img_id = lead.profile_img_id,
                                  profile_img_url = lead.profile_img_url,
                                  created_at = lead.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                                  updated_at = lead.updated_at.strftime("%Y-%m-%dT%H:%M:00.000")
                                )
                        items.append(lead_schema)
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
        return  LeadListResponse(items = items, nextPageToken = next_curs_url_safe)
    @classmethod
    def filter_by_tag(cls,user_from_email,request):
        items = []
        tag_keys = []
        for tag_key_str in request.tags:
            tag_keys.append(ndb.Key(urlsafe=tag_key_str))
        lead_keys = Edge.filter_by_set(tag_keys,'tagged_on')
        leads = ndb.get_multi(lead_keys)
        for lead in leads:
            if lead is not None:
                is_filtered = True
                if request.owner and lead.owner!=request.owner and is_filtered:
                    is_filtered = False
                if request.status and lead.status!=request.status and is_filtered:
                    is_filtered = False
                if is_filtered and Node.check_permission( user_from_email, lead ):
                    tag_list = Tag.list_by_parent(parent_key = lead.key)
                    lead_schema = LeadSchema(
                                      id = str( lead.key.id() ),
                                      entityKey = lead.key.urlsafe(),
                                      firstname = lead.firstname,
                                      lastname = lead.lastname,
                                      title = lead.title,
                                      company = lead.company,
                                      tags = tag_list,
                                      profile_img_id = lead.profile_img_id,
                                      profile_img_url = lead.profile_img_url,
                                      created_at = lead.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                                      updated_at = lead.updated_at.strftime("%Y-%m-%dT%H:%M:00.000")
                                    )
                    items.append(lead_schema)
        return  LeadListResponse(items = items)

    @classmethod
    def search(cls,user_from_email,request):
        organization = str(user_from_email.organization.id())
        index = search.Index(name="GlobalIndex")
        #Show only objects where you have permissions
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
    def insert(cls,user_from_email,request):
        folder_name = request.firstname + ' ' + request.lastname
        lead = cls(
                    firstname = request.firstname,
                    lastname = request.lastname,
                    title = request.title,
                    company = request.company,
                    status = "New",
                    source = request.source,
                    tagline = request.tagline,
                    introduction = request.introduction,
                    owner = user_from_email.google_user_id,
                    organization = user_from_email.organization,
                    access = request.access,
                    profile_img_id = request.profile_img_id,
                    profile_img_url = request.profile_img_url,
                    industry = request.industry
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
                                                            field = 'email',
                                                            value = email.email
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
                        lead_key_async,
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
                        lead_key_async,
                        iomessages.InfoNodeRequestSchema(
                                                        kind = infonode.kind,
                                                        fields = infonode.fields
                                                    )
                                                )

        if request.profile_img_id:
            taskqueue.add(
                            url='/workers/sharedocument',
                            queue_name='iogrow-low',
                            params={
                                    'user_email':user_from_email.email,
                                    'access': 'anyone',
                                    'resource_id': request.profile_img_id
                                    }
                        )
        data = {}
        data['id'] = lead_key_async.id()
        lead.put_index(data)
        lead_schema = LeadSchema(
                                  id = str( lead_key_async.id() ),
                                  entityKey = lead_key_async.urlsafe(),
                                  firstname = lead.firstname,
                                  lastname = lead.lastname,
                                  title = lead.title,
                                  company = lead.company,
                                  source = lead.source,
                                  status = lead.status,
                                  created_at = lead.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                                  updated_at = lead.updated_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                                  industry = lead.industry
                                )
        taskqueue.add(
                            url='/workers/get_from_linkedin',
                            queue_name='iogrow-low',
                            params={'entityKey' :lead_key_async.urlsafe()}
                        )
        taskqueue.add(
                        url='/workers/get_from_twitter',
                        queue_name="iogrow-low",
                        params={'entityKey': lead_key_async.urlsafe()}
                    )
        Reports.add_lead(user_from_email)
        return lead_schema
    @classmethod
    def from_twitter(cls,user_from_email,request):
        try:
            credentials = {
            	'consumer_key' : 'YM7Glbdf9M9WyaaKh6DNOQ',
            	'consumer_secret' : 'CGDvSvuohsJF1YUJwDFc3EsuTg8BQvHplsYiv7h6Uw',
            	'access_token_key' : '50290670-HYBgH5DOmLB2LqRB1NXkA2Y28bMCfi5a0yvq9YWUw',
            	'access_token_secret' : 'UfehG5RWaTNZTwCEERImSeUVwVlXM6mY1ly3lYjiWaqIc'
            }
            auth = tweepy.OAuthHandler(credentials['consumer_key'], credentials['consumer_secret'])
            auth.set_access_token(credentials['access_token_key'], credentials['access_token_secret'])
            api = tweepy.API(auth)
            twitter_lead = api.get_user(user_id=request.user_id)
        except (IndexError, TypeError):
            raise endpoints.NotFoundException('an error has occured try again' %
                                                  (request.screen_name,))
        import_request = LeadInsertRequest(
                                          firstname = twitter_lead.name.split()[0],
                                          lastname = " ".join(twitter_lead.name.split()[1:]),
                                          introduction = twitter_lead.description,
                                          profile_img_url = twitter_lead.profile_image_url
                                          )
        lead = cls.insert(user_from_email,import_request)
        return lead
    @classmethod
    def convert(cls,user_from_email,request):
        try:
            lead = Lead.get_by_id(int(request.id))
        except (IndexError, TypeError):
            raise endpoints.NotFoundException('Lead %s not found.' %
                                                  (request.id,))
        contact = Contact(
                            owner = lead.owner,
                            organization = lead.organization,
                            access = lead.access,
                            firstname = lead.firstname,
                            lastname = lead.lastname,
                            title = lead.title,
                            tagline = lead.tagline,
                            introduction = lead.introduction,
                            profile_img_id = lead.profile_img_id,
                            profile_img_url = lead.profile_img_url
                        )

        contact_key = contact.put_async()
        contact_key_async = contact_key.get_result()
        if lead.company:
            account = Account(
                                owner = lead.owner,
                                organization = lead.organization,
                                access = lead.access,
                                account_type = 'prospect',
                                name=lead.company
                            )
            account_key = account.put_async()
            account_key_async = account_key.get_result()
            account_id = str(account_key_async.id())
            data = {}
            data['id'] = account_key_async.id()
            account.put_index(data)
            Edge.insert(
                        start_node = account_key_async,
                        end_node = contact_key_async,
                        kind = 'contacts',
                        inverse_edge = 'parents'
                        )
            EndpointsHelper.update_edge_indexes(
                                            parent_key = contact_key_async,
                                            kind = 'contacts',
                                            indexed_edge = account_id
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
                                start_node = contact_key_async,
                                end_node = tag_key_async,
                                kind = 'tags',
                                inverse_edge = 'tagged_on'
                            )
            EndpointsHelper.update_edge_indexes(
                                                parent_key = contact_key_async,
                                                kind = 'tags',
                                                indexed_edge = str(tag_key_async.id())
                                            )
            tag_edge_key = ndb.Key(urlsafe=tag.edgeKey)
            tag_edge_key.delete()
        edge_list = Edge.query(Edge.start_node == lead.key).fetch()
        for edge in edge_list:
            Edge.move(edge,contact_key_async)

        lead.key.delete()
        EndpointsHelper.delete_document_from_index( id = request.id )
        Reports.add_lead(user_from_email,nbr=-1)
        Reports.add_contact(user_from_email)
        return LeadSchema(id = str(contact_key_async.id()) )

    @classmethod
    def patch(cls,user_from_email,request):
        lead = cls.get_by_id(int(request.id))
        if lead is None:
            raise endpoints.NotFoundException('Lead not found.')
        EndpointsHelper.share_related_documents_after_patch(
                                                            user_from_email,
                                                            lead,
                                                            request
                                                          )
        properties = ['owner', 'firstname', 'lastname', 'company', 'title', 
                    'tagline', 'introduction', 'source','status', 'access',
                    'profile_img_id','profile_img_url','industry']
        for p in properties:
            if hasattr(request,p):
                if (eval('lead.' + p) != eval('request.' + p)) \
                and(eval('request.' + p) and not(p in ['put', 'set_perm', 'put_index'])):
                    exec('lead.' + p + '= request.' + p)
        lead_key_async = lead.put_async()
        data = {}
        data['id'] = lead.key.id()
        lead.put_index(data)
        get_schema_request = LeadGetRequest(id=int(request.id))
        return cls.get_schema(user_from_email,get_schema_request)

from google.appengine.ext import ndb
from google.appengine.datastore.datastore_query import Cursor
from google.appengine.api import search 
from endpoints_proto_datastore.ndb import EndpointsModel
from protorpc import messages
from search_helper import tokenize_autocomplete,SEARCH_QUERY_MODEL
from iomodels.crmengine.tags import Tag,TagSchema
from iograph import Edge
import model

class LeadSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    firstname = messages.StringField(3)
    lastname = messages.StringField(4)
    company = messages.StringField(5)
    title = messages.StringField(6)
    source = messages.StringField(7)
    status = messages.StringField(8)
    tags = messages.MessageField(TagSchema,9, repeated = True)
    created_at = messages.StringField(10)
    updated_at = messages.StringField(11)

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
    _message_fields_schema = ('id','entityKey','folder', 'owner', 'access','collaborators_list','collaborators_ids', 'firstname','lastname','company' ,'title','tagline','introduction','phones','emails','addresses','websites','sociallinks','status','created_at','updated_at','show','show_name','feedback','feedback_name','source')
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
    phones = ndb.StructuredProperty(model.Phone,repeated=True)
    emails = ndb.StructuredProperty(model.Email,repeated=True)
    addresses = ndb.StructuredProperty(model.Address,repeated=True)
    websites = ndb.StructuredProperty(model.Website,repeated=True)
    sociallinks= ndb.StructuredProperty(model.Social,repeated=True)


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
        emails = " ".join(map(lambda x: x.email,  self.emails))
        phones = " ".join(map(lambda x: x.number,  self.phones))
        websites = " ".join(map(lambda x: x.website,  self.websites))
        #addresses = " \n".join(map(lambda x: " ".join([x.street,x.city,x.state, x.postal_code, x.country]), self.addresses))
        if data:
            search_key = ['infos','contacts','tags']
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
            search.TextField(name='emails', value = empty_string(emails)),
            search.TextField(name='phones', value = empty_string(phones)),
            search.TextField(name='websites', value = empty_string(websites)),
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
                search.TextField(name='emails', value = empty_string(emails)),
                search.TextField(name='phones', value = empty_string(phones)),
                search.TextField(name='websites', value = empty_string(websites)),
                search.TextField(name='title_autocomplete', value = empty_string(title_autocomplete)),
               ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)

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
                    leads, next_curs, more =  cls.query().filter(cls.organization==user_from_email.organization).order(+attr).fetch_page(limit, start_cursor=curs)
                else:
                    leads, next_curs, more = cls.query().filter(cls.organization==user_from_email.organization).order(-attr).fetch_page(limit, start_cursor=curs)
            else:
                leads, next_curs, more = cls.query().filter(cls.organization==user_from_email.organization).fetch_page(limit, start_cursor=curs)
            for lead in leads:
                if count<= limit:
                    is_filtered = True
                    if lead.access == 'private' and lead.owner!=user_from_email.google_user_id:
                        end_node_set = [user_from_email.key]
                        if not Edge.find(start_node=lead.key,kind='permissions',end_node_set=end_node_set,operation='AND'):
                            is_filtered = False
                    if request.tags and is_filtered:
                        end_node_set = [ndb.Key(urlsafe=tag_key) for tag_key in request.tags]
                        if not Edge.find(start_node=lead.key,kind='tags',end_node_set=end_node_set,operation='AND'):
                            is_filtered = False
                    if request.owner and lead.owner!=request.owner and is_filtered:
                        is_filtered = False
                    if request.status and lead.status!=request.status and is_filtered:
                        is_filtered = False
                    if is_filtered:
                        count = count + 1
                        #list of tags related to this lead
                        edge_list = Edge.list(start_node=lead.key,kind='tags')
                        tag_list = Tag.list_by_parent(parent_key = lead.key)
                        lead_schema = LeadSchema(
                                  id = str( lead.key.id() ),
                                  entityKey = lead.key.urlsafe(),
                                  firstname = lead.firstname,
                                  lastname = lead.lastname,
                                  title = lead.title,
                                  company = lead.company,
                                  tags = tag_list,
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
                results = index.search(query)
                #total_matches = results.number_found
                # Iterate over the documents in the results
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
                    next_cursor = scored_document.cursor.web_safe_string
                if next_cursor:
                    next_query_options = search.QueryOptions(
                                                             limit=1,
                                                             cursor=scored_document.cursor
                                                             )
                    next_query = search.Query(
                                              query_string=query_string,
                                              options=next_query_options
                                              )
                    if next_query:
                        next_results = index.search(next_query)
                        if len(next_results.results)==0:
                            next_cursor = None
        except search.Error:
            logging.exception('Search failed')
        return LeadSearchResults(
                                 items=search_results,
                                 nextPageToken=next_cursor
                                 )

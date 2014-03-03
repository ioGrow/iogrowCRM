from google.appengine.ext import ndb
from google.appengine.datastore.datastore_query import Cursor
from endpoints_proto_datastore.ndb import EndpointsModel
from google.appengine.api import search
from protorpc import messages
from search_helper import tokenize_autocomplete,SEARCH_QUERY_MODEL
from iomodels.crmengine.tags import Tag,TagSchema
from iograph import Node,Edge,InfoNodeListResponse
import model


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
    probability = messages.StringField(5)
    type_case = messages.StringField(6)
    contact_name = messages.StringField(7)
    account_name = messages.StringField(8)
    tags = messages.MessageField(TagSchema,9, repeated = True)
    created_at = messages.StringField(10)
    updated_at = messages.StringField(11)
    priority = messages.IntegerField(12)

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
    _message_fields_schema = ('id','entityKey','owner','folder', 'access','collaborators_list','collaborators_ids',  'name','status','type_case','priority','account','account_name','contact','contact_name','created_at','updated_at')
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
    # public or private
    access = ndb.StringProperty()
    
    def put(self, **kwargs):
        ndb.Model.put(self, **kwargs)
        self.put_index()
        self.set_perm()

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
            search_key = ['infos','contacts','tags']
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
                search.TextField(name='collaborators', value = collaborators ),
                search.TextField(name='title', value = empty_string(self.name) ),
                search.TextField(name='account_name', value = empty_string(self.account_name) ),
                search.TextField(name='contact_name', value = empty_string(self.contact_name) ),
                search.TextField(name='status', value = empty_string(self.status)),
                search.NumberField(name='priority', value = int(self.priority)),
                search.DateField(name='created_at', value = self.created_at),
                search.DateField(name='updated_at', value = self.updated_at),
                search.TextField(name='infos', value= data['infos']),
                search.TextField(name='tags', value= data['tags']),
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
                    cases, next_curs, more =  cls.query().filter(cls.organization==user_from_email.organization).order(+attr).fetch_page(limit, start_cursor=curs)
                else:
                    cases, next_curs, more = cls.query().filter(cls.organization==user_from_email.organization).order(-attr).fetch_page(limit, start_cursor=curs)
            else:
                cases, next_curs, more = cls.query().filter(cls.organization==user_from_email.organization).fetch_page(limit, start_cursor=curs)
            for case in cases:
                if count<= limit:
                    is_filtered = True
                    if case.access == 'private' and case.owner!=user_from_email.google_user_id:
                        end_node_set = [user_from_email.key]
                        if not Edge.find(start_node=case.key,kind='permissions',end_node_set=end_node_set,operation='AND'):
                            is_filtered = False
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
                    if is_filtered:
                        count = count + 1
                        #list of tags related to this case
                        tag_list = Tag.list_by_parent(parent_key = case.key)
                        case_schema = CaseSchema(
                                  id = str( case.key.id() ),
                                  entityKey = case.key.urlsafe(),
                                  name = case.name,
                                  status = case.status,
                                  priority = case.priority,
                                  contact_name = case.contact_name,
                                  account_name = case.account_name,
                                  type_case = case.type_case,
                                  tags = tag_list,
                                  created_at = case.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                                  updated_at = case.updated_at.strftime("%Y-%m-%dT%H:%M:00.000")
                                )
                        items.append(case_schema)
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
                results = index.search(query)
                #total_matches = results.number_found
                # Iterate over the documents in the results
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
                            if len(next_results.results) == 0:
                                next_cursor = None
        except search.Error:
            logging.exception('Search failed')
        return CaseSearchResults(
                                 items=search_results,
                                 nextPageToken=next_cursor
                                 )

    

  
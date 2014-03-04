from google.appengine.ext import ndb
from google.appengine.datastore.datastore_query import Cursor
from endpoints_proto_datastore.ndb import EndpointsModel
from google.appengine.api import search 
from protorpc import messages
from search_helper import tokenize_autocomplete,SEARCH_QUERY_MODEL
from endpoints_helper import EndpointsHelper
from iomodels.crmengine.tags import Tag,TagSchema
from iograph import Edge
import model

class ContactInsertRequest(messages.Message):
    account = messages.StringField(1)
    firstname = messages.StringField(2)
    lastname = messages.StringField(3)
    title = messages.StringField(4)
    access = messages.StringField(5)
    
class ContactSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    firstname = messages.StringField(3)
    lastname = messages.StringField(4)
    account_name = messages.StringField(5)
    title = messages.StringField(6)
    tags = messages.MessageField(TagSchema,7, repeated = True)
    created_at = messages.StringField(8)
    updated_at = messages.StringField(9)

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
    account_name = messages.StringField(5)
    account = messages.StringField(6)
    position = messages.StringField(7)

# The message class that defines a set of contacts.search results
class ContactSearchResults(messages.Message):
    items = messages.MessageField(ContactSearchResult, 1, repeated=True)
    nextPageToken = messages.StringField(2)

class Contact(EndpointsModel):
    _message_fields_schema = ('id','entityKey','owner', 'folder','created_at','updated_at',  'access','collaborators_list','collaborators_ids','display_name', 'firstname','lastname','title','company','account','account_name','introduction','tagline','phones','emails','addresses','websites','sociallinks')
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
    phones = ndb.StructuredProperty(model.Phone,repeated=True)
    emails = ndb.StructuredProperty(model.Email,repeated=True)
    addresses = ndb.StructuredProperty(model.Address,repeated=True)
    websites = ndb.StructuredProperty(model.Website,repeated=True)
    sociallinks= ndb.StructuredProperty(model.Social,repeated=True)
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
            search_key = ['infos','contacts','tags']
            for key in search_key:
                if key not in data.keys():
                    data[key] = ""
            my_document = search.Document(
            doc_id = str(data['id']),
            fields=[
                search.TextField(name=u'type', value=u'Contact'),
                search.TextField(name='title', value = empty_string(self.firstname) + " " + empty_string(self.lastname)),
                search.TextField(name='organization', value = empty_string(organization) ),
                search.TextField(name='access', value = empty_string(self.access) ),
                search.TextField(name='owner', value = empty_string(self.owner) ),
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
    def list_by_parent(cls,parent_key,request):
        contact_list = []
        contact_edge_list = Edge.list(
                                start_node = parent_key,
                                kind='contacts',
                                limit=request.contacts.limit,
                                pageToken=request.contacts.pageToken
                                )
        for edge in contact_edge_list['items']:
                contact_list.append(
                                    ContactSchema(
                                               firstname = edge.end_node.get().firstname,
                                               lastname = edge.end_node.get().lastname,
                                               title = edge.end_node.get().title
                                               )
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
                    if contact.access == 'private' and contact.owner!=user_from_email.google_user_id:
                        end_node_set = [user_from_email.key]
                        if not Edge.find(start_node=contact.key,kind='permissions',end_node_set=end_node_set,operation='AND'):
                            is_filtered = False
                    if request.tags and is_filtered:
                        end_node_set = [ndb.Key(urlsafe=tag_key) for tag_key in request.tags]
                        if not Edge.find(start_node=contact.key,kind='tags',end_node_set=end_node_set,operation='AND'):
                            is_filtered = False
                    if request.owner and contact.owner!=request.owner and is_filtered:
                        is_filtered = False
                    if is_filtered:
                        count = count + 1
                        #list of tags related to this contact
                        tag_list = Tag.list_by_parent(parent_key = contact.key)
                        contact_schema = ContactSchema(
                                  id = str( contact.key.id() ),
                                  entityKey = contact.key.urlsafe(),
                                  firstname = contact.firstname,
                                  lastname = contact.lastname,
                                  title = contact.title,
                                  account_name = contact.account_name,
                                  tags = tag_list,
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
                results = index.search(query)
                # Iterate over the documents in the results
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
        return ContactSearchResults(
                                    items=search_results,
                                    nextPageToken=next_cursor
                                    )
    @classmethod
    def insert(cls,user_from_email,request):
        folder_name = request.firstname + ' ' + request.lastname
        created_folder = EndpointsHelper.insert_folder(
                                                       user_from_email,
                                                       folder_name,
                                                       'Contact'
                                                       )
        contact = cls(
                    firstname = request.firstname,
                    lastname = request.lastname,
                    owner = user_from_email.google_user_id,
                    organization = user_from_email.organization,
                    access = request.access,
                    folder = created_folder['id']
                    )
        if request.title:
            contact.title = request.title
        contact_key = contact.put_async()
        contact_key_async = contact_key.get_result()
        if request.account:
            account_key = ndb.Key(urlsafe=request.account)
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
        return ContactSchema(id=str(contact_key_async.id()))




from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel
from google.appengine.api import search
from search_helper import tokenize_autocomplete,SEARCH_QUERY_MODEL
from protorpc import messages
from iomodels.crmengine.tags import Tag,TagSchema
from iograph import Edge

import model

class NeedSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    name = messages.StringField(3)
    description = messages.StringField(4)
    need_status = messages.StringField(5)
    priority = messages.StringField(6)
    tags = messages.MessageField(TagSchema,7, repeated = True)
    created_at = messages.StringField(8)
    updated_at = messages.StringField(9)
    access = messages.IntegerField(10)

class NeedListResponse(messages.Message):
    items = messages.MessageField(NeedSchema, 1, repeated=True)
    nextPageToken = messages.StringField(2)

class Need(EndpointsModel):
    _message_fields_schema = ('id','entityKey','owner','folder', 'access','collaborators_list','collaborators_ids',  'name','description', 'need_status','priority','about_kind','about_item','about_name','created_at','updated_at')
    # Sharing fields
    owner = ndb.StringProperty()
    collaborators_list = ndb.StructuredProperty(model.Userinfo,repeated=True)
    collaborators_ids = ndb.StringProperty(repeated=True)
    organization = ndb.KeyProperty()
    folder = ndb.StringProperty()
    about_kind = ndb.StringProperty()
    about_item = ndb.StringProperty()
    about_name = ndb.StringProperty()
    name = ndb.StringProperty()
    description = ndb.TextProperty()
    need_status = ndb.StringProperty()
    priority = ndb.StringProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    # public or private
    access = ndb.StringProperty()
    
    def put(self, **kwargs):
        ndb.Model.put(self, **kwargs)
        self.put_index()
        self.set_perm()

    def set_perm(self):
        about_item = str(self.key.id())

        perm = model.Permission(about_kind='Need',
                         about_item=about_item,
                         type = 'user',
                         role = 'owner',
                         value = self.owner)
        perm.put()


    def put_index(self):
        """ index the element at each"""
        empty_string = lambda x: x if x else ""
        collaborators = " ".join(self.collaborators_ids)
        organization = str(self.organization.id())
        title_autocomplete = ','.join(tokenize_autocomplete(self.name + ' '  + empty_string(self.about_name)))
        my_document = search.Document(
        doc_id = str(self.key.id()),
        fields=[
            search.TextField(name=u'type', value=u'Need'),
            search.TextField(name='organization', value = empty_string(organization) ),
            search.TextField(name='access', value = empty_string(self.access) ),
            search.TextField(name='owner', value = empty_string(self.owner) ),
            search.TextField(name='collaborators', value = collaborators ),
            search.TextField(name='title', value = empty_string(self.name) ),
            search.TextField(name='description', value = empty_string(self.description) ),
            search.TextField(name='about_kind', value = empty_string(self.about_kind) ),
            search.TextField(name='about_name', value = empty_string(self.about_name) ),
            search.TextField(name='need_status', value = empty_string(self.need_status)),
            search.TextField(name='priority', value = empty_string(self.priority)),
            search.DateField(name='created_at', value = self.created_at),
            search.DateField(name='updated_at', value = self.updated_at),
            search.TextField(name='title_autocomplete', value = empty_string(title_autocomplete))
           ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)
    @classmethod
    def list_by_parent(cls,parent_key,request):
        need_list = []
        need_edge_list = Edge.list(
                                start_node = parent_key,
                                kind = 'needs',
                                limit = request.needs.limit,
                                pageToken = request.needs.pageToken
                                )
        for edge in document_edge_list['items']:
            need = edge.end_node.get()
            tag_list = Tag.list_by_parent(parent_key = document.key)
            need_list.append(
                            NeedSchema(
                                    id = str( need.key.id() ),
                                    entityKey = need.key.urlsafe(),
                                    name = need.name,
                                    description = need.description ,
                                    need_status = need.need_status,
                                    priority = need.priority,
                                    access = need.access,
                                    tags = tag_list,
                                    created_at = need.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                                    updated_at = need.updated_at.strftime("%Y-%m-%dT%H:%M:00.000")
                                    )
                            )
        if need_edge_list['next_curs'] and need_edge_list['more']:
            need_next_curs = need_edge_list['next_curs'].urlsafe()
        else:
            need_next_curs = None
        return NeedListResponse(
                                    items = need_list,
                                    nextPageToken = need_next_curs
                                )
    

  
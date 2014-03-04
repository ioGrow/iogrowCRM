from google.appengine.ext import ndb
from google.appengine.datastore.datastore_query import Cursor
from google.appengine.api import search 
from search_helper import tokenize_autocomplete,SEARCH_QUERY_MODEL
from protorpc import messages
from endpoints_proto_datastore.ndb import EndpointsModel
from model import Userinfo
from iomodels.crmengine.tags import Tag,TagSchema
from iograph import Edge

import model

class DocumentSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    title = messages.StringField(3)
    resource_id = messages.StringField(4)
    alternateLink = messages.StringField(5)
    thumbnailLink = messages.StringField(6)
    embedLink = messages.StringField(7)
    mimeType = messages.StringField(8)
    tags = messages.MessageField(TagSchema,9, repeated = True)
    created_at = messages.StringField(10)
    updated_at = messages.StringField(11)
    access = messages.IntegerField(12)

class DocumentListResponse(messages.Message):
    items = messages.MessageField(DocumentSchema, 1, repeated=True)
    nextPageToken = messages.StringField(2)

class Document(EndpointsModel):
    # Sharing fields
    _message_fields_schema = ('id','entityKey','mimeType', 'title','about_kind','about_item', 'embedLink', 'updated_at','created_at')
    owner = ndb.StringProperty()
    collaborators_list = ndb.StructuredProperty(model.Userinfo,repeated=True)
    collaborators_ids = ndb.StringProperty(repeated=True)
    author = ndb.StructuredProperty(Userinfo)
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    title = ndb.StringProperty()
    resource_id = ndb.StringProperty()
    alternateLink = ndb.StringProperty()
    thumbnailLink = ndb.StringProperty()
    embedLink = ndb.StringProperty()
    mimeType = ndb.StringProperty()

    # number of comments in this topic
    comments = ndb.IntegerProperty()
    # A Topic is attached to an object for example Account or Opportunity..
    about_kind = ndb.StringProperty()
    about_item = ndb.StringProperty()
    # a key reference to the account's organization
    # Should be required
    organization = ndb.KeyProperty()
    # public or private
    access = ndb.StringProperty()

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


    def put_index(self):
        """ index the element at each"""
        if self.comments is None:
            self.comments = 0
        empty_string = lambda x: x if x else ""
        collaborators = " ".join(self.collaborators_ids)
        organization = str(self.organization.id())
        my_document = search.Document(
        doc_id = str(self.key.id()),
        fields=[
            search.TextField(name=u'type', value=u'Document'),
            search.TextField(name='organization', value = empty_string(organization) ),
            search.TextField(name='access', value = empty_string(self.access) ),
            search.TextField(name='owner', value = empty_string(self.owner) ),
            search.TextField(name='collaborators', value = collaborators ),
            search.TextField(name='title', value = empty_string(self.title) ),
            search.TextField(name='resource_id', value = empty_string(self.resource_id)),
            search.TextField(name='about_kind', value = empty_string(self.about_kind)),
            search.TextField(name='about_item', value = empty_string(self.about_item)),
            search.DateField(name='created_at', value = self.created_at),
            search.DateField(name='updated_at', value = self.updated_at),
            search.NumberField(name='comments', value = self.comments),
           ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)

    @classmethod
    def list_by_parent(cls,parent_key,request):
        document_list = []
        document_edge_list = Edge.list(
                                start_node = parent_key,
                                kind='documents',
                                limit=request.documents.limit,
                                pageToken=request.documents.pageToken
                                )
        for edge in document_edge_list['items']:
            document = edge.end_node.get()
            tag_list = Tag.list_by_parent(parent_key = document.key)
            document_list.append(
                            DocumentSchema(
                                    id = str( document.key.id() ),
                                    entityKey = document.key.urlsafe(),
                                    title = document.title,
                                    resource_id = document.resource_id,
                                    alternateLink = document.alternateLink,
                                    thumbnailLink = document.thumbnailLink,
                                    embedLink = document.embedLink,
                                    mimeType = document.mimeType,
                                    access = document.access,
                                    tags = tag_list,
                                    created_at = document.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                                    updated_at = document.updated_at.strftime("%Y-%m-%dT%H:%M:00.000")
                                    )
                            )
        if document_edge_list['next_curs'] and document_edge_list['more']:
            document_next_curs = document_edge_list['next_curs'].urlsafe()
        else:
            document_next_curs = None
        return DocumentListResponse(
                                    items = document_list,
                                    nextPageToken = document_next_curs
                                )

from google.appengine.ext import ndb
from google.appengine.api import search 
from endpoints_proto_datastore.ndb import EndpointsModel
from model import Userinfo
import pprint


class Document(EndpointsModel):
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
    comments = ndb.IntegerProperty(default=0)
    # A Topic is attached to an object for example Account or Opportunity..
    about_kind = ndb.StringProperty()
    about_item = ndb.StringProperty()
    # a key reference to the account's organization
    # Should be required
    organization = ndb.KeyProperty()

    
    def put(self, **kwargs):
        ndb.Model.put(self, **kwargs)
        
        self.put_index()

    def put_index(self):
        """ index the element at each"""
        empty_string = lambda x: x if x else ""
        my_document = search.Document(
        doc_id = str(self.key.id()),
        fields=[
            search.TextField(name=u'type', value=u'Document'),
            #search.TextField(name='author', value=self.author.name),
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

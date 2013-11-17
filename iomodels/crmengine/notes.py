from google.appengine.ext import ndb
from google.appengine.api import search 
from endpoints_proto_datastore.ndb import EndpointsModel
from model import User
import pprint


class Topic(EndpointsModel):
    #_message_fields_schema = ('id','title')
    
    last_updater = ndb.StructuredProperty(User)
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    title = ndb.StringProperty(required=True)
    # about 100 characters from the beginning of this topic
    excerpt = ndb.StringProperty()
    # number of comments in this topic
    comments = ndb.IntegerProperty(default=0)
    # A Topic is attached to an object for example Account or Opportunity..
    about_kind = ndb.StringProperty()
    about_item = ndb.StringProperty()
    # a key reference to the account's organization
    # Should be required
    note = ndb.KeyProperty()
    organization = ndb.KeyProperty()

class Note(EndpointsModel):

    #_message_fields_schema = ('id','title')
    
   
    author = ndb.StructuredProperty(User)
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    title = ndb.StringProperty(required=True)
    content = ndb.TextProperty()
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
        self._setup()
        self.put_index()

    def put_index(self):
        """ index the element at each"""
        empty_string = lambda x: x if x else ""
        my_document = search.Document(
        doc_id = str(self.key.id()),
        fields=[
            search.TextField(name=u'type', value=u'Note'),
            #search.TextField(name='author', value=self.author.name),
            search.TextField(name='title', value = empty_string(self.title) ),
            search.TextField(name='content', value = empty_string(self.content)),
            search.TextField(name='about_kind', value = empty_string(self.about_kind)),
            search.TextField(name='about_item', value = empty_string(self.about_item)),
            search.DateField(name='created_at', value = self.created_at),
            search.DateField(name='updated_at', value = self.updated_at),
            search.NumberField(name='comments', value = self.comments),
           ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)

    # Attach a topic to this note  
    def _setup(self):
        topic = Topic()
        topic.last_updater = self.author
        topic.title = self.title
        topic.excerpt = self.content
        topic.about_kind = self.about_kind
        topic.about_item = self.about_item
        topic.updated_at = self.updated_at
        topic.note = self.key
        topic.organization = self.organization
        topic.put()




  

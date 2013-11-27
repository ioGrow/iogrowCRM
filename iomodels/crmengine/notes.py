from google.appengine.ext import ndb
from google.appengine.api import search 
from endpoints_proto_datastore.ndb import EndpointsModel
from model import Userinfo
import pprint


import model

class Topic(EndpointsModel):

    _message_fields_schema = ('id','title','updated_at','last_updater','excerpt','discussionId','created_at')
    

    last_updater = ndb.StructuredProperty(Userinfo)

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
    discussionKind = ndb.StringProperty()
    discussionId = ndb.StringProperty()
    organization = ndb.KeyProperty()


class Note(EndpointsModel):

    #_message_fields_schema = ('id','title')
    author = ndb.StructuredProperty(Userinfo)
    # Sharing fields
    owner = ndb.StringProperty()
    collaborators_list = ndb.StructuredProperty(model.Userinfo,repeated=True)
    collaborators_ids = ndb.StringProperty(repeated=True)
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
    # public or private
    access = ndb.StringProperty()

    
    def put(self, **kwargs):
        ndb.Model.put(self, **kwargs)
        self._setup()
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
        empty_string = lambda x: x if x else ""
        collaborators = " ".join(self.collaborators_ids)
        organization = str(self.organization.id())
        my_document = search.Document(
        doc_id = str(self.key.id()),
        fields=[
            search.TextField(name=u'type', value=u'Note'),
            search.TextField(name='organization', value = empty_string(organization) ),
            search.TextField(name='access', value = empty_string(self.access) ),
            search.TextField(name='owner', value = empty_string(self.owner) ),
            search.TextField(name='collaborators', value = collaborators ),
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
        topic.discussionKind = 'Note'
        topic.discussionId = str(self.key.id())
        topic.organization = self.organization
        topic.put()




  

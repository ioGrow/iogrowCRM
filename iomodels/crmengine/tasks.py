from google.appengine.ext import ndb
from google.appengine.api import search 
from endpoints_proto_datastore.ndb import EndpointsModel
from iomodels.crmengine.notes import Topic
from model import User
import pprint


class Task(EndpointsModel):
    owner = ndb.StructuredProperty(User)
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    title = ndb.StringProperty(required=True)
    due = ndb.DateTimeProperty()
    status = ndb.StringProperty(default='open')
    completed_by = ndb.StructuredProperty(User)
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
        empty_number = lambda x: x if x else 0
        my_document = search.Document(
        doc_id = str(self.key.id()),
        fields=[
            search.TextField(name=u'type', value=u'Task'),
            #search.TextField(name='owner', value=self.owner.name),
            #search.TextField(name='organization', value = self.organization ),
            search.TextField(name='title', value = empty_string(self.title) ),
            search.TextField(name='status', value = empty_string(self.status)),
            search.DateField(name='created_at', value = self.created_at),
            search.DateField(name='updated_at', value = self.updated_at),
            #search.DateField(name='due', value = self.due),
            search.NumberField(name='comments', value = self.comments),
            search.TextField(name='about_kind', value = empty_string(self.about_kind)),
            search.TextField(name='about_item', value = empty_string(self.about_item)),
           ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)
  

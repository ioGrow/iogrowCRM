from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel
from model import User
import pprint


class Topic(EndpointsModel):
  
  
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
  # Attach a topic to this note  
  def _setup(self):

      topic = Topic()
      topic.last_updater = self.author
      topic.title = self.title
      topic.excerpt = self.content
      topic.about_kind = self.about_kind
      topic.about_item = self.about_item
      topic.note = self.key
      topic.organization = self.organization
      topic.put()




  
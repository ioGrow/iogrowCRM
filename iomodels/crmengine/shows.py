from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel
from model import User
import pprint


class Show(EndpointsModel):
  _message_fields_schema = ('id', 'title','starts_at','ends_at','description','tags','youtube_url','is_published','status')
  owner = ndb.StructuredProperty(User)
  created_at = ndb.DateTimeProperty(auto_now_add=True)
  updated_at = ndb.DateTimeProperty(auto_now=True)
  title = ndb.StringProperty(required=True)
  starts_at = ndb.DateTimeProperty()
  ends_at = ndb.DateTimeProperty()
  description = ndb.TextProperty()
  youtube_url = ndb.StringProperty()
  is_published = ndb.BooleanProperty()
  tags = ndb.StringProperty(repeated=True)
  status = ndb.StringProperty(default='scheduled')
  
  # a key reference to the account's organization
  # Should be required
  organization = ndb.KeyProperty()


  
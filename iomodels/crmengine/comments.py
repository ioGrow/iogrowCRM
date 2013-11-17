from google.appengine.ext import ndb
from google.appengine.api import search 
from endpoints_proto_datastore.ndb import EndpointsModel
from model import User
import pprint

class Comment(EndpointsModel)
	_message_fields_schema = ('id','content')
	last_updater = ndb.StructuredProperty(User)
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    content = ndb.StringProperty(required=True)
    organization = ndb.KeyProperty()
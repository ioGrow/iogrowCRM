from google.appengine.ext import ndb
from google.appengine.api import search 
from endpoints_proto_datastore.ndb import EndpointsModel
from model import User
from model import Userinfo
import pprint

class Comment(EndpointsModel):
	_message_fields_schema = ('content','discussion','last_updater','updated_at','author')
	author= ndb.StructuredProperty(Userinfo)
	last_updater = ndb.StructuredProperty(User)
	collaborators_list = ndb.StructuredProperty(Userinfo,repeated=True)
	collaborators_ids = ndb.StringProperty(repeated=True)
	created_at = ndb.DateTimeProperty(auto_now_add=True)
	updated_at = ndb.DateTimeProperty(auto_now=True)
	content = ndb.StringProperty(required=True)
	discussion = ndb.KeyProperty()
	access = ndb.StringProperty()
	organization = ndb.KeyProperty()


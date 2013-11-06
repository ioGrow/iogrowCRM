from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel
# HKA 04.11.2013 Stage Model
class Stage (EndpointsModel) :
	 _message_fields_schema = ('id', 'name')
	 owner = ndb.KeyProperty()
	 organization = ndb.KeyProperty()
	 name = ndb.KeyProperty()
	 percent = ndb.IntegerProperty()


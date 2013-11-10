from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel
# HKA 04.11.2013 Opportunity Model

class Opportunity(EndpointsModel):
  _message_fields_schema = ('id', 'name','description','amount')
  
  owner = ndb.KeyProperty()
  organization = ndb.KeyProperty()
  account = ndb.KeyProperty()
  name = ndb.StringProperty(required=True)
  description = ndb.StringProperty()
  industry = ndb.StringProperty()
  amount = ndb.FloatProperty()
  stage = ndb.KeyProperty()
  closed_date = ndb.DateTimeProperty()
  reason_lost = ndb.DateTimeProperty()
  creationTime = ndb.DateTimeProperty(auto_now_add=True)
  created_by = ndb.KeyProperty()
  last_modified_by = ndb.KeyProperty()
  address = ndb.StringProperty()

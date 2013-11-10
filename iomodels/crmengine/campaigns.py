from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel


class Campaign(EndpointsModel):
  _message_fields_schema = ('id', 'name')
  
  owner = ndb.KeyProperty()
  # a key reference to the account's organization
  # Should be required
  organization = ndb.KeyProperty()
  name = ndb.StringProperty(required=True)
  status = ndb.StringProperty()
  creationTime = ndb.DateTimeProperty(auto_now_add=True)
 

  



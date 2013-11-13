from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel


class Account(EndpointsModel):
  _message_fields_schema = ('id', 'name','account_type','industry')
  
  owner = ndb.KeyProperty()
  # a key reference to the account's organization
  # Should be required
  organization = ndb.KeyProperty()
  name = ndb.StringProperty(required=True)
  account_type = ndb.StringProperty()
  industry = ndb.StringProperty()
  creationTime = ndb.DateTimeProperty(auto_now_add=True)
  address = ndb.StringProperty()
  drive_folder = ndb.StringProperty()

  



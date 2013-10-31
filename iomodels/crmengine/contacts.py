from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel


class Contact(EndpointsModel):
  _message_fields_schema = ('id', 'firstname')

  owner = ndb.KeyProperty()
  organization = ndb.KeyProperty()
  account = ndb.KeyProperty()
  firstname= ndb.StringProperty(required=True)
  lastname = ndb.StringProperty()
  tittle = ndb.StringProperty()
  department = ndb.StringProperty()
  mobile = ndb.StringProperty()
  email = ndb.StringProperty()
  description = ndb.StringProperty()
  creationTime = ndb.DateTimeProperty(auto_now_add=True)
  modified_at = ndb.DateTimeProperty(auto_now=True)
  address = ndb.StringProperty()
from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel


class Contact(EndpointsModel):
  _message_fields_schema = ('id', 'firstname')
  
  owner = ndb.KeyProperty()
  account = ndb.KeyProperty() 
  organization = ndb.KeyProperty()
  firstname = ndb.StringProperty()
  lastname = ndb.StringProperty()
  title = ndb.StringProperty()
  creationTime = ndb.DateTimeProperty(auto_now_add=True)
  lastmodification = ndb.DateTimeProperty(auto_now=True)
  address = ndb.StringProperty()
  department = ndb.StringProperty()
  mobile = ndb.StringProperty()
  email = ndb.StringProperty()
  description = ndb.StringProperty()
 
 

  



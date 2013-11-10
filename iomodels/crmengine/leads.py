from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel


class Lead(EndpointsModel):
  _message_fields_schema = ('id', 'firstname','lastname','company')
  
  owner = ndb.KeyProperty()
  organization = ndb.KeyProperty()
  firstname = ndb.StringProperty(required=True)
  lastname = ndb.StringProperty()
  company = ndb.StringProperty()
  industry = ndb.StringProperty()
  tittle = ndb.StringProperty()
  department = ndb.StringProperty()
  mobile = ndb.StringProperty()
  address = ndb.StringProperty()
  city = ndb.StringProperty()
  country = ndb.StringProperty()
  description = ndb.TextProperty()
  source = ndb.StringProperty()
  status = ndb.StringProperty()
  style = ndb.StringProperty()
  created_at = ndb.DateTimeProperty(auto_now_add=True)
  last_modified_at = ndb.DateTimeProperty(auto_now=True)
  created_by = ndb.KeyProperty()


  
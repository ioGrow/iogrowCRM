from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel


class Case(EndpointsModel):
  _message_fields_schema = ('id', 'name','description','status','type_case')
  
  owner = ndb.KeyProperty()
  organization = ndb.KeyProperty()
  name = ndb.StringProperty(required=True)
  status = ndb.StringProperty()
  description = ndb.StringProperty()
  type_case = ndb.StringProperty()
  industry = ndb.StringProperty()
  creationTime = ndb.DateTimeProperty(auto_now_add=True)
  last_modified_at = ndb.DateTimeProperty(auto_now=True)
  created_by = ndb.KeyProperty()



    

  
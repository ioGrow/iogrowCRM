from google.appengine.ext import ndb
from google.appengine.api import search 
from endpoints_proto_datastore.ndb import EndpointsModel

import pprint


import model

class Tag(EndpointsModel):

    _message_fields_schema = ('id','name','entityKey', 'about_kind')
    owner = ndb.StringProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    name = ndb.StringProperty()
    about_kind = ndb.StringProperty()
    organization = ndb.KeyProperty()


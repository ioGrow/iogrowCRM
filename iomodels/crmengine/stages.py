from google.appengine.ext import ndb
from google.appengine.api import search
from endpoints_proto_datastore.ndb import EndpointsModel
# HKA 04.11.2013 Stage Model

import model


class Stage(EndpointsModel):
    _message_fields_schema = ('id', 'name')
    # Sharing fields
    owner = ndb.StringProperty()
    collaborators_list = ndb.StructuredProperty(model.Userinfo, repeated=True)
    collaborators_ids = ndb.StringProperty(repeated=True)
    organization = ndb.KeyProperty()
    name = ndb.KeyProperty()
    percent = ndb.IntegerProperty()
    # public or private
    access = ndb.StringProperty()

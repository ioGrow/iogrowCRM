from google.appengine.ext import ndb
from google.appengine.api import search 
from endpoints_proto_datastore.ndb import EndpointsModel
from model import Userinfo

import pprint


import model

class Email(EndpointsModel):

    _message_fields_schema = ('id','name','entityKey', 'about_kind')
    #_message_fields_schema = ('id','title')
    author = ndb.StructuredProperty(Userinfo)
    # Sharing fields
    owner = ndb.StringProperty()
    collaborators_list = ndb.StructuredProperty(model.Userinfo,repeated=True)
    collaborators_ids = ndb.StringProperty(repeated=True)
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    name = ndb.StringProperty(required=True)
    content = ndb.TextProperty()
    sender = ndb.StringProperty()
    to = ndb.StringProperty()
    cc = ndb.StringProperty()
    bcc = ndb.StringProperty()
    
    about_kind = ndb.StringProperty()
    about_item = ndb.StringProperty()
    # a key reference to the account's organization
    # Should be required
    organization = ndb.KeyProperty()
    # public or private
    access = ndb.StringProperty()

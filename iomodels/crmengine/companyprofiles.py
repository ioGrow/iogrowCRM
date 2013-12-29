from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel
from endpoints_proto_datastore import MessageFieldsSchema
from google.appengine.api import search
from model import Userinfo

import model

class Companyprofile(EndpointsModel):
    _message_fields_schema = ('id','entityKey','created_at','updated_at', 'folder','access','collaborators_list','name')

    owner = ndb.StringProperty()
    collaborators_list = ndb.StructuredProperty(model.Userinfo,repeated=True)
    collaborators_ids = ndb.StringProperty(repeated=True)
    organization = ndb.KeyProperty()
    folder = ndb.StringProperty()
    name = ndb.StringProperty()
    tagline = ndb.TextProperty()
    introduction =ndb.TextProperty() 
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    # public or private
    access = ndb.StringProperty()
    phones = ndb.StructuredProperty(model.Phone,repeated=True)
    emails = ndb.StructuredProperty(model.Email,repeated=True)
    addresses = ndb.StructuredProperty(model.Address,repeated=True)
    websites = ndb.StructuredProperty(model.Website,repeated=True)
    sociallinks= ndb.StructuredProperty(model.Social,repeated=True)

    def put(self, **kwargs):
        ndb.Model.put(self, **kwargs)
        self.put_index()
        self.set_perm()

    def set_perm(self):
        about_item = str(self.key.id())

        perm = model.Permission(about_kind='Companyprofile',
                         about_item=about_item,
                         type = 'user',
                         role = 'owner',
                         value = self.owner)
        perm.put()

    def put_index(self):
        """ index the element at each"""
        empty_string = lambda x: x if x else ""
        collaborators = " ".join(self.collaborators_ids)
        organization = str(self.organization.id())
        my_document = search.Document(
        doc_id = str(self.key.id()),
        fields=[
            search.TextField(name=u'type', value=u'Companyprofile'),
            search.TextField(name='organization', value = empty_string(organization) ),
            search.TextField(name='access', value = empty_string(self.access) ),
            search.TextField(name='owner', value = empty_string(self.owner) ),
            search.TextField(name='collaborators', value = collaborators ),
            search.TextField(name='title', value = empty_string(self.name) ),
            search.DateField(name='created_at', value = self.created_at),
            search.DateField(name='updated_at', value = self.updated_at),
                ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)
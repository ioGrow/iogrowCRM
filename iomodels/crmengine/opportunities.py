from google.appengine.ext import ndb
from google.appengine.api import search 
from endpoints_proto_datastore.ndb import EndpointsModel
# HKA 04.11.2013 Opportunity Model

import model

class Opportunity(EndpointsModel):

    _message_fields_schema = ('id','entityKey','access','collaborators_list','collaborators_ids', 'name','description','amount','account')

    # Sharing fields
    owner = ndb.StringProperty()
    collaborators_list = ndb.StructuredProperty(model.Userinfo,repeated=True)
    collaborators_ids = ndb.StringProperty(repeated=True)
    organization = ndb.KeyProperty()
    account = ndb.KeyProperty()
    name = ndb.StringProperty()
    description = ndb.StringProperty()
    industry = ndb.StringProperty()
    amount = ndb.FloatProperty(default=0.00)
    stage = ndb.StringProperty()
    closed_date = ndb.DateTimeProperty()
    reason_lost = ndb.DateTimeProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    created_by = ndb.KeyProperty()
    last_modified_by = ndb.KeyProperty()
    address = ndb.StringProperty()
    # public or private
    access = ndb.StringProperty()

    def put(self, **kwargs):
        ndb.Model.put(self, **kwargs)
        self.put_index()
        self.set_perm()

    def set_perm(self):
        about_item = str(self.key.id())

        perm = model.Permission(about_kind='Opportunity',
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
            search.TextField(name=u'type', value=u'Opportunity'),
            search.TextField(name='organization', value = empty_string(organization) ),
            search.TextField(name='access', value = empty_string(self.access) ),
            search.TextField(name='owner', value = empty_string(self.owner) ),
            search.TextField(name='collaborators', value = collaborators ),
            search.TextField(name='title', value = empty_string(self.name) ),
            search.TextField(name='description', value = empty_string(self.description)),
            search.NumberField(name='amount', value = self.amount),
            #search.DateField(name='closed_date', value = self.closed_date),
            search.DateField(name='created_at', value = self.created_at),
            #search.DateField(name='reason_lost', value = self.reason_lost),
            search.TextField(name='address', value = empty_string(self.address)),
           ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)

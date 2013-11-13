from google.appengine.ext import ndb
from google.appengine.api import search 
from endpoints_proto_datastore.ndb import EndpointsModel
# HKA 04.11.2013 Opportunity Model

class Opportunity(EndpointsModel):
    _message_fields_schema = ('id', 'name','description','amount')
    owner = ndb.KeyProperty()
    organization = ndb.KeyProperty()
    account = ndb.KeyProperty()
    name = ndb.StringProperty(required=True)
    description = ndb.StringProperty()
    industry = ndb.StringProperty()
    amount = ndb.FloatProperty(default=0)
    stage = ndb.KeyProperty()
    closed_date = ndb.DateTimeProperty()
    reason_lost = ndb.DateTimeProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    created_by = ndb.KeyProperty()
    last_modified_by = ndb.KeyProperty()
    address = ndb.StringProperty()
    
    def put(self, **kwargs):
        ndb.Model.put(self, **kwargs)
        self.put_index()

    def put_index(self):
        """ index the element at each"""
        empty_string = lambda x: x if x else ""
        my_document = search.Document(
        doc_id = str(self.key.id()),
        fields=[
            search.TextField(name=u'type', value=u'Opportunity'),
            #search.TextField(name='owner', value=self.owner.name),
            #search.TextField(name='organization', value = self.organization ),
            search.TextField(name='name', value = empty_string(self.name) ),
            search.TextField(name='description', value = empty_string(self.description)),
            search.NumberField(name='amount', value = self.amount),
            #search.DateField(name='closed_date', value = self.closed_date),
            search.DateField(name='created_at', value = self.created_at),
            #search.DateField(name='reason_lost', value = self.reason_lost),
            search.TextField(name='address', value = empty_string(self.address)),
           ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)

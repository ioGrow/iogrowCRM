from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel
from google.appengine.api import search 
from model import Userinfo
class Account(EndpointsModel):

    _message_fields_schema = ('id','entityKey', 'name','owner','account_type','industry','address')
    # Sharing fields
    owner = ndb.KeyProperty()
    collaborators = ndb.StructuredProperty(Userinfo)
    collaborators_key = ndb.KeyProperty(repeated=True)
    is_private = ndb.BooleanProperty(default=False)
    organization = ndb.KeyProperty()
    name = ndb.StringProperty(required=True)
    account_type = ndb.StringProperty()
    industry = ndb.StringProperty()
    creationTime = ndb.DateTimeProperty(auto_now_add=True)
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
            search.TextField(name=u'type', value=u'Account'),
            #search.TextField(name='owner', value=self.owner.name),
            #search.TextField(name='organization', value = self.organization ),
            search.TextField(name='title', value = empty_string(self.name) ),
            search.TextField(name='account_type', value = empty_string(self.account_type)),
            search.TextField(name='industry', value = empty_string(self.industry)),
            search.DateField(name='creationTime', value = self.creationTime),
            search.TextField(name='industry', value = empty_string(self.industry)),
            search.TextField(name='address', value = empty_string(self.address))
           ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)


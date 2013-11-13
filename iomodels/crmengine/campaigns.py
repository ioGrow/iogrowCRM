from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel
from google.appengine.api import search 

class Campaign(EndpointsModel):
    _message_fields_schema = ('id', 'name')

    owner = ndb.KeyProperty()
    # a key reference to the account's organization
    # Should be required
    organization = ndb.KeyProperty()
    name = ndb.StringProperty(required=True)
    status = ndb.StringProperty()
    creationTime = ndb.DateTimeProperty(auto_now_add=True)

    def put(self, **kwargs):
        ndb.Model.put(self, **kwargs)
        self.put_index()

    def put_index(self):
        """ index the element at each"""
        empty_string = lambda x: x if x else ""
        my_document = search.Document(
        doc_id = str(self.key.id()),
        fields=[
            search.TextField(name=u'type', value=u'Campaign'),
            #search.TextField(name='owner', value=self.owner.name),
            #search.TextField(name='organization', value = self.organization ),
            search.TextField(name='name', value = empty_string(self.name) ),
            search.TextField(name='status', value = empty_string(self.status)),
            search.DateField(name='creationTime', value = self.creationTime),
           ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)



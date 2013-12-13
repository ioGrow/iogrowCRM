from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel
from endpoints_proto_datastore import MessageFieldsSchema
from google.appengine.api import search
import model


class Opportunitystage (EndpointsModel):
	owner = ndb.StringProperty()
	organization = ndb.KeyProperty()
	created_at = ndb.DateTimeProperty(auto_now_add=True)
	updated_at = ndb.DateTimeProperty(auto_now=True)
	name = ndb.StringProperty()
	probability = ndb.StringProperty()
	created_by = ndb.KeyProperty()
	last_modified_by = ndb.KeyProperty()
    #created_by = ndb.KeyProperty()
    #last_modified_by = ndb.KeyProperty()
def put(self, **kwargs):
    	ndb.Model.put(self, **kwargs)
    	self.put_index()

def put_index(self):
        """ index the element at each"""
        empty_string = lambda x: x if x else ""
        organization = str(self.organization.id())
        my_document = search.Document(
        doc_id = str(self.key.id()),
        fields=[
            search.TextField(name=u'type', value=u'Opportunitystage'),
            search.TextField(name='organization', value = empty_string(organization) ),
            search.TextField(name='owner', value = empty_string(self.owner) ),
            search.TextField(name='title', value = empty_string(self.name) ),
            search.TextField(name='probability', value = empty_string(self.probability)),
            search.DateField(name='created_at', value = self.created_at),
             ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)



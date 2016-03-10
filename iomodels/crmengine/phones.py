from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel
from google.appengine.api import search 

import model

class Phone (EndpointsModel):
    _message_fields_schema = 'id'
    owner = ndb.StringProperty()
    organization = ndb.KeyProperty()
    number = ndb.StringProperty()
    type_number = ndb.StringProperty()
    creationTime = ndb.DateTimeProperty(auto_now_add=True)
    lastmodification = ndb.DateTimeProperty(auto_now=True)

    def put(self,**kwargs):
    	ndb.Model.put(self, **kwargs)
    	self.put_index()

    def put_index():
    	""" index the element at each"""
        empty_string = lambda x: x if x else ""
        my_document = search.Document(
        	doc_id=str(self.key.id()),
        	fields=[
        	search.TextField(name=u'type', value=u'Phone'),
        	search.TextField(name='title', value = empty_string(self.number)),
        	search.TextField(name='type_number',value=empty_string(self.type_number)),
        	search.TextField(name='owner', value = empty_string(self.owner) ),
        	search.DateField(name='creationTime', value = self.creationTime),
        	search.DateField(name='lastmodification', value = self.lastmodification)
        	])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)


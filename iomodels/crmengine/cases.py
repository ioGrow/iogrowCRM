from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel
from google.appengine.api import search 

class Case(EndpointsModel):
    _message_fields_schema = ('id', 'name','description','status','type_case')

    owner = ndb.KeyProperty()
    organization = ndb.KeyProperty()
    name = ndb.StringProperty(required=True)
    status = ndb.StringProperty()
    description = ndb.StringProperty()
    type_case = ndb.StringProperty()
    industry = ndb.StringProperty()
    creationTime = ndb.DateTimeProperty(auto_now_add=True)
    last_modified_at = ndb.DateTimeProperty(auto_now=True)
    created_by = ndb.KeyProperty()

    def put(self, **kwargs):
        ndb.Model.put(self, **kwargs)
        self.put_index()

    def put_index(self):
        """ index the element at each"""
        empty_string = lambda x: x if x else ""
        my_document = search.Document(
        doc_id = str(self.key.id()),
        fields=[
            search.TextField(name=u'type', value=u'Case'),
            #search.TextField(name='owner', value=self.owner.name),
            #search.TextField(name='organization', value = self.organization ),
            search.TextField(name='title', value = empty_string(self.name) ),
            search.TextField(name='status', value = empty_string(self.status)),
            search.TextField(name='description', value = empty_string(self.description)),
            search.DateField(name='creationTime', value = self.creationTime),
            search.DateField(name='last_modified_at', value = self.last_modified_at),
            search.TextField(name='industry', value = empty_string(self.industry)),
            search.TextField(name='type_case', value = empty_string(self.type_case))
           ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)
    

  
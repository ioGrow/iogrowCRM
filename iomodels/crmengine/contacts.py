from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel
from google.appengine.api import search 

class Contact(EndpointsModel):
    _message_fields_schema = ('id', 'firstname','lastname','title','company')

    owner = ndb.KeyProperty()
    account = ndb.KeyProperty() 
    organization = ndb.KeyProperty()
    firstname = ndb.StringProperty()
    lastname = ndb.StringProperty()
    title = ndb.StringProperty()
    company = ndb.StringProperty()
    creationTime = ndb.DateTimeProperty(auto_now_add=True)
    lastmodification = ndb.DateTimeProperty(auto_now=True)
    address = ndb.StringProperty()
    department = ndb.StringProperty()
    mobile = ndb.StringProperty()
    email = ndb.StringProperty()
    description = ndb.StringProperty()

    def put(self, **kwargs):
        ndb.Model.put(self, **kwargs)
        self.put_index()

    def put_index(self):
        """ index the element at each"""
        empty_string = lambda x: x if x else ""
        my_document = search.Document(
        doc_id = str(self.key.id()),
        fields=[
            search.TextField(name=u'type', value=u'Contact'),
            #search.TextField(name='owner', value=self.owner.name),
            #search.TextField(name='organization', value = self.organization ),
            search.TextField(name='firstname', value = empty_string(self.firstname) ),
            search.TextField(name='lastname', value = empty_string(self.lastname)),
            search.TextField(name='title', value = empty_string(self.title)),
            search.DateField(name='creationTime', value = self.creationTime),
            search.DateField(name='lastmodification', value = self.lastmodification),
            search.TextField(name='company', value = empty_string(self.company)),
            search.TextField(name='address', value = empty_string(self.address)),
            search.TextField(name='department', value = empty_string(self.department)),
            search.TextField(name='mobile', value = empty_string(self.mobile)),
            search.TextField(name='email', value = empty_string(self.email)),
            search.TextField(name='description', value = empty_string(self.description))
           ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)



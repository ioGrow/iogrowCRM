from google.appengine.ext import ndb
from google.appengine.api import search 
from endpoints_proto_datastore.ndb import EndpointsModel


class Lead(EndpointsModel):
    _message_fields_schema = ('id', 'firstname','lastname','company')
    owner = ndb.KeyProperty()
    organization = ndb.KeyProperty()
    firstname = ndb.StringProperty(required=True)
    lastname = ndb.StringProperty()
    company = ndb.StringProperty()
    industry = ndb.StringProperty()
    title = ndb.StringProperty()
    department = ndb.StringProperty()
    mobile = ndb.StringProperty()
    address = ndb.StringProperty()
    city = ndb.StringProperty()
    country = ndb.StringProperty()
    description = ndb.TextProperty()
    source = ndb.StringProperty()
    status = ndb.StringProperty()
    style = ndb.StringProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
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
            search.TextField(name=u'type', value=u'Lead'),
            #search.TextField(name='owner', value=self.owner.name),
            #search.TextField(name='organization', value = self.organization ),
            search.TextField(name='firstname', value = empty_string(self.firstname) ),
            search.TextField(name='title', value = empty_string(self.lastname)),
            search.TextField(name='company', value = empty_string(self.company)),
            search.TextField(name='industry', value = empty_string(self.industry)),
            search.TextField(name='tittle', value = empty_string(self.title)),
            search.TextField(name='department', value = empty_string(self.department)),
            search.TextField(name='mobile', value = empty_string(self.mobile)),
            search.TextField(name='address', value = empty_string(self.address)),
            search.TextField(name='city', value = empty_string(self.city)),
            search.TextField(name='country', value = empty_string(self.country)),
            search.TextField(name='description', value = empty_string(self.description)),
            search.TextField(name='source', value = empty_string(self.source)),
            search.TextField(name='status', value = empty_string(self.status)),
            search.TextField(name='style', value = empty_string(self.style)),
            search.DateField(name='created_at', value = self.created_at),
            search.DateField(name='updated_at', value = self.updated_at),

           ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)

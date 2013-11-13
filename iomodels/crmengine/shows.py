from google.appengine.ext import ndb
from google.appengine.api import search
from endpoints_proto_datastore.ndb import EndpointsModel
from model import User
import pprint


class Show(EndpointsModel):
    _message_fields_schema = ('id', 'title','starts_at','ends_at','description','tags','youtube_url','is_published','status')
    owner = ndb.StructuredProperty(User)
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    title = ndb.StringProperty(required=True)
    starts_at = ndb.DateTimeProperty()
    ends_at = ndb.DateTimeProperty()
    description = ndb.TextProperty()
    youtube_url = ndb.StringProperty()
    is_published = ndb.BooleanProperty()
    tags = ndb.StringProperty(repeated=True)
    status = ndb.StringProperty(default='scheduled')

    # a key reference to the account's organization
    # Should be required
    organization = ndb.KeyProperty()

    def put(self, **kwargs):
        ndb.Model.put(self, **kwargs)
        self.put_index()

    def put_index(self):
        """ index the element at each"""
        empty_string = lambda x: x if x else ""
        my_document = search.Document(
        doc_id = str(self.key.id()),
        fields=[
            search.TextField(name=u'type', value=u'Show'),
            #search.TextField(name='owner', value=self.owner.name),
            #search.TextField(name='organization', value = self.organization ),
            search.DateField(name='created_at', value = self.created_at),
            search.DateField(name='updated_at', value = self.updated_at),
            search.TextField(name='title', value = empty_string(self.title)),
            search.TextField(name='description', value = empty_string(self.description)),
            search.TextField(name='status', value = empty_string(self.status)),
           ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)
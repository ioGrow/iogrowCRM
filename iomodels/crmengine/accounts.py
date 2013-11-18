from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel
from google.appengine.api import search 
import model
class Account(EndpointsModel):

    _message_fields_schema = ('id','entityKey','access','collaborators_list', 'collaborators_ids','name','owner','account_type','industry','address')
    # Sharing fields
    owner = ndb.StringProperty()
    collaborators_list = ndb.StructuredProperty(model.Userinfo,repeated=True)
    collaborators_ids = ndb.StringProperty(repeated=True)
    organization = ndb.KeyProperty()
    folder = ndb.StringProperty()
    name = ndb.StringProperty()
    account_type = ndb.StringProperty()
    industry = ndb.StringProperty()
    creationTime = ndb.DateTimeProperty(auto_now_add=True)
    address = ndb.StringProperty()
    # public or private
    access = ndb.StringProperty()
    


    def put(self, **kwargs):
        ndb.Model.put(self, **kwargs)
        self.put_index()
        self.set_perm()

    def set_perm(self):
        about_item = str(self.key.id())

        perm = model.Permission(about_kind='Account',
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
            search.TextField(name=u'type', value=u'Account'),
            search.TextField(name='organization', value = empty_string(organization) ),
            search.TextField(name='access', value = empty_string(self.access) ),
            search.TextField(name='owner', value = empty_string(self.owner) ),
            search.TextField(name='collaborators', value = collaborators ),
            search.TextField(name='title', value = empty_string(self.name) ),
            search.TextField(name='account_type', value = empty_string(self.account_type)),
            search.TextField(name='industry', value = empty_string(self.industry)),
            search.DateField(name='creationTime', value = self.creationTime),
            search.TextField(name='industry', value = empty_string(self.industry)),
            search.TextField(name='address', value = empty_string(self.address))
           ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)


from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel
from google.appengine.api import search 

import model

class Contact(EndpointsModel):
    _message_fields_schema = ('id', 'firstname','lastname','title','company')

    # Sharing fields
    owner = ndb.StringProperty()
    collaborators_list = ndb.StructuredProperty(model.Userinfo,repeated=True)
    collaborators_ids = ndb.StringProperty(repeated=True)
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
            search.TextField(name=u'type', value=u'Contact'),
            search.TextField(name='title', value = empty_string(self.firstname) + " " + empty_string(self.lastname)),
            search.TextField(name='organization', value = empty_string(organization) ),
            search.TextField(name='access', value = empty_string(self.access) ),
            search.TextField(name='owner', value = empty_string(self.owner) ),
            search.TextField(name='collaborators', value = collaborators ),
            search.TextField(name='firstname', value = empty_string(self.firstname) ),
            search.TextField(name='lastname', value = empty_string(self.lastname)),
            search.TextField(name='position', value = empty_string(self.title)),
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



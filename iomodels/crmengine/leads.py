from google.appengine.ext import ndb
from google.appengine.api import search 
from endpoints_proto_datastore.ndb import EndpointsModel


import model

class Lead(EndpointsModel):
    _message_fields_schema = ('id', 'firstname','lastname','company')
    # Sharing fields
    owner = ndb.StringProperty()
    collaborators_list = ndb.StructuredProperty(model.Userinfo,repeated=True)
    collaborators_ids = ndb.StringProperty(repeated=True)
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
            search.TextField(name=u'type', value=u'Lead'),
            search.TextField(name='organization', value = empty_string(organization) ),
            search.TextField(name='access', value = empty_string(self.access) ),
            search.TextField(name='owner', value = empty_string(self.owner) ),
            search.TextField(name='collaborators', value = collaborators ),
            search.TextField(name='firstname', value = empty_string(self.firstname) ),
            search.TextField(name='lastname', value = empty_string(self.lastname)),
            search.TextField(name='company', value = empty_string(self.company)),
            search.TextField(name='industry', value = empty_string(self.industry)),
            search.TextField(name='title', value = empty_string(self.title)),
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

from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel
from google.appengine.api import search 

import model

class Contact(EndpointsModel):
    _message_fields_schema = ('id','entityKey','folder',  'access','collaborators_list','collaborators_ids','display_name', 'firstname','lastname','title','company','account','account_name','introduction','tagline','phones','emails','addresses','websites','sociallinks')
    # Sharing fields
    owner = ndb.StringProperty()
    collaborators_list = ndb.StructuredProperty(model.Userinfo,repeated=True)
    collaborators_ids = ndb.StringProperty(repeated=True)
    account = ndb.KeyProperty()
    account_name = ndb.StringProperty() 
    organization = ndb.KeyProperty()
    folder = ndb.StringProperty() 
    firstname = ndb.StringProperty()
    lastname = ndb.StringProperty()
    display_name = ndb.StringProperty(repeated=True)
    title = ndb.StringProperty()
    company = ndb.StringProperty()
    creationTime = ndb.DateTimeProperty(auto_now_add=True)
    lastmodification = ndb.DateTimeProperty(auto_now=True)
    department = ndb.StringProperty()
    description = ndb.StringProperty()
    phones = ndb.StructuredProperty(model.Phone,repeated=True)
    emails = ndb.StructuredProperty(model.Email,repeated=True)
    addresses = ndb.StructuredProperty(model.Address,repeated=True)
    websites = ndb.StructuredProperty(model.Website,repeated=True)
    sociallinks= ndb.StructuredProperty(model.Social,repeated=True)
    # public or private
    access = ndb.StringProperty()
    tagline = ndb.StringProperty()
    introduction = ndb.StringProperty()
    phones = ndb.StructuredProperty(model.Phone,repeated=True)
    emails = ndb.StructuredProperty(model.Email,repeated=True)
    addresses = ndb.StructuredProperty(model.Address,repeated=True)
    websites = ndb.StructuredProperty(model.Website,repeated=True)
    sociallinks= ndb.StructuredProperty(model.Social,repeated=True)

    def put(self, **kwargs):
        
        ndb.Model.put(self, **kwargs)
        self.put_index()
        self.set_perm()

    def set_perm(self):
        about_item = str(self.key.id())

        perm = model.Permission(about_kind='Contact',
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
        emails = " ".join(map(lambda x: x.email,  self.emails))
        phones = " ".join(map(lambda x: x.number,  self.phones))
        websites = " ".join(map(lambda x: x.website,  self.websites))
        addresses = " \n".join(map(lambda x: " ".join([x.street,x.city,x.state, x.postal_code, x.country]), self.addresses))
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
            search.TextField(name='department', value = empty_string(self.department)),
            search.TextField(name='account_name',value=empty_string(self.account_name)),
            search.TextField(name='description', value = empty_string(self.description)),
            search.TextField(name='tagline', value = empty_string(self.tagline)),
            search.TextField(name='introduction', value = empty_string(self.introduction)),
            search.TextField(name='emails', value = empty_string(emails)),
            search.TextField(name='phones', value = empty_string(phones)),
            search.TextField(name='websites', value = empty_string(websites)),
            search.TextField(name='addresses', value = empty_string(addresses)),

           ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)



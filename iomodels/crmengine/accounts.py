from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel
from endpoints_proto_datastore import MessageFieldsSchema
from google.appengine.api import search
from iomodels.crmengine.tags import TagAbstract
from search_helper import tokenize_autocomplete 

import model
class Account(EndpointsModel):
    _message_fields_schema = ('id','entityKey','created_at','updated_at', 'folder','access','collaborators_list','phones','emails','addresses','websites','sociallinks', 'collaborators_ids','name','owner','account_type','industry','tagline','introduction')
    # Sharing fields
    owner = ndb.StringProperty()
    collaborators_list = ndb.StructuredProperty(model.Userinfo,repeated=True)
    collaborators_ids = ndb.StringProperty(repeated=True)
    organization = ndb.KeyProperty()
    folder = ndb.StringProperty()
    name = ndb.StringProperty()
    account_type = ndb.StringProperty()
    industry = ndb.StringProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    tags = ndb.StructuredProperty(TagAbstract,repeated=True)
    tagline = ndb.TextProperty()
    introduction =ndb.TextProperty()
    # public or private
    access = ndb.StringProperty()
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

        perm = model.Permission(about_kind='Account',
                         about_item=about_item,
                         type = 'user',
                         role = 'owner',
                         value = self.owner)
        perm.put()

    def put_index(self,data=None):
        """ index the element at each"""
        empty_string = lambda x: x if x else ""
        collaborators = " ".join(self.collaborators_ids)
        organization = str(self.organization.id())
        emails = " ".join(map(lambda x: x.email,  self.emails))
        phones = " ".join(map(lambda x: x.number,  self.phones))
        websites =  " ".join(map(lambda x: x.website,  self.websites))
        title_autocomplete = ','.join(tokenize_autocomplete(self.name))
        
        #addresses = " \n".join(map(lambda x: " ".join([x.street,x.city,x.state, str(x.postal_code), x.country]) if x else "", self.addresses))
        if data:
            search_key = ['infos','tags']
            for key in search_key:
                if key not in data.keys():
                    data[key] = ""
            my_document = search.Document(
            doc_id = str(data['id']),
            fields=[
                search.TextField(name=u'type', value=u'Account'),
                search.TextField(name='organization', value = empty_string(organization) ),
                search.TextField(name='entityKey',value=empty_string(self.key.urlsafe())),
                search.TextField(name='access', value = empty_string(self.access) ),
                search.TextField(name='owner', value = empty_string(self.owner) ),
                search.TextField(name='collaborators', value = collaborators ),
                search.TextField(name='title', value = empty_string(self.name) ),
                search.TextField(name='account_type', value = empty_string(self.account_type)),
                search.TextField(name='industry', value = empty_string(self.industry)),
                search.DateField(name='created_at', value = self.created_at),
                search.DateField(name='updated_at', value = self.updated_at),
                search.TextField(name='industry', value = empty_string(self.industry)),
                search.TextField(name='tagline', value = empty_string(self.tagline)),
                search.TextField(name='introduction', value = empty_string(self.introduction)),
                search.TextField(name='emails', value = empty_string(emails)),
                search.TextField(name='phones', value = empty_string(phones)),
                search.TextField(name='websites', value = empty_string(websites)),
                search.TextField(name='infos', value= data['infos']),
                search.TextField(name='tags', value= data['tags']),
                search.TextField(name='title_autocomplete', value = empty_string(title_autocomplete)),
                #search.TextField(name='addresses', value = empty_string(addresses)),
               ])
        else:
            my_document = search.Document(
            doc_id = str(self.key.id()),
            fields=[
                search.TextField(name=u'type', value=u'Account'),
                search.TextField(name='organization', value = empty_string(organization) ),
                search.TextField(name='entityKey',value=empty_string(self.key.urlsafe())),
                search.TextField(name='access', value = empty_string(self.access) ),
                search.TextField(name='owner', value = empty_string(self.owner) ),
                search.TextField(name='collaborators', value = collaborators ),
                search.TextField(name='title', value = empty_string(self.name) ),
                search.TextField(name='account_type', value = empty_string(self.account_type)),
                search.TextField(name='industry', value = empty_string(self.industry)),
                search.DateField(name='created_at', value = self.created_at),
                search.DateField(name='updated_at', value = self.updated_at),
                search.TextField(name='industry', value = empty_string(self.industry)),
                search.TextField(name='tagline', value = empty_string(self.tagline)),
                search.TextField(name='introduction', value = empty_string(self.introduction)),
                search.TextField(name='emails', value = empty_string(emails)),
                search.TextField(name='phones', value = empty_string(phones)),
                search.TextField(name='websites', value = empty_string(websites)),
                search.TextField(name='title_autocomplete', value = empty_string(title_autocomplete)),
                #search.TextField(name='addresses', value = empty_string(addresses)),
               ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)



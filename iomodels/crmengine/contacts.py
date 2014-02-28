from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel
from google.appengine.api import search 
from search_helper import tokenize_autocomplete

import model

class Contact(EndpointsModel):
    _message_fields_schema = ('id','entityKey','owner', 'folder','created_at','updated_at',  'access','collaborators_list','collaborators_ids','display_name', 'firstname','lastname','title','company','account','account_name','introduction','tagline','phones','emails','addresses','websites','sociallinks')
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
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
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


    def put_index(self,data=None):
        """ index the element at each"""
        print '************ Contact put index **********'
        print self
        empty_string = lambda x: x if x else ""
        collaborators = " ".join(self.collaborators_ids)
        organization = str(self.organization.id())
        emails = " ".join(map(lambda x: x.email,  self.emails))
        phones = " ".join(map(lambda x: x.number,  self.phones))
        websites = " ".join(map(lambda x: x.website,  self.websites))
        title_autocomplete = ','.join(tokenize_autocomplete(self.firstname + ' ' + self.lastname +' '+ empty_string(self.title)+ ' ' +empty_string(self.account_name)))
        #addresses = " \n".join(map(lambda x: " ".join([x.street,x.city,x.state, x.postal_code, x.country]) if x else "", self.addresses))
        search_key = ['infos','contacts','tags']
        for key in search_key:
            if key not in data.keys():
                data[key] = ""
        my_document = search.Document(
        doc_id = str(data['id']),
        fields=[
            search.TextField(name=u'type', value=u'Contact'),
            search.TextField(name='title', value = empty_string(self.firstname) + " " + empty_string(self.lastname)),
            search.TextField(name='organization', value = empty_string(organization) ),
            search.TextField(name='access', value = empty_string(self.access) ),
            search.TextField(name='owner', value = empty_string(self.owner) ),
            search.TextField(name='firstname', value = empty_string(self.firstname) ),
            search.TextField(name='lastname', value = empty_string(self.lastname)),
            search.TextField(name='position', value = empty_string(self.title)),
            search.TextField(name='tagline'),
            search.TextField(name='introduction'),
            search.TextField(name='contacts'),
            search.TextField(name='infos', value= data['infos']),
            search.TextField(name='tags', value= data['tags']),
            search.TextField(name='title_autocomplete', value = empty_string(title_autocomplete)),
            #search.TextField(name='addresses', value = empty_string(addresses)),
           ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)



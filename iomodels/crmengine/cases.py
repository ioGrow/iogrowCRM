from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel
from google.appengine.api import search
from search_helper import tokenize_autocomplete

import model

class Case(EndpointsModel):
    _message_fields_schema = ('id','entityKey','owner','folder', 'access','collaborators_list','collaborators_ids',  'name','status','type_case','priority','account','account_name','contact','contact_name','created_at','updated_at')
    # Sharing fields
    owner = ndb.StringProperty()
    collaborators_list = ndb.StructuredProperty(model.Userinfo,repeated=True)
    collaborators_ids = ndb.StringProperty(repeated=True)
    organization = ndb.KeyProperty()
    folder = ndb.StringProperty()
    account = ndb.KeyProperty()
    account_name = ndb.StringProperty()
    contact = ndb.KeyProperty()
    contact_name = ndb.StringProperty()
    name = ndb.StringProperty()
    status = ndb.StringProperty()
    type_case = ndb.StringProperty()
    industry = ndb.StringProperty()
    priority = ndb.IntegerProperty()
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

        perm = model.Permission(about_kind='Case',
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
        title_autocomplete = ','.join(tokenize_autocomplete(self.name + ' ' + empty_string(self.account_name) + ' ' + empty_string(self.contact_name)))
        my_document = search.Document(
        doc_id = str(self.key.id()),
        fields=[
            search.TextField(name=u'type', value=u'Case'),
            search.TextField(name='organization', value = empty_string(organization) ),
            search.TextField(name='access', value = empty_string(self.access) ),
            search.TextField(name='owner', value = empty_string(self.owner) ),
            search.TextField(name='collaborators', value = collaborators ),
            search.TextField(name='title', value = empty_string(self.name) ),
            search.TextField(name='account_name', value = empty_string(self.account_name) ),
            search.TextField(name='contact_name', value = empty_string(self.contact_name) ),
            search.TextField(name='status', value = empty_string(self.status)),
            search.NumberField(name='priority', value = int(self.priority)),
            search.DateField(name='created_at', value = self.created_at),
            search.DateField(name='updated_at', value = self.updated_at),
            search.TextField(name='title_autocomplete', value = empty_string(title_autocomplete)),
            search.TextField(name='type_case', value = empty_string(self.type_case))
           ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)
    

  
from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel
from google.appengine.api import search
from search_helper import tokenize_autocomplete

import model

class Need(EndpointsModel):
    _message_fields_schema = ('id','entityKey','owner','folder', 'access','collaborators_list','collaborators_ids',  'name','description', 'status','priority','about_kind','about_item','about_name','created_at','updated_at')
    # Sharing fields
    owner = ndb.StringProperty()
    collaborators_list = ndb.StructuredProperty(model.Userinfo,repeated=True)
    collaborators_ids = ndb.StringProperty(repeated=True)
    organization = ndb.KeyProperty()
    folder = ndb.StringProperty()
    about_kind = ndb.StringProperty()
    about_item = ndb.StringProperty()
    about_name = ndb.StringProperty()
    name = ndb.StringProperty()
    description = ndb.TextProperty()
    status = ndb.StringProperty()
    priority = ndb.StringProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    # public or private
    access = ndb.StringProperty()
    
    def put(self, **kwargs):
        ndb.Model.put(self, **kwargs)
        self.put_index()
        self.set_perm()

    def set_perm(self):
        about_item = str(self.key.id())

        perm = model.Permission(about_kind='Need',
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
        title_autocomplete = ','.join(tokenize_autocomplete(self.name + ' '  + empty_string(self.about_name)))
        my_document = search.Document(
        doc_id = str(self.key.id()),
        fields=[
            search.TextField(name=u'type', value=u'Need'),
            search.TextField(name='organization', value = empty_string(organization) ),
            search.TextField(name='access', value = empty_string(self.access) ),
            search.TextField(name='owner', value = empty_string(self.owner) ),
            search.TextField(name='collaborators', value = collaborators ),
            search.TextField(name='title', value = empty_string(self.name) ),
            search.TextField(name='description', value = empty_string(self.description) ),
            search.TextField(name='about_kind', value = empty_string(self.about_kind) ),
            search.TextField(name='about_name', value = empty_string(self.about_name) ),
            search.TextField(name='status', value = empty_string(self.status)),
            search.TextField(name='priority', value = empty_string(self.priority)),
            search.DateField(name='created_at', value = self.created_at),
            search.DateField(name='updated_at', value = self.updated_at),
            search.TextField(name='title_autocomplete', value = empty_string(title_autocomplete))
           ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)
    

  
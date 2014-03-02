from google.appengine.ext import ndb
from google.appengine.api import search
from search_helper import tokenize_autocomplete
from endpoints_proto_datastore.ndb import EndpointsModel
import model
# HKA 04.11.2013 Opportunity Model


class Opportunity(EndpointsModel):

    _message_fields_schema = ('id','entityKey','owner', 'created_at', 'updated_at', 'folder', 'access','collaborators_list','collaborators_ids', 'name','description','amount','account','account_name','account_id','contact','contact_name','contact_id','updated_at','stagename','stage_probability')

    # Sharing fields
    owner = ndb.StringProperty()
    collaborators_list = ndb.StructuredProperty(model.Userinfo,repeated=True)
    collaborators_ids = ndb.StringProperty(repeated=True)
    organization = ndb.KeyProperty()
    folder = ndb.StringProperty()
    account = ndb.KeyProperty()
    account_name = ndb.StringProperty()
    account_id = ndb.StringProperty()
    contact = ndb.KeyProperty()
    contact_name = ndb.StringProperty()
    contact_id = ndb.StringProperty()
    name = ndb.StringProperty()
    description = ndb.StringProperty()
    industry = ndb.StringProperty()
    amount = ndb.IntegerProperty()
    closed_date = ndb.DateTimeProperty()
    reason_lost = ndb.DateTimeProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    created_by = ndb.KeyProperty()
    last_modified_by = ndb.KeyProperty()
    address = ndb.StringProperty()
    stagename = ndb.StringProperty()
    stage_probability = ndb.IntegerProperty()
    
    # public or private
    access = ndb.StringProperty()


    def put(self, **kwargs):
        ndb.Model.put(self, **kwargs)
        self.put_index()
        self.set_perm()

    def set_perm(self):
        about_item = str(self.key.id())

        perm = model.Permission(about_kind='Opportunity',
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
        title_autocomplete = ','.join(tokenize_autocomplete(self.name + ' ' + self.account_name))
        if data:
            search_key = ['infos','contacts','tags']
            for key in search_key:
                if key not in data.keys():
                    data[key] = ""
            my_document = search.Document(
            doc_id = str(data['id']),
            fields=[
                search.TextField(name=u'type', value=u'Opportunity'),
                search.TextField(name='organization', value = empty_string(organization) ),
                search.TextField(name='access', value = empty_string(self.access) ),
                search.TextField(name='owner', value = empty_string(self.owner) ),
                search.TextField(name='collaborators', value = collaborators ),
                search.TextField(name='title', value = empty_string(self.name) ),
                search.TextField(name='stagename', value = empty_string(self.stagename) ),
                search.TextField(name='description', value = empty_string(self.description)),
                search.TextField(name='account_name', value = empty_string(self.account_name)),
                search.NumberField(name='amount', value = int(self.amount)),
                search.DateField(name='created_at', value = self.created_at),
                search.TextField(name='infos', value= data['infos']),
                search.TextField(name='tags', value= data['tags']),
                search.TextField(name='title_autocomplete', value = empty_string(title_autocomplete)),
            ])
        else:
            my_document = search.Document(
            doc_id = str(self.key.id()),
            fields=[
                search.TextField(name=u'type', value=u'Opportunity'),
                search.TextField(name='organization', value = empty_string(organization) ),
                search.TextField(name='access', value = empty_string(self.access) ),
                search.TextField(name='owner', value = empty_string(self.owner) ),
                search.TextField(name='collaborators', value = collaborators ),
                search.TextField(name='title', value = empty_string(self.name) ),
                search.TextField(name='stagename', value = empty_string(self.stagename) ),
                search.TextField(name='description', value = empty_string(self.description)),
                search.TextField(name='account_name', value = empty_string(self.account_name)),
                search.NumberField(name='amount', value = int(self.amount)),
                #search.DateField(name='closed_date', value = self.closed_date),
                search.DateField(name='created_at', value = self.created_at),
                #search.DateField(name='reason_lost', value = self.reason_lost),
                search.TextField(name='title_autocomplete', value = empty_string(title_autocomplete)),
            ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)

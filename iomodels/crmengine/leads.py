from google.appengine.ext import ndb
from google.appengine.api import search 
from endpoints_proto_datastore.ndb import EndpointsModel
from search_helper import tokenize_autocomplete
import model

class Lead(EndpointsModel):
    _message_fields_schema = ('id','entityKey','folder', 'owner', 'access','collaborators_list','collaborators_ids', 'firstname','lastname','company' ,'title','tagline','introduction','phones','emails','addresses','websites','sociallinks','status','created_at','updated_at','show','show_name','feedback','feedback_name')
    # Sharing fields
    owner = ndb.StringProperty()
    collaborators_list = ndb.StructuredProperty(model.Userinfo,repeated=True)
    collaborators_ids = ndb.StringProperty(repeated=True)
    organization = ndb.KeyProperty()
    folder = ndb.StringProperty()
    firstname = ndb.StringProperty()
    lastname = ndb.StringProperty()
    company = ndb.StringProperty()
    industry = ndb.StringProperty()
    title = ndb.StringProperty()
    department = ndb.StringProperty()
    description = ndb.TextProperty()
    source = ndb.StringProperty()
    status = ndb.StringProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    created_by = ndb.KeyProperty()
    show = ndb.KeyProperty()
    show_name = ndb.StringProperty()
    feedback = ndb.KeyProperty()
    feedback_name = ndb.StringProperty()
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

        perm = model.Permission(about_kind='Lead',
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
        title_autocomplete = ','.join(tokenize_autocomplete(self.firstname + ' ' + self.lastname +' '+ empty_string(self.title)+ ' ' +empty_string(self.company) + ' ' + empty_string(self.status)))
        emails = " ".join(map(lambda x: x.email,  self.emails))
        phones = " ".join(map(lambda x: x.number,  self.phones))
        websites = " ".join(map(lambda x: x.website,  self.websites))
        #addresses = " \n".join(map(lambda x: " ".join([x.street,x.city,x.state, x.postal_code, x.country]), self.addresses))
        my_document = search.Document(
        doc_id = str(self.key.id()),
        fields=[
            search.TextField(name=u'type', value=u'Lead'),
            search.TextField(name='title', value = empty_string(self.firstname) + " " + empty_string(self.lastname)),
            search.TextField(name='organization', value = empty_string(organization) ),
            search.TextField(name='access', value = empty_string(self.access) ),
            search.TextField(name='owner', value = empty_string(self.owner) ),
            search.TextField(name='collaborators', value = collaborators ),
            search.TextField(name='firstname', value = empty_string(self.firstname) ),
            search.TextField(name='lastname', value = empty_string(self.lastname)),
            search.TextField(name='company', value = empty_string(self.company)),
            search.TextField(name='industry', value = empty_string(self.industry)),
            search.TextField(name='position', value = empty_string(self.title)),
            search.TextField(name='department', value = empty_string(self.department)),
            search.TextField(name='description', value = empty_string(self.description)),
            search.TextField(name='source', value = empty_string(self.source)),
            search.TextField(name='status', value = empty_string(self.status)),
            search.DateField(name='created_at', value = self.created_at),
            search.DateField(name='updated_at', value = self.updated_at),
            search.TextField(name='show_name', value = empty_string(self.show_name)),
            search.TextField(name='tagline', value = empty_string(self.tagline)),
            search.TextField(name='introduction', value = empty_string(self.introduction)),
            search.TextField(name='emails', value = empty_string(emails)),
            search.TextField(name='phones', value = empty_string(phones)),
            search.TextField(name='websites', value = empty_string(websites)),
            #search.TextField(name='addresses', value = empty_string(addresses)),
            search.TextField(name='title_autocomplete', value = empty_string(title_autocomplete)),
           ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)

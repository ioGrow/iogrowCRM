from google.appengine.ext import ndb
from google.appengine.api import search 
from endpoints_proto_datastore.ndb import EndpointsModel
from iomodels.crmengine.notes import Topic
from iomodels.crmengine.tags import TagAbstract
from model import Userinfo
import pprint
from datetime import date
import model
from search_helper import tokenize_autocomplete 
  
class Task(EndpointsModel):
    _message_fields_schema = ('id','entityKey', 'owner','access', 'created_at','updated_at','title','due','status','tags',  'completed_by','comments','about_kind','about_item','organization','involved_ids','involved_list','author')

    author = ndb.StructuredProperty(Userinfo)
    # Sharing fields
    owner = ndb.StringProperty()
    collaborators_list = ndb.StructuredProperty(model.Userinfo,repeated=True)
    collaborators_ids = ndb.StringProperty(repeated=True)
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    title = ndb.StringProperty()
    due = ndb.DateTimeProperty()
    status = ndb.StringProperty()
    tags = ndb.StructuredProperty(TagAbstract,repeated=True)
    completed_by = ndb.StructuredProperty(Userinfo)
    involved_list = ndb.StructuredProperty(model.Userinfo,repeated=True)
    involved_ids = ndb.StringProperty(repeated=True)
    # number of comments in this topic
    comments = ndb.IntegerProperty(default=0)
    # A Topic is attached to an object for example Account or Opportunity..
    about_kind = ndb.StringProperty()
    about_item = ndb.StringProperty()
    # a key reference to the account's organization
    # Should be required
    organization = ndb.KeyProperty()
    # public or private
    access = ndb.StringProperty()

    def put(self, **kwargs):
        ndb.Model.put(self, **kwargs)
        self.put_index()
        self.set_perm()

    def set_perm(self):
        about_item = str(self.key.id())

        perm = model.Permission(about_kind='Task',
                         about_item=about_item,
                         type = 'user',
                         role = 'owner',
                         value = self.owner)
        perm.put()

    def put_index(self):
        """ index the element at each"""
        empty_string = lambda x: x if x else ""
        empty_date = lambda x: x if x else date(2999, 12, 31)
        collaborators = " ".join(self.collaborators_ids)
        tags = " ".join(map(lambda x: x.name,  self.tags))
        title_autocomplete = ','.join(tokenize_autocomplete(self.title + tags))
        organization = str(self.organization.id())
        my_document = search.Document(
        doc_id = str(self.key.id()),
        fields=[
            search.TextField(name=u'type', value=u'Task'),
            search.TextField(name='organization', value = empty_string(organization) ),
            search.TextField(name='access', value = empty_string(self.access) ),
            search.TextField(name='owner', value = empty_string(self.owner) ),
            search.TextField(name='collaborators', value = collaborators ),
            search.TextField(name='tags', value = tags ),
            search.TextField(name='title', value = empty_string(self.title) ),
            search.TextField(name='status', value = empty_string(self.status)),
            search.DateField(name='due', value = empty_date(self.due)),
            search.TextField(name='about_kind', value = empty_string(self.about_kind)),
            search.TextField(name='about_item', value = empty_string(self.about_item)),
            search.TextField(name='title_autocomplete', value = empty_string(title_autocomplete)),
           ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)
  

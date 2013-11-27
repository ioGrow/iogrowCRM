from google.appengine.ext import ndb
from google.appengine.api import search 
from endpoints_proto_datastore.ndb import EndpointsModel
from iomodels.crmengine.notes import Topic
from model import Userinfo
import pprint

import model


class Event(EndpointsModel):
    _message_fields_schema = ('id','entityKey','owner','author','collaborators_ids','collaborators_list','created_at','updated_at', 'starts_at','ends_at','title','where')
    author = ndb.StructuredProperty(Userinfo)
    # Sharing fields
    owner = ndb.StringProperty()
    collaborators_list = ndb.StructuredProperty(model.Userinfo,repeated=True)
    collaborators_ids = ndb.StringProperty(repeated=True)
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    title = ndb.StringProperty()
    where = ndb.StringProperty()
    starts_at = ndb.DateTimeProperty()
    ends_at = ndb.DateTimeProperty()
    status = ndb.StringProperty()
    # number of comments in this topic
    comments = ndb.IntegerProperty()
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
            search.TextField(name=u'type', value=u'Event'),
            search.TextField(name='organization', value = empty_string(organization) ),
            search.TextField(name='access', value = empty_string(self.access) ),
            search.TextField(name='owner', value = empty_string(self.owner) ),
            search.TextField(name='collaborators', value = collaborators ),
            search.TextField(name='where', value = empty_string(self.where) ),
            search.TextField(name='status', value = empty_string(self.status)),
            search.TextField(name='title', value = empty_string(self.title)),
            search.DateField(name='created_at', value = self.created_at),
            search.DateField(name='updated_at', value = self.updated_at),
            #search.DateField(name='starts_at', value = self.starts_at),
            #search.DateField(name='ends_at', value = self.ends_at),
            search.NumberField(name='comments', value = self.comments),
            search.TextField(name='about_kind', value = empty_string(self.about_kind)),
            search.TextField(name='about_item', value = empty_string(self.about_item)),

           ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)
  
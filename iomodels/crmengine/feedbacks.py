from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel
from endpoints_proto_datastore import MessageFieldsSchema
from google.appengine.api import search
from search_helper import tokenize_autocomplete
from model import Userinfo
from search_helper import tokenize_autocomplete

import model


class Feedback(EndpointsModel):
    _message_fields_schema = (
        'id', 'entityKey', 'created_at', 'updated_at', 'folder', 'access', 'collaborators_list', 'name', 'content',
        'type_feedback', 'status', 'source', 'related_to', 'who', 'show_url')

    owner = ndb.StringProperty()
    collaborators_list = ndb.StructuredProperty(model.Userinfo, repeated=True)
    collaborators_ids = ndb.StringProperty(repeated=True)
    organization = ndb.KeyProperty()
    folder = ndb.StringProperty()
    name = ndb.StringProperty()
    content = ndb.StringProperty()
    type_feedback = ndb.StringProperty()
    who = ndb.StructuredProperty(Userinfo)
    source = ndb.StringProperty()
    status = ndb.StringProperty()
    related_to = ndb.KeyProperty()
    show_url = ndb.StringProperty()
    type_url = ndb.StringProperty()
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

        perm = model.Permission(about_kind='Feedback',
                                about_item=about_item,
                                type='user',
                                role='owner',
                                value=self.owner)
        perm.put()

    def put_index(self):
        """ index the element at each"""
        empty_string = lambda x: x if x else ""
        collaborators = " ".join(self.collaborators_ids)
        organization = str(self.organization.id())
        title_autocomplete = ','.join(tokenize_autocomplete(
            self.name + ' ' + empty_string(self.status) + ' ' + empty_string(self.source) + ' ' + empty_string(
                self.type_feedback)))
        my_document = search.Document(
            doc_id=str(self.key.id()),
            fields=[
                search.TextField(name=u'type', value=u'Feedback'),
                search.TextField(name='organization', value=empty_string(organization)),
                search.TextField(name='access', value=empty_string(self.access)),
                search.TextField(name='owner', value=empty_string(self.owner)),
                search.TextField(name='collaborators', value=collaborators),
                search.TextField(name='title', value=empty_string(self.name)),
                search.TextField(name='content', value=empty_string(self.content)),
                search.TextField(name='type_feedback', value=empty_string(self.type_feedback)),
                search.TextField(name='source', value=empty_string(self.source)),
                search.TextField(name='status', value=empty_string(self.status)),
                search.DateField(name='created_at', value=self.created_at),
                search.DateField(name='updated_at', value=self.updated_at),
                search.TextField(name='title_autocomplete', value=empty_string(title_autocomplete)),
            ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)

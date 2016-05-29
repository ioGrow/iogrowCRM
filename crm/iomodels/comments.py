from endpoints_proto_datastore.ndb import EndpointsModel
from google.appengine.api import search
from google.appengine.ext import ndb
from crm.model import User
from crm.model import Userinfo

from crm.search_helper import tokenize_autocomplete


class Comment(EndpointsModel):
    _message_fields_schema = ('content', 'discussion', 'last_updater', 'updated_at', 'author')
    author = ndb.StructuredProperty(Userinfo)
    last_updater = ndb.StructuredProperty(User)
    collaborators_list = ndb.StructuredProperty(Userinfo, repeated=True)
    collaborators_ids = ndb.StringProperty(repeated=True)
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    content = ndb.TextProperty(required=True)
    discussion = ndb.KeyProperty()
    access = ndb.StringProperty()
    owner = ndb.StringProperty()
    organization = ndb.KeyProperty()
    parent_id = ndb.StringProperty()
    parent_kind = ndb.StringProperty()

    def put(self, **kwargs):
        entityKey = ndb.Model.put(self, **kwargs)
        self.put_index()
        return entityKey

    def put_index(self):
        """index the element at each put"""
        empty_string = lambda x: x if x else ""
        collaborators = " ".join(self.collaborators_ids)
        organization = str(self.organization.id())
        title_autocomplete = ','.join(tokenize_autocomplete(self.content))

        my_document = search.Document(
            doc_id=str(self.key.id()),
            fields=[
                search.TextField(name=u'type', value=u'Comment'),
                search.TextField(name='organization', value=empty_string(organization)),
                search.TextField(name='entityKey', value=empty_string(self.key.urlsafe())),
                search.TextField(name='title', value=empty_string(self.content)),
                search.TextField(name='parent_id', value=empty_string(self.parent_id)),
                search.TextField(name='parent_kind', value=empty_string(self.parent_kind)),
                search.TextField(name='access', value=empty_string(self.access)),
                search.TextField(name='owner', value=empty_string(self.owner)),
                search.TextField(name='collaborators', value=collaborators),
                search.TextField(name='content', value=empty_string(self.content)),
                search.DateField(name='created_at', value=self.created_at),
                search.DateField(name='updated_at', value=self.updated_at),
                search.TextField(name='title_autocomplete', value=empty_string(title_autocomplete)),
                # search.TextField(name='addresses', value = empty_string(addresses)),
            ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)

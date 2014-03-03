from google.appengine.ext import ndb
from google.appengine.datastore.datastore_query import Cursor
from google.appengine.api import search 
from protorpc import messages
from endpoints_proto_datastore.ndb import EndpointsModel
from iomodels.crmengine.notes import Topic, AuthorSchema,DiscussionAboutSchema
from model import Userinfo
from iograph import Edge
import pprint

import model

# The message class that defines the EntityKey schema
class EntityKeyRequest(messages.Message):
    entityKey = messages.StringField(1)

 # The message class that defines the ListRequest schema
class ListRequest(messages.Message):
    limit = messages.IntegerField(1)
    pageToken = messages.StringField(2)

class EventSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    title = messages.StringField(3)
    starts_at = messages.StringField(4)
    ends_at = messages.StringField(5)
    where = messages.StringField(6)
    about = messages.MessageField(DiscussionAboutSchema,7)
    created_at = messages.StringField(8)
    updated_at = messages.StringField(9)

class EventInsertRequest(messages.Message):
    about = messages.StringField(1)
    title = messages.StringField(2,required=True)
    due = messages.StringField(3)
    reminder = messages.StringField(4)
    status = messages.StringField(5)
    assignees = messages.MessageField(EntityKeyRequest,6, repeated = True)
    tags = messages.MessageField(EntityKeyRequest,7, repeated = True)

class EventListRequest(messages.Message):
    limit = messages.IntegerField(1)
    pageToken = messages.StringField(2)
    order = messages.StringField(3)
    status = messages.StringField(4)
    tags = messages.StringField(5,repeated = True)
    owner = messages.StringField(6)
    assignee = messages.BooleanField(7)
    about = messages.StringField(8)
    urgent = messages.BooleanField(9)

class EventListResponse(messages.Message):
    items = messages.MessageField(EventSchema, 1, repeated=True)
    nextPageToken = messages.StringField(2)

class Event(EndpointsModel):

    _message_fields_schema = ('id','entityKey','owner','author','collaborators_ids','collaborators_list','created_at','updated_at', 'starts_at','ends_at','title','where','about_kind','about_item')

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

        perm = model.Permission(about_kind='Event',
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

    @classmethod
    def list_by_parent(cls,parent_key,request):
        date_time_to_string = lambda x: x.strftime("%Y-%m-%dT%H:%M:00.000") if x else ""
        event_list = []
        event_edge_list = Edge.list(
                                start_node = parent_key,
                                kind = 'events',
                                limit=request.events.limit,
                                pageToken=request.events.pageToken
                                )
        for edge in event_edge_list['items']:
            event = edge.end_node.get()
            event_schema = EventSchema(
                                    id = str( event.key.id() ),
                                    entityKey = event.key.urlsafe(),
                                    title = event.title,
                                    starts_at = event.starts_at.isoformat(),
                                    ends_at = event.ends_at.isoformat(),
                                    where = event.where,
                                    created_at = event.created_at.isoformat(),
                                    updated_at = event.updated_at.isoformat()
                                )
            event_list.append(event_schema)
        if event_edge_list['next_curs'] and event_edge_list['more']:
            event_next_curs = event_edge_list['next_curs'].urlsafe()
        else:
            event_next_curs = None
        return EventListResponse(
                                items = event_list,
                                nextPageToken = event_next_curs
                                )
  
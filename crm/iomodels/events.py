import datetime

import endpoints
import model
from endpoints_proto_datastore.ndb import EndpointsModel
from google.appengine.api import search
from google.appengine.api import taskqueue
from google.appengine.datastore.datastore_query import Cursor
from google.appengine.ext import ndb
from model import Userinfo
from protorpc import messages

from endpoints_helper import EndpointsHelper
from iograph import Edge
from iomodels.notes import AuthorSchema, DiscussionAboutSchema
from iomodels.tags import Tag, TagSchema


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
    description = messages.StringField(7)
    about = messages.MessageField(DiscussionAboutSchema, 8)
    created_by = messages.MessageField(AuthorSchema, 9)
    tags = messages.MessageField(TagSchema, 10, repeated=True)
    created_at = messages.StringField(11)
    updated_at = messages.StringField(12)
    access = messages.StringField(13)
    timezone = messages.StringField(14)
    allday = messages.StringField(15)


class EventInsertRequest(messages.Message):
    parent = messages.StringField(1)
    title = messages.StringField(2)
    starts_at = messages.StringField(3)
    ends_at = messages.StringField(4)
    where = messages.StringField(5)
    access = messages.StringField(6)
    description = messages.StringField(7)
    allday = messages.StringField(8)
    invites = messages.StringField(9, repeated=True)
    guest_modify = messages.StringField(10)
    guest_invite = messages.StringField(11)
    guest_list = messages.StringField(12)
    reminder = messages.IntegerField(13)
    method = messages.StringField(14)
    timezone = messages.StringField(15)


class EventPatchRequest(messages.Message):
    entityKey = messages.StringField(1, required=True)
    title = messages.StringField(2)
    starts_at = messages.StringField(3)
    ends_at = messages.StringField(4)
    where = messages.StringField(5)
    access = messages.StringField(6)
    description = messages.StringField(7)
    allday = messages.StringField(8)
    googleEvent = messages.StringField(9)
    id = messages.StringField(10)
    timezone = messages.StringField(11)


class EventListRequest(messages.Message):
    limit = messages.IntegerField(1)
    pageToken = messages.StringField(2)
    order = messages.StringField(3)
    tags = messages.StringField(4, repeated=True)
    owner = messages.StringField(5)
    about = messages.StringField(6)


class EventListResponse(messages.Message):
    items = messages.MessageField(EventSchema, 1, repeated=True)
    nextPageToken = messages.StringField(2)


class EventFetchListRequest(messages.Message):
    events_list_start = messages.StringField(1)
    events_list_end = messages.StringField(2)


class EventFetchResult(messages.Message):
    id = messages.StringField(1)
    title = messages.StringField(2)
    where = messages.StringField(3)
    starts_at = messages.StringField(4)
    ends_at = messages.StringField(5)
    entityKey = messages.StringField(6)
    allday = messages.StringField(7)


class EventFetchResults(messages.Message):
    items = messages.MessageField(EventFetchResult, 1, repeated=True)


class Event(EndpointsModel):
    _message_fields_schema = (
        'id', 'entityKey', 'owner', 'author', 'collaborators_ids', 'collaborators_list', 'created_at', 'updated_at',
        'starts_at', 'ends_at', 'title', 'where', 'about_kind', 'about_item', 'access')

    author = ndb.StructuredProperty(Userinfo)
    # Sharing fields
    owner = ndb.StringProperty()
    collaborators_list = ndb.StructuredProperty(model.Userinfo, repeated=True)
    collaborators_ids = ndb.StringProperty(repeated=True)
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    title = ndb.StringProperty()
    where = ndb.StringProperty()
    starts_at = ndb.DateTimeProperty()
    ends_at = ndb.DateTimeProperty()
    description = ndb.StringProperty()
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
    allday = ndb.StringProperty()
    event_google_id = ndb.StringProperty()
    timezone = ndb.StringProperty()

    def put(self, **kwargs):
        ndb.Model.put(self, **kwargs)
        try:
            self.put_index()
        except:
            print 'error on saving document index'

    def set_perm(self):
        about_item = str(self.key.id())

        perm = model.Permission(about_kind='Event',
                                about_item=about_item,
                                type='user',
                                role='owner',
                                value=self.owner)
        perm.put()

    def put_index(self, data=None):
        """ index the element at each"""
        empty_string = lambda x: x if x else ""
        collaborators = " ".join(self.collaborators_ids)
        organization = str(self.organization.id())
        if data:
            search_key = ['infos', 'events', 'tags']
            for key in search_key:
                if key not in data.keys():
                    data[key] = ""
            my_document = search.Document(
                doc_id=str(data['id']),
                fields=[
                    search.TextField(name=u'type', value=u'Event'),
                    search.TextField(name='organization', value=empty_string(organization)),
                    search.TextField(name='access', value=empty_string(self.access)),
                    search.TextField(name='owner', value=empty_string(self.owner)),
                    search.TextField(name='collaborators', value=collaborators),
                    search.TextField(name='where', value=empty_string(self.where)),
                    search.TextField(name='description', value=empty_string(self.description)),
                    search.TextField(name='title', value=empty_string(self.title)),
                    search.DateField(name='created_at', value=self.created_at),
                    search.DateField(name='updated_at', value=self.updated_at),
                    search.TextField(name='infos', value=data['infos']),
                    search.TextField(name='tags', value=data['tags']),
                    search.TextField(name='events', value=data['events']),
                    search.NumberField(name='comments', value=self.comments),
                    search.TextField(name='about_kind', value=empty_string(self.about_kind)),
                    search.TextField(name='about_item', value=empty_string(self.about_item)),

                ])
        else:
            my_document = search.Document(
                doc_id=str(self.key.id()),
                fields=[
                    search.TextField(name=u'type', value=u'Event'),
                    search.TextField(name='organization', value=empty_string(organization)),
                    search.TextField(name='access', value=empty_string(self.access)),
                    search.TextField(name='owner', value=empty_string(self.owner)),
                    search.TextField(name='collaborators', value=collaborators),
                    search.TextField(name='where', value=empty_string(self.where)),
                    search.TextField(name='description', value=empty_string(self.description)),
                    search.TextField(name='title', value=empty_string(self.title)),
                    search.DateField(name='created_at', value=self.created_at),
                    search.DateField(name='updated_at', value=self.updated_at),
                    search.NumberField(name='comments', value=self.comments),
                    search.TextField(name='about_kind', value=empty_string(self.about_kind)),
                    search.TextField(name='about_item', value=empty_string(self.about_item)),

                ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)

    # get event by id  hadji hicham 09-08-2014
    @classmethod
    def getEventById(cls, id):
        return cls.get_by_id(int(id))

    # under the test
    @classmethod
    def get_schema(cls, user_from_email, request):
        event = cls.get_by_id(int(request.id))
        if event is None:
            raise endpoints.NotFoundException('Event not found.')
        tag_list = Tag.list_by_parent(parent_key=event.key)
        about = None
        edge_list = Edge.list(start_node=event.key, kind='related_to')
        for edge in edge_list['items']:
            about_kind = edge.end_node.kind()
            parent = edge.end_node.get()
            if parent:
                if about_kind == 'Contact' or about_kind == 'Lead':
                    about_name = parent.firstname + ' ' + parent.lastname
                else:
                    about_name = parent.name
                about = DiscussionAboutSchema(
                    kind=about_kind,
                    id=str(parent.key.id()),
                    name=about_name
                )
        author_schema = None
        if event.author:
            author_schema = AuthorSchema(
                google_user_id=event.author.google_user_id,
                email=user_from_email.email,
                display_name=event.author.display_name,
                google_public_profile_url=event.author.google_public_profile_url,
                photo=event.author.photo)
        event_schema = EventSchema(
            id=str(event.key.id()),
            entityKey=event.key.urlsafe(),
            title=event.title,
            starts_at=event.starts_at.isoformat(),
            ends_at=event.ends_at.isoformat(),
            where=event.where,
            description=event.description,
            about=about,
            created_by=author_schema,
            tags=tag_list,
            created_at=event.created_at.isoformat(),
            updated_at=event.updated_at.isoformat(),
            access=event.access,
            allday=event.allday,
            timezone=event.timezone

        )

        return event_schema

    @classmethod
    def list(cls, user_from_email, request):
        curs = Cursor(urlsafe=request.pageToken)
        if request.limit:
            limit = int(request.limit)
        else:
            limit = 10
        items = []
        you_can_loop = True
        count = 0
        while you_can_loop:
            if request.order:
                ascending = True
                if request.order.startswith('-'):
                    order_by = request.order[1:]
                    ascending = False
                else:
                    order_by = request.order
                attr = cls._properties.get(order_by)
                if attr is None:
                    raise AttributeError('Order attribute %s not defined.' % (order_by,))
                if ascending:
                    events, next_curs, more = cls.query().filter(
                        cls.organization == user_from_email.organization).order(+attr).fetch_page(limit,
                                                                                                  start_cursor=curs)
                else:
                    events, next_curs, more = cls.query().filter(
                        cls.organization == user_from_email.organization).order(-attr).fetch_page(limit,
                                                                                                  start_cursor=curs)
            else:
                events, next_curs, more = cls.query().filter(
                    cls.organization == user_from_email.organization).fetch_page(limit, start_cursor=curs)
            for event in events:
                if count <= limit:
                    is_filtered = True
                    if event.access == 'private' and event.owner != user_from_email.google_user_id:
                        end_node_set = [user_from_email.key]
                        if not Edge.find(start_node=event.key, kind='permissions', end_node_set=end_node_set,
                                         operation='AND'):
                            is_filtered = False
                    if request.tags and is_filtered:
                        end_node_set = [ndb.Key(urlsafe=tag_key) for tag_key in request.tags]
                        if not Edge.find(start_node=event.key, kind='tags', end_node_set=end_node_set, operation='AND'):
                            is_filtered = False
                    if request.owner and event.owner != request.owner and is_filtered:
                        is_filtered = False
                    if request.about and is_filtered:
                        end_node_set = [ndb.Key(urlsafe=request.about)]
                        if not Edge.find(start_node=event.key, kind='related_to', end_node_set=end_node_set,
                                         operation='AND'):
                            is_filtered = False
                    if is_filtered:
                        count += 1
                        # list of tags related to this event
                        tag_list = Tag.list_by_parent(parent_key=event.key)
                        about = None
                        edge_list = Edge.list(start_node=event.key, kind='related_to')
                        for edge in edge_list['items']:
                            about_kind = edge.end_node.kind()
                            parent = edge.end_node.get()
                            if parent:
                                if about_kind == 'Contact' or about_kind == 'Lead':
                                    about_name = parent.firstname + ' ' + parent.lastname
                                else:
                                    about_name = parent.name
                                about = DiscussionAboutSchema(kind=about_kind,
                                                              id=str(parent.key.id()),
                                                              name=about_name)
                        author_schema = None
                        if event.author:
                            author_schema = AuthorSchema(google_user_id=event.author.google_user_id,
                                                         display_name=event.author.display_name,
                                                         google_public_profile_url=event.author.google_public_profile_url,
                                                         photo=event.author.photo)
                        event_schema = EventSchema(
                            id=str(event.key.id()),
                            entityKey=event.key.urlsafe(),
                            title=event.title,
                            starts_at=event.starts_at.isoformat(),
                            ends_at=event.ends_at.isoformat(),
                            where=event.where,
                            description=event.description,
                            about=about,
                            created_by=author_schema,
                            tags=tag_list,
                            created_at=event.created_at.isoformat(),
                            updated_at=event.updated_at.isoformat()
                        )
                        items.append(event_schema)
            if count == limit:
                you_can_loop = False
            if more and next_curs:
                curs = next_curs
            else:
                you_can_loop = False
        if next_curs and more:
            next_curs_url_safe = next_curs.urlsafe()
        else:
            next_curs_url_safe = None
        return EventListResponse(items=items, nextPageToken=next_curs_url_safe)

    @classmethod
    def list_by_parent(cls, parent_key, request):
        date_time_to_string = lambda x: x.strftime("%Y-%m-%dT%H:%M:00.000") if x else ""
        event_list = []
        event_edge_list = Edge.list(
            start_node=parent_key,
            kind='events',
            limit=request.events.limit,
            pageToken=request.events.pageToken
        )
        for edge in event_edge_list['items']:
            event = edge.end_node.get()
            event_schema = EventSchema(
                id=str(event.key.id()),
                entityKey=event.key.urlsafe(),
                title=event.title,
                starts_at=event.starts_at.isoformat(),
                ends_at=event.ends_at.isoformat(),
                where=event.where,
                created_at=event.created_at.isoformat(),
                updated_at=event.updated_at.isoformat()
            )
            event_list.append(event_schema)
        if event_edge_list['next_curs'] and event_edge_list['more']:
            event_next_curs = event_edge_list['next_curs'].urlsafe()
        else:
            event_next_curs = None
        return EventListResponse(
            items=event_list,
            nextPageToken=event_next_curs
        )

    @classmethod
    def insert(cls, user_from_email, request):
        author = Userinfo()
        author.google_user_id = user_from_email.google_user_id
        author.display_name = user_from_email.google_display_name
        author.photo = user_from_email.google_public_profile_photo_url
        event = cls(
            owner=user_from_email.google_user_id,
            organization=user_from_email.organization,
            access=request.access,
            title=request.title,
            starts_at=datetime.datetime.strptime(request.starts_at, "%Y-%m-%dT%H:%M:00.000000"),
            ends_at=datetime.datetime.strptime(request.ends_at, "%Y-%m-%dT%H:%M:00.000000"),
            where=request.where,
            description=request.description,
            author=author,
            allday=request.allday,
            timezone=request.timezone
        )
        event_key = event.put_async()
        attendees = []
        if request.invites:
            attendees = request.invites

        taskqueue.add(
            url='/workers/syncevent',
            queue_name='iogrow-low-event',
            params={
                'email': user_from_email.email,
                'starts_at': request.starts_at,
                'ends_at': request.ends_at,
                'summary': request.title,
                'event_id': event_key.get_result().id(),
                'attendees': attendees,
                'guest_modify': request.guest_modify,
                'guest_invite': request.guest_invite,
                'guest_list': request.guest_list,
                'description': request.description,
                'reminder': request.reminder,
                'method': request.method,
                'timezone': request.timezone,
                'where': request.where
            }
        )

        event_key_async = event_key.get_result()
        if request.parent:

            parent_key = ndb.Key(urlsafe=request.parent)
            # insert edges
            Edge.insert(start_node=parent_key,
                        end_node=event_key_async,
                        kind='events',
                        inverse_edge='parents')
            EndpointsHelper.update_edge_indexes(
                parent_key=event_key_async,
                kind='events',
                indexed_edge=str(parent_key.id())
            )
        else:
            data = {'id': event_key_async.id()}
            event.put_index(data)
        event_schema = EventSchema(
            id=str(event_key_async.id()),
            entityKey=event_key_async.urlsafe(),
            title=event.title,
            starts_at=event.starts_at.isoformat(),
            ends_at=event.ends_at.isoformat(),
            where=event.where,
            created_at=event.created_at.isoformat(),
            updated_at=event.updated_at.isoformat(),
            access=event.access,
            timezone=event.timezone,
            allday=event.allday
        )
        return event_schema

    @classmethod
    def listFetch(cls, user_from_email, request):
        start_list = datetime.datetime.strptime(request.events_list_start, "%Y-%m-%dT%H:%M:00.000000")
        end_list = datetime.datetime.strptime(request.events_list_end, "%Y-%m-%dT%H:%M:00.000000")
        events = Event.query().filter(cls.organization == user_from_email.organization, Event.starts_at >= start_list,
                                      Event.starts_at <= end_list)
        event_results = []
        for event in events:
            kwargs = {
                'id': str(event.id),
                'entityKey': event.entityKey,
                'title': event.title,
                'starts_at': event.starts_at.isoformat(),
                'ends_at': event.ends_at.isoformat(),
                'where': event.where,
                'allday': event.allday
            }
            event_results.append(EventFetchResult(**kwargs))
        return EventFetchResults(items=event_results)

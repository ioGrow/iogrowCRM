from endpoints_proto_datastore.ndb import EndpointsModel
from google.appengine.api import taskqueue
from google.appengine.ext import ndb
from protorpc import messages

from endpoints_helper import EndpointsHelper
from iograph import Edge


class TagSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    edgeKey = messages.StringField(3)
    name = messages.StringField(4)
    color = messages.StringField(5)
    about_kind = messages.StringField(6)


class TagInsertRequest(messages.Message):
    about_kind = messages.StringField(1, required=True)
    name = messages.StringField(2, required=True)
    color = messages.StringField(3)
    about_kind = messages.StringField(4)


class TagListRequest(messages.Message):
    about_kind = messages.StringField(1)


class TagListResponse(messages.Message):
    items = messages.MessageField(TagSchema, 1, repeated=True)


class Tag(EndpointsModel):
    _message_fields_schema = ('id', 'name', 'entityKey', 'about_kind', 'color')
    owner = ndb.StringProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    name = ndb.StringProperty()
    color = ndb.StringProperty()
    about_kind = ndb.StringProperty()
    organization = ndb.KeyProperty()

    @classmethod
    def insert(cls, user_from_email, request):
        user_from_email = EndpointsHelper.require_iogrow_user()
        tag = cls(
            owner=user_from_email.google_user_id,
            organization=user_from_email.organization,
            name=request.name,
            color=request.color,
            about_kind=request.about_kind
        )
        tag_async = tag.put_async()
        tag_key = tag_async.get_result()
        return TagSchema(
            id=str(tag_key.id()),
            entityKey=tag_key.urlsafe(),
            name=tag.name,
            color=tag.color,
            about_kind=tag.about_kind
        )

    @classmethod
    def attach_tag(cls, user_from_email, request):
        start_node = ndb.Key(urlsafe=request.parent)
        end_node = ndb.Key(urlsafe=request.tag_key)
        edge_key = Edge.insert(
            start_node=start_node,
            end_node=end_node,
            kind='tags',
            inverse_edge='tagged_on'
        )
        edge = edge_key.get()
        if end_node.get().about_kind != 'Blog':
            EndpointsHelper.update_edge_indexes(
                parent_key=start_node,
                kind='tags',
                indexed_edge=str(end_node.id())
            )

        return TagSchema(
            edgeKey=edge.key.urlsafe(),
            id=str(edge.end_node.id()),
            entityKey=edge.end_node.urlsafe(),
            name=edge.end_node.get().name,
            color=edge.end_node.get().color
        )

    @classmethod
    def list_by_parent(cls, parent_key):
        """return the list of tags related to an object"""
        edge_list = Edge.list(
            start_node=parent_key,
            kind='tags'
        )
        tag_list = []
        for edge in edge_list['items']:
            if edge.end_node.get() is not None:
                tag_list.append(
                    TagSchema(
                        id=str(edge.end_node.id()),
                        edgeKey=edge.key.urlsafe(),
                        name=edge.end_node.get().name,
                        color=edge.end_node.get().color
                    )
                )
        return tag_list

    @classmethod
    def list_by_name(cls, name):
        tags = cls.query(cls.name == name).fetch()
        tag_list = []
        if tags:
            tag_list = []
            for tag in tags:
                tag_list.append(
                    TagSchema(
                        id=str(tag.key.id()),
                        entityKey=tag.key.urlsafe(),
                        name=tag.name,
                        color=tag.color
                    )
                )
        return TagListResponse(items=tag_list)

    @classmethod
    def list_by_kind_and_name(cls, name, kind):
        tags = cls.query(cls.about_kind == kind, cls.name == name).fetch()
        tag_list = []
        if tags:
            tag_list = []
            for tag in tags:
                tag_list.append(
                    TagSchema(
                        id=str(tag.key.id()),
                        entityKey=tag.key.urlsafe(),
                        name=tag.name,
                        color=tag.color
                    )
                )
        return TagListResponse(items=tag_list)

    @classmethod
    def list_by_kind(cls, user_from_email, kind):
        tags = cls.query(cls.about_kind == kind, cls.organization == user_from_email.organization).fetch()
        tag_list = []
        if tags:
            tag_list = []
            for tag in tags:
                tag_list.append(
                    TagSchema(
                        id=str(tag.key.id()),
                        entityKey=tag.key.urlsafe(),
                        name=tag.name,
                        color=tag.color
                    )
                )
        return TagListResponse(items=tag_list)

    @classmethod
    def list_by_just_kind(cls, kind):
        tags = cls.query(cls.about_kind == kind).fetch()
        tag_list = []
        if tags:
            tag_list = []
            for tag in tags:
                tag_list.append(
                    TagSchema(
                        id=str(tag.key.id()),
                        entityKey=tag.key.urlsafe(),
                        name=tag.name,
                        color=tag.color
                    )
                )
        return TagListResponse(items=tag_list)

    # patch tags . hadji hicham 22-07-2014.
    @classmethod
    def patch(cls, user_from_email, request):
        tags = cls.query(cls.about_kind == kind, cls.organization == user_from_email.organization).fetch()
        tag_list = []
        if tags:
            tag_list = []
            for tag in tags:
                tag_list.append(
                    TagSchema(
                        id=str(tag.key.id()),
                        entityKey=tag.key.urlsafe(),
                        name=tag.name,
                        color=tag.color
                    )
                )
        return TagListResponse(items=tag_list)

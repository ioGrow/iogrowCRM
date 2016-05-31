import requests
from endpoints_proto_datastore.ndb import EndpointsModel
from google.appengine.ext import ndb
from protorpc import messages

from crm.endpoints_helper import EndpointsHelper
from crm.iograph import Edge


class KeywordSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    edgeKey = messages.StringField(3)
    word = messages.StringField(4)
    color = messages.StringField(5)
    locality = messages.StringField(6)


class KeywordInsertRequest(messages.Message):
    locality = messages.StringField(1, required=True)
    word = messages.StringField(2, required=True)
    color = messages.StringField(3)
    locality = messages.StringField(4)


class ProfileListRequest(messages.Message):
    keywords = messages.StringField(1, repeated=True)
    page = messages.IntegerField(2)
    limit = messages.IntegerField(3)


class KeywordListResponse(messages.Message):
    items = messages.MessageField(KeywordSchema, 1, repeated=True)


class ProfileListResponse(messages.Message):
    items = messages.StringField(1)


class ProfileDeleteRequest(messages.Message):
    entityKey = messages.StringField(1)


class Keyword(EndpointsModel):
    _message_fields_schema = ('id', 'word', 'entityKey', 'locality', 'color')
    owner = ndb.StringProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    word = ndb.StringProperty()
    color = ndb.StringProperty()
    locality = ndb.StringProperty()
    organization = ndb.KeyProperty()

    @classmethod
    def insert(cls, user_from_email, request):
        exist = cls.query(cls.organization == user_from_email.organization, cls.word == request.word).fetch(1)
        if exist:
            print "key word exist"
            return KeywordSchema(
                id="str(keyword_key.id())",
                entityKey="keyword_key.urlsafe()",
                word=exist[0].word,
                color=exist[0].color,
                locality=exist[0].locality
            )
        else:
            keyword = cls(
                owner=user_from_email.google_user_id,
                organization=user_from_email.organization,
                word=request.word,
                color=request.color,
                locality=request.locality
            )
        keyword_async = keyword.put_async()
        keyword_key = keyword_async.get_result()
        return KeywordSchema(
            id=str(keyword_key.id()),
            entityKey=keyword_key.urlsafe(),
            word=keyword.word,
            color=keyword.color,
            locality=keyword.locality
        )

    @classmethod
    def delete(cls, request):
        key = ndb.Key(urlsafe=request.entityKey)
        key.delete()

    @classmethod
    def list_keywords(cls, user_from_email):
        keywords = cls.query(cls.organization == user_from_email.organization).fetch()
        keyword_list = []
        if keywords:
            keyword_list = []
            for keyword in keywords:
                keyword_list.append(
                    KeywordSchema(
                        id=str(keyword.key.id()),
                        entityKey=keyword.key.urlsafe(),
                        word=keyword.word,
                        locality=keyword.locality,
                        color=keyword.color
                    )
                )
        return KeywordListResponse(items=keyword_list)

    @classmethod
    def list_profiles(cls, user_from_email, request):
        keyword_list = []
        if request.keywords:
            keyword_list = request.keywords
        else:
            keywords = cls.query(cls.organization == user_from_email.organization).fetch()
            if keywords:
                keyword_list = []
                for keyword in keywords:
                    keyword_list.append(keyword.word)
        r = requests.get("http://localhost:5000/linkedin/api/get",
                         params={
                             "keywords": keyword_list,
                             "page": request.page,
                             "limit": request.limit

                         })
        return ProfileListResponse(items=r.text)

    @classmethod
    def attach_keyword(cls, user_from_email, request):
        start_node = ndb.Key(urlsafe=request.parent)
        end_node = ndb.Key(urlsafe=request.keyword_key)
        edge_key = Edge.insert(
            start_node=start_node,
            end_node=end_node,
            kind='keywords',
            inverse_edge='keywordged_on'
        )
        edge = edge_key.get()
        if end_node.get().locality != 'Blog':
            EndpointsHelper.update_edge_indexes(
                parent_key=start_node,
                kind='keywords',
                indexed_edge=str(end_node.id())
            )

        return KeywordSchema(
            edgeKey=edge.key.urlsafe(),
            id=str(edge.end_node.id()),
            entityKey=edge.end_node.urlsafe(),
            word=edge.end_node.get().word,
            color=edge.end_node.get().color
        )

    @classmethod
    def list_by_parent(cls, parent_key):
        """return the list of keywords related to an object"""
        edge_list = Edge.list(
            start_node=parent_key,
            kind='keywords'
        )
        keyword_list = []
        for edge in edge_list['items']:
            if edge.end_node.get() is not None:
                keyword_list.append(
                    KeywordSchema(
                        id=str(edge.end_node.id()),
                        edgeKey=edge.key.urlsafe(),
                        word=edge.end_node.get().word,
                        color=edge.end_node.get().color
                    )
                )
        return keyword_list

    @classmethod
    def list_by_word(cls, word):
        keywords = cls.query(cls.word == word).fetch()
        keyword_list = []
        if keywords:
            keyword_list = []
            for keyword in keywords:
                keyword_list.append(
                    KeywordSchema(
                        id=str(keyword.key.id()),
                        entityKey=keyword.key.urlsafe(),
                        word=keyword.word,
                        color=keyword.color
                    )
                )
        return KeywordListResponse(items=keyword_list)

    @classmethod
    def list_by_kind_and_word(cls, word, kind):
        keywords = cls.query(cls.locality == kind, cls.word == word).fetch()
        keyword_list = []
        if keywords:
            keyword_list = []
            for keyword in keywords:
                keyword_list.append(
                    KeywordSchema(
                        id=str(keyword.key.id()),
                        entityKey=keyword.key.urlsafe(),
                        word=keyword.word,
                        color=keyword.color
                    )
                )
        return KeywordListResponse(items=keyword_list)

    @classmethod
    def list_by_kind(cls, user_from_email, kind):
        keywords = cls.query(cls.locality == kind, cls.organization == user_from_email.organization).fetch()
        keyword_list = []
        if keywords:
            keyword_list = []
            for keyword in keywords:
                keyword_list.append(
                    KeywordSchema(
                        id=str(keyword.key.id()),
                        entityKey=keyword.key.urlsafe(),
                        word=keyword.word,
                        color=keyword.color
                    )
                )
        return KeywordListResponse(items=keyword_list)

    @classmethod
    def list_by_just_kind(cls, kind):
        keywords = cls.query(cls.locality == kind).fetch()
        keyword_list = []
        if keywords:
            keyword_list = []
            for keyword in keywords:
                keyword_list.append(
                    KeywordSchema(
                        id=str(keyword.key.id()),
                        entityKey=keyword.key.urlsafe(),
                        word=keyword.word,
                        color=keyword.color
                    )
                )
        return KeywordListResponse(items=keyword_list)

    # patch keywords . hadji hicham 22-07-2014.
    @classmethod
    def patch(cls, user_from_email, request):
        keywords = cls.query(cls.locality == kind, cls.organization == user_from_email.organization).fetch()
        keyword_list = []
        if keywords:
            keyword_list = []
            for keyword in keywords:
                keyword_list.append(
                    KeywordSchema(
                        id=str(keyword.key.id()),
                        entityKey=keyword.key.urlsafe(),
                        word=keyword.word,
                        color=keyword.color
                    )
                )
        return KeywordListResponse(items=keyword_list)

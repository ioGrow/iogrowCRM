from google.appengine.ext import ndb
from google.appengine.api import search 
from protorpc import messages
from endpoints_proto_datastore.ndb import EndpointsModel
from model import Userinfo
from iograph import Edge



import model
 # The message class that defines the author schema
class AuthorSchema(messages.Message):
    google_user_id = messages.StringField(1)
    display_name = messages.StringField(2)
    google_public_profile_url = messages.StringField(3)
    photo = messages.StringField(4)
    edgeKey = messages.StringField(5)

class TopicSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    last_updater = messages.MessageField(AuthorSchema, 3, required = True)
    title = messages.StringField(4,required = True)
    excerpt = messages.StringField(5)
    topic_kind = messages.StringField(6)
    created_at = messages.StringField(7)
    updated_at = messages.StringField(8)

class TopicListResponse(messages.Message):
    items = messages.MessageField(TopicSchema, 1, repeated=True)
    nextPageToken = messages.StringField(2)

class Topic(EndpointsModel):

    _message_fields_schema = ('id','title','entityKey','last_updater','updated_at','excerpt','discussionId','created_at')
    

    last_updater = ndb.StructuredProperty(Userinfo)

    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    title = ndb.StringProperty()
    # about 100 characters from the beginning of this topic
    excerpt = ndb.TextProperty()
    # number of comments in this topic
    comments = ndb.IntegerProperty(default=0)
    # A Topic is attached to an object for example Account or Opportunity..
    about_kind = ndb.StringProperty()
    about_item = ndb.StringProperty()
    # a key reference to the account's organization
    # Should be required
    discussionKind = ndb.StringProperty()
    discussionId = ndb.StringProperty()
    organization = ndb.KeyProperty()


class Note(EndpointsModel):

    #_message_fields_schema = ('id','title')
    author = ndb.StructuredProperty(Userinfo)
    # Sharing fields
    owner = ndb.StringProperty()
    collaborators_list = ndb.StructuredProperty(model.Userinfo,repeated=True)
    collaborators_ids = ndb.StringProperty(repeated=True)
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    title = ndb.StringProperty(required=True)
    content = ndb.TextProperty()
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
        self._setup()
        self.put_index()
        self.set_perm()

    def set_perm(self):
        about_item = str(self.key.id())

        perm = model.Permission(about_kind='Note',
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
        if data:
            search_key = ['topics','tags']
            for key in search_key:
                if key not in data.keys():
                    data[key] = ""
            my_document = search.Document(
            doc_id = str(data['id']),
            fields=[
                search.TextField(name=u'type', value=u'Note'),
                search.TextField(name='organization', value = empty_string(organization) ),
                search.TextField(name='access', value = empty_string(self.access) ),
                search.TextField(name='owner', value = empty_string(self.owner) ),
                search.TextField(name='collaborators', value = collaborators ),
                search.TextField(name='title', value = empty_string(self.title) ),
                search.TextField(name='content', value = empty_string(self.content)),
                search.TextField(name='about_kind', value = empty_string(self.about_kind)),
                search.TextField(name='about_item', value = empty_string(self.about_item)),
                search.DateField(name='created_at', value = self.created_at),
                search.DateField(name='updated_at', value = self.updated_at),
                search.NumberField(name='comments', value = self.comments),
                search.TextField(name='tags', value= data['tags']),
                search.TextField(name='topics', value= data['topics']),
               ])
        else:
            my_document = search.Document(
            doc_id = str(self.key.id()),
            fields=[
                search.TextField(name=u'type', value=u'Note'),
                search.TextField(name='organization', value = empty_string(organization) ),
                search.TextField(name='access', value = empty_string(self.access) ),
                search.TextField(name='owner', value = empty_string(self.owner) ),
                search.TextField(name='collaborators', value = collaborators ),
                search.TextField(name='title', value = empty_string(self.title) ),
                search.TextField(name='content', value = empty_string(self.content)),
                search.TextField(name='about_kind', value = empty_string(self.about_kind)),
                search.TextField(name='about_item', value = empty_string(self.about_item)),
                search.DateField(name='created_at', value = self.created_at),
                search.DateField(name='updated_at', value = self.updated_at),
                search.NumberField(name='comments', value = self.comments),
               ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)

    @classmethod
    def list_by_parent(cls,parent_key,request):
        topic_list = []
        topic_edge_list = Edge.list(
                                start_node = parent_key,
                                kind='topics',
                                limit=request.topics.limit,
                                pageToken=request.topics.pageToken
                                )
        for edge in topic_edge_list['items']:
            end_node = edge.end_node.get()
            if end_node.key.kind() == 'Note':
                if end_node.comments == 0:
                    last_updater = end_node.author
                    excerpt = end_node.content[0:100]
                else:
                    # get the last comment
                    comments_edge_list = Edge.list(
                                                start_node = end_node.key,
                                                kind = 'comments',
                                                limit = 1
                                                )
                    if len(comments_edge_list['items'])>0:
                            last_comment = comments_edge_list[0].end_node.get()
                            last_updater = last_comment.author
                            excerpt = last_comment.content[0:100]
            else:
                # get the last comment
                comments_edge_list = Edge.list(
                                                start_node = end_node.key,
                                                kind = 'comments',
                                                limit = 1
                                                )
                if len(comments_edge_list['items'])>0:
                        last_comment = comments_edge_list['items'][0].end_node.get()
                        last_updater = last_comment.author
                        excerpt = last_comment.content[0:100]

            author = AuthorSchema(
                                google_user_id = last_updater.google_user_id,
                                display_name = last_updater.display_name,
                                google_public_profile_url = last_updater.google_public_profile_url,
                                photo = last_updater.photo
                                )
            topic_list.append(
                            TopicSchema(
                                    id = str(end_node.key.id()),
                                    last_updater = author,
                                    title = edge.end_node.get().title,
                                    excerpt = excerpt,
                                    topic_kind = end_node.key.kind(),
                                    updated_at = end_node.updated_at.strftime(
                                                            "%Y-%m-%dT%H:%M:00.000"
                                                )
                                    )
                            )
        if topic_edge_list['next_curs'] and topic_edge_list['more']:
            topic_next_curs = topic_edge_list['next_curs'].urlsafe()
        else:
            topic_next_curs = None
        return TopicListResponse(
                                    items = topic_list,
                                    nextPageToken = topic_next_curs
                                )


    # Attach a topic to this note  
    def _setup(self):
        topic = Topic()
        topic.last_updater = self.author
        topic.title = self.title
        topic.excerpt = self.content
        topic.about_kind = self.about_kind
        topic.about_item = self.about_item
        topic.updated_at = self.updated_at
        topic.discussionKind = 'Note'
        topic.discussionId = str(self.key.id())
        topic.organization = self.organization
        topic.put()




  

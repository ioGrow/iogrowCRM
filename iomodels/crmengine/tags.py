from google.appengine.ext import ndb
from google.appengine.api import search 
from endpoints_proto_datastore.ndb import EndpointsModel
from protorpc import messages
from iograph import Edge

class TagSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    edgeKey = messages.StringField(3)
    name  = messages.StringField(4)
    color = messages.StringField(5)

class TagListRequest(messages.Message):
    about_kind = messages.StringField(1,required=True)

class TagListResponse(messages.Message):
    items = messages.MessageField(TagSchema, 1, repeated=True)
        

class Tag(EndpointsModel):

    _message_fields_schema = ('id','name','entityKey', 'about_kind','color')
    owner = ndb.StringProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    name = ndb.StringProperty()
    color = ndb.StringProperty()
    about_kind = ndb.StringProperty()
    organization = ndb.KeyProperty()

    @classmethod
    def list_by_parent(cls,parent_key):
    	"""return the list of tags related to an object"""
    	edge_list = Edge.list(
    						start_node = parent_key,
    						kind = 'tags'
    						)
        tag_list = []
        for edge in edge_list['items']:
            tag_list.append(
                            TagSchema(
                            		id = str(edge.end_node.id()),
                                    edgeKey = edge.key.urlsafe(),
                                    name = edge.end_node.get().name,
                                    color = edge.end_node.get().color
                                    )
                            )
        return tag_list

    @classmethod
    def list_by_kind(cls,user_from_email,kind):
        print '*************************************************'
        print kind
        print user_from_email
        tags = cls.query(cls.about_kind==kind, cls.organization == user_from_email.organization).fetch()
        tag_list = None
        if tags:
            tag_list = []
            for tag in tags:
                tag_list.append(
                                TagSchema(
                                        id = str(tag.key.id()),
                                        entityKey = tag.key.urlsafe(),
                                        name = tag.name,
                                        color = tag.color
                                        )
                            )
        return TagListResponse(items = tag_list)


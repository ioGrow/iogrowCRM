from google.appengine.ext import ndb
from google.appengine.api import search 
from endpoints_proto_datastore.ndb import EndpointsModel
from protorpc import messages
from iograph import Edge

class TagSchema(messages.Message):
    id = messages.StringField(1)
    edgeKey = messages.StringField(2)
    name  = messages.StringField(3)
    color = messages.StringField(4)

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


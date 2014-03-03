from google.appengine.ext import ndb
from google.appengine.datastore.datastore_query import Cursor
from protorpc import messages

INVERSED_EDGES = {
            'tags': 'tagged_on',
            'tagged_on': 'tags',
            'assignees' : 'assigned_to',
            'assigned_to' : 'assignees',
            'tasks' : 'related_to'
            }

# The message class that defines Record schema for InfoNode attributes
class RecordSchema(messages.Message):
    field = messages.StringField(1)
    value = messages.StringField(2)
    property_type = messages.StringField(3, default='StringProperty')
    is_indexed = messages.BooleanField(4)

class InfoNodeResponse(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    kind = messages.StringField(3)
    fields = messages.MessageField(RecordSchema, 4, repeated=True)
    parent = messages.StringField(5)

class InfoNodeConnectionSchema(messages.Message):
    kind = messages.StringField(1, required=True)
    items = messages.MessageField(InfoNodeResponse, 2, repeated=True)

class InfoNodeListResponse(messages.Message):
    items = messages.MessageField(InfoNodeConnectionSchema, 1, repeated=True)

class Edge(ndb.Expando):
    """Edge Class to store the relationships between objects"""
    kind = ndb.StringProperty()
    start_node = ndb.KeyProperty()
    end_node = ndb.KeyProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    
    @classmethod
    def insert(cls, start_node,end_node,kind,inverse_edge=None):
        # create the inverse edge
        existing_edge = cls.query(cls.start_node==start_node, cls.end_node == end_node, cls.kind==kind).get()
        if existing_edge:
            return existing_edge.key
        if inverse_edge is not None:
            inversed_edge = Edge(kind = inverse_edge, 
                       start_node = end_node,
                       end_node = start_node)
            inversed_edge.put()
        edge = Edge(kind = kind, 
                       start_node = start_node,
                       end_node = end_node)
        edge_key = edge.put()
        return edge_key
    
    @classmethod
    def list(cls,start_node,kind,limit=1000,pageToken=None):
        curs = Cursor(urlsafe=pageToken)
        if limit:
            limit = int(limit)
        else:
            limit = 1000
        edges, next_curs, more =  cls.query(
                                                cls.start_node==start_node, 
                                                cls.kind==kind
                                            ).order(
                                                    -cls.updated_at
                                                ).fetch_page(
                                                    limit, start_cursor=curs
                                                )
        results = {}
        results['items'] = edges
        results['next_curs'] = next_curs
        results['more'] = more
        return results
    @classmethod
    def delete(cls, edge_key):
         existing_edge = edge_key.get()
         start_node = existing_edge.start_node 
         end_node = existing_edge.end_node
         kind = existing_edge.kind

         existing_edge.key.delete()
         inversed_edge = cls.query(cls.start_node==end_node, cls.end_node == start_node, cls.kind==INVERSED_EDGES[kind]).get()
         if inversed_edge:
             inversed_edge.key.delete()
    @classmethod
    def delete_all(cls, start_node):
         edges = cls.query(ndb.OR(cls.start_node==start_node,cls.end_node==start_node) ).fetch()
         for edge in edges:
            edge.key.delete()

    @classmethod
    def find(cls, start_node,end_node_set,kind,operation):
        """ search if there is edges wich start with start_node and ends with one of the end_node_set or has the whole end_node_set
            operation could be 'AND' to specify that we need all the end_node_set,'OR' to specify that we need at least one of the end_node_set
            return True or False
        """
        edge_list = cls.list(start_node,kind)
        end_node_found = list()
        for edge in edge_list['items']:
            end_node_found.append(edge.end_node)
        if operation == 'AND':
            return len( set(end_node_found).intersection(end_node_set) ) == len( set(end_node_set) )
        elif operation == 'OR':
            return len( set(end_node_found).intersection(end_node_set) ) > 0

        
class Node(ndb.Expando):
    """Node Class to store all objects"""
    kind = ndb.StringProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)

    @classmethod
    def list_info_nodes(cls,parent_key,request):
        edge_list = Edge.list(
                            start_node = parent_key,
                            kind = 'infos'
                            )
        connections_dict = {}
        for edge in edge_list['items']:
            node = edge.end_node.get()
            if node.kind not in connections_dict.keys():
                connections_dict[node.kind] = []
            node_fields = []
            for key, value in node.to_dict().iteritems():
                if key not in['kind', 'created_at', 'updated_at']:
                    record = RecordSchema(
                                          field = key,
                                          value = node.to_dict()[key]
                                          )
                    node_fields.append(record)
            info_node = InfoNodeResponse(
                                         id = str(node.key.id()),
                                         entityKey = node.key.urlsafe(),
                                         kind = node.kind,
                                         fields = node_fields
                                         )
            connections_dict[node.kind].append(info_node)
        connections_list = []
        for key, value in connections_dict.iteritems():
            infonodeconnection = InfoNodeConnectionSchema(
                                                            kind=key,
                                                            items=value
                                                        )
            connections_list.append(infonodeconnection)
        return InfoNodeListResponse(
                                    items = connections_list
                                    )


class InfoNode(ndb.Expando):
    """InfoNode Class to store all informations about object"""
    kind = ndb.StringProperty()
    parent = ndb.KeyProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    
    
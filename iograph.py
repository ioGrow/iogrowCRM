from google.appengine.ext import ndb

class Node(ndb.Expando):
    """Node Class to store all objects"""
    kind = ndb.StringProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)

class Edge(ndb.Expando):
    """Edge Class to store the relationships between objects"""
    kind = ndb.StringProperty()
    start_node = ndb.KeyProperty()
    end_node = ndb.KeyProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)

class InfoNode(ndb.Expando):
    """InfoNode Class to store all informations about object"""
    kind = ndb.StringProperty()
    parent = ndb.KeyProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    
    
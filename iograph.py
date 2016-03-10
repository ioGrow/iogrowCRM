# !/usr/bin/python
# -*- coding: utf-8 -*-
from google.appengine.ext import ndb
from google.appengine.api import memcache
from google.appengine.datastore.datastore_query import Cursor
from protorpc import messages
import iomessages
from model import User

# TODO: complte later
INVERSED_EDGES = {
    'admins': ['parents'],
    'report_stage': ['stage_report'],
    'tweets': ['parents'],
    'twitter': ['parents'],
    'linkedin': ['parents'],
    'articles': ['authored_by'],
    'assignees': ['assigned_to'],
    'authored_by': ['articles'],
    'cases': ['parents'],
    'comments': ['parents'],
    'contacts': ['parents'],
    'documents': ['parents'],
    'events': ['parents'],
    'gcontacts': ['synced_with'],
    'has_access_on': ['permissions'],
    'infos': ['parents'],
    'opportunities': ['parents'],
    'parents': ['cases',
                'comments',
                'contacts',
                'documents',
                'events',
                'infos',
                'opportunities',
                'tasks',
                'topics',
                'admins'
                ],
    'permissions': ['has_access_on'],
    'related_cases': ['status'],
    'related_opportunities': ['stages'],
    'stages': ['related_opportunities'],
    'status': ['related_cases'],
    'synced_with': ['gcontacts'],
    'tagged_on': ['tags'],
    'tags': ['tagged_on'],
    'tasks': ['parents'],
    'topics': ['parents']
}
DELETED_ON_CASCADE = {
    'Task': ['comments'],
    'Event': ['comments'],
    'Note': ['comments'],
    'Document': ['comments'],
    'Account': ['tasks', 'topics', 'documents', 'events'],
    'Contact': ['tasks', 'topics', 'documents', 'events', 'gcontacts'],
    'Opportunity': ['tasks', 'topics', 'documents', 'events'],
    'Case': ['tasks', 'topics', 'documents', 'events'],
    'Lead': ['tasks', 'topics', 'documents', 'events']
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
    def insert(cls, start_node, end_node, kind, inverse_edge=None, additional_properties=None):
        # check if the edge is in the available edge list
        if kind in INVERSED_EDGES.keys():
            existing_edge = cls.query(cls.start_node == start_node, cls.end_node == end_node, cls.kind == kind).get()
            if existing_edge:
                existing_edge.put_async()
                mem_key = start_node.urlsafe() + '_' + kind
                memcache.delete(mem_key)
                if inverse_edge is not None:
                    existing_inverse_edge = cls.query(cls.start_node == end_node, cls.end_node == start_node,
                                                      cls.kind == inverse_edge).get()
                    if existing_inverse_edge:
                        existing_inverse_edge.put_async()
                        mem_key = end_node.urlsafe() + '_' + inverse_edge
                memcache.delete(mem_key)
                return existing_edge.key
            if inverse_edge is not None:
                inversed_edge = Edge(
                    kind=inverse_edge,
                    start_node=end_node,
                    end_node=start_node
                )
                if additional_properties:
                    for key in additional_properties.keys():
                        setattr(inversed_edge, key, additional_properties[key])
                inversed_edge.put()
                mem_key = end_node.urlsafe() + '_' + inverse_edge
                memcache.delete(mem_key)
            edge = Edge(
                kind=kind,
                start_node=start_node,
                end_node=end_node
            )
            if additional_properties:
                for key in additional_properties.keys():
                    setattr(edge, key, additional_properties[key])
            edge_key = edge.put()
            mem_key = start_node.urlsafe() + '_' + kind
            memcache.delete(mem_key)
            return edge_key

    @classmethod
    def move(cls, edge, new_start_node):
        kind = edge.kind
        if kind in INVERSED_EDGES.keys():
            inversed_edge = cls.query(
                cls.start_node == edge.end_node,
                cls.end_node == edge.start_node,
                cls.kind.IN(INVERSED_EDGES[kind])).get()
            if inversed_edge:
                mem_key = inversed_edge.start_node.urlsafe() + '_' + inversed_edge.kind
                memcache.delete(mem_key)
                inversed_edge.end_node = new_start_node
                inversed_edge.put()
        edge.start_node = new_start_node
        edge.put()
        mem_key = edge.start_node.urlsafe() + '_' + edge.kind
        memcache.delete(mem_key)

    @classmethod
    def list(cls, start_node, kind, limit=1000, pageToken=None, order='DESC'):
        # mem_key = start_node.urlsafe()+'_'+kind
        # # if memcache.get(mem_key) is not None:
        # #     return memcache.get(mem_key)
        # # else:
        return cls.list_from_datastore(start_node, kind, limit, pageToken, order)

    @classmethod
    def list_from_datastore(cls, start_node, kind, limit=1000, pageToken=None, order='DESC'):
        curs = Cursor(urlsafe=pageToken)
        if limit:
            limit = int(limit)
        else:
            limit = 1000
        if order == 'DESC':
            edges, next_curs, more = cls.query(
                cls.start_node == start_node,
                cls.kind == kind
            ).order(
                -cls.updated_at
            ).fetch_page(
                limit, start_cursor=curs
            )
        elif order == 'ASC':
            edges, next_curs, more = cls.query(
                cls.start_node == start_node,
                cls.kind == kind
            ).order(
                cls.updated_at
            ).fetch_page(
                limit, start_cursor=curs
            )

        results = {'items': edges, 'next_curs': next_curs, 'more': more}
        mem_key = start_node.urlsafe() + '_' + kind
        memcache.set(mem_key, results)
        return results

    @classmethod
    def delete(cls, edge_key):
        existing_edge = edge_key.get()
        if existing_edge:
            start_node = existing_edge.start_node
            end_node = existing_edge.end_node
            kind = existing_edge.kind
            mem_key = existing_edge.start_node.urlsafe() + '_' + existing_edge.kind
            memcache.delete(mem_key)
            existing_edge.key.delete()
            if kind in INVERSED_EDGES.keys():
                inversed_edge = cls.query(
                    cls.start_node == end_node,
                    cls.end_node == start_node,
                    cls.kind.IN(INVERSED_EDGES[kind])).get()
                if inversed_edge:
                    mem_key = inversed_edge.start_node.urlsafe() + '_' + inversed_edge.kind
                    memcache.delete(mem_key)
                    inversed_edge.key.delete()

    @classmethod
    def delete_all(cls, start_node):
        edges = cls.query(ndb.OR(cls.start_node == start_node, cls.end_node == start_node)).fetch()
        for edge in edges:
            edge.key.delete()

    @classmethod
    def delete_all_cascade(cls, start_node):

        from endpoints_helper import EndpointsHelper

        EndpointsHelper.delete_document_from_index(start_node.id())
        start_node_kind = start_node.kind()
        edges = cls.query(cls.start_node == start_node).fetch()
        for edge in edges:
            # check if we should delete subGraph or not
            if start_node_kind in DELETED_ON_CASCADE.keys():
                if edge.kind in DELETED_ON_CASCADE[start_node_kind]:
                    cls.delete_all_cascade(start_node=edge.end_node)
            cls.delete(edge.key)
        start_node.delete()

    @classmethod
    def find(cls, start_node, end_node_set, kind, operation):
        """ search if there is edges wich start with start_node and ends with one of the end_node_set or has the whole end_node_set
            operation could be 'AND' to specify that we need all the end_node_set,'OR' to specify that we need at least one of the end_node_set
            return True or False
        """
        edge_list = cls.list(start_node, kind)
        end_node_found = list()
        for edge in edge_list['items']:
            end_node_found.append(edge.end_node)
        if operation == 'AND':
            return len(set(end_node_found).intersection(end_node_set)) == len(set(end_node_set))
        elif operation == 'OR':
            return len(set(end_node_found).intersection(end_node_set)) > 0

    @classmethod
    def filter_by_set(cls, start_node_set, kind, operation='AND'):
        end_node_sets = []
        for start_node in start_node_set:
            edge_list = cls.list(start_node, kind)
            end_nodes = []
            if operation == "AND":
                for edge in edge_list['items']:
                    end_nodes.append(edge.end_node)
                if len(end_node_sets) > 0:
                    end_node_sets = list(set(end_node_sets).intersection(set(end_nodes)))
                else:
                    end_node_sets = end_nodes
            else:
                for edge in edge_list['items']:
                    end_node_sets.append(edge.end_node)
            end_node_sets = list(set(end_node_sets))
        return end_node_sets


class Node(ndb.Expando):
    """Node Class to store all objects"""
    kind = ndb.StringProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)

    @classmethod
    def check_permission(cls, user, node):
        if node is not None:
            if node.access != 'public' and node.owner != user.google_user_id:
                end_node_set = [user.key]
                if not Edge.find(start_node=node.key, kind='permissions', end_node_set=end_node_set, operation='AND'):
                    return False
        return True

    @classmethod
    def list_permissions(cls, node):
        if node.access == 'public':
            users = User.query(User.organization == node.organization)
        else:
            owner = User.get_by_gid(node.owner)
            # list collaborators
            edge_list = Edge.list(
                start_node=node.key,
                kind='permissions'
            )
            users_list_of_keys = []
            for edge in edge_list['items']:
                users_list_of_keys.append(edge.end_node)
            users = ndb.get_multi(users_list_of_keys)
            users.append(owner)
        return users

    @classmethod
    def list_info_nodes(cls, parent_key, request):
        connections_list = []
        try:
            edge_list = Edge.list(
                start_node=parent_key,
                kind='infos'
            )
            connections_dict = {}
            for edge in edge_list['items']:

                node = edge.end_node.get()
                if node is not None:
                    if node.kind not in connections_dict.keys():
                        connections_dict[node.kind] = []
                    node_fields = []
                    property_type = 'StringProperty'
                    for key, value in node.to_dict().iteritems():
                        if key not in ['kind', 'created_at', 'updated_at']:
                            value = None
                            if isinstance(node.to_dict()[key], basestring):
                                value = node.to_dict()[key]
                            elif isinstance(node.to_dict()[key], list):
                                list_of_str = []
                                for item in node.to_dict()[key]:
                                    list_of_str.append(str(item))
                                value = str(list_of_str)
                            if 'property_type' in  node.to_dict():
                                property_type=node.to_dict()['property_type']
                            record = RecordSchema(
                                field=key,
                                value=value,
                                property_type=property_type
                            )
                            if key !='property_type':
                                node_fields.append(record)
                    info_node = InfoNodeResponse(
                        id=str(node.key.id()),
                        entityKey=node.key.urlsafe(),
                        kind=node.kind,
                        fields=node_fields
                    )
                    connections_dict[node.kind].append(info_node)
            for key, value in connections_dict.iteritems():
                infonodeconnection = InfoNodeConnectionSchema(
                    kind=key,
                    items=value
                )
                connections_list.append(infonodeconnection)
        except:
            print 'an error on list_info_nodes'
        return InfoNodeListResponse(
            items=connections_list
        )

    @classmethod
    def to_structured_data(cls, infodones):
        structured_data = {}
        try:
            for infonodecollection in infodones.items:
                structured_data[infonodecollection.kind] = []
                for infonode in infonodecollection.items:
                    structured_object = {}
                    for item in infonode.fields:
                        structured_object[item.field] = item.value
                    structured_data[infonodecollection.kind].append(structured_object)
            phones = None
            if 'phones' in structured_data.keys():
                phones = iomessages.PhoneListSchema()
                for phone in structured_data['phones']:
                    if not 'type' in phone.keys():
                        phone['type'] = 'work'
                    phone_schema = iomessages.PhoneSchema(
                        type=phone['type'],
                        number=phone['number']
                    )
                    phones.items.append(phone_schema)
                if phones.items:
                    structured_data['phones'] = phones
                else:
                    del structured_data['phones']
            emails = None
            if 'emails' in structured_data.keys():
                emails = iomessages.EmailListSchema()
                emails.items = []
                for email in structured_data['emails']:
                    email_schema = iomessages.EmailSchema(
                        email=email['email']
                    )
                    emails.items.append(email_schema)
                if len(emails.items) > 0:
                    structured_data['emails'] = emails
                else:
                    del structured_data['emails']
            addresses = None
            if 'addresses' in structured_data.keys():
                addresses = iomessages.AddressListSchema()
                ADDRESS_KEYS = ['street', 'city', 'state', 'postal_code', 'country', 'formatted']
                for address in structured_data['addresses']:
                    for key in ADDRESS_KEYS:
                        try:
                            print address[key]
                        except:
                            address[key] = ''
                    address_schema = iomessages.AddressSchema(
                        street=address['street'],
                        city=address['city'],
                        state=address['state'],
                        postal_code=address['postal_code'],
                        country=address['country'],
                        formatted=address['formatted']
                    )
                    addresses.items.append(address_schema)
                if addresses.items:
                    structured_data['addresses'] = addresses
                else:
                    del structured_data['addresses']
            # customfields=None
            # if 'customfields' in structured_data.keys():
            #     customfields=iomessages.customfieldsList()
            #     for customfield in structured_data['customfields']:

            #         customfield_shema=iomessages.customfieldsShema(name=customfield.keys()[0],
            #                                                        value=customfield[customfield.keys()[0]])
            #         customfields.items.append(customfield_shema)
            #     if customfields.items:
            #         structured_data['customfields']=customfields
            #     else:
            #         del structured_data['customfields']
            social_links = None
            if 'sociallinks' in structured_data.keys():
                social_links = iomessages.SocialLinkListSchema()
                for link in structured_data['sociallinks']:
                    if 'url' in link.keys():
                        social_link_schema = iomessages.SocialLinkSchema(
                            url=link['url']
                        )
                        social_links.items.append(social_link_schema)
                if social_links.items:
                    structured_data['sociallinks'] = social_links
                else:
                    del structured_data['sociallinks']

        except:
            print 'an error on extracting data'
        return structured_data

    # @classmethod
    # def to_structured_adress(cls,infonodes):

    @classmethod
    def insert_info_node(cls, parent_key, request):
        try:
            from endpoints_helper import EndpointsHelper
            node = Node(kind=request.kind)
            node_values = []
            for record in request.fields:
                if record.value:
                    if len(record.value) > 500:
                        prop = ndb.TextProperty(record.field, indexed=False)
                        prop._code_name = record.field
                        node._properties[record.field] = prop
                        prop._set_value(node, record.value)
                    else:
                        setattr(
                            node,
                            record.field.encode('ascii', 'ignore').decode('ascii'),
                            record.value.encode('ascii', 'ignore').decode('ascii')
                        )
                    node_values.append(record.value)
                if record.property_type:
                    setattr(
                            node,
                            'property_type',
                            record.property_type
                        )
            entityKey_async = node.put_async()
            entityKey = entityKey_async.get_result()
            Edge.insert(
                start_node=parent_key,
                end_node=entityKey,
                kind='infos',
                inverse_edge='parents'
            )
            indexed_edge = '_' + request.kind + ' ' + " ".join(node_values).encode('ascii', 'ignore').decode('ascii')
            EndpointsHelper.update_edge_indexes(
                parent_key=parent_key,
                kind='infos',
                indexed_edge=indexed_edge
            )
        except:
            print 'error in insert infonode'


class InfoNode(ndb.Expando):
    """InfoNode Class to store all informations about object"""
    kind = ndb.StringProperty()
    parent = ndb.KeyProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)

import model
from endpoints_proto_datastore.ndb import EndpointsModel
from google.appengine.api import search
from google.appengine.datastore.datastore_query import Cursor
from google.appengine.ext import ndb
from protorpc import messages

import iomessages
from endpoints_helper import EndpointsHelper
from iograph import Node, Edge
from opportunitystage import OpportunitystageSchema, Opportunitystage
from search_helper import tokenize_autocomplete, SEARCH_QUERY_MODEL


# class UpdateStatusRequest(messages.Message):
#     entityKey = messages.StringField(1,required=True)
#     status = messages.StringField(2,required=True)

# class AccountSchema(messages.Message):
#     id = messages.StringField(1)
#     entityKey = messages.StringField(2)
#     name = messages.StringField(3)

class PipelineListRequest(messages.Message):
    limit = messages.IntegerField(1)
    pageToken = messages.StringField(2)
    order = messages.StringField(3)


class PipelineGetRequest(messages.Message):
    id = messages.IntegerField(1, required=True)
    # topics = messages.MessageField(ListRequest, 2)
    # tasks = messages.MessageField(ListRequest, 3)
    # events = messages.MessageField(ListRequest, 4)
    # documents = messages.MessageField(ListRequest, 5)


class PipelineInsertRequest(messages.Message):
    name = messages.StringField(1)
    access = messages.StringField(2)
    description = messages.StringField(3)

# class CaseListRequest(messages.Message):
#     limit = messages.IntegerField(1)
#     pageToken = messages.StringField(2)
#     order = messages.StringField(3)
#     tags = messages.StringField(4,repeated = True)
#     owner = messages.StringField(5)
#     status = messages.StringField(6)
#     probability = messages.StringField(7)
#     priority = messages.IntegerField(8)

class PipelineSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    name = messages.StringField(3)
    created_at = messages.StringField(4)
    updated_at = messages.StringField(5)
    access = messages.StringField(6)
    description = messages.StringField(7)
    owner = messages.MessageField(iomessages.UserSchema, 8)
    stages = messages.MessageField(OpportunitystageSchema, 9, repeated=True)


class PipelinePatchRequest(messages.Message):
    id = messages.StringField(1)
    name = messages.StringField(2)
    access = messages.StringField(6)
    description = messages.StringField(7)
    owner = messages.StringField(10)


class PipelineListResponse(messages.Message):
    items = messages.MessageField(PipelineSchema, 1, repeated=True)
    nextPageToken = messages.StringField(2)


# The message class that defines the cases.search response
# class CaseSearchResult(messages.Message):
#     id = messages.StringField(1)
#     entityKey = messages.StringField(2)
#     title = messages.StringField(3)
#     contact_name = messages.StringField(4)
#     account_name = messages.StringField(5)
#     status = messages.StringField(6)


# The message class that defines a set of cases.search results
# class CaseSearchResults(messages.Message):
#     items = messages.MessageField(CaseSearchResult, 1, repeated=True)
#     nextPageToken = messages.StringField(2)

class Pipeline(EndpointsModel):
    _message_fields_schema = ('id', 'entityKey', 'owner', 'access', 'name', 'created_at', 'updated_at', 'description')
    # Sharing fields
    owner = ndb.StringProperty()
    organization = ndb.KeyProperty()
    name = ndb.StringProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    created_by = ndb.KeyProperty()
    description = ndb.StringProperty()
    # public or private
    access = ndb.StringProperty()

    def put(self, **kwargs):
        ndb.Model.put(self, **kwargs)
        self.put_index()
        self.set_perm()

    def set_perm(self):
        about_item = str(self.key.id())

        perm = model.Permission(about_kind='Pipeline',
                                about_item=about_item,
                                type='user',
                                role='owner',
                                value=self.owner)
        perm.put()

    def put_index(self, data=None):
        """ index the element at each"""
        empty_string = lambda x: x if x else ""
        # collaborators = " ".join(self.collaborators_ids)
        organization = str(self.organization.id())
        title_autocomplete = ','.join(tokenize_autocomplete(self.name))
        if data:
            search_key = ['infos', 'pipelines', 'tags', 'collaborators']
            for key in search_key:
                if key not in data.keys():
                    data[key] = ""
            my_document = search.Document(
                doc_id=str(data['id']),
                fields=[
                    search.TextField(name=u'type', value=u'Pipeline'),
                    search.TextField(name='organization', value=empty_string(organization)),
                    search.TextField(name='access', value=empty_string(self.access)),
                    search.TextField(name='owner', value=empty_string(self.owner)),
                    # search.TextField(name='collaborators', value = data['collaborators'] ),
                    search.TextField(name='title', value=empty_string(self.name)),
                    search.DateField(name='created_at', value=self.created_at),
                    search.DateField(name='updated_at', value=self.updated_at),
                    search.TextField(name='title_autocomplete', value=empty_string(title_autocomplete)),
                ])
        else:
            my_document = search.Document(
                doc_id=str(self.key.id()),
                fields=[
                    search.TextField(name=u'type', value=u'Pipeline'),
                    search.TextField(name='organization', value=empty_string(organization)),
                    search.TextField(name='access', value=empty_string(self.access)),
                    search.TextField(name='owner', value=empty_string(self.owner)),
                    # search.TextField(name='collaborators', value = collaborators ),
                    search.TextField(name='title', value=empty_string(self.name)),
                    search.DateField(name='created_at', value=self.created_at),
                    search.DateField(name='updated_at', value=self.updated_at),
                    search.TextField(name='title_autocomplete', value=empty_string(title_autocomplete)),
                ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)

    @classmethod
    def get_schema(cls, user_from_email, request):
        pipeline = cls.get_by_id(int(request.id))
        if pipeline is None:
            raise endpoints.NotFoundException('pipeline not found.')
        if Node.check_permission(user_from_email, pipeline):
            owner = model.User.get_by_gid(pipeline.owner)
            owner_schema = iomessages.UserSchema(
                id=str(owner.id),
                email=owner.email,
                google_display_name=owner.google_display_name,
                google_public_profile_photo_url=owner.google_public_profile_photo_url,
                google_public_profile_url=owner.google_public_profile_url,
                google_user_id=owner.google_user_id
            )
            tab = []
            opportunitystages = Opportunitystage.query(Opportunitystage.pipeline == pipeline.key).fetch()
            for os in opportunitystages:
                tab.append(
                    OpportunitystageSchema(
                        entityKey=os.entityKey,
                        name=os.name,
                        probability=os.probability,
                        amount_opportunity=os.amount_opportunity,
                        nbr_opportunity=os.nbr_opportunity,
                        # stage_changed_at = os.stage_changed_at,
                        stage_number=os.stage_number,
                        pipeline=pipeline.key.urlsafe(),
                    )
                )

            pipeline_schema = PipelineSchema(
                id=str(pipeline.key.id()),
                entityKey=pipeline.key.urlsafe(),
                name=pipeline.name,
                # infonodes   = infonodes,
                description=pipeline.description,
                created_at=pipeline.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                updated_at=pipeline.updated_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                owner=owner_schema,
                stages=tab

            )
            return pipeline_schema
        else:
            raise endpoints.NotFoundException('Permission denied')

    @classmethod
    def list(cls, user_from_email, request):
        curs = Cursor(urlsafe=request.pageToken)
        if request.limit:
            limit = int(request.limit)
        else:
            limit = 1000
        items = list()
        you_can_loop = True
        count = 0
        # while you_can_loop:
        if request.order:
            ascending = True
            if request.order.startswith('-'):
                order_by = request.order[1:]
                ascending = False
            else:
                order_by = request.order
            attr = cls._properties.get(order_by)
            if attr is None:
                raise AttributeError('Order attribute %s not defined.' % (attr_name,))
            if ascending:
                pipelines, next_curs, more = cls.query().filter(cls.organization == user_from_email.organization).order(
                    +attr).fetch_page(limit, start_cursor=curs)
            else:
                pipelines, next_curs, more = cls.query().filter(cls.organization == user_from_email.organization).order(
                    -attr).fetch_page(limit, start_cursor=curs)
        else:
            pipelines, next_curs, more = cls.query().filter(
                cls.organization == user_from_email.organization).fetch_page(limit, start_cursor=curs)
        for pipeline in pipelines:
            # is_filtered = True
            # if request.tags and is_filtered:
            #     end_node_set = [ndb.Key(urlsafe=tag_key) for tag_key in request.tags]
            #     if not Edge.find(start_node=case.key,kind='tags',end_node_set=end_node_set,operation='AND'):
            #         is_filtered = False
            # if request.owner and case.owner!=request.owner and is_filtered:
            #     is_filtered = False
            # if request.status and case.status!=request.status and is_filtered:
            #     is_filtered = False
            # if request.priority and case.priority!=request.priority and is_filtered:
            #     is_filtered = False
            # if is_filtered and Node.check_permission(user_from_email,case):
            #     count = count + 1
            # list of tags related to this case
            # tag_list = Tag.list_by_parent(parent_key = case.key)
            # case_status_edges = Edge.list(
            #                         start_node = case.key,
            #                         kind = 'status',
            #                         limit = 1
            #                         )
            # current_status_schema = None
            # if len(case_status_edges['items'])>0:
            #     current_status = case_status_edges['items'][0].end_node.get()
            #     current_status_schema = CaseStatusSchema(
            #                                             name = current_status.status,
            #                                             status_changed_at = case_status_edges['items'][0].created_at.isoformat()
            #                                            )

            owner = model.User.get_by_gid(pipeline.owner)
            owner_schema = iomessages.UserSchema(
                id=str(owner.id),
                email=owner.email,
                google_display_name=owner.google_display_name,
                google_public_profile_photo_url=owner.google_public_profile_photo_url,
                google_public_profile_url=owner.google_public_profile_url,
                google_user_id=owner.google_user_id
            )
            pipeline_schema = PipelineSchema(
                id=str(pipeline.key.id()),
                entityKey=pipeline.key.urlsafe(),
                name=pipeline.name,
                owner=owner_schema,
                created_at=pipeline.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                updated_at=pipeline.updated_at.strftime("%Y-%m-%dT%H:%M:00.000")
            )
            items.append(pipeline_schema)
        # if (count == limit):
        #         you_can_loop = False
        #     if more and next_curs:
        #         curs = next_curs
        #     else:
        #         you_can_loop = False
        if next_curs and more:
            next_curs_url_safe = next_curs.urlsafe()
        else:
            next_curs_url_safe = None
        return PipelineListResponse(items=items, nextPageToken=next_curs_url_safe)

    @classmethod
    def search(cls, user_from_email, request):
        organization = str(user_from_email.organization.id())
        index = search.Index(name="GlobalIndex")
        # Show only objects where you have permissions
        query_string = SEARCH_QUERY_MODEL % {
            "type": "Case",
            "query": request.q,
            "organization": organization,
            "owner": user_from_email.google_user_id,
            "collaborators": user_from_email.google_user_id,
        }
        search_results = []
        if request.limit:
            limit = int(request.limit)
        else:
            limit = 10
        next_cursor = None
        if request.pageToken:
            cursor = search.Cursor(web_safe_string=request.pageToken)
        else:
            cursor = search.Cursor(per_result=True)
        if limit:
            options = search.QueryOptions(limit=limit, cursor=cursor)
        else:
            options = search.QueryOptions(cursor=cursor)
        query = search.Query(query_string=query_string, options=options)
        try:
            if query:
                result = index.search(query)
                if len(result.results) == limit + 1:
                    next_cursor = result.results[-1].cursor.web_safe_string
                else:
                    next_cursor = None
                results = result.results[:limit]
                for scored_document in results:
                    kwargs = {
                        'id': scored_document.doc_id
                    }
                    for e in scored_document.fields:
                        if e.name in [
                            "title",
                            "contact_name",
                            "account_name",
                            "status"
                        ]:
                            kwargs[e.name] = e.value
                    search_results.append(CaseSearchResult(**kwargs))

        except search.Error:
            logging.exception('Search failed')
        return CaseSearchResults(
            items=search_results,
            nextPageToken=next_cursor
        )

    @classmethod
    def list_by_parent(cls, user_from_email, parent_key, request):
        pipeline_list = []
        you_can_loop = True
        count = 0
        limit = int(request.pipelines.limit)
        pipeline_next_curs = request.pipelines.pageToken
        while you_can_loop:
            edge_limit = int(request.pipelines.limit) - count
            if edge_limit > 0:
                pipeline_edge_list = Edge.list(
                    start_node=parent_key,
                    kind='pipelines',
                    limit=edge_limit,
                    pageToken=pipeline_next_curs
                )
                for edge in pipeline_edge_list['items']:
                    pipeline = edge.end_node.get()
                    if Node.check_permission(user_from_email, pipeline):
                        count += 1
                        tag_list = Tag.list_by_parent(parent_key=pipeline.key)
                        pipeline_status_edges = Edge.list(
                            start_node=pipeline.key,
                            kind='status',
                            limit=1
                        )
                        current_status_schema = None
                        if len(pipeline_status_edges['items']) > 0:
                            current_status = pipeline_status_edges['items'][0].end_node.get()
                            current_status_schema = CaseStatusSchema(
                                name=current_status.status,
                                status_changed_at=pipeline_status_edges['items'][0].created_at.isoformat()
                            )
                        owner = model.User.get_by_gid(pipeline.owner)
                        owner_schema = iomessages.UserSchema(
                            id=str(owner.id),
                            email=owner.email,
                            google_display_name=owner.google_display_name,
                            google_public_profile_photo_url=owner.google_public_profile_photo_url,
                            google_public_profile_url=owner.google_public_profile_url,
                            google_user_id=owner.google_user_id
                        )
                        pipeline_list.append(
                            CaseSchema(
                                id=str(pipeline.key.id()),
                                entityKey=pipeline.key.urlsafe(),
                                name=pipeline.name,
                                current_status=current_status_schema,
                                priority=pipeline.priority,
                                tags=tag_list,
                                owner=owner_schema,
                                access=pipeline.access,
                                created_at=pipeline.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                                updated_at=pipeline.updated_at.strftime("%Y-%m-%dT%H:%M:00.000")
                            )
                        )
                if pipeline_edge_list['next_curs'] and pipeline_edge_list['more']:
                    pipeline_next_curs = pipeline_edge_list['next_curs'].urlsafe()
                else:
                    you_can_loop = False
                    pipeline_next_curs = None

            if count == limit:
                you_can_loop = False

        return CaseListResponse(
            items=pipeline_list,
            nextPageToken=pipeline_next_curs
        )

    @classmethod
    def insert(cls, user_from_email, request):
        pipeline = cls(
            owner=user_from_email.google_user_id,
            organization=user_from_email.organization,
            access=request.access,
            name=request.name,
            description=request.description
        )
        pipeline_key = pipeline.put_async()
        pipeline_key_async = pipeline_key.get_result()
        data = {'id': pipeline_key_async.id()}
        pipeline.put_index(data)
        # current_status_schema = CaseStatusSchema(
        #                                 name = request.status_name
        #                                 )
        pipeline_schema = PipelineSchema(
            id=str(pipeline_key_async.id()),
            entityKey=pipeline_key_async.urlsafe(),
            name=pipeline.name,
            description=pipeline.description,
            created_at=pipeline.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
            updated_at=pipeline.updated_at.strftime("%Y-%m-%dT%H:%M:00.000")
        )
        return pipeline_schema

    @classmethod
    def patch(cls, user_from_email, request):
        pipeline = cls.get_by_id(int(request.id))
        if pipeline is None:
            raise endpoints.NotFoundException('Pipeline not found.')
            #  EndpointsHelper.share_related_documents_after_patch(
            #                                                     user_from_email,
            #                                                     case,
            #                                                     request
        #                                                  )
        properties = ['owner', 'name', 'access',
                      'description']
        for p in properties:
            if hasattr(request, p):
                if (eval('pipeline.' + p) != eval('request.' + p)) \
                        and (eval('request.' + p) and not (p in ['put', 'set_perm', 'put_index'])):
                    exec ('pipeline.' + p + '= request.' + p)
        pipeline_key_async = pipeline.put_async()
        data = EndpointsHelper.get_data_from_index(str(pipeline.key.id()))
        pipeline.put_index(data)
        get_schema_request = PipelineGetRequest(id=int(request.id))
        return cls.get_schema(user_from_email, get_schema_request)

    @classmethod
    def delete(cls, user_from_email, request):
        pipeline_key = ndb.Key(urlsafe=request.entityKey)
        opportunitystages = Opportunitystage.query(Opportunitystage.pipeline == pipeline_key).fetch()
        for os in opportunitystages:
            os.key.delete()
        pipeline_key.delete()

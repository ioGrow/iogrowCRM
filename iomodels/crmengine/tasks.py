from google.appengine.ext import ndb
import datetime
import endpoints
from google.appengine.datastore.datastore_query import Cursor
from google.appengine.api import search 
from apiclient.discovery import build
from google.appengine.api import memcache
import httplib2
from protorpc import messages
from endpoints_proto_datastore.ndb import EndpointsModel
from iomodels.crmengine.notes import Topic, AuthorSchema,DiscussionAboutSchema
from model import Userinfo
from iomodels.crmengine.tags import Tag,TagSchema
from iograph import Edge
from datetime import date
import model
from search_helper import tokenize_autocomplete,SEARCH_QUERY_MODEL
from endpoints_helper import EndpointsHelper

# The message class that defines the EntityKey schema
class EntityKeyRequest(messages.Message):
    entityKey = messages.StringField(1)

 # The message class that defines the ListRequest schema
class ListRequest(messages.Message):
    limit = messages.IntegerField(1)
    pageToken = messages.StringField(2)

class TaskSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    title = messages.StringField(3)
    due = messages.StringField(4)
    status = messages.StringField(5)
    status_color = messages.StringField(6)
    status_label = messages.StringField(7)
    comments = messages.IntegerField(8)
    about = messages.MessageField(DiscussionAboutSchema,9)
    created_by = messages.MessageField(AuthorSchema,10)
    completed_by = messages.MessageField(AuthorSchema,11)
    tags = messages.MessageField(TagSchema,12, repeated = True)
    assignees = messages.MessageField(AuthorSchema,13, repeated = True)
    created_at = messages.StringField(14)
    updated_at = messages.StringField(15)

class TaskInsertRequest(messages.Message):
    parent = messages.StringField(1)
    title = messages.StringField(2,required=True)
    due = messages.StringField(3)
    reminder = messages.StringField(4)
    status = messages.StringField(5)
    access = messages.StringField(6)
    assignees = messages.MessageField(EntityKeyRequest,7, repeated = True)
    tags = messages.MessageField(EntityKeyRequest,8, repeated = True)

class TaskRequest(messages.Message):
    limit = messages.IntegerField(1)
    pageToken = messages.StringField(2)
    order = messages.StringField(3)
    status = messages.StringField(4)
    tags = messages.StringField(5,repeated = True)
    owner = messages.StringField(6)
    assignee = messages.BooleanField(7)
    about = messages.StringField(8)
    urgent = messages.BooleanField(9)

class TaskListResponse(messages.Message):
    items = messages.MessageField(TaskSchema, 1, repeated=True)
    nextPageToken = messages.StringField(2)

class Task(EndpointsModel):
    _message_fields_schema = ('id','entityKey', 'owner','access', 'created_at','updated_at','title','due','status',  'completed_by','comments','about_kind','about_item','organization','involved_ids','involved_list','author')

    author = ndb.StructuredProperty(Userinfo)
    # Sharing fields
    owner = ndb.StringProperty()
    collaborators_list = ndb.StructuredProperty(model.Userinfo,repeated=True)
    collaborators_ids = ndb.StringProperty(repeated=True)
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    title = ndb.StringProperty()
    due = ndb.DateTimeProperty()
    status = ndb.StringProperty()
    completed_by = ndb.StructuredProperty(Userinfo)
    involved_list = ndb.StructuredProperty(model.Userinfo,repeated=True)
    involved_ids = ndb.StringProperty(repeated=True)
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
        self.put_index()
        self.set_perm()

    def set_perm(self):
        about_item = str(self.key.id())

        perm = model.Permission(about_kind='Task',
                         about_item=about_item,
                         type = 'user',
                         role = 'owner',
                         value = self.owner)
        perm.put()

    def put_index(self,data=None):
        """ index the element at each"""
        empty_string = lambda x: x if x else ""
        empty_date = lambda x: x if x else date(2999, 12, 31)
        collaborators = " ".join(self.collaborators_ids)
        title_autocomplete = ','.join(tokenize_autocomplete(self.title))
        organization = str(self.organization.id())
        if data:
            search_key = ['infos','tasks','tags','topics']
            for key in search_key:
                if key not in data.keys():
                    data[key] = ""
            my_document = search.Document(
            doc_id = str(data['id']),
            fields=[
                search.TextField(name=u'type', value=u'Task'),
                search.TextField(name='organization', value = empty_string(organization) ),
                search.TextField(name='access', value = empty_string(self.access) ),
                search.TextField(name='owner', value = empty_string(self.owner) ),
                search.TextField(name='collaborators', value = collaborators ),
                search.TextField(name='title', value = empty_string(self.title) ),
                search.TextField(name='status', value = empty_string(self.status)),
                search.DateField(name='due', value = empty_date(self.due)),
                search.TextField(name='about_kind', value = empty_string(self.about_kind)),
                search.TextField(name='about_item', value = empty_string(self.about_item)),
                search.TextField(name='infos', value= data['infos']),
                search.TextField(name='tags', value= data['tags']),
                search.TextField(name='tasks', value= data['tasks']),
                search.TextField(name='topics', value= data['topics']),
                search.TextField(name='title_autocomplete', value = empty_string(title_autocomplete)),
               ])
        else:
            my_document = search.Document(
            doc_id = str(self.key.id()),
            fields=[
                search.TextField(name=u'type', value=u'Task'),
                search.TextField(name='organization', value = empty_string(organization) ),
                search.TextField(name='access', value = empty_string(self.access) ),
                search.TextField(name='owner', value = empty_string(self.owner) ),
                search.TextField(name='collaborators', value = collaborators ),
                search.TextField(name='title', value = empty_string(self.title) ),
                search.TextField(name='status', value = empty_string(self.status)),
                search.DateField(name='due', value = empty_date(self.due)),
                search.TextField(name='about_kind', value = empty_string(self.about_kind)),
                search.TextField(name='about_item', value = empty_string(self.about_item)),
                search.TextField(name='title_autocomplete', value = empty_string(title_autocomplete)),
               ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)
    
    
    @classmethod
    def list(cls,user_from_email,request):
        curs = Cursor(urlsafe=request.pageToken)
        filtered_tasks = list()
        if request.limit:
            limit = int(request.limit)
        else:
            limit = 10
        items = list()
        date_to_string = lambda x: x.strftime("%Y-%m-%d") if x else ""
        date_time_to_string = lambda x: x.strftime("%Y-%m-%dT%H:%M:00.000") if x else ""
        filtered_tasks = list()
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
                    tasks, next_curs, more = cls.query().filter(cls.organization==user_from_email.organization).order(+attr).fetch_page(limit, start_cursor=curs)
                else:
                    tasks, next_curs, more = cls.query().filter(cls.organization==user_from_email.organization).order(-attr).fetch_page(limit, start_cursor=curs)
            else:
                tasks, next_curs, more = cls.query().filter(cls.organization==user_from_email.organization).fetch_page(limit, start_cursor=curs)
            for task in tasks:
                if count<= limit:
                    is_filtered = True
                    if task.access == 'private' and task.owner!=user_from_email.google_user_id:
                        end_node_set = [user_from_email.key]
                        if not Edge.find(start_node=task.key,kind='permissions',end_node_set=end_node_set,operation='AND'):
                            is_filtered = False
                    if request.status and task.status!=request.status and is_filtered:
                        is_filtered = False
                    if request.tags and is_filtered:
                        end_node_set = [ndb.Key(urlsafe=tag_key) for tag_key in request.tags]
                        if not Edge.find(start_node=task.key,kind='tags',end_node_set=end_node_set,operation='AND'):
                            is_filtered = False
                    if request.assignee and is_filtered:
                        end_node_set = [user_from_email.key]
                        if not Edge.find(start_node=task.key,kind='assignees',end_node_set=end_node_set,operation='AND'):
                            is_filtered = False
                    if request.owner and task.owner!=request.owner and is_filtered:
                        is_filtered = False
                    if request.about and is_filtered:
                        end_node_set = [ndb.Key(urlsafe=request.about)]
                        if not Edge.find(start_node=task.key,kind='related_to',end_node_set=end_node_set,operation='AND'):
                            is_filtered = False
                    if request.urgent and is_filtered:
                        if task.due is None:
                            is_filtered = False
                        else:
                            now = datetime.datetime.now()
                            diff = task.due - now
                            if diff.days>2:
                                is_filtered = False
                        if task.status=='closed':
                            is_filtered = False

                    if is_filtered:
                        count = count + 1
                        #list of tags related to this task
                        tag_list = Tag.list_by_parent(parent_key = task.key)
                        about = None
                        edge_list = Edge.list(start_node=task.key,kind='related_to')
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
                        #list of tags related to this task
                        edge_list = Edge.list(start_node=task.key,kind='assignees')
                        assignee_list = list()
                        for edge in edge_list['items']:
                            assignee_list.append( AuthorSchema(edgeKey = edge.key.urlsafe(),
                                          google_user_id = edge.end_node.get().google_user_id,
                                          display_name = edge.end_node.get().google_display_name,
                                          google_public_profile_url = edge.end_node.get().google_public_profile_url,
                                          photo = edge.end_node.get().google_public_profile_photo_url) )

                        status_color = 'green'
                        status_label = ''
                        if task.due:
                            now = datetime.datetime.now()
                            diff = task.due - now
                            if diff.days>=0 and diff.days<=2:
                                status_color = 'orange'
                                status_label = 'soon: due in '+ str(diff.days) + ' days'
                            elif diff.days<0:
                                status_color = 'red'
                                status_label = 'overdue'
                            else:
                                status_label = 'due in '+ str(diff.days) + ' days'
                        if task.status == 'closed':
                            status_color = 'white'
                            status_label = 'closed'
                        author_schema = None
                        if task.author:
                            author_schema = AuthorSchema(google_user_id = task.author.google_user_id,
                                                          display_name = task.author.display_name,
                                                          google_public_profile_url = task.author.google_public_profile_url,
                                                          photo = task.author.photo)
                        task_schema = TaskSchema(
                                  id = str( task.key.id() ),
                                  entityKey = task.key.urlsafe(),
                                  title = task.title,
                                  status = task.status,
                                  status_color = status_color,
                                  status_label = status_label,
                                  comments = 0,
                                  about = about,
                                  created_by = author_schema,
                                  completed_by = AuthorSchema(),
                                  tags = tag_list,
                                  assignees = assignee_list,
                                  created_at = date_time_to_string(task.created_at),
                                  updated_at = date_time_to_string(task.updated_at)
                                )
                        if task.due:
                            task_schema.due =  date_to_string(task.due)
                        items.append(task_schema)
            if (count == limit):
                you_can_loop = False
            if more and next_curs:
                curs = next_curs
            else:
              you_can_loop = False
        if next_curs and more:
            next_curs_url_safe = next_curs.urlsafe()
        else:
            next_curs_url_safe = None
        return  TaskListResponse(items = items, nextPageToken = next_curs_url_safe)

    @classmethod
    def list_by_parent(cls,parent_key,request):
        date_time_to_string = lambda x: x.strftime("%Y-%m-%dT%H:%M:00.000") if x else ""
        task_list = []
        task_edge_list = Edge.list(
                                start_node = parent_key,
                                kind = 'tasks',
                                limit=request.tasks.limit,
                                pageToken=request.tasks.pageToken
                                )
        for edge in task_edge_list['items']:
            task = edge.end_node.get()
            status_color = 'green'
            status_label = ''
            if task.due:
                now = datetime.datetime.now()
                diff = task.due - now
                if diff.days>=0 and diff.days<=2:
                    status_color = 'orange'
                    status_label = 'soon: due in '+ str(diff.days) + ' days'
                elif diff.days<0:
                    status_color = 'red'
                    status_label = 'overdue'
                else:
                    status_label = 'due in '+ str(diff.days) + ' days'
            if task.status == 'closed':
                status_color = 'white'
                status_label = 'closed'
            author_schema = None
            if task.author:
                author_schema = AuthorSchema(
                                            google_user_id = task.author.google_user_id,
                                            display_name = task.author.display_name,
                                            google_public_profile_url = task.author.google_public_profile_url,
                                            photo = task.author.photo
                                            )
            task_schema = TaskSchema(
                                  id = str( task.key.id() ),
                                  entityKey = task.key.urlsafe(),
                                  title = task.title,
                                  status = task.status,
                                  status_color = status_color,
                                  status_label = status_label,
                                  created_by = author_schema,
                                  completed_by = AuthorSchema(),
                                  created_at = date_time_to_string(task.created_at),
                                  updated_at = date_time_to_string(task.updated_at)
                                )
            if task.due:
                task_schema.due =  date_time_to_string(task.due)
            task_list.append(task_schema)
        if task_edge_list['next_curs'] and task_edge_list['more']:
            task_next_curs = task_edge_list['next_curs'].urlsafe()
        else:
            task_next_curs = None
        return TaskListResponse(
                                items = task_list,
                                nextPageToken = task_next_curs
                                )
    @classmethod
    def insert(cls,user_from_email,request):
        if request.status:
            status = request.status
        else:
            status = 'pending'
        if request.access:
            access = request.access
        else:
            access = 'public'
        author = Userinfo()
        author.google_user_id = user_from_email.google_user_id
        author.display_name = user_from_email.google_display_name
        author.photo = user_from_email.google_public_profile_photo_url
        task = Task(title = request.title,
                    status = request.status,
                    owner = user_from_email.google_user_id,
                    organization = user_from_email.organization,
                    author = author)
        if request.due:
            task.due = datetime.datetime.strptime(request.due,"%Y-%m-%dT%H:%M:00.000000")
            print '@@@@ yes i know #@@@@'
            try:
                credentials = user_from_email.google_credentials
                http = credentials.authorize(httplib2.Http(memcache))
                service = build('calendar', 'v3', http=http)
                # prepare params to insert
                params = {
                 "start":
                  {
                    "dateTime": task.due.strftime("%Y-%m-%dT%H:%M:00.000+01:00")
                  },
                 "end":
                  {
                    "dateTime": task.due.strftime("%Y-%m-%dT%H:%M:00.000+01:00")
                  },
                  "summary": str(request.title)
                }
                print '***************Something here yes*********************'
                created_event = service.events().insert(calendarId='primary',body=params).execute()
                print '***************Something here no*********************'
            except:
                raise endpoints.UnauthorizedException('Invalid grant' )
                return

        if request.reminder:
            pass

        task_key = task.put_async()
        task_key_async = task_key.get_result()
        if request.parent:
            # insert edges
            parent_key = ndb.Key(urlsafe=request.parent)
            Edge.insert(start_node = parent_key,
                      end_node = task_key_async,
                      kind = 'tasks',
                      inverse_edge = 'related_to')
            EndpointsHelper.update_edge_indexes(
                                            parent_key = task_key_async,
                                            kind = 'tasks',
                                            indexed_edge = str(parent_key.id())
                                            )
        else:
            data = {}
            data['id'] = task_key_async.id()
            task.put_index(data)
        if request.assignees:
            # insert edges
            for assignee in request.assignees:
                Edge.insert(start_node = task_key_async,
                      end_node = ndb.Key(urlsafe=assignee.entityKey),
                      kind = 'assignees',
                      inverse_edge = 'assigned_to')
        if request.tags:
            # insert edges
            for tag in request.tags:
                Edge.insert(start_node = task_key_async,
                      end_node = ndb.Key(urlsafe=tag.entityKey),
                      kind = 'tags',
                      inverse_edge = 'tagged_on')
        return TaskSchema()
  

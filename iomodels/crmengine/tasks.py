import datetime
from datetime import date

import endpoints
import model
from endpoints_proto_datastore.ndb import EndpointsModel
from google.appengine.api import search
from google.appengine.api import taskqueue
from google.appengine.datastore.datastore_query import Cursor
from google.appengine.ext import ndb
from model import Userinfo
from protorpc import messages

from endpoints_helper import EndpointsHelper
from iograph import Edge
from iomodels.crmengine.notes import AuthorSchema, DiscussionAboutSchema
from iomodels.crmengine.payment import payment_required
from iomodels.crmengine.tags import Tag, TagSchema
from search_helper import tokenize_autocomplete


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
    about = messages.MessageField(DiscussionAboutSchema, 9)
    created_by = messages.MessageField(AuthorSchema, 10)
    completed_by = messages.MessageField(AuthorSchema, 11)
    tags = messages.MessageField(TagSchema, 12, repeated=True)
    assignees = messages.MessageField(AuthorSchema, 13, repeated=True)
    created_at = messages.StringField(14)
    updated_at = messages.StringField(15)
    access = messages.StringField(16)


class TaskInsertRequest(messages.Message):
    parent = messages.StringField(1)
    title = messages.StringField(2, required=True)
    due = messages.StringField(3)
    reminder = messages.StringField(4)
    status = messages.StringField(5)
    access = messages.StringField(6)
    assignees = messages.MessageField(EntityKeyRequest, 7, repeated=True)
    tags = messages.MessageField(EntityKeyRequest, 8, repeated=True)


class TaskRequest(messages.Message):
    limit = messages.IntegerField(1)
    pageToken = messages.StringField(2)
    order = messages.StringField(3)
    status = messages.StringField(4)
    tags = messages.StringField(5, repeated=True)
    owner = messages.StringField(6)
    assignee = messages.StringField(7)
    about = messages.StringField(8)
    urgent = messages.BooleanField(9)
    completed_by = messages.StringField(10)


class TaskListResponse(messages.Message):
    items = messages.MessageField(TaskSchema, 1, repeated=True)
    nextPageToken = messages.StringField(2)


class AssignedGoogleId(ndb.Model):
    task_google_id = ndb.StringProperty()
    user_key = ndb.KeyProperty()


class Task(EndpointsModel):
    _message_fields_schema = (
    'id', 'entityKey', 'owner', 'access', 'created_at', 'updated_at', 'title', 'due', 'status', 'completed_by',
    'comments', 'about_kind', 'about_item', 'organization', 'involved_ids', 'involved_list', 'author')

    author = ndb.StructuredProperty(Userinfo)
    # Sharing fields
    owner = ndb.StringProperty()
    collaborators_list = ndb.StructuredProperty(model.Userinfo, repeated=True)
    collaborators_ids = ndb.StringProperty(repeated=True)
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    title = ndb.StringProperty()
    due = ndb.DateTimeProperty()
    status = ndb.StringProperty()
    completed_by = ndb.StringProperty()
    involved_list = ndb.StructuredProperty(model.Userinfo, repeated=True)
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
    # to syncronize tasks with google calendar.
    task_google_id = ndb.StringProperty()
    # to syncronize task with google calendar of the assigned.
    task_assigned_google_id_list = ndb.StructuredProperty(AssignedGoogleId, repeated=True)

    def put(self, **kwargs):
        ndb.Model.put(self, **kwargs)
        try:
            self.put_index()
        except:
            print 'error on saving document index'

    def set_perm(self):
        about_item = str(self.key.id())

        perm = model.Permission(about_kind='Task',
                                about_item=about_item,
                                type='user',
                                role='owner',
                                value=self.owner)
        perm.put()

    def put_index(self, data=None):
        """ index the element at each"""
        empty_string = lambda x: x if x else ""
        empty_date = lambda x: x if x else date(2999, 12, 31)
        collaborators = " ".join(self.collaborators_ids)
        title_autocomplete = ','.join(tokenize_autocomplete(self.title))
        organization = str(self.organization.id())
        if data:
            search_key = ['infos', 'tasks', 'tags', 'topics']
            for key in search_key:
                if key not in data.keys():
                    data[key] = ""
            my_document = search.Document(
                doc_id=str(data['id']),
                fields=[
                    search.TextField(name=u'type', value=u'Task'),
                    search.TextField(name='organization', value=empty_string(organization)),
                    search.TextField(name='access', value=empty_string(self.access)),
                    search.TextField(name='owner', value=empty_string(self.owner)),
                    search.TextField(name='collaborators', value=collaborators),
                    search.TextField(name='title', value=empty_string(self.title)),
                    search.TextField(name='status', value=empty_string(self.status)),
                    search.DateField(name='due', value=empty_date(self.due)),
                    search.TextField(name='about_kind', value=empty_string(self.about_kind)),
                    search.TextField(name='about_item', value=empty_string(self.about_item)),
                    search.TextField(name='infos', value=data['infos']),
                    search.TextField(name='tags', value=data['tags']),
                    search.TextField(name='tasks', value=data['tasks']),
                    search.TextField(name='topics', value=data['topics']),
                    search.TextField(name='title_autocomplete', value=empty_string(title_autocomplete)),
                ])
        else:
            my_document = search.Document(
                doc_id=str(self.key.id()),
                fields=[
                    search.TextField(name=u'type', value=u'Task'),
                    search.TextField(name='organization', value=empty_string(organization)),
                    search.TextField(name='access', value=empty_string(self.access)),
                    search.TextField(name='owner', value=empty_string(self.owner)),
                    search.TextField(name='collaborators', value=collaborators),
                    search.TextField(name='title', value=empty_string(self.title)),
                    search.TextField(name='status', value=empty_string(self.status)),
                    search.DateField(name='due', value=empty_date(self.due)),
                    search.TextField(name='about_kind', value=empty_string(self.about_kind)),
                    search.TextField(name='about_item', value=empty_string(self.about_item)),
                    search.TextField(name='title_autocomplete', value=empty_string(title_autocomplete)),
                ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)

    # get event by id  hadji hicham 09-08-2014
    @classmethod
    def getTaskById(cls, id):
        return cls.get_by_id(int(id))

    # under the test
    @classmethod
    def get_schema(cls, user_from_email, request):
        task = cls.get_by_id(int(request.id))
        if task is None:
            raise endpoints.NotFoundException('Task not found.')
        tag_list = Tag.list_by_parent(parent_key=task.key)
        about = None
        edge_list = Edge.list(start_node=task.key, kind='related_to')
        for edge in edge_list['items']:
            about_kind = edge.end_node.kind()
            parent = edge.end_node.get()
            if parent:
                if about_kind == 'Contact' or about_kind == 'Lead':
                    if parent.lastname and parent.firstname :
                        about_name = parent.firstname + ' ' + parent.lastname
                    else:
                     if parent.lastname:
                        about_name = parent.lastname
                     else :
                        if parent.firstname:
                            about_name = parent.firstname  
                else:
                    about_name = parent.name
                about = DiscussionAboutSchema(
                    kind=about_kind,
                    id=str(parent.key.id()),
                    name=about_name
                )
        # list of tags related to this task
        edge_list = Edge.list(start_node=task.key, kind='assignees')
        assignee_list = list()
        for edge in edge_list['items']:
            assignee_list.append(AuthorSchema(edgeKey=edge.key.urlsafe(),
                                              google_user_id=edge.end_node.get().google_user_id,
                                              display_name=edge.end_node.get().google_display_name,
                                              google_public_profile_url=edge.end_node.get().google_public_profile_url,
                                              photo=edge.end_node.get().google_public_profile_photo_url
                                              ))

        status_color = 'green'
        status_label = ''
        if task.due:
            now = datetime.datetime.now()
            diff = task.due - now
            if diff.days >= 0 and diff.days <= 2:
                status_color = 'orange'
                status_label = 'soon: due in ' + str(diff.days) + ' days'
            elif diff.days < 0:
                status_color = 'red'
                status_label = 'overdue'
            else:
                status_label = 'due in ' + str(diff.days) + ' days'
        if task.status == 'closed':
            status_color = 'white'
            status_label = 'closed'
        author_schema = None
        if task.author:
            author_schema = AuthorSchema(
                google_user_id=task.author.google_user_id,
                display_name=task.author.display_name,
                google_public_profile_url=task.author.google_public_profile_url,
                photo=task.author.photo)
        due_date = None
        if task.due:
            due_date = task.due.strftime('%Y-%m-%d')
        task_schema = TaskSchema(
            id=str(task.key.id()),
            entityKey=task.key.urlsafe(),
            title=task.title,
            status=task.status,
            status_color=status_color,
            status_label=status_label,
            due=due_date,
            comments=0,
            about=about,
            created_by=author_schema,
            completed_by=AuthorSchema(),
            tags=tag_list,
            assignees=assignee_list,
            access=task.access,
            created_at=task.created_at.isoformat(),
            updated_at=task.updated_at.isoformat()
        )

        return task_schema

    @classmethod
    def list(cls, user_from_email, request):
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
                    tasks, next_curs, more = cls.query().filter(cls.organization == user_from_email.organization).order(
                        +attr).fetch_page(limit, start_cursor=curs)
                else:
                    tasks, next_curs, more = cls.query().filter(cls.organization == user_from_email.organization).order(
                        -attr).fetch_page(limit, start_cursor=curs)
            else:
                tasks, next_curs, more = cls.query().filter(
                    cls.organization == user_from_email.organization).fetch_page(limit, start_cursor=curs)
            for task in tasks:
                if len(items) < limit:
                    is_filtered = True
                    if task.access == 'private' and task.owner != user_from_email.google_user_id:
                        end_node_set = [user_from_email.key]
                        if not Edge.find(start_node=task.key, kind='permissions', end_node_set=end_node_set,
                                         operation='AND'):
                            is_filtered = False
                    if request.status and task.status != request.status and is_filtered:
                        is_filtered = False
                    if request.tags and is_filtered:
                        end_node_set = [ndb.Key(urlsafe=tag_key) for tag_key in request.tags]
                        if not Edge.find(start_node=task.key, kind='tags', end_node_set=end_node_set, operation='AND'):
                            is_filtered = False
                    if request.assignee and is_filtered:
                        user_assigned = model.User.get_by_gid(request.assignee)
                        end_node_set = [user_assigned.key]
                        if not Edge.find(start_node=task.key, kind='assignees', end_node_set=end_node_set,
                                         operation='AND'):
                            is_filtered = False
                    if request.owner and task.owner != request.owner and is_filtered:
                        is_filtered = False
                    if request.completed_by and task.completed_by != request.completed_by and is_filtered:
                        is_filtered = False
                    if request.about and is_filtered:
                        end_node_set = [ndb.Key(urlsafe=request.about)]
                        if not Edge.find(start_node=task.key, kind='related_to', end_node_set=end_node_set,
                                         operation='AND'):
                            is_filtered = False
                    if request.urgent and is_filtered:
                        if task.due is None:
                            is_filtered = False
                        else:
                            now = datetime.datetime.now()
                            diff = task.due - now
                            if diff.days > 2:
                                is_filtered = False
                        if task.status == 'closed':
                            is_filtered = False

                    if is_filtered:
                        count += 1
                        # list of tags related to this task
                        tag_list = Tag.list_by_parent(parent_key=task.key)
                        about = None
                        edge_list = Edge.list(start_node=task.key, kind='related_to')
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
                        # list of tags related to this task
                        edge_list = Edge.list(start_node=task.key, kind='assignees')
                        assignee_list = list()
                        for edge in edge_list['items']:
                            if edge.end_node.get():
                                assignee_list.append(AuthorSchema(edgeKey=edge.key.urlsafe(),
                                                                  google_user_id=edge.end_node.get().google_user_id,
                                                                  # display_name = edge.end_node.get().google_display_name,
                                                                  google_public_profile_url=edge.end_node.get().google_public_profile_url,
                                                                  photo=edge.end_node.get().google_public_profile_photo_url))

                        status_color = 'green'
                        status_label = ''
                        if task.due:
                            now = datetime.datetime.now()
                            diff = task.due - now
                            if 0 <= diff.days <= 2:
                                status_color = 'orange'
                                status_label = 'soon: due in ' + str(diff.days) + ' days'
                            elif diff.days < 0:
                                status_color = 'red'
                                status_label = 'overdue'
                            else:
                                status_label = 'due in ' + str(diff.days) + ' days'
                        if task.status == 'closed':
                            status_color = 'white'
                            status_label = 'closed'
                        author_schema = None
                        if task.author:
                            author_schema = AuthorSchema(google_user_id=task.author.google_user_id,
                                                         display_name=task.author.display_name,
                                                         google_public_profile_url=task.author.google_public_profile_url,
                                                         photo=task.author.photo)
                        task_schema = TaskSchema(
                            id=str(task.key.id()),
                            entityKey=task.key.urlsafe(),
                            title=task.title,
                            status=task.status,
                            status_color=status_color,
                            status_label=status_label,
                            comments=0,
                            about=about,
                            created_by=author_schema,
                            completed_by=AuthorSchema(),
                            tags=tag_list,
                            assignees=assignee_list,
                            created_at=date_time_to_string(task.created_at),
                            updated_at=date_time_to_string(task.updated_at)
                        )
                        if task.due:
                            task_schema.due = date_to_string(task.due)
                        items.append(task_schema)
            if len(items) >= limit:
                you_can_loop = False
            if next_curs:
                if count >= limit:
                    next_curs_url_safe = next_curs.urlsafe()
                else:
                    next_curs_url_safe = curs.urlsafe()
            if next_curs:
                curs = next_curs
            else:
                you_can_loop = False
                next_curs_url_safe = None
        return TaskListResponse(items=items, nextPageToken=next_curs_url_safe)

    @classmethod
    def list_by_parent(cls, parent_key, request):
        date_time_to_string = lambda x: x.strftime("%Y-%m-%dT%H:%M:00.000") if x else ""
        task_list = []
        task_edge_list = Edge.list(
            start_node=parent_key,
            kind='tasks',
            limit=request.tasks.limit,
            pageToken=request.tasks.pageToken
        )
        for edge in task_edge_list['items']:
            task = edge.end_node.get()
            if task is not None:
                status_color = 'green'
                status_label = ''
                if task.due:
                    now = datetime.datetime.now()
                    diff = task.due - now
                    if 0 <= diff.days <= 2:
                        status_color = 'orange'
                        status_label = 'soon: due in ' + str(diff.days) + ' days'
                    elif diff.days < 0:
                        status_color = 'red'
                        status_label = 'overdue'
                    else:
                        status_label = 'due in ' + str(diff.days) + ' days'
                if task.status == 'closed':
                    status_color = 'white'
                    status_label = 'closed'
                author_schema = None
                if task.author:
                    author_schema = AuthorSchema(
                        google_user_id=task.author.google_user_id,
                        display_name=task.author.display_name,
                        google_public_profile_url=task.author.google_public_profile_url,
                        photo=task.author.photo
                    )
                task_schema = TaskSchema(
                    id=str(task.key.id()),
                    entityKey=task.key.urlsafe(),
                    title=task.title,
                    status=task.status,
                    status_color=status_color,
                    status_label=status_label,
                    created_by=author_schema,
                    completed_by=AuthorSchema(),
                    created_at=date_time_to_string(task.created_at),
                    updated_at=date_time_to_string(task.updated_at)
                )
                if task.due:
                    task_schema.due = date_time_to_string(task.due)
                task_list.append(task_schema)
        if task_edge_list['next_curs'] and task_edge_list['more']:
            task_next_curs = task_edge_list['next_curs'].urlsafe()
        else:
            task_next_curs = None
        return TaskListResponse(
            items=task_list,
            nextPageToken=task_next_curs
        )

    @classmethod
    @payment_required()
    def insert(cls, user_from_email, request):
        if request.status:
            status = request.status
        else:
            status = 'open'
        if request.access:
            access = request.access
        else:
            access = 'public'
        author = Userinfo()
        author.google_user_id = user_from_email.google_user_id
        author.display_name = user_from_email.google_display_name
        author.photo = user_from_email.google_public_profile_photo_url
        task = Task(title=request.title,
                    status=status,
                    owner=user_from_email.google_user_id,
                    organization=user_from_email.organization,
                    access=access,
                    author=author)
        if request.due:
            task.due = datetime.datetime.strptime(
                request.due,
                "%Y-%m-%dT%H:%M:00.000000"
            )
        task_key = task.put_async()
        if request.due:
            taskqueue.add(
                url='/workers/synctask',
                queue_name='iogrow-low-task',
                params={
                    'email': user_from_email.email,
                    'starts_at': request.due,
                    'ends_at': request.due,
                    'summary': request.title,
                    'task_id': task_key.get_result().id()
                }
            )

        if request.reminder:
            pass
        task_key_async = task_key.get_result()
        if request.parent:
            # insert edges
            parent_key = ndb.Key(urlsafe=request.parent)
            Edge.insert(start_node=parent_key,
                        end_node=task_key_async,
                        kind='tasks',
                        inverse_edge='related_to')
            EndpointsHelper.update_edge_indexes(
                parent_key=task_key_async,
                kind='tasks',
                indexed_edge=str(parent_key.id())
            )
        else:
            data = {'id': task_key_async.id()}
            task.put_index(data)
        if request.assignees:
            # insert edges
            for assignee in request.assignees:
                assignee_key = ndb.Key(urlsafe=assignee.entityKey)
                assignee_user = assignee_key.get()
                assignee_email = assignee_user.email
                # add a task queue to send notification email to assignee
                body = '<p>view details on ioGrow: <a href="http://app.iogrow.com/#/tasks/show/' + str(
                    task_key_async.id()) + '">'
                body += request.title
                body += '</a></p>'
                taskqueue.add(
                    url='/workers/send_email_notification',
                    queue_name='iogrow-low',
                    params={
                        'user_email': user_from_email.email,
                        'to': assignee_email,
                        'subject': '[task]: ' + request.title,
                        'body': body
                    }
                )
                Edge.insert(start_node=task_key_async,
                            end_node=assignee_key,
                            kind='assignees',
                            inverse_edge='assigned_to')
        if request.tags:
            # insert edges
            for tag in request.tags:
                Edge.insert(start_node=task_key_async,
                            end_node=ndb.Key(urlsafe=tag.entityKey),
                            kind='tags',
                            inverse_edge='tagged_on')
        task_schema = TaskSchema(
            id=str(task_key_async.id()),
            entityKey=task_key_async.urlsafe(),
            title=task.title,
            status=task.status,
            access=task.access
        )
        if task.due:
            task_schema.due = task.due.isoformat()
        return task_schema

    @classmethod
    def patch(cls, user_from_email, request):
        task = cls.get_by_id(int(request.id))
        task_id = int(request.id)
        edges = Edge.query().filter(Edge.kind == "assignees", Edge.start_node == task.key)
        if task is None:
            raise endpoints.NotFoundException('Task not found.')
        if (task.owner != user_from_email.google_user_id) and not user_from_email.is_admin:
            raise endpoints.ForbiddenException('you are not the owner')
        if request.title:
            task.title = request.title
        if request.access:
            task.access = request.access
        if request.status:
            task.status = request.status
            if task.status == 'closed':
                task.completed_by = user_from_email.google_user_id
                body = '<p>#closed, view details on ioGrow: <a href="http://app.iogrow.com/#/tasks/show/' + str(
                    task.key.id()) + '">'
                body += task.title
                body += '</a></p>'
                created_by = model.User.get_by_gid(task.owner)
                to = None
                if created_by:
                    to = created_by.email
                    edge_list = Edge.list(start_node=task.key, kind='assignees')
                    assignee_list = list()
                cc = None
                for edge in edge_list['items']:
                    assignee_list.append(edge.end_node.get().email)
                cc = ",".join(assignee_list)

                taskqueue.add(
                    url='/workers/send_email_notification',
                    queue_name='iogrow-low',
                    params={
                        'user_email': user_from_email.email,
                        'to': to,
                        'cc': cc,
                        'subject': '[task]: ' + task.title,
                        'body': body
                    }
                )

        if request.due and task.due == None:
            task.due = datetime.datetime.strptime(request.due, "%Y-%m-%dT%H:%M:00.000000")
            if edges:
                for edge in edges:
                    assigned_to = edge.end_node.get()
                    taskqueue.add(
                        url='/workers/syncassignedtask',
                        queue_name='iogrow-low-task',
                        params={
                            'email': assigned_to.email,
                            'task_key': task_id,
                            'assigned_to': edge.end_node.get()
                        }
                    )
                taskqueue.add(
                    url='/workers/synctask',
                    queue_name='iogrow-low-task',
                    params={
                        'email': user_from_email.email,
                        'starts_at': request.due,
                        'ends_at': request.due,
                        'summary': task.title,
                        'task_id': task_id
                    }
                )
            else:
                taskqueue.add(
                    url='/workers/synctask',
                    queue_name='iogrow-low-task',
                    params={
                        'email': user_from_email.email,
                        'starts_at': request.due,
                        'ends_at': request.due,
                        'summary': task.title,
                        'task_id': task_id
                    }
                )

        elif request.due and task.due != None:
            task.due = datetime.datetime.strptime(request.due, "%Y-%m-%dT%H:%M:00.000000")
            if edges:
                for edge in edges:
                    assigned_to = edge.end_node.get()
                    taskqueue.add(
                        url='/workers/syncassignedpatchtask',
                        queue_name='iogrow-low-task',
                        params={
                            'email': assigned_to.email,
                            'task_key': task_id,
                            'assigned_to': edge.end_node.get()
                        }
                    )
                taskqueue.add(
                    url='/workers/syncpatchtask',
                    queue_name='iogrow-low-task',
                    params={
                        'email': user_from_email.email,
                        'starts_at': request.due,
                        'ends_at': request.due,
                        'summary': task.title,
                        'task_google_id': task.task_google_id
                    }
                )
            else:
                taskqueue.add(
                    url='/workers/syncpatchtask',
                    queue_name='iogrow-low-task',
                    params={
                        'email': user_from_email.email,
                        'starts_at': request.due,
                        'ends_at': request.due,
                        'summary': task.title,
                        'task_google_id': task.task_google_id
                    }
                )

        task_key = task.put_async()
        task_key_async = task_key.get_result()
        EndpointsHelper.update_edge_indexes(
            parent_key=task_key_async,
            kind=None,
            indexed_edge=None
        )

        return cls.get_schema(
            user_from_email=user_from_email,
            request=request
        )

    @classmethod
    def cascade_delete(cls, entityKey):
        Edge.delete_all_cascade(start_node=entityKey)

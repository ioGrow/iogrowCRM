import httplib2
from crm import model
from apiclient.discovery import build
from endpoints_proto_datastore.ndb import EndpointsModel
from google.appengine.api import search
from google.appengine.api import taskqueue
from google.appengine.ext import ndb
from crm.model import Userinfo
from protorpc import messages

from crm import iomessages
from crm.endpoints_helper import EndpointsHelper
from crm.iograph import Edge
from crm.iomodels.notes import AuthorSchema, DiscussionAboutSchema
from crm.iomodels.tags import Tag, TagSchema


class AttachmentSchema(messages.Message):
    id = messages.StringField(1)
    title = messages.StringField(2)
    mimeType = messages.StringField(3)
    embedLink = messages.StringField(4)


class MultipleAttachmentRequest(messages.Message):
    parent = messages.StringField(1)
    items = messages.MessageField(AttachmentSchema, 2, repeated=True)
    access = messages.StringField(3)


class DocumentInsertRequest(messages.Message):
    title = messages.StringField(1, required=True)
    resource_id = messages.IntegerField(2)
    alternateLink = messages.StringField(3)
    thumbnailLink = messages.StringField(4)
    embedLink = messages.StringField(5)
    mimeType = messages.StringField(6, required=True)
    access = messages.StringField(7)
    parent = messages.StringField(8, required=True)


class DocumentSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    title = messages.StringField(3)
    resource_id = messages.StringField(4)
    alternateLink = messages.StringField(5)
    thumbnailLink = messages.StringField(6)
    embedLink = messages.StringField(7)
    mimeType = messages.StringField(8)
    tags = messages.MessageField(TagSchema, 9, repeated=True)
    created_at = messages.StringField(10)
    updated_at = messages.StringField(11)
    access = messages.StringField(12)
    about = messages.MessageField(DiscussionAboutSchema, 13)
    created_by = messages.MessageField(AuthorSchema, 14)


class DocumentListResponse(messages.Message):
    items = messages.MessageField(DocumentSchema, 1, repeated=True)
    nextPageToken = messages.StringField(2)


class Document(EndpointsModel):
    # Sharing fields
    _message_fields_schema = (
    'id', 'entityKey', 'mimeType', 'title', 'about_kind', 'about_item', 'embedLink', 'updated_at', 'created_at')
    owner = ndb.StringProperty()
    collaborators_list = ndb.StructuredProperty(model.Userinfo, repeated=True)
    collaborators_ids = ndb.StringProperty(repeated=True)
    author = ndb.StructuredProperty(Userinfo)
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    title = ndb.StringProperty()
    resource_id = ndb.StringProperty()
    alternateLink = ndb.StringProperty()
    thumbnailLink = ndb.StringProperty()
    embedLink = ndb.StringProperty()
    mimeType = ndb.StringProperty()

    # number of comments in this topic
    comments = ndb.IntegerProperty()
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

        perm = model.Permission(about_kind='Account',
                                about_item=about_item,
                                type='user',
                                role='owner',
                                value=self.owner)
        perm.put()

    def put_index(self, data=None):
        """ index the element at each"""
        if self.comments is None:
            self.comments = 0
        empty_string = lambda x: x if x else ""
        collaborators = " ".join(self.collaborators_ids)
        organization = str(self.organization.id())
        if data:
            search_key = ['infos', 'documents', 'tags']
            for key in search_key:
                if key not in data.keys():
                    data[key] = ""
            my_document = search.Document(
                doc_id=str(data['id']),
                fields=[
                    search.TextField(name=u'type', value=u'Document'),
                    search.TextField(name='organization', value=empty_string(organization)),
                    search.TextField(name='access', value=empty_string(self.access)),
                    search.TextField(name='owner', value=empty_string(self.owner)),
                    search.TextField(name='collaborators', value=collaborators),
                    search.TextField(name='title', value=empty_string(self.title)),
                    search.TextField(name='resource_id', value=empty_string(self.resource_id)),
                    search.TextField(name='about_kind', value=empty_string(self.about_kind)),
                    search.TextField(name='about_item', value=empty_string(self.about_item)),
                    search.TextField(name='infos', value=data['infos']),
                    search.TextField(name='tags', value=data['tags']),
                    search.TextField(name='documents', value=data['documents']),
                    search.DateField(name='created_at', value=self.created_at),
                    search.DateField(name='updated_at', value=self.updated_at),
                    search.NumberField(name='comments', value=self.comments),
                ])
        else:
            my_document = search.Document(
                doc_id=str(self.key.id()),
                fields=[
                    search.TextField(name=u'type', value=u'Document'),
                    search.TextField(name='organization', value=empty_string(organization)),
                    search.TextField(name='access', value=empty_string(self.access)),
                    search.TextField(name='owner', value=empty_string(self.owner)),
                    search.TextField(name='collaborators', value=collaborators),
                    search.TextField(name='title', value=empty_string(self.title)),
                    search.TextField(name='resource_id', value=empty_string(self.resource_id)),
                    search.TextField(name='about_kind', value=empty_string(self.about_kind)),
                    search.TextField(name='about_item', value=empty_string(self.about_item)),
                    search.DateField(name='created_at', value=self.created_at),
                    search.DateField(name='updated_at', value=self.updated_at),
                    search.NumberField(name='comments', value=self.comments),
                ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)

    @classmethod
    def get_schema(cls, user_from_email, request):
        document = cls.get_by_id(int(request.id))
        if document is None:
            raise endpoints.NotFoundException('Document not found.')
        tag_list = Tag.list_by_parent(parent_key=document.key)
        about = None
        edge_list = Edge.list(start_node=document.key, kind='parents')
        for edge in edge_list['items']:
            about_kind = edge.end_node.kind()
            parent = edge.end_node.get()
            if parent:
                if about_kind == 'Contact' or about_kind == 'Lead':
                    about_name = parent.firstname + ' ' + parent.lastname
                elif about_kind == 'Task' or about_kind == 'Event':
                    about_name = parent.title
                else:
                    about_name = parent.name
                about = DiscussionAboutSchema(
                    kind=about_kind,
                    id=str(parent.key.id()),
                    name=about_name
                )
        author_schema = None
        if document.author:
            author_schema = AuthorSchema(
                google_user_id=document.author.google_user_id,
                display_name=document.author.display_name,
                google_public_profile_url=document.author.google_public_profile_url,
                photo=document.author.photo)
        document_schema = DocumentSchema(
            id=str(document.key.id()),
            entityKey=document.key.urlsafe(),
            title=document.title,
            resource_id=document.resource_id,
            alternateLink=document.alternateLink,
            thumbnailLink=document.thumbnailLink,
            embedLink=document.embedLink,
            mimeType=document.mimeType,
            access=document.access,
            tags=tag_list,
            about=about,
            created_by=author_schema,
            created_at=document.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
            updated_at=document.updated_at.strftime("%Y-%m-%dT%H:%M:00.000")
        )
        return document_schema

    @classmethod
    def list_by_parent(cls, parent_key, request=None):
        document_list = []
        if request:
            document_edge_list = Edge.list(
                start_node=parent_key,
                kind='documents',
                limit=request.documents.limit,
                pageToken=request.documents.pageToken
            )
        else:
            document_edge_list = Edge.list(
                start_node=parent_key,
                kind='documents'
            )
        for edge in document_edge_list['items']:
            document = edge.end_node.get()
            tag_list = Tag.list_by_parent(parent_key=document.key)
            document_list.append(
                DocumentSchema(
                    id=str(document.key.id()),
                    entityKey=document.key.urlsafe(),
                    title=document.title,
                    resource_id=document.resource_id,
                    alternateLink=document.alternateLink,
                    thumbnailLink=document.thumbnailLink,
                    embedLink=document.embedLink,
                    mimeType=document.mimeType,
                    access=document.access,
                    tags=tag_list,
                    created_at=document.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                    updated_at=document.updated_at.strftime("%Y-%m-%dT%H:%M:00.000")
                )
            )
        if document_edge_list['next_curs'] and document_edge_list['more']:
            document_next_curs = document_edge_list['next_curs'].urlsafe()
        else:
            document_next_curs = None
        return DocumentListResponse(
            items=document_list,
            nextPageToken=document_next_curs
        )

    @classmethod
    def insert(cls, user_from_email, request):
        # prepare google drive service
        credentials = user_from_email.google_credentials
        http = httplib2.Http()
        service = build('drive', 'v2', http=http)
        credentials.authorize(http)
        # prepare params to insert
        params = {
            'title': request.title,
            'mimeType': request.mimeType
        }
        # execute files.insert and get resource_id
        created_document = service.files().insert(body=params).execute()
        author = Userinfo()
        author.google_user_id = user_from_email.google_user_id
        author.display_name = user_from_email.google_display_name
        author.photo = user_from_email.google_public_profile_photo_url
        document = cls(
            owner=user_from_email.google_user_id,
            organization=user_from_email.organization,
            access=request.access,
            title=request.title,
            mimeType=request.mimeType,
            resource_id=created_document['id'],
            embedLink=created_document['embedLink'],
            author=author
        )
        document_key = document.put_async()
        document_key_async = document_key.get_result()
        if request.parent:
            parent_key = ndb.Key(urlsafe=request.parent)
            taskqueue.add(
                url='/workers/syncdocumentwithteam',
                queue_name='iogrow-low',
                params={
                    'user_email': user_from_email.email,
                    'doc_id': str(document_key_async.id()),
                    'parent_key_str': request.parent
                }
            )
            # insert edges
            Edge.insert(start_node=parent_key,
                        end_node=document_key_async,
                        kind='documents',
                        inverse_edge='parents')
            EndpointsHelper.update_edge_indexes(
                parent_key=document_key_async,
                kind='documents',
                indexed_edge=str(parent_key.id())
            )
        else:
            data = {'id': document_key_async.id()}
            document.put_index(data)
        return DocumentSchema(id=str(document_key_async.id()), embedLink=document.embedLink)

    @classmethod
    def attach_files(cls, user_from_email, request):
        items = request.items
        author = Userinfo()
        author.google_user_id = user_from_email.google_user_id
        author.display_name = user_from_email.google_display_name
        author.photo = user_from_email.google_public_profile_photo_url
        if request.access:
            access = request.access
        else:
            access = 'public'
        items_attached = []
        for item in items:
            document = cls(
                title=item.title,
                resource_id=item.id,
                mimeType=item.mimeType,
                embedLink=item.embedLink,
                owner=user_from_email.google_user_id,
                organization=user_from_email.organization,
                author=author,
                access=access,
                comments=0
            )
            document_key = document.put_async()
            document_key_async = document_key.get_result()
            if request.parent:

                parent_key = ndb.Key(urlsafe=request.parent)
                taskqueue.add(
                    url='/workers/syncdocumentwithteam',
                    queue_name='iogrow-low',
                    params={
                        'user_email': user_from_email.email,
                        'doc_id': str(document_key_async.id()),
                        'parent_key_str': request.parent
                    }
                )
                # insert edges
                Edge.insert(start_node=parent_key,
                            end_node=document_key_async,
                            kind='documents',
                            inverse_edge='parents')
                EndpointsHelper.update_edge_indexes(
                    parent_key=document_key_async,
                    kind='documents',
                    indexed_edge=str(parent_key.id())
                )
            else:
                data = {'id': document_key_async.id()}
                document.put_index(data)
            file_attached = iomessages.FileAttachedSchema(
                id=str(document_key_async.id()),
                name=item.title,
                embedLink=document.embedLink,
            )
            items_attached.append(file_attached)
        return iomessages.FilesAttachedResponse(items=items_attached)

import endpoints
from google.appengine.ext import ndb
from google.appengine.api import taskqueue
from google.appengine.datastore.datastore_query import Cursor
from google.appengine.api import search
from endpoints_proto_datastore.ndb import EndpointsModel
from protorpc import messages
from search_helper import tokenize_autocomplete,SEARCH_QUERY_MODEL
from endpoints_helper import EndpointsHelper,scor_new_lead
from iomodels.crmengine.tags import Tag,TagSchema
from iomodels.crmengine.tasks import Task,TaskRequest,TaskListResponse
from iomodels.crmengine.events import Event,EventListResponse
from iograph import Node,Edge,InfoNodeListResponse
from iomodels.crmengine.notes import Note,TopicListResponse
from iomodels.crmengine.documents import Document,DocumentListResponse
from iomodels.crmengine.contacts import Contact
from iomodels.crmengine.accounts import Account
import model
import iomessages
import tweepy
class AuthorSchema(messages.Message):
    google_user_id = messages.StringField(1)
    display_name = messages.StringField(2)
    google_public_profile_url = messages.StringField(3)
    photo = messages.StringField(4)

class ArticleInsertRequest(messages.Message):
    title = messages.StringField(1)
    alias = messages.StringField(2)
    intro_text = messages.StringField(3)
    full_text = messages.StringField(4)
    is_published = messages.BooleanField(5)

 # The message class that defines the ListRequest schema
class ListRequest(messages.Message):
    limit = messages.IntegerField(1)
    pageToken = messages.StringField(2)

class LeadGetRequest(messages.Message):
    id = messages.IntegerField(1,required = True)
    topics = messages.MessageField(ListRequest, 2)
    tasks = messages.MessageField(ListRequest, 3)
    events = messages.MessageField(ListRequest, 4)
    documents = messages.MessageField(ListRequest, 5)

class ArticleSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    title = messages.StringField(3)
    intro_text = messages.StringField(4)
    full_text = messages.StringField(5)
    tags = messages.MessageField(TagSchema,6, repeated = True)
    created_by = messages.MessageField(AuthorSchema,7)
    created_at = messages.StringField(8)
    updated_at = messages.StringField(9)

class ListRequest(messages.Message):
    limit = messages.IntegerField(1)
    pageToken = messages.StringField(2)
    order = messages.StringField(3)
    tags = messages.StringField(4,repeated = True)
    owner = messages.StringField(5)
    status = messages.StringField(6)

class ArticleListResponse(messages.Message):
    items = messages.MessageField(ArticleSchema, 1, repeated=True)
    nextPageToken = messages.StringField(2)

class LeadSearchResult(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    firstname = messages.StringField(3)
    lastname = messages.StringField(4)
    company = messages.StringField(5)
    position = messages.StringField(6)
    status = messages.StringField(7)

class LeadSearchResults(messages.Message):
    items = messages.MessageField(LeadSearchResult, 1, repeated=True)
    nextPageToken = messages.StringField(2)

class Article():
    def put_index(self,data=None):
        """ index the element at each"""
        empty_string = lambda x: x if x else ""
        collaborators = " ".join(self.collaborators_ids)
        organization = str(self.organization.id())
        title_autocomplete = ','.join(tokenize_autocomplete(self.firstname + ' ' + self.lastname +' '+ empty_string(self.title)+ ' ' +empty_string(self.company) + ' ' + empty_string(self.status)))
        #addresses = " \n".join(map(lambda x: " ".join([x.street,x.city,x.state, x.postal_code, x.country]), self.addresses))
        if data:
            search_key = ['infos','contacts','tags','collaborators']
            for key in search_key:
                if key not in data.keys():
                    data[key] = ""
            my_document = search.Document(
            doc_id = str(data['id']),
            fields=[
            search.TextField(name=u'type', value=u'Lead'),
            search.TextField(name='title', value = empty_string(self.firstname) + " " + empty_string(self.lastname)),
            search.TextField(name='organization', value = empty_string(organization) ),
            search.TextField(name='access', value = empty_string(self.access) ),
            search.TextField(name='owner', value = empty_string(self.owner) ),
            search.TextField(name='collaborators', value = data['collaborators']  ),
            search.TextField(name='firstname', value = empty_string(self.firstname) ),
            search.TextField(name='lastname', value = empty_string(self.lastname)),
            search.TextField(name='company', value = empty_string(self.company)),
            search.TextField(name='industry', value = empty_string(self.industry)),
            search.TextField(name='position', value = empty_string(self.title)),
            search.TextField(name='department', value = empty_string(self.department)),
            search.TextField(name='description', value = empty_string(self.description)),
            search.TextField(name='source', value = empty_string(self.source)),
            search.TextField(name='status', value = empty_string(self.status)),
            search.DateField(name='created_at', value = self.created_at),
            search.DateField(name='updated_at', value = self.updated_at),
            search.TextField(name='show_name', value = empty_string(self.show_name)),
            search.TextField(name='tagline', value = empty_string(self.tagline)),
            search.TextField(name='introduction', value = empty_string(self.introduction)),
            search.TextField(name='infos', value= data['infos']),
            search.TextField(name='tags', value= data['tags']),
            search.TextField(name='title_autocomplete', value = empty_string(title_autocomplete)),
           ])
        else:
            my_document = search.Document(
            doc_id = str(self.key.id()),
            fields=[
                search.TextField(name=u'type', value=u'Lead'),
                search.TextField(name='title', value = empty_string(self.firstname) + " " + empty_string(self.lastname)),
                search.TextField(name='organization', value = empty_string(organization) ),
                search.TextField(name='access', value = empty_string(self.access) ),
                search.TextField(name='owner', value = empty_string(self.owner) ),
                search.TextField(name='collaborators', value = collaborators ),
                search.TextField(name='firstname', value = empty_string(self.firstname) ),
                search.TextField(name='lastname', value = empty_string(self.lastname)),
                search.TextField(name='company', value = empty_string(self.company)),
                search.TextField(name='industry', value = empty_string(self.industry)),
                search.TextField(name='position', value = empty_string(self.title)),
                search.TextField(name='department', value = empty_string(self.department)),
                search.TextField(name='description', value = empty_string(self.description)),
                search.TextField(name='source', value = empty_string(self.source)),
                search.TextField(name='status', value = empty_string(self.status)),
                search.DateField(name='created_at', value = self.created_at),
                search.DateField(name='updated_at', value = self.updated_at),
                search.TextField(name='show_name', value = empty_string(self.show_name)),
                search.TextField(name='tagline', value = empty_string(self.tagline)),
                search.TextField(name='introduction', value = empty_string(self.introduction)),
                search.TextField(name='title_autocomplete', value = empty_string(title_autocomplete)),
               ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)

    @classmethod
    def get_schema(cls,id):
        article = Node.get_by_id(int(id))
        if article is None:
            raise endpoints.NotFoundException('Article not found.')
        #list of tags related to this account
        tag_list = Tag.list_by_parent(article.key)
        author_edge = Edge.list(
                                  start_node = article.key,
                                  kind = 'authored_by',
                                  limit = 1
                                )
        author_schema = None
        if len(author_edge['items'])>0:
            author = author_edge['items'][0].end_node.get()
            author_schema = AuthorSchema(
                                        google_user_id=author.google_user_id,
                                        display_name=author.google_display_name,
                                        google_public_profile_url=author.google_public_profile_url,
                                        photo=author.google_public_profile_photo_url
                                        )
        article_schema = ArticleSchema(
                  id = str( article.key.id() ),
                  entityKey = article.key.urlsafe(),
                  title = article.title,
                  intro_text = article.intro_text,
                  full_text = article.full_text,
                  tags = tag_list,
                  created_by = author_schema,
                  created_at = article.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                  updated_at = article.updated_at.strftime("%Y-%m-%dT%H:%M:00.000")
                )
        return  article_schema
    @classmethod
    def list(cls,request):
        curs = Cursor(urlsafe=request.pageToken)
        if request.limit:
            limit = int(request.limit)
        else:
            limit = 10
        items = list()
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
                attr = Node._properties.get(order_by)
                if attr is None:
                    raise AttributeError('Order attribute %s not defined.' % (attr_name,))
                if ascending:
                    articles, next_curs, more =  Node.query().filter(Node.kind=='article').order(+attr).fetch_page(limit, start_cursor=curs)
                else:
                    articles, next_curs, more = Node.query().filter(Node.kind=='article').order(-attr).fetch_page(limit, start_cursor=curs)
            else:
                articles, next_curs, more = Node.query().filter(Node.kind=='article').fetch_page(limit, start_cursor=curs)
            for article in articles:
                if count<= limit:
                    is_filtered = True
                    if request.tags and is_filtered:
                        end_node_set = [ndb.Key(urlsafe=tag_key) for tag_key in request.tags]
                        if not Edge.find(start_node=article.key,kind='tags',end_node_set=end_node_set,operation='AND'):
                            is_filtered = False
                    if is_filtered:
                        count = count + 1
                        #list of tags related to this article
                        tag_list = Tag.list_by_parent(parent_key = article.key)
                        author_edge = Edge.list(
                                                  start_node = article.key,
                                                  kind = 'authored_by',
                                                  limit = 1
                                                )
                        author_schema = None
                        if len(author_edge['items'])>0:
                            author = author_edge['items'][0].end_node.get()
                            author_schema = AuthorSchema(
                                                        google_user_id=author.google_user_id,
                                                        display_name=author.google_display_name,
                                                        google_public_profile_url=author.google_public_profile_url,
                                                        photo=author.google_public_profile_photo_url
                                                        )
                        article_schema = ArticleSchema(
                                  id = str( article.key.id() ),
                                  entityKey = article.key.urlsafe(),
                                  title = article.title,
                                  intro_text = article.intro_text,
                                  full_text = article.full_text,
                                  tags = tag_list,
                                  created_by = author_schema,
                                  created_at = article.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                                  updated_at = article.updated_at.strftime("%Y-%m-%dT%H:%M:00.000")
                                )
                        items.append(article_schema)
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
        return  ArticleListResponse(items = items, nextPageToken = next_curs_url_safe)

    @classmethod
    def search(cls,user_from_email,request):
        organization = str(user_from_email.organization.id())
        index = search.Index(name="GlobalIndex")
        #Show only objects where you have permissions
        query_string = SEARCH_QUERY_MODEL % {
                               "type": "Lead",
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
                                      "firstname",
                                      "lastname",
                                      "company",
                                      "position",
                                      "status"
                                      ]:
                            kwargs[e.name] = e.value
                    search_results.append(LeadSearchResult(**kwargs))

        except search.Error:
            logging.exception('Search failed')
        return LeadSearchResults(
                                 items=search_results,
                                 nextPageToken=next_cursor
                                 )

    @classmethod
    def insert(cls,user_from_email,request):
        node = Node(
                          kind = 'article',
                          title = request.title,
                          alias = request.alias,
                          is_published = request.is_published
                          )
        # introtext
        prop = ndb.TextProperty("intro_text", indexed=False)
        prop._code_name = "intro_text"
        node._properties["intro_text"] = prop
        prop._set_value(node, request.intro_text)
        # fulltext
        prop = ndb.TextProperty("full_text", indexed=False)
        prop._code_name = "full_text"
        node._properties["full_text"] = prop
        prop._set_value(node, request.full_text)
        node_key = node.put()
        Edge.insert(
                    start_node = user_from_email.key ,
                    end_node = node_key,
                    kind = 'articles',
                    inverse_edge = 'authored_by'
                  )
        article_schema = ArticleSchema(
                                  id = str( node_key.id() )
                                )
        return article_schema
    @classmethod
    def from_twitter(cls,user_from_email,request):
        try:
            credentials = {
            	'consumer_key' : 'YM7Glbdf9M9WyaaKh6DNOQ',
            	'consumer_secret' : 'CGDvSvuohsJF1YUJwDFc3EsuTg8BQvHplsYiv7h6Uw',
            	'access_token_key' : '50290670-HYBgH5DOmLB2LqRB1NXkA2Y28bMCfi5a0yvq9YWUw',
            	'access_token_secret' : 'UfehG5RWaTNZTwCEERImSeUVwVlXM6mY1ly3lYjiWaqIc'
            }
            auth = tweepy.OAuthHandler(credentials['consumer_key'], credentials['consumer_secret'])
            auth.set_access_token(credentials['access_token_key'], credentials['access_token_secret'])
            api = tweepy.API(auth)
            twitter_lead = api.get_user(user_id=request.user_id)
        except (IndexError, TypeError):
            raise endpoints.NotFoundException('an error has occured try again' %
                                                  (request.screen_name,))
        import_request = LeadInsertRequest(
                                          firstname = twitter_lead.name.split()[0],
                                          lastname = " ".join(twitter_lead.name.split()[1:]),
                                          introduction = twitter_lead.description,
                                          profile_img_url = twitter_lead.profile_image_url
                                          )
        lead = cls.insert(user_from_email,import_request)
        return lead
    @classmethod
    def convert(cls,user_from_email,request):
        try:
            lead = Lead.get_by_id(int(request.id))
        except (IndexError, TypeError):
            raise endpoints.NotFoundException('Lead %s not found.' %
                                                  (request.id,))
        moved_folder = EndpointsHelper.move_folder(user_from_email,lead.folder,'Contact')
        contact = Contact(
                            owner = lead.owner,
                            organization = lead.organization,
                            access = lead.access,
                            folder = moved_folder['id'],
                            firstname = lead.firstname,
                            lastname = lead.lastname,
                            title = lead.title,
                            tagline = lead.tagline,
                            introduction = lead.introduction
                        )

        contact_key = contact.put_async()
        contact_key_async = contact_key.get_result()
        if lead.company:
            created_folder = EndpointsHelper.insert_folder(user_from_email,lead.company,'Account')
            account = Account(
                                owner = lead.owner,
                                organization = lead.organization,
                                access = lead.access,
                                account_type = 'prospect',
                                name=lead.company,
                                folder = created_folder['id']
                            )
            account_key = account.put_async()
            account_key_async = account_key.get_result()
            Edge.insert(
                        start_node = account_key_async,
                        end_node = contact_key_async,
                        kind = 'contacts',
                        inverse_edge = 'parents'
                        )
            EndpointsHelper.update_edge_indexes(
                                            parent_key = contact_key_async,
                                            kind = 'contacts',
                                            indexed_edge = str(account_key_async.id())
                                            )
        edge_list = Edge.query(Edge.start_node == lead.key).fetch()
        for edge in edge_list:
            edge.start_node = contact_key_async
            edge.put()

        lead.key.delete()
        EndpointsHelper.delete_document_from_index( id = request.id )
        return LeadSchema(id = str(contact_key_async.id()) )

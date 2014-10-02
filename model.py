# Google libs
import httplib2
from google.appengine.ext import ndb
from google.appengine.api import memcache
from google.appengine.api import taskqueue
from google.appengine.api import search
from google.appengine.api import urlfetch
from oauth2client.appengine import CredentialsNDBProperty
from apiclient import errors
from apiclient.discovery import build
from apiclient.http import BatchHttpRequest
from oauth2client.client import flow_from_clientsecrets
from oauth2client.client import FlowExchangeError
from oauth2client.appengine import OAuth2Decorator

# Third parties
from endpoints_proto_datastore.ndb import EndpointsModel
# Our libraries
from iomodels.crmengine.opportunitystage import Opportunitystage
from iomodels.crmengine.leadstatuses import Leadstatus
from iomodels.crmengine.casestatuses import Casestatus
from search_helper import tokenize_autocomplete
import iomessages
# hadji hicham 20/08/2014.
import stripe
import json
import re
import endpoints

CLIENT_ID = json.loads(
    open('client_secrets.json', 'r').read())['web']['client_id']

CLIENT_SECRET = json.loads(
    open('client_secrets.json', 'r').read())['web']['client_secret']

SCOPES = [
    'https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/plus.profile.emails.read https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/calendar  https://www.google.com/m8/feeds'
]

TOKEN_INFO_ENDPOINT = ('https://www.googleapis.com/oauth2/v1/tokeninfo' +
    '?access_token=%s')
TOKEN_REVOKE_ENDPOINT = 'https://accounts.google.com/o/oauth2/revoke?token=%s'

VISIBLE_ACTIONS = [
    'http://schemas.google.com/AddActivity',
    'http://schemas.google.com/ReviewActivity'
]

STANDARD_TABS = [
                {'name': 'Discovery','label': 'Discovery','url':'/#/discovers/','icon':'twitter'},
                {'name': 'Accounts','label': 'Accounts','url':'/#/accounts/','icon':'book'},
                {'name': 'Contacts','label': 'Contacts','url':'/#/contacts/','icon':'group'},
                {'name': 'Opportunities','label': 'Opportunities','url':'/#/opportunities/','icon':'money'},
                {'name': 'Leads','label': 'Leads','url':'/#/leads/','icon':'road'},
                {'name': 'Cases','label': 'Cases','url':'/#/cases/','icon':'suitcase'},
                {'name': 'Tasks','label': 'Tasks','url':'/#/tasks/','icon':'check'},
                {'name': 'Calendar','label': 'Calendar','url':'/#/calendar/','icon':'calendar'}
                ]
EARLY_BIRD_TABS = [
                {'name': 'Contacts','label': 'Contacts','url':'/#/contacts/','icon':'group'},
                {'name': 'Leads','label': 'Leads','url':'/#/leads/','icon':'road'},
                {'name': 'Tasks','label': 'Tasks','url':'/#/tasks/','icon':'check'},
                {'name': 'Calendar','label': 'Calendar','url':'/#/calendar/','icon':'calendar'}
                ]
STANDARD_PROFILES = ['Super Administrator', 'Standard User']
STANDARD_APPS = [{'name': 'sales', 'label': 'Relationships', 'url':'/#/tasks/'}]
STANDARD_OBJECTS = ['Account','Contact','Opportunity','Lead','Case','Campaign']
ADMIN_TABS = [
            {'name': 'Users','label': 'Users','url':'/#/admin/users','icon':'user'},
            {'name': 'Groups','label': 'Groups','url':'/#/admin/groups','icon':'group'},
            {'name': 'Settings','label': 'Settings','url':'/#/admin/settings','icon':'cogs'},
            {'name': 'Imports','label': 'Imports','url':'/#/admin/imports','icon':'arrow-down'},
            {'name': 'Billing','label': 'Billing','url':'/#/billing/','icon':'usd'}
            ]
ADMIN_APP = {'name': 'admin', 'label': 'Admin Console', 'url':'/#/admin/users'}
"""Iogrowlive_APP = {'name':'iogrowLive','label': 'i/oGrow Live','url':'/#/live/shows'}

Iogrowlive_TABS = [{'name': 'Shows','label': 'Shows','url':'/#/live/shows'},{'name': 'Company_profile','label': 'Company Profile','url':'/#/live/company_profile/'},
{'name': 'Product_videos','label': 'Product Videos','url':'/#/live/product_videos'},{'name': 'Customer_Stories','label': 'Customer stories','url':'/#/live/customer_stories'},
{'name': 'Feedbacks','label': 'Feedbacks','url':'/#/live/feedbacks'},{'name': 'Leads','label': 'Leads','url':'/#/leads/'}]"""
Default_Opp_Stages = [
                    {'name':'Incoming','probability':5},
                    {'name':'Qualified','probability':10},
                    {'name':'Need Analysis','probability':40},
                    {'name':'Negociating','probability':80},
                    {'name':'Close won','probability':100},
                    {'name':'Close lost','probability':0}
                    ]
Default_Case_Status =[
                    {'status':'pending'},
                    {'status':'open'},
                    {'status':'closed'}
                    ]
Default_Lead_Status =[
                    {'status':'New'},
                    {'status':'Working'},
                    {'status':'Unqualified'},
                    {'status':'Closed converted'}
                    ]
FOLDERS = {
            'Accounts': 'accounts_folder',
            'Contacts': 'contacts_folder',
            'Leads': 'leads_folder',
            'Opportunities': 'opportunities_folder',
            'Cases': 'cases_folder'
        }
folders = {}

# hadji hicham  20/08/2014. our secret api key to auth at stripe .
stripe.api_key = "sk_test_4Xa3wfSl5sMQYgREe5fkrjVF"

class Application(ndb.Model):
    name = ndb.StringProperty(required=True)
    label = ndb.StringProperty(required=True)
    url = ndb.StringProperty()
    icon = ndb.StringProperty()
    tabs = ndb.KeyProperty(repeated=True)
    organization = ndb.KeyProperty(required=True)

class Tab(ndb.Model):
    name = ndb.StringProperty(required=True)
    label = ndb.StringProperty(required=True)
    url = ndb.StringProperty()
    icon = ndb.StringProperty()
    organization = ndb.KeyProperty(required=True)
    tabs = ndb.KeyProperty(repeated=True)

# We use the Organization model to separate the data of each organization from each other
class Organization(ndb.Model):
    owner = ndb.StringProperty()
    name = ndb.StringProperty()
    # We can use status property later for checking if the organization is active or suspended
    status = ndb.StringProperty()
    # Which plan ? is it a free plan, basic plan or premium plan...
    plan = ndb.StringProperty()
    instance_created = ndb.BooleanProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)


    @classmethod
    def init_default_values(cls,org_key):
        #HKA 17.12.2013 Add an opportunity stage
        for oppstage in Default_Opp_Stages:
          created_opp_stage = Opportunitystage(organization=org_key,name=oppstage['name'],probability=oppstage['probability'])
          created_opp_stage.put_async()
        #HKA 17.12.2013 Add an Case status
        for casestat in Default_Case_Status:
          created_case_status = Casestatus(status=casestat['status'],organization=org_key)
          created_case_status.put_async()
        #HKA 17.12.2013 Add an Lead status
        for leadstat in Default_Lead_Status:
          created_lead_stat = Leadstatus(status=leadstat['status'],organization=org_key)
          created_lead_stat.put_async()
    # Create a standard instance for this organization
    @classmethod
    def create_instance(cls,org_name, admin):
        # init google drive folders
        # Add the task to the default queue.
        organization = cls(
                        owner=admin.google_user_id,
                        name=org_name
                        )
        org_key = organization.put()
        # taskqueue.add(
        #             url='/workers/createorgfolders',
        #             queue_name='iogrow-low',
        #             params={
        #                     'email': admin.email,
        #                     'org_key':org_key.urlsafe()
        #                     }
        #             )

        # create standard tabs
        #  here where we create the first customer .

        # cust=stripe.Customer.create(
        #           email= admin.email,
        #           description=admin.email,
        #           metadata={"organization_key":org_key.urlsafe(), 
        #                     "user_id":admin.id,
        #                     "google_display_name":admin.google_display_name,
        #                     "google_public_profile_photo_url":admin.google_public_profile_photo_url,
        #                     "google_user_id":admin.google_user_id}
        #          )
        # cust.subscriptions.create(plan="iogrow_plan")
        # admin.stripe_id=cust.id

        # admin.put()
        created_tabs = []
        for tab in STANDARD_TABS:
            created_tab = Tab(name=tab['name'],label=tab['label'],url=tab['url'],icon=tab['icon'],organization=org_key)
            tab_key = created_tab.put()
            created_tabs.append(tab_key)
        # create admin tabs
        admin_tabs = []
        for tab in ADMIN_TABS:
            created_tab = Tab(name=tab['name'],label=tab['label'],url=tab['url'],icon=tab['icon'],organization=org_key)
            tab_key =created_tab.put()
            admin_tabs.append(tab_key)
        # create standard apps
        created_apps = []
        sales_app = None
        for app in STANDARD_APPS:
            created_app = Application(name=app['name'],label=app['label'],url=app['url'],tabs=created_tabs,organization=org_key)
            app_key = created_app.put()
            if app['name']=='sales':
                sales_app = app_key
            created_apps.append(app_key)
        # create admin app
        app = ADMIN_APP
        admin_app = Application(name=app['name'],label=app['label'],url=app['url'],tabs=admin_tabs,organization=org_key)
        admin_app_key = admin_app.put()
        # create standard profiles
        for profile in STANDARD_PROFILES:
            default_app = sales_app
            if profile=='Super Administrator':
                created_apps.append(admin_app_key)
                created_tabs.extend(admin_tabs)
            created_profile = Profile(
                                      name=profile,
                                      apps=created_apps,
                                      default_app=default_app,
                                      tabs=created_tabs,
                                      organization=org_key
                                    )
            # init admin config
            if profile=='Super Administrator':
                admin_profile_key = created_profile.put()
                admin.init_user_config(org_key,admin_profile_key)
            else:
                created_profile.put_async()
        # init default stages,status, default values...
        cls.init_default_values(org_key)
    @classmethod
    def create_early_bird_instance(cls,org_name, admin):
        # init google drive folders
        # Add the task to the default queue.
        organization = cls(
                        owner=admin.google_user_id,
                        name=org_name
                        )
        org_key = organization.put()
        # taskqueue.add(
        #             url='/workers/createorgfolders',
        #             queue_name='iogrow-low',
        #             params={
        #                     'email': admin.email,
        #                     'org_key':org_key.urlsafe()
        #                     }
        #             )

        # create standard tabs
        created_tabs = []
        for tab in EARLY_BIRD_TABS:
            created_tab = Tab(name=tab['name'],label=tab['label'],url=tab['url'],icon=tab['icon'],organization=org_key)
            tab_key = created_tab.put()
            created_tabs.append(tab_key)
        # create admin tabs
        admin_tabs = []
        for tab in ADMIN_TABS:
            created_tab = Tab(name=tab['name'],label=tab['label'],url=tab['url'],icon=tab['icon'],organization=org_key)
            tab_key =created_tab.put()
            admin_tabs.append(tab_key)
        # create standard apps
        created_apps = []
        sales_app = None
        for app in STANDARD_APPS:
            created_app = Application(name=app['name'],label=app['label'],url=app['url'],tabs=created_tabs,organization=org_key)
            app_key = created_app.put()
            if app['name']=='sales':
                sales_app = app_key
            created_apps.append(app_key)
        # create admin app
        app = ADMIN_APP
        admin_app = Application(name=app['name'],label=app['label'],url=app['url'],tabs=admin_tabs,organization=org_key)
        admin_app_key = admin_app.put()
        # create standard profiles
        for profile in STANDARD_PROFILES:
            default_app = sales_app
            if profile=='Super Administrator':
                created_apps.append(admin_app_key)
                created_tabs.extend(admin_tabs)
            created_profile = Profile(
                                      name=profile,
                                      apps=created_apps,
                                      default_app=default_app,
                                      tabs=created_tabs,
                                      organization=org_key
                                    )
            # init admin config
            if profile=='Super Administrator':
                admin_profile_key = created_profile.put()
                admin.init_early_bird_config(org_key,admin_profile_key)
            else:
                created_profile.put_async()
        # init default stages,status, default values...
        cls.init_default_values(org_key)

    @classmethod
    def upgrade_to_business_version(cls,org_key):
        current_org_apps = Application.query(Application.organization==org_key).fetch()
        # delete existing apps
        for app in current_org_apps:
            app.key.delete()
        current_org_tabs = Tab.query(Tab.organization==org_key).fetch()
        # delete existing tabs
        for tab in current_org_tabs:
            tab.key.delete()

        created_tabs = []
        for tab in STANDARD_TABS:
            created_tab = Tab(name=tab['name'],label=tab['label'],url=tab['url'],icon=tab['icon'],organization=org_key)
            tab_key = created_tab.put()
            created_tabs.append(tab_key)
        # create admin tabs
        admin_tabs = []
        for tab in ADMIN_TABS:
            created_tab = Tab(name=tab['name'],label=tab['label'],url=tab['url'],icon=tab['icon'],organization=org_key)
            tab_key =created_tab.put()
            admin_tabs.append(tab_key)
        # create standard apps
        created_apps = []
        sales_app = None
        for app in STANDARD_APPS:
            created_app = Application(name=app['name'],label=app['label'],url=app['url'],tabs=created_tabs,organization=org_key)
            app_key = created_app.put()
            if app['name']=='sales':
                sales_app = app_key
            created_apps.append(app_key)
        # create admin app
        app = ADMIN_APP
        admin_app = Application(name=app['name'],label=app['label'],url=app['url'],tabs=admin_tabs,organization=org_key)
        admin_app_key = admin_app.put()
        profiles = Profile.query(Profile.organization==org_key).fetch()
        created_apps.append(admin_app_key)
        created_tabs.extend(admin_tabs)
        for profile in profiles:
            default_app = sales_app
            profile.apps=created_apps
            profile.default_app=default_app
            profile.tabs=created_tabs
            profile.put()

        users = User.query(User.organization==org_key).fetch()
        for user in users:
            user_profile = user.profile.get()
            user.init_user_config(org_key,user.profile)
            user.set_user_active_app(user_profile.default_app)

class Permission(ndb.Model):
    about_kind = ndb.StringProperty(required=True)
    about_item = ndb.StringProperty(required=True)
    # is it writer, readonly,...
    role = ndb.StringProperty(required=True)
    additionalRoles = ndb.StringProperty(repeated=True)
    # is it a group or user
    type = ndb.StringProperty(required=True)

    value = ndb.StringProperty(required=True)
    name = ndb.StringProperty()
    photoLink = ndb.StringProperty()
    created_by = ndb.StringProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    organization = ndb.KeyProperty()

class Contributor(EndpointsModel):
    discussionKey = ndb.KeyProperty()
    # is it responsible, participant, invited,follower...
    role = ndb.StringProperty(required=True)
    additionalRoles = ndb.StringProperty(repeated=True)
    # is it a group or user
    type = ndb.StringProperty(required=True)

    value = ndb.StringProperty(required=True)
    name = ndb.StringProperty()
    photoLink = ndb.StringProperty()
    created_by = ndb.StringProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    organization = ndb.KeyProperty()

# We use the Profile model to describe what each user can do?
class Profile(ndb.Model):
    name = ndb.StringProperty(required=True)
    organization = ndb.KeyProperty(required=True)
    # Apps he can work with
    apps = ndb.KeyProperty(repeated=True)
    # Default app for this profile
    default_app = ndb.KeyProperty()
    # Visible tabs to this profile
    tabs = ndb.KeyProperty(repeated=True)
# The User model store all the informations about the user
class Userinfo(EndpointsModel):
    # General informations about the user
    email = ndb.StringProperty()
    google_user_id = ndb.StringProperty()
    display_name = ndb.StringProperty()
    google_public_profile_url = ndb.StringProperty()
    photo = ndb.StringProperty()

    def get_basic_info(self,user):
        self.email = user.email
        self.display_name= user.google_display_name
        self.google_user_id = user.google_user_id
        self.google_public_profile_url= user.google_public_profile_url
        self.photo = user.google_public_profile_photo_url
        return self

class User(EndpointsModel):
    # General informations about the user
    _message_fields_schema = ('id','email','entityKey', 'google_user_id','google_display_name','google_public_profile_photo_url','language','status')
    email = ndb.StringProperty()
    google_user_id = ndb.StringProperty()
    google_display_name = ndb.StringProperty()
    google_public_profile_url = ndb.StringProperty()
    google_public_profile_photo_url = ndb.StringProperty()
    google_credentials = CredentialsNDBProperty()
    mobile_phone = ndb.StringProperty()
    # Store the informations about the user settings
    language = ndb.StringProperty(default='en')
    timezone = ndb.StringProperty()
    # Is the user a public user or business user
    type = ndb.StringProperty()
    # If the user is a business user, we store the informations about him
    #stripe id , id represent an enter in the table of customers in stripe api.
    stripe_id=ndb.StringProperty()
    #that's coool
    organization = ndb.KeyProperty()
    status = ndb.StringProperty()
    profile = ndb.KeyProperty()
    role = ndb.KeyProperty()
    is_admin = ndb.BooleanProperty()
    # The appcfg for this business user
    apps = ndb.KeyProperty(repeated=True)
    active_app = ndb.KeyProperty()
    # Active tabs the user can see in this active_app
    active_tabs = ndb.KeyProperty(repeated=True)
    app_changed = ndb.BooleanProperty(default=True)
    google_contacts_group = ndb.StringProperty()
    invited_by = ndb.KeyProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)


    def put(self, **kwargs):
        existing_user = User.query(User.google_user_id == self.google_user_id).get()
        if existing_user:
            ndb.Model.put(existing_user, **kwargs)
        else:
            ndb.Model.put(self, **kwargs)


    def init_user_config(self,org_key,profile_key):
        profile = profile_key.get()
        active_app_mem_key = '%s_active_app' % self.google_user_id
        memcache.add(active_app_mem_key, profile.default_app.get())
        # Get Apps for this profile:
        apps = profile.apps
        # Prepare user to be updated
        self.organization = org_key
        self.profile = profile.key
        self.apps = apps
        self.active_app = profile.default_app
        self.type = 'business_user'
        if memcache.get(self.email) :
            memcache.set(self.email, self)
        else:
            memcache.add(self.email, self)
        if self.google_credentials:
            if self.google_contacts_group is None:
                taskqueue.add(
                            url='/workers/createcontactsgroup',
                            queue_name='iogrow-low',
                            params={
                                    'email': self.email
                                    }
                            )
        self.put()
    def init_early_bird_config(self,org_key,profile_key):
        profile = profile_key.get()
        active_app_mem_key = '%s_active_app' % self.google_user_id
        memcache.add(active_app_mem_key, profile.default_app.get())
        # Get Apps for this profile:
        apps = profile.apps
        # Prepare user to be updated
        self.organization = org_key
        self.profile = profile.key
        self.apps = apps
        self.active_app = profile.default_app
        self.type = 'early_bird'
        if memcache.get(self.email) :
            memcache.set(self.email, self)
        else:
            memcache.add(self.email, self)
        if self.google_credentials:
            taskqueue.add(
                        url='/workers/createcontactsgroup',
                        queue_name='iogrow-low',
                        params={
                                'email': self.email
                                }
                        )
        self.put()

    @classmethod
    def memcache_update(cls,user,email):
        if memcache.get(user.email) :
            memcache.set(user.email, user)
        else:
            memcache.add(user.email, user)
    @classmethod
    def get_by_email(cls,email):
        user_from_email = memcache.get(email)
        if user_from_email is not None:
            return user_from_email
        user_from_email = cls.query(cls.email == email).get()
        if memcache.get(email) :
            memcache.set(email, user_from_email)
        else:
            memcache.add(email, user_from_email)
        return user_from_email

    @classmethod
    def get_by_gid(cls,gid):
        return cls.query(cls.google_user_id == gid).get()


    def get_user_apps(self):
        return ndb.get_multi(self.apps)

    def get_user_active_app(self):
        mem_key = '%s_active_app' % self.google_user_id
        active_app = memcache.get(mem_key)
        if active_app is not None:
            return active_app
        return self.active_app.get()

    def set_user_active_app(self,app_key):
      if app_key in self.apps:
        self.active_app = app_key
        self.app_changed = True
        active_app =app_key.get()
        active_tabs = active_app.tabs
        mem_key = '%s_tabs' % self.google_user_id
        if memcache.get(mem_key) :
            memcache.set(mem_key, ndb.get_multi(active_app.tabs))
        else:
            memcache.add(mem_key, ndb.get_multi(active_app.tabs))
        active_app_mem_key = '%s_active_app' % self.google_user_id
        if memcache.get(active_app_mem_key) :
            memcache.set(active_app_mem_key, active_app)
        else:
            memcache.add(active_app_mem_key, active_app)
        self.put()
    def get_user_active_tabs(self):
        mem_key = '%s_tabs' % self.google_user_id
        tabs = memcache.get(mem_key)
        if tabs is not None:
            return tabs
        else:
            if self.app_changed:
                active_app = self.get_user_active_app()
                self.active_tabs = active_app.tabs
                self.app_changed = False
                self.put()
                memcache.add(mem_key, ndb.get_multi(self.active_tabs))
                return ndb.get_multi(active_app.tabs)
            elif self.active_tabs:
                memcache.add(mem_key, ndb.get_multi(self.active_tabs))
                return ndb.get_multi(self.active_tabs)
            else:
                active_app = self.active_app.get()
                self.active_tabs = active_app.tabs
                self.put()
                memcache.add(mem_key, ndb.get_multi(self.active_tabs))
                return ndb.get_multi(active_app.tabs)


    def get_user_groups(self):
        list_of_groups = list()
        results = Member.query(Member.memberKey==self.key).fetch()
        for group in results:
            list_of_groups.append(group.groupKey)
        return list_of_groups

    @classmethod
    def list(cls,organization):
        items = []
        users = cls.query(cls.organization==organization)
        for user in users:
            user_schema = iomessages.UserSchema(
                                            id = str(user.key.id()),
                                            entityKey = user.key.urlsafe(),
                                            email = user.email,
                                            google_display_name = user.google_display_name,
                                            google_public_profile_url = user.google_public_profile_url,
                                            google_public_profile_photo_url = user.google_public_profile_photo_url,
                                            google_user_id = user.google_user_id,
                                            is_admin = user.is_admin,
                                            status = user.status
                                            )
            items.append(user_schema)
        invitees_list = []
        invitees = Invitation.list_invitees(organization)
        for invitee in invitees:
            invited_schema = iomessages.InvitedUserSchema(
                                                          invited_mail=invitee['invited_mail'],
                                                          invited_by=invitee['invited_by'],
                                                          updated_at=invitee['updated_at'].strftime("%Y-%m-%dT%H:%M:00.000")
                                                        )
            invitees_list.append(invited_schema)
        return iomessages.UserListSchema(items=items,invitees=invitees_list)

    @staticmethod
    def exchange_code(code):
        """Exchanges the `code` member of the given AccessToken object, and returns
        the relevant credentials.

        Args:
          code: authorization code to exchange.

        Returns:
          Credentials response from Google indicating token information.

        Raises:
          FlowExchangeException Failed to exchange code (code invalid).
        """
        oauth_flow = flow_from_clientsecrets(
                                            'client_secrets.json',
                                            scope=SCOPES
                                          )
        oauth_flow.request_visible_actions = ' '.join(VISIBLE_ACTIONS)
        oauth_flow.redirect_uri = 'postmessage'
        credentials = oauth_flow.step2_exchange(code)
        return credentials
    @staticmethod
    def get_token_info(credentials):
        """Get the token information from Google for the given credentials."""
        url = (TOKEN_INFO_ENDPOINT
               % credentials.access_token)
        return urlfetch.fetch(url)

    @staticmethod
    def get_user_profile(credentials):
        """Return the public Google+ profile data for the given user."""
        http = credentials.authorize(httplib2.Http(memcache))
        plus = build('plus', 'v1', http=http)
        return plus.people().get(userId='me').execute()
    @staticmethod
    def get_user_email(credentials):
        """Return the public Google+ profile data for the given user."""
        http = credentials.authorize(httplib2.Http(memcache))
        userinfo = build('oauth2', 'v1', http=http)
        return userinfo.userinfo().get().execute()

    @staticmethod
    def save_token_for_user(email, credentials,user_id=None):
        """Creates a user for the given ID and credential or updates the existing
        user with the existing credential.

        Args:
          google_user_id: Google user ID to update.
          credentials: Credential to set for the user.

        Returns:
          Updated User.
        """
        if user_id:
            user = User.get_by_id(user_id)
            userinfo = GooglePlusConnect.get_user_profile(credentials)
            user.status = 'active'
            user.google_user_id = userinfo.get('id')
            user.google_display_name = userinfo.get('displayName')
            user.google_public_profile_url = userinfo.get('url')
            emails = userinfo.get('emails')
            user.email = emails[0]['value']
            profile_image = userinfo.get('image')
            user.google_public_profile_photo_url = profile_image['url']
            invited_by = user.invited_by.get()
            user.organization = invited_by.organization
            profile =  Profile.query(
                                            Profile.name=='Standard User',
                                            Profile.organization==invited_by.organization
                                          ).get()
            Invitation.delete_by(user.email)
            user.init_user_config(invited_by.organization,profile.key)
        else:
            user = User.get_by_email(email)
        if user is None:
            userinfo = User.get_user_profile(credentials)
            user = User()
            user.type = 'public_user'
            user.status = 'active'
            user.google_user_id = userinfo.get('id')
            user.google_display_name = userinfo.get('displayName')
            user.google_public_profile_url = userinfo.get('url')
            emails = userinfo.get('emails')
            user.email = emails[0]['value']
            profile_image = userinfo.get('image')
            user.google_public_profile_photo_url = profile_image['url']
        user.google_credentials = credentials
        user_key = user.put_async()
        user_key_async = user_key.get_result()
        if memcache.get(user.email) :
            memcache.set(user.email, user)
        else:
            memcache.add(user.email, user)
        if not user.google_contacts_group:
            taskqueue.add(
                            url='/workers/createcontactsgroup',
                            queue_name='iogrow-low',
                            params={
                                    'email': user.email
                                    }
                        )
        return user
    @classmethod
    def sign_in(cls,request):
        isNewUser = True
        user = endpoints.get_current_user()
        if user:
            email = user.email().lower()
            user_from_email = User.get_by_email(email)
            if user_from_email:
                isNewUser = False
                return iomessages.UserSignInResponse(is_new_user=isNewUser)
        credentials = None
        code = request.code
        try:
            credentials = User.exchange_code(code)
        except FlowExchangeError:
            raise endpoints.UnauthorizedException('an error has occured')
        token_info = User.get_token_info(credentials)
        if token_info.status_code != 200:
            raise endpoints.UnauthorizedException('an error has occured')
        token_info = json.loads(token_info.content)
        # If there was an error in the token info, abort.
        if token_info.get('error') is not None:
            raise endpoints.UnauthorizedException('an error has occured')
        # Make sure the token we got is for our app.
        expr = re.compile("(\d*)(.*).apps.googleusercontent.com")
        issued_to_match = expr.match(token_info.get('issued_to'))
        local_id_match = expr.match(CLIENT_ID)
        if (not issued_to_match
                or not local_id_match
                or issued_to_match.group(1) != local_id_match.group(1)):
                raise endpoints.UnauthorizedException('an error has occured')
        #Check if is it an invitation to sign-in or just a simple sign-in
        invited_user_id = None
        invited_user_id_request = request.id
        if invited_user_id_request:
            invited_user_id = long(invited_user_id_request)
            #user = model.User.query(model.User.google_user_id == token_info.get('user_id')).get()

            # Store our credentials with in the datastore with our user.
        if invited_user_id:
            user = User.save_token_for_user(
                                                            token_info.get('email'),
                                                            credentials,
                                                            invited_user_id
                                                          )
        else:
            user = User.save_token_for_user(
                                                            token_info.get('email'),
                                                            credentials
                                                          )
            # if user doesn't have organization redirect him to sign-up
        isNewUser = False
        if user.organization is None:
            isNewUser = True
        return iomessages.UserSignInResponse(is_new_user=isNewUser)

    @classmethod
    def sign_up(cls,user,request):
        taskqueue.add(
                            url='/workers/add_to_iogrow_leads',
                            queue_name='iogrow-low',
                            params={
                                    'email': user.email,
                                    'organization': request.organization_name
                                    }
                        )
        Organization.create_instance(request.organization_name,user)


class Group(EndpointsModel):
    _message_fields_schema = ('id','entityKey','name','description','status', 'organization')
    owner = ndb.KeyProperty()
    name = ndb.StringProperty(required=True)
    description = ndb.TextProperty()
    status = ndb.StringProperty()
    # members = ndb.StructuredProperty(Userinfo,repeated=True)
    organization = ndb.KeyProperty()

class Member(EndpointsModel):
    groupKey = ndb.KeyProperty()
    memberKey = ndb.KeyProperty()
    role = ndb.StringProperty(required=True)
    organization = ndb.KeyProperty()

    def put(self, **kwargs):
      ndb.Model.put(self, **kwargs)
      self._setup()

    def _setup(self):
      member = self.memberKey.get()
      group = self.groupKey.get()
      member_info = Userinfo()
      member_info.email = member.email
      member_info.google_user_id = member.google_user_id
      member_info.display_name = member.google_display_name
      member_info.google_public_profile_url = member.google_public_profile_url
      member_info.photo = member.google_public_profile_photo_url
      group.members = [member_info]
      group.put()


class Invitation(ndb.Model) :
    invited_mail = ndb.StringProperty()
    invited_by = ndb.KeyProperty()
    organization = ndb.KeyProperty()
    updated_at = ndb.DateTimeProperty(auto_now=True)
    stripe_id=ndb.StringProperty()
    @classmethod
    def delete_by(cls,email):
        invitations = cls.query(
                                cls.invited_mail==email
                              ).fetch()
        for invitation in invitations:
            invitation.key.delete()

    @classmethod
    def insert(cls,email,invited_by):
        # check if the user is invited
        invitation = cls.query(
                                cls.invited_mail==email,
                                cls.organization==invited_by.organization
                              ).get()
        if invitation is None:
            invitation = cls(
                            invited_mail = email,
                            organization = invited_by.organization
                            )
        invitation.invited_by = invited_by.key
        cust=stripe.Customer.create(  
                  email= email,
                  description=email,
                  metadata={"organization_key":invited_by.organization.urlsafe()})
        invitation.stripe_id=cust.id
        invitation.put()
    @classmethod
    def list_invitees(cls,organization):
        items = []
        invitees = cls.query(cls.organization == organization).fetch()
        for invitee in invitees:
            item = {
                  'invited_mail' :invitee.invited_mail,
                  'invited_by' :invitee.invited_by.get().google_display_name,
                  'updated_at' : invitee.updated_at,
                  'stripe_id':invitee.stripe_id
            }
            items.append(item)
        return items


#HKA 19.11.2013 Class for Phone on all Object
class Phone(ndb.Model) :
    type_number = ndb.StringProperty()
    number = ndb.StringProperty()
# HKA 19.11.2013 Class for email
class Email(ndb.Model):
  email = ndb.StringProperty()
# HKA 19.11.2013 Class for Address
class Address(ndb.Model):
  street = ndb.StringProperty()
  city = ndb.StringProperty()
  state = ndb.StringProperty()
  postal_code = ndb.StringProperty()
  country = ndb.StringProperty()
  lat = ndb.StringProperty()
  lon = ndb.StringProperty()
# HKA 19.11.2013 Add Website class
class Website(ndb.Model):
  website = ndb.StringProperty()
# HKA 19.11.2013 Add Social links
class Social(ndb.Model):
  sociallink = ndb.StringProperty()

#HKA 30.12.2013 Manage Company Profile

class Companyprofile(EndpointsModel):
  # _message_fields_schema = ('id','entityKey','name','tagline','owner','introduction','organization','organizationid','phones','emails','addresses','websites','sociallinks','youtube_channel')

  owner = ndb.StringProperty()
  # collaborators_list = ndb.StructuredProperty(Userinfo,repeated=True)
  # collaborators_ids = ndb.StringProperty(repeated=True)
  organization = ndb.KeyProperty()
  organizationid = ndb.IntegerProperty()
  name = ndb.StringProperty()
  youtube_channel = ndb.StringProperty()
  tagline = ndb.TextProperty()
  introduction =ndb.TextProperty()
  created_at = ndb.DateTimeProperty(auto_now_add=True)
  updated_at = ndb.DateTimeProperty(auto_now=True)
    # public or private
  access = ndb.StringProperty()


  def put(self, **kwargs):
        ndb.Model.put(self, **kwargs)
        self.put_index()

  def put_index(self):
        empty_string = lambda x: x if x else ""
        empty_date = lambda x: x if x else date(2999, 12, 31)
        title_autocomplete = ','.join(tokenize_autocomplete( self.name))
        show_document_for_live = search.Document(
        doc_id = str(self.organizationid),
        fields=[
            search.TextField(name=u'type', value=u'Company'),
            search.TextField(name='organization', value = empty_string(self.name) ),
            search.TextField(name='title_autocomplete', value = empty_string(title_autocomplete)),
           ])
        live_index = search.Index(name="ioGrowLiveIndex")
        live_index.put(show_document_for_live)
class Certification(ndb.Model):
    name=ndb.StringProperty()
    specifics=ndb.StringProperty(repeated=True)
class Experience(ndb.Model):
    title=ndb.StringProperty()
    period=ndb.StringProperty()
    organisation=ndb.StringProperty()
    description=ndb.StringProperty()
class Experiences(ndb.Model):
    current_exprience=ndb.StructuredProperty(Experience)
    past_exprience=ndb.StructuredProperty(Experience,repeated=True)

class LinkedinProfile(ndb.Model) :
    lastname = ndb.StringProperty(indexed=False)
    firstname =  ndb.StringProperty(indexed=False)
    industry =  ndb.StringProperty(indexed=False)
    locality =  ndb.StringProperty(indexed=False)
    headline =  ndb.StringProperty(indexed=False)
    current_post =  ndb.StringProperty(repeated=True,indexed=False)
    past_post=ndb.StringProperty(repeated=True,indexed=False)
    formations=ndb.StringProperty(repeated=True,indexed=False)
    websites=ndb.StringProperty(repeated=True,indexed=False)
    relation=ndb.StringProperty(indexed=False)
    experiences=ndb.JsonProperty(indexed=False)
    resume=ndb.TextProperty(indexed=False)
    certifications=ndb.JsonProperty(indexed=False)
    skills=ndb.StringProperty(repeated=True,indexed=False)
    url=ndb.StringProperty(indexed=False)
class LinkedinCompany(ndb.Model) :
    name = ndb.StringProperty(indexed=False)
    website =  ndb.StringProperty(indexed=False)
    industry =  ndb.StringProperty(indexed=False)
    headquarters =  ndb.StringProperty(indexed=False)
    summary =  ndb.TextProperty(indexed=False)
    founded=ndb.StringProperty(indexed=False)
    followers=ndb.StringProperty(indexed=False)
    logo=ndb.StringProperty(indexed=False)
    specialties=ndb.StringProperty(indexed=False)
    top_image=ndb.StringProperty(indexed=False)
    type=ndb.StringProperty(indexed=False)
    company_size=ndb.StringProperty(indexed=False)
    url=ndb.StringProperty(indexed=False)
    workers=ndb.JsonProperty(indexed=False)

class TwitterProfile(ndb.Model):
    id= ndb.IntegerProperty(indexed=False)
    followers_count= ndb.IntegerProperty(indexed=False)
    last_tweet_text= ndb.StringProperty(indexed=False)
    last_tweet_favorite_count= ndb.IntegerProperty(indexed=False)
    last_tweet_retweeted= ndb.StringProperty(indexed=False)
    last_tweet_retweet_count= ndb.IntegerProperty(indexed=False)
    language= ndb.StringProperty(indexed=False)
    created_at= ndb.StringProperty(indexed=False)
    nbr_tweets= ndb.IntegerProperty(indexed=False)
    description_of_user= ndb.StringProperty(indexed=False)
    friends_count= ndb.IntegerProperty(indexed=False)
    name= ndb.StringProperty(indexed=False)
    screen_name= ndb.StringProperty(indexed=False)
    url_of_user_their_company= ndb.StringProperty(indexed=False)
    location= ndb.StringProperty(indexed=False)
    profile_image_url_https= ndb.StringProperty(indexed=False)
    lang= ndb.StringProperty(indexed=False)
    profile_banner_url=ndb.StringProperty(indexed=False)
class TweetsSchema(ndb.Model):
    id=ndb.StringProperty(indexed=True)
    profile_image_url=ndb.StringProperty(indexed=False)
    author_name=ndb.StringProperty(indexed=False)
    created_at=ndb.StringProperty(indexed=False)
    content=ndb.StringProperty(indexed=False)
    author_followers_count=ndb.IntegerProperty(indexed=False)
    author_location=ndb.StringProperty(indexed=False)
    author_language=ndb.StringProperty(indexed=False)
    author_statuses_count=ndb.IntegerProperty(indexed=False)
    author_description=ndb.StringProperty(indexed=False)
    author_friends_count=ndb.IntegerProperty(indexed=False)
    author_favourites_count=ndb.IntegerProperty(indexed=False)
    author_url_website=ndb.StringProperty(indexed=False)
    created_at_author=ndb.StringProperty(indexed=False)
    time_zone_author=ndb.StringProperty(indexed=False)
    author_listed_count=ndb.IntegerProperty(indexed=False)
    screen_name=ndb.StringProperty(indexed=False)
    retweet_count=ndb.IntegerProperty(indexed=False)
    favorite_count=ndb.IntegerProperty(indexed=False)
    topic=ndb.StringProperty(indexed=True)
    order=ndb.StringProperty(indexed=True)
    latitude=ndb.StringProperty(indexed=False)
    longitude=ndb.StringProperty(indexed=False)
class TopicScoring(ndb.Model):
    topic=ndb.StringProperty(indexed=True)
    score=ndb.FloatProperty(indexed=True)
    value=ndb.FloatProperty(indexed=True,default=0)
    screen_name=ndb.StringProperty(indexed=True)
    
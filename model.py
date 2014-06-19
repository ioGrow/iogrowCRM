# Google libs
from google.appengine.ext import ndb
from google.appengine.api import memcache
from google.appengine.api import taskqueue
from google.appengine.api import search
from oauth2client.appengine import CredentialsNDBProperty
# Third parties
from endpoints_proto_datastore.ndb import EndpointsModel
# Our libraries
from iomodels.crmengine.opportunitystage import Opportunitystage
from iomodels.crmengine.leadstatuses import Leadstatus
from iomodels.crmengine.casestatuses import Casestatus
from search_helper import tokenize_autocomplete
import iomessages

STANDARD_TABS = [
                {'name': 'Accounts','label': 'Accounts','url':'/#/accounts/','icon':'book'},
                {'name': 'Contacts','label': 'Contacts','url':'/#/contacts/','icon':'group'},
                {'name': 'Opportunities','label': 'Opportunities','url':'/#/opportunities/','icon':'money'},
                {'name': 'Leads','label': 'Leads','url':'/#/leads/','icon':'road'},
                {'name': 'Cases','label': 'Cases','url':'/#/cases/','icon':'suitcase'},
                {'name': 'Tasks','label': 'Tasks','url':'/#/tasks/','icon':'check'},
                {'name': 'Calendar','label': 'Calendar','url':'/#/Calendar/','icon':'calendar'}
                ]
EARLY_BIRD_TABS = [
                {'name': 'Contacts','label': 'Contacts','url':'/#/contacts/','icon':'group'},
                {'name': 'Leads','label': 'Leads','url':'/#/leads/','icon':'road'},
                {'name': 'Tasks','label': 'Tasks','url':'/#/tasks/','icon':'check'},
                {'name': 'Calendar','label': 'Calendar','url':'/#/calendar/','icon':'calendar'}
                ]
STANDARD_PROFILES = ['Super Administrator', 'Standard User']
STANDARD_APPS = [{'name': 'sales', 'label': 'Relationships', 'url':'/#/leads/'}]
STANDARD_OBJECTS = ['Account','Contact','Opportunity','Lead','Case','Campaign']
ADMIN_TABS = [
            {'name': 'Users','label': 'Users','url':'/#/admin/users','icon':'user'},
            {'name': 'Groups','label': 'Groups','url':'/#/admin/groups','icon':'group'},
            {'name': 'Settings','label': 'Settings','url':'/#/admin/settings','icon':'cogs'}
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
    name = ndb.StringProperty()
    # We can use status property later for checking if the organization is active or suspended
    status = ndb.StringProperty()
    # Which plan ? is it a free plan, basic plan or premium plan...
    plan = ndb.StringProperty()
    instance_created = ndb.BooleanProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    org_folder = ndb.StringProperty()
    products_folder = ndb.StringProperty()
    accounts_folder = ndb.StringProperty()
    contacts_folder = ndb.StringProperty()
    leads_folder = ndb.StringProperty()
    opportunities_folder = ndb.StringProperty()
    cases_folder = ndb.StringProperty()
    shows_folder = ndb.StringProperty()
    feedbacks_folder = ndb.StringProperty()

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
                        name=org_name
                        )
        org_key = organization.put()
        taskqueue.add(
                    url='/workers/createorgfolders',
                    params={
                            'email': admin.email,
                            'org_key':org_key.urlsafe()
                            }
                    )
        # create standard tabs
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
                        name=org_name
                        )
        org_key = organization.put()
        taskqueue.add(
                    url='/workers/createorgfolders',
                    params={
                            'email': admin.email,
                            'org_key':org_key.urlsafe()
                            }
                    )
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
            taskqueue.add(
                        url='/workers/createcontactsgroup',
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
        invitation.put()
    @classmethod
    def list_invitees(cls,organization):
        items = []
        invitees = cls.query(cls.organization == organization).fetch()
        for invitee in invitees:
            item = {
                  'invited_mail' :invitee.invited_mail,
                  'invited_by' :invitee.invited_by.get().google_display_name,
                  'updated_at' : invitee.updated_at
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

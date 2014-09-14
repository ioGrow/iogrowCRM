# Standard libs
import httplib2
import json
import os
import datetime
from webapp2_extras import sessions
from webapp2_extras import i18n
import webapp2
import datetime
import time
import re
import jinja2
import random
from google.appengine._internal.django.utils.encoding import smart_str
# Google libs
import endpoints
from google.appengine.ext import ndb
from google.appengine.api import memcache
from google.appengine.api import taskqueue
from google.appengine.api import urlfetch
from google.appengine.api import mail
from apiclient import errors
from apiclient.discovery import build
from apiclient.http import BatchHttpRequest
from oauth2client.client import flow_from_clientsecrets
from oauth2client.client import FlowExchangeError

# Our libraries
from iomodels.crmengine.shows import Show
from endpoints_helper import EndpointsHelper
from people import linked_in
import model
from iomodels.crmengine.contacts import Contact
from iomodels.crmengine.leads import LeadInsertRequest,Lead
from iomodels.crmengine.Licenses import License
from iomodels.crmengine.documents import Document
from iomodels.crmengine.tags import Tag,TagSchema
import iomessages
from blog import Article
from iograph import Node , Edge
# import event . hadji hicham 09-07-2014
from iomodels.crmengine.events import Event
from iomodels.crmengine.tasks import Task 
import sfoauth2
from sf_importer_helper import SfImporterHelper
# under the test .beata !
import stripe
jinja_environment = jinja2.Environment(
  loader=jinja2.FileSystemLoader(os.getcwd()),
  extensions=['jinja2.ext.i18n'],cache_size=0)
jinja_environment.install_gettext_translations(i18n)

#the key represent the secret key which represent our company  , server side , we have two keys 
# test "sk_test_4Xa3wfSl5sMQYgREe5fkrjVF", mode dev 
# live "sk_live_4Xa3GqOsFf2NE7eDcX6Dz2WA" , mode prod 
# hadji hicham  20/08/2014. our secret api key to auth at stripe .

#Mode dev : ===> the test key. 
stripe.api_key = "sk_test_4Xa3wfSl5sMQYgREe5fkrjVF"


# Mode prod : ====> the live key .
#stripe.api_key = "sk_live_4Xa3GqOsFf2NE7eDcX6Dz2WA"

sfoauth2.SF_INSTANCE = 'na12'

ADMIN_EMAILS = ['tedj.meabiou@gmail.com','hakim@iogrow.com']
CLIENT_ID = json.loads(
    open('client_secrets.json', 'r').read())['web']['client_id']

SCOPES = [
    'https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/plus.profile.emails.read https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/calendar  https://www.google.com/m8/feeds'
]

VISIBLE_ACTIONS = [
    'http://schemas.google.com/AddActivity',
    'http://schemas.google.com/ReviewActivity'
]

TOKEN_INFO_ENDPOINT = ('https://www.googleapis.com/oauth2/v1/tokeninfo' +
    '?access_token=%s')
TOKEN_REVOKE_ENDPOINT = 'https://accounts.google.com/o/oauth2/revoke?token=%s'

FOLDERS_ATTR = {
            'Account': 'accounts_folder',
            'Contact': 'contacts_folder',
            'Lead': 'leads_folder',
            'Opportunity': 'opportunities_folder',
            'Case': 'cases_folder',
            'Show': 'shows_folder',
            'Feedback': 'feedbacks_folder'
        }
FOLDERS = {
            'Accounts': 'accounts_folder',
            'Contacts': 'contacts_folder',
            'Leads': 'leads_folder',
            'Opportunities': 'opportunities_folder',
            'Cases': 'cases_folder'
        }
folders = {}

class BaseHandler(webapp2.RequestHandler):
    def set_user_locale(self,language=None):
        if language:
            locale = self.request.GET.get('locale', 'en-US')
            i18n.get_i18n().set_locale(language)

        else:
            locale = self.request.GET.get('locale', 'en-US')
            i18n.get_i18n().set_locale('en')


    def prepare_template(self,template_name):
        is_admin = False
        template_values={
                  'is_admin':is_admin
                  }
        if self.session.get(SessionEnabledHandler.CURRENT_USER_SESSION_KEY) is not None:
            user = self.get_user_from_session()
            if user is not None:
                if user.email in ADMIN_EMAILS:
                    is_admin = True
                # Set the user locale from user's settings
                self.set_user_locale(user.language)
                tabs = user.get_user_active_tabs()

                # Set the user locale from user's settings
                self.set_user_locale(user.language)
                # Render the template
                active_app = user.get_user_active_app()
                apps = user.get_user_apps()
                is_business_user = bool(user.type=='business_user')
                applications = []
                for app in apps:
                    if app is not None:
                        applications.append(app)
                #text=i18n.gettext('Hello, world!')
                template_values={
                          'is_admin':is_admin,
                          'is_business_user':is_business_user,
                          'ME':user.google_user_id,
                          'active_app':active_app,
                          'apps':applications,
                          'tabs':tabs,
                          'organization_key':user.organization.urlsafe(),
                          'userInfo':user
                          }
        template = jinja_environment.get_template(template_name)
        self.response.out.write(template.render(template_values))

class SessionEnabledHandler(webapp2.RequestHandler):
    """Base type which ensures that derived types always have an HTTP session."""
    CURRENT_USER_SESSION_KEY = 'me'

    def dispatch(self):
        """Intercepts default request dispatching to ensure that an HTTP session
        has been created before calling dispatch in the base type.
        """
        # Get a session store for this request.
        self.session_store = sessions.get_store(request=self.request)
        try:
            # Dispatch the request.
            webapp2.RequestHandler.dispatch(self)
        finally:
            # Save all sessions.
            self.session_store.save_sessions(self.response)

    @webapp2.cached_property
    def session(self):
        """Returns a session using the default cookie key."""
        return self.session_store.get_session()

    def get_user_from_session(self):
        """Convenience method for retrieving the users crendentials from an
        authenticated session.
        """
        email = self.session.get(self.CURRENT_USER_SESSION_KEY)
        if email is None:
          raise UserNotAuthorizedException('Session did not contain user email.')
        user = model.User.get_by_email(email)
        return user

class UserNotAuthorizedException(Exception):
    msg = 'Unauthorized request.'

class NotFoundException(Exception):
    msg = 'Resource not found.'

class RevokeException(Exception):
    msg = 'Failed to revoke token for given user.'

class WelcomeHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        template_values = {}
        template = jinja_environment.get_template('templates/live/welcome.html')
        self.response.out.write(template.render(template_values))


class StripeHandler(BaseHandler,SessionEnabledHandler):
    def post(self):
       

        # Get the credit card details submitted by the form
        
        # Set your secret key: remember to change this to your live secret key in production
        # See your keys here https://dashboard.stripe.com/account
        stripe.api_key = "sk_test_4ZNpoS4mqf3YVHKVfQF7US1R"

        # Get the credit card details submitted by the form
        token = self.request.get('stripeToken')

        # Create a Customer
        customer = stripe.Customer.create(
            card=token,
            description="payinguser@example.com"
        )

        # Charge the Customer instead of the card
        stripe.Charge.create(
            amount=1000, # in cents
            currency="usd",
            customer=customer.id
        )

        # Save the customer ID in your database so you can use it later
        save_stripe_customer_id(user, customer.id)

        # Later...
        customer_id = get_stripe_customer_id(user)

        stripe.Charge.create(
            amount=1500, # $15.00 this time
            currency="usd",
            customer=customer_id
        )

class IndexHandler(BaseHandler,SessionEnabledHandler):
    def get(self):
        # Check if the user is loged-in, if not redirect him to the sign-in page
        if self.session.get(SessionEnabledHandler.CURRENT_USER_SESSION_KEY) is not None:
            try:
                user = self.get_user_from_session()
                if user.google_credentials is None:
                    self.redirect('/sign-in')
                # hadji hicham .09/09/2014.
                i_can_pass=False
                try: 
                    cust=stripe.Customer.retrieve(user.stripe_id)
                    subs=cust.subscriptions.all(limit=1)
                    for subscription in subs.data :
                        if subscription.status=="active":
                        
                            if datetime.datetime.fromtimestamp(int(subscription.current_period_end))>=datetime.datetime.now():
                               i_can_pass=True   
                            else:
                               i_can_pass=False
                except:
                    self.redirect("/payment")
                if i_can_pass==False:
                    self.redirect("/payment")
                logout_url = 'https://www.google.com/accounts/Logout?continue=https://appengine.google.com/_ah/logout?continue=http://www.iogrow.com/welcome/'
                if user is None or user.type=='public_user':
                    self.redirect('/welcome/')
                    return
                # Set the user locale from user's settings
                self.set_user_locale(user.language)
                uSerid = user.key.id()
                uSerlanguage = user.language
                apps = user.get_user_apps()
                admin_app = None
                active_app = user.get_user_active_app()
                tabs = user.get_user_active_tabs()
                applications = []
                for app in apps:
                    if app is not None:
                        applications.append(app)
                        if app.name=='admin':
                            admin_app = app

                template_values = {
                                  'tabs':tabs,
                                  'user':user,
                                  'logout_url' : logout_url,
                                  'CLIENT_ID': CLIENT_ID,
                                  'active_app':active_app,
                                  'apps': applications,
                                  'uSerid':uSerid,
                                  'uSerlanguage':uSerlanguage
                                }
                if admin_app:
                    template_values['admin_app']=admin_app
                template = jinja_environment.get_template('templates/base.html')
                self.response.out.write(template.render(template_values))
            except UserNotAuthorizedException as e:
                self.redirect('/welcome/')
        else:
            self.redirect('/welcome/')
class BlogHandler(BaseHandler,SessionEnabledHandler):
    def get(self):
        if self.session.get(SessionEnabledHandler.CURRENT_USER_SESSION_KEY) is not None:
            user = self.get_user_from_session()
            template_values = {'user':user}
        else:
            template_values = {}
        template = jinja_environment.get_template('templates/blog/blog_base.html')
        self.response.out.write(template.render(template_values))
class PublicArticlePageHandler(BaseHandler,SessionEnabledHandler):
    def get(self,id):
        article = Article.get_schema(id=id)
        template_values = {'article':article}
        template = jinja_environment.get_template('templates/blog/public_article_show.html')
        self.response.out.write(template.render(template_values))

class PublicSupport(BaseHandler,SessionEnabledHandler):
    def get(self):
        template_values = {}
        template = jinja_environment.get_template('templates/blog/public_support.html')
        self.response.out.write(template.render(template_values))
# Change the current app for example from sales to customer support
class ChangeActiveAppHandler(SessionEnabledHandler):
    def get(self,appid):
        new_app_id = int(appid)
        if self.session.get(SessionEnabledHandler.CURRENT_USER_SESSION_KEY) is not None:
            user = self.get_user_from_session()
            # get the active application before the change request
            active_app = user.get_user_active_app()
            new_active_app = model.Application.get_by_id(new_app_id)
            if new_active_app:
              if new_active_app.organization==user.organization:
                  user.set_user_active_app(new_active_app.key)
                  self.redirect(new_active_app.url)
              else:
                  self.redirect('/error')
            else:
                self.redirect('/')
        else:
            self.redirect('/sign-in')
class SignInHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        # Set the user locale from user's settings
        user_id = self.request.get('id')
        lang = self.request.get('language')
        self.set_user_locale(lang)
            # Render the template
        template_values = {
                            'CLIENT_ID': CLIENT_ID,
                            'ID' : user_id
                          }
        template = jinja_environment.get_template('templates/sign-in.html')
        self.response.out.write(template.render(template_values))

class EarlyBirdHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        # Set the user locale from user's settings
        user_id = self.request.get('id')
        lang = self.request.get('language')
        self.set_user_locale(lang)
            # Render the template
        template_values = {
                            'CLIENT_ID': CLIENT_ID,
                            'ID' : user_id
                          }
        template = jinja_environment.get_template('templates/early-bird.html')
        self.response.out.write(template.render(template_values))

class SignUpHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        if self.session.get(SessionEnabledHandler.CURRENT_USER_SESSION_KEY) is not None:
            user = self.get_user_from_session()
            template_values = {
              'userinfo': user,
              'CLIENT_ID': CLIENT_ID}
            template = jinja_environment.get_template('templates/sign-up.html')
            self.response.out.write(template.render(template_values))
        else:
            self.redirect('/sign-in')
    @ndb.toplevel
    def post(self):
        if self.session.get(SessionEnabledHandler.CURRENT_USER_SESSION_KEY) is not None:
            user = self.get_user_from_session()
            org_name = self.request.get('org_name')
            tags = self.request.get('tags')
            taskqueue.add(
                            url='/workers/add_to_iogrow_leads',
                            queue_name='iogrow-low',
                            params={
                                    'email': user.email,
                                    'organization': org_name,
                                    'tags': tags
                                    }
                        )
            model.Organization.create_instance(org_name,user)
            self.redirect('/payment?org_name='+org_name)
        else:
            self.redirect('/sign-in')

class PaymentHandler(BaseHandler, SessionEnabledHandler):
      def get(self):
         if self.session.get(SessionEnabledHandler.CURRENT_USER_SESSION_KEY) is not None:
            user = self.get_user_from_session()
            org_name = self.request.get('org_name')
            template_values={
                          'userinfo':user,
                          'org_name':org_name,
                          'CLIENT_ID': CLIENT_ID
                           }

            template = jinja_environment.get_template('templates/payment.html')
            self.response.out.write(template.render(template_values))
         else:
            self.redirect('/sign-in') 

class StartEarlyBird(BaseHandler, SessionEnabledHandler):
    def get(self):
        if self.session.get(SessionEnabledHandler.CURRENT_USER_SESSION_KEY) is not None:
            user = self.get_user_from_session()
            template_values = {
              'userinfo': user,
              'CLIENT_ID': CLIENT_ID}
            template = jinja_environment.get_template('templates/sign-up-early-bird.html')
            self.response.out.write(template.render(template_values))
        else:
            self.redirect('/early-bird')
    @ndb.toplevel
    def post(self):
        if self.session.get(SessionEnabledHandler.CURRENT_USER_SESSION_KEY) is not None:
            user = self.get_user_from_session()
            org_name = self.request.get('org_name')
            model.Organization.create_early_bird_instance(org_name,user)
            taskqueue.add(
                            url='/workers/add_to_iogrow_leads',
                            queue_name='iogrow-low',
                            params={
                                    'email': user.email,
                                    'organization': org_name
                                    }
                        )
            self.redirect('/')
        else:
            self.redirect('/early-bird')

class GooglePlusConnect(SessionEnabledHandler):
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
            user = model.User.get_by_id(user_id)
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
            profile =  model.Profile.query(
                                            model.Profile.name=='Standard User',
                                            model.Profile.organization==invited_by.organization
                                          ).get()
            model.Invitation.delete_by(user.email)
            user.init_user_config(invited_by.organization,profile.key)
        else:
            user = model.User.get_by_email(email)
        if user is None:
            userinfo = GooglePlusConnect.get_user_profile(credentials)
            user = model.User()
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

    def post(self):
        #try to get the user credentials from the code
        credentials = None
        code = self.request.get("code")
        try:
            credentials = GooglePlusConnect.exchange_code(code)
        except FlowExchangeError:
            return
        token_info = GooglePlusConnect.get_token_info(credentials)
        if token_info.status_code != 200:
            return
        token_info = json.loads(token_info.content)
        # If there was an error in the token info, abort.
        if token_info.get('error') is not None:
            return
        # Make sure the token we got is for our app.
        expr = re.compile("(\d*)(.*).apps.googleusercontent.com")
        issued_to_match = expr.match(token_info.get('issued_to'))
        local_id_match = expr.match(CLIENT_ID)
        if (not issued_to_match
            or not local_id_match
            or issued_to_match.group(1) != local_id_match.group(1)):
            return
        #Check if is it an invitation to sign-in or just a simple sign-in
        invited_user_id = None
        invited_user_id_request = self.request.get("id")
        if invited_user_id_request:
            invited_user_id = long(invited_user_id_request)
        #user = model.User.query(model.User.google_user_id == token_info.get('user_id')).get()

        # Store our credentials with in the datastore with our user.
        if invited_user_id:
            user = GooglePlusConnect.save_token_for_user(
                                                        token_info.get('email'),
                                                        credentials,
                                                        invited_user_id
                                                      )
        else:
            user = GooglePlusConnect.save_token_for_user(
                                                        token_info.get('email'),
                                                        credentials
                                                      )
        # if user doesn't have organization redirect him to sign-up
        isNewUser = False
        if user.organization is None:
            isNewUser = True
        # Store the user ID in the session for later use.
        self.session[self.CURRENT_USER_SESSION_KEY] = user.email
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps(isNewUser))

class ArticleSearchHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/articles/article_search.html')

class ArticleListHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/articles/article_list.html')

class ArticleShowHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/articles/article_show.html')
class ArticleNewHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/articles/article_new.html')

class AccountListHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/accounts/account_list.html')

class AccountShowHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/accounts/account_show.html')
class DiscoverListHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/discovers/discover_list.html')
class DiscoverShowHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/discovers/discover_show.html')
class DiscoverNewHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/discovers/discover_new.html')

class AccountNewHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/accounts/account_new.html')

class ContactListHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/contacts/contact_list.html')

class ContactShowHandler(BaseHandler,SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/contacts/contact_show.html')

class ContactNewHandler(BaseHandler,SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/contacts/contact_new.html')

class OpportunityListHandler(BaseHandler,SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/opportunities/opportunity_list.html')

class OpportunityShowHandler(BaseHandler,SessionEnabledHandler):
    def get (self):
        self.prepare_template('templates/opportunities/opportunity_show.html')

class OpportunityNewHandler(BaseHandler,SessionEnabledHandler):
    def get (self):
        self.prepare_template('templates/opportunities/opportunity_new.html')

class LeadListHandler(BaseHandler,SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/leads/lead_list.html')

class LeadShowHandler(BaseHandler,SessionEnabledHandler):
    def get (self):
        self.prepare_template('templates/leads/lead_show.html')

class LeadNewHandler(BaseHandler,SessionEnabledHandler):
    def get (self):
        self.prepare_template('templates/leads/lead_new.html')

class CaseNewHandler(BaseHandler,SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/cases/case_new.html')

class CaseListHandler(BaseHandler,SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/cases/case_list.html')

class CaseShowHandler(BaseHandler,SessionEnabledHandler):
    def get (self):
        self.prepare_template('templates/cases/case_show.html')

class NeedShowHandler(BaseHandler,SessionEnabledHandler):
    def get (self):
        self.prepare_template('templates/needs/show.html')

class NoteShowHandler (BaseHandler,SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/accounts/note_show.html')

class DocumentShowHandler(BaseHandler,SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/documents/show.html')

class AllTasksHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/activities/all_tasks.html')

class TaskShowHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/activities/task_show.html')

class EventShowHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/activities/event_show.html')

class ShowListHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/live/shows/list_show.html')

class ShowShowHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/live/shows/show.html')

class UserListHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/admin/users/user_list.html')
class UserNewHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/admin/users/user_new.html')

class UserShowHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/admin/users/user_show.html')
class GroupListHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/admin/groups/list.html')

class GroupShowHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/admin/groups/show.html')

class settingsShowHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/admin/settings/settings.html')
class ImportListHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/admin/imports/import_list.html')
class ImportNewHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/admin/imports/import_new.html')

class SearchListHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/search/list.html')
class CalendarShowHandler(BaseHandler,SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/calendar/calendar_show.html')
# hadji hicham 07/08/2014 
class BillingListHandler(BaseHandler,SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/billing/billing_list.html')
# hadji hicham  11/08/2014
class BillingShowHandler(BaseHandler,SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/billing/billing_show.html')

class SalesforceImporter(BaseHandler, SessionEnabledHandler):
    def get(self):
        flow = sfoauth2.SalesforceOAuth2WebServerFlow(
            client_id='3MVG9QDx8IX8nP5SiRx6WcZGt_urvZZKtoKdTRn0h_ITamehH.ndEUTVBGZhyKJKnWdxun.jnZj0dbzCJNydO',
            client_secret='8317004383056291259',
            scope=['full'] ,
            redirect_uri='http://localhost:8090/sfoauth2callback'
        )
        authorization_url = flow.step1_get_authorize_url()
        self.redirect(authorization_url)
class SalesforceImporterCallback(BaseHandler, SessionEnabledHandler):
    def get(self):
        if self.session.get(SessionEnabledHandler.CURRENT_USER_SESSION_KEY) is not None:
            user = self.get_user_from_session()
            if user is not None:
                flow = sfoauth2.SalesforceOAuth2WebServerFlow(
                    client_id='3MVG9QDx8IX8nP5SiRx6WcZGt_urvZZKtoKdTRn0h_ITamehH.ndEUTVBGZhyKJKnWdxun.jnZj0dbzCJNydO',
                    client_secret='8317004383056291259',
                    scope=['full'] ,
                    redirect_uri='http://localhost:8090/sfoauth2callback'
                )
                code = self.request.get('code')
                credentials = flow.step2_exchange(code)
                http = httplib2.Http()
                credentials.authorize(http)
                sf_objects={}
                SfImporterHelper.import_accounts(user,http,sf_objects)
                SfImporterHelper.import_contacts(user,http,sf_objects)
                SfImporterHelper.import_opportunities(user,http,sf_objects)
                SfImporterHelper.import_cases(user,http,sf_objects)
                SfImporterHelper.import_leads(user,http,sf_objects)





# Workers
class CreateOrganizationFolders(webapp2.RequestHandler):
    @staticmethod
    def init_drive_folder(http,driveservice,folder_name,parent=None):
        folder = {
                'title': folder_name,
                'mimeType': 'application/vnd.google-apps.folder'
        }
        if parent:
            folder['parents'] = [{'id': parent}]
        try:
            created_folder = driveservice.files().insert(fields='id',body=folder).execute()
            return created_folder['id']
        except errors.HttpError, error:
            print 'An error occured: %s' % error
            return None

    @staticmethod
    def folder_created_callback(request_id, response, exception):
        global folders
        if exception is not None:
            # Do something with the exception
            pass
        else:
            # Do something with the response
            folder_name = response['title']
            folders[folder_name] = response['id']

    def post(self): # should run at most 1/s due to entity group limit
        admin = model.User.get_by_email(self.request.get('email'))
        credentials = admin.google_credentials
        org_key_str = self.request.get('org_key')
        org_key = ndb.Key(urlsafe=org_key_str)
        organization = org_key.get()
        http = credentials.authorize(httplib2.Http(memcache))
        driveservice = build('drive', 'v2', http=http)
        # init the root folder
        org_folder = self.init_drive_folder(http,driveservice,organization.name+' (ioGrow)')
        # init objects folders
        batch = BatchHttpRequest()
        for folder_name in FOLDERS.keys():
            folder = {
                    'title': folder_name,
                    'mimeType': 'application/vnd.google-apps.folder',
                    'parents' : [{'id': org_folder}]
            }
            batch.add(driveservice.files().insert(
                                                fields='id,title',
                                                body=folder),
                                                callback=self.folder_created_callback
                                                )
        batch.execute(http=http)
        organization.org_folder = org_folder
        for folder_name in FOLDERS.keys():
            if folder_name in folders.keys():
                setattr(organization, FOLDERS[folder_name], folders[folder_name])
        organization.put()

class CreateContactsGroup(webapp2.RequestHandler):
    @ndb.toplevel
    def post(self):
        email = self.request.get('email')
        user = model.User.get_by_email(email)
        contacts_group_id = EndpointsHelper.create_contact_group(user.google_credentials)
        user.google_contacts_group = contacts_group_id
        user.put_async()
        model.User.memcache_update(user,email)

class SyncContact(webapp2.RequestHandler):
    @ndb.toplevel
    def post(self):
        # get request params
        email = self.request.get('email')
        id = self.request.get('id')
        user = model.User.get_by_email(email)

        # sync contact
        #Contact.sync_with_google_contacts(user,id)

class CreateObjectFolder(webapp2.RequestHandler):
    @staticmethod
    def insert_folder(user, folder_name, kind,logo_img_id=None):
        try:
            credentials = user.google_credentials
            http = credentials.authorize(httplib2.Http(memcache))
            service = build('drive', 'v2', http=http)
            organization = user.organization.get()

            # prepare params to insert
            folder_params = {
                        'title': folder_name,
                        'mimeType':  'application/vnd.google-apps.folder'
            }#get the accounts_folder or contacts_folder or ..
            parent_folder = eval('organization.'+FOLDERS_ATTR[kind])
            if parent_folder:
                folder_params['parents'] = [{'id': parent_folder}]

            created_folder = service.files().insert(body=folder_params,fields='id').execute()
            # move the image to the created folder
            if logo_img_id:
                params = {
                      'parents': [{'id': created_folder['id']}]
                    }
                service.files().patch(
                                    fileId=logo_img_id,
                                    body=params,
                                    fields='id').execute()
        except:
            raise endpoints.UnauthorizedException(EndpointsHelper.INVALID_GRANT)

        return created_folder
    @ndb.toplevel
    def post(self):
        folder_name = self.request.get('folder_name')
        kind = self.request.get('kind')
        user = model.User.get_by_email(self.request.get('email'))
        logo_img_id = self.request.get('logo_img_id')
        if logo_img_id == 'None':
            logo_img_id = None
        created_folder = self.insert_folder(user,folder_name,kind,logo_img_id)
        object_key_str = self.request.get('obj_key')
        object_key = ndb.Key(urlsafe=object_key_str)
        obj = object_key.get()
        obj.folder = created_folder['id']
        obj.put_async()

class SyncCalendarEvent(webapp2.RequestHandler):
    def post(self):
        user_from_email = model.User.get_by_email(self.request.get('email'))
        starts_at = datetime.datetime.strptime(
                                              self.request.get('starts_at'),
                                              "%Y-%m-%dT%H:%M:00.000000"
                                              )
        summary = self.request.get('summary')
        location = self.request.get('location')
        ends_at = datetime.datetime.strptime(
                                              self.request.get('ends_at'),
                                              "%Y-%m-%dT%H:%M:00.000000"
                                              )
        event=Event.getEventById(self.request.get('event_id'))
        try:
            credentials = user_from_email.google_credentials
            http = credentials.authorize(httplib2.Http(memcache))
            service = build('calendar', 'v3', http=http)
            # prepare params to insert
            params = {
                 "start":
                  {
                    "dateTime": starts_at.strftime("%Y-%m-%dT%H:%M:00.000+01:00")
                  },
                 "end":
                  {
                    "dateTime": ends_at.strftime("%Y-%m-%dT%H:%M:00.000+01:00")
                  },
                  "summary": summary
            }

            created_event = service.events().insert(calendarId='primary',body=params).execute()
            event.event_google_id=created_event['id']
            event.put()
        except:
            raise endpoints.UnauthorizedException('Invalid grant' )


# syncronize tasks with google calendar . hadji hicham 10-07-2014.
class SyncCalendarTask(webapp2.RequestHandler):
    def post(self):
        user_from_email = model.User.get_by_email(self.request.get('email'))
        starts_at = datetime.datetime.strptime(
                                              self.request.get('starts_at'),
                                              "%Y-%m-%dT%H:%M:00.000000"
                                              )
        summary = self.request.get('summary')
        location = self.request.get('location')
        ends_at = datetime.datetime.strptime(
                                              self.request.get('ends_at'),
                                              "%Y-%m-%dT%H:%M:00.000000"
                                              )
        task=Task.getTaskById(self.request.get('task_id'))
        credentials = user_from_email.google_credentials
        http = credentials.authorize(httplib2.Http(memcache))
        service = build('calendar', 'v3', http=http)
            # prepare params to insert
        params = {
                 "start":
                  {
                    "date": starts_at.strftime("%Y-%m-%d")
                  },
                 "end":
                  {
                    "date": ends_at.strftime("%Y-%m-%d")
                  },
                  "summary": summary,
            }

        created_task = service.events().insert(calendarId='primary',body=params).execute()
        task.task_google_id=created_task['id']
        task.put()


class SyncPatchCalendarEvent(webapp2.RequestHandler):
    def post(self):
        user_from_email = model.User.get_by_email(self.request.get('email'))
        starts_at = datetime.datetime.strptime(
                                              self.request.get('starts_at'),
                                              "%Y-%m-%dT%H:%M:00.000000"
                                              )
        summary = self.request.get('summary')
        location = self.request.get('location')
        ends_at = datetime.datetime.strptime(
                                              self.request.get('ends_at'),
                                              "%Y-%m-%dT%H:%M:00.000000"
                                              )
        event_google_id= self.request.get('event_google_id')
        try:
            credentials = user_from_email.google_credentials
            http = credentials.authorize(httplib2.Http(memcache))
            service = build('calendar', 'v3', http=http)
            # prepare params to insert
            params = {
                 "start":
                  {
                    "dateTime": starts_at.strftime("%Y-%m-%dT%H:%M:00.000+01:00")
                  },
                 "end":
                  {
                    "dateTime": ends_at.strftime("%Y-%m-%dT%H:%M:00.000+01:00")
                  },
                  "summary": summary
                  }

            patched_event = service.events().patch(calendarId='primary',eventId=event_google_id,body=params).execute()
        except:
            raise endpoints.UnauthorizedException('Invalid grant' )

# syncronize tasks with google calendar . hadji hicham 10-07-2014.
class SyncPatchCalendarTask(webapp2.RequestHandler):
    def post(self):
        user_from_email = model.User.get_by_email(self.request.get('email'))
        starts_at = datetime.datetime.strptime(
                                              self.request.get('starts_at'),
                                              "%Y-%m-%dT%H:%M:00.000000"
                                              )
        summary = self.request.get('summary')
        location = self.request.get('location')
        ends_at = datetime.datetime.strptime(
                                              self.request.get('ends_at'),
                                              "%Y-%m-%dT%H:%M:00.000000"
                                              )
        task_google_id= self.request.get('task_google_id')
        try:
            credentials = user_from_email.google_credentials
            http = credentials.authorize(httplib2.Http(memcache))
            service = build('calendar', 'v3', http=http)
            # prepare params to insert
            params = {
                 "start":
                  {
                    "date": starts_at.strftime("%Y-%m-%d")
                  },
                 "end":
                  {
                    "date": ends_at.strftime("%Y-%m-%d")
                  },
                  "summary": summary
                  }


            patched_event = service.events().patch(calendarId='primary',eventId=task_google_id,body=params).execute()
        except:
            raise endpoints.UnauthorizedException('Invalid grant' )

# sync delete events with google calendar . hadjo hicham 09-08-2014
class SyncDeleteCalendarEvent(webapp2.RequestHandler):
    def post(self):
        user_from_email = model.User.get_by_email(self.request.get('email'))
        event_google_id= self.request.get('event_google_id')
        try:
            credentials = user_from_email.google_credentials
            http = credentials.authorize(httplib2.Http(memcache))
            service = build('calendar', 'v3', http=http)
            # prepare params to insert
            patched_event = service.events().delete(calendarId='primary',eventId=event_google_id).execute()
        except:
            raise endpoints.UnauthorizedException('Invalid grant' )

# sync delete tasks with google calendar . hadji hicham 06-09-2014
class SyncDeleteCalendarTask(webapp2.RequestHandler):
    def post(self):
        print "*******come over here************"
        print "i'm deleting "
        print "**********************************"
        user_from_email = model.User.get_by_email(self.request.get('email'))
        task_google_id= self.request.get('task_google_id')
        try:
            credentials = user_from_email.google_credentials
            http = credentials.authorize(httplib2.Http(memcache))
            service = build('calendar', 'v3', http=http)
            # prepare params to insert
            patched_event = service.events().delete(calendarId='primary',eventId=task_google_id).execute()
        except:
            raise endpoints.UnauthorizedException('Invalid grant')

class AddToIoGrowLeads(webapp2.RequestHandler):
    def post(self):
        user_from_email = model.User.get_by_email('tedj.meabiou@gmail.com')
        lead = model.User.get_by_email(self.request.get('email'))
        company = self.request.get('organization')
        email = iomessages.EmailSchema(email=lead.email)
        emails = []
        emails.append(email)
        colors=["#F7846A","#FFBB22","#EEEE22","#BBE535","#66CCDD","#B5C5C5","#77DDBB","#E874D6"]
        tags=list()
        tags=(self.request.get('tags').split())
        for tag in tags:
            tag=tag.replace("#","")
            tag=tag.replace(",","")
            tagschema=Tag()
            tagschema.organization = user_from_email.organization
            tagschema.owner = user_from_email.google_user_id
            tagschema.name=tag
            tagschema.about_kind="topics"
            tagschema.color=random.choice(colors)
            tagschema.put()
        
        request = LeadInsertRequest(
                                    firstname = lead.google_display_name.split()[0],
                                    lastname = " ".join(lead.google_display_name.split()[1:]),
                                    emails = emails,
                                    profile_img_url = lead.google_public_profile_photo_url,
                                    company = company,
                                    access = 'public'
        )
        Lead.insert(user_from_email,request)
class GetFromLinkedinToIoGrow(webapp2.RequestHandler):
    def post(self):
        entityKey= self.request.get('entityKey')
        linkedin=linked_in()
        key1=ndb.Key(urlsafe=entityKey)
        lead=key1.get()
        keyword= lead.firstname+" "+lead.lastname+" "
        if lead.company:
            keyword=keyword+lead.company
        print keyword
        profil=linkedin.scrape_linkedin(keyword)
        if profil:
            pli=model.LinkedinProfile()
            pli.formations=profil["formations"]
            pli.firstname=profil["firstname"]
            pli.lastname=profil["lastname"]
            pli.industry=profil["industry"]
            pli.locality=profil["locality"]
            pli.headline=profil["headline"]
            pli.relation=profil["relation"]
            pli.resume=profil["resume"]
            pli.current_post=profil["current_post"]
            pli.past_post=profil["past_post"]
            pli.certifications=json.dumps(profil["certifications"])
            pli.experiences=json.dumps(profil["experiences"])
            pli.skills=profil["skills"]
            pli.url=profil["url"]
            key2=pli.put()
            es=Edge.insert(start_node=key1,end_node=key2,kind='linkedin',inverse_edge='parents')
class GetCompanyFromLinkedinToIoGrow(webapp2.RequestHandler):
    def post(self):
        entityKey= self.request.get('entityKey')
        linkedin=linked_in()
        key1=ndb.Key(urlsafe=entityKey)
        account=key1.get()
        print account
        profil=linkedin.scrape_company(account.name)
        if profil:
            pli=model.LinkedinCompany()
            pli.name=profil["name"]
            pli.website=profil["website"]
            pli.industry=profil["industry"]
            pli.headquarters=profil["headquarters"]
            pli.summary=profil["summary"]
            pli.founded=profil["founded"]
            pli.followers=profil["followers"]
            pli.logo=profil["logo"]
            pli.specialties=profil["specialties"]
            pli.top_image=profil["top_image"]
            pli.type=profil["type"]
            pli.company_size=profil["company_size"]
            pli.url=profil["url"]
            pli.workers=json.dumps(profil["workers"])
            key2=pli.put()
            es=Edge.insert(start_node=key1,end_node=key2,kind='linkedin',inverse_edge='parents')
class GetFromTwitterToIoGrow(webapp2.RequestHandler):
    def post(self):
        entityKey= self.request.get('entityKey')
        linkedin=linked_in()
        print entityKey
        key1=ndb.Key(urlsafe=entityKey)
        print key1
        lead=key1.get()
        fullname= lead.firstname+" "+lead.lastname
        print fullname
        linkedin=linked_in()
        screen_name=linkedin.scrape_twitter(lead.firstname,lead.lastname)
        print screen_name
        name=screen_name[screen_name.find("twitter.com/")+12:]
        print name
        profile_schema=EndpointsHelper.twitter_import_people(name)
        if profile_schema:
            d=(profile_schema.name).lower()
            if lead.firstname in d and lead.lastname in d :
                profile=model.TwitterProfile()
                profile.id=profile_schema.id
                profile.followers_count=profile_schema.followers_count
                profile.lang=profile_schema.lang
                profile.last_tweet_text=profile_schema.last_tweet_text
                profile.last_tweet_favorite_count=profile_schema.last_tweet_favorite_count
                profile.last_tweet_retweeted=profile_schema.last_tweet_retweeted
                profile.last_tweet_retweet_count=profile_schema.last_tweet_retweet_count
                profile.language=profile_schema.language
                profile.created_at=profile_schema.created_at
                profile.nbr_tweets=profile_schema.nbr_tweets
                profile.description_of_user=profile_schema.description_of_user
                profile.friends_count=profile_schema.friends_count
                profile.name=profile_schema.name
                profile.screen_name=profile_schema.screen_name
                profile.url_of_user_their_company=profile_schema.url_of_user_their_company
                profile.location=profile_schema.location
                profile.profile_image_url_https=profile_schema.profile_image_url_https

                key2=profile.put()
                ed=Edge.insert(start_node=key1,end_node=key2,kind='twitter',inverse_edge='parents')


        


class ShareDocument(webapp2.RequestHandler):
    def post(self):
        email = self.request.get('email')
        doc_id = self.request.get('doc_id')
        resource_id = self.request.get('resource_id')
        user_email = self.request.get('user_email')
        access = self.request.get('access')
        if access=='anyone':
            # public
            owner = model.User.get_by_email(user_email)
            credentials = owner.google_credentials
            http = credentials.authorize(httplib2.Http(memcache))
            service = build('drive', 'v2', http=http)
            # prepare params to insert
            params = {
                      'role': 'reader',
                      'type': 'anyone'
                      }
            service.permissions().insert(
                                        fileId=resource_id,
                                        body=params,
                                        sendNotificationEmails=False,
                                        fields='id').execute()
        else:
            document = Document.get_by_id(int(doc_id))
            if document:

                    owner = model.User.get_by_gid(document.owner)
                    if owner.email != email:
                        credentials = owner.google_credentials
                        http = credentials.authorize(httplib2.Http(memcache))
                        service = build('drive', 'v2', http=http)
                        # prepare params to insert
                        params = {
                                      'role': 'writer',
                                      'type': 'user',
                                      'value':email
                                    }
                        service.permissions().insert(
                                                        fileId=document.resource_id,
                                                        body=params,
                                                        sendNotificationEmails=False,
                                                        fields='id').execute()


class InitPeerToPeerDrive(webapp2.RequestHandler):
    def post(self):
        invited_by_email = self.request.get('invited_by_email')
        email = self.request.get('email')
        user = model.User.get_by_email(email)
        invited_by = model.User.get_by_email(invited_by_email)
        documents = Document.query(
                                  Document.organization == invited_by.organization,
                                  Document.access=='public'
                                  ).fetch()
        for document in documents:
            taskqueue.add(
                            url='/workers/sharedocument',
                            queue_name='iogrow-low',
                            params={
                                    'email': email,
                                    'doc_id': str(document.key.id())
                                    }
                        )
class ShareObjectDocuments(webapp2.RequestHandler):
    def post(self):
        obj_key_str = self.request.get('obj_key_str')
        parent_key = ndb.Key(urlsafe=obj_key_str)
        email = self.request.get('email')
        documents = Document.list_by_parent(parent_key)
        for document in documents.items:
            taskqueue.add(
                            url='/workers/sharedocument',
                            queue_name='iogrow-low',
                            params={
                                    'email': email,
                                    'doc_id': document.id
                                    }
                        )
class SyncDocumentWithTeam(webapp2.RequestHandler):
    def post(self):
        user_email = self.request.get('user_email')
        doc_id = self.request.get('doc_id')
        parent_key_str = self.request.get('parent_key_str')
        parent_key = ndb.Key(urlsafe=parent_key_str)
        parent = parent_key.get()
        collaborators = []
        if parent.access == 'public':
            collaborators = model.User.query(model.User.organization==parent.organization)
        elif parent.access == 'private':
            # list collborators who have access
            acl = EndpointsHelper.who_has_access(parent_key)
            collaborators = acl['collaborators']
            if acl['owner'] is not None:
                collaborators.append(acl['owner'])
        for collaborator in collaborators:
            if collaborator.email != user_email :
                taskqueue.add(
                                url='/workers/sharedocument',
                                queue_name='iogrow-low',
                                params={
                                        'email': collaborator.email,
                                        'doc_id': doc_id
                                        }
                            )
class SendEmailNotification(webapp2.RequestHandler):
    def post(self):
        user_email = self.request.get('user_email')
        to = self.request.get('to')
        subject = self.request.get('subject')
        body = self.request.get('body')
        sender_address = "ioGrow notifications <notifications@gcdc2013-iogrow.appspotmail.com>"
        message = mail.EmailMessage()
        message.sender = sender_address
        message.to = to
        message.subject = subject
        message.html = body
        message.reply_to = user_email
        message.send()

class SendGmailEmail(webapp2.RequestHandler):
    def post(self):
        user = model.User.get_by_email(self.request.get('email'))
        credentials = user.google_credentials
        http = credentials.authorize(httplib2.Http(memcache))
        service = build('gmail', 'v1', http=http)
        cc = None
        bcc = None
        if self.request.get('cc') !='None':
            cc = self.request.get('cc')
        if self.request.get('bcc') !='None':
            bcc = self.request.get('bcc')
        message = EndpointsHelper.create_message(
                                                  user.email,
                                                  self.request.get('to'),
                                                  cc,
                                                  bcc,
                                                  self.request.get('subject'),
                                                  self.request.get('body')
                                                )
        EndpointsHelper.send_message(service,'me',message)

# paying with stripe 
class StripePayingHandler(BaseHandler,SessionEnabledHandler):
      def get(self):
          # the secret key .
          # get the token from the client form 
          token= self.request.get('stripeToken')
          print "**************************"
          print token 
          print "****************************"
          # # charging operation after the payment 
          # try:
           
          # except stripe.CardError, e:
          #        # The card has been declined
          #        pass






routes = [
    # Task Queues Handlers
    ('/workers/initpeertopeerdrive',InitPeerToPeerDrive),
    ('/workers/sharedocument',ShareDocument),
    ('/workers/shareobjectdocument',ShareObjectDocuments),
    ('/workers/syncdocumentwithteam',SyncDocumentWithTeam),
    ('/workers/createorgfolders',CreateOrganizationFolders),
    ('/workers/createobjectfolder',CreateObjectFolder),
    ('/workers/createcontactsgroup',CreateContactsGroup),
    ('/workers/sync_contacts',SyncContact),
    ('/workers/send_email_notification',SendEmailNotification),
    ('/workers/add_to_iogrow_leads',AddToIoGrowLeads),
    ('/workers/get_from_linkedin',GetFromLinkedinToIoGrow),
    ('/workers/get_company_from_linkedin',GetCompanyFromLinkedinToIoGrow),
    ('/workers/get_from_twitter',GetFromTwitterToIoGrow),
    ('/workers/send_gmail_message',SendGmailEmail),

    # tasks sync  hadji hicham 06/08/2014 queue_name='iogrow-tasks'
    ('/workers/synctask',SyncCalendarTask),
    ('/workers/syncpatchtask',SyncPatchCalendarTask),
    ('/workers/syncdeletetask',SyncDeleteCalendarTask),
    #Event  sync . hadji hicham 06/08/2014 queue_name= 'iogrow-events'
    ('/workers/syncevent',SyncCalendarEvent),
    ('/workers/syncpatchevent',SyncPatchCalendarEvent),
    ('/workers/syncdeleteevent',SyncDeleteCalendarEvent),
    #
    ('/',IndexHandler),
    ('/blog',BlogHandler),
    ('/support',PublicSupport),
    (r'/blog/articles/(\d+)', PublicArticlePageHandler),
    ('/views/articles/list',ArticleListHandler),
    ('/views/articles/show',ArticleShowHandler),
    ('/views/articles/new',ArticleNewHandler),
    ('/views/articles/search',ArticleSearchHandler),

    # Templates Views Routes
    ('/views/discovers/list',DiscoverListHandler),
    ('/views/discovers/show',DiscoverShowHandler),
    ('/views/discovers/new',DiscoverNewHandler),
    # Accounts Views
    ('/views/accounts/list',AccountListHandler),
    ('/views/accounts/show',AccountShowHandler),
    ('/views/accounts/new',AccountNewHandler),
    # Contacts Views
    ('/views/contacts/list',ContactListHandler),
    ('/views/contacts/show',ContactShowHandler),
    ('/views/contacts/new',ContactNewHandler),
    # Shows Views
    ('/views/shows/list',ShowListHandler),
    ('/views/shows/show',ShowShowHandler),

    # Opportunities Views
    ('/views/opportunities/list',OpportunityListHandler),
    ('/views/opportunities/show',OpportunityShowHandler),
    ('/views/opportunities/new',OpportunityNewHandler),

    # Leads Views
    ('/views/leads/list',LeadListHandler),
    ('/views/leads/show',LeadShowHandler),
    ('/views/leads/new',LeadNewHandler),
    # Cases Views
    ('/views/cases/list',CaseListHandler),
    ('/views/cases/show',CaseShowHandler),
    ('/views/cases/new',CaseNewHandler),

    # Needs Views
    ('/views/needs/show',NeedShowHandler),

    # Notes, Documents, Taks, Events, Search Views
    ('/views/notes/show',NoteShowHandler),
    ('/views/documents/show',DocumentShowHandler),

    ('/views/search/list',SearchListHandler),
    ('/views/tasks/show',TaskShowHandler),
    ('/views/tasks/list',AllTasksHandler),
    ('/views/events/show',EventShowHandler),
     ('/views/calendar/show',CalendarShowHandler),
    # Admin Console Views
    ('/views/admin/users/list',UserListHandler),
    ('/views/admin/users/new',UserNewHandler),
    ('/views/admin/users/show',UserShowHandler),
    ('/views/admin/groups/list',GroupListHandler),
    ('/views/admin/groups/show',GroupShowHandler),
    ('/views/admin/settings',settingsShowHandler),
    ('/views/admin/imports/list',ImportListHandler),
    ('/views/admin/imports/new',ImportNewHandler),
    #billing stuff. hadji hicham . 07/08/2014
    ('/views/billing/list',BillingListHandler),
    ('/views/billing/show',BillingShowHandler),

    # Applications settings
    (r'/apps/(\d+)', ChangeActiveAppHandler),
    # ioGrow Live
    ('/welcome/',WelcomeHandler),
    # Authentication Handlers
    ('/early-bird',SignInHandler),
    ('/start-early-bird-account',StartEarlyBird),
    ('/sign-in',SignInHandler),
    ('/sign-up',SignUpHandler),
    ('/gconnect',GooglePlusConnect),
    ('/sfimporter',SalesforceImporter),
    ('/sfoauth2callback',SalesforceImporterCallback),
    ('/stripe',StripeHandler),
    # paying with stripe
    ('/paying',StripePayingHandler),
    ('/payment',PaymentHandler)

    ]
config = {}
config['webapp2_extras.sessions'] = {
    'secret_key': 'YOUR_SESSION_SECRET'
}
# to config the local directory the way we want .
# config['webapp2_extras.i18n'] = {
#     'translations_path': 'path/to/my/locale/directory',
# }
app = webapp2.WSGIApplication(routes, config=config, debug=True)

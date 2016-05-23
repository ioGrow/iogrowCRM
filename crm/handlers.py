import datetime
import json
import logging
import os
import re
import sys
import time

import endpoints
import httplib2
import jinja2
import requests
import sfoauth2
import stripe
import webapp2
from apiclient.discovery import build
from google.appengine.api import mail
from google.appengine.api import memcache
from google.appengine.api import taskqueue
from google.appengine.api import urlfetch
from google.appengine.ext import ndb
from intercom import Intercom
from iomodels.accounts import Account
from iomodels.contacts import Contact
from iomodels.documents import Document
from iomodels.events import Event
from iomodels.leads import LeadInsertRequest, Lead
from iomodels.opportunities import Opportunity
from iomodels.payment import Subscription
from iomodels.tasks import Task, AssignedGoogleId
from mixpanel import Mixpanel
from oauth2client.appengine import OAuth2Decorator
from oauth2client.client import FlowExchangeError
from oauth2client.client import flow_from_clientsecrets
from requests.auth import HTTPBasicAuth
from webapp2_extras import i18n
from webapp2_extras import sessions

import iomessages
import model
from crm.iomodels.cases import Case
from endpoints_helper import EndpointsHelper
from iograph import Edge
from iomodels import config as app_config
from model import Application, STANDARD_TABS, ADMIN_TABS, Organization

mp = Mixpanel('793d188e5019dfa586692fc3b312e5d1')

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'libs'))
Intercom.app_id = 's9iirr8w'
Intercom.api_key = 'ae6840157a134d6123eb95ab0770879367947ad9'
jinja_environment = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.getcwd()),
    extensions=['jinja2.ext.i18n'], cache_size=0)
jinja_environment.install_gettext_translations(i18n)

sfoauth2.SF_INSTANCE = 'na12'

ADMIN_EMAILS = ['tedj.meabiou@gmail.com', 'hakim@iogrow.com']

CLIENT_ID = json.loads(
    open('config/client_secrets.json', 'r').read())['web']['client_id_online']

CLIENT_SECRET = json.loads(
    open('config/client_secrets.json', 'r').read())['web']['client_secret']

SCOPES = [
    'https://mail.google.com https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/plus.profile.emails.read https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/calendar'
]
DEOCORATOR_SCOPES = [
    'https://www.googleapis.com/auth/userinfo.email https://mail.google.com https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/plus.profile.emails.read https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/calendar']
decorator = OAuth2Decorator(
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    scope=DEOCORATOR_SCOPES,
    access_type='online'
)

IOGROW_MINIMAL_SCOPE = [
    'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/plus.profile.emails.read']
iogrow_decorator = OAuth2Decorator(
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    scope=DEOCORATOR_SCOPES,
    access_type='online'
)

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
    def set_user_locale(self, language=None):
        i18n.get_i18n().set_locale(language if language else 'en_US')

    def prepare_template(self, template_name):
        is_admin = False
        is_owner = False
        template_values = {
            'is_admin': is_admin
        }
        admin_app = None
        if self.session.get(SessionEnabledHandler.CURRENT_USER_SESSION_KEY) is not None:
            user = self.get_user_from_session()
            default_currency = model.User.get_default_currency(user)
            if default_currency == None:
                default_currency = model.CountryCurrency.get_by_code('US')
            currency_format = model.User.get_currency_format(user)
            if currency_format == None:
                currency_format = model.CountryCurrency.get_by_code('US')

            if user is not None:
                # find out if the user is admin or no
                is_not_a_life_time = True
                is_freemium = True
                if template_name == "templates/admin/users/user_list.html":
                    organization = user.organization.get()
                    if organization.owner == user.google_user_id:
                        is_owner = True
                    if Edge.find(user.organization, [user.key], 'admins', "AND"):
                        is_admin = True
                    else:
                        is_admin = False
                    plan = organization.plan.get()
                    if plan.name == "life_time_free":
                        is_not_a_life_time = False
                    if plan.name == "preemium":
                        is_freemium = False

                # if user.email in ADMIN_EMAILS:
                #     is_admin = True
                # Set the user locale from user's settings
                self.set_user_locale(user.language)
                tabs = user.get_user_active_tabs()

                # Set the user locale from user's settings
                self.set_user_locale(user.language)
                # Render the template
                active_app = user.get_user_active_app()
                apps = user.get_user_apps()
                is_business_user = bool(user.type == 'business_user')
                applications = []
                for app in apps:
                    if app is not None:
                        applications.append(app)
                        if app.name == 'admin':
                            admin_app = app

                # prepare custom_fields builder
                template_mapping = {
                    'templates/leads/lead_new.html': 'leads',
                    'templates/leads/lead_show.html': 'leads'
                }
                custom_fields = []
                if template_name in template_mapping.keys():
                    custom_fields = model.CustomField.list_by_object(user, template_mapping[template_name])
                # text=i18n.gettext('Hello, world!')
                organization = user.organization.get()
                template_values = {
                    'is_freemium': is_freemium,
                    'is_admin': is_admin,
                    'is_not_a_life_time': is_not_a_life_time,
                    'is_business_user': is_business_user,
                    'ME': user.google_user_id,
                    'active_app': active_app,
                    'apps': applications,
                    'tabs': tabs,
                    'admin_app': admin_app,
                    'organization_key': user.organization.urlsafe(),
                    'is_owner': is_owner,
                    'user': user,
                    'custom_fields': custom_fields,
                    'country_name': default_currency.country_name,
                    'country_code': default_currency.country_code,
                    'currency_name': default_currency.currency_name,
                    'length_decimal': currency_format.length_decimal,
                    'length_whole_part': currency_format.length_whole_part,
                    'sections_delimiter': currency_format.sections_delimiter,
                    'decimal_delimiter': currency_format.decimal_delimiter,
                    'sales_tabs': STANDARD_TABS,
                    'admin_tabs': ADMIN_TABS,
                    'plan': organization.get_subscription().plan.get(),
                    'publishable_key': app_config.PUBLISHABLE_KEY
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
        template_values = {'CLIENT_ID': CLIENT_ID}
        if self.session.get(SessionEnabledHandler.CURRENT_USER_SESSION_KEY) is not None:
            try:
                user = self.get_user_from_session()
                print user
                template_values = {
                    'user': user,
                    'CLIENT_ID': CLIENT_ID
                }
            except:
                print 'an error has occured'
        template = jinja_environment.get_template('templates/landing/index.html')
        self.response.out.write(template.render(template_values))


class SignInHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        offline_access_prompt = True
        if self.session.get(SessionEnabledHandler.CURRENT_USER_SESSION_KEY) is not None:
            try:
                user = self.get_user_from_session()
                # Set the user locale from user's settings
                user_id = self.request.get('id')
                lang = self.request.get('language')
                self.set_user_locale(lang)
                if user:
                    if user.google_credentials:
                        if user.google_credentials.__dict__['refresh_token'] != None:
                            offline_access_prompt = False
                            # Render the template
                template_values = {
                    'offline_access_prompt': offline_access_prompt,
                    'user': user,
                    'CLIENT_ID': CLIENT_ID,
                    'ID': user_id
                }
                template = jinja_environment.get_template('templates/landing/sign-in.html')
                self.response.out.write(template.render(template_values))
            except:
                print 'an error has occured'
        else:
            # Set the user locale from user's settings
            user_id = self.request.get('id')
            lang = self.request.get('language')
            self.set_user_locale(lang)
            # Render the template
            template_values = {
                'offline_access_prompt': offline_access_prompt,
                'CLIENT_ID': CLIENT_ID,
                'ID': user_id
            }
            template = jinja_environment.get_template('templates/landing/sign-in.html')
            self.response.out.write(template.render(template_values))


class SignInWithioGrow(BaseHandler, SessionEnabledHandler):
    def get(self):
        template_values = {
            'CLIENT_ID': CLIENT_ID
        }
        template = jinja_environment.get_template('templates/landing/sign-in-from-chrome.html')
        self.response.out.write(template.render(template_values))


class TermsOfServicesHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        template_values = {}
        template = jinja_environment.get_template('templates/landing/terms-of-services.html')
        self.response.out.write(template.render(template_values))


class PartnersHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        template_values = {}
        template = jinja_environment.get_template('templates/landing/partners.html')
        self.response.out.write(template.render(template_values))


class PrivacyHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        template_values = {}
        template = jinja_environment.get_template('templates/landing/privacy-policy.html')
        self.response.out.write(template.render(template_values))


class SecurityInformationsHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        template_values = {}
        template = jinja_environment.get_template('templates/landing/security-informations.html')
        self.response.out.write(template.render(template_values))


class StripeHandler(BaseHandler, SessionEnabledHandler):
    def post(self):
        # Get the credit card details submitted by the form

        # Set your secret key: remember to change this to your live secret key in production
        # See your keys here https://dashboard.stripe.com/account
        # stripe.api_key = "sk_test_4ZNpoS4mqf3YVHKVfQF7US1R"
        stripe.api_key = "sk_live_4Xa3GqOsFf2NE7eDcX6Dz2WA"

        # Get the credit card details submitted by the form
        token = self.request.get('stripeToken')

        # Create a Customer
        customer = stripe.Customer.create(
            card=token,
            description="payinguser@example.com"
        )

        # Charge the Customer instead of the card
        stripe.Charge.create(
            amount=1000,  # in cents
            currency="usd",
            customer=customer.id
        )

        # Save the customer ID in your database so you can use it later
        save_stripe_customer_id(user, customer.id)

        # Later...
        customer_id = get_stripe_customer_id(user)

        stripe.Charge.create(
            amount=1500,  # $15.00 this time
            currency="usd",
            customer=customer_id
        )


class IndexHandler(BaseHandler, SessionEnabledHandler):
    def get(self, template=None):
        if not template:
            template = 'templates/base.html'
        # Check if the user is logged-in, if not redirect him to the sign-in page
        if self.session.get(SessionEnabledHandler.CURRENT_USER_SESSION_KEY) is not None:
            try:
                user = self.get_user_from_session()
                sales_app = None
                if user is None:
                    self.redirect('/welcome/')
                    return
                if user.google_credentials is None:
                    self.redirect('/sign-in')
                logout_url = 'https://www.google.com/accounts/Logout?continue=https://appengine.google.com/_ah/logout?continue=http://www.iogrow.com'
                if user is None or user.type == 'public_user':
                    self.redirect('/welcome/')
                    return
                # Set the user locale from user's settings
                self.set_user_locale(user.language)
                uSerid = user.key.id()
                uSerlanguage = user.language
                user_suspended = False
                license_is_expired = False
                apps = user.get_user_apps()
                admin_app = None
                active_app = Application.query(Application.name == "sales").get()
                print active_app
                # tabs = user.get_user_active_tabs()
                tabs = ndb.get_multi(active_app.tabs)
                applications = []
                for app in apps:
                    if app is not None:
                        applications.append(app)
                        if app.name == 'admin':
                            admin_app = app
                        if app.name == 'sales':
                            sales_app = app
                logo = model.Logo.query(model.Logo.organization == user.organization).get()
                organization = user.organization.get()
                plan = organization.plan.get()
                if plan.name != "life_time_free":
                    now = datetime.datetime.now()
                    if organization.licenses_expires_on:
                        days_before_expiring = organization.licenses_expires_on - now
                        expires = days_before_expiring.days + 1
                    else:
                        days_before_expiring = organization.created_at + datetime.timedelta(days=30) - now
                        expires = days_before_expiring.days + 1
                    if expires <= 0:
                        license_is_expired = True
                if user.license_status == "suspended":
                    user_suspended = True
                organization = user.organization.get()
                template_values = {
                    'logo': logo,
                    'license_is_expired': False,
                    'user_suspended': user_suspended,
                    'tabs': tabs,
                    'user': user,
                    'logout_url': logout_url,
                    'CLIENT_ID': CLIENT_ID,
                    'active_app': active_app,
                    'apps': applications,
                    'uSerid': uSerid,
                    'uSerlanguage': uSerlanguage,
                    'sales_app': sales_app,
                    'organization_name': organization.name,
                    'sales_tabs': STANDARD_TABS,
                    'admin_tabs': ADMIN_TABS,
                    'plan': organization.get_subscription().plan.get()
                }
                if admin_app:
                    template_values['admin_app'] = admin_app
                template = jinja_environment.get_template(template)
                self.response.out.write(template.render(template_values))
                self.response.headers.add_header("Access-Control-Allow-Origin", "*")
            except UserNotAuthorizedException as e:
                self.redirect('/welcome/')
        else:
            self.redirect('/welcome/')

# Change the current app for example from sales to customer support
class ChangeActiveAppHandler(SessionEnabledHandler):
    def get(self, appid):
        new_app_id = int(appid)
        if self.session.get(SessionEnabledHandler.CURRENT_USER_SESSION_KEY) is not None:
            user = self.get_user_from_session()
            # get the active application before the change request
            active_app = user.get_user_active_app()
            new_active_app = model.Application.get_by_id(new_app_id)
            if new_active_app:
                if new_active_app.organization == user.organization:
                    user.set_user_active_app(new_active_app.key)
                    self.redirect(new_active_app.url)
                else:
                    self.redirect('/error')
            else:
                self.redirect('/')
        else:
            self.redirect('/sign-in')

    @ndb.toplevel
    def post(self):
        if self.session.get(SessionEnabledHandler.CURRENT_USER_SESSION_KEY) is not None:
            user = self.get_user_from_session()
            org_name = self.request.get('org_name')
            promo_code = self.request.get('promo_code')
            if promo_code != '':
                org_key = model.Organization.create_instance(org_name, user, 'premium_trial', promo_code)
            else:
                org_key = model.Organization.create_instance(org_name, user)
            if not model.is_locale():
                taskqueue.add(
                    url='/workers/add_to_iogrow_leads',
                    queue_name='iogrow-low',
                    params={
                        'email': user.email,
                        'organization': org_name,
                        'source': 'ioGrow'
                    }
                )
            self.redirect('/')
        else:
            self.redirect('/sign-in')


    @ndb.toplevel
    def post(self):
        if self.session.get(SessionEnabledHandler.CURRENT_USER_SESSION_KEY) is not None:
            user = self.get_user_from_session()
            org_name = self.request.get('org_name')
            model.Organization.create_early_bird_instance(org_name, user)
            taskqueue.add(
                url='/workers/add_to_iogrow_leads',
                queue_name='iogrow-low',
                params={
                    'email': user.email,
                    'organization': org_name
                }
            )
            self.redirect('/')


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
            'config/client_secrets.json',
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
        print 'i will fetch the url', url
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
    def save_token_for_user(email, credentials, user_id=None):
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
            user.completed_tour = False
            profile = model.Profile.query(
                model.Profile.name == 'Standard User',
                model.Profile.organization == invited_by.organization
            ).get()
            model.Invitation.delete_by(user.email)
            user.init_user_config(invited_by.organization, profile.key)
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
            user.completed_tour = False
            profile_image = userinfo.get('image')
            user.google_public_profile_photo_url = profile_image['url']
        if user.google_credentials:
            if credentials.__dict__['refresh_token'] != None:
                user.google_credentials = credentials
        else:
            user.google_credentials = credentials
        user_key = user.put_async()

        if memcache.get(user.email):
            memcache.set(user.email, user)
        else:
            memcache.add(user.email, user)

        return user

    def get_language(self):
        header = self.request.headers.get('Accept-Language', '')  # e.g. en-gb,en;q=0.8,es-es;q=0.5,eu;q=0.3
        return header.split(',')[0]

    def post(self):
        code = self.request.get("code")
        is_paying = self.request.get("is_paying")
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
        # Check if is it an invitation to sign-in or just a simple sign-in
        invited_user_id = None
        invited_user_id_request = self.request.get("id")
        if invited_user_id_request:
            invited_user_id = long(invited_user_id_request)
        # user = model.User.query(model.User.google_user_id == token_info.get('user_id')).get()

        # Store our credentials with in the datastore with our user.
        invitee = None
        user_email = token_info.get('email')
        if invited_user_id:
            invitee = model.Invitation.query(model.Invitation.invited_mail == user_email).get()
        if invitee:
            user = GooglePlusConnect.save_token_for_user(
                user_email,
                credentials,
                invited_user_id
            )
            organization = user.organization.get()
            if organization.plan and organization.plan.get().name == "life_time_free":
                user.set_subscription(organization.get_subscription())
            else:
                user.set_subscription(Subscription.create_freemium_subscription())
        else:
            user = GooglePlusConnect.save_token_for_user(
                user_email,
                credentials
            )
        lang = self.get_language().replace('-', '_')
        user.currency_format = lang
        user.date_time_format = lang
        code_country_split = lang.split('_')
        if len(code_country_split) > 1:
            user.country_code = code_country_split[1]
        user.currency = "USD"
        user.week_start = "monday"

        user.put()
        # if user doesn't have organization redirect him to sign-up
        is_new_user = False
        if user.organization is None:
            if model.CountryCurrency.get_by_code('US') is None:
                model.CountryCurrency.init()
            model.User.set_default_currency(user, self.request.headers.get('X-AppEngine-Country'))
            organ_name = user_email.partition("@")[2]
            model.Organization.create_instance(organ_name, user)
            is_new_user = True
            try:
                Intercom.create_user(email=user.email, name=user.google_display_name,
                                     created_at=time.mktime(user.created_at.timetuple()))
            except:
                pass
            mp.track(user.id, 'SIGNIN_SUCCESS')
            # mp.identify(user.id)
            # mp.people_set(user.id,{
            # "$email": user.email,
            # "$name":user.google_display_name,
            # "$created": user.created_at,
            # "$organization": user.organization,
            # "$language": user.language
            # });
        # if self.session.get(SessionEnabledHandler.CURRENT_USER_SESSION_KEY) is not None:
        #     user = self.get_user_from_session()
        # Store the user ID in the session for later use.
        json_resp = json.dumps({'is_new_user': is_new_user, 'email': user.email})
        self.session[self.CURRENT_USER_SESSION_KEY] = user.email
        self.response.headers['Access-Control-Allow-Origin'] = '*'
        self.response.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept'
        self.response.headers['Access-Control-Allow-Methods'] = 'POST'
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps({'is_new_user': is_new_user, 'is_paying': is_paying}))


class ActivateSession(BaseHandler, SessionEnabledHandler):
    def get(self):
        email = self.request.get('email')
        self.session[self.CURRENT_USER_SESSION_KEY] = email
        is_paying = int(self.request.get('isPaying'))
        if is_paying:
            self.redirect('/subscribe')
        else:
            self.redirect('/')


class InstallFromDecorator(SessionEnabledHandler):
    @decorator.oauth_required
    def get(self):
        try:
            credentials = decorator.get_credentials()
            print '--------------------------------------------------------'
            print credentials.access_token
            print credentials.__dict__
            token_info = GooglePlusConnect.get_token_info(credentials)
            print token_info.status_code
            print token_info.content
            if token_info.status_code != 200:
                self.redirect('/')
            token_info = json.loads(token_info.content)
            print '---------------------------------'
            print token_info
            print 'email: ', token_info.get('email')
            # If there was an error in the token info, abort.
            if token_info.get('error') is not None:
                self.redirect('/')
            # Make sure the token we got is for our app.
            expr = re.compile("(\d*)(.*).apps.googleusercontent.com")
            issued_to_match = expr.match(token_info.get('issued_to'))
            local_id_match = expr.match(CLIENT_ID)
            if (not issued_to_match
                or not local_id_match
                or issued_to_match.group(1) != local_id_match.group(1)):
                self.redirect('/')
            # Check if is it an invitation to sign-in or just a simple sign-in
            invited_user_id = None
            invited_user_id_request = self.request.get("id")
            if invited_user_id_request:
                invited_user_id = long(invited_user_id_request)
            # user = model.User.query(model.User.google_user_id == token_info.get('user_id')).get()

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
            print 'user: ', user
            # if user doesn't have organization redirect him to sign-up
            isNewUser = False
            if user.organization is None:
                isNewUser = True
            self.session[self.CURRENT_USER_SESSION_KEY] = user.email
            if isNewUser:
                self.redirect('/sign-up')
            else:
                self.redirect('/')
        except:
            self.redirect('/')

class AccountListHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/accounts/account_list.html')


class AccountShowHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/accounts/account_show.html')


class AccountNewHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/accounts/account_new.html')


class ContactListHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/contacts/contact_list.html')


class ContactShowHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/contacts/contact_show.html')


class ContactNewHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/contacts/contact_new.html')


class OpportunityListHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/opportunities/opportunity_list.html')


class OpportunityShowHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/opportunities/opportunity_show.html')


class OpportunityNewHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/opportunities/opportunity_new.html')


class LeadListHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/leads/lead_list.html')


class LeadShowHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/leads/lead_show.html')


class LeadNewHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/leads/lead_new.html')


class CaseNewHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/cases/case_new.html')


class CaseListHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/cases/case_list.html')


class CaseShowHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/cases/case_show.html')

class NoteShowHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/accounts/note_show.html')


class DocumentShowHandler(BaseHandler, SessionEnabledHandler):
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


class UserListHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/admin/users/user_list.html')


class BillingEditHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/admin/billing/billing_edit.html')


class EditCompanyHandler(IndexHandler, SessionEnabledHandler):
    def get(self):
        IndexHandler.get(self, 'templates/admin/company/company_edit.html')


class EditEmailSignatureHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/admin/email_signature/email_signature_edit.html')


class EditRegionalHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/admin/regional/regional_edit.html')


class EditOpportunityHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/admin/opportunity/opportunity_edit.html')


class EditCaseStatusHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/admin/case_status/case_status_edit.html')


class EditLeadStatusHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/admin/lead_status/lead_status_edit.html')


class LeadScoringHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/admin/lead_scoring/lead_scoring_edit.html')


class EditCustomFieldsHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/admin/custom_fields/custom_fields_edit.html')

class UserNewHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/admin/users/user_new.html')


class UserShowHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/admin/users/user_show.html')


class settingsShowHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/admin/settings/settings.html')


class deleteAllRecordHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/admin/delete_all_records/delete_all_records.html')


class SearchListHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/search/list.html')


class CalendarShowHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/calendar/calendar_show.html')


class SubscriptionHandler(SessionEnabledHandler):
    def get(self):
        template = jinja_environment.get_template(name='templates/admin/subscription/subscription.html')
        user = self.get_user_from_session()
        if user:
            org_key = user.organization
            organization = org_key.get()
            first_name = organization.billing_contact_firstname
            last_name = organization.billing_contact_lastname
            full_name = None
            if first_name or last_name:
                full_name = organization.billing_contact_firstname + ' ' + organization.billing_contact_lastname
            subscription = organization.get_subscription()
            if subscription.plan.get().name == app_config.PREMIUM:
                self.redirect('/#/admin/billing')
            template_values = {
                'full_name': full_name,
                'organization': organization,
                'user': user,
                'year_price': app_config.PREMIUM_YEARLY_PRICE / 100,
                'month_price': app_config.PREMIUM_MONTHLY_PRICE / 100,
                'publishable_key': app_config.PUBLISHABLE_KEY,
                'users_count': model.User.count_by_organization(org_key),
                'subscription': subscription
            }
            self.response.out.write(template.render(template_values))
        else:
            self.redirect('/welcome/')


class PayPalPayingUsers(BaseHandler, SessionEnabledHandler):
    def get(self):
        # PayPalPayedUser
        # valid until
        # all models
        # update license models
        now = datetime.datetime.now()
        now_plus_month = now + datetime.timedelta(days=30)
        active_until = now_plus_month
        save_payed_user = model.PaypalPayedUser(
            txn_type=self.request.get("txn_type"),
            subscr_id=self.request.get("subscr_id"),
            last_name=self.request.get("last_name"),
            mc_currency=self.request.get("mc_currency"),
            item_name=self.request.get("item_name"),
            business=self.request.get("business"),
            amount3=self.request.get("amount3"),
            verify_sign=self.request.get("verify_sign"),
            payer_status=self.request.get("payer_status"),
            payer_email=self.request.get("payer_email"),
            first_name=self.request.get("first_name"),
            receiver_email=self.request.get("receiver_email"),
            payer_id=self.request.get("payer_id"),
            item_number=self.request.get("item_number"),
            subscr_date=self.request.get("subscr_date"),
            address_name=self.request.get("address_name"),
            ipn_track_id=self.request.get("ipn_track_id"),
            option_selection1=self.request.get("option_selection1"),
            option_name1=self.request.get("option_name1"),
            active_until=active_until
        ).put()


class StripeSubscriptionHandler(BaseHandler, SessionEnabledHandler):
    def post(self):
        user = self.get_user_from_session()
        organization = user.organization.get()
        stripe.api_key = app_config.STRIPE_API_KEY
        token = self.request.get('token')
        interval = self.request.get('interval')
        quantity = int(self.request.get('quantity'))
        premium_subscription = Subscription.create_premium_subscription(interval)
        try:
            customer = stripe.Customer.create(
                source=token,
                description=organization.key.id(),
                plan='{}_{}'.format(app_config.PREMIUM, interval),
                email=user.email,
                quantity=quantity
            )
            premium_subscription.is_auto_renew = not customer.subscriptions['data'][0].cancel_at_period_end
            premium_subscription.stripe_subscription_id = customer.subscriptions['data'][0].id
            premium_subscription.quantity = quantity
            premium_subscription.put()

            if user.subscription.get().plan.get().name != app_config.PREMIUM:
                user.set_subscription(premium_subscription)
                user.put()
                premium_subscription.put()

            organization.stripe_customer_id = customer.id
            organization.set_subscription(premium_subscription)
            organization.name = self.request.get('name')
            if 'email' in self.request.POST:
                organization.billing_contact_email = self.request.get('email')
            if 'address' in self.request.POST:
                organization.billing_contact_address = self.request.get('address')
            full_name = str(self.request.get('fullName')).split(' ')
            if len(full_name):
                organization.billing_contact_firstname = full_name[0]
            if len(full_name) > 1:
                organization.billing_contact_lastname = full_name[1]
            organization.put()
        except stripe.error.CardError, e:
            self.response.headers['Content-Type'] = 'application/json'
            self.response.write(e.message)
            self.response.set_status(e.http_status)


class EditCreditCardHandler(BaseHandler, SessionEnabledHandler):
    def post(self):
        user = self.get_user_from_session()
        organization = user.organization.get()
        stripe.api_key = app_config.STRIPE_API_KEY
        token = self.request.get('token')
        try:
            customer = stripe.Customer.retrieve(organization.stripe_customer_id)
            customer.source = token
            customer.save()
        except stripe.error.CardError, e:
            self.response.headers['Content-Type'] = 'application/json'
            self.response.write(e.message)
            self.response.set_status(e.http_status)


class StripeSubscriptionWebHooksHandler(BaseHandler, SessionEnabledHandler):
    def post(self):
        eve = json.loads(self.request.body)
        if eve['type'] == "invoice.payment_succeeded":
            stripe_event_invoice = eve['data']['object']
            org = Organization.query(Organization.stripe_customer_id == stripe_event_invoice['customer']).get()
            sub = Subscription.query(Subscription.stripe_subscription_id == stripe_event_invoice['subscription']).get()
            if org and sub and org.subscription == sub.key:
                customer = stripe.Customer.retrieve(stripe_event_invoice['customer'])
                email = customer['email']
                org.billing_contact_address = org.billing_contact_address or ''
                org.billing_contact_firstname = org.billing_contact_firstname or ''
                org.billing_contact_lastname = org.billing_contact_lastname or ''
                org.billing_contact_phone_number = org.billing_contact_phone_number or ''
                org.billing_contact_email = org.billing_contact_email or ''
                sub.expiration_date = Subscription.calculate_expiration_date(app_config.MONTH)
                sub.start_date = datetime.datetime.now()
                sub.put()
                invoice = stripe.Invoice.retrieve(stripe_event_invoice['id'])
                logging.info("Invoice Object")
                logging.info(invoice)
                body_path = "templates/emails/invoice.html"
                template = jinja_environment.get_template(body_path)
                due_date = sub.expiration_date.strftime("%A %d. %B %Y")
                created = sub.start_date.strftime("%A %d. %B %Y")
                last_4 = customer['sources']['data'][0]['last4']
                line_0 = invoice['lines']['data'][0]
                plan = line_0['plan']
                total = line_0['amount']
                interval = plan['interval']
                body = template.render({'invoice': invoice, 'created': created, 'due': due_date, 'org': org,
                                        'last4': last_4, 'interval': interval, 'quantity': line_0['quantity'],
                                        'amount': plan['amount']/100, 'total': total/100})
                message = mail.EmailMessage()
                message.sender = 'hakim@iogrow.com'
                message.to = org.billing_contact_email or email
                message.subject = 'Invoice'
                message.html = body
                message.send()


class ImportJob(BaseHandler, SessionEnabledHandler):
    def post(self):
        data = json.loads(self.request.body)
        import_job_id = int(data['job_id'])
        job = model.ImportJob.get_by_id(import_job_id)
        user = job.user.get()
        body = '<p>The contacts import you requested has been completed!</p>'
        taskqueue.add(
            url='/workers/send_email_notification',
            queue_name='iogrow-low',
            params={
                'user_email': user.email,
                'to': user.email,
                'subject': '[ioGrow] Contact import finished',
                'body': body
            }
        )
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps({'import': 'completed'}))


class ExportCompleted(BaseHandler, SessionEnabledHandler):
    def post(self):
        data = json.loads(self.request.body)

        body = '<p>The ' + data["tab"] + 's export you requested has been completed!' \
                                         ' download it  <a href="' + data["downloadUrl"] + '">here</a> </p>'

        taskqueue.add(
            url='/workers/send_email_notification',
            queue_name='iogrow-low',
            params={
                'user_email': data["email"],
                'to': data["email"],
                'subject': '[ioGrow] ' + data["tab"] + ' export finished',
                'body': body
            }
        )
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps({'import': 'completed'}))

class SyncContact(webapp2.RequestHandler):
    @ndb.toplevel
    def post(self):
        # get request params
        email = self.request.get('email')
        id = self.request.get('id')
        user = model.User.get_by_email(email)


class SyncCalendarEvent(webapp2.RequestHandler):
    def post(self):
        attendees_request = []
        attendees = []
        guest_modify = False
        guest_invite = True
        guest_list = True
        method = "email"
        useDefault = False
        minutes = 0
        user_from_email = model.User.get_by_email(self.request.get('email'))
        starts_at = datetime.datetime.strptime(
            self.request.get('starts_at'),
            "%Y-%m-%dT%H:%M:00.000000"
        )
        summary = self.request.get('summary')
        location = self.request.get('location')
        attendees_request = self.request.get('attendees', allow_multiple=True)
        guest_modify_str = self.request.get('guest_modify')
        guest_invite_str = self.request.get('guest_invite')
        guest_list_str = self.request.get('guest_list')
        description = self.request.get('description')
        reminder = self.request.get('reminder')
        timezone = self.request.get('timezone')
        where = self.request.get('where')
        if reminder == "0":
            useDefault = True
        elif reminder == "1":
            minutes = 0
        elif reminder == "2":
            minutes = 30
        elif reminder == "3":
            minutes = 60
        elif reminder == "4":
            minutes = 1440
        elif reminder == "5":
            minutes = 10080
        if guest_modify_str == "true":
            guest_modify = True
        if guest_invite_str == "false":
            guest_invite = False
        if guest_list_str == "false":
            guest_list = False
        for attendee in attendees_request:
            attendees.append({'email': attendee})

        ends_at = datetime.datetime.strptime(
            self.request.get('ends_at'),
            "%Y-%m-%dT%H:%M:00.000000"
        )
        event = Event.getEventById(self.request.get('event_id'))

        try:
            fromat = "%Y-%m-%dT%H:%M:00.000" + timezone
            credentials = user_from_email.google_credentials
            http = credentials.authorize(httplib2.Http(memcache))
            service = build('calendar', 'v3', http=http)
            # prepare params to insert
            params = {
                "start":
                    {
                        "dateTime": starts_at.strftime(fromat)
                    },
                "end":
                    {
                        "dateTime": ends_at.strftime(fromat)
                    },
                "summary": summary,
                "location": where,
                "attendees": attendees,
                "sendNotifications": True,
                "guestsCanInviteOthers": guest_invite,
                "guestsCanModify": guest_modify,
                "guestsCanSeeOtherGuests": guest_list,
                "description": description,
                "reminders": {
                    "useDefault": False,
                    "overrides": [
                        {
                            "method": "email",
                            "minutes": minutes
                        }
                    ]
                },
            }

            created_event = service.events().insert(calendarId='primary', body=params).execute()
            event.event_google_id = created_event['id']
            event.put()
        except:
            raise endpoints.UnauthorizedException('Invalid grant')


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
        task = Task.getTaskById(self.request.get('task_id'))
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

        created_task = service.events().insert(calendarId='primary', body=params).execute()
        task.task_google_id = created_task['id']
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
        event_google_id = self.request.get('event_google_id')
        timezone = self.request.get("timezone")
        description = self.request.get('description')

        try:
            fromat = "%Y-%m-%dT%H:%M:00.000" + timezone
            credentials = user_from_email.google_credentials
            http = credentials.authorize(httplib2.Http(memcache))
            service = build('calendar', 'v3', http=http)
            # prepare params to insert
            params = {
                "start":
                    {
                        "dateTime": starts_at.strftime(fromat)
                    },
                "end":
                    {
                        "dateTime": ends_at.strftime(fromat)
                    },
                "summary": summary,
                "location": location,
                "description": description
            }

            patched_event = service.events().patch(calendarId='primary', eventId=event_google_id, body=params).execute()
        except:
            raise endpoints.UnauthorizedException('Invalid grant')


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
        task_google_id = self.request.get('task_google_id')
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

            patched_event = service.events().patch(calendarId='primary', eventId=task_google_id, body=params).execute()
        except:
            raise endpoints.UnauthorizedException('Invalid grant')


# sync delete events with google calendar . hadjo hicham 09-08-2014
class SyncDeleteCalendarEvent(webapp2.RequestHandler):
    def post(self):
        user_from_email = model.User.get_by_email(self.request.get('email'))
        event_google_id = self.request.get('event_google_id')
        try:
            credentials = user_from_email.google_credentials
            http = credentials.authorize(httplib2.Http(memcache))
            service = build('calendar', 'v3', http=http)
            # prepare params to insert
            patched_event = service.events().delete(calendarId='primary', eventId=event_google_id).execute()
        except:
            raise endpoints.UnauthorizedException('Invalid grant')


# sync delete tasks with google calendar . hadji hicham 06-09-2014
class SyncDeleteCalendarTask(webapp2.RequestHandler):
    def post(self):
        user_from_email = model.User.get_by_email(self.request.get('email'))
        task_google_id = self.request.get('task_google_id')
        try:
            credentials = user_from_email.google_credentials
            http = credentials.authorize(httplib2.Http(memcache))
            service = build('calendar', 'v3', http=http)
            # prepare params to insert
            patched_event = service.events().delete(calendarId='primary', eventId=task_google_id).execute()
        except:
            raise endpoints.UnauthorizedException('Invalid grant')


# HADJI HICHAM - 21-09-2014.
class SyncAssignedCalendarTask(webapp2.RequestHandler):
    def post(self):
        user_from_email = model.User.get_by_email(self.request.get('email'))
        task_key = self.request.get('task_key')
        task = Task.getTaskById(task_key)
        starts_at = datetime.datetime.strptime(task.due.isoformat(), "%Y-%m-%dT%H:%M:%S")
        summary = task.title
        # location = self.request.get('location')
        ends_at = datetime.datetime.strptime(task.due.isoformat(), "%Y-%m-%dT%H:%M:%S")

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

        created_task = service.events().insert(calendarId='primary', body=params).execute()
        new_assignedGoogleId = AssignedGoogleId(task_google_id=created_task['id'], user_key=user_from_email.key)
        task.task_assigned_google_id_list.append(new_assignedGoogleId)
        task.put()
        print "*-*-*-*-*hahahah -*-*-*-*done-*-*-*-*-*"


# hadji hicham 23/09/2014. patch
class SyncAssignedPatchCalendarTask(webapp2.RequestHandler):
    def post(self):
        user_from_email = model.User.get_by_email(self.request.get('email'))
        task_key = self.request.get('task_key')
        task = Task.getTaskById(task_key)
        starts_at = datetime.datetime.strptime(task.due.isoformat(), "%Y-%m-%dT%H:%M:%S")
        summary = task.title
        # location = self.request.get('location')
        ends_at = datetime.datetime.strptime(task.due.isoformat(), "%Y-%m-%dT%H:%M:%S")
        print "*******************************************"
        print user_from_email.key
        print "*******************************************"
        print task.task_assigned_google_id_list
        print "*******************************************"
        # user_from_email = model.User.get_by_email(self.request.get('email'))
        # task_key=self.request.get('task_key')
        # task=task_key.get()
        # starts_at = datetime.datetime.strptime(
        #                                       task.due,
        #                                       "%Y-%m-%dT%H:%M:00.000000"
        #                                       )
        # summary = task.title
        # #location = self.request.get('location')
        # ends_at = datetime.datetime.strptime(
        #                                       task.due,
        #                                       "%Y-%m-%dT%H:%M:00.000000"
        #                                       )
        # assigned_to_key=self.request.get('assigned_to')
        # assigned_to=assigned_to_key.get()
        try:
            for task_google_assigned_id in task.task_assigned_google_id_list:
                if task_google_assigned_id.user_key == user_from_email.key:
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
                    patched_event = service.events().patch(calendarId='primary',
                                                           eventId=task_google_assigned_id.task_google_id,
                                                           body=params).execute()
        except:
            raise endpoints.UnauthorizedException('Invalid grant')


class SyncAssignedDeleteCalendarTask(webapp2.RequestHandler):
    def post(self):
        user_from_email = model.User.get_by_email(self.request.get('email'))
        task_key = self.request.get('task_key')
        task = Task.getTaskById(task_key)
        try:
            for task_google_assigned_id in task.task_assigned_google_id_list:
                if task_google_assigned_id.user_key == user_from_email.key:
                    credentials = user_from_email.google_credentials
                    http = credentials.authorize(httplib2.Http(memcache))
                    service = build('calendar', 'v3', http=http)
                    # prepare params to insert
                    patched_event = service.events().delete(calendarId='primary',
                                                            eventId=task_google_assigned_id.task_google_id).execute()
        except:
            raise endpoints.UnauthorizedException('Invalid grant')


class AddToIoGrowLeads(webapp2.RequestHandler):
    def post(self):
        # TODO: to configuration file
        user_from_email = model.User.get_by_email('tedj.meabiou@gmail.com')
        lead = model.User.get_by_email(self.request.get('email'))
        company = self.request.get('organization')
        email = iomessages.EmailSchema(email=lead.email)
        emails = [email]
        request = LeadInsertRequest(
            firstname=lead.google_display_name.split()[0],
            lastname=" ".join(lead.google_display_name.split()[1:]),
            emails=emails,
            profile_img_url=lead.google_public_profile_photo_url,
            company=company,
            access='public'
        )
        if user_from_email:
            Lead.insert(user_from_email, request)

class ShareDocument(webapp2.RequestHandler):
    def post(self):

        email = self.request.get('email')
        doc_id = self.request.get('doc_id')
        resource_id = self.request.get('resource_id')
        user_email = self.request.get('user_email')
        access = self.request.get('access')
        if access == 'anyone':
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
                        'value': email
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
            Document.access == 'public'
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
            collaborators = model.User.query(model.User.organization == parent.organization)
        elif parent.access == 'private':
            # list collborators who have access
            acl = EndpointsHelper.who_has_access(parent_key)
            collaborators = acl['collaborators']
            if acl['owner'] is not None:
                collaborators.append(acl['owner'])
        for collaborator in collaborators:
            if collaborator.email != user_email:
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
        print "**********i'm down here************************"
        print self.request.get('body')
        print "***********************************************"
        user_email = self.request.get('user_email')
        to = self.request.get('to')
        subject = self.request.get('subject')
        body = self.request.get('body')
        sender_address = "ioGrow notifications <notifications@gcdc2013-iogrow.appspotmail.com>"
        message = mail.EmailMessage()
        message.sender = sender_address
        message.to = to
        if self.request.get('cc') != 'None' and self.request.get('cc') != '':
            cc = self.request.get('cc')
            message.cc = cc
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
        if self.request.get('cc') != 'None':
            cc = self.request.get('cc')
        if self.request.get('bcc') != 'None':
            bcc = self.request.get('bcc')
        files = None
        if self.request.get('files') != 'None':
            files = self.request.POST.getall('files')
        print 'show me how handlers will get files_id', files
        if files:
            message = EndpointsHelper.create_message_with_attachments(
                user,
                user.email,
                self.request.get('to'),
                cc,
                bcc,
                self.request.get('subject'),
                self.request.get('body'),
                files
            )
        else:
            message = EndpointsHelper.create_message(
                user.email,
                self.request.get('to'),
                cc,
                bcc,
                self.request.get('subject'),
                self.request.get('body')
            )
        EndpointsHelper.send_message(service, 'me', message)

class ImportContactSecondStep(webapp2.RequestHandler):
    def post(self):
        data = json.loads(self.request.body)
        import_job_id = int(data['job_id'])
        items = data['items']
        email = data['email']
        token = data['token']
        user_from_email = model.User.get_by_email(email)
        Contact.import_from_csv_second_step(user_from_email, import_job_id, items, token)


class ImportContactFromGcsvRow(webapp2.RequestHandler):
    def post(self):
        data = json.loads(self.request.body)
        import_job_id = int(data['import_row_job'])
        job = model.ImportJob.get_by_id(import_job_id)
        try:
            user = model.User.get_by_email(data['email'])
            matched_columns = {}
            for key in data['matched_columns'].keys():
                index = int(key)
                matched_columns[index] = data['matched_columns'][key]
            customfields_columns = {}
            for key in data['customfields_columns'].keys():
                index = int(key)
                customfields_columns[index] = data['customfields_columns'][key]

            Contact.import_contact_from_gcsv(user, data['row'], matched_columns, customfields_columns)
            job.status = 'completed'
            job.put()
        except:
            type, value, tb = sys.exc_info()
            print '--------------------------------ERROR----------------------'
            print str(value.message)
            job.status = 'failed'
            job.put()


class ImportLeadFromCsvRow(webapp2.RequestHandler):
    def post(self):
        data = json.loads(self.request.body)
        import_job_id = int(data['import_row_job'])
        job = model.ImportJob.get_by_id(import_job_id)
        try:
            user = model.User.get_by_email(data['email'])
            matched_columns = {}
            for key in data['matched_columns'].keys():
                index = int(key)
                matched_columns[index] = data['matched_columns'][key]
            customfields_columns = {}
            for key in data['customfields_columns'].keys():
                index = int(key)
                customfields_columns[index] = data['customfields_columns'][key]

            Lead.import_row(user, data['row'], matched_columns, customfields_columns)
            job.status = 'completed'
            job.put()
        except:
            type, value, tb = sys.exc_info()
            print '--------------------------------ERROR----------------------'
            print str(value.message)
            job.status = 'failed'
            job.put()


class ImportLeadSecondStep(webapp2.RequestHandler):
    def post(self):
        data = json.loads(self.request.body)
        import_job_id = int(data['job_id'])
        items = data['items']
        email = data['email']
        token = data['token']
        user_from_email = model.User.get_by_email(email)
        Lead.import_from_csv_second_step(user_from_email, import_job_id, items, token)


class ImportAccountSecondStep(webapp2.RequestHandler):
    def post(self):
        data = json.loads(self.request.body)
        import_job_id = int(data['job_id'])
        items = data['items']
        email = data['email']
        token = data['token']
        user_from_email = model.User.get_by_email(email)
        Account.import_from_csv_second_step(user_from_email, import_job_id, items, token)


class CheckJobStatus(webapp2.RequestHandler):
    def post(self):
        data = json.loads(self.request.body)
        import_job_id = int(data['job_id'])
        job = model.ImportJob.get_by_id(import_job_id)
        sub_jobs = model.ImportJob.query(model.ImportJob.parent_job == job.key).fetch()
        completed_jobs = 0
        failed_jobs = 0
        for sub_job in sub_jobs:
            if sub_job.status == 'completed':
                completed_jobs += 1
            if sub_job.status == 'failed':
                failed_jobs += 1
        if job.sub_jobs == completed_jobs + failed_jobs:
            job.status = 'completed'
            job.completed_jobs = completed_jobs
            job.failed_jobs = failed_jobs
            job.put()
            user = job.user.get()
            body = '<p>' + user.google_display_name + ',</p>'
            body = '<p>The contacts import you requested has been completed!</p>'
            taskqueue.add(
                url='/workers/send_email_notification',
                queue_name='iogrow-low',
                params={
                    'user_email': user.email,
                    'to': user.email,
                    'subject': '[ioGrow] Contact import finished',
                    'body': body
                }
            )
        else:
            job.completed_jobs = completed_jobs
            job.failed_jobs = failed_jobs
            job.put()
            params = {
                'job_id': job.key.id()
            }
            taskqueue.add(
                url='/workers/check_job_status',
                queue_name='iogrow-critical',
                payload=json.dumps(params)
            )


# paying with stripe
class StripePayingHandler(BaseHandler, SessionEnabledHandler):
    def post(self):
        # the secret key .
        # stripe.api_key="sk_test_4Xa3wfSl5sMQYgREe5fkrjVF"
        stripe.api_key = "sk_live_4Xa3GqOsFf2NE7eDcX6Dz2WA"
        # get the token from the client form
        token = self.request.get('stripeToken')
        # charging operation after the payment
        try:
            print "*-*-*-*-*-*-*-*-*-*-*-*-//////////////////////"
            print "here we go !"
            print stripe.Charge.all()
            print "-*-*-*-*-*-*-*-*-*-*-*-*-*"
            # charge= stripe.Charge.create(
            #     amount=1000,
            #     currency="usd",
            #     card=token,
            #     description="hadji@iogrow.com")
        except stripe.CardError, e:
            # The card has been declined
            pass


class DeleteUserContacts(webapp2.RequestHandler):
    def post(self):
        data = json.loads(self.request.body)
        owner = data["owner"]
        contacts = Contact.query(Contact.owner == owner).fetch()
        for c in contacts:
            Edge.delete_all_cascade(start_node=c.key)


class DeleteUserAccounts(webapp2.RequestHandler):
    def post(self):
        data = json.loads(self.request.body)
        owner = data["owner"]
        accounts = Account.query(Account.owner == owner).fetch()
        for a in accounts:
            Edge.delete_all_cascade(start_node=a.key)


class DeleteUserLeads(webapp2.RequestHandler):
    def post(self):
        data = json.loads(self.request.body)
        owner = data["owner"]
        leads = Lead.query(Lead.owner == owner).fetch()
        for a in leads:
            Edge.delete_all_cascade(start_node=a.key)


class DeleteUserOpportunity(webapp2.RequestHandler):
    def post(self):
        data = json.loads(self.request.body)
        owner = data["owner"]
        oppos = Opportunity.query(Opportunity.owner == owner).fetch()
        for a in oppos:
            Edge.delete_all_cascade(start_node=a.key)


class DeleteUserCase(webapp2.RequestHandler):
    def post(self):
        data = json.loads(self.request.body)
        owner = data["owner"]
        cases = Case.query(Case.owner == owner).fetch()
        for a in cases:
            Edge.delete_all_cascade(start_node=a.key)


class DeleteUserTasks(webapp2.RequestHandler):
    def post(self):
        data = json.loads(self.request.body)
        owner = data["owner"]
        tasks = Task.query(Task.owner == owner).fetch()
        for a in tasks:
            Edge.delete_all_cascade(start_node=a.key)


routes = [
    # Task Queues Handlers
    ('/workers/initpeertopeerdrive', InitPeerToPeerDrive),
    ('/workers/sharedocument', ShareDocument),
    ('/workers/shareobjectdocument', ShareObjectDocuments),
    ('/workers/syncdocumentwithteam', SyncDocumentWithTeam),
    ('/workers/sync_contacts', SyncContact),
    ('/workers/send_email_notification', SendEmailNotification),
    ('/workers/add_to_iogrow_leads', AddToIoGrowLeads),
    ('/workers/send_gmail_message', SendGmailEmail),

    # tasks sync  hadji hicham 06/08/2014 queue_name='iogrow-tasks'
    ('/workers/synctask', SyncCalendarTask),
    ('/workers/syncpatchtask', SyncPatchCalendarTask),
    ('/workers/syncdeletetask', SyncDeleteCalendarTask),
    ('/workers/syncassignedtask', SyncAssignedCalendarTask),
    ('/workers/syncassignedpatchtask', SyncAssignedPatchCalendarTask),
    ('/workers/syncassigneddeletetask', SyncAssignedDeleteCalendarTask),

    # Event  sync . hadji hicham 06/08/2014 queue_name= 'iogrow-events'
    ('/workers/syncevent', SyncCalendarEvent),
    ('/workers/syncpatchevent', SyncPatchCalendarEvent),
    ('/workers/syncdeleteevent', SyncDeleteCalendarEvent),
    ('/workers/import_contact_from_gcsv', ImportContactFromGcsvRow),
    ('/workers/contact_import_second_step', ImportContactSecondStep),
    ('/workers/lead_import_second_step', ImportLeadSecondStep),
    ('/workers/account_import_second_step', ImportAccountSecondStep),
    ('/workers/check_job_status', CheckJobStatus),
    ('/workers/import_lead_from_csv_row', ImportLeadFromCsvRow),
    ('/workers/delete_user_accounts', DeleteUserAccounts),
    ('/workers/delete_user_contacts', DeleteUserContacts),
    ('/workers/delete_user_leads', DeleteUserLeads),
    ('/workers/delete_user_opportunities', DeleteUserOpportunity),
    ('/workers/delete_user_cases', DeleteUserCase),
    ('/workers/delete_user_tasks', DeleteUserTasks),

    #
    ('/', IndexHandler),
    ('/partners/', PartnersHandler),
    # Accounts Views
    ('/views/accounts/list', AccountListHandler),
    ('/views/accounts/show', AccountShowHandler),
    ('/views/accounts/new', AccountNewHandler),
    # Contacts Views
    ('/views/contacts/list', ContactListHandler),
    ('/views/contacts/show', ContactShowHandler),
    ('/views/contacts/new', ContactNewHandler),

    # Opportunities Views
    ('/views/opportunities/list', OpportunityListHandler),
    ('/views/opportunities/show', OpportunityShowHandler),
    ('/views/opportunities/new', OpportunityNewHandler),

    # Leads Views
    ('/views/leads/list', LeadListHandler),
    ('/views/leads/show', LeadShowHandler),
    ('/views/leads/new', LeadNewHandler),
    # Cases Views
    ('/views/cases/list', CaseListHandler),
    ('/views/cases/show', CaseShowHandler),
    ('/views/cases/new', CaseNewHandler),

    # Notes, Documents, Taks, Events, Search Views
    ('/views/notes/show', NoteShowHandler),
    ('/views/documents/show', DocumentShowHandler),

    ('/views/search/list', SearchListHandler),
    ('/views/tasks/show', TaskShowHandler),
    ('/views/tasks/list', AllTasksHandler),
    ('/views/events/show', EventShowHandler),
    ('/views/calendar/show', CalendarShowHandler),
    # Settings Views
    ('/views/admin/users/list', UserListHandler),
    ('/views/admin/users/new', UserNewHandler),
    ('/views/admin/users/show', UserShowHandler),
    ('/views/admin/billing/billing_edit', BillingEditHandler),
    ('/views/admin/settings', settingsShowHandler),
    ('/views/admin/company/edit', EditCompanyHandler),
    ('/views/admin/email_signature/edit', EditEmailSignatureHandler),
    ('/views/admin/regional/edit', EditRegionalHandler),
    ('/views/admin/opportunity/edit', EditOpportunityHandler),
    ('/views/admin/case_status/edit', EditCaseStatusHandler),
    ('/views/admin/lead_status/edit', EditLeadStatusHandler),
    ('/views/admin/lead_scoring/edit', LeadScoringHandler),
    ('/views/admin/custom_fields/edit', EditCustomFieldsHandler),
    ('/views/admin/delete_all_records', deleteAllRecordHandler),
    ('/subscribe', SubscriptionHandler),
    ('/stripe/subscription', StripeSubscriptionHandler),
    ('/stripe/subscription_web_hook', StripeSubscriptionWebHooksHandler),
    ('/stripe/change_card', EditCreditCardHandler),

    # Applications settings
    (r'/apps/(\d+)', ChangeActiveAppHandler),

    ('/welcome/', WelcomeHandler),
    ('/terms-of-services/', TermsOfServicesHandler),
    ('/privacy/', PrivacyHandler),
    ('/security/', SecurityInformationsHandler),
    # Authentication Handlers
    ('/sign-in', SignInHandler),
    ('/gconnect', GooglePlusConnect),
    ('/install', InstallFromDecorator),
    (decorator.callback_path, decorator.callback_handler()),
    ('/paypal_paying_users', PayPalPayingUsers),
    ('/stripe', StripeHandler),
    # paying with stripe
    ('/jj', ImportJob),
    ('/exportcompleted', ExportCompleted),
    ('/sign-with-iogrow', SignInWithioGrow),
    ('/activate_session', ActivateSession)

]

config = {'webapp2_extras.sessions': {
    'secret_key': 'YOUR_SESSION_SECRET'
}}
# to config the local directory the way we want .
# config['webapp2_extras.i18n'] = {
#     'translations_path': 'path/to/my/locale/directory',
# }
app = webapp2.WSGIApplication(routes, config=config, debug=True)

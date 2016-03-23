# Standard libs
import csv
import datetime
import json
import logging
import os
import re
import sys
import time

import httplib2
import jinja2
import webapp2
from google.appengine._internal.django.utils.encoding import smart_str
from webapp2_extras import i18n
from webapp2_extras import sessions

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
from iomodels.crmengine.cases import Case
from iomodels.crmengine.opportunities import Opportunity
from iomodels.crmengine.payment import Subscription
from model import Application, STANDARD_TABS, ADMIN_TABS, User
from oauth2client.client import flow_from_clientsecrets
from oauth2client.client import FlowExchangeError
from oauth2client.appengine import OAuth2Decorator
# Our libraries
from endpoints_helper import EndpointsHelper
from people import linked_in
import model
from iomodels.crmengine.contacts import Contact
from iomodels.crmengine.accounts import Account
from iomodels.crmengine.leads import LeadInsertRequest, Lead
from iomodels.crmengine.documents import Document
from iomodels.crmengine.tags import Tag
import iomessages
from iograph import Edge
# import event . hadji hicham 09-07-2014
from iomodels.crmengine.events import Event
from iomodels.crmengine.tasks import Task, AssignedGoogleId
import sfoauth2
from sf_importer_helper import SfImporterHelper
from discovery import Discovery
# under the test .beta !
from ioreporting import Reports
import stripe
import requests
from requests.auth import HTTPBasicAuth
import config as config_urls
import people
from intercom import Intercom
from simple_salesforce import Salesforce
from semantic.dates import DateService
from mixpanel import Mixpanel
from iomodels.crmengine import config as app_config

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
    open('client_secrets.json', 'r').read())['web']['client_id']

CLIENT_SECRET = json.loads(
    open('client_secrets.json', 'r').read())['web']['client_secret']

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

COPYLEAD_SF_MIXPANEL_ID = '09f72c87a9660ac31031b2221705afff'


def track_mp_action(project_id, user_id, action, params=None):
    mp = Mixpanel(project_id)
    if params:
        mp.track(user_id, action, params)
    else:
        mp.track(user_id, action)


def people_set_mp(project_id, user_id, params):
    mp = Mixpanel(project_id)
    mp.people_set(user_id, params)


def track_with_intercom(api, params):
    return requests.post(
        api,
        auth=HTTPBasicAuth('a1tdujgo', 'c1ba3b4060accfdfcbeb0c0b8d38c8bfa8753daf'),
        headers={
            'Accept': 'application/json',
            'content-type': 'application/json'
        },
        data=json.dumps(params)
    )


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
                    'plan': organization.get_subscription().plan.get()
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
        template = jinja_environment.get_template('templates/new_web_site/index.html')
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
                template = jinja_environment.get_template('templates/new_web_site/sign-in.html')
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
            template = jinja_environment.get_template('templates/new_web_site/sign-in.html')
            self.response.out.write(template.render(template_values))


class SignInWithioGrow(BaseHandler, SessionEnabledHandler):
    def get(self):
        template_values = {
            'CLIENT_ID': CLIENT_ID
        }
        template = jinja_environment.get_template('templates/new_web_site/sign-in-from-chrome.html')
        self.response.out.write(template.render(template_values))


class ChromeExtensionHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        template_values = {}
        template = jinja_environment.get_template('templates/new_web_site/chrome.html')
        self.response.out.write(template.render(template_values))


class TermsOfServicesHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        template_values = {}
        template = jinja_environment.get_template('templates/new_web_site/terms-of-services.html')
        self.response.out.write(template.render(template_values))


class PartnersHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        template_values = {}
        template = jinja_environment.get_template('templates/new_web_site/partners.html')
        self.response.out.write(template.render(template_values))


class PrivacyHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        template_values = {}
        template = jinja_environment.get_template('templates/new_web_site/privacy-policy.html')
        self.response.out.write(template.render(template_values))


class SecurityInformationsHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        template_values = {}
        template = jinja_environment.get_template('templates/new_web_site/security-informations.html')
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
                logout_url = 'https://www.google.com/accounts/Logout?continue=https://appengine.google.com/_ah/logout?continue=http://www.iogrow.com/welcome/'
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

class SignUpHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        if self.session.get(SessionEnabledHandler.CURRENT_USER_SESSION_KEY) is not None:
            user = self.get_user_from_session()
            if model.CountryCurrency.get_by_code('US') is None:
                model.CountryCurrency.init()
            model.User.set_default_currency(user, self.request.headers.get('X-AppEngine-Country'))
            template_values = {
                'userinfo': user,
                'CLIENT_ID': CLIENT_ID}
            template = jinja_environment.get_template('templates/new_web_site/sign-up.html')
            self.response.out.write(template.render(template_values))
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
            'offline_client_secrets.json',
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
        # try to get the user credentials from the code
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
        self.session[self.CURRENT_USER_SESSION_KEY] = user.email
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps(is_new_user))


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


class DashboardHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.prepare_template('templates/dashboard.html')


class SalesforceImporter(BaseHandler, SessionEnabledHandler):
    def get(self):
        flow = sfoauth2.SalesforceOAuth2WebServerFlow(
            client_id='3MVG99OxTyEMCQ3g0xwRHkTAQlLtFN1urL1DbjiYCIkwzJkIVOFRgcw2aNy3ibWdJ3_gmnHCQuzkMYi8jWBzj',
            client_secret='3507235941737403648',
            scope=['api'],
            redirect_uri='https://gcdc2013-iogrow.appspot.com/sfoauth2callback'
        )
        authorization_url = flow.step1_get_authorize_url()
        self.redirect(authorization_url)


class SFsubscriberTest(BaseHandler, SessionEnabledHandler):
    def post(self):
        email = self.request.get("email")
        token_str = self.request.get("token")
        token = json.loads(token_str)
        print 'id'
        print token['id']

        user = model.SFuser.query(model.SFuser.email == email).get()
        if user:
            stripe.api_key = "sk_live_4Xa3GqOsFf2NE7eDcX6Dz2WA"
            customer = stripe.Customer.create(
                source=token['id'],  # obtained from Stripe.js
                plan="copylead_to_salesforce",
                email=email
            )
            user_info = user
            user_info.stripe_id = customer['id']
            now = datetime.datetime.now()
            now_plus_month = now + datetime.timedelta(days=30)
            user_info.active_until = now_plus_month
            user_info.created_at = now_plus_month
            user_info.put()
        self.response.headers.add_header("Access-Control-Allow-Origin", "*")
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps({}))


class GetSfUser(BaseHandler, SessionEnabledHandler):
    def post(self):
        email = self.request.get("email")
        user = model.SFuser.query(model.SFuser.email == email).get()
        response = {}
        if user:
            free_trial_expiration = user.created_at + datetime.timedelta(days=7)
            now = datetime.datetime.now()
            days_before_expiration = -1
            if user.active_until:
                if user.active_until > now:
                    days_before_expiration = (user.active_until - now).days + 1
            else:
                if now < free_trial_expiration:
                    days_before_expiration = (user.free_trial_expiration - now).days + 1
            is_paying = False
            if user.stripe_id:
                is_paying = True
            response = {
                'firstname': smart_str(user.firstname),
                'lastname': smart_str(user.lastname),
                'email': user.email,
                'days_before_expiration': days_before_expiration,
                'is_paying': is_paying
            }
        self.response.headers.add_header("Access-Control-Allow-Origin", "*")
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps(response))


class SubscriptionHandler(SessionEnabledHandler):
    def get(self):
        template = jinja_environment.get_template(name='templates/admin/subscription/subscription.html')
        user = self.get_user_from_session()
        template_values = {
            'user': user,
            'year_price': app_config.PREMIUM_YEARLY_PRICE / 100,
            'month_price': app_config.PREMIUM_MONTHLY_PRICE / 100,
            'publishable_key': app_config.PUBLISHABLE_KEY,
            'users_count': model.User.get_users_count_by_organization(user.organization)
        }
        self.response.out.write(template.render(template_values))


class SFsubscriber(BaseHandler, SessionEnabledHandler):
    def post(self):
        email = self.request.get("email")
        token_str = self.request.get("token")
        token = json.loads(token_str)
        print 'id'
        print token['id']

        user = model.SFuser.query(model.SFuser.email == email).get()
        if user:
            stripe.api_key = "sk_live_4Xa3GqOsFf2NE7eDcX6Dz2WA"
            customer = stripe.Customer.create(
                source=token['id'],  # obtained from Stripe.js
                plan="copylead_to_salesforce",
                email=email
            )
            user_info = user
            user_info.stripe_id = customer['id']
            now = datetime.datetime.now()
            now_plus_month = now + datetime.timedelta(days=30)
            user_info.active_until = now_plus_month
            user_info.created_at = now_plus_month
            user_info.put()
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps({}))



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

        # Set your secret key: remember to change this to your live secret key in production
        # See your keys here https://dashboard.stripe.com/account/apikeys
        stripe.api_key = app_config.STRIPE_API_KEY

        # Get the credit card details submitted by the form
        token = self.request.get('token')
        interval = self.request.get('interval')
        premium_subscription = Subscription.create_premium_subscription(interval)
        # plane = self.request.get('plane')
        # Create the charge on Stripe's servers - this will charge the user's card
        try:
            stripe.Plan.retrieve('{}_{}'.format(app_config.PREMIUM, interval))
            customer = stripe.Customer.create(
                source=token,
                description=organization.key.id(),
                plan='{}_{}'.format(app_config.PREMIUM, interval),
                email=user.email,
                quantity=User.get_users_count_by_organization(user.organization)
            )

            premium_subscription.is_auto_renew = not customer.subscriptions['data'][0].cancel_at_period_end
            premium_subscription.stripe_subscription_id = customer.subscriptions['data'][0].id
            premium_subscription.put()

            organization.stripe_customer_id = customer.id
            organization.set_subscription(premium_subscription)
            organization.put()
        except stripe.error.CardError, e:
            self.response.headers['Content-Type'] = 'application/json'
            self.response.write(e.message)
            self.response.set_status(e.http_status)


class StripeSubscriptionWebHooksHandler(BaseHandler, SessionEnabledHandler):
    def post(self):
        logging.info(self.request)

class SFcallback(BaseHandler, SessionEnabledHandler):
    def get(self):
        code = self.request.get("code")
        url = 'http://app.copylead.com/oauth-authorized?code=%s' % code
        self.redirect(str(url))

class SFconnect(BaseHandler, SessionEnabledHandler):
    def get(self):
        code = self.request.get("code")
        payload = {
            'code': str(code),
            'grant_type': 'authorization_code',
            'client_id': '3MVG99OxTyEMCQ3g0xwRHkTAQlLtFN1urL1DbjiYCIkwzJkIVOFRgcw2aNy3ibWdJ3_gmnHCQuzkMYi8jWBzj',
            'client_secret': '3507235941737403648',
            'redirect_uri': 'https://gcdc2013-iogrow.appspot.com/sfoauth2callback'
        }
        print payload
        print '----------- REsult------------ :)'
        endpoint = 'https://login.salesforce.com/services/oauth2/token'
        r = requests.post(endpoint, params=payload)
        content = r.__dict__['_content']
        print content
        try:
            print json.loads(content)
        except:
            print 'no 0'
        try:
            print content.id
        except:
            print 'wahc ya khou'
        json_loads = json.loads(content)
        org_user_id = json_loads['id']
        print org_user_id
        print org_user_id.split('/')
        user_id = str(org_user_id.split('/')[5])
        responseJ = r.json()
        response = {
            'access_token': str(responseJ['access_token']),
            'instance_url': str(responseJ['instance_url'])
        }
        # print response
        sf = Salesforce(instance_url=response['instance_url'], session_id=response['access_token'], version='33.0')
        print sf
        print 'try except'
        try:
            print sf.id.__dict__
        except:
            print 'no _content.id'
        print sf.id.request.__dict__['cookies'].__dict__

        userinfo = sf.User.get(user_id)
        print userinfo['Email']
        user = model.SFuser.query(model.SFuser.email == userinfo['Email']).get()
        signed_up_at = datetime.datetime.now()
        if user is None:
            created_user = model.SFuser(
                firstname=smart_str(userinfo['FirstName']),
                lastname=smart_str(userinfo['LastName']),
                email=smart_str(userinfo['Email'])
            )
            created_user.put()
            try:
                existing_invitation = model.SFinvitation.query(model.SFinvitation.invitee_email == smart_str(userinfo['Email'])).get()
                if existing_invitation:
                    rewarded_user = existing_invitation.user_key.get()
                    rewarded_user.active_until += datetime.timedelta(days=30)
                    rewarded_user.put()
            except:
                pass

        else:
            created_user = user
            signed_up_at = user.created_at

        new_session = model.CopyLeadSfSession(access_token=response['access_token'], user=created_user.key)
        new_session.put()
        match = re.search('([\w.-]+)@([\w.-]+)', created_user.email)
        company = None
        if match:
            company = match.group(2)
        mp_params = {
            '$first_name': created_user.firstname,
            '$lastname': created_user.lastname,
            '$email': created_user.email,
            '$company': company
        }
        try:
            people_set_mp(COPYLEAD_SF_MIXPANEL_ID, created_user.email, mp_params)
            track_mp_action(COPYLEAD_SF_MIXPANEL_ID, created_user.email, 'SIGN_IN')
        except:
            print 'an error when saving to mixpanel'
        try:
            intercom_params = {
                "email": created_user.email,
                "name": created_user.firstname + ' ' + created_user.lastname,
                "last_request_at": time.mktime(created_user.created_at.timetuple()),
                "signed_up_at": time.mktime(signed_up_at.timetuple()),
                "new_session": True,
                "update_last_request_at": True,
                "companies": [
                    {
                        "company_id": company,
                        "name": company
                    }
                ]
            }
            intercom_user = track_with_intercom('https://api.intercom.io/users', intercom_params)
            print intercom_user
        except:
            print 'yaw errorr aa'
            type, value, tb = sys.exc_info()
            print str(value)

        response['user_email'] = str(created_user.email)
        full_name = "%s %s" % (smart_str(created_user.firstname), smart_str(created_user.firstname))
        response['name'] = str(full_name)
        free_trial_expiration = created_user.created_at + datetime.timedelta(days=7)
        now = datetime.datetime.now()
        response['show_checkout'] = "true"
        if created_user.active_until:
            if created_user.active_until > now:
                response['show_checkout'] = "false"
        else:
            if now < free_trial_expiration:
                response['show_checkout'] = "false"
        # try:
        #     # intercom_user = Intercom.create_user(email=created_user.email,
        #     #                                      name=created_user.firstname + ' ' + created_user.lastname,
        #     #                                      created_at=time.mktime(created_user.created_at.timetuple()),
        #     #                                      custom_attributes={'sf_extension': True}
        #     #                                      )
        #     # print intercom_user
        # except: 
        #     print 'error'
        #

        try:
            name = created_user.firstname + ' ' + created_user.lastname
            sender_address = name + "<lilead@gcdc2013-iogrow.appspotmail.com>"
            email = created_user.email
            mail.send_mail(sender_address, 'tedj@iogrow.com,meziane@iogrow.com', 'New connection on lilead',
                           name + ' ' + email)
        except:
            pass
        self.response.headers.add_header("Access-Control-Allow-Origin", "*")
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(response)


class SFinvite(BaseHandler, SessionEnabledHandler):
    def post(self):
        data = json.loads(str(self.request.body))
        print data
        user_email = data['user_email']
        subject = data['subject']
        text = data['text'] + ' https://chrome.google.com/webstore/detail/copylead-for-salesforce/gbenffkgdeokfgjbbjibklflbaeelinh'
        emails = data['emails']
        print user_email
        print emails
        print subject

        # try:
        user = model.SFuser.query(model.SFuser.email == user_email).get()
        if user:
            for email in emails:
                existing = model.SFinvitation.query(model.SFinvitation.invitee_email == email).get()
                if not existing:
                    invitation = model.SFinvitation(
                        user_key = user.key,
                        user_email=user_email,
                        invitee_email=email
                    )
                    invitation.put()
                    sender_address =" %s %s <copylead@gcdc2013-iogrow.appspotmail.com>" % (user.firstname, user.lastname)
                    mail.send_mail(sender_address, email, subject, text)
        # except:
        #     print 'the user doesnt exist'

        self.response.headers['Access-Control-Allow-Origin'] = "*"
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps({}))


class SFlistInviteesByPartners(BaseHandler, SessionEnabledHandler):
    def post(self):
        data = json.loads(str(self.request.body))
        user_email = data['user_email']
        partner = model.SFpartner.query(model.SFpartner.email==user_email).get()
        response = model.SFinvitation().list_by_partner(partner.key)
        self.response.headers['Access-Control-Allow-Origin'] = "*"
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps(response))

class SalesforceImporterCallback(BaseHandler, SessionEnabledHandler):
    def get(self):
        template_values = {}
        template = jinja_environment.get_template('templates/salesforce_callback.html')
        self.response.out.write(template.render(template_values))


class ZohoSignIn(BaseHandler, SessionEnabledHandler):
    def get(self):
        template_values = {}
        template = jinja_environment.get_template('templates/zohosingin.html')
        self.response.out.write(template.render(template_values))


class ZohoUser(BaseHandler, SessionEnabledHandler):
    def post(self):
        ZohoUser = model.ZohoUser(
            email=self.request.get("email")
        ).put()


class SFmarkAsLeadDev(BaseHandler, SessionEnabledHandler):
    def post(self):
        access_token = self.request.get("accessToken")
        instance_url = self.request.get("instanceUrl")
        user_key = model.CopyLeadSfSession.get_by_access_token(access_token)
        user = user_key.get()
        firstname = self.request.get("firstName")
        lastname = self.request.get("lastName")
        title = self.request.get("title")
        company = self.request.get("company")
        profile_img_url = self.request.get("profilePictureUrl")
        introduction = self.request.get("summary")
        street = self.request.get("locality")
        mobile = self.request.get("phone")
        email = self.request.get("email")
        twitter = self.request.get("twitterUrl")
        linkedin_url = self.request.get("linkedInUrl")
        source = self.request.get("source")
        if twitter != '':
            twitter = 'https://twitter.com/' + twitter
        try:
            request = access_token + ' ' + instance_url + ' ' + mobile + ' ' + email + ' ' + twitter + ' ' + linkedin_url + ' ' + firstname + ' ' + lastname
            try:
                sender_address = "Error SF <error@gcdc2013-iogrow.appspotmail.com>"
                mail.send_mail(sender_address, 'tedj@iogrow.com', 'error salesforce extension', request)
            except:
                pass
            sf = Salesforce(instance_url=instance_url, session_id=access_token, version='33.0')
            params = {
                'FirstName': smart_str(firstname),
                'LastName': smart_str(lastname)
            }
            if company != '':
                params['Company'] = smart_str(company)
            else:
                params['Company'] = 'None'
            if title != '':
                params['Title'] = smart_str(title)
            if street != '':
                countries = ['United States', 'Afghanistan', 'Aland Islands', 'Albania',
                             'Algeria', 'American Samoa', 'Andorra', 'Angola', 'Anguilla', 'Antarctica',
                             'Antigua and Barbuda', 'Argentina', 'Armenia', 'Aruba', 'Australia', 'Austria',
                             'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium',
                             'Belize', 'Benin', 'Bermuda', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana',
                             'Bouvet Island', 'Brazil', 'British Indian Ocean Territory', 'Brunei Darussalam',
                             'Bulgaria',
                             'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde',
                             'Caribbean Nations',
                             'Cayman Islands', 'Central African Republic', 'Chad', 'Chile', 'China', 'Christmas Island',
                             'Cocos (Keeling) Islands', 'Colombia', 'Comoros', 'Congo', 'Cook Islands', 'Costa Rica',
                             "Cote D'Ivoire (Ivory Coast)", 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
                             'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica',
                             'Dominican Republic', 'East Timor', 'Ecuador', 'Egypt', 'El Salvador',
                             'Equatorial Guinea', 'Eritrea', 'Estonia', 'Ethiopia', 'Falkland Islands (Malvinas)',
                             'Faroe Islands', 'Federated States of Micronesia', 'Fiji', 'Finland', 'France',
                             'French Guiana',
                             'French Polynesia', 'French Southern Territories', 'Gabon', 'Gambia', 'Georgia', 'Germany',
                             'Ghana',
                             'Gibraltar', 'Greece', 'Greenland', 'Grenada', 'Guadeloupe', 'Guam', 'Guatemala',
                             'Guernsey', 'Guinea',
                             'Guinea-Bissau', 'Guyana', 'Haiti', 'Heard Island and McDonald Islands', 'Honduras',
                             'Hong Kong',
                             'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Isle of Man',
                             'Israel',
                             'Italy', 'Jamaica', 'Japan', 'Jersey', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati',
                             'Korea',
                             'Korea (North)', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho',
                             'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Macao', 'Macedonia',
                             'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands',
                             'Martinique',
                             'Mauritania', 'Mauritius', 'Mayotte', 'Mexico', 'Moldova', 'Monaco', 'Mongolia',
                             'Montenegro',
                             'Montserrat', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal',
                             'Netherlands',
                             'Netherlands Antilles', 'New Caledonia', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria',
                             'Niue',
                             'Norfolk Island', 'Northern Mariana Islands', 'Norway', 'Pakistan', 'Palau',
                             'Palestinian Territory',
                             'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Pitcairn', 'Poland',
                             'Portugal',
                             'Puerto Rico', 'Qatar', 'Reunion', 'Romania', 'Russian Federation', 'Rwanda',
                             'S. Georgia and S. Sandwich Islands', 'Saint Helena', 'Saint Kitts and Nevis',
                             'Saint Lucia', 'Saint Pierre and Miquelon', 'Saint Vincent and the Grenadines',
                             'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia',
                             'Serbia and Montenegro', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovak Republic',
                             'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Sudan', 'Spain',
                             'Sri Lanka', 'Sudan', 'Sultanate of Oman', 'Suriname', 'Svalbard and Jan Mayen',
                             'Swaziland',
                             'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand',
                             'Timor-Leste',
                             'Togo', 'Tokelau', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan',
                             'Turks and Caicos Islands', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates',
                             'United Kingdom', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City State (Holy See)',
                             'Venezuela', 'Vietnam', 'Virgin Islands (British)', 'Virgin Islands (U.S.)',
                             'Wallis and Futuna', 'Western Sahara', 'Yemen', 'Yugoslavia', 'Zambia', 'Zimbabwe',
                             'Other']
                street = smart_str(street)
                address_fields = street.split(',')
                country_in_fields = False
                if address_fields[-1].strip() in countries:
                    country_in_fields = True
                    params['Country'] = address_fields[-1].strip()
                if len(address_fields) == 3:
                    params['State'] = address_fields[1]
                    params['City'] = address_fields[0]
                elif len(address_fields) == 2:
                    if country_in_fields:
                        params['State'] = address_fields[0]
                    else:
                        params['State'] = address_fields[1]
                        params['City'] = address_fields[0]
                else:
                    if not country_in_fields:
                        params['State'] = address_fields[0]
                        # params['Street']=street
            if introduction != '':
                params['Description'] = smart_str(introduction)
            if mobile != '':
                params['MobilePhone'] = smart_str(mobile)
            if email != '':
                params['Email'] = smart_str(email)
            if twitter != '':
                params['Website'] = smart_str(twitter)
            try:
                print params
            except:
                pass
            created_lead = sf.Lead.create(params)
            saved_lead = model.SFLead(
                firstname=firstname,
                lastname=lastname,
                sf_id=created_lead['id'][0:-3],
                photo_url=profile_img_url,
                linkedin_url=linkedin_url,
                created_by=user_key
            ).put()
            try:
                params = None
                if source:
                    params = {
                        'source': source
                    }
                try:
                    intercom_params = {
                        "email": user.email,
                        "event_name": 'SAVE_TO',
                        "created_at": int(time.mktime(datetime.datetime.now().timetuple()))
                    }
                    intercom_response = track_with_intercom('https://api.intercom.io/events', intercom_params)
                    print intercom_response.__dict__
                except:
                    print 'yaw errorr aa'
                    type, value, tb = sys.exc_info()
                    print str(value)
                track_mp_action(COPYLEAD_SF_MIXPANEL_ID, user.email, 'SAVE_TO', params)
            except:
                print 'error when tracking mixpanel actions'
            created_lead['id'] = created_lead['id'][0:-3]
        except:
            try:
                min_params = {
                    'FirstName': params['FirstName'],
                    'LastName': params['LastName'],
                    'Title': params['Title'],
                    'Company': params['Company']
                }
                created_lead = sf.Lead.create(min_params)
                saved_lead = model.SFLead(
                    firstname=firstname,
                    lastname=lastname,
                    sf_id=created_lead['id'][0:-3],
                    photo_url=profile_img_url,
                    linkedin_url=linkedin_url
                ).put()
                try:
                    try:
                        intercom_params = {
                            "email": user.email,
                            "event_name": 'SAVE_TO',
                            "created_at": time.mktime(datetime.datetime.now().timetuple()),
                            "metadata": {
                                "partial_error": "true"
                            }
                        }
                        intercom_response = track_with_intercom('https://api.intercom.io/events', intercom_params)
                        print intercom_response
                    except:
                        print 'yaw errorr aa'
                        type, value, tb = sys.exc_info()
                        print str(value)
                    params = {
                        'partial_error': True
                    }
                    if source:
                        params['source'] = source
                    track_mp_action(COPYLEAD_SF_MIXPANEL_ID, user.email, 'SAVE_TO', params)
                except:
                    print 'error when tracking mixpanel actions'
                created_lead['id'] = created_lead['id'][0:-3]
            except:
                type, value, tb = sys.exc_info()
                sender_address = "Error SF <error@gcdc2013-iogrow.appspotmail.com>"
                mail.send_mail(sender_address, 'tedj@iogrow.com', 'error salesforce extension',
                               linkedin_url + ' ' + str(value.message))
                created_lead = {'error': 'error sending the lead to salesforce'}
        self.response.headers['Access-Control-Allow-Origin'] = "*"
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps(created_lead))


class ZohoSaveLead(BaseHandler, SessionEnabledHandler):
    def post(self):
        # access_token = self.request.get("access_token")
        # instance_url = self.request.get("instance_url")
        firstname = self.request.get("firstname")
        lastname = self.request.get("lastname")
        title = self.request.get("title")
        zoho_id = self.request.get("zoho_id")
        company = self.request.get("company")
        profile_img_url = self.request.get("profile_img_url")
        introduction = self.request.get("introduction")
        street = self.request.get("formatted_address")
        mobile = self.request.get("mobile")
        email = self.request.get("email")

        saved_lead = model.ZohoLead(
            firstname=firstname,
            lastname=lastname,
            zoho_id=zoho_id,
            photo_url=profile_img_url
        ).put()
        # track_mp_action(COPYLEAD_Zoho_MIXPANEL_ID, )
        self.response.headers.add_header("Access-Control-Allow-Origin", "*")
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.dumps(zoho_id))


class SFsearchDev(BaseHandler, SessionEnabledHandler):
    def post(self):
        access_token = self.request.get("accessToken")
        instance_url = self.request.get("instanceUrl")
        print self.request.remote_addr
        print instance_url
        if access_token == '' or instance_url == '':
            found = 'rouhou trankou'
            self.response.headers['Content-Type'] = 'application/json'
            self.response.out.write(found)
        else:
            person = self.request.get("person")
            sf = Salesforce(instance_url=instance_url, session_id=access_token, version='30.0')
            search_results = sf.quick_search(person)
            results = []
            if search_results:
                for p in search_results:
                    r = {
                        'type': str(p['attributes']['type']),
                        'id': str(p['Id'])[0:-3]
                    }
                    if r['type'] == 'Lead' or r['type'] == 'Contact':
                        results.append(r)
            found = {}
            if len(results) > 0:
                found = results[0]
            self.response.headers.add_header("Access-Control-Allow-Origin", "*")
            self.response.headers['Content-Type'] = 'application/json'
            self.response.out.write(json.dumps(found))


class SFsearchphoto(BaseHandler, SessionEnabledHandler):
    def get(self):
        sf_lead_id = self.request.get("sf_id")
        response = {}
        if sf_lead_id != '':
            sf_lead = model.SFLead.query(model.SFLead.sf_id == sf_lead_id).get()
            if sf_lead:
                response['photo_url'] = smart_str(sf_lead.photo_url)
                response['linkedin_url'] = smart_str(sf_lead.linkedin_url)
            else:
                response['error'] = 'not found'
                response['code'] = 404
        else:
            response['error'] = 'not found'
            response['code'] = 404
        self.response.headers.add_header("Access-Control-Allow-Origin", "*")
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(response)

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

        # sync contact
        # Contact.sync_with_google_contacts(user,id)



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


class GetFromLinkedinToIoGrow(webapp2.RequestHandler):
    def post(self):
        entityKey = self.request.get('entityKey')
        linkedin = linked_in()
        key1 = ndb.Key(urlsafe=entityKey)
        lead = key1.get()
        keyword = lead.firstname + " " + lead.lastname + " "
        if lead.company:
            keyword = keyword + lead.company
        print keyword
        profil = linkedin.scrape_linkedin(keyword)
        if profil:
            pli = model.LinkedinProfile()
            if "formations" in profil.keys():
                pli.formations = profil["formations"]
            if "firstname" in profil.keys():
                pli.firstname = profil["firstname"]
            if "lastname" in profil.keys():
                pli.lastname = profil["lastname"]
            if "industry" in profil.keys():
                pli.industry = profil["industry"]
            if "locality" in profil.keys():
                pli.locality = profil["locality"]
            if "headline" in profil.keys():
                pli.headline = profil["headline"]
            if "relation" in profil.keys():
                pli.relation = profil["relation"]
            if "resume" in profil.keys():
                pli.resume = profil["resume"]
            if "current_post" in profil.keys():
                pli.current_post = profil["current_post"]
            if "past_post" in profil.keys():
                pli.past_post = profil["past_post"]
            if "certifications" in profil.keys():
                pli.certifications = json.dumps(profil["certifications"])
            if "experiences" in profil.keys():
                pli.experiences = json.dumps(profil["experiences"])
            if "skills" in profil.keys():
                pli.skills = profil["skills"]
            if "url" in profil.keys():
                pli.url = profil["url"]
            key2 = pli.put()
            es = Edge.insert(start_node=key1, end_node=key2, kind='linkedin', inverse_edge='parents')


class GetCompanyFromLinkedinToIoGrow(webapp2.RequestHandler):
    def post(self):
        entityKey = self.request.get('entityKey')
        linkedin = linked_in()
        key1 = ndb.Key(urlsafe=entityKey)
        account = key1.get()
        print account
        profil = linkedin.scrape_company(account.name)
        if profil:
            pli = model.LinkedinCompany()
            pli.name = profil["name"]
            pli.website = profil["website"]
            pli.industry = profil["industry"]
            pli.headquarters = profil["headquarters"]
            pli.summary = profil["summary"]
            pli.founded = profil["founded"]
            pli.followers = profil["followers"]
            pli.logo = profil["logo"]
            pli.specialties = profil["specialties"]
            pli.top_image = profil["top_image"]
            pli.type = profil["type"]
            pli.company_size = profil["company_size"]
            pli.url = profil["url"]
            pli.workers = json.dumps(profil["workers"])
            key2 = pli.put()
            es = Edge.insert(start_node=key1, end_node=key2, kind='linkedin', inverse_edge='parents')


class update_tweets(webapp2.RequestHandler):
    def post(self):
        # Discovery.update_tweets()
        user_from_email = EndpointsHelper.require_iogrow_user()
        tagss = Tag.list_by_just_kind("topics")
        for tag in tagss.items:
            taskqueue.add(
                url='/workers/insert_crawler',
                queue_name='iogrow-critical',
                params={
                    'topic': tag.name,
                    'organization': user_from_email.organization.id()
                }
            )


class delete_tweets(webapp2.RequestHandler):
    def post(self):
        Discovery.delete_tweets()


class get_popular_posts(webapp2.RequestHandler):
    def post(self):
        Discovery.get_popular_posts()


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


class InitReport(webapp2.RequestHandler):
    def post(self):
        admin = ndb.Key(urlsafe=self.request.get("admin")).get()
        Reports.create(user_from_email=admin)


class InitReports(webapp2.RequestHandler):
    def post(self):
        Reports.init_reports()


def extract_leads_from_message(gmail_service, user, thread_id):
    thread_details = gmail_service.users().threads().get(userId='me', id=thread_id, fields='messages/payload').execute()
    for message in thread_details['messages']:
        updated_at = None
        updated_at_dt = None
        for field in message['payload']['headers']:
            if field['name'] == 'Date':
                try:
                    service = DateService()
                    updated_at_dt = service.extractDate(field['value'])
                    if updated_at_dt:
                        updated_at = updated_at_dt.isoformat()
                except:
                    print 'error when extracting date'

            if field['name'] == 'From' or field['name'] == 'To':
                name = field['value'].split('<')[0]
                check_if_email = re.search('([\w.-]+)@([\w.-]+)', name)
                if check_if_email is None:
                    match = re.search('([\w.-]+)@([\w.-]+)', field['value'])
                    if match:
                        if match.group() != user.email:
                            firstname = name.split()[0]
                            lastname = " ".join(name.split()[1:])

                            if Lead.get_key_by_name(user, firstname, lastname):
                                lead_key = Lead.get_key_by_name(user, firstname, lastname)
                                lead = lead_key.get()
                                if updated_at_dt:
                                    lead.updated_at = updated_at_dt
                                    lead.put()
                            else:
                                email = iomessages.InfoNodeRequestSchema(kind='emails', fields=[
                                    {'field': 'email', 'value': match.group()}])
                                request = LeadInsertRequest(
                                    firstname=firstname,
                                    lastname=lastname,
                                    infonodes=[email],
                                    access='private',
                                    source='Gmail sync',
                                    updated_at=updated_at
                                )
                                print request
                                Lead.insert(user, request)


class InitLeadsFromGmail(webapp2.RequestHandler):
    def post(self):
        email = self.request.get('email')
        user = model.User.get_by_email(email)
        credentials = user.google_credentials
        http = credentials.authorize(httplib2.Http(memcache))
        gmail_service = build('gmail', 'v1', http=http)
        nextPageToken = None
        you_can_loop = True
        threads_list = []
        try:
            while you_can_loop:
                # prepare params to insert
                threads = gmail_service.users().threads().list(userId='me', q='category:primary',
                                                               pageToken=nextPageToken).execute()
                for thread in threads['threads']:
                    threads_list.append(thread['id'])
                if 'nextPageToken' in threads:
                    nextPageToken = threads['nextPageToken']
                else:
                    you_can_loop = False
            for thread_id in threads_list:
                try:
                    thread_details = gmail_service.users().threads().get(userId='me', id=thread_id,
                                                                         fields='messages/payload').execute()
                    extract_leads_from_message(gmail_service, user, thread_id)
                except:
                    print 'error when extracting leads from thread number', thread_id
        except:
            print 'problem on getting threads'


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


class SFusersCSV(BaseHandler, SessionEnabledHandler):
    def get(self):
        self.response.headers['Content-Type'] = 'application/csv'
        writer = csv.writer(self.response.out)
        sfusers = model.SFuser.query().fetch()
        for u in sfusers:
            is_paying = False
            if u.stripe_id:
                is_paying = True
            writer.writerow(["%s %s" % (u.firstname, u.lastname), u.email, is_paying])


# scrapyd UI
class ScrapydHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        template_values = {}
        template = jinja_environment.get_template('templates/scrapydUI.html')
        self.response.out.write(template.render(template_values))


class SitemapHandler(BaseHandler, SessionEnabledHandler):
    def get(self):
        template_values = {}
        template = jinja_environment.get_template('sitemap.xml')
        self.response.out.write(template.render(template_values))


class InsertCrawler(webapp2.RequestHandler):
    def post(self):
        topic = self.request.get('topic')
        organization = self.request.get('organization')
        # url="http://104.154.43.236:8091/insert_keyword?keyword="+topic+"&organization="+organization
        # requests.get(url=url)
        payload = {'keyword': topic, 'organization': organization}
        r = requests.get(config_urls.nodeio_server + "/twitter/crawlers/insert", params=payload)


class cron_update_tweets(BaseHandler, SessionEnabledHandler):
    def get(self):
        taskqueue.add(
            url='/workers/update_tweets',
            queue_name='iogrow-low',
            params={}
        )


class cron_delete_tweets(BaseHandler, SessionEnabledHandler):
    def get(self):
        Discovery.delete_tweets()
        '''taskqueue.add(
                            url='/workers/delete_tweets',
                            queue_name='iogrow-low',
                            params={}
                        )
        '''


class cron_get_popular_posts(BaseHandler, SessionEnabledHandler):
    def get(self):
        Discovery.get_popular_posts()


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
    ('/workers/get_from_linkedin', GetFromLinkedinToIoGrow),
    ('/workers/get_company_from_linkedin', GetCompanyFromLinkedinToIoGrow),
    ('/workers/update_tweets', update_tweets),
    ('/workers/update_tweets', delete_tweets),
    ('/workers/send_gmail_message', SendGmailEmail),
    ('/workers/init_leads_from_gmail', InitLeadsFromGmail),

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

    # report actions
    ('/workers/initreport', InitReport),
    ('/workers/initreports', InitReports),
    ('/workers/insert_crawler', InsertCrawler),
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
    # Templates Views Routes
    ('/views/discovers/list', DiscoverListHandler),
    ('/views/discovers/show', DiscoverShowHandler),
    ('/views/discovers/new', DiscoverNewHandler),
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

    # Applications settings
    (r'/apps/(\d+)', ChangeActiveAppHandler),
    # ioGrow Live
    ('/zohoapi/markaslead', ZohoSaveLead),
    ('/sfapi/dev/markaslead', SFmarkAsLeadDev),
    ('/sfapi/dev/search', SFsearchDev),
    ('/sfapi/search_photo', SFsearchphoto),
    ('/welcome/', WelcomeHandler),
    ('/chrome-extension/', ChromeExtensionHandler),
    ('/terms-of-services/', TermsOfServicesHandler),
    ('/privacy/', PrivacyHandler),
    ('/security/', SecurityInformationsHandler),
    # Authentication Handlers
    ('/sign-in', SignInHandler),
    ('/sign-up', SignUpHandler),
    ('/gconnect', GooglePlusConnect),
    ('/install', InstallFromDecorator),
    (decorator.callback_path, decorator.callback_handler()),
    ('/sfimporter', SalesforceImporter),
    ('/sfconnect', SFconnect),
    ('/paypal_paying_users', PayPalPayingUsers),
    ('/sfsubscriber', SFsubscriber),
    ('/sfsubscribertest', SFsubscriberTest),

    ('/sfoauth2callback', SalesforceImporterCallback),
    ('/zohosignin', ZohoSignIn),
    ('/zohouser', ZohoUser),
    ('/copylead_sf_auth_callback', SFcallback),

    ('/sf_invite', SFinvite),
    ('/invitation_sent', SFinvite),
    ('/stripe', StripeHandler),
    # paying with stripe
    ('/paying', StripePayingHandler),
    ('/views/dashboard', DashboardHandler),
    ('/scrapyd', ScrapydHandler),
    ('/jj', ImportJob),
    ('/exportcompleted', ExportCompleted),
    ('/sign-with-iogrow', SignInWithioGrow),
    ('/sf-users', SFusersCSV),
    ('/copylead/sf/api/users/get', GetSfUser),
    ('/copylead/sf/api/invitees/list_by_partners', SFlistInviteesByPartners),

    # ('/gmail-copylead',GmailAnalysisForCopylead),
    # ('/copyleadcsv',GmailAnalysisForCopyleadCSV),


    ('/sitemap', SitemapHandler)

]

config = {'webapp2_extras.sessions': {
    'secret_key': 'YOUR_SESSION_SECRET'
}}
# to config the local directory the way we want .
# config['webapp2_extras.i18n'] = {
#     'translations_path': 'path/to/my/locale/directory',
# }
app = webapp2.WSGIApplication(routes, config=config, debug=True)

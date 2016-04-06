import datetime
# Google libs
import os

import httplib2
from google.appengine.ext import ndb
from google.appengine.api import memcache
from google.appengine.api import taskqueue
from google.appengine.api import search
from google.appengine.api import urlfetch

from iomodels.crmengine import config
from iomodels.crmengine.payment import Subscription
from oauth2client.appengine import CredentialsNDBProperty
from apiclient.discovery import build
from oauth2client.client import flow_from_clientsecrets
from oauth2client.client import FlowExchangeError

# Third parties
from endpoints_proto_datastore.ndb import EndpointsModel
# Our libraries
from iomodels.crmengine.opportunitystage import Opportunitystage
from iomodels.crmengine.leadstatuses import Leadstatus
from iomodels.crmengine.casestatuses import Casestatus

from search_helper import tokenize_autocomplete

# from ioreporting import Reports
import iomessages

# hadji hicham 20/08/2014.
import stripe
import json
import re
import endpoints

from intercom import Intercom
from mixpanel import Mixpanel

mp = Mixpanel('793d188e5019dfa586692fc3b312e5d1')
Intercom.app_id = 's9iirr8w'
Intercom.api_key = 'ae6840157a134d6123eb95ab0770879367947ad9'

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
    # {'name': 'Discovery','label': 'Discovery','url':'/#/discovers/','icon':'twitter'},
    {'name': 'Leads', 'label': 'Leads', 'url': '/#/leads/', 'icon': 'road'},
    {'name': 'Opportunities', 'label': 'Opportunities', 'url': '/#/opportunities/', 'icon': 'money'},
    {'name': 'Contacts', 'label': 'Contacts', 'url': '/#/contacts/', 'icon': 'group'},
    {'name': 'Accounts', 'label': 'Accounts', 'url': '/#/accounts/', 'icon': 'building'},
    {'name': 'Cases', 'label': 'Cases', 'url': '/#/cases/', 'icon': 'suitcase'},
    {'name': 'Tasks', 'label': 'Tasks', 'url': '/#/tasks/', 'icon': 'check'},
    {'name': 'Calendar', 'label': 'Calendar', 'url': '/#/calendar/', 'icon': 'calendar'}
    # {'name': 'Dashboard','label': 'Dashboard','url':'/#/dashboard/','icon':'dashboard'}
]
EARLY_BIRD_TABS = [
    {'name': 'Contacts', 'label': 'Contacts', 'url': '/#/contacts/', 'icon': 'group'},
    {'name': 'Leads', 'label': 'Leads', 'url': '/#/leads/', 'icon': 'road'},
    {'name': 'Tasks', 'label': 'Tasks', 'url': '/#/tasks/', 'icon': 'check'},
    {'name': 'Calendar', 'label': 'Calendar', 'url': '/#/calendar/', 'icon': 'calendar'}
]
STANDARD_PROFILES = ['Super Administrator', 'Standard User']
STANDARD_APPS = [{'name': 'sales', 'label': 'Relationships', 'url': '/#/leads/'}]
STANDARD_OBJECTS = ['Account', 'Contact', 'Opportunity', 'Lead', 'Case', 'Campaign']
ADMIN_TABS = [
    {'name': 'Company', 'label': 'Company', 'url': '/#/admin/company', 'icon': 'building'},
    {'name': 'Users', 'label': 'Users', 'url': '/#/admin/users', 'icon': 'group'},
    {'name': 'Billing', 'label': 'Billing', 'url': '/#/admin/billing', 'icon': 'credit-card'},
    {'name': 'EmailSignature', 'label': 'Email Signature', 'url': '/#/admin/email_signature', 'icon': 'envelope'},

    # {'name': 'Billing','label': 'Billing','url':'/#/billing/','icon':'usd'},
    {'name': 'Regional', 'label': 'Regional', 'url': '/#/admin/regional', 'icon': 'globe'},
    {'name': 'LeadStatus', 'label': 'Lead Status', 'url': '/#/admin/lead_status', 'icon': 'road'},
    # {'name': 'LeadScoring', 'label': 'Lead Scoring', 'url': '/#/admin/lead_scoring', 'icon': ' fa-dashboard'},
    {'name': 'Opportunity', 'label': 'Opportunity', 'url': '/#/admin/opportunity', 'icon': 'money'},
    {'name': 'CaseStatus', 'label': 'Case Status', 'url': '/#/admin/case_status', 'icon': 'suitcase'},
    # {'name': 'Synchronisation','label': 'Synchronisation','url':'/#/admin/synchronisation','icon':'refresh'},
    {'name': 'CustomFields', 'label': 'Custom Fields', 'url': '/#/admin/custom_fields/1', 'icon': 'list-alt'},
    # {'name': 'DataTransfer', 'label': 'Data Transfer', 'url': '/#/admin/data_transfer', 'icon': 'cloud'},
    {'name': 'DeleteAllRecords', 'label': 'Delete Records', 'url': '/#/admin/delete_all_records', 'icon': 'trash-o'},

]
ADMIN_APP = {'name': 'admin', 'label': 'Settings', 'url': '/#/admin/users'}
"""Iogrowlive_APP = {'name':'iogrowLive','label': 'i/oGrow Live','url':'/#/live/shows'}

Iogrowlive_TABS = [{'name': 'Shows','label': 'Shows','url':'/#/live/shows'},{'name': 'Company_profile','label': 'Company Profile','url':'/#/live/company_profile/'},
{'name': 'Product_videos','label': 'Product Videos','url':'/#/live/product_videos'},{'name': 'Customer_Stories','label': 'Customer stories','url':'/#/live/customer_stories'},
{'name': 'Feedbacks','label': 'Feedbacks','url':'/#/live/feedbacks'},{'name': 'Leads','label': 'Leads','url':'/#/leads/'}]"""
Default_Opp_Stages = [
    {'name': 'Incoming', 'probability': 5, 'stage_number': 1},
    {'name': 'Qualified', 'probability': 10, 'stage_number': 2},
    {'name': 'Need Analysis', 'probability': 40, 'stage_number': 3},
    {'name': 'Negotiating', 'probability': 80, 'stage_number': 4},
    {'name': 'Close won', 'probability': 100, 'stage_number': 0},
    {'name': 'Close lost', 'probability': 0, 'stage_number': 0}
]
Default_Case_Status = [
    {'status': 'pending'},
    {'status': 'open'},
    {'status': 'closed'}
]
Default_Lead_Status = [
    {'status': 'New'},
    {'status': 'Working'},
    {'status': 'Unqualified'},
    {'status': 'Closed converted'}
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
# stripe.api_key = "sk_test_4Xa3wfSl5sMQYgREe5fkrjVF"
stripe.api_key = config.STRIPE_API_KEY


class Tokens(ndb.Model):
    token = ndb.StringProperty()
    email = ndb.StringProperty()
    user = ndb.KeyProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)


class Partner(ndb.Model):
    name = ndb.StringProperty()
    email = ndb.StringProperty()
    iogrow_contact_id = ndb.StringProperty()


class Coupon(ndb.Model):
    code = ndb.StringProperty()
    related_to_partner = ndb.KeyProperty()
    duration = ndb.IntegerProperty()
    is_available = ndb.BooleanProperty(default=True)

    @classmethod
    def get_by_code(cls, code):
        return cls.query(cls.code == code).get()


class SFuser(ndb.Model):
    firstname = ndb.StringProperty()
    lastname = ndb.StringProperty()
    email = ndb.StringProperty(required=True)
    stripe_id = ndb.StringProperty()
    active_until = ndb.DateTimeProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)


class SFinvitation(ndb.Model):
    user_email = ndb.StringProperty()
    user_key = ndb.KeyProperty()
    partner_email = ndb.StringProperty()
    partner_key = ndb.KeyProperty()
    invitee_email = ndb.StringProperty()
    invitee_name = ndb.StringProperty()
    status = ndb.StringProperty(default='pending')
    opened = ndb.IntegerProperty(default=0)
    clicked = ndb.IntegerProperty(default=0)
    invited_at = ndb.DateTimeProperty(auto_now_add=True)
    subscription_started_at = ndb.DateTimeProperty()
    subscription_ended_at = ndb.DateTimeProperty()

    @classmethod
    def list_by_partner(cls, partner_key):
        response = {
            'pending': [],
            'active': [],
            'paying': [],
            'all': []
        }
        invitees = cls.query(cls.partner_key==partner_key).fetch()
        for invitee in invitees:
            invitee_dict = {
                'invitee_email': invitee.invitee_email,
                'status': invitee.status
            }
            if invitee.status =='active':
                response['active'].append(invitee_dict)
            elif invitee.status =='paying':
                response['paying'].append(invitee_dict)
            else:
                response['pending'].append(invitee_dict)
        response['all'] = response['pending'] + response['active'] + response['paying']
        return response



class SFpartner(ndb.Model):
    firstname = ndb.StringProperty()
    lastname = ndb.StringProperty()
    email = ndb.StringProperty()
    phone = ndb.StringProperty()
    country = ndb.StringProperty()






class SFLead(ndb.Model):
    firstname = ndb.StringProperty()
    lastname = ndb.StringProperty()
    sf_id = ndb.StringProperty(required=True)
    photo_url = ndb.StringProperty()
    linkedin_url = ndb.StringProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    created_by = ndb.KeyProperty()


class ZohoLead(ndb.Model):
    firstname = ndb.StringProperty()
    lastname = ndb.StringProperty()
    zoho_id = ndb.StringProperty(required=True)
    photo_url = ndb.StringProperty()
    linkedin_url = ndb.StringProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    created_by = ndb.KeyProperty()


class PaypalPayedUser(ndb.Model):
    txn_type = ndb.StringProperty()
    subscr_id = ndb.StringProperty()
    last_name = ndb.StringProperty()
    mc_currency = ndb.StringProperty()
    item_name = ndb.StringProperty()
    business = ndb.StringProperty()
    amount3 = ndb.StringProperty()
    verify_sign = ndb.StringProperty()
    payer_status = ndb.StringProperty()
    payer_email = ndb.StringProperty()
    first_name = ndb.StringProperty()
    receiver_email = ndb.StringProperty()
    payer_id = ndb.StringProperty()
    item_number = ndb.StringProperty()
    subscr_date = ndb.StringProperty()
    address_name = ndb.StringProperty()
    ipn_track_id = ndb.StringProperty()
    option_selection1 = ndb.StringProperty()
    option_name1 = ndb.StringProperty()
    active_until = ndb.DateTimeProperty()


class ZohoUser(ndb.Model):
    email = ndb.StringProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)


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


class LicenseModel(ndb.Model):
    name = ndb.StringProperty()
    payment_type = ndb.StringProperty()
    price = ndb.FloatProperty()
    is_free = ndb.BooleanProperty()
    duration = ndb.IntegerProperty()


class CustomField(ndb.Model):
    name = ndb.StringProperty()
    related_object = ndb.StringProperty()
    field_type = ndb.StringProperty()
    help_text = ndb.StringProperty()
    options = ndb.StringProperty(repeated=True)
    scale_min = ndb.IntegerProperty()
    scale_max = ndb.IntegerProperty()
    label_min = ndb.StringProperty()
    label_max = ndb.StringProperty()
    owner = ndb.StringProperty()
    organization = ndb.KeyProperty()
    order = ndb.IntegerProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)

    @classmethod
    def list_by_object(cls, user, related_object):
        return cls.query(cls.related_object == related_object, cls.organization == user.organization).order(
            cls.order).fetch()

    @classmethod
    def last_order_by_object(cls, user, related_object):
        custom_fields = cls.list_by_object(user, related_object)
        if custom_fields:
            last = custom_fields[len(custom_fields) - 1]
            if last.order:
                return last.order
            else:
                i = 1
                for custom_field in custom_fields:
                    custom_field.order = i
                    custom_field.put()
                    i += 1
                return i - 1
        else:
            return 0

    @classmethod
    def reorder(cls, user, custom_field, new_order):
        if custom_field.order != new_order:
            custom_fields = cls.list_by_object(user, custom_field.related_object)
            for c in custom_fields:
                if new_order < custom_field.order:
                    if c.key != custom_field.key:
                        if c.order >= new_order:
                            c.order += 1
                            c.put()
                else:
                    if c.key != custom_field.key:
                        if c.order <= new_order and c.order > custom_field.order:
                            c.order -= 1
                            c.put()
            custom_field.order = new_order
            custom_field.put()


# We use the Organization model to separate the data of each organization from each other
class Organization(ndb.Model):
    owner = ndb.StringProperty()
    name = ndb.StringProperty()
    # We can use status property later for checking if the organization is active or suspended
    status = ndb.StringProperty()
    # Which plan ? is it a free plan, basic plan or premium plan...
    plan = ndb.KeyProperty()
    nb_licenses = ndb.IntegerProperty()
    nb_used_licenses = ndb.IntegerProperty()
    nb_users = ndb.IntegerProperty()
    licenses_expires_on = ndb.DateTimeProperty()
    instance_created = ndb.BooleanProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    billing_contact_firstname = ndb.StringProperty()
    billing_contact_lastname = ndb.StringProperty()
    billing_contact_email = ndb.StringProperty()
    billing_contact_address = ndb.StringProperty()
    billing_contact_phone_number = ndb.StringProperty()
    coupon = ndb.KeyProperty()
    related_to_partner = ndb.KeyProperty()
    should_upgrade = ndb.BooleanProperty()
    subscription = ndb.KeyProperty(kind=Subscription)
    stripe_customer_id = ndb.StringProperty()

    def get_subscription(self):
        if not self.subscription:
            if self.plan and self.plan.get().name == "life_time_free":
                self.subscription = Subscription.create_life_free_subscription().key
            else:
                self.subscription = Subscription.create_freemium_subscription().key
            self.put()
        return self.subscription.get()

    def set_subscription(self, new_subscription):
        if not isinstance(new_subscription, Subscription):
            raise ValueError('sub parameter should be of type {} '.format(Subscription.__class__))
        if self.subscription:
            self.subscription.delete()
        self.subscription = new_subscription.key
        self.put()

    @classmethod
    def init_life_time_free_licenses(cls, org_key):
        res = LicenseModel.query(LicenseModel.name == 'life_time_free').fetch(1)
        organization = org_key.get()
        if res:
            license = res[0]

        else:
            license = LicenseModel(name='life_time_free', payment_type='online', price=0, is_free=True, duration=30)
            license.put()
        organization.plan = license.key
        organization.nb_licenses = 10
        now = datetime.datetime.now()
        now_plus_month = now + datetime.timedelta(days=30)
        organization.licenses_expires_on = now_plus_month
        organization.put()

    @classmethod
    def init_freemium_licenses(cls, org_key):
        res = LicenseModel.query(LicenseModel.name == 'freemium').get()
        organization = org_key.get()
        if res:
            license = res
        else:
            license = LicenseModel(name='freemium', payment_type='online', price=0, is_free=True, duration=30)
            license.put()
        organization.plan = license.key
        organization.nb_licenses = 10
        now = datetime.datetime.now()
        now_plus_month = now + datetime.timedelta(days=30)
        organization.licenses_expires_on = now_plus_month
        organization.put()

    @classmethod
    def init_preemium_trial_licenses(cls, org_key, promo_code):
        if promo_code:
            coupon = Coupon.get_by_code(promo_code)
            if coupon:
                res = LicenseModel.query(LicenseModel.name == 'premium_trial').get()
                organization = org_key.get()
                if res:
                    license = res
                else:
                    license = LicenseModel(name='premium_trial', payment_type='online', price=0, is_free=True,
                                           duration=30)
                    license.put()
                organization.plan = license.key
                organization.nb_licenses = 10
                organization.related_to_partner = coupon.related_to_partner
                organization.coupon = coupon.key
                now = datetime.datetime.now()
                now_plus_coupoun_duration = now + datetime.timedelta(days=coupon.duration)
                organization.licenses_expires_on = now_plus_coupoun_duration
                organization.put()
            else:
                cls.init_freemium_licenses(org_key)
        else:
            cls.init_freemium_licenses(org_key)

    # @classmethod
    # def init_freemium_licenses(cls, org_key):
    #     cls.init_life_time_free_licenses(org_key)

    @classmethod
    def init_default_values(cls, org_key):
        # HKA 17.12.2013 Add an opportunity stage
        for oppstage in Default_Opp_Stages:
            created_opp_stage = Opportunitystage(organization=org_key, name=oppstage['name'],
                                                 probability=oppstage['probability'],
                                                 stage_number=oppstage['stage_number'], nbr_opportunity=0,
                                                 amount_opportunity=0)
            created_opp_stage.put_async()
        # HKA 17.12.2013 Add an Case status
        for casestat in Default_Case_Status:
            created_case_status = Casestatus(status=casestat['status'], organization=org_key)
            created_case_status.put_async()
        # HKA 17.12.2013 Add an Lead status
        for leadstat in Default_Lead_Status:
            created_lead_stat = Leadstatus(status=leadstat['status'], organization=org_key)
            created_lead_stat.put_async()

    # Create a standard instance for this organization
    # assign the right license for this organization
    @classmethod
    def create_instance(cls, org_name, admin, license_type='freemium', promo_code=None):
        # customer = stripe.Customer.create(
        #     plan='freemium_month',
        #     email=admin.email
        # )
        organization = cls(
            owner=admin.google_user_id,
            name=org_name,
            nb_used_licenses=1,
        )
        org_key = organization.put()
        mp.track(admin.id, 'SIGNED_UP_SUCCESS')
        # mp.identify(admin.id)
        # mp.people_set(admin.id,{
        # "$email": admin.email,
        # "$name":admin.google_display_name,
        # "$created": admin.created_at,
        # "$organization": admin.organization,
        # "$language": admin.language
        # });
        from iograph import Edge
        Edge.insert(start_node=org_key, end_node=admin.key, kind='admins', inverse_edge='parents')
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
            created_tab = Tab(name=tab['name'], label=tab['label'], url=tab['url'], icon=tab['icon'],
                              organization=org_key)
            tab_key = created_tab.put()
            created_tabs.append(tab_key)
        # create admin tabs
        admin_tabs = []
        for tab in ADMIN_TABS:
            created_tab = Tab(name=tab['name'], label=tab['label'], url=tab['url'], icon=tab['icon'],
                              organization=org_key)
            tab_key = created_tab.put()
            admin_tabs.append(tab_key)
        # create standard apps
        created_apps = []
        sales_app = None
        for app in STANDARD_APPS:
            created_app = Application(name=app['name'], label=app['label'], url=app['url'], tabs=created_tabs,
                                      organization=org_key)
            app_key = created_app.put()
            if app['name'] == 'sales':
                sales_app = app_key
            created_apps.append(app_key)
        # create admin app
        app = ADMIN_APP
        admin_app = Application(name=app['name'], label=app['label'], url=app['url'], tabs=admin_tabs,
                                organization=org_key)
        admin_app_key = admin_app.put()
        # create standard profiles
        for profile in STANDARD_PROFILES:
            default_app = sales_app
            if profile == 'Super Administrator':
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
            if profile == 'Super Administrator':
                admin_profile_key = created_profile.put()
                admin.init_user_config(org_key, admin_profile_key)
            else:
                created_profile.put()
        # create reports details

        # init default stages,status, default values...
        cls.init_default_values(org_key)
        if license_type == 'premium_trial':
            # init with premium trial
            print 'premium_trial'
            cls.init_preemium_trial_licenses(org_key, promo_code)
        elif license_type == 'life_time_free':
            # init with freemium license
            print 'life_time_free'
            cls.init_life_time_free_licenses(org_key)
        else:
            # now, we can continue with the life_time_free license
            cls.init_freemium_licenses(org_key)
        admin.license_status = 'active'
        now = datetime.datetime.now()
        now_plus_month = now + datetime.timedelta(days=30)
        admin.license_expires_on = now_plus_month
        admin.is_admin = True
        admin.put()
        # organization.subscription = organization.get_subscription().key
        organization.set_subscription(Subscription.create_freemium_subscription())
        admin.set_subscription(Subscription.create_freemium_subscription())
        return org_key

    @classmethod
    def create_early_bird_instance(cls, org_name, admin):
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
            created_tab = Tab(name=tab['name'], label=tab['label'], url=tab['url'], icon=tab['icon'],
                              organization=org_key)
            tab_key = created_tab.put()
            created_tabs.append(tab_key)
        # create admin tabs
        admin_tabs = []
        for tab in ADMIN_TABS:
            created_tab = Tab(name=tab['name'], label=tab['label'], url=tab['url'], icon=tab['icon'],
                              organization=org_key)
            tab_key = created_tab.put()
            admin_tabs.append(tab_key)
        # create standard apps
        created_apps = []
        sales_app = None
        for app in STANDARD_APPS:
            created_app = Application(name=app['name'], label=app['label'], url=app['url'], tabs=created_tabs,
                                      organization=org_key)
            app_key = created_app.put()
            if app['name'] == 'sales':
                sales_app = app_key
            created_apps.append(app_key)
        # create admin app
        app = ADMIN_APP
        admin_app = Application(name=app['name'], label=app['label'], url=app['url'], tabs=admin_tabs,
                                organization=org_key)
        admin_app_key = admin_app.put()
        # create standard profiles
        for profile in STANDARD_PROFILES:
            default_app = sales_app
            if profile == 'Super Administrator':
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
            if profile == 'Super Administrator':
                admin_profile_key = created_profile.put()
                admin.init_early_bird_config(org_key, admin_profile_key)
            else:
                created_profile.put_async()
        # create reports details
        # Reports.create(user_from_email=admin)

        # init default stages,status, default values...
        cls.init_default_values(org_key)

    def get_assigned_licenses(self):
        return len(filter(lambda user: user.has_license(self.get_subscription().key),
                          User.fetch_by_organization(self.key)))

    @classmethod
    def assign_license(cls, org_key, user_key):
        organization = org_key.get()
        user = user_key.get()
        assigned_licenses = organization.get_assigned_licenses()
        org_subscription = organization.get_subscription()
        user_subscription = user.get_subscription()
        if org_subscription.plan.get().name != config.PREMIUM:
            raise endpoints.BadRequestException('You have to upgrade')
        if org_subscription.quantity - assigned_licenses < 1:
            raise endpoints.UnauthorizedException('you need more licenses')
        if user_subscription.key == org_subscription.key:
            raise endpoints.BadRequestException('this user already have an activated licences')
        if user.organization != org_key:
            raise endpoints.UnauthorizedException('The user is not withing your organization')
        user.set_subscription(org_subscription)
        # org_subscription.quantity -= 1
        # org_subscription.put()

    @classmethod
    def unassign_license(cls, org_key, user_key):
        organization = org_key.get()
        user = user_key.get()
        org_subscription = organization.get_subscription()
        user_subscription = user.get_subscription()
        if user_subscription.plan.get().name != config.PREMIUM:
            raise endpoints.BadRequestException('You have to upgrade')
        if user_subscription.key != org_subscription.key:
            raise endpoints.BadRequestException('this user already have an activated licences')
        if user.organization != org_key:
            raise endpoints.UnauthorizedException('The user is not withing your organization')
        user.set_subscription(Subscription.create_freemium_subscription())


    @classmethod
    def upgrade_to_business_version(cls, org_key):
        current_org_apps = Application.query(Application.organization == org_key).fetch()
        # delete existing apps
        for app in current_org_apps:
            app.key.delete()
        current_org_tabs = Tab.query(Tab.organization == org_key).fetch()
        # delete existing tabs
        for tab in current_org_tabs:
            tab.key.delete()

        created_tabs = []
        for tab in STANDARD_TABS:
            created_tab = Tab(name=tab['name'], label=tab['label'], url=tab['url'], icon=tab['icon'],
                              organization=org_key)
            tab_key = created_tab.put()
            created_tabs.append(tab_key)
        # create admin tabs
        admin_tabs = []
        for tab in ADMIN_TABS:
            created_tab = Tab(name=tab['name'], label=tab['label'], url=tab['url'], icon=tab['icon'],
                              organization=org_key)
            tab_key = created_tab.put()
            admin_tabs.append(tab_key)
        # create standard apps
        created_apps = []
        sales_app = None
        for app in STANDARD_APPS:
            created_app = Application(name=app['name'], label=app['label'], url=app['url'], tabs=created_tabs,
                                      organization=org_key)
            app_key = created_app.put()
            if app['name'] == 'sales':
                sales_app = app_key
            created_apps.append(app_key)
        # create admin app
        app = ADMIN_APP
        admin_app = Application(name=app['name'], label=app['label'], url=app['url'], tabs=admin_tabs,
                                organization=org_key)
        admin_app_key = admin_app.put()
        profiles = Profile.query(Profile.organization == org_key).fetch()
        created_apps.append(admin_app_key)
        created_tabs.extend(admin_tabs)
        for profile in profiles:
            default_app = sales_app
            profile.apps = created_apps
            profile.default_app = default_app
            profile.tabs = created_tabs
            profile.put()

        users = User.query(User.organization == org_key).fetch()
        for user in users:
            user_profile = user.profile.get()
            user.init_user_config(org_key, user.profile)
            user.set_user_active_app(user_profile.default_app)

    @classmethod
    def get_license_status(cls, org_key):
        organization = org_key.get()
        nb_users = 0
        nb_used_licenses = 0
        users = User.query(User.organization == organization.key).fetch()
        if users:
            for user in users:
                if user.license_status == 'active':
                    nb_used_licenses = nb_used_licenses + 1
            nb_users = len(users)
        license_schema = None
        if organization.plan is None:
            res = LicenseModel.query(LicenseModel.name == 'life_time_free').fetch(1)
            if res:
                license = res[0]
            else:
                license = LicenseModel(name='life_time_free', payment_type='online', price=0, is_free=True, duration=30)
                license.put()
            organization.plan = license.key
            organization.put()
        else:
            license = organization.plan.get()
        if license:
            license_schema = iomessages.LicenseModelSchema(
                id=str(license.key.id()),
                entityKey=license.key.urlsafe(),
                name=license.name
            )

        now = datetime.datetime.now()
        if organization.licenses_expires_on:
            days_before_expiring = organization.licenses_expires_on - now
            expires_on = organization.licenses_expires_on
        else:
            expires_on = organization.created_at + datetime.timedelta(days=30)
            days_before_expiring = organization.created_at + datetime.timedelta(days=30) - now

        if organization.nb_licenses:
            nb_licenses = organization.nb_licenses

        organizatoin_schema = iomessages.OrganizationAdminSchema(
            id=str(organization.key.id()),
            entityKey=organization.key.urlsafe(),
            name=organization.name,
            nb_users=nb_users,
            nb_licenses=nb_licenses,
            nb_used_licenses=nb_used_licenses,
            billing_contact_firstname=organization.billing_contact_firstname,
            billing_contact_lastname=organization.billing_contact_lastname,
            billing_contact_email=organization.billing_contact_email,
            billing_contact_address=organization.billing_contact_address,
            license=license_schema,
            days_before_expiring=days_before_expiring.days + 1,
            expires_on=expires_on.isoformat(),
            created_at=organization.created_at.isoformat(),
            billing_contact_phone_number=organization.billing_contact_phone_number
        )
        return organizatoin_schema

    @classmethod
    def set_billing_infos(cls, org_key, request, payment_switch_status, plan, nb_licenses, plan_duration):
        organization = org_key.get()
        organization.plan = plan
        organization.billing_contact_firstname = request.billing_contact_firstname
        organization.billing_contact_lastname = request.billing_contact_lastname
        organization.billing_contact_email = request.billing_contact_email
        organization.billing_contact_address = request.billing_contact_address
        organization.billing_contact_phone_number = request.billing_contact_phone_number

        if payment_switch_status == "f_m" or payment_switch_status == "f_y" or payment_switch_status == "m_y":
            now = datetime.datetime.now()
            now_plus_exp_day = now + datetime.timedelta(days=plan_duration)
            organization.licenses_expires_on = now_plus_exp_day
            organization.nb_licenses = nb_licenses

        if payment_switch_status == "m_m" or payment_switch_status == "y_y":
            organization.nb_licenses = organization.nb_licenses + nb_licenses

        organization.put()


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

    def get_basic_info(self, user):
        self.email = user.email
        self.display_name = user.google_display_name
        self.google_user_id = user.google_user_id
        self.google_public_profile_url = user.google_public_profile_url
        self.photo = user.google_public_profile_photo_url
        return self


class CountryCurrency(ndb.Model):
    country_name = ndb.StringProperty()
    country_code = ndb.StringProperty()
    currency_name = ndb.StringProperty()
    length_decimal = ndb.IntegerProperty()
    length_whole_part = ndb.IntegerProperty()
    sections_delimiter = ndb.StringProperty()
    decimal_delimiter = ndb.StringProperty()

    @classmethod
    def init(cls):
        us_code = cls(
            country_name='United States of America',
            country_code='US',
            currency_name='USD',
            length_decimal=2,
            length_whole_part=3,
            sections_delimiter=',',
            decimal_delimiter='.'
        )
        us_code.put()

    @classmethod
    def get_by_code(cls, code):
        return cls.query(cls.country_code == code).get()


class User(EndpointsModel):
    # General informations about the user
    _message_fields_schema = ('id', 'email', 'completed_tour', 'installed_chrome_extension', 'entityKey',
                              'google_user_id', 'google_display_name', 'google_public_profile_photo_url', 'language',
                              'status', 'gmail_to_lead_sync', 'currency_format', 'default_currency', 'country_code',
                              'date_time_format', 'currency', 'week_start', 'emailSignature')
    email = ndb.StringProperty()
    google_user_id = ndb.StringProperty()
    google_display_name = ndb.StringProperty()
    google_public_profile_url = ndb.StringProperty()
    google_public_profile_photo_url = ndb.StringProperty()
    google_credentials = CredentialsNDBProperty()
    # Store the informations about the user settings
    language = ndb.StringProperty(default='en')
    gmail_to_lead_sync = ndb.IntegerProperty(default=1)
    timezone = ndb.StringProperty(default="")
    # Is the user a public user or business user
    type = ndb.StringProperty()
    # If the user is a business user, we store the informations about him
    # stripe id , id represent an enter in the table of customers in stripe api.
    stripe_id = ndb.StringProperty()
    # that's coool
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
    license_status = ndb.StringProperty()
    license_expires_on = ndb.DateTimeProperty()
    completed_tour = ndb.BooleanProperty()
    installed_chrome_extension = ndb.BooleanProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    emailSignature = ndb.StringProperty()
    currency_format = ndb.StringProperty()
    currency = ndb.StringProperty()
    week_start = ndb.StringProperty()
    default_currency = ndb.StringProperty()
    country_code = ndb.StringProperty()
    date_time_format = ndb.StringProperty()
    subscription = ndb.KeyProperty(kind=Subscription)

    def get_subscription(self):
        if self.organization.get().subscription:
            if not self.subscription or not self.subscription.get():
                self.subscription = Subscription.create_freemium_subscription().key
                self.put()
        return self.subscription.get()

    @classmethod
    def fetch_by_organization(cls, org_key):
        return cls.query(User.organization == org_key).fetch()

    def set_subscription(self, new_subscription):
        if not isinstance(new_subscription, Subscription):
            raise ValueError('sub parameter should be of type {} '.format(Subscription.__class__))
        if self.subscription:
            if self.subscription != self.organization.get().get_subscription().key:
                self.subscription.delete()
        self.subscription = new_subscription.key
        self.put()

    def after_create(self, user_id):
        if self.status == "active" and not is_locale():
            mp.track(user_id, 'NEW_USER')
            mp.people_set(user_id, {
                "$email": self.email,
                "$name": self.google_display_name,
                "$created": self.created_at,
                "$organization": '' if not self.organization else self.organization.get().name,
                "$language": self.language
            })

    def put(self, **kwargs):
        existing_user = User.query(User.google_user_id == self.google_user_id).get()
        if existing_user:
            ndb.Model.put(existing_user, **kwargs)
        else:
            ndb.Model.put(self, **kwargs)
        self.after_create(self.id)

    def put_async(self, **kwargs):
        async = super(User, self).put_async(**kwargs)
        self.after_create(async.get_result().id())
        return async

    @classmethod
    def count_by_organization(cls, org_key):
        return cls.query(cls.organization == org_key).count()

    def has_license(self, sub_key):
        user_subscription = self.subscription
        if user_subscription:
            return user_subscription == sub_key
        return False

    @classmethod
    def fetch_by_organization(cls, org_key):
        return cls.query(cls.organization == org_key).fetch()

    def init_user_config(self, org_key, profile_key):
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
        if memcache.get(self.email):
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

    def init_early_bird_config(self, org_key, profile_key):
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
        if memcache.get(self.email):
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
    def memcache_update(cls, user, email):
        if memcache.get(user.email):
            memcache.set(user.email, user)
        else:
            memcache.add(user.email, user)

    @classmethod
    def get_default_currency(cls, user):
        if user.default_currency is None:
            user.default_currency = 'US'
            user.put()
            return CountryCurrency.get_by_code('US')
        return CountryCurrency.get_by_code(user.default_currency)

    @classmethod
    def set_default_currency(cls, user, code):
        if code == 'ZZ' or code is None:
            code = 'US'
        user.default_currency = code
        user.put()

    @classmethod
    def get_currency_format(cls, user):
        if user.currency_format is None:
            user.currency_format = 'US'
            user.put()
            return CountryCurrency.get_by_code('US')
        return CountryCurrency.get_by_code(user.currency_format)

    @classmethod
    def set_currency_format(cls, user, code):
        if code == 'ZZ' or code is None:
            code = 'US'
        user.currency_format = code
        user.put()

    @classmethod
    def get_by_email(cls, email):
        user_from_email = memcache.get(email)
        if user_from_email is not None:
            return user_from_email
        user_from_email = cls.query(cls.email == email).get()
        if memcache.get(email):
            memcache.set(email, user_from_email)
        else:
            memcache.add(email, user_from_email)
        return user_from_email

    @classmethod
    def get_by_gid(cls, gid):
        return cls.query(cls.google_user_id == gid).get()

    def get_user_apps(self):
        return ndb.get_multi(self.apps)

    def get_user_active_app(self):
        mem_key = '%s_active_app' % self.google_user_id
        active_app = memcache.get(mem_key)
        if active_app is not None:
            return active_app
        return self.active_app.get()

    def set_user_active_app(self, app_key):
        if app_key in self.apps:
            self.active_app = app_key
            self.app_changed = True
            active_app = app_key.get()
            active_tabs = active_app.tabs
            mem_key = '%s_tabs' % self.google_user_id
            if memcache.get(mem_key):
                memcache.set(mem_key, ndb.get_multi(active_app.tabs))
            else:
                memcache.add(mem_key, ndb.get_multi(active_app.tabs))
            active_app_mem_key = '%s_active_app' % self.google_user_id
            if memcache.get(active_app_mem_key):
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
            # elif self.active_tabs:
            #     memcache.add(mem_key, ndb.get_multi(self.active_tabs))
            #     return ndb.get_multi(self.active_tabs)
            else:
                active_app = self.active_app.get()
                self.active_tabs = active_app.tabs
                self.put()
                memcache.add(mem_key, ndb.get_multi(self.active_tabs))
                return ndb.get_multi(active_app.tabs)

    @classmethod
    def get_schema(cls, user_from_email):
        user = cls.get_by_id(int(user_from_email.id))
        if user is None:
            raise endpoints.NotFoundException('Lead not found.')
        user_schema = iomessages.UserSchema(
            id=str(user.key.id()),
            entityKey=user.key.urlsafe(),
            email=user.email,
            google_display_name=user.google_display_name,
            google_public_profile_photo_url=user.google_public_profile_photo_url,
            google_public_profile_url=user.google_public_profile_url,
            google_user_id=user.google_user_id,
            is_admin=user.is_admin,
            status=user.status,
            stripe_id=user.stripe_id,
            license_status=user.license_status,
            language=user.language,
            gmail_to_lead_sync=user.gmail_to_lead_sync,
            timezone=user.timezone,
            type=user.type,
            organization=str(user.organization),
            profile=str(user.profile),
            role=user.role,
            currency_format=user.currency_format,
            country_code=user.country_code,
            date_time_format=user.date_time_format,
            currency=user.currency,
            week_start=user.week_start,
            emailSignature=user.emailSignature
        )
        return user_schema

    @classmethod
    def patch(cls, user_from_email, request):
        user = cls.get_by_id(int(user_from_email.id))
        if user is None:
            raise endpoints.NotFoundException('Lead not found.')
        properties = ['email', 'is_admin', 'status', 'license_status', 'language', 'timezone', 'gmail_to_lead_sync',
                      'type', 'status', 'UserPatchRequest', 'role', 'google_public_profile_photo_url',
                      'currency_format',
                      'country_code', 'date_time_format', 'currency', 'week_start', 'emailSignature']
        for p in properties:
            if hasattr(request, p):
                if (eval('user.' + p) != eval('request.' + p)) \
                        and (eval('request.' + p) != None and not (p in ['put', 'set_perm', 'put_index'])):
                    exec ('user.' + p + '= request.' + p)
        user.put()
        memcache.set(user_from_email.email, user)

        # get_schema_request = iomessages.UserGetRequest(id=int(request.id))
        return cls.get_schema(user)

    def get_user_groups(self):
        list_of_groups = list()
        results = Member.query(Member.memberKey == self.key).fetch()
        for group in results:
            list_of_groups.append(group.groupKey)
        return list_of_groups

    @classmethod
    def list(cls, organization):
        items = []
        users = cls.query(cls.organization == organization)
        org = organization.get()
        for user in users:
            is_super_admin = False
            if org.owner == user.google_user_id:
                is_super_admin = True

            # if Edge.find(user.organization,[user.key],'admins',"AND"):
            #         is_admin=True
            # else:
            #         is_admin=False
            user_schema = iomessages.UserSchema(
                id=str(user.key.id()),
                entityKey=user.key.urlsafe(),
                email=user.email,
                google_display_name=user.google_display_name,
                google_public_profile_url=user.google_public_profile_url,
                google_public_profile_photo_url=user.google_public_profile_photo_url,
                google_user_id=user.google_user_id,
                is_admin=user.is_admin,
                status=user.status,
                license_status=user.license_status,
                is_super_admin=is_super_admin
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
        return iomessages.UserListSchema(items=items, invitees=invitees_list)

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
            profile = Profile.query(
                Profile.name == 'Standard User',
                Profile.organization == invited_by.organization
            ).get()
            Invitation.delete_by(user.email)
            user.init_user_config(invited_by.organization, profile.key)
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
        if memcache.get(user.email):
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
    def sign_in(cls, request):
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
        # Check if is it an invitation to sign-in or just a simple sign-in
        invited_user_id = None
        invited_user_id_request = request.id
        if invited_user_id_request:
            invited_user_id = long(invited_user_id_request)
            # user = model.User.query(model.User.google_user_id == token_info.get('user_id')).get()

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
        if request.sign_in_from:
            Intercom.create_event(
                event_name='sign-in from ' + request.sign_in_from,
                email=user.email
            )
            # mp.track(user.id, 'SIGN_IN_USER')
        return iomessages.UserSignInResponse(is_new_user=isNewUser)

    @classmethod
    def sign_up(cls, user, request):
        taskqueue.add(
            url='/workers/add_to_iogrow_leads',
            queue_name='iogrow-low',
            params={
                'email': user.email,
                'organization': request.organization_name
            }
        )

        Organization.ance(request.organization_name, user)

    @classmethod
    def check_license(cls, user):
        is_active = True
        if user.license_status != 'active':
            is_active = False
        now = datetime.datetime.now()
        if user.license_expires_on < now:
            is_active = False
        return is_active

    @classmethod
    def desactivate(cls, user_from_email):
        msg = "user not found "
        print user_from_email
        if user_from_email:
            organization = user_from_email.organization.get()
            msg = ""
            users = cls.query(cls.organization == user_from_email.organization).fetch()
            if len(users) > 1:
                msg = "you are not illegible to delete this organization"
            else:
                msg = "user deleted"
                apps = Application.query(Application.organization == user_from_email.organization).fetch()
                for app in apps:
                    app.key.delete()
                profiles = Profile.query(Profile.organization == user_from_email.organization).fetch()
                for profile in profiles:
                    profile.key.delete()
                casestatuses = Casestatus.query(Casestatus.organization == user_from_email.organization).fetch()
                for casestatuse in casestatuses:
                    casestatuse.key.delete()
                leadstatuses = Leadstatus.query(Leadstatus.organization == user_from_email.organization).fetch()
                for leadstatuse in leadstatuses:
                    leadstatuse.key.delete()
                oppstages = Opportunitystage.query(
                    Opportunitystage.organization == user_from_email.organization).fetch()
                for oppstage in oppstages:
                    oppstage.key.delete()
                permissions = Permission.query(Permission.value == str(user_from_email.google_user_id)).fetch()
                for permission in permissions:
                    permission.key.delete()
                tabs = Tab.query(Tab.organization == user_from_email.organization).fetch()
                for tab in tabs:
                    tab.key.delete()
                user_from_email.key.delete()
                from iograph import Edge
                Edge.delete_all(user_from_email.organization)
                organization.key.delete()
        return msg

    @classmethod
    def switch_org(cls, user_from_email, entityKey):
        msg = "user not found "
        print user_from_email
        from iomodels.crmengine.leads import Lead
        from iomodels.crmengine.notes import Note
        from iomodels.crmengine.contacts import Contact
        from iomodels.crmengine.events import Event
        from iomodels.crmengine.cases import Case
        from iomodels.crmengine.opportunities import Opportunity
        from iomodels.crmengine.tasks import Task
        from iomodels.crmengine.tags import Tag
        from iomodels.crmengine.documents import Document

        user = ndb.Key(urlsafe=entityKey).get()
        if user_from_email:
            organization = user.organization
            print "##################################################"
            print organization
            print "********************************"
            print cls.organization
            msg = ""
            users = cls.query(cls.organization == user_from_email.organization).fetch()
            if len(users) > 1:
                msg = "you are not illegible to delete this organization"
            else:
                msg = "user deleted"
                apps = Application.query(Application.organization == user.organization).fetch()
                for app in apps:
                    app.key.delete()
                profiles = Profile.query(Profile.organization == user.organization).fetch()
                for profile in profiles:
                    profile.key.delete()
                casestatuses = Casestatus.query(Casestatus.organization == user.organization).fetch()
                for casestatuse in casestatuses:
                    casestatuse.key.delete()
                leadstatuses = Leadstatus.query(Leadstatus.organization == user.organization).fetch()
                for leadstatuse in leadstatuses:
                    leadstatuse.key.delete()
                oppstages = Opportunitystage.query(Opportunitystage.organization == user.organization).fetch()
                for oppstage in oppstages:
                    oppstage.key.delete()
                # permissions= Permission.query(Permission.value==str(user.google_user_id)).fetch()  
                # for permission in permissions:
                #     permission.key.delete()
                tabs = Tab.query(Tab.organization == user.organization).fetch()
                for tab in tabs:
                    tab.key.delete()

                from  iomodels.crmengine.accounts import Account

                accounts = Account.query(Account.organization == user.organization).fetch()
                for account in accounts:
                    account.organization = user_from_email.organization
                    account.put()
                leads = Lead.query(Lead.organization == user.organization).fetch()
                for lead in leads:
                    lead.organization = user_from_email.organization
                    lead.put()
                contacts = Contact.query(Contact.organization == user.organization).fetch()
                for contact in contacts:
                    contact.organization = user_from_email.organization
                    contact.put()
                cases = Case.query(Case.organization == user.organization).fetch()
                for case in cases:
                    case.organization = user_from_email.organization
                    case.put()
                opportunities = Opportunity.query(Opportunity.organization == user.organization).fetch()
                for opportunity in opportunities:
                    opportunity.organization = user_from_email.organization
                    opportunity.put()
                tasks = Task.query(Task.organization == user.organization).fetch()
                for task in tasks:
                    task.organization = user_from_email.organization
                    task.put()
                events = Event.query(Event.organization == user.organization).fetch()
                for event in events:
                    event.organization = user_from_email.organization
                    event.put()
                notes = Note.query(Note.organization == user.organization).fetch()
                for note in notes:
                    note.organization = user_from_email.organization
                    note.put()
                tags = Tag.query(Tag.organization == user.organization).fetch()
                for tag in tags:
                    tag.organization = user_from_email.organization
                    tag.put()
                docs = Document.query(Document.organization == user.organization).fetch()
                for doc in docs:
                    doc.organization = user_from_email.organization
                    doc.put()
                profiles = Profile.query(Profile.organization == user.organization).fetch()
                for prof in profiles:
                    prof.organization = user_from_email.organization
                    prof.put()
                permissions = Permission.query(Permission.organization == user.organization).fetch()
                for permission in permissions:
                    permission.organization = user_from_email.organization
                    permission.put()
                customfields = CustomField.query(CustomField.organization == user.organization).fetch()
                for cf in customfields:
                    cf.organization = user_from_email.organization
                    cf.put()
                user.organization = user_from_email.organization
                user.put()
                # from iograph import Edge
                # Edge.delete_all(user.organization)
                organization.delete()

        return msg


class Group(EndpointsModel):
    _message_fields_schema = ('id', 'entityKey', 'name', 'description', 'status', 'organization')
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


class Invitation(ndb.Model):
    invited_mail = ndb.StringProperty()
    invited_by = ndb.KeyProperty()
    organization = ndb.KeyProperty()
    updated_at = ndb.DateTimeProperty(auto_now=True)
    stripe_id = ndb.StringProperty()

    @classmethod
    def delete_by(cls, email):
        invitations = cls.query(
            cls.invited_mail == email
        ).fetch()
        for invitation in invitations:
            invitation.key.delete()

    @classmethod
    def insert(cls, email, invited_by):
        # check if the user is invited
        invitation = cls.query(
            cls.invited_mail == email,
            cls.organization == invited_by.organization
        ).get()
        if invitation is None:
            invitation = cls(
                invited_mail=email,
                organization=invited_by.organization
            )
        invitation.invited_by = invited_by.key
        # cust=stripe.Customer.create(  
        #           email= email,
        #           description=email,
        #           metadata={"organization_key":invited_by.organization.urlsafe()})
        # invitation.stripe_id=cust.id
        invitation.put()

    @classmethod
    def list_invitees(cls, organization):
        items = []
        invitees = cls.query(cls.organization == organization).fetch()
        for invitee in invitees:
            item = {
                'invited_mail': invitee.invited_mail,
                'invited_by': invitee.invited_by.get().google_display_name,
                'updated_at': invitee.updated_at

            }
            items.append(item)
        return items


# hadji hicham 14/12/2014 , transaction model
class TransactionModel(EndpointsModel):
    _message_fields_schema = ('id', 'entityKey', 'organization', 'charge', 'amount', 'transaction_date')
    organization = ndb.KeyProperty()
    charge = ndb.StringProperty()
    amount = ndb.IntegerProperty()
    transaction_date = ndb.DateTimeProperty(auto_now_add=True)


# HKA 19.11.2013 Class for Phone on all Object
class Phone(ndb.Model):
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


# HADJI HICHAM 08/028/2015
class Logo(ndb.Model):
    fileUrl = ndb.StringProperty()
    custom_logo = ndb.StringProperty()
    organization = ndb.KeyProperty()


# HKA 30.12.2013 Manage Company Profile

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
    introduction = ndb.TextProperty()
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
        title_autocomplete = ','.join(tokenize_autocomplete(self.name))
        show_document_for_live = search.Document(
            doc_id=str(self.organizationid),
            fields=[
                search.TextField(name=u'type', value=u'Company'),
                search.TextField(name='organization', value=empty_string(self.name)),
                search.TextField(name='title_autocomplete', value=empty_string(title_autocomplete)),
            ])
        live_index = search.Index(name="ioGrowLiveIndex")
        live_index.put(show_document_for_live)


class Certification(ndb.Model):
    name = ndb.StringProperty()
    specifics = ndb.StringProperty(repeated=True)


class Experience(ndb.Model):
    title = ndb.StringProperty()
    period = ndb.StringProperty()
    organisation = ndb.StringProperty()
    description = ndb.StringProperty()


class Experiences(ndb.Model):
    current_exprience = ndb.StructuredProperty(Experience)
    past_exprience = ndb.StructuredProperty(Experience, repeated=True)


class LinkedinProfile(ndb.Model):
    lastname = ndb.StringProperty(indexed=False)
    firstname = ndb.StringProperty(indexed=False)
    industry = ndb.StringProperty(indexed=False)
    locality = ndb.StringProperty(indexed=False)
    headline = ndb.StringProperty(indexed=False)
    current_post = ndb.StringProperty(repeated=True, indexed=False)
    past_post = ndb.StringProperty(repeated=True, indexed=False)
    formations = ndb.StringProperty(repeated=True, indexed=False)
    websites = ndb.StringProperty(repeated=True, indexed=False)
    relation = ndb.StringProperty(indexed=False)
    experiences = ndb.TextProperty(indexed=False)
    resume = ndb.TextProperty(indexed=False)
    certifications = ndb.TextProperty(indexed=False)
    skills = ndb.StringProperty(repeated=True, indexed=False)
    url = ndb.StringProperty(indexed=False)
    languages = ndb.StringProperty(repeated=True, indexed=False)
    phones = ndb.StringProperty(repeated=True, indexed=False)
    emails = ndb.StringProperty(repeated=True, indexed=False)


class LinkedinCompany(ndb.Model):
    name = ndb.StringProperty(indexed=False)
    website = ndb.StringProperty(indexed=False)
    industry = ndb.StringProperty(indexed=False)
    headquarters = ndb.StringProperty(indexed=False)
    summary = ndb.TextProperty(indexed=False)
    founded = ndb.StringProperty(indexed=False)
    followers = ndb.StringProperty(indexed=False)
    logo = ndb.StringProperty(indexed=False)
    specialties = ndb.StringProperty(indexed=False)
    top_image = ndb.StringProperty(indexed=False)
    type = ndb.StringProperty(indexed=False)
    company_size = ndb.StringProperty(indexed=False)
    url = ndb.StringProperty(indexed=False)
    workers = ndb.TextProperty(indexed=False)
    address = ndb.StringProperty(indexed=False)


class TwitterProfile(ndb.Model):
    id = ndb.IntegerProperty(indexed=False)
    followers_count = ndb.IntegerProperty(indexed=False)
    last_tweet_text = ndb.StringProperty(indexed=False)
    last_tweet_favorite_count = ndb.IntegerProperty(indexed=False)
    last_tweet_retweeted = ndb.StringProperty(indexed=False)
    last_tweet_retweet_count = ndb.IntegerProperty(indexed=False)
    language = ndb.StringProperty(indexed=False)
    created_at = ndb.StringProperty(indexed=False)
    nbr_tweets = ndb.IntegerProperty(indexed=False)
    description_of_user = ndb.StringProperty(indexed=False)
    friends_count = ndb.IntegerProperty(indexed=False)
    name = ndb.StringProperty(indexed=False)
    screen_name = ndb.StringProperty(indexed=False)
    url_of_user_their_company = ndb.StringProperty(indexed=False)
    location = ndb.StringProperty(indexed=False)
    profile_image_url_https = ndb.StringProperty(indexed=False)
    lang = ndb.StringProperty(indexed=False)
    profile_banner_url = ndb.StringProperty(indexed=False)


class TweetsSchema(ndb.Model):
    id = ndb.StringProperty(indexed=True)
    profile_image_url = ndb.StringProperty(indexed=False)
    author_name = ndb.StringProperty(indexed=False)
    created_at = ndb.DateTimeProperty(indexed=False)
    content = ndb.StringProperty(indexed=False)
    author_followers_count = ndb.IntegerProperty(indexed=False)
    author_location = ndb.StringProperty(indexed=False)
    author_language = ndb.StringProperty(indexed=False)
    author_statuses_count = ndb.IntegerProperty(indexed=False)
    author_description = ndb.StringProperty(indexed=False)
    author_friends_count = ndb.IntegerProperty(indexed=False)
    author_favourites_count = ndb.IntegerProperty(indexed=False)
    author_url_website = ndb.StringProperty(indexed=False)
    created_at_author = ndb.StringProperty(indexed=False)
    time_zone_author = ndb.StringProperty(indexed=False)
    author_listed_count = ndb.IntegerProperty(indexed=False)
    screen_name = ndb.StringProperty(indexed=False)
    retweet_count = ndb.IntegerProperty(indexed=True)
    favorite_count = ndb.IntegerProperty(indexed=False)
    topic = ndb.StringProperty(indexed=True)
    order = ndb.StringProperty(indexed=True)
    latitude = ndb.StringProperty(indexed=False)
    longitude = ndb.StringProperty(indexed=False)
    tweets_stored_at = ndb.DateTimeProperty(indexed=True)


class TopicScoring(ndb.Model):
    topic = ndb.StringProperty(indexed=True)
    score = ndb.FloatProperty(indexed=True)
    value = ndb.FloatProperty(indexed=True, default=0)
    screen_name = ndb.StringProperty(indexed=True)


class ImportJob(ndb.Model):
    file_path = ndb.StringProperty()
    status = ndb.StringProperty(default='pending')
    stage = ndb.StringProperty()
    parent_job = ndb.KeyProperty()
    sub_jobs = ndb.IntegerProperty(default=0)
    completed_jobs = ndb.IntegerProperty(default=0)
    failed_jobs = ndb.IntegerProperty(default=0)
    user = ndb.KeyProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)


class LinkedinPage(ndb.Model):
    url = ndb.StringProperty()
    html = ndb.TextProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)

    @classmethod
    def get_by_url(cls, url):
        return cls.query(cls.url == url).get()


class ProxyServer(ndb.Model):
    ip = ndb.StringProperty()
    status = ndb.StringProperty(default='ready')
    nb_requests = ndb.IntegerProperty(default=0)
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    last_request = ndb.DateTimeProperty()

    @classmethod
    def choose(cls):
        ready_servers = cls.query(cls.status == 'ready').order(cls.last_request).fetch(1)
        if ready_servers:
            return ready_servers[0]
        return None

    @classmethod
    def update_status(cls, server, status):
        if status == 'ready':
            server.nb_requests += 1
            server.last_request = datetime.datetime.now()
            server.put()
        else:
            server.status = 'problem'
            server.put()





class CopyLeadSfSession(ndb.Model):
    access_token = ndb.StringProperty()
    user = ndb.KeyProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)

    @classmethod
    def get_by_access_token(cls, access_token):
        response = cls.query(cls.access_token == access_token).fetch(1)
        if response:
            session = response[0]
            return session.user
        return None


def is_locale():
    return os.environ['SERVER_SOFTWARE'].startswith('Dev')

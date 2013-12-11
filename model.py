#!/usr/bin/python
# Copyright 2013 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

"""Persistent datamodel for I/Ogrow."""

import json
import logging
import random
import re
import string
import datetime
import types
import handlers
from apiclient.discovery import build
from google.appengine.api import images

from google.appengine.ext import db
from google.appengine.ext import blobstore
from oauth2client.appengine import CredentialsNDBProperty
from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel

STANDARD_TABS = [{'name': 'Accounts','label': 'Accounts','url':'/#/accounts/'},{'name': 'Contacts','label': 'Contacts','url':'/#/contacts/'},{'name': 'Opportunities','label': 'Opportunities','url':'/#/opportunities/'},{'name': 'Leads','label': 'Leads','url':'/#/leads/'},{'name': 'Cases','label': 'Cases','url':'/#/cases/'}]
STANDARD_PROFILES = ['Super Administrator', 'Standard User', 'Sales User', 'Marketing User', 'Read Only', 'Support User', 'Contract Manager','Read Only']
STANDARD_APPS = [{'name': 'sales', 'label': 'Sales', 'url':'/#/accounts/'},#{'name': 'marketing', 'label':'Marketing', 'url':'/#/compaigns/'},
{'name':'call_center','label': 'Customer Support','url':'/#/cases/'}]
STANDARD_OBJECTS = ['Account','Contact','Opportunity','Lead','Case','Campaign']
ADMIN_TABS = [{'name': 'Users','label': 'Users','url':'/#/admin/users'},{'name': 'Groups','label': 'Groups','url':'/#/admin/groups'}]
ADMIN_APP = {'name': 'admin', 'label': 'Admin Console', 'url':'/#/admin/users'}


# Models for Appcfg
# The Object class will be useful to manage Default Sharing setting to each organization
class Object(EndpointsModel):
    name = ndb.StringProperty(required=True)
    description = ndb.TextProperty()
    is_custom = ndb.BooleanProperty()
    organization = ndb.KeyProperty(required=True)
# This class will manage the default access for each object under the organization    
class SharingSettings(EndpointsModel):
    related_object = ndb.KeyProperty(required=True)
    default_access = ndb.StringProperty(required=True,default='pc_r_w')
    grant_access = ndb.BooleanProperty(default=True)
    organization = ndb.KeyProperty(required=True)

class Application(EndpointsModel):
    name = ndb.StringProperty(required=True)
    label = ndb.StringProperty(required=True)
    url = ndb.StringProperty()
    tabs = ndb.KeyProperty(repeated=True)
    organization = ndb.KeyProperty(required=True)

class Tab(EndpointsModel):
    name = ndb.StringProperty(required=True)
    label = ndb.StringProperty(required=True)
    url = ndb.StringProperty()
    organization = ndb.KeyProperty(required=True)
    tabs = ndb.KeyProperty(repeated=True)

# We use the Organization model to separate the data of each organization from each other
class Organization(EndpointsModel):
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

    def put(self, **kwargs):
      ndb.Model.put(self, **kwargs)
      self._setup()
    # Create a standard instance for this organization  
    def _setup(self):
        # Check if there is no instance for this organization
        if self.instance_created is None:
          org_key = self.key
          # Add standard objects:
          for obj in STANDARD_OBJECTS:
            created_object = Object(name=obj,organization=org_key)
            created_object.put()
            object_default_settings = SharingSettings(related_object=created_object.key,organization=org_key)
            object_default_settings.put()

         
          # Add tabs:
          created_tabs = list()
          for tab in STANDARD_TABS:

            created_tab = Tab(name=tab['name'],label=tab['label'],url=tab['url'],organization=org_key)
            created_tab.put()
            created_tabs.append(created_tab.key)
          admin_tabs = list()
          for tab in ADMIN_TABS:
              created_tab = Tab(name=tab['name'],label=tab['label'],url=tab['url'],organization=org_key)
              created_tab.put()
              admin_tabs.append(created_tab.key)

          # Add apps:
          created_apps = list()
          sales_app = None
          #marketing_app = None
          support_app = None
          for app in STANDARD_APPS:

            created_app = Application(name=app['name'],label=app['label'],url=app['url'],tabs=created_tabs,organization=org_key)
            created_app.put()
            if app['name']=='sales':

              sales_app = created_app.key
            #if app['name']=='marketing':
              #marketing_app = created_app.key
            if app['name']=='call_center':
              support_app = created_app.key
            created_apps.append(created_app.key)
          app = ADMIN_APP
          admin_app = Application(name=app['name'],label=app['label'],url=app['url'],tabs=admin_tabs,organization=org_key)
          admin_app.put()

          
          # Add profiles
          
          
          for profile in STANDARD_PROFILES:
            default_app = sales_app
            #if profile=='Marketing User':
             # default_app = marketing_app
            if profile=='Support User':
              default_app = support_app
            elif profile=='Super Administrator':
              created_apps.append(admin_app.key)
              created_tabs.extend(admin_tabs)



            created_profile = Profile(name=profile,apps=created_apps,default_app=default_app,tabs=created_tabs,organization=org_key)
            created_profile.put()
            
class Permission(EndpointsModel):
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
class Profile(EndpointsModel):
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
    language = ndb.StringProperty()
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

    
    google_user_id = ndb.StringProperty()
    display_name = ndb.StringProperty()
    google_public_profile_url = ndb.StringProperty()
    photo = ndb.StringProperty()
    def init_user_config(self,org_key,profile_key):
        profile = profile_key.get()
        # Get Apps for this profile:
        apps = profile.apps
        # Get active_app
        active_app = profile.default_app
        # Prepare user to be updated
        self.organization = org_key
        self.profile = profile_key
        self.apps = apps
        self.active_app = active_app
        # Put it 
        self.put()
    
    def get_user_apps(self):
      
        return ndb.get_multi(self.apps)
    def get_user_active_app(self):
        return self.active_app.get()
    
    def set_user_active_app(self,app_key):
      if app_key in self.apps:
        self.active_app = app_key
        self.app_changed = True
        future = self.put_async()
        return future
    def get_user_active_tabs(self):
        
          active_app = self.active_app.get()
          profile = self.profile.get()
          visible_tabs_to_profile = profile.tabs 
          tabs = list()
          for tab in active_app.tabs:
            
              tabs.append(tab)
          self.active_tabs = tabs
          self.put()
          return ndb.get_multi(active_app.tabs)

    def get_user_groups(self):
        list_of_groups = list()
        results = Member.query(Member.memberKey==self.key).fetch()
        for group in results:
            list_of_groups.append(group.groupKey)
        return list_of_groups

class Group(EndpointsModel):
    _message_fields_schema = ('id','entityKey','name','description','status','members', 'organization')
    owner = ndb.KeyProperty()
    name = ndb.StringProperty(required=True)
    description = ndb.TextProperty()
    status = ndb.StringProperty()
    members = ndb.StructuredProperty(Userinfo,repeated=True)
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




#HKA 19.11.2013 Class for Phone on all Object
class Phone(EndpointsModel) :
    type_number = ndb.StringProperty()
    number = ndb.StringProperty()
# HKA 19.11.2013 Class for email
class Email(EndpointsModel):
  email = ndb.StringProperty()
# HKA 19.11.2013 Class for Address
class Address(EndpointsModel):
  street = ndb.StringProperty()
  city = ndb.StringProperty()
  state = ndb.StringProperty()
  postal_code = ndb.StringProperty()
  country = ndb.StringProperty()
# HKA 19.11.2013 Add Website class
class Website(EndpointsModel):
  website = ndb.StringProperty()
# HKA 19.11.2013 Add Social links
class Social(EndpointsModel):
  sociallink = ndb.StringProperty()

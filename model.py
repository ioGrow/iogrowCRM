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

STANDARD_TABS = [{'name': 'Accounts','label': 'Accounts','url':'/#/accounts/p/1'},{'name': 'Contacts','label': 'Contacts','url':'/#/contacts/p/1'},{'name': 'Opportunities','label': 'Opportunities','url':'/#/opportunities/p/1'},{'name': 'Leads','label': 'Leads','url':'/#/leads/p/1'}]
STANDARD_PROFILES = ['Super Administrator', 'Standard User', 'Sales User', 'Marketing User', 'Read Only', 'Support User', 'Contract Manager','Read Only']
STANDARD_APPS = [{'name': 'sales', 'label': 'Sales', 'url':'/#/accounts/p/1'},{'name': 'marketing', 'label':'Marketing', 'url':'/#/compaigns/p/1'},{'name':'call_center','label': 'Call Center','url':'/#/cases/p/1'}]
STANDARD_OBJECTS = ['Account','Contact','Opportunity','Lead','Case','Campaign']


class JsonifiableEncoder(json.JSONEncoder):
  """JSON encoder which provides a convenient extension point for custom JSON
  encoding of Jsonifiable subclasses.
  """
  def default(self, obj):
    if isinstance(obj, Jsonifiable):
      result = json.loads(obj.to_json())
      return result
    return json.JSONEncoder.default(self, obj)

class Jsonifiable:
  """Base class providing convenient JSON serialization and deserialization
  methods.
  """
  jsonkind = 'photohunt#jsonifiable'

  @staticmethod
  def lower_first(key):
    """Make the first letter of a string lower case."""
    return key[:1].lower() + key[1:] if key else ''

  @staticmethod
  def transform_to_camelcase(key):
    """Transform a string underscore separated words to concatenated camel case.
    """
    return Jsonifiable.lower_first(
        ''.join(c.capitalize() or '_' for c in key.split('_')))

  @staticmethod
  def transform_from_camelcase(key):
    """Tranform a string from concatenated camel case to underscore separated
    words.
    """
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', key)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

  def to_dict(self):
    """Returns a dictionary containing property values for the current object
    stored under the property name in camel case form.
    """
    result = {}
    for p in self.json_properties():
      value = getattr(self, p)
      if isinstance(value, datetime.datetime):
        value = value.strftime('%s%f')[:-3]
      result[Jsonifiable.transform_to_camelcase(p)] = value
    return result

  def to_json(self):
    """Returns a JSON string of the properties of this object."""
    properties = self.to_dict()
    if isinstance(self, db.Model):
      properties['id'] = unicode(self.key().id())
    return json.dumps(properties)

  def json_properties(self):
    """Returns a default list properties for this object that should be
    included when serializing this object to, or deserializing it from, JSON.

    Subclasses can customize the properties by overriding this method.
    """
    attributes = []
    all = vars(self)
    for var in all:
      if var[:1] != '_':
        attributes.append(var)
    if isinstance(self, db.Model):
      properties = self.properties().keys()
      for property in properties:
        if property[:1] != '_':
          attributes.append(property)
    return attributes

  def from_json(self, json_string):
    """Sets properties on this object based on the JSON string supplied."""
    o = json.loads(json_string)
    properties = {}
    if isinstance(self, db.Model):
      properties = self.properties()
    for key, value in o.iteritems():
      property_value = value
      property_key = Jsonifiable.transform_from_camelcase(key)
      if property_key in properties.keys():
        if properties[property_key].data_type == types.IntType:
          property_value = int(value)
      self.__setattr__(property_key, property_value)

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
          
          # Add apps:
          created_apps = list()
          sales_app = None
          marketing_app = None
          support_app = None
          for app in STANDARD_APPS:

            created_app = Application(name=app['name'],label=app['label'],url=app['url'],tabs=created_tabs,organization=org_key)
            created_app.put()
            if app['name']=='sales':

              sales_app = created_app.key
            if app['name']=='marketing':
              marketing_app = created_app.key
            if app['name']=='call_center':
              support_app = created_app.key
            created_apps.append(created_app.key)

          # Add profiles
          
          
          for profile in STANDARD_PROFILES:
            default_app = sales_app
            if profile=='Marketing User':
              default_app = marketing_app
            elif profile=='Support User':
              default_app = support_app


            created_profile = Profile(name=profile,apps=created_apps,default_app=default_app,tabs=created_tabs,organization=org_key)
            created_profile.put()
            
            
   
          


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
class User(EndpointsModel):
    # General informations about the user
    _message_fields_schema = ('id','email', 'google_user_id','google_display_name','google_public_profile_photo_url','language')
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
    type_of_user = ndb.StringProperty()
    # If the user is a business user, we store the informations about him 
    organization = ndb.KeyProperty()
    profile = ndb.KeyProperty()
    role = ndb.KeyProperty()
    is_admin = ndb.BooleanProperty()
    # The appcfg for this business user
    apps = ndb.KeyProperty(repeated=True)
    active_app = ndb.KeyProperty()
    # Active tabs the user can see in this active_app
    active_tabs = ndb.KeyProperty(repeated=True)
    app_changed = ndb.BooleanProperty(default=True)

    
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
        self.put_async()

    
    
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








class DirectedUserToUserEdge(db.Model, Jsonifiable):
  """Represents friend links between PhotoHunt users."""
  owner_user_id = db.IntegerProperty()
  friend_user_id = db.IntegerProperty()


class Photo(db.Model, Jsonifiable):
  """Represents a user submitted Photo."""
  jsonkind = 'photohunt#photo'
  DEFAULT_THUMBNAIL_SIZE = 400
  fullsize_url = None
  thumbnail_url = None
  vote_cta_url = None
  photo_content_url = None
  num_votes = None
  voted = False

  owner_user_id = db.IntegerProperty()
  owner_display_name = db.StringProperty()
  owner_profile_url = db.StringProperty()
  owner_profile_photo = db.StringProperty()
  theme_id = db.IntegerProperty()
  theme_display_name = db.StringProperty()
  image_blob_key = blobstore.BlobReferenceProperty()
  created = db.DateTimeProperty(auto_now_add=True)

  def __init__(self, *args, **kwargs):
    db.Model.__init__(self, *args, **kwargs)
    self._setup()

  def put(self, **kwargs):
    db.Model.put(self, **kwargs)
    self._setup()

  def _setup(self):
    """Populate transient fields after load or initialization."""
    if self.image_blob_key:
      self.fullsize_url = self.get_image_url()
      self.thumbnail_url = self.get_image_url(self.DEFAULT_THUMBNAIL_SIZE)
    if self.is_saved():
      key = self.key()
      self.num_votes = Vote.all().filter("photo_id =", key.id()).count()
      template = '%s/index.html?photoId=%s%s'
      self.vote_cta_url = template % (
          handlers.get_base_url(), key.id(), '&action=VOTE')
      template = '%s/photo.html?photoId=%s'
      self.photo_content_url = template % (
          handlers.get_base_url(), key.id())
    else:
      self.num_votes = 0

  def json_properties(self):
    """Hide image_blob_key from JSON serialization."""
    properties = Jsonifiable.json_properties(self)
    properties.remove('image_blob_key')
    return properties

  def get_image_url(self, size=None):
    """Return the image serving url for this Photo."""
    return images.get_serving_url(self.image_blob_key, size=size)

class Theme(db.Model, Jsonifiable):
  """Represents a PhotoHunt theme."""
  jsonkind = 'photohunt#theme'
  display_name = db.StringProperty()
  created = db.DateTimeProperty(auto_now_add=True)
  start = db.DateTimeProperty()
  preview_photo_id = db.IntegerProperty()

  @staticmethod
  def get_current_theme():
    """Query the current theme based on the date."""
    today = db.datetime.date.today()
    start = db.datetime.datetime(today.year, today.month, today.day, 0, 0, 0)
    end = db.datetime.datetime(today.year, today.month, today.day, 23, 59, 59)
    return Theme.all().filter('start >=', start).filter(
        'start <', end).order('-start').get()


class Vote(db.Model, Jsonifiable):
  """Represents a vote case by a PhotoHunt user."""
  jsonkind = 'photohunt#vote'
  owner_user_id = db.IntegerProperty()
  photo_id = db.IntegerProperty()

class Message(Jsonifiable):
  """Standard JSON type used to return success/error messages."""
  jsonkind = 'photohunt#message'
  message = ""

  def __init__(self, message):
    self.message = message

class UploadUrl(Jsonifiable):
  """Represents a PhotoHunt Upload URL."""
  jsonkind = 'photohunt#uploadurl'
  url = ""

  def __init__(self, url):
    self.url = url

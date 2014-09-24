 #!/usr/bin/python
 # -*- coding: utf-8 -*-

import base64
from email.mime.audio import MIMEAudio
from email.mime.base import MIMEBase
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import mimetypes
import os
from django.utils.encoding import smart_str
from google.appengine.api import search
from google.appengine.api import memcache
from google.appengine.api import urlfetch
from apiclient.discovery import build
from google.appengine.api import taskqueue
from apiclient import errors
import httplib2
from iograph import Edge
import endpoints
# gdata
import atom.data
import gdata.data
import gdata.contacts.client
import gdata.contacts.data
from gdata.gauth import OAuth2Token
from gdata.contacts.client import ContactsClient
from model import User
import model
import iograph

from highrise.pyrise import Highrise, Person, Company, Deal, Task, Tag, Case
import tweepy as tweepy
from iomessages import TwitterProfileSchema, tweetsSchema,EmailSchema,AddressSchema,PhoneSchema
import datetime
import time
from datetime import date
import json

from google.appengine.ext import ndb
from iomodels.crmengine.tags import Tag,TagSchema,TagListRequest,TagListResponse
TOKEN_INFO_ENDPOINT = ('https://www.googleapis.com/oauth2/v1/tokeninfo' +
    '?access_token=%s')

FOLDERS = {
            'Account': 'accounts_folder',
            'Contact': 'contacts_folder',
            'Lead': 'leads_folder',
            'Opportunity': 'opportunities_folder',
            'Case': 'cases_folder',
            'Show': 'shows_folder',
            'Feedback': 'feedbacks_folder'
        }
_SAVED_TOKEN_DICT = {}
class OAuth2TokenFromCredentials(OAuth2Token):
    def __init__(self, credentials):
        self.credentials = credentials
        super(OAuth2TokenFromCredentials, self).__init__(None, None, None, None)
        self.UpdateFromCredentials()

    def UpdateFromCredentials(self):
        self.client_id = self.credentials.client_id
        self.client_secret = self.credentials.client_secret
        self.user_agent = self.credentials.user_agent
        self.token_uri = self.credentials.token_uri
        self.access_token = self.credentials.access_token
        self.refresh_token = self.credentials.refresh_token
        self.token_expiry = self.credentials.token_expiry
        self._invalid = self.credentials.invalid

    def generate_authorize_url(self, *args, **kwargs): raise NotImplementedError
    def get_access_token(self, *args, **kwargs): raise NotImplementedError
    def revoke(self, *args, **kwargs): raise NotImplementedError
    def _extract_tokens(self, *args, **kwargs): raise NotImplementedError
    def _refresh(self, unused_request):
        self.credentials._refresh(httplib2.Http().request)
        self.UpdateFromCredentials()

class Discovery():
    
    @classmethod
    def get_tweets(cls, tags,order):
        import detectlanguage
        detectlanguage.configuration.api_key = "0dd586141a3b89f3eba5a46703eeb5ab"
        #detectlanguage.configuration.api_key = "5840049ee8c484cde3e9832d99504c6c"
        list_of_tweets=[]
        for tag in tags:
            print tag,"oooooooooooooohhhhhhhhh"
            dt = datetime.datetime.fromordinal(date.today().toordinal())
            str_date = str(dt.date())
            credentials = {
                'consumer_key' : 'vk9ivGoO3YZja5bsMUTQ',
                'consumer_secret' : 't2mSb7zu3tu1FyQ9s3M4GOIl0PfwHC7CTGDcOuSZzZ4',
                'access_token_key' : '1157418127-gU3bUzLK0MgTA9pzWvgMpwD6E0R4Wi1dWp8FV9W',
                'access_token_secret' : 'k8C5jEYh4F4Ej2C4kDasHWx61ZWPzi9MgzpbNCevoCwSH'
            }
            auth = tweepy.OAuthHandler(credentials['consumer_key'], credentials['consumer_secret'])
            auth.set_access_token(credentials['access_token_key'], credentials['access_token_secret'])
            api = tweepy.API(auth)
            print tag.name, "miiiiiiiiiiiiiiiii"
            results = api.search(q = '"'+tag.name+'"', count = 7, result_type = order)
            for result in results:
                print (result.text).encode('utf-8'),"rsssssssssssssssssltt"
                if 'text' in result.__dict__:
                    url=""
                    inde=0
                    text=(result.text).lower()
                    if "http" in text:
                        inde=(text).index("http",0)
                        if " " in text[inde:]:
                            espace=(text).index(" ",inde)
                            url=(text[inde:espace]).lower()

                    if (tag.name).lower() not in url :
                        language= detectlanguage.detect(result.text)
                        print language[0]['language']
                        if language[0]['language']=="en" and len(language)==1:
                            node_popularpost=model.TweetsSchema()
                            id=str(result.id)
                            node_popularpost.id=id
                            node_popularpost.topic=tag.name
                            if 'profile_image_url' in result.user.__dict__:
                                node_popularpost.profile_image_url=(result.user.profile_image_url).encode('utf-8')
                            if 'name' in result.user.__dict__:
                                node_popularpost.author_name= (result.user.name)
                            if 'created_at' in result.__dict__:
                                node_popularpost.created_at= result.created_at.strftime("%Y-%m-%dT%H:%M:00.000")
                            if 'text' in result.__dict__:
                                node_popularpost.content=(result.text)
                            
                            if 'followers_count' in result.author.__dict__:
                                node_popularpost.author_followers_count=result.author.followers_count
                            if 'location' in result.author.__dict__:
                                node_popularpost.author_location=result.author.location
                            if 'lang' in result.author.__dict__:
                                node_popularpost.author_language=result.author.lang
                            if 'statuses_count' in result.author.__dict__:
                                node_popularpost.author_statuses_count=result.author.statuses_count
                            if 'description' in result.author.__dict__:
                                node_popularpost.author_description=result.author.description
                            if 'friends_count' in result.author.__dict__:
                                node_popularpost.author_friends_count=result.author.friends_count
                            if 'favourites_count' in result.author.__dict__:
                                node_popularpost.author_favourites_count=result.author.favourites_count
                            if 'url_website' in result.author.__dict__:
                                node_popularpost.author_url_website=result.author.url
                            if 'created_at' in result.author.__dict__:
                                node_popularpost.created_at_author=str(result.author.created_at)+"i"
                            if 'time_zone' in result.author.__dict__:
                                node_popularpost.time_zone_author=result.author.time_zone
                            if 'listed_count' in result.author.__dict__:
                                node_popularpost.author_listed_count=result.author.listed_count
                            if 'screen_name' in result.user.__dict__:
                                node_popularpost.screen_name=result.user.screen_name
                            if 'retweet_count' in result.__dict__:
                                node_popularpost.retweet_count=result.retweet_count
                            if 'favorite_count' in result.__dict__:
                                node_popularpost.favorite_count=result.favorite_count
                            key2=node_popularpost.put()
                            list_of_tweets.append(node_popularpost)
                            d=Edge.insert(start_node=ndb.Key(urlsafe=tag.entityKey),end_node=key2,kind="tweets")

    @classmethod
    def update_tweets(cls):
        print "begin updateeeeeeeeeeeee"
        crawling=Crawling()
        list=[]
        list=crawling.update()


    @classmethod
    def list_crawling_table(cls):
        print "update"


from google.appengine.ext import ndb
from google.appengine.api import search
from endpoints_proto_datastore.ndb import EndpointsModel
from protorpc import messages
from iograph import Edge
from endpoints_helper import EndpointsHelper
import datetime
class CrawlingSchema(messages.Message):
    keyword=messages.StringField(1)
    stats=messages.BooleanField(2)
    last_crawled_date=messages.StringField(3)

class CrawlingListRequest(messages.Message):
    about_kind = messages.StringField(1,required=False)

class CrawlingListResponse(messages.Message):
    items = messages.MessageField(CrawlingSchema, 1, repeated=True)


class Crawling(ndb.Model):

    _message_fields_schema = ('keyword','stats','last_crawled_date')
    keyword = ndb.StringProperty()
    stats = ndb.BooleanProperty(default=False)
    last_crawled_date = ndb.DateTimeProperty()
    


    @classmethod
    def update(cls):
        stats = cls.query().fetch()
        stat_list = []
        if stats:
            stat_list = []
            for stat in stats:
                a=stat.last_crawled_date
                now=datetime.datetime.now()
                dif=now-a
                res=divmod(dif.days * 86400 + dif.seconds, 60)
                tags=[]
                if res[0]>1:

                    tag=Tag.list_by_name(name=stat.keyword)
                    print stat,"eleeeeeeeeeeeeeeeeee"
                    stat.last_crawled_date=datetime.datetime.now()
                    stat.put()
                    tags.append(tag)
                    Discovery.get_tweets(tag.items,"recent")
                else:
                    #tag.stats=True
                    #tag.put()
                    print "elseeee"

                stat.put()
                stat_list.append(
                                CrawlingSchema(
                                        keyword=stat.keyword,
                                        stats=stat.stats,
                                        last_crawled_date=(stat.last_crawled_date).strftime("%Y-%m-%dT%H:%M:00.000")
                                        )
                            )
        return CrawlingListResponse(items = stat_list)
    # patch tags . hadji hicham 22-07-2014.
    @classmethod
    def patch(cls,user_from_email,request):
        tags = cls.query(cls.about_kind==kind, cls.organization == user_from_email.organization).fetch()
        tag_list = []
        if tags:
            tag_list = []
            for tag in tags:
                tag_list.append(
                                TagSchema(
                                        id = str(tag.key.id()),
                                        entityKey = tag.key.urlsafe(),
                                        name = tag.name,
                                        color = tag.color
                                        )
                            )
        return TagListResponse(items = tag_list)

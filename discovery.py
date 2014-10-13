 #!/usr/bin/python
 # -*- coding: utf-8 -*-

import base64
from email.mime.audio import MIMEAudio
from email.mime.base import MIMEBase
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from geopy.geocoders import GoogleV3
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
from model import TweetsSchema

from google.appengine.ext import ndb
from google.appengine.datastore.datastore_query import Cursor
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
    def list_tweets_from_datastore(cls,topics,limit=100,pageToken=None):
        curs = Cursor(urlsafe=pageToken)
        if limit:
            limit = int(limit)
        items, next_curs, more =  TweetsSchema.query(
                                                      TweetsSchema.topic.IN(topics)
                                                    ).order(
                                                        -TweetsSchema.key
                                                    ).fetch_page(
                                                        limit, start_cursor=curs
                                                    )
        items.sort(key=lambda x: x.id)
        items.reverse()
        tweets=[]
        for tweet in items:
                tweet_schema=tweetsSchema()
                tweet_schema.id=tweet.id
                tweet_schema.profile_image_url=tweet.profile_image_url
                tweet_schema.author_name=tweet.author_name
                tweet_schema.created_at=tweet.created_at.isoformat()
                tweet_schema.content=tweet.content
                tweet_schema.author_followers_count=tweet.author_followers_count
                tweet_schema.author_location=tweet.author_location
                tweet_schema.latitude=tweet.latitude
                tweet_schema.longitude=tweet.longitude
                tweet_schema.author_language=tweet.author_language
                tweet_schema.author_statuses_count=tweet.author_statuses_count
                tweet_schema.author_description=tweet.author_description
                tweet_schema.author_friends_count=tweet.author_friends_count
                tweet_schema.author_favourites_count=tweet.author_favourites_count
                tweet_schema.author_url_website=tweet.author_url_website
                tweet_schema.created_at_author=tweet.created_at_author
                tweet_schema.time_zone_author=tweet.time_zone_author
                tweet_schema.author_listed_count=tweet.author_listed_count
                tweet_schema.screen_name=tweet.screen_name
                tweet_schema.retweet_count=tweet.retweet_count
                tweet_schema.favorite_count=tweet.favorite_count
                tweet_schema.topic=tweet.topic
                tweets.append(tweet_schema)
        results = {}
        results['items'] = tweets
        if next_curs:
            results['next_curs'] = next_curs.urlsafe()
        else:
            results['next_curs'] = None
        results['more'] = more
        # check if is_crawling
        is_crawling = False
        for topic in topics:
            crawler = Crawling.get_by_keyword(topic)
            print 'i will check for crawler of ',topic
            if crawler:
                print 'it exists'
                if crawler.is_crawling:
                    print 'still crawling'
                    is_crawling = True
                else:
                    if crawler.last_crawled_date:
                        print 'not the first time'
                        now = datetime.datetime.now()
                        diff = now - crawler.last_crawled_date
                        if diff.min>datetime.timedelta(minutes=10):
                            taskqueue.add(
                                url='/workers/insert_crawler',
                                queue_name='iogrow-critical',
                                params={
                                        'topic':topic
                                       }
                            )
                    else:
                        print 'the first time i should start the crawler'
                        taskqueue.add(
                                url='/workers/insert_crawler',
                                queue_name='iogrow-critical',
                                params={
                                        'topic':topic
                                       }
                            )
            else:
                print 'the crawler doesnt exist should start it'
                taskqueue.add(
                                url='/workers/insert_crawler',
                                queue_name='iogrow-critical',
                                params={
                                        'topic':topic
                                       }
                            )

        results['is_crawling'] = is_crawling
        return results

    @classmethod
    def get_popular_posts(cls,tag_name):
        tags=Tag.list_by_just_kind(kind="topics")
        print tags,"itagggggg"
        list=[]
        for tag in tags.items:
            list.append(tag)
        Discovery.get_tweets(list,"popular")
    @classmethod
    def update_tweets(cls):
        crawling=Crawling()
        list=[]
        stats=crawling.list_stats()
        print stats,"statttttttttttttt"
        stat_list = []
        if stats:
            for stat in stats:
                a=stat.last_crawled_date
                now=datetime.datetime.now()
                dif=now-a
                res=divmod(dif.days * 86400 + dif.seconds, 60)
                tags=[]
                print "beforrrrrrrrr"
                if res[0]>1:
                    print "insiiiiiiiiiiiiiid"
                    tag=Tag.list_by_name(name=stat.keyword)
                    print stat,"eleeeeeeeeeeeeeeeeee"
                    stat.last_crawled_date=datetime.datetime.now()
                    stat.put()
                    tags.append(tag)
                    Discovery.get_tweets(tag.items,"recent")

                #stat.put()




    @classmethod
    def delete_tweets(cls):
        tagss=Tag.list_by_just_kind(kind="topics")
        print tagss,"tiiiiiiiiii"
        list=[]
        val=[]
        for tag in tagss.items:
            qry = TweetsSchema.query(TweetsSchema.topic == tag.name)
            results=qry.fetch(keys_only=True)
            ndb.delete_multi(results)
    @classmethod
    def delete_tweets_by_name(cls,name):
        qry = TweetsSchema.query(TweetsSchema.topic == name[0])
        results=qry.fetch(keys_only=True)
        print results,"izzzzzzzzzzzzzzzzzzzzzzzzz"
        ndb.delete_multi(results)
        crawling=Crawling()
        list=[]
        stats=crawling.list_by_name(name)
        stat_list = []
        if stats:
            print "yesss"
            ndb.delete_multi(stats)




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
    is_crawling=messages.BooleanField(2)
    last_crawled_date=messages.StringField(3)

class CrawlingListRequest(messages.Message):
    about_kind = messages.StringField(1,required=False)

class CrawlingListResponse(messages.Message):
    items = messages.MessageField(CrawlingSchema, 1, repeated=True)


class Crawling(ndb.Model):

    _message_fields_schema = ('keyword','stats','last_crawled_date')
    keyword = ndb.StringProperty()
    is_crawling = ndb.BooleanProperty(default=False)
    last_crawled_date = ndb.DateTimeProperty()
    
    @classmethod
    def get_by_keyword(cls,keyword):
        topic=None
        results = Crawling.query().filter(cls.keyword==keyword).fetch()
        if results:
            topic = results[0]
        return topic


    @classmethod
    def insert(cls,topic):
        # check if doesnt exist before
        print 'I will create a new crawler for ', topic
        topics = Crawling.query().filter(cls.keyword==topic).fetch()
        if len(topics)==0:
            crawler=Crawling(keyword=topic)
            crawler.put()
            crawler_async = crawler.put_async()
            lead_key_async = crawler_async.get_result()
        cls.start(topic)

    @classmethod
    def start(cls,topic):
        print ' i will start the crawler for ', topic
        crawler = cls.get_by_keyword(topic)
        if crawler is None:
            cls.insert(topic)
        else:
            print 'crawler found for  ', topic
            tweets_crawled = []
            credentials = {
                    'consumer_key' : 'vk9ivGoO3YZja5bsMUTQ',
                    'consumer_secret' : 't2mSb7zu3tu1FyQ9s3M4GOIl0PfwHC7CTGDcOuSZzZ4',
                    'access_token_key' : '1157418127-gU3bUzLK0MgTA9pzWvgMpwD6E0R4Wi1dWp8FV9W',
                    'access_token_secret' : 'k8C5jEYh4F4Ej2C4kDasHWx61ZWPzi9MgzpbNCevoCwSH'
            }
            auth = tweepy.OAuthHandler(credentials['consumer_key'], credentials['consumer_secret'])
            auth.set_access_token(credentials['access_token_key'], credentials['access_token_secret'])
            api = tweepy.API(auth)
            since_id = 0
            get_more = True
            if crawler.is_crawling:
                print 'crawler  is crawling will stop,  ', topic
                return
            else:
                crawler.is_crawling=True
                crawler.put_async()
                if crawler.last_crawled_date:
                    print 'crawler has last_crawled_date ', topic
                    now = datetime.datetime.now()
                    diff = now - crawler.last_crawled_date
                    if diff.min<datetime.timedelta(minutes=10):
                        print 'the difference is very short for this  crawler, stop', topic
                        return
                    str_date = str(crawler.last_crawled_date)
                    print 'will crawl again since ', diff.min
                else:
                    print 'crawling for the first time for ', topic
                    dt = datetime.datetime.fromordinal(date.today().toordinal())
                    since_date = dt - datetime.timedelta(days=3)
                    str_date = str(since_date.date())
                try:
                    results = tweepy.Cursor(api.search,
                                       q = topic,
                                       count=100,
                                       result_type="recent",
                                       since = str_date ).items()
                except tweepy.error.TweepError:
                    credentials = {
                        'consumer_key' : 'eSHy2QiOgpXjvsivavvYypMn2',
                        'consumer_secret' : 'PINkzQbDumqafsPlzuqphfcqBX45M1THrSmbQbkFW9F5jwTofh',
                        'access_token_key' : 'nQsh9ZaQqcU5zas7u0WhemfDHuWGcUWB87ZHaHs',
                        'access_token_secret' : 'CCm5FEVnTw9Do7RdHOwXXWv8NuNkzYsJikWn6oZMVvq4L'
                        }
                    auth = tweepy.OAuthHandler(credentials['consumer_key'], credentials['consumer_secret'])
                    auth.set_access_token(credentials['access_token_key'], credentials['access_token_secret'])
                    api = tweepy.API(auth)
                    results = tweepy.Cursor(api.search,
                                       q = topic,
                                       count=100,
                                       result_type="recent",
                                       since = str_date ).items()
                print 'request finished, store the items'
                crawler.last_crawled_date = datetime.datetime.now()
                crawler.is_crawling = False
                crawler.put_async()
                print 'i will store the items'
                for result in results:
                        if 'text' in result.__dict__:
                            url=""
                            inde=0
                            text=(result.text).lower()
                            if "http" in text:
                                inde=(text).index("http",0)
                                if " " in text[inde:]:
                                    espace=(text).index(" ",inde)
                                    url=(text[inde:espace]).lower()

                            if (topic).lower() not in url :
                                if result.id not in tweets_crawled:
                                    tweets = model.TweetsSchema.query(model.TweetsSchema.id==str(result.id)).fetch()
                                    if len(tweets)==0:
                                        tweets_crawled.append(result.id)
                                        node_popularpost=model.TweetsSchema()
                                        id=str(result.id)
                                        node_popularpost.id = id
                                        node_popularpost.topic=topic
                                        node_popularpost.created_at= datetime.datetime.strptime(
                                                                        str(result.created_at),
                                                                        "%Y-%m-%d %H:%M:%S"
                                                                    )
                                        if 'profile_image_url' in result.user.__dict__:
                                            node_popularpost.profile_image_url=(result.user.profile_image_url).encode('utf-8')
                                        if 'name' in result.user.__dict__:
                                            node_popularpost.author_name= (result.user.name)
                                        if 'created_at' in result.__dict__:
                                            node_popularpost.created_at= datetime.datetime.strptime(
                                                                                                    str(result.created_at),
                                                                                                    "%Y-%m-%d %H:%M:%S"
                                                                                                    )
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
                                            node_popularpost.created_at_author=str(result.author.created_at)
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
                                        node_popularpost.put()

    @classmethod
    def list_by_name(cls,name):
        stats = cls.query(cls.keyword==name[0]).fetch(keys_only=True)
        stat_list = []
        if stats:
            return stats


    @classmethod
    def list_stats(cls):
        stats = cls.query().fetch()
        stats_list = []
        if stats:
            return stats

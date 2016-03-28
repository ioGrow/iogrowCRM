#!/usr/bin/python
# -*- coding: utf-8 -*-

import json
import urllib
from datetime import date

import httplib2
import requests
import tweepy
from gdata.gauth import OAuth2Token
from geopy.geocoders import GoogleV3
from google.appengine.api import taskqueue
from google.appengine.datastore.datastore_query import Cursor
from tweepy.streaming import StreamListener

import config as config_urls
from iomessages import tweetsSchema, Topic_Schema
from iomodels.crmengine.tags import Tag
from model import TopicScoring
from model import TweetsSchema

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

credentials = {
    'consumer_key': 'vk9ivGoO3YZja5bsMUTQ',
    'consumer_secret': 't2mSb7zu3tu1FyQ9s3M4GOIl0PfwHC7CTGDcOuSZzZ4',
    'access_token_key': '1157418127-gU3bUzLK0MgTA9pzWvgMpwD6E0R4Wi1dWp8FV9W',
    'access_token_secret': 'k8C5jEYh4F4Ej2C4kDasHWx61ZWPzi9MgzpbNCevoCwSH'
}
auth = tweepy.OAuthHandler(credentials['consumer_key'], credentials['consumer_secret'])
auth.set_access_token(credentials['access_token_key'], credentials['access_token_secret'])
api = tweepy.API(auth)


class listener(StreamListener):
    def on_data(self, data):
        print data
        return True

    def on_error(self, status):
        print status


class OAuth2TokenFromCredentials(OAuth2Token):
    def __init__(self, creds):
        self.credentials = creds
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


class Discovery:
    def __init__(self):
        pass

    credentials = {
        'consumer_key': 'vk9ivGoO3YZja5bsMUTQ',
        'consumer_secret': 't2mSb7zu3tu1FyQ9s3M4GOIl0PfwHC7CTGDcOuSZzZ4',
        'access_token_key': '1157418127-gU3bUzLK0MgTA9pzWvgMpwD6E0R4Wi1dWp8FV9W',
        'access_token_secret': 'k8C5jEYh4F4Ej2C4kDasHWx61ZWPzi9MgzpbNCevoCwSH'
    }
    auth = tweepy.OAuthHandler(credentials['consumer_key'], credentials['consumer_secret'])
    auth.set_access_token(credentials['access_token_key'], credentials['access_token_secret'])
    api = tweepy.API(auth)

    @classmethod
    def list_tweets_from_datastore(cls, topics, limit=100, pageToken=None):
        curs = Cursor(urlsafe=pageToken)
        if limit:
            limit = int(limit)
        items, next_curs, more = TweetsSchema.query(
            TweetsSchema.topic.IN(topics)
        ).order(
            -TweetsSchema.key
        ).fetch_page(
            limit, start_cursor=curs
        )
        items.sort(key=lambda x: x.id)
        items.reverse()
        tweets = []
        for tweet in items:
            tweet_schema = tweetsSchema()
            tweet_schema.id = tweet.id
            tweet_schema.profile_image_url = tweet.profile_image_url
            tweet_schema.author_name = tweet.author_name
            if tweet.created_at:
                tweet_schema.created_at = tweet.created_at.isoformat()
            tweet_schema.content = tweet.content
            tweet_schema.author_followers_count = tweet.author_followers_count
            tweet_schema.author_location = tweet.author_location
            tweet_schema.latitude = tweet.latitude
            tweet_schema.longitude = tweet.longitude
            tweet_schema.author_language = tweet.author_language
            tweet_schema.author_statuses_count = tweet.author_statuses_count
            tweet_schema.author_description = tweet.author_description
            tweet_schema.author_friends_count = tweet.author_friends_count
            tweet_schema.author_favourites_count = tweet.author_favourites_count
            tweet_schema.author_url_website = tweet.author_url_website
            tweet_schema.created_at_author = tweet.created_at_author
            tweet_schema.time_zone_author = tweet.time_zone_author
            tweet_schema.author_listed_count = tweet.author_listed_count
            tweet_schema.screen_name = tweet.screen_name
            tweet_schema.retweet_count = tweet.retweet_count
            tweet_schema.favorite_count = tweet.favorite_count
            tweet_schema.topic = tweet.topic
            tweets.append(tweet_schema)
        results = {'items': tweets}
        if next_curs:
            results['next_curs'] = next_curs.urlsafe()
        else:
            results['next_curs'] = None
        results['more'] = more
        # check if is_crawling
        is_crawling = False
        user_from_email = EndpointsHelper.require_iogrow_user()
        for topic in topics:
            crawler = Crawling.get_by_keyword(topic)
            if crawler:
                if crawler.is_crawling:
                    is_crawling = True
                else:
                    if crawler.last_crawled_date:
                        now = datetime.datetime.now()
                        diff = now - crawler.last_crawled_date
                        if diff.min > datetime.timedelta(minutes=10):
                            taskqueue.add(
                                url='/workers/insert_crawler',
                                queue_name='iogrow-critical',
                                params={
                                    'topic': topic,
                                    'organization': user_from_email.organization.id()
                                }
                            )
                    else:
                        # the first time i should start the crawler
                        taskqueue.add(
                            url='/workers/insert_crawler',
                            queue_name='iogrow-critical',
                            params={
                                'topic': topic,
                                'organization': user_from_email.organization.id()
                            }
                        )
            else:
                # the crawler doesnt exist should start it
                taskqueue.add(
                    url='/workers/insert_crawler',
                    queue_name='iogrow-critical',
                    params={
                        'topic': topic,
                        'organization': user_from_email.organization.id()
                    }
                )

        results['is_crawling'] = is_crawling
        return results

    @classmethod
    def list_tweets_from_nodeio(cls, request, language):
        # d=["facebook","instagram"]
        # listt=['facebook','instagram']
        headers = {'Cache-Control': 'no-cache,max-age=0', 'Pragma': 'no-cache'}
        try:
            payload = {'keywords[]': request.keywords, 'page': request.page, 'limit': request.limit,
                       'language': language}
            r = requests.get(config_urls.nodeio_server + "/twitter/posts/list", params=payload, headers=headers)
        except:
            payload = {'keywords[]': request.keywords, 'page': request.page, 'limit': request.limit,
                       'language': language}
            r = requests.get(config_urls.nodeio_server + "/twitter/posts/list", params=payload, headers=headers)
        return json.dumps(r.json()["results"]), r.json()["more"]

    @classmethod
    def get_best_tweets(cls, keywords=["crm"]):
        list_of_tweets = []
        for keyword in keywords:
            dt = datetime.datetime.fromordinal(date.today().toordinal())
            str_date = str(dt.date())
            creds = {
                'consumer_key': 'vk9ivGoO3YZja5bsMUTQ',
                'consumer_secret': 't2mSb7zu3tu1FyQ9s3M4GOIl0PfwHC7CTGDcOuSZzZ4',
                'access_token_key': '1157418127-gU3bUzLK0MgTA9pzWvgMpwD6E0R4Wi1dWp8FV9W',
                'access_token_secret': 'k8C5jEYh4F4Ej2C4kDasHWx61ZWPzi9MgzpbNCevoCwSH'
            }
            auth = tweepy.OAuthHandler(creds['consumer_key'], creds['consumer_secret'])
            auth.set_access_token(creds['access_token_key'], creds['access_token_secret'])
            api = tweepy.API(auth)
            try:
                results = api.search(q='"' + keyword + '"', count=10, result_type="popular")
            except tweepy.error.TweepError:
                creds = {
                    'consumer_key': 'eSHy2QiOgpXjvsivavvYypMn2',
                    'consumer_secret': 'PINkzQbDumqafsPlzuqphfcqBX45M1THrSmbQbkFW9F5jwTofh',
                    'access_token_key': 'nQsh9ZaQqcU5zas7u0WhemfDHuWGcUWB87ZHaHs',
                    'access_token_secret': 'CCm5FEVnTw9Do7RdHOwXXWv8NuNkzYsJikWn6oZMVvq4L'
                }
                auth = tweepy.OAuthHandler(creds['consumer_key'], creds['consumer_secret'])
                auth.set_access_token(creds['access_token_key'], creds['access_token_secret'])
                api = tweepy.API(auth)
                results = api.search(q='"' + keyword + '"', count=5, result_type=order)

            for result in results:
                if 'text' in result.__dict__:
                    url = ""
                    text = result.text.lower()
                    if "http" in text:
                        inde = text.index("http", 0)
                        if " " in text[inde:]:
                            espace = text.index(" ", inde)
                            url = (text[inde:espace]).lower()

                    if keyword.lower() not in url:
                        node_popularpost = TweetsSchema()
                        id = str(result.id)
                        node_popularpost.id = id
                        node_popularpost.topic = keyword
                        node_popularpost.order = 'popular'
                        if 'profile_image_url' in result.user.__dict__:
                            node_popularpost.profile_image_url = result.user.profile_image_url.encode('utf-8')
                        if 'name' in result.user.__dict__:
                            node_popularpost.author_name = result.user.name
                        if 'created_at' in result.__dict__:
                            node_popularpost.created_at = datetime.datetime.strptime(
                                str(result.created_at),
                                "%Y-%m-%d %H:%M:%S"
                            )
                            # result.created_at.strftime("%Y-%m-%dT%H:%M:00.000")
                        if 'text' in result.__dict__:
                            node_popularpost.content = result.text

                        if 'followers_count' in result.author.__dict__:
                            node_popularpost.author_followers_count = result.author.followers_count
                        if 'location' in result.author.__dict__:
                            if result.author.location != "":
                                node_popularpost.author_location = result.author.location.encode('utf-8')
                                geolocator = GoogleV3()
                                latlong = geolocator.geocode(result.author.location.encode('utf-8'))
                                if latlong is not None:
                                    node_popularpost.latitude = str(latlong[1][0])
                                    node_popularpost.longitude = str(latlong[1][1])
                        if 'lang' in result.author.__dict__:
                            node_popularpost.author_language = result.author.lang
                        if 'statuses_count' in result.author.__dict__:
                            node_popularpost.author_statuses_count = result.author.statuses_count
                        if 'description' in result.author.__dict__:
                            node_popularpost.author_description = result.author.description
                        if 'friends_count' in result.author.__dict__:
                            node_popularpost.author_friends_count = result.author.friends_count
                        if 'favourites_count' in result.author.__dict__:
                            node_popularpost.author_favourites_count = result.author.favourites_count
                        if 'url_website' in result.author.__dict__:
                            node_popularpost.author_url_website = result.author.url
                        if 'created_at' in result.author.__dict__:
                            node_popularpost.created_at_author = str(result.author.created_at) + "i"
                        if 'time_zone' in result.author.__dict__:
                            node_popularpost.time_zone_author = result.author.time_zone
                        if 'listed_count' in result.author.__dict__:
                            node_popularpost.author_listed_count = result.author.listed_count
                        if 'screen_name' in result.user.__dict__:
                            node_popularpost.screen_name = result.user.screen_name
                        if 'retweet_count' in result.__dict__:
                            node_popularpost.retweet_count = result.retweet_count
                        if 'favorite_count' in result.__dict__:
                            node_popularpost.favorite_count = result.favorite_count
                        # key2=node_popularpost.put()
                        list_of_tweets.append(node_popularpost)
                        # d=Edge.insert(start_node=ndb.Key(urlsafe=tag.entityKey),end_node=key2,kind="tweets")
            return str(list_of_tweets)

    @classmethod
    def get_lasts_tweets(cls, screen_name):

        time_line = api.user_timeline(screen_name=screen_name[0], count=12)
        list = []
        for ele in time_line:
            list.append(ele.__dict__)
        return list

    @classmethod
    def get_resume_from_twitter(cls, screen_name):

        # auth = tweepy.OAuthHandler(consumer_token, consumer_secret, "http://www.iogrow.com")
        try:
            redirect_url = auth.get_authorization_url()
        except tweepy.TweepError:
            print 'Error! Failed to get request token.'
        session.set('request_token', (auth.request_token.key,
                                      auth.request_token.secret))

        user = api.get_user(screen_name=screen_name[0])
        resume = ""
        if 'description' in user.__dict__:
            resume = user.description
        return resume

    @classmethod
    def get_topics_of_tweet(cls, tweet):
        # test for all tweets
        basic_keywords = ["if", "the", "she", "he", "and", "it", "is", "that", "you", "a", "of", "an", "this", "to"]
        total_score = 0.0

        list = []
        service_url = 'https://www.googleapis.com/freebase/v1/search'
        if len(tweet.split()) < 2:
            try:
                if tweet.index(" "):
                    tweets = tweet.replace(" ", "_")
            except:
                tweets = tweet
            # tweets='crm'
            # if not Discovery.detect_if_human_language(tweets):
            params = {
                'query': tweets,
                'key': 'AIzaSyA8IwETyTJxPKXYFewP0FabkYC24HtKzRQ'
            }
            url = service_url + '?' + urllib.urlencode(params)
            response = json.loads(urllib.urlopen(url).read())
            for i in range(2):
                if i < len(response['result']):
                    if response['result'][i]['name'] != "":
                        if 'notable' in response['result'][i].keys():
                            if response['result'][i]['notable']['name'] == "Industry":
                                topic = TopicScoring()
                                topic.topic = response['result'][i]['name']
                                topic.score = response['result'][i]['score']
                                list.append(topic)
                                total_score = total_score + response['result'][i]['score']
                            else:
                                if not Discovery.detect_if_human_language(tweets):
                                    topic = TopicScoring()
                                    topic.topic = response['result'][i]['name']
                                    topic.score = response['result'][i]['score']
                                    list.append(topic)
                                    total_score = total_score + response['result'][i]['score']

        # test for each keyword in tweets

        for e in tweet.split():
            if e not in basic_keywords:

                params = {
                    'query': e,
                    'key': 'AIzaSyA8IwETyTJxPKXYFewP0FabkYC24HtKzRQ',
                    'limit': 5
                }
                url = service_url + '?' + urllib.urlencode(params)
                response = json.loads(urllib.urlopen(url).read())
                for i in range(2):
                    if i < len(response['result']):
                        if response['result'][i]['name'] != "":
                            if 'notable' in response['result'][i].keys():
                                if not Discovery.detect_if_human_language(e):
                                    topic = TopicScoring()
                                    topic.topic = response['result'][i]['name']
                                    topic.score = response['result'][i]['score']
                                    list.append(topic)
                                    total_score = total_score + response['result'][i]['score']

        return {"items": list, "score_total": total_score}

    @classmethod
    def detect_if_human_language(cls, tweets):
        params = {
            'query': tweets,
            'key': 'AIzaSyA8IwETyTJxPKXYFewP0FabkYC24HtKzRQ',
            'type': 'language'
        }
        service_url = 'https://www.googleapis.com/freebase/v1/search'
        url = service_url + '?' + urllib.urlencode(params)
        response = json.loads(urllib.urlopen(url).read())
        for i in range(3):
            if i < len(response['result']):
                if 'notable' in response['result'][i].keys():
                    if response['result'][i]['notable']['name'] == "Human Language" and \
                                    response['result'][i]['notable']['id'] == "/language/human_language":
                        return True
        return False

    @classmethod
    def related_topics_between_keywords_and_tweets(cls, keyword, tweet):
        service_url = 'https://www.googleapis.com/freebase/v1/search'
        params = {
            'query': keyword,
            'key': 'AIzaSyA8IwETyTJxPKXYFewP0FabkYC24HtKzRQ'
        }
        url = service_url + '?' + urllib.urlencode(params)
        response = json.loads(urllib.urlopen(url).read())
        list = []
        last_list = []
        total_score = 0.0
        for result in response['result']:
            topic = Topic_Schema()
            topic.topic = result['name']
            topic.score = result['score']
            list.append(topic)
        # test for all tweets
        try:
            if tweet.index(" "):
                tweets = tweet.replace(" ", "_")
        except:
            tweets = tweet
        params = {
            'query': tweets,
            'key': 'AIzaSyA8IwETyTJxPKXYFewP0FabkYC24HtKzRQ'
        }
        url = service_url + '?' + urllib.urlencode(params)
        response = json.loads(urllib.urlopen(url).read())
        for result in response['result']:
            for ele in list:
                if ele.topic == result['name']:
                    last_list.append(ele)
                    total_score = total_score + ele.score

        # test for each keyword in tweets
        if total_score == 0.0:
            for e in tweet.split():
                params = {
                    'query': e,
                    'key': 'AIzaSyA8IwETyTJxPKXYFewP0FabkYC24HtKzRQ'
                }
                url = service_url + '?' + urllib.urlencode(params)
                response = json.loads(urllib.urlopen(url).read())
                for result in response['result']:
                    for ele in list:
                        if ele.topic == result['name']:
                            last_list.append(ele)
                            total_score = total_score + ele.score

        return {"items": last_list, "score_total": total_score}

    @classmethod
    def get_popular_posts(cls, tag_name):
        tags = Tag.list_by_just_kind(kind="topics")
        list = []
        for tag in tags.items:
            list.append(tag)
        Discovery.get_tweets(list, "popular")

    @classmethod
    def update_tweets(cls):
        crawling = Crawling()
        stats = crawling.list_stats()
        if stats:
            for stat in stats:
                a = stat.last_crawled_date
                now = datetime.datetime.now()
                dif = now - a
                res = divmod(dif.days * 86400 + dif.seconds, 60)
                tags = []
                if res[0] > 1:
                    tag = Tag.list_by_name(name=stat.keyword)
                    stat.last_crawled_date = datetime.datetime.now()
                    stat.put()
                    tags.append(tag)
                    Discovery.get_tweets(tag.items, "recent")

                    # stat.put()

    @classmethod
    def delete_tweets(cls):
        now = datetime.datetime.now()
        qry = TweetsSchema.query(TweetsSchema.tweets_stored_at < now - datetime.timedelta(hours=96))
        results = qry.fetch(keys_only=True)
        ndb.delete_multi(results)

    @classmethod
    def delete_tweets_by_name(cls, name):
        qry = TweetsSchema.query(TweetsSchema.topic == name[0])
        results = qry.fetch(keys_only=True)
        ndb.delete_multi(results)
        crawling = Crawling()
        stats = crawling.list_by_name(name)
        if stats:
            ndb.delete_multi(stats)

    @classmethod
    def list_crawling_table(cls):
        print "update"


from google.appengine.ext import ndb
from protorpc import messages
from endpoints_helper import EndpointsHelper
import datetime


class CrawlingSchema(messages.Message):
    keyword = messages.StringField(1)
    is_crawling = messages.BooleanField(2)
    last_crawled_date = messages.StringField(3)


class CrawlingListRequest(messages.Message):
    about_kind = messages.StringField(1, required=False)


class CrawlingListResponse(messages.Message):
    items = messages.MessageField(CrawlingSchema, 1, repeated=True)


class Crawling(ndb.Model):
    _message_fields_schema = ('keyword', 'stats', 'last_crawled_date')
    keyword = ndb.StringProperty()
    is_crawling = ndb.BooleanProperty(default=False)
    last_crawled_date = ndb.DateTimeProperty()

    @classmethod
    def get_by_keyword(cls, keyword):
        topic = None
        results = Crawling.query().filter(cls.keyword == keyword).fetch()
        if results:
            topic = results[0]
        return topic

    @classmethod
    def insert(cls, topic):
        # check if doesnt exist before
        tag = Tag.list_by_kind_and_name(name=topic, kind="topics")
        if len(tag.items) != 0:
            topics = Crawling.query().filter(cls.keyword == topic).fetch()
            if len(topics) == 0:
                crawler = Crawling(keyword=topic)
                crawler.put()
                crawler_async = crawler.put_async()
                lead_key_async = crawler_async.get_result()
            cls.start(topic)

    @classmethod
    def start(cls, topic):
        crawler = cls.get_by_keyword(topic)
        if crawler is None:
            cls.insert(topic)
        else:
            tweets_crawled = []
            credentials = {
                'consumer_key': 'vk9ivGoO3YZja5bsMUTQ',
                'consumer_secret': 't2mSb7zu3tu1FyQ9s3M4GOIl0PfwHC7CTGDcOuSZzZ4',
                'access_token_key': '1157418127-gU3bUzLK0MgTA9pzWvgMpwD6E0R4Wi1dWp8FV9W',
                'access_token_secret': 'k8C5jEYh4F4Ej2C4kDasHWx61ZWPzi9MgzpbNCevoCwSH'
            }
            auth = tweepy.OAuthHandler(credentials['consumer_key'], credentials['consumer_secret'])
            auth.set_access_token(credentials['access_token_key'], credentials['access_token_secret'])
            api = tweepy.API(auth)
            if crawler.is_crawling:
                return
            else:
                crawler.is_crawling = True
                crawler.put_async()
                if crawler.last_crawled_date:
                    now = datetime.datetime.now()
                    diff = now - crawler.last_crawled_date
                    if diff.min < datetime.timedelta(minutes=10):
                        return
                    str_date = str(crawler.last_crawled_date)
                else:
                    # crawling for the first time
                    dt = datetime.datetime.fromordinal(date.today().toordinal())
                    since_date = dt - datetime.timedelta(days=3)
                    str_date = str(since_date.date())
                try:
                    results = api.search(q=topic, count=10, result_type="best")
                except tweepy.error.TweepError:
                    credentials = {
                        'consumer_key': 'eSHy2QiOgpXjvsivavvYypMn2',
                        'consumer_secret': 'PINkzQbDumqafsPlzuqphfcqBX45M1THrSmbQbkFW9F5jwTofh',
                        'access_token_key': 'nQsh9ZaQqcU5zas7u0WhemfDHuWGcUWB87ZHaHs',
                        'access_token_secret': 'CCm5FEVnTw9Do7RdHOwXXWv8NuNkzYsJikWn6oZMVvq4L'
                    }
                    auth = tweepy.OAuthHandler(credentials['consumer_key'], credentials['consumer_secret'])
                    auth.set_access_token(credentials['access_token_key'], credentials['access_token_secret'])
                    api = tweepy.API(auth)

                    results = api.search(q=topic, count=10, result_type="best")

                # request finished
                crawler.last_crawled_date = datetime.datetime.now()
                crawler.is_crawling = False
                crawler.put_async()
                # store the items
                for result in results:
                    if 'text' in result.__dict__:
                        url = ""
                        text = result.text.lower()
                        if "http" in text:
                            inde = text.index("http", 0)
                            if " " in text[inde:]:
                                espace = text.index(" ", inde)
                                url = (text[inde:espace]).lower()

                        if topic.lower() not in url:
                            if result.id not in tweets_crawled:
                                tweets = TweetsSchema.query(TweetsSchema.id == str(result.id)).fetch()
                                if len(tweets) == 0:
                                    tweets_crawled.append(result.id)
                                    node_popularpost = TweetsSchema()
                                    id = str(result.id)
                                    node_popularpost.id = id
                                    node_popularpost.topic = topic
                                    node_popularpost.created_at = datetime.datetime.strptime(
                                        str(result.created_at),
                                        "%Y-%m-%d %H:%M:%S"
                                    )
                                    if 'profile_image_url' in result.user.__dict__:
                                        node_popularpost.profile_image_url = result.user.profile_image_url.encode(
                                            'utf-8')
                                    if 'name' in result.user.__dict__:
                                        node_popularpost.author_name = result.user.name
                                    if 'created_at' in result.__dict__:
                                        node_popularpost.created_at = datetime.datetime.strptime(
                                            str(result.created_at),
                                            "%Y-%m-%d %H:%M:%S"
                                        )
                                    if 'text' in result.__dict__:
                                        node_popularpost.content = result.text

                                    if 'followers_count' in result.author.__dict__:
                                        node_popularpost.author_followers_count = result.author.followers_count
                                    if 'location' in result.author.__dict__:
                                        node_popularpost.author_location = result.author.location
                                    if 'lang' in result.author.__dict__:
                                        node_popularpost.author_language = result.author.lang
                                    if 'statuses_count' in result.author.__dict__:
                                        node_popularpost.author_statuses_count = result.author.statuses_count
                                    if 'description' in result.author.__dict__:
                                        node_popularpost.author_description = result.author.description
                                    if 'friends_count' in result.author.__dict__:
                                        node_popularpost.author_friends_count = result.author.friends_count
                                    if 'favourites_count' in result.author.__dict__:
                                        node_popularpost.author_favourites_count = result.author.favourites_count
                                    if 'url_website' in result.author.__dict__:
                                        node_popularpost.author_url_website = result.author.url
                                    if 'created_at' in result.author.__dict__:
                                        node_popularpost.created_at_author = str(result.author.created_at)
                                    if 'time_zone' in result.author.__dict__:
                                        node_popularpost.time_zone_author = result.author.time_zone
                                    if 'listed_count' in result.author.__dict__:
                                        node_popularpost.author_listed_count = result.author.listed_count
                                    if 'screen_name' in result.user.__dict__:
                                        node_popularpost.screen_name = result.user.screen_name
                                    if 'retweet_count' in result.__dict__:
                                        node_popularpost.retweet_count = result.retweet_count
                                    if 'favorite_count' in result.__dict__:
                                        node_popularpost.favorite_count = result.favorite_count
                                    if 'location' in result.author.__dict__:
                                        if result.author.location != "":
                                            node_popularpost.author_location = result.author.location.encode('utf-8')
                                            geolocator = GoogleV3()
                                            latlong = geolocator.geocode(result.author.location.encode('utf-8'))
                                            if latlong is not None:
                                                node_popularpost.latitude = str(latlong[1][0])
                                                node_popularpost.longitude = str(latlong[1][1])
                                            else:
                                                pass

                                    node_popularpost.tweets_stored_at = datetime.datetime.now()
                                    node_popularpost.put()

    @classmethod
    def list_by_name(cls, name):
        stats = cls.query(cls.keyword == name[0]).fetch(keys_only=True)
        if stats:
            return stats

    @classmethod
    def list_stats(cls):
        stats = cls.query().fetch()
        if stats:
            return stats

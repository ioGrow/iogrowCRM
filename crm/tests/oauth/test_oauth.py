import os
import unittest
import webbrowser
import Cookie

import webapp2
import webtest
from google.appengine.ext import testbed
from mock import Mock
from oauth2client.client import OAuth2WebServerFlow
from webapp2_extras import securecookie
from webapp2_extras.sessions import SessionDict
from wtforms import i18n

from crm import handlers
from crm.config import config
from crm.tests.helpers import RequestsHelpers

# setting HTTP_HOST in extra_environ parameter for TestApp is not enough for taskqueue stub
os.environ['HTTP_HOST'] = 'localhost'
SESSION_SECRET_KEY = config['webapp2_extras.sessions']['secret_key']

# globals
network = False

# mock Internet calls
if not network:
    i18n.get_country_code = Mock(return_value=None)


class AppTest(unittest.TestCase, RequestsHelpers):
    def setUp(self):
        # Create a WSGI application.
        self.app = webapp2.WSGIApplication(handlers.routes, config=config)
        self.testapp = webtest.TestApp(self.app)

        # activate GAE stubs
        self.testbed = testbed.Testbed()
        self.testbed.activate()
        self.testbed.init_datastore_v3_stub()
        self.testbed.init_memcache_stub()
        self.testbed.init_urlfetch_stub()
        self.testbed.init_taskqueue_stub()
        self.testbed.init_mail_stub()
        self.mail_stub = self.testbed.get_stub(testbed.MAIL_SERVICE_NAME)
        self.taskqueue_stub = self.testbed.get_stub(testbed.TASKQUEUE_SERVICE_NAME)
        self.testbed.init_user_stub()

        self.headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_4) Version/6.0 Safari/536.25',
                        'Accept-Language': 'en_US'}

    def test_config_environment(self):
        self.assertEquals(self.app.config.get('environment'), 'testing')

    def test_signup_google(self):
        response, email = self.authenticate_google()
        self.assertEquals(response.status_int, 200)
        self.assertTrue(response.json.get('is_new_user'))
        self.assertEquals(email, config.get('login_test_email'))
        self.assertEqual(response.content_type, 'application/json')

    def test_signing_google(self):
        response, email = self.authenticate_google()
        self.assertEquals(response.status_int, 200)
        self.assertTrue(response.json.get('is_new_user'))
        self.assertEquals(email, config.get('login_test_email'))
        self.assertEqual(response.content_type, 'application/json')

        response, email = self.authenticate_google()
        self.assertEquals(response.status_int, 200)
        self.assertFalse(response.json.get('is_new_user'))
        self.assertEquals(email, config.get('login_test_email'))
        self.assertEqual(response.content_type, 'application/json')

    def authenticate_google(self):
        serializer = securecookie.SecureCookieSerializer(SESSION_SECRET_KEY)
        flow = OAuth2WebServerFlow(client_id=self.app.config.get('google_client_id'),
                                   client_secret=self.app.config.get('google_client_secret'),
                                   scope=handlers.SCOPES,
                                   redirect_uri='urn:ietf:wg:oauth:2.0:oob'
                                   )
        auth_uri = flow.step1_get_authorize_url()
        webbrowser.open_new(auth_uri)
        auth_code = raw_input('\nEnter the auth code: ')
        response = self.testapp.post('/gconnect',
                                     params={"code": auth_code, "redirect_uri": "urn:ietf:wg:oauth:2.0:oob"})

        cookie_string = filter(lambda header: header[0] == 'Set-Cookie', response.headerlist)[0][1].split(';')[0]
        cookie = Cookie.SimpleCookie()
        cookie.load(cookie_string)
        session = cookie['session'].value
        session_data = serializer.deserialize('session', session)
        session_dict = SessionDict(response.request, data=session_data, new=False)
        return response, session_dict.get('me')



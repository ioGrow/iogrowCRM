import unittest

import webapp2
import webtest
from google.appengine.ext import testbed

from crm.config import config
from crm.handlers import IndexHandler
from crm.tests.helpers import RequestsHelpers


class AppTest(unittest.TestCase, RequestsHelpers):
    def setUp(self):
        # Create a WSGI application.
        self.app = webapp2.WSGIApplication([('/', IndexHandler)], config=config)
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

    def test_homepage(self):
        response = self.testapp.get('/')
        self.assertEquals(response.status_int, 302)
        _location = response.location.split('/')
        route = _location[len(_location) - 2]
        self.assertEqual(route, 'welcome')
        self.assertEqual(response.content_type, 'text/html')

    def is_user_logged_in(self):
        self.testapp

import unittest

import webapp2
import webtest
from google.appengine.ext import testbed

from crm import handlers
from crm.tests.helpers import RequestsHelpers


class HelloWorldHandler(webapp2.RequestHandler):
    def get(self):
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write('Hello World!')


class AppTest(unittest.TestCase, RequestsHelpers):
    def setUp(self):
        # Create a WSGI application.
        app = webapp2.WSGIApplication(handlers.routes)
        self.testapp = webtest.TestApp(app, extra_environ={'REMOTE_ADDR': '127.0.0.1'})

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

    def test_homepage(self):
        response = self.testapp.get('/')
        self.assertGreaterEqual(response.status_int, 200)
        self.assertEqual(response.normal_body, 'Hello World!')
        self.assertEqual(response.content_type, 'text/plain')

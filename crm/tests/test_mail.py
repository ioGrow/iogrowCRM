import unittest

from google.appengine.api import mail
from google.appengine.ext import testbed


class MailTestCase(unittest.TestCase):

    def setUp(self):
        self.testbed = testbed.Testbed()
        self.testbed.activate()
        self.testbed.init_mail_stub()
        self.mail_stub = self.testbed.get_stub(testbed.MAIL_SERVICE_NAME)

    def tearDown(self):
        self.testbed.deactivate()

    def testMailSent(self):
        mail.send_mail(to='alice@example.com',
                       subject='This is a test',
                       sender='bob@example.com',
                       body='This is a test e-mail')
        messages = self.mail_stub.get_sent_messages(to='alice@example.com')
        self.assertEqual(1, len(messages))
        self.assertEqual('alice@example.com', messages[0].to)

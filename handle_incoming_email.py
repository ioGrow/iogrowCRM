import logging
import webapp2
from google.appengine.ext.webapp.mail_handlers import InboundMailHandler

class LogSenderHandler(InboundMailHandler):
    def receive(self, mail_message):
        print '#######################'
        print mail_message.to
        print '**********************'
        print mail_message.body
        print 'getting the id of the email to place the reply in the correct place'
        beforat = mail_message.to.split("@")[0]
        afterio = beforat.split("io-")[1]
        print afterio


        
app = webapp2.WSGIApplication([LogSenderHandler.mapping()], debug=True)
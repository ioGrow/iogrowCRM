import endpoints
import json
from google.appengine.ext import ndb
from google.appengine.api import taskqueue
from endpoints_proto_datastore.ndb import EndpointsModel
from google.appengine.api import search
from protorpc import messages
import model
import iomessages
from iograph import Edge
import datetime


class LicenseSchema(messages.Message):
    id=messages.StringField(1)
    entityKey=messages.StringField(2)
    organization=messages.StringField(3)
    amount=messages.StringField(4)
    purchase_date=messages.StringField(5)
    who_purchased_it=messages.StringField(6)

    
class LicenseInsertRequest(messages.Message):
    organization=messages.StringField(1)
    amount=messages.IntegerField(2)
    purchase_date=messages.StringField(3)
    who_purchased_it=messages.StringField(4)


class License(EndpointsModel):
    _message_fields_schema = ('id','entityKey','organization','amount','purchase_date','who_purchased_it')
    organization = ndb.KeyProperty()
    amount=ndb.IntegerProperty()
    purchase_date= ndb.DateTimeProperty(auto_now_add=True)
    who_purchased_it=ndb.StringProperty()

    @classmethod
    def insert(cls,user_from_email,request):
        license= cls( organization=user_from_email.organization,
       	   	              amount=2000,
                          who_purchased_it=user_from_email.email,
       	   	)
        license_key=license.put_async()
        license_key_async=license_key.get_result()
        license_ent= license_key_async.get()
        print "*****************************"
        print "what's up "
        print license_ent
        print "*****************************"
        license_schema= LicenseSchema(
            	                     id= str(license_key_async.id()),
                                   entityKey=str(license_key_async.urlsafe()),
                                   organization=license.organization.urlsafe(),
                                   amount=str(license.amount),
                                   purchase_date=license_ent.purchase_date.isoformat(),
                                   who_purchased_it=user_from_email.email
            	     )
        return license_schema
    @classmethod
    def update(cls):
        q =cls.query()
        for key in q.iter(keys_only=True):
            license=key.get()
            if license.day_nbr<30:
                license.day_nbr += 1
            else:
                license.actif=False
            license.put()







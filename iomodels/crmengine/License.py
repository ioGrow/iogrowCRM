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



class LicenseSchema(messages.Message):
	  id=messages.StringField(1)
	  entityKey=messages.StringField(2)
	  organization=messages.StringField(3)
	  cost=messages.StringField(4)
	  next_billing_date=messages.StringField(5)
	  billing_begin_date=messages.StringField(6)
	  billing_end_date=messages.StringField(7)
	  actif=messages.StringField(8)
	  who_paid=messages.StringField(9)
    
class LicenseInsertRequest(messages.Message):
	  parent=messages.StringField(1)
	  cost=messages.StringField(2)
	  next_billing_date=messages.StringField(3)
	  billing_begin_date=messages.StringField(4)
	  billing_end_date=messages.StringField(5)

class License(EndpointsModel):
	   _message_fields_schema = ('id','organization','cost','next_billing_date','billing_begin_date','billing_end_date','actif','who_paid')
	   organization = ndb.KeyProperty()
	   cost=ndb.IntgerProperty()
	   next_billing_date= ndb.DateTimeProperty()
	   billing_begin_date= ndb.DateTimeProperty()
	   billing_end_date=ndb.DateTimeProperty()
	   actif= ndb.BooleanProperty()
	   who_paid=ndb.StringProrperty()

       @classmethod
       def insert(cls,user_from_email,request):
       	   license= cls( organization=user_from_email.organization,
       	   	              cost=request.cost,
       	   	              next_billing_date= request.next_billing_date, 
       	   	              billing_begin_date= request.billing_begin_date, 
       	   	              billing_end_date= request.billing_end_date,
       	   	              actif=request.actif,
       	   	              who_paid=user_from_email.google_user_id
       	   	)
       	   license_key=license.put_async()
       	   license_key_async=license_key.get_result()
       	   if request.parent:
       	   	parent_key = ndb.Key(urlsafe=request.parent)
            # insert edges
            Edge.insert(start_node = parent_key,
                      end_node = license_key_async,
                      kind = 'licenses',
                      inverse_edge = 'parents')
            EndpointsHelper.update_edge_indexes(
                                            parent_key = license_key_async,
                                            kind = 'licenses',
                                            indexed_edge = str(parent_key.id())
                                            )
            license_schema= LicenseSchema(
            	                   id= str(license_key_async.id()),
                                   entityKey=license_key_async.urlsafe(),
                                   organization=license.organization,
                                   cost=license.cost,
                                   next_billing_date=license.next_billing_date,
                                   billing_begin_date=license.billing_begin_date,
                                   billing_end_date=license.billing_end_date,
                                   actif=license.actif,
                                   who_paid=license.who_paid,
            	     )
            return license_schema





from google.appengine.ext import ndb
from protorpc import messages
class ReportSchema(messages.Message):
	owner=messages.StringField(1)
	created_at=messages.StringField(2)
	organization=messages.StringField(3)
	total_amount=messages.IntegerField(4)
	nbr_lead=messages.IntegerField(5)
	nbr_contact=messages.IntegerField(6)
	nbr_account=messages.IntegerField(7)
class stage_opportunity(ndb.Expando):
	stage=ndb.KeyProperty()
	amount=ndb.IntegerProperty()

class Reports(ndb.Expando):
    owner = ndb.StringProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    organization = ndb.KeyProperty()
    total_amount =ndb.IntegerProperty()
    nbr_lead=ndb.IntegerProperty()
    nbr_contact=ndb.IntegerProperty()
    nbr_account=ndb.IntegerProperty()
    # stages_amount=ndb.StructuredProperty()
    @classmethod
    def get(cls, user_from_email):
    	report=cls.query(cls.owner==user_from_email.google_user_id).fetch(1)
    	if report :
    		return report[0]

    @classmethod
    def get_schema(cls,user_from_email):

        report=cls.get(user_from_email)
        print '******************************'
        print report
        report_schema = ReportSchema(
                                  owner = report.owner,
                                  total_amount = report.total_amount,
                                  nbr_lead = report.nbr_lead,
                                  nbr_account=report.nbr_account,
                                  nbr_contact=report.nbr_contact                                
                                )
        return  report_schema

    @classmethod
    def create(cls,user_from_email,organization):
    	exist=cls.get(user_from_email)
    	if exist:
	        report = cls(
	                    owner = user_from_email.google_user_id,
	                    organization = user_from_email.organization,
	                    total_amount = 0,
	                    nbr_lead=0,
	                    nbr_contact=0,
	                    nbr_account=0
	                    )
	  
	        report_key = report.put_async()
	        report_key_async = report_key.get_result()
        # Edge.insert(start_node = report_key_async ,
        #               end_node = stage_key,
        #               kind = 'stages',
        #               inverse_edge = 'related_opportunities') 
  

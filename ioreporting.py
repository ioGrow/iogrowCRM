from google.appengine.ext import ndb
from protorpc import messages
from iomodels.crmengine.opportunitystage import Opportunitystage
import iograph 
from model import User
class stageOppSchema(messages.Message):
    entity_key=messages.StringField(1)
    name=messages.StringField(2)
    nbr=messages.IntegerField(3)
    amount=messages.IntegerField(4)
    probability=messages.IntegerField(5)
class ReportSchema(messages.Message):
    owner=messages.StringField(1)
    created_at=messages.StringField(2)
    organization=messages.StringField(3)
    total_amount=messages.IntegerField(4)
    nbr_lead=messages.IntegerField(5)
    nbr_contact=messages.IntegerField(6)
    nbr_account=messages.IntegerField(7)
    opp_stage=messages.MessageField(stageOppSchema,8,repeated=True)

class stage_opportunity(ndb.Expando):
    entity_key=ndb.KeyProperty()
    name=ndb.StringProperty()
    nbr=ndb.IntegerProperty()
    amount=ndb.IntegerProperty()
    probability=ndb.IntegerProperty()

class Reports(ndb.Expando):
    owner = ndb.StringProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    organization = ndb.KeyProperty()
    total_amount =ndb.IntegerProperty()
    nbr_lead=ndb.IntegerProperty()
    nbr_contact=ndb.IntegerProperty()
    nbr_account=ndb.IntegerProperty()
    nbr_opportunity=ndb.IntegerProperty()


    # stages_amount=ndb.StructuredProperty()
    @classmethod
    def get(cls, user_from_email):
    	report=cls.query(cls.organization==user_from_email.organization).fetch(1)
    	if report :
    		return report[0]

    @classmethod
    def get_schema(cls,user_from_email):
        report=cls.get(user_from_email)
        item=[]
        stages=iograph.Edge.list(start_node= report.key,kind= "report_stage")
        stages= stages["items"]
        for stage in stages:
            stage=stage.end_node.get()
            item.append(stageOppSchema(
                entity_key=stage.entity_key.urlsafe(),
                name=stage.name,
                nbr=stage.nbr,
                amount=stage.amount,
                probability=stage.probability

                )
            )


        report_schema = ReportSchema(
                                  owner = report.owner,
                                  total_amount = report.total_amount,
                                  nbr_lead = report.nbr_lead,
                                  nbr_account=report.nbr_account,
                                  nbr_contact=report.nbr_contact ,
                                  opp_stage=item                               
                                )
        return  report_schema

    @classmethod
    def create(cls,user_from_email):
        print "*************************************************************************************"
        print user_from_email
        print "+++++++++++++++++++++++++++++++++++++++++++++++"
        print user_from_email.google_user_id
        exist=cls.get(user_from_email)
        if not exist:
     
            report = cls(
                        owner = user_from_email.google_user_id,
                        organization = user_from_email.organization,
                        total_amount = 0,
                        nbr_lead=0,
                        nbr_contact=0,
                        nbr_account=0,
                        nbr_opportunity=0
                        )
            report_key=report.put()
            cls.init_stage(user_from_email,report_key)
      
    @classmethod
    def add_lead(cls,user_from_email,nbr=1):
        report=cls.get(user_from_email)
        report.nbr_lead= report.nbr_lead+nbr
        report.put()  
    @classmethod
    def add_account(cls,user_from_email,nbr=1):
        report=cls.get(user_from_email)
        report.nbr_account= report.nbr_account+nbr
        report.put()  
    @classmethod
    def add_contact(cls,user_from_email,nbr=1):
        report=cls.get(user_from_email)
        report.nbr_contact= report.nbr_contact+nbr
        report.put()
    @classmethod
    def add_opportunity(cls,user_from_email,opp_entity,nbr=1,amount=0):
    	report=cls.get(user_from_email)
        report.nbr_opportunity= report.nbr_opportunity+nbr
        report.total_amount=report.total_amount+amount
        report.put() 
        stage=cls.update_stage(user_from_email= user_from_email,opp_entity=opp_entity)
        stage.amount=stage.amount+amount
        stage.nbr=int(stage.nbr)+nbr
        stage.put()
        
    @classmethod 
    def init_stage(cls,user_from_email,report):
        stages=Opportunitystage.query(Opportunitystage.organization==user_from_email.organization).fetch()
        array=[]
        for stage in stages:
            node=stage_opportunity(name=stage.name,nbr=0,probability=stage.probability,amount=0,entity_key=stage.key)
            node_key=node.put()
            iograph.Edge.insert(start_node=report,end_node=node_key,kind="report_stage",inverse_edge="stage_report")
    @classmethod
    def update_stage(cls,user_from_email,opp_entity=None):
        report=cls.get(user_from_email)
        stage_key=None
        print opp_entity
        edge_stage=iograph.Edge.list(start_node=opp_entity,kind="stages")
        if edge_stage["items"] :
            stage_key=edge_stage["items"][0].end_node
        result=iograph.Edge.list(start_node=report.key,kind="report_stage")
        for edge in result["items"]:
            stage=edge.end_node.get()
            if  stage.entity_key== stage_key :
                return stage
    @classmethod
    def init_reports(cls):
        users=User.query()
        for user in users.iter(keys_only=True):
            cls.create(user.get())
    @classmethod
    def init_reports(cls):
        users=User.query()
        for user in users.iter(keys_only=True):
            cls.create(user.get())
    @classmethod
    def big_query(cls,org):
        users=User.query(User.organization==org)
        for user in users.iter(keys_only=True):
            print(user.get())






    

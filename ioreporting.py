from protorpc import messages

from google.appengine.ext import ndb
from iomodels.crmengine.opportunitystage import Opportunitystage ,OpportunitystageSchema
from iomodels.crmengine.opportunities import Opportunity
from iomodels.crmengine.leads import Lead
from iomodels.crmengine.leadstatuses import Leadstatus
from model import User
from iograph import Edge
# 13.10.2014 LAR This file is about reporting on Iogrow
 
None_Zero = lambda x: x if x else 0
srcs=[None,'Gmail','Gmail sync','LinkedIn','Twitter','ioGrow Live','Social Media','Web Site','Phone Inquiry','Partner Referral','Purchased List','Other']

class stageOppSchema(messages.Message):
    entity_key=messages.StringField(1)
    name=messages.StringField(2)
    nbr=messages.IntegerField(3)
    amount=messages.IntegerField(4)
    probability=messages.IntegerField(5)
class LeadStatusSchema(messages.Message):
    name=messages.StringField(1)
    nbr_leads=messages.IntegerField(2)
    entity_key=messages.StringField(3)


class ReportSchema(messages.Message):
    owner=messages.StringField(1)
    organization=messages.StringField(2)
    organization_opportunity_amount=messages.IntegerField(3)
    organization_opportunity_nbr=messages.IntegerField(4)
    nbr_lead=messages.IntegerField(5)
    nbr_contact=messages.IntegerField(6)
    nbr_account=messages.IntegerField(7)
    org_oppo_stage=messages.MessageField(OpportunitystageSchema,8,repeated=True)
    leads_status_org=messages.MessageField(LeadStatusSchema,9,repeated=True)
    leads_source_org=messages.MessageField(LeadStatusSchema,10,repeated=True)
    leads_owner_org=messages.MessageField(LeadStatusSchema,11,repeated=True)
    org_oppo_owner=messages.MessageField(OpportunitystageSchema,12,repeated=True)


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
        items=[]
        organization_opportunity_amount=0
        organization_opportunity_nbr=0
        stages=Opportunitystage.query(Opportunitystage.organization==user_from_email.organization).fetch()
        if stages :
            for stage in stages :
                organization_opportunity_amount=organization_opportunity_amount+stage.amount_opportunity
                organization_opportunity_nbr=organization_opportunity_nbr+stage.nbr_opportunity
                items.append(OpportunitystageSchema(
                    name=stage.name,
                    probability=stage.probability,
                    nbr_opportunity=stage.nbr_opportunity,
                    amount_opportunity=stage.amount_opportunity
                    )
                )
        return ReportSchema(
                            organization=user_from_email.organization.urlsafe(),
                            organization_opportunity_amount=organization_opportunity_amount,
                            organization_opportunity_nbr=organization_opportunity_nbr,
                            org_oppo_stage=items,

            )


            

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
        print "***********************************************"
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
        try:
            report=cls.get(user_from_email)
            report.nbr_lead += nbr
            report.put()
        except :
            print"###########################################################"
            print"((((((((((((((  error in lead reports line 105   ))))))))))"
            print"###########################################################"
    @classmethod
    def add_account(cls,user_from_email,nbr=1):
        try:
            report=cls.get(user_from_email)
            report.nbr_account += nbr
            report.put()
        except :
            print"###########################################################"
            print"((((((((((((((  error in account reports line 115  ))))))))))"
            print"###########################################################"
    @classmethod
    def add_contact(cls,user_from_email,nbr=1):
        try:
            report=cls.get(user_from_email)
            report.nbr_contact += nbr
            report.put()
        except :
            print"###########################################################"
            print"((((((((((((((  error in contact reports line 125   ))))))))))"
            print"###########################################################"


    @classmethod
    def add_opportunity(cls,stage_key,amount=0):
        stage=stage_key.get()
        stage.nbr_opportunity += 1
        stage.amount_opportunity += amount
        stage.put()
    @classmethod
    def remove_opportunity(cls,opp):
        from iograph import Edge
        query=Edge.list(start_node=opp.key, kind="stages",limit=1)
        if query["items"] :
            stage=query["items"][0].end_node.get()
            stage.nbr_opportunity -= 1
            stage.amount_opportunity=stage.amount_opportunity-opp.amount_total
            stage.put()
    def update_opportunity(cls):
        pass 

        
            
       
        
    @classmethod 
    def init_stage(cls,user_from_email,report):
        import iograph
        stages=Opportunitystage.query(Opportunitystage.organization==user_from_email.organization).fetch()
        array=[]
        for stage in stages:
            node=stage_opportunity(name=stage.name,nbr=0,probability=stage.probability,amount=0,entity_key=stage.key)
            node_key=node.put()
            iograph.Edge.insert(start_node=report,end_node=node_key,kind="report_stage",inverse_edge="stage_report")

    @classmethod
    def init_reports(cls):
        from model import User
        users=User.query()
        for user in users.iter(keys_only=True):
            
            cls.create(user.get())

    @classmethod
    def init_reports(cls):
        from model import User
        users=User.query()
        for user in users.iter(keys_only=True):
            cls.create(user.get())
    @classmethod
    def big_query(cls,org):
        users=User.query(User.organization==org)
        for user in users.iter(keys_only=True):
            print(user.get())
    @classmethod

    def lead_by_owner(cls,org):
        users=User.query(User.organization==org)
        for user in users.iter(keys_only=True):
            print(user.get())



    def opp_by_owner(cls,org):
        from model import Organization
        org=ndb.kind(urlsafe=org)
        users=User.query(User.organization==org)
        for user in users.iter(keys_only=True):
            print(user.get())
    @classmethod
    def add_stage(cls,user_from_email,stage=None):
        import iograph
        report=cls.get(user_from_email)
        node=stage_opportunity(name=stage.name,nbr=0,probability=stage.probability,amount=0,entity_key=stage.key)
        node_key=node.put()
        iograph.Edge.insert(start_node=report.key,end_node=node_key,kind="report_stage",inverse_edge="stage_report")


    @classmethod
    def remove_stage(cls,user_from_email,stage_key=None):
        import iograph
        report=cls.get(user_from_email)
        result=iograph.Edge.list(start_node=report.key,kind="report_stage")
        for edge in result["items"]:
            stage=edge.end_node.get()
            print stage_key 
            print "----------------------------------------------------------------"
            print stage.name
            if  stage.entity_key== stage_key :
                print "#################### delete ###############################"
                print stage.name
                stage.key.delete()
                iograph.Edge.delete_all(stage.key)
    @classmethod
    def reportQuery(cls,user_from_email):
        org=user_from_email.organization
        query_lead=Lead.query(Lead.organization==org)
        leads=query_lead.fetch()
        total_lead=len(leads)
        statuses=Leadstatus.query(Leadstatus.organization==org).fetch()
        lead_by_status=[]
        for status in statuses :
            lead_by_status.append( 
                    LeadStatusSchema(
                        entity_key=status.key.urlsafe(),
                        name=status.status,
                        nbr_leads=len(query_lead.filter(Lead.status==status.status).fetch())
                        )
                    )
       

        query_user=User.query(User.organization==org)
        users=query_user.fetch()
        total_user=len(users)
        lead_by_owner=[]
        for user in users:
            lead_by_owner.append(
                    LeadStatusSchema(
                        entity_key=user.key.urlsafe(),
                        name=user.google_display_name,
                        nbr_leads=len(query_lead.filter(Lead.owner==user.google_user_id).fetch())
                        )
                )
        
    
        lead_by_source=[]
        for src in srcs:
            lead_by_source.append(
                    LeadStatusSchema(
                        entity_key=u"",
                        name=src or "Other",
                        nbr_leads=len(query_lead.filter(Lead.source==src).fetch())
                        )
                )
       
        oppo_stage=[]
        total_amount=0
        total_nbr=0
        # stages=Opportunitystage.query(Opportunitystage.organization==org).fetch()
        # for stage in stages:
        #     amount_oppo_stage=0
        #     result= Edge.list(start_node=stage.key,kind="related_opportunities")["items"]
        #     nbr_oppo_stage=len(result)
        #     for oppo in result:
        #         oppo=oppo.end_node.get()
        #         if oppo :
        #             amount_oppo_stage=amount_oppo_stage+oppo.amount_total
        #     oppo_stage.append(
        #             OpportunitystageSchema(
        #                 name=stage.name,
        #                 probability=stage.probability,
        #                 nbr_opportunity=nbr_oppo_stage,
        #                 amount_opportunity=amount_oppo_stage
        #                 )
        #         )
        #     total_nbr=total_nbr+nbr_oppo_stage
        #     total_amount=total_amount+amount_oppo_stage
        stage_names=[]
        query_oppo=Opportunity.query(Opportunity.organization==org)
        stages=Opportunitystage.query(Opportunitystage.organization==org).fetch()
        for stage in stages:
            stage.nbr_opportunity=0
            stage.amount_opportunity=0
            stage.put()
        oppo_stages=query_oppo.fetch()
        for oppo in oppo_stages:
            result= Edge.list(start_node=oppo.key,kind="stages")["items"]
            
            total_amount=total_amount+None_Zero(oppo.amount_total)
            total_nbr += 1
            if result: 
                stage=result[0].end_node.get()
                stage.nbr_opportunity += 1
                
                stage.amount_opportunity=None_Zero(stage.amount_opportunity)+None_Zero(oppo.amount_total)
                stage.put()
        for s in stages:
            oppo_stage.append(
                    OpportunitystageSchema(
                        name=s.name,
                        probability=s.probability,
                        nbr_opportunity=s.nbr_opportunity,
                        amount_opportunity=s.amount_opportunity
                        )
                )

        oppo_by_owner=[]
        for user in users:
            opportunities=query_oppo.filter(Opportunity.owner==user.google_user_id).fetch()
            amount=0
            nbr=len(opportunities)
            for opportunity in opportunities:
                amount=amount+None_Zero(opportunity.amount_total)
            oppo_by_owner.append(
                    OpportunitystageSchema(
                        name=user.google_display_name,
                        nbr_opportunity=nbr,
                        amount_opportunity=amount
                        )
                )




        return ReportSchema(
                organization=org.urlsafe(),
                organization_opportunity_amount=total_amount,
                organization_opportunity_nbr=total_nbr,
                nbr_lead=total_lead,
                nbr_contact=0,
                nbr_account=0,
                org_oppo_stage=oppo_stage,
                org_oppo_owner=oppo_by_owner,
                leads_status_org=lead_by_status,
                leads_source_org=lead_by_source,
                leads_owner_org=lead_by_owner,
            )





       

        



        
            
                

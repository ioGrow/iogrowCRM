from google.appengine.ext import ndb
from protorpc import messages

from iomodels.crmengine.leads import Lead
from iomodels.crmengine.opportunities import Opportunity
from iomodels.crmengine.opportunitystage import Opportunitystage
from model import Organization
from model import User


#idriss repor request
class ReportingRequest(messages.Message):
    user_google_id = messages.StringField(1)
    google_display_name=messages.StringField(2)
    sorted_by=messages.StringField(3)
    status=messages.StringField(4)
    source=messages.StringField(5)
    stage=messages.StringField(6)
    organization_id=messages.StringField(7)

#idriss repor request
class ReportingResponseSchema(messages.Message):
    user_google_id = messages.StringField(1)
    count = messages.IntegerField(2)
    google_display_name=messages.StringField(3)
    email=messages.StringField(4)
    created_at=messages.StringField(5)
    count_account=messages.IntegerField(6)
    count_contacts=messages.IntegerField(7)
    count_leads=messages.IntegerField(8)
    count_tasks=messages.IntegerField(9)
    updated_at=messages.StringField(10)
    amount=messages.IntegerField(11)
    organization_id=messages.StringField(12)
@endpoints.api(
               name='crmengine',
               version='v1',
               scopes = ["https://www.googleapis.com/auth/plus.login", "https://www.googleapis.com/auth/plus.profile.emails.read"],
               description='I/Ogrow CRM APIs',
               allowed_client_ids=[
                                   CLIENT_ID,
                                   endpoints.API_EXPLORER_CLIENT_ID
                                   ]
               )

#idriss repor request
class ReportingListResponse(messages.Message):
    items = messages.MessageField(ReportingResponseSchema, 1, repeated=True)
 # lead reporting api
    @endpoints.method(ReportingRequest, ReportingListResponse,
                      path='reporting/leads', http_method='POST',
                      name='reporting.leads')
    def lead_reporting(self, request):
        list_of_reports = []
        gid=request.user_google_id
        gname=request.google_display_name
        source=request.source
        status=request.status
        organization=request.organization_id
        print organization
        print type(organization)
        print type(gid)
        created_at=''

        item_schema=ReportingResponseSchema()

        #if the user input google_user_id

        item_schema=None

        if gid!=None and gid!='':
            list_of_reports=[]
            leads=Lead.query(Lead.owner==gid).fetch()

            if source!=None and source!='':
                leads=Lead.query(Lead.owner==gid,Lead.source==source).fetch()
               


            if status!=None and status!='':
                leads=Lead.query(Lead.owner==gid,Lead.status==status).fetch()
               

            if status!=None and status!='' and source!=None and source!='':
                leads=Lead.query(Lead.owner==gid,Lead.status==status,Lead.source==source).fetch()

 
            users=User.query(User.google_user_id==gid).fetch()
            if users:
                gname=users[0].google_display_name
                gmail=users[0].email
                created_at=users[0].created_at
                list_of_reports.append((gid,gname,len(leads),created_at))
                item_schema = ReportingResponseSchema(user_google_id=list_of_reports[0][0],google_display_name=list_of_reports[0][1],count=list_of_reports[0][2])
            return ReportingListResponse(items=[item_schema])


        #if the user input name of user
        elif gname!=None and gname!='':
            list_of_reports=[]
            users=User.query(User.google_display_name==gname).fetch()
            if organization:
                organization_key=ndb.Key(Organization,int(organization))
                users=User.query(User.google_user_id==gid,User.organization==organization_key).fetch(1)

            for user in users:
                gid=user.google_user_id
                leads=Lead.query(Lead.owner==gid).fetch()
                gname=user.google_display_name
                gmail=user.email
                org_id=ndb.Key.id(user.organization)
                org_id=str(org_id)                
                created_at=user.created_at
                list_of_reports.append((gid,gname,gmail,len(leads),created_at,org_id))
            
            reporting = []
            print list_of_reports
            for item in list_of_reports:
                item_schema = ReportingResponseSchema(user_google_id=item[0],google_display_name=item[1],email=item[2],count=item[3],created_at=item[4],organization_id=item[5])
                reporting.append(item_schema)
            return ReportingListResponse(items=reporting)

        # if the user not input any think 
        else:       
            list_of_reports=[]
            users=User.query().fetch()
            if organization:
                organization_key=ndb.Key(Organization,int(organization))
                users=User.query(User.organization==organization_key).fetch()
                if not users:
                    users=User.query().fetch()


   

            for user in users:
                print user
                gid=user.google_user_id
                gname=user.google_display_name
                leads=Lead.query(Lead.owner==gid).fetch()
                org_id=ndb.Key.id(user.organization)

                created_at=user.created_at
                list_of_reports.append((gid,gname,len(leads),created_at,str(org_id)))
                
            list_of_reports.sort(key=itemgetter(2),reverse=True)
            reporting = []
            for item in list_of_reports:
                item_schema = ReportingResponseSchema(user_google_id=item[0],google_display_name=item[1],count=item[2],organization_id=item[4])
                reporting.append(item_schema)
            return ReportingListResponse(items=reporting)
    
     # opportunities reporting api
    @endpoints.method(ReportingRequest, ReportingListResponse,
                      path='reporting/opportunities', http_method='POST',
                      name='reporting.opportunities')
    def opportunities_reporting(self, request):
        list_of_reports = []
        gid=request.user_google_id
        gname=request.google_display_name
        stage=request.stage
        created_at=''
        organization=request.organization_id
        item_schema=ReportingResponseSchema()
        # if the user input google_user_id

        if gid!=None and gid!='':
            list_of_reports=[]
            users=User.query(User.google_user_id==gid).fetch(1)
                      
            
            opportunities=[]
           
            if stage!=None and stage!='':
                stages=Opportunitystage.query(Opportunitystage.organization==users[0].organization,Opportunitystage.name==stage).fetch()               
                print stages
                if stages:
                    opportunitystage_key=ndb.Key(Opportunitystage,int(stages[0].id))
                    edges=Edge.query(Edge.kind=='related_opportunities',Edge.start_node==opportunitystage_key)
                    amount=0
                    for edge in edges:
                        opportunity_key=edge.end_node
                        opportunitie=Opportunity.get_by_id(ndb.Key.id(opportunity_key))
                        if opportunitie.owner==gid:                      
                            opportunities.append(opportunitie)
                        
                        amount+=opportunitie.amount_total
                    
                
                else:
                    amount=0
                    opportunities=Opportunity.query(Opportunity.owner==gid).fetch()
                    for opportunity in opportunities:
                        amount+=opportunity.amount_total 
                print opportunities
            else:   

                amount=0
                opportunities=Opportunity.query(Opportunity.owner==gid).fetch()
                for opportunity in opportunities:
                    amount+=opportunity.amount_total

                             
            if users:
                gname=users[0].google_display_name
                gmail=users[0].email
                created_at=users[0].created_at
                list_of_reports.append((gid,gname,len(opportunities),created_at,amount))
                item_schema = ReportingResponseSchema(user_google_id=list_of_reports[0][0],google_display_name=list_of_reports[0][1],count=list_of_reports[0][2],amount=amount)
            reporting = [item_schema]
            return ReportingListResponse(items=reporting)


        #if the user input name of user
        elif gname!=None and gname!='':
            list_of_reports=[]
            users=User.query(User.google_display_name==gname).fetch()
            if organization:
                organization_key=ndb.Key(Organization,int(organization))
                users=User.query(User.google_display_name==gname,User.organzation==organization_Key).fetch()
            
            for user in users:
                gid=user.google_user_id
                opportunities=Opportunity.query(Opportunity.owner==gid).fetch()
                gname=user.google_display_name
                gmail=user.email
                organization_id=user.organization
                created_at=user.created_at
                list_of_reports.append((gid,gname,gmail,len(opportunities),created_at,organization))
            
            reporting = []
            print list_of_reports
            for item in list_of_reports:
                item_schema = ReportingResponseSchema(user_google_id=item[0],google_display_name=item[1],email=item[2],count=item[3],organization_id=item[4])
                reporting.append(item_schema)
            return ReportingListResponse(items=reporting)

        # if the user not input any think 
        else:
            list_of_reports=[]
            users=User.query().fetch()
            if organization:
                organization_key=ndb.Key(Organization,int(organization))
                users=User.query(User.organization==organization_key).fetch()
                if not users:
                    users=User.query().fetch()


            for user in users:
                gid=user.google_user_id
                gname=user.google_display_name
                opportunities=Opportunity.query(Opportunity.owner==gid).fetch()
                created_at=user.created_at
                org_id=user.organization
                
                list_of_reports.append((gid,gname,len(opportunities),created_at,str(org_id)))
                
            list_of_reports.sort(key=itemgetter(2),reverse=True)
            reporting = []
            for item in list_of_reports:
                item_schema = ReportingResponseSchema(user_google_id=item[0],google_display_name=item[1],count=item[2],organization_id=item[4])
                reporting.append(item_schema)
            return ReportingListResponse(items=reporting)        

    # lead contact api
    @endpoints.method(ReportingRequest, ReportingListResponse,
                      path='reporting/contacts', http_method='POST',
                      name='reporting.contacts')
    def contact_reporting(self, request):
        list_of_reports = []
        gid=request.user_google_id
        gname=request.google_display_name
        created_at=''
        item_schema=ReportingResponseSchema()
        # if the user input google_user_id
        if gid!=None and gid!='':
            list_of_reports=[]
            contacts=Contact.query(Lead.owner==gid).fetch()
            users=User.query(User.google_user_id==gid).fetch()
            if users:
                gname=users[0].google_display_name
                created_at=users[0].created_at
                list_of_reports.append((gid,gname,len(contacts),created_at))
                item_schema = ReportingResponseSchema(user_google_id=list_of_reports[0][0],google_display_name=list_of_reports[0][1],count=list_of_reports[0][2])
            return ReportingListResponse(items=[item_schema])
        
        #if the user input name of user
        elif gname!=None and gname!='':
            list_of_reports=[]
            users=User.query(User.google_display_name==gname).fetch()
            for user in users:
                gid=user.google_user_id
                contacts=Contact.query(Contact.owner==gid).fetch()
                gname=user.google_display_name
                gmail=user.email
                created_at=user.created_at
                list_of_reports.append((gid,gname,gmail,len(contacts),created_at))
            
            reporting = []
            print list_of_reports
            for item in list_of_reports:
                item_schema = ReportingResponseSchema(user_google_id=item[0],google_display_name=item[1],email=item[2],count=item[3])
                reporting.append(item_schema)
            return ReportingListResponse(items=reporting)    
        
        # if the user input google_user_id
        else:
            users=User.query().fetch()
            list_of_reports=[]
            for user in users:
                gid=user.google_user_id
                gname=user.google_display_name
                created_at=user.created_at
                contacts=Contact.query(Contact.owner==gid).fetch()
                list_of_reports.append((gid,gname,len(contacts),created_at))      
            list_of_reports.sort(key=itemgetter(2),reverse=True)
            reporting = []
            for item in list_of_reports:
                item_schema = ReportingResponseSchema(user_google_id=item[0],google_display_name=item[1],count=item[2])
                reporting.append(item_schema)
            return ReportingListResponse(items=reporting)

     # account reporting api
    @endpoints.method(ReportingRequest, ReportingListResponse,
                      path='reporting/accounts', http_method='POST',
                      name='reporting.accounts')
    def account_reporting(self, request):
        list_of_reports = []
        gid=request.user_google_id
        gname=request.google_display_name
        created_at=''
        item_schema=ReportingResponseSchema()
        # if the user input google_user_id
        if gid!=None and gid!='':
            list_of_reports=[]
            accounts=Account.query(Account.owner==gid).fetch()
            users=User.query(User.google_user_id==gid).fetch()
            if users:
                gname=users[0].google_display_name
                created_at=users[0].created_at
                list_of_reports.append((gid,gname,len(accounts),created_at))
                item_schema = ReportingResponseSchema(user_google_id=list_of_reports[0][0],google_display_name=list_of_reports[0][1],count=list_of_reports[0][2])
            return ReportingListResponse(items=[item_schema])

        #if the user input name of user
        elif gname!=None and gname!='':
            list_of_reports=[]
            users=User.query(User.google_display_name==gname).fetch()
            for user in users:
                gid=user.google_user_id
                accounts=Account.query(Account.owner==gid).fetch()
                gname=user.google_display_name
                gmail=user.email
                created_at=user.created_at
                list_of_reports.append((gid,gname,gmail,len(accounts),created_at))
            
            reporting = []
            print list_of_reports
            for item in list_of_reports:
                item_schema = ReportingResponseSchema(user_google_id=item[0],google_display_name=item[1],email=item[2],count=item[3])
                reporting.append(item_schema)
            return ReportingListResponse(items=reporting)   

        else:
            users=User.query().fetch()
            list_of_reports = []
            for user in users:
                gid=user.google_user_id
                gname=user.google_display_name
                accounts=Account.query(Account.owner==gid).fetch()
                created_at=user.created_at
                list_of_reports.append((gid,gname,len(accounts),created_at))

            list_of_reports.sort(key=itemgetter(2),reverse=True)
            reporting = []
            for item in list_of_reports:
                item_schema = ReportingResponseSchema(user_google_id=item[0],google_display_name=item[1],count=item[2])
                reporting.append(item_schema)
            return ReportingListResponse(items=reporting)

     # task reporting api
    @endpoints.method(ReportingRequest,ReportingListResponse,
                       path='reporting/tasks',http_method='POST',
                       name='reporting.tasks' )
    def task_reporting(self,request):
        list_of_reports = []
        gid=request.user_google_id
        gname=request.google_display_name
        created_at=''
        item_schema=ReportingResponseSchema()
        # if the user input google_user_id
        if gid!=None and gid!='':
            list_of_reports=[]
            tasks=Task.query(Task.owner==gid).fetch()
            users=User.query(User.google_user_id==gid).fetch()
            if users:
                gname=users[0].google_display_name
                created_at=users[0].created_at
                list_of_reports.append((gid,gname,len(tasks),created_at))
                item_schema = ReportingResponseSchema(user_google_id=list_of_reports[0][0],google_display_name=list_of_reports[0][1],count=list_of_reports[0][2])
            return ReportingListResponse(items=[item_schema])

        #if the user input name of user
        elif gname!=None and gname!='':
            list_of_reports=[]
            users=User.query(User.google_display_name==gname).fetch()
            for user in users:
                gid=user.google_user_id
                tasks=Task.query(Task.owner==gid).fetch()
                gname=user.google_display_name
                gmail=user.email
                created_at=user.created_at
                list_of_reports.append((gid,gname,gmail,len(tasks),created_at))
            
            reporting = []
            for item in list_of_reports:
                item_schema = ReportingResponseSchema(user_google_id=item[0],google_display_name=item[1],email=item[2],count=item[3])
                reporting.append(item_schema)
            return ReportingListResponse(items=reporting)  
                
        # if the user input google_user_id    
        else:
            users=User.query().fetch()
            list_of_reports=[]
            for user in users:
                gid=user.google_user_id
                gname=user.google_display_name
                tasks=Task.query(Task.owner==gid).fetch()
                created_at=user.created_at
                list_of_reports.append((gid,gname,len(tasks),created_at))
                
            list_of_reports.sort(key=itemgetter(2),reverse=True)    
            reporting = []
            for item in list_of_reports:
                item_schema = ReportingResponseSchema(user_google_id=item[0],google_display_name=item[1],count=item[2])
                reporting.append(item_schema)

            return ReportingListResponse(items=reporting) 
    
    # summary activity reporting api report on lead, contact,account,task
    @endpoints.method(ReportingRequest,ReportingListResponse,
                       path='reporting/summary',http_method='POST',
                       name='reporting.summary' )
    def summary_reporting(self,request):
        list_of_reports = []
        gid=request.user_google_id
        gname=request.google_display_name
        created_at=''
        item_schema=ReportingResponseSchema()
        # if the user input google_user_id
        if gid!=None and gid!='':
            list_of_reports=[]
            tasks=Task.query(Task.owner==gid).fetch()
            accounts=Account.query(Account.owner==gid).fetch()
            leads=Lead.query(Lead.owner==gid).fetch()
            contacts=Contact.query(Contact.owner==gid).fetch()
            users=User.query(User.google_user_id==gid).fetch()
            if users:
                gname=users[0].google_display_name
                gmail=users[0].email
                created_at=users[0].created_at
                list_of_reports.append((gid,gname,gmail,len(accounts),len(contacts),len(leads),len(tasks),created_at))
                item_schema = ReportingResponseSchema(user_google_id=list_of_reports[0][0],google_display_name=list_of_reports[0][1],email=list_of_reports[0][2],count_account=list_of_reports[0][3],count_contacts=list_of_reports[0][4],count_leads=list_of_reports[0][5],count_tasks=list_of_reports[0][6])
            return ReportingListResponse(items=[item_schema])

        #if the user input name of user
        elif gname!=None and gname!='':
            list_of_reports=[]
            users=User.query(User.google_display_name==gname).fetch()
            for user in users:
                gid=user.google_user_id
                tasks=Task.query(Task.owner==gid).fetch()
                accounts=Account.query(Account.owner==gid).fetch()
                leads=Lead.query(Lead.owner==gid).fetch()
                contacts=Contact.query(Contact.owner==gid).fetch()
                gname=user.google_display_name
                gmail=user.email
                created_at=user.created_at
                list_of_reports.append((gid,gname,gmail,len(accounts),len(contacts),len(leads),len(tasks),created_at))
            
            reporting = []
            for item in list_of_reports:
                item_schema = ReportingResponseSchema(user_google_id=item[0],google_display_name=item[1],email=item[2],count_account=item[3],count_contacts=item[4],count_leads=item[5],count_tasks=item[6])
                reporting.append(item_schema)
            return ReportingListResponse(items=reporting)  
                
        # if the user input google_user_id    
        else:
            sorted_by=request.sorted_by
            users=User.query().order(-User.updated_at)
            if sorted_by=='created_at':
                users=User.query().order(-User.created_at)

            list_of_reports=[]
            for user in users:
                gid=user.google_user_id
                gname=user.google_display_name
                tasks=Task.query(Task.owner==gid).fetch()
                accounts=Account.query(Account.owner==gid).fetch()
                leads=Lead.query(Lead.owner==gid).fetch()
                contacts=Contact.query(Contact.owner==gid).fetch()
                created_at=user.created_at
                updated_at=user.updated_at              
                gmail=user.email
                list_of_reports.append((gid,gname,gmail,len(accounts),len(contacts),len(leads),len(tasks),created_at,updated_at))
                
            if sorted_by=='accounts':
                list_of_reports.sort(key=itemgetter(3),reverse=True)
            elif sorted_by=='contacts':
                list_of_reports.sort(key=itemgetter(4),reverse=True)
            elif sorted_by=='leads':
                list_of_reports.sort(key=itemgetter(5),reverse=True)
            elif sorted_by=='tasks':
                list_of_reports.sort(key=itemgetter(6),reverse=True)
            #elif sorted_by=='created_at':
            #   list_of_reports.sort(key=itemgetter(7),reverse=True)
            #else:
            #    list_of_reports.sort(key=itemgetter(4),reverse=True)
            reporting = []
            for item in list_of_reports:
                item_schema = ReportingResponseSchema(user_google_id=item[0],google_display_name=item[1],email=item[2],count_account=item[3],count_contacts=item[4],count_leads=item[5],count_tasks=item[6],created_at=str(item[7]),updated_at=str(item[8]))
                reporting.append(item_schema)

            return ReportingListResponse(items=reporting)   

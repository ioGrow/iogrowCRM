import json

import requests
from crm.iomodels.accounts import Account, AccountInsertRequest
from crm.iomodels.casestatuses import Casestatus
from crm.iomodels.contacts import Contact, ContactInsertRequest
from crm.iomodels.leads import Lead, LeadInsertRequest
from crm.iomodels.opportunities import Opportunity, OpportunityInsertRequest
from crm.iomodels.opportunitystage import Opportunitystage

from crm import iomessages
from crm.iomodels.cases import Case, CaseInsertRequest

"""
name = messages.StringField(1)
    priority = messages.IntegerField(2)
    status = messages.StringField(3)
    account = messages.StringField(4)
    contact = messages.StringField(5)
    access = messages.StringField(6)
    infonodes = messages.MessageField(iomessages.InfoNodeRequestSchema,7,repeated=True)
    description = messages.StringField(8)
"""


class SfImporterHelper:
    # accounts
    def __init__(self):
        pass

    @classmethod
    def import_accounts(cls, user, http, sf_objects):
        print 'i will get the list of available accounts'
        sf_objects['Account'] = {}
        r, c = http.request("https://na12.salesforce.com/services/data/v29.0/query?q=SELECT+Id+from+Account")
        results = json.loads(c)
        for record in results['records']:
            print 'i want to get the details of account number' + record['Id']
            r, c = http.request("https://na12.salesforce.com/services/data/v29.0/sobjects/Account/" + record['Id'])
            sf_account = json.loads(c)
            account_request = cls.get_account_schema(sf_account)
            imported_account = cls.import_account(user, account_request)
            sf_objects['Account'][record['Id']] = imported_account.entityKey

    @classmethod
    def get_account_schema(cls, sf_account):
        account_schema = AccountInsertRequest(
            name=sf_account['Name'],
            account_type=sf_account['Type'],
            industry=sf_account['Industry'],
            access='public',
            introduction=sf_account['Description'],
            phones=[iomessages.PhoneSchema(
                type='work',
                number=sf_account['Phone']
            )],
            addresses=[iomessages.AddressSchema(
                country=sf_account['ShippingCountry'],
            )]
        )
        return account_schema

    @classmethod
    def import_account(cls, user, account_request):
        return Account.insert(user, account_request)

    # contacts
    @classmethod
    def import_contacts(cls, user, http, sf_objects):
        print '====='
        print sf_objects
        sf_objects['Contact'] = {}
        print 'i will get the list of available contacts'
        r, c = http.request("https://na12.salesforce.com/services/data/v29.0/query?q=SELECT+Id+from+Contact")
        results = json.loads(c)
        for record in results['records']:
            print 'i want to get the details of contact number' + record['Id']
            r, c = http.request("https://na12.salesforce.com/services/data/v29.0/sobjects/Contact/" + record['Id'])
            sf_contact = json.loads(c)
            contact_request = cls.get_contact_schema(sf_contact, sf_objects)
            imported_contact = cls.import_contact(user, contact_request)
            sf_objects['Contact'][record['Id']] = imported_contact.entityKey

    @classmethod
    def get_contact_schema(cls, sf_contact, sf_objects):
        empty_string = lambda x: x if x else " "
        phones = []
        if sf_contact['Phone']:
            phones.append(iomessages.PhoneSchema(
                type='work',
                number=sf_contact['Phone']
            )
            )
        if sf_contact['MobilePhone']:
            phones.append(iomessages.PhoneSchema(
                type='mobile',
                number=sf_contact['MobilePhone']
            )
            )
        if sf_contact['HomePhone']:
            phones.append(iomessages.PhoneSchema(
                type='home',
                number=sf_contact['HomePhone']
            )
            )
        if sf_contact['OtherPhone']:
            phones.append(iomessages.PhoneSchema(
                type='other',
                number=sf_contact['OtherPhone']
            )
            )
        if sf_contact['Fax']:
            phones.append(iomessages.PhoneSchema(
                type='fax',
                number=sf_contact['Fax']
            )
            )
        contact_schema = ContactInsertRequest(
            firstname=empty_string(sf_contact['FirstName']),
            lastname=empty_string(sf_contact['LastName']),
            access='public',
            introduction=sf_contact['Description'],
            phones=phones,
            addresses=[iomessages.AddressSchema(
                country=sf_contact['MailingCountry']
            ),
                iomessages.AddressSchema(
                    country=sf_contact['OtherCountry']
                )
            ],
            emails=[iomessages.EmailSchema(
                email=sf_contact['Email']
            )]
        )
        if sf_contact['AccountId']:
            contact_schema.account = sf_objects['Account'][sf_contact['AccountId']]
            contact_schema.title = empty_string(sf_contact['Title'])
        return contact_schema

    @classmethod
    def import_contact(cls, user, contact_request):
        return Contact.insert(user, contact_request)

    # opportunities
    @classmethod
    def import_opportunities(cls, user, http, sf_objects):
        print 'i will get the list of available opportunities'
        sf_objects['Opportunity'] = {}
        sf_objects['OpportunityStage'] = {}
        r, c = http.request("https://na12.salesforce.com/services/data/v29.0/query?q=SELECT+Id+from+Opportunity")
        results = json.loads(c)
        for record in results['records']:
            print 'i want to get the details of Opportunity number ' + record['Id']
            r, c = http.request("https://na12.salesforce.com/services/data/v29.0/sobjects/Opportunity/" + record['Id'])
            sf_opportunity = json.loads(c)
            print sf_opportunity.keys()
            opportunity_request = cls.get_opportunity_schema(sf_opportunity, sf_objects, user)
            imported_opportunity = cls.import_opportunity(user, opportunity_request)
            sf_objects['Opportunity'][record['Id']] = imported_opportunity.entityKey

    @classmethod
    def get_opportunity_schema(cls, sf_opportunity, sf_objects, user):
        opportunity_schema = OpportunityInsertRequest(
            name=sf_opportunity['Name'],
            competitor=sf_opportunity['MainCompetitors__c'],
            description=sf_opportunity['Description']
        )
        if sf_opportunity['Amount']:
            opportunity_schema.amount_total = int(sf_opportunity['Amount'])
        stage_name = sf_opportunity['StageName']
        if stage_name in sf_objects['OpportunityStage'].keys():
            stage_key = sf_objects['OpportunityStage'][stage_name]
        else:
            new_stage = Opportunitystage(
                owner=user.google_user_id,
                organization=user.organization,
                name=stage_name,
                probability=int(sf_opportunity['Probability'])
            )
            new_stage_async = new_stage.put_async()
            stage_key = new_stage_async.get_result()
        sf_objects['OpportunityStage'][stage_name] = stage_key
        opportunity_schema.stage = stage_key.urlsafe()
        if sf_opportunity['AccountId']:
            opportunity_schema.account = sf_objects['Account'][sf_opportunity['AccountId']]

        return opportunity_schema

    @classmethod
    def import_opportunity(cls, user, opportunity_request):
        return Opportunity.insert(user, opportunity_request)

    # leads
    @classmethod
    def import_leads(cls, user, http, sf_objects):
        print 'i will get the list of available leads'
        sf_objects['Lead'] = {}
        r, c = http.request("https://na12.salesforce.com/services/data/v29.0/query?q=SELECT+Id+from+Lead")
        results = json.loads(c)
        for record in results['records']:
            print 'i want to get the details of Lead number ' + record['Id']
            r, c = http.request("https://na12.salesforce.com/services/data/v29.0/sobjects/Lead/" + record['Id'])
            sf_lead = json.loads(c)
            lead_request = cls.get_lead_schema(sf_lead, sf_objects)
            imported_lead = cls.import_lead(user, lead_request)
            sf_objects['Lead'][record['Id']] = imported_lead.entityKey

    @classmethod
    def get_lead_schema(cls, sf_lead, sf_objects):
        empty_string = lambda x: x if x else " "
        phones = []
        print '*************Lead Schema***********'
        print sf_lead.keys()
        if sf_lead['Phone']:
            phones.append(iomessages.PhoneSchema(
                type='work',
                number=sf_lead['Phone']
            )
            )
        if sf_lead['MobilePhone']:
            phones.append(iomessages.PhoneSchema(
                type='mobile',
                number=sf_lead['MobilePhone']
            )
            )
        if sf_lead['Fax']:
            phones.append(iomessages.PhoneSchema(
                type='fax',
                number=sf_lead['Fax']
            )
            )
        lead_schema = LeadInsertRequest(
            firstname=empty_string(sf_lead['FirstName']),
            lastname=empty_string(sf_lead['LastName']),
            access='public',
            company=sf_lead['Company'],
            title=sf_lead['Title'],
            introduction=sf_lead['Description'],
            phones=phones,
            emails=[iomessages.EmailSchema(
                email=sf_lead['Email']
            )]
        )
        return lead_schema

    @classmethod
    def import_lead(cls, user, lead_request):
        return Lead.insert(user, lead_request)

    # cases
    @classmethod
    def import_cases(cls, user, http, sf_objects):
        print 'i will get the list of available cases'
        sf_objects['Case'] = {}
        sf_objects['CaseStatus'] = {}
        r, c = http.request("https://na12.salesforce.com/services/data/v29.0/query?q=SELECT+Id+from+Case")
        results = json.loads(c)
        for record in results['records']:
            print 'i want to get the details of Case number ' + record['Id']
            r, c = http.request("https://na12.salesforce.com/services/data/v29.0/sobjects/Case/" + record['Id'])
            sf_case = json.loads(c)
            case_request = cls.get_case_schema(sf_case, sf_objects, user)
            imported_case = cls.import_case(user, case_request)
            sf_objects['Case'][record['Id']] = imported_case.entityKey

    @classmethod
    def get_case_schema(cls, sf_case, sf_objects, user):
        empty_string = lambda x: x if x else " "
        case_schema = CaseInsertRequest(
            name='[#' + sf_case['CaseNumber'] + '] ' + empty_string(sf_case['Subject']),
            description=sf_case['Description']
        )
        status_name = sf_case['Status']
        if status_name in sf_objects['CaseStatus'].keys():
            status_key = sf_objects['CaseStatus'][status_name]
        else:
            new_status = Casestatus(
                owner=user.google_user_id,
                organization=user.organization,
                status=status_name
            )
            new_status_async = new_status.put_async()
            status_key = new_status_async.get_result()
        sf_objects['CaseStatus'][status_name] = status_key
        case_schema.status = status_key.urlsafe()
        if sf_case['ContactId']:
            case_schema.contact = sf_objects['Contact'][sf_case['ContactId']]
        if sf_case['Priority'] == 'High':
            case_schema.priority = 10
        elif sf_case['Priority'] == 'Medium':
            case_schema.priority = 5
        else:
            case_schema.priority = 1
        return case_schema

    @classmethod
    def import_case(cls, user, case_request):
        return Case.insert(user, case_request)

    @classmethod
    def sf_mark_as_lead(cls, access_token, url):
        print access_token
        headers = {'Authorization': 'Bearer %s' % access_token}
        r = requests.get(url, headers=headers)
        return r

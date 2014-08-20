import json
from iomodels.crmengine.accounts import Account,AccountInsertRequest
from iomodels.crmengine.contacts import Contact,ContactInsertRequest
import iomessages
"""
name = messages.StringField(1)
    account = messages.StringField(1)
    firstname = messages.StringField(2)
    lastname = messages.StringField(3)
    title = messages.StringField(4)
    access = messages.StringField(5)
    tagline = messages.StringField(6)
    introduction = messages.StringField(7)
    phones = messages.MessageField(iomessages.PhoneSchema,8, repeated = True)
    emails = messages.MessageField(iomessages.EmailSchema,9, repeated = True)
    addresses = messages.MessageField(iomessages.AddressSchema,10, repeated = True)
    infonodes = messages.MessageField(iomessages.InfoNodeRequestSchema,11, repeated = True)
    profile_img_id = messages.StringField(12)
    profile_img_url = messages.StringField(13)
    """
 
class SfImporterHelper():
	@classmethod
	def import_accounts(cls,user,http,sf_objects):
		print 'i will get the list of available accounts'
		sf_objects['Account']={}
		r,c = http.request("https://na12.salesforce.com/services/data/v29.0/query?q=SELECT+Id+from+Account")
		results = json.loads(c)
		for record in results['records']:
			print 'i want to get the details of account number' + record['Id']
			r,c = http.request("https://na12.salesforce.com/services/data/v29.0/sobjects/Account/"+record['Id'])
			sf_account = json.loads(c)
			account_request = cls.get_account_schema(sf_account)
			imported_account = cls.import_account(user,account_request)
			sf_objects['Account'][record['Id']]=imported_account.entityKey
	@classmethod
	def get_account_schema(cls,sf_account):
		account_schema = AccountInsertRequest(
    										name = sf_account['Name'],
    										account_type = sf_account['Type'],
    										industry = sf_account['Industry'],
    										access = 'public',
    										introduction = sf_account['Description'],
    										phones = [iomessages.PhoneSchema(
    																		type='work',
    																		number=sf_account['Phone']
    																		)],
    										addresses = [iomessages.AddressSchema(
    																			country=sf_account['ShippingCountry'],
    																			)]
    										)
		return account_schema
	@classmethod
	def import_account(cls,user,account_request):
		return Account.insert(user,account_request)

	@classmethod
	def import_contacts(cls,user,http,sf_objects):
		print '====='
		print sf_objects
		sf_objects['Contact']={}
		print 'i will get the list of available contacts'
		r,c = http.request("https://na12.salesforce.com/services/data/v29.0/query?q=SELECT+Id+from+Contact")
		results = json.loads(c)
		for record in results['records']:
			print 'i want to get the details of contact number' + record['Id']
			r,c = http.request("https://na12.salesforce.com/services/data/v29.0/sobjects/Contact/"+record['Id'])
			sf_contact = json.loads(c)
			contact_request = cls.get_contact_schema(sf_contact,sf_objects)
			imported_contact = cls.import_contact(user,contact_request)
			sf_objects['Contact'][record['Id']]=imported_contact.entityKey

	@classmethod
	def get_contact_schema(cls,sf_contact,sf_objects):
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
    										access = 'public',
    										introduction = sf_contact['Description'],
    										phones = phones,
    										addresses = [iomessages.AddressSchema(
    																			country=sf_contact['MailingCountry']
    																			),
    													iomessages.AddressSchema(
    																			country=sf_contact['OtherCountry']
    																			)
    													],
    										emails = [iomessages.EmailSchema(
    																		email=sf_contact['Email']
    																		)]
    										)
		if sf_contact['AccountId']:
			contact_schema.account=sf_objects['Account'][sf_contact['AccountId']]
			contact_schema.title = empty_string(sf_contact['Title'])
		return contact_schema
	@classmethod
	def import_contact(cls,user,contact_request):
		return Contact.insert(user,contact_request)
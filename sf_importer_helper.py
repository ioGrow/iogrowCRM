import json
from iomodels.crmengine.accounts import Account,AccountInsertRequest
import iomessages
"""
name = messages.StringField(1)
    account_type = messages.StringField(2)
    industry = messages.StringField(3)
    access = messages.StringField(4)
    tagline = messages.StringField(5)
    introduction = messages.StringField(6)
    phones = messages.MessageField(iomessages.PhoneSchema,7, repeated = True)
    emails = messages.MessageField(iomessages.EmailSchema,8, repeated = True)
    addresses = messages.MessageField(iomessages.AddressSchema,9, repeated = True)
    infonodes = messages.MessageField(iomessages.InfoNodeRequestSchema,10, repeated = True)
    logo_img_id = messages.StringField(11)
    logo_img_url = messages.StringField(12)
    """
 
class SfImporterHelper():
	@classmethod
	def import_accounts(cls,user,http):
		print 'i will get the list of available accounts'
		r,c = http.request("https://na12.salesforce.com/services/data/v29.0/query?q=SELECT+Id+from+Account")
		results = json.loads(c)
		for record in results['records']:
			print 'i want to get the details of account number' + record['Id']
			r,c = http.request("https://na12.salesforce.com/services/data/v29.0/sobjects/Account/"+record['Id'])
			sf_account = json.loads(c)
			account_request = cls.get_account_schema(sf_account)
			cls.import_account(user,account_request)
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
import httplib2
import pprint
import sys
from model import User 
from apiclient.discovery import build
from apiclient.errors import HttpError

from oauth2client.client import AccessTokenRefreshError
from oauth2client.client import OAuth2WebServerFlow
from oauth2client.client import flow_from_clientsecrets
from oauth2client.file import Storage
from oauth2client.tools import run


# Enter your Google Developer Project number
PROJECT_NUMBER = '987765099891'

PROJECT_ID='gcdc2013-iogrow'
DATASET_ID='data1'
TABLE_ID='usa_bearth'

FLOW = flow_from_clientsecrets('client_secrets.json',
                               scope='https://www.googleapis.com/auth/bigquery')

class BigQuery():
    bigquery_service=None
    """docstring for BigQuery"""
    @classmethod
    def init(cls):
        storage = Storage('bigquery_credentials.dat')
        user=User.get_by_email("arezki@iogrow.com")
        credentials = user.google_credentials
        if credentials is None or credentials.invalid:
            from oauth2client import tools
            # Run oauth2 flow with default arguments.
            credentials = tools.run_flow(FLOW, storage, tools.argparser.parse_args([]))
        http = httplib2.Http()
        http = credentials.authorize(http)
        cls.bigquery_service = build('bigquery', 'v2', http=http)

       
    @classmethod
    def query(cls):
        try:
            query_request = cls.bigquery_service.jobs()
            query_data = {'query':'SELECT TOP( title, 10) as title, COUNT(*) as revision_count FROM [publicdata:samples.wikipedia] WHERE wp_namespace = 0;'}

            query_response = query_request.query(projectId=PROJECT_NUMBER,
                                                 body=query_data).execute()
            print 'Query Results:'
            for row in query_response['rows']:
                result_row = []
                for field in row['f']:
                    result_row.append(field['v'])
                print ('\t').join(result_row)

        except HttpError as err:
            print 'Error:', pprint.pprint(err.content)

        except AccessTokenRefreshError:
            print ("Credentials have been revoked or expired, please re-run"
                   "the application to re-authorize")
    @classmethod
    def insert(cls):
        try:
            query_request = cls.bigquery_service.tabledata()
            query_data = {'query':'SELECT TOP( title, 10) as title, COUNT(*) as revision_count FROM [publicdata:samples.wikipedia] WHERE wp_namespace = 0;'}
            print "hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh"
            body = {"rows":[
                {"json": {"name":"lyes","pre":"arezki"}}
                ]}
            response = query_request.insertAll(
                projectId=PROJECT_ID,
                datasetId=DATASET_ID,
                tableId=TABLE_ID,
                body=body).execute()
            

        except HttpError as err:
            print 'Error:', pprint.pprint(err.content)

        except AccessTokenRefreshError:
            print ("Credentials have been revoked or expired, please re-run"
                   "the application to re-authorize")


# ioGROW
CRM for Social Selling, on Google. Integrated with LinkedIn, Twitter, Facebook & Gmail.

info | _
:-----------|------------:
 Authors | [AUTHORS.md](https://github.com/ioGrow/iogrowCRM/blob/master/AUTHORS.md) 
 Release | ---  
 License | AGPL  
 Tracker | [ioGrow/iogrow/Issues](https://github.com/ioGrow/iogrowCRM/issues)
 Mailinglist |	iogrow-public@googlegroups.com
 IRC |	#iogrow @ freenode
 Website |	[iogrow.com](http://www.iogrow.com)
 Accounts |	[@Facebook](https://www.facebook.com/iogrow) [@Twitter](https://twitter.com/iogrow) [@GooglePlus](https://plus.google.com/110820504821255547625)

## Help translate!
You can help translate this CRM to your language through Transifex Platform [here](https://www.transifex.com/iogrow-1/iogrow/).

## Hacking
### Requirements
- [Google App Engine SDK for python](https://cloud.google.com/appengine/downloads#Google_App_Engine_SDK_for_Python)
- [nodejs](https://nodejs.org/en/)
- [pip](https://github.com/pypa/pip)
- [pyinvoke](http://www.pyinvoke.org/)
- [wget](https://www.gnu.org/software/wget/)

### Tasks
 1. Install dependencies: 
    `invoke install`
 1. Build generated files:
    - DEV:
      `invoke build`

    - PROD:
      `invoke build -p`

 1. Run the app locally (localhost:8090):
   `invoke start`

 1. Deploy to GAE:
   `invoke deploy`
  
 1. Run tests
   `invoke test`
  
 1. Localization
    - Extract messages:
     `invoke babel --extract`
  
    - Compile messages:
     `invoke babel --compile`
     
## First time configuration and deployment
To deploy ioGrow to App Engine, you will need to register a project to create your project ID, which will determine the
URL for the app.         
1. In the [Cloud Platform Console](https://console.cloud.google.com/project), go to the Projects page and select or create a new project.

2. Note the project ID that you created above.
3. In [Google App Engine settings](https://console.cloud.google.com/appengine/settings), Enable default cloud storage bucket.
4. In app.yaml file, put the obtained project Id in application attribute.
5. Open [Project Credentials page](https://console.developers.google.com/apis/credentials?project=_)
6. Create both OAuth Client ID and Browser API key.
7. Specify authorized JavaScript origins in both browser API key and OAuth Client ID sections as follows:
- http://localhost:8090
- http://<YOUR_PROJECT_ID_>.appspot.com
- Any new domain where you want to call the API
8. Specify authorized redirect URIs on OAuth Client Id as follows: For each origin specified in 7 add this urls
ORIGIN/postmessage and ORIGIN/oauth2callback.
9. Enable those [APIs](https://github.com/ioGrow/iogrowCRM/wiki/Enabled-APIs)
10. Rename /crm/config/prod_sample.py to /crm/config/prod.py
11. In crm/local.py,shared.py,prod.py config files, specify your credentials obtained from Google Cloud Console.
12. In /static/src/js/config.js API_BASE_URL, BROWSER_API_KEY, CLIENT_ID
13. Run the following commands:
- `invoke install`
- `invoke build`
- To run the application on local machine: 
    - `invoke start`
- To run the application on google cloud platform: 
    - `invoke deploy`

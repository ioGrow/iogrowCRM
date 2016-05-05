# ioGROW
CRM for Social Selling, on Google. Integrated with LinkedIn, Twitter, Facebook & Gmail.

info | _
:-----------|------------:
 Authors | [AUTHORS.md](https://github.com/ioGrow/iogrow/blob/master/AUTHORS.md) 
 Release | ---  
 License | AGPL  
 Tracker | [ioGrow/iogrow/Issues](https://github.com/ioGrow/iogrow/issues)
 Mailinglist |	iogrow-public@googlegroups.com
 IRC |	#iogrow @ freenode
 Website |	[iogrow.com](http://www.iogrow.com)
 Accounts |	[@Facebook](https://www.facebook.com/iogrow) [@Twitter](https://twitter.com/iogrow) [@GooglePlus](https://plus.google.com/110820504821255547625)

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
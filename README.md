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

## Features
### Social CRM, designed to work social
ioGrow is smoothly integrated with major social networks, you just enter your contact's name and last name and we will suggest you some potential profiles from LinkedIn and Twitter related to your contact. ioGrow brings LinkedIn and Twitter profiles right to you.
Top Three ioGrow Features

### No data entry, developed to be smart
With io Grow Chrome extension, it's just one click to add a new leads from Social networks to ioGrow. No need to spend time on data entry, focus on what matters the most, **your customers**. 

### Built to speak with Google Apps
ioGrow is designed to work the way you work. Seamlessly integrated with Google apps that you already love & use, it's much easier for your team to create, collaborate, communicate and share. 


## Hacking
### Requirements
- [nodejs](https://nodejs.org/en/)
- [pip](https://github.com/pypa/pip)
- [pyinvoke](http://www.pyinvoke.org/)

### Tasks
 1. Install dependencies: 
    `invoke install`
 1. Build generated files:
    - DEV
      `invoke build`

    - PROD
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
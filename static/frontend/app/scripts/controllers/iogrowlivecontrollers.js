app.controller('LiveHeaderController', ['$scope',
    function($scope) {
      console.log('i am in ioGrow Live public page');
     $scope.hideme = true;
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
     $scope.accounts = [];
     $scope.account = {};
     $scope.account.access ='public';

     $scope.renderSignIn = function() {
          console.log('$scope.renderSignIn #start_debug');
          if (window.is_signed_in){
              console.log('I am signed-in so you can continue');
              $scope.processAuth(window.authResult);
          }else{
            console.log('I am  not signed-in so render Button');
            
            gapi.signin.render('myGsignin', {
            'callback': $scope.signIn,
            'clientid': '987765099891.apps.googleusercontent.com',
            'requestvisibleactions': 'http://schemas.google.com/AddActivity',
            'scope': 'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/calendar',
            'theme': 'dark',
            'cookiepolicy': 'single_host_origin',
            'accesstype': 'offline'
            });
            
          }
      }
      $scope.refreshToken = function() {
          gapi.auth.signIn({
            'callback': $scope.connectServer,
            'clientid': Conf.clientId,
            'requestvisibleactions': Conf.requestvisibleactions,
            'scope': Conf.scopes,
            'immediate': true,
            'cookiepolicy': Conf.cookiepolicy,
            'accesstype': 'offline'
          });
      }
     $scope.listNextPageItems = function(){
        
        
        var nextPage = $scope.currentPage + 1;
        var params = {};
          if ($scope.pages[nextPage]){
            params = {'limit':7,
                      'pageToken':$scope.pages[nextPage]
                     }
          }else{
            params = {'limit':7}
          }
          console.log('in listNextPageItems');
          $scope.currentPage = $scope.currentPage + 1 ; 
          Account.list($scope,params);
     }
     $scope.listPrevPageItems = function(){
       
       var prevPage = $scope.currentPage - 1;
       var params = {};
          if ($scope.pages[prevPage]){
            params = {'limit':7,
                      'pageToken':$scope.pages[prevPage]
                     }
          }else{
            params = {'limit':7}
          }
          $scope.currentPage = $scope.currentPage - 1 ;
          Account.list($scope,params);
     }
     $scope.signIn = function(authResult) {
        console.log('in singIn');
        console.log(authResult);
        console.log('signIn callback #start_debug');
        $scope.connectServer(authResult);
        $scope.processAuth(authResult);
        
     }
     $scope.connectServer = function(authResult) {
      console.log('connected');
      $.ajax({
        type: 'POST',
        url: '/gconnectpublic',
        
        success: function(result) {
          console.log('i am in connectServer show me result please');
          console.log(result);
          $scope.connected = true;
          $scope.userinfo = result;
          $scope.$apply();
        },
        data: {code:authResult.code}
      });
    }
     $scope.processAuth = function(authResult) {
        console.log('process Auth #startdebug');
        $scope.immediateFailed = true;
        if (authResult['access_token']) {
          // User is signed-in
          console.log('User is signed-in');
          $scope.immediateFailed = false;
          $scope.isSignedIn = true;
          window.is_signed_in = true;
          window.authResult = authResult;
          // Call the backend to get the list of accounts
          
          var params = {'limit':7}
          //Account.list($scope,params);

        } else if (authResult['error']) {
          if (authResult['error'] == 'immediate_failed') {
            
            console.log('Immediate Failed');
          } else {
            console.log('Error:' + authResult['error']);
          }
        }
     }
     $scope.renderSignIn();
     $scope.showModal = function(){
        console.log('button clicked');
        $('#addAccountModal').modal('show');

      };
      
    $scope.save = function(account){
     
      Account.insert($scope,account);
    };
    $scope.addAccountOnKey = function(account){
      if(event.keyCode == 13 && account){
          $scope.save(account);
      }
      
      
    };

     $scope.accountInserted = function(resp){
          $('#addAccountModal').modal('hide');
          window.location.replace('#/accounts/show/'+resp.id);
     };
     
     
   

    
}]);
app.controller('AccountShowCtrl', ['$scope','$filter', '$route','$location','Conf','Account','Contact','Case','Opportunity', 'Topic','Note','Task','Event','Permission','User','Attachement',
    function($scope,$filter,$route,$location,Conf,Account,Contact,Case,Opportunity,Topic,Note,Task,Event,Permission,User,Attachement) {
      console.log('i am in account Show controller');
      $("#id_Accounts").addClass("active");
      var tab = $route.current.params.accountTab;

      switch (tab)
        {
        case 'notes':
         $scope.selectedTab = 1;
          break;
        case 'about':
         $scope.selectedTab = 2;
          break;
        case 'contacts':
         $scope.selectedTab = 3;
          break;
        case 'opportunities':
         $scope.selectedTab = 4;
          break;
        case 'cases':
         $scope.selectedTab = 5;
          break;
        default:
        $scope.selectedTab = 1;

        }

     
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.contactpagination={};
     $scope.currentPage = 01;
     $scope.pages = [];
     
     $scope.accounts = [];  
     $scope.users = [];
     $scope.user = undefined;
     $scope.slected_memeber = undefined;

 
     $scope.renderSignIn = function() {
          console.log('$scope.renderSignIn #start_debug');
          if (window.is_signed_in){
              console.log('I am signed-in so you can continue');
              $scope.processAuth(window.authResult);
          }else{
            console.log('I am  not signed-in so render Button');
            gapi.signin.render('myGsignin', {
            'callback': $scope.signIn,
            'clientid': Conf.clientId,
            'requestvisibleactions': Conf.requestvisibleactions,
            'scope': Conf.scopes,
            'theme': 'dark',
            'cookiepolicy': Conf.cookiepolicy,
            'accesstype': 'offline'
            });
            console.log('sign-in button rendred');
          }
      }
     $scope.refreshToken = function() {
          gapi.auth.signIn({
            'callback': $scope.connectServer,
            'clientid': Conf.clientId,
            'requestvisibleactions': Conf.requestvisibleactions,
            'scope': Conf.scopes,
            'immediate': true,
            'cookiepolicy': Conf.cookiepolicy,
            'accesstype': 'offline'
          });
      }
      $scope.connectServer = function(authResult) {
      console.log('I will contact the serveer');
      console.log(authResult.code);
      
      $.ajax({
        type: 'POST',
        url: '/gconnect',
        
        success: function(result) {
          console.log('i am in connectServer show me result please');
          console.log(result);
         },
        data: {code:authResult.code}
      });
    }
    //HKA 06.12.2013  Manage Next & Prev Page of Topics
     $scope.listNextPageItems = function(){
        
        
        var nextPage = $scope.currentPage + 1;
        var params = {};
          if ($scope.pages[nextPage]){
            params = {'about_kind':'Account',
                      'about_item':$scope.account.id,
                      'order': '-updated_at',
                      'limit': 5,
                      'pageToken':$scope.pages[nextPage]
                     }
          }else{
            params = {'about_kind':'Account',
                      'about_item':$scope.account.id,
                      'order': '-updated_at',
                      'limit': 7}
          }
          console.log('in listNextPageItems');
          $scope.currentPage = $scope.currentPage + 1 ; 
          Topic.list($scope,params);
     }
     $scope.listPrevPageItems = function(){
       
       var prevPage = $scope.currentPage - 1;
       var params = {};
          if ($scope.pages[prevPage]){
            params = {'about_kind':'Account',
                      'about_item':$scope.account.id,
                      'order': '-updated_at',
                      'limit': 7,
                      'pageToken':$scope.pages[prevPage]
                     }
          }else{
            params = {'about_kind':'Account',
                      'about_item':$scope.account.id,
                      'order': '-updated_at',
                      'limit': 7}
          }
          $scope.currentPage = $scope.currentPage - 1 ;
          Topic.list($scope,params);
          console.log()
     }

//HKA 06.12.2013 Manage Prev & Next Page on Related List Contact
$scope.ContactlistNextPageItems = function(){
        
        
        var nextPage = $scope.currentPage + 1;
        var params = {};
          if ($scope.pages[nextPage]){
            params = {'limit':7,
                      'account':$scope.account.entityKey,
                      'pageToken':$scope.pages[nextPage]
                     }
          }else{
            params = {'limit':7,
            'account':$scope.account.entityKey}
          }
          console.log('in listNextPageItems');
          $scope.currentPage = $scope.currentPage + 1 ; 
          Contact.list($scope,params);
     }
     $scope.ContactlistPrevPageItems = function(){
       
       var prevPage = $scope.currentPage - 1;
       var params = {};
          if ($scope.pages[prevPage]){
            params = {'limit':7,
                      'account':$scope.account.entityKey,
                      'pageToken':$scope.pages[prevPage]
                     }
          }else{
            params = {'limit':7,
                      'account':$scope.account.entityKey}
          }
          $scope.currentPage = $scope.currentPage - 1 ;
          console.log('HKA Fix issues');
          console.log('');
          Contact.list($scope,params);
     }


     $scope.signIn = function(authResult) {
        console.log('signIn callback #start_debug');
        $scope.connectServer(authResult);
        $scope.processAuth(authResult);
        
     }
     $scope.listTopics = function(account){
        var params = {'about_kind':'Account',
                      'about_item':$scope.account.id,
                      'order': '-updated_at',
                      'limit': 7
                      };
        Topic.list($scope,params);

     }
     $scope.listDocuments = function(){
        var params = {'about_kind':'Account',
                      'about_item':$scope.account.id,
                      'order': '-updated_at',
                      'limit': 7
                      };
        Attachement.list($scope,params);

     }
     
     $scope.hilightTopic = function(){
        console.log('Should higll');
       $('#topic_0').effect( "bounce", "slow" );
       $('#topic_0 .message').effect("highlight","slow");
     }

     $scope.processAuth = function(authResult) {
        console.log('process Auth #startdebug');
        $scope.immediateFailed = true;
        if (authResult['access_token']) {
          // User is signed-in
          console.log('User is signed-in');
          $scope.immediateFailed = false;
          $scope.isSignedIn = true;
          window.is_signed_in = true;
          window.authResult = authResult;
          // Call the backend to get the list of accounts
          
          var accountid = {'id':$route.current.params.accountId};
          Account.get($scope,accountid);
          User.list($scope,{});

        } else if (authResult['error']) {
          if (authResult['error'] == 'immediate_failed') {
            $scope.immediateFailed = true;

            window.location.replace('/sign-in');
            console.log('Immediate Failed');
          } else {
            console.log('Error:' + authResult['error']);
          }
        }
     }
     $scope.renderSignIn();
     $scope.selectMember = function(){
        console.log('slecting user yeaaah');
        $scope.slected_memeber = $scope.user;
        $scope.user = $scope.slected_memeber.google_display_name;

     };
     $scope.showCreateDocument = function(type){
        
        $scope.mimeType = type;
        $('#newDocument').modal('show');
     };
     $scope.createDocument = function(newdocument){
        var mimeType = 'application/vnd.google-apps.' + $scope.mimeType;
        var params = {'about_kind':'Account',
                      'about_item': $scope.account.id,
                      'title':newdocument.title,
                      'mimeType':mimeType };
        Attachement.insert($scope,params);

     };
     $scope.createPickerUploader = function() {
          var projectfolder = $scope.account.folder;
          var picker = new google.picker.PickerBuilder().
              addView(new google.picker.DocsUploadView().setParent(projectfolder)).
              setCallback($scope.uploaderCallback).
              setAppId(12345).
                enableFeature(google.picker.Feature.MULTISELECT_ENABLED).
              build();
          picker.setVisible(true);
      };
      // A simple callback implementation.
      $scope.uploaderCallback = function(data) {
        

        if (data.action == google.picker.Action.PICKED) {
                var params = {'about_kind': 'Account',
                                      'about_item':$scope.account.id};
                params.items = new Array();
               
                 $.each(data.docs, function(index) {
                      console.log(data.docs);
                      /*
                      {'about_kind':'Account',
                      'about_item': $scope.account.id,
                      'title':newdocument.title,
                      'mimeType':mimeType };
                      */
                      var item = { 'id':data.docs[index].id,
                                  'title':data.docs[index].name,
                                  'mimeType': data.docs[index].mimeType,
                                  'embedLink': data.docs[index].url

                      };
                      params.items.push(item);
                
                  });
                 Attachement.attachfiles($scope,params);
                    
                    console.log('after uploading files');
                    console.log(params);
                }
      }
     $scope.share = function(slected_memeber){
        console.log('permissions.insert share');
        console.log(slected_memeber);
        $scope.$watch($scope.account.access, function() {
         var body = {'access':$scope.account.access};
         var id = $scope.account.id;
         var params ={'id':id,
                      'access':$scope.account.access}
         Account.patch($scope,params);
        });
        $('#sharingSettingsModal').modal('hide');

        if (slected_memeber.email){
        var params = {  'type': 'user',
                        'role': 'writer',
                        'value': slected_memeber.email,
                        'about_kind': 'Account',
                        'about_item': $scope.account.id

                        
          };
          Permission.insert($scope,params); 
          
          
        }else{ 
          alert('select a user to be invited');
        };


     };
     
     $scope.updateCollaborators = function(){
          var accountid = {'id':$route.current.params.accountId};
          Account.get($scope,accountid);

     };
     $scope.showModal = function(){
        console.log('button clicked');
        $('#addAccountModal').modal('show');

      };
      
    $scope.addNote = function(note){
      console.log('debug addNote');
      
      var params ={
                  'about_kind': 'Account',
                  'about_item': $scope.account.id,
                  'title': note.title,
                  'content': note.content
      };
      console.log(params);
      Note.insert($scope,params);
      $scope.note.title = '';
      $scope.note.content = '';
    };
      



    $scope.editaccount = function() {
       $('#EditAccountModal').modal('show');
    };
    //HKA 22.11.2013 Edit tagline of Account
    $scope.edittagline = function() {
       $('#EditTagModal').modal('show');
    };
    //HKA Edit Introduction on Account
    $scope.editintro = function() {
       $('#EditIntroModal').modal('show');
    };
  

    //HKA 09.11.2013 Add a new Tasks
   $scope.addTask = function(task){
      
        $('#myModal').modal('hide');
        var params ={'about_kind':'Account',
                      'about_item':$scope.account.id}

        console.log('adding a new task');
        console.log(task);
        
        if (task.due){

            var dueDate= $filter('date')(task.due,['yyyy-MM-dd']);
            dueDate = dueDate +'T00:00:00.000000'
            params ={'title': task.title,
                      'due': dueDate,
                      'about_kind':'Account',
                      'about_item':$scope.account.id
            }
            console.log(dueDate);
            
        }else{
            params ={'title': task.title,
                     'about_kind':'Account',
                     'about_item':$scope.account.id}
        };
       
        Task.insert($scope,params);
        $scope.task.title='';
        $scope.task.dueDate='0000-00-00T00:00:00-00:00';
     };

     $scope.hilightTask = function(){
        console.log('Should higll');
        $('#task_0').effect("highlight","slow");
        $('#task_0').effect( "bounce", "slow" );
       
     };
     $scope.listTasks = function(){
        var params = {'about_kind':'Account',
                      'about_item':$scope.account.id,
                      'order': '-updated_at',
                      'limit': 7
                      };
        Task.list($scope,params);

     };
//HKA 11.11.2013 Add new Event
 $scope.addEvent = function(ioevent){
      
        $('#newEventModal').modal('hide');
        var params ={}       
        
        if (ioevent.starts_at){
            if (ioevent.ends_at){
              params ={'title': ioevent.title,
                      'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'ends_at': $filter('date')(ioevent.ends_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'where': ioevent.where,
                      'about_kind':'Account',
                      'about_item':$scope.account.id
              }

            }else{
              params ={'title': ioevent.title,
                      'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'where': ioevent.where,
                      'about_kind':'Account',
                      'about_item':$scope.account.id
              }
            }
            console.log('inserting the event');
            console.log(params);
            Event.insert($scope,params);
            $scope.ioevent.title='';
            $scope.ioevent.where='';
            $scope.ioevent.starts_at='T00:00:00.000000';
          };
     };
     $scope.hilightEvent = function(){
        console.log('Should higll');
        $('#event_0').effect("highlight","slow");
        $('#event_0').effect( "bounce", "slow" );
       
     };
     $scope.listEvents = function(){
        var params = {'about_kind':'Account',
                      'about_item':$scope.account.id,
                      'order': 'starts_at',
                      'limit': 7
                      };
        Event.list($scope,params);

     };

  //HKA 18.11.2013 Show modal Related list (Contact)

  $scope.addContactModal = function(){
    $('#addContactModal').modal('show');
  };

  // HKA 18.11.2013 Show modal Related list (Opportunity)
  $scope.addOppModal = function(){
    $('#addOpportunityModal').modal('show');
  };

  //HKA 18.11.2013 Show modal Related list (Case)
  $scope.addCaseModal = function(){
    $('#addCaseModal').modal('show');
  };
  
  //HKA 22.11.2013 List of Contacts related to account
   $scope.listContacts = function(){
    var params = {'account':$scope.account.entityKey,
                   'limit':7
                      };
         Contact.list($scope,params);
   };

  //HKA 22.11.2013 List of Opportunities related to account
   $scope.listOpportunities = function(){
    var params = {'account':$scope.account.entityKey,
                   'limit':7
                      };
         Opportunity.list($scope,params);
   };

  //HKA 22.11.2013 List of Cases related to account
   $scope.listCases = function(){

    var params = {'account':$scope.account.entityKey,
                   'limit':7
                      };
         Case.list($scope,params);
         console
   };

//HKA 19.11.2013 Add Contact related to account

    $scope.savecontact = function(contact){
        var contact_name = new Array();
        contact_name.push(contact.firstname);
        contact_name.push(contact.lastname);
        
         var params = {'lastname':contact.lastname,
                      'firstname':contact.firstname,
                      'title': contact.title,
                      'account':$scope.account.entityKey,
                      'account_name': $scope.account.name,
                      'display_name': contact_name,
                      'access': $scope.account.access
                      };

        console.log(params);
        
        Contact.insert($scope,params);
        $('#addContactModal').modal('hide');
      };
  // HKA 19.11.2013 Add Opportunty related to account
    $scope.saveOpp = function(opportunity){
         
       var params = {'name':opportunity.name,
                      'description':opportunity.description,
                      'amount': opportunity.amount,
                      'stage':opportunity.stage,
                      'account':$scope.account.entityKey,
                      'account_name': $scope.account.name,
                      'access': $scope.account.access
                      };


      Opportunity.insert($scope,params);
      $('#addOpportunityModal').modal('hide');
    };

  // HKA 19.11.2013 Add Case related to account
    $scope.saveCase = function(casee){
          
        var params = {'name':casee.name,
                      'priority':casee.priority,
                      'status': casee.statuss,
                      'type_case':casee.type_case,
                      'account':$scope.account.entityKey,
                      'account_name': $scope.account.name,
                      'access': $scope.account.access
                      };
      Case.insert($scope,params);
      $('#addCaseModal').modal('hide');
    };
//HKA 19.11.2013 Add Phone
 $scope.addPhone = function(phone){
  //HKA 19.11.2013  Concatenate old phones with new phone
  var phonesArray = undefined;
  
  if ($scope.account.phones){
    phonesArray = new Array();
    phonesArray = $scope.account.phones;
    phonesArray.push(phone);
  }else{
    phonesArray = phone;
  }

  params = {'id':$scope.account.id,
            'phones':phonesArray
            };
  Account.patch($scope,params);
  $('#phonemodal').modal('hide');
  };

//HKA 20.11.2013 Add Email
$scope.addEmail = function(email){
  var emailsArray = undefined;
  
  if ($scope.account.emails){
    emailsArray = new Array();
    emailsArray = $scope.account.emails;
    emailsArray.push(email);
  }else{
    emailsArray = email;
  }

  params = {'id':$scope.account.id,
            'emails':emailsArray
            };
  Account.patch($scope,params);
  $('#emailmodal').modal('hide');
  };
  
//HKA 20.11.2013 Add Addresse
$scope.addAddress = function(address){
  var addressArray = undefined;
  if ($scope.account.addresses){
    addressArray = new Array();
    addressArray = $scope.account.addresses;
    addressArray.push(address);

  }else{ 
    addressArray = address;
  }
  params = {'id':$scope.account.id,
             'addresses':addressArray}
  Account.patch($scope,params);
  $('#addressmodal').modal('hide');
};

//HKA 22.11.2013 Add Website
$scope.addWebsite = function(website){
  var websiteArray = undefined;
  if ($scope.account.websites){
    websiteArray = new Array();
    websiteArray = $scope.account.websites;
    websiteArray.push(website);

  }else{ 
    websiteArray = website;
  }
  params = {'id':$scope.account.id,
             'websites':websiteArray}
  Account.patch($scope,params);
  $('#websitemodal').modal('hide');
};

//HKA 22.11.2013 Add Social
$scope.addSocial = function(social){
  var socialArray = undefined;
  if ($scope.account.sociallinks){
    socialArray = new Array();
    socialArray = $scope.account.sociallinks;
    socialArray.push(social);

  }else{ 
    socialArray = social;
  }
  params = {'id':$scope.account.id,
             'sociallinks':socialArray}
  Account.patch($scope,params);
  $('#socialmodal').modal('hide');
};

//HKA 22.11.2013 Add Tagline
$scope.updateTagline = function(account){
 
  params = {'id':$scope.account.id,
             'tagline':account.tagline}
  Account.patch($scope,params);
  $('#EditTagModal').modal('hide');
};

//HKA 22.11.2013 Add Introduction
$scope.updateintro = function(account){
 
  params = {'id':$scope.account.id,
             'introduction':account.introduction}
  Account.patch($scope,params);
  $('#EditIntroModal').modal('hide');
};
//HKA 22.11.2013 Add Account
$scope.updatAccountHeader = function(account){
 
  params = {'id':$scope.account.id,
             'name':account.name,
           'account_type':account.account_type,
           'industry':account.industry}
  Account.patch($scope,params);
  $('#EditAccountModal').modal('hide');
};


  
}]);
app.controller('SearchFormController', ['$scope','$route','$location','Conf','User',
    function($scope,$route,$location,Conf,User) {
     console.log('Search Form Controller');
     var params ={};
     $scope.result = undefined;
     $scope.q = undefined;
     
      $scope.$watch('searchQuery', function() {
         params['q'] = $scope.searchQuery;
         console.log('params');
         console.log(params);
         gapi.client.crmengine.search(params).execute(function(resp) {
            console.log("in search api");
            //console.log(resp);
            if (resp.items){
              $scope.results = resp.items;
              console.log($scope.results);
              $scope.$apply();
            };
            
          });
         console.log($scope.results);
      });
      $scope.selectResult = function(){
        console.log('slecting result yeaaah');
        console.log($scope.searchQuery);
        window.location.replace('#/accounts/show/'+$scope.searchQuery.id);
        //$scope.user = $scope.slected_memeber.google_display_name;

     };
     $scope.executeSearch = function(searchQuery){
      console.log('execyte ssearcg query');
      console.log(searchQuery);
      if (typeof(searchQuery)=='string'){
         window.location.replace('#/search/'+searchQuery);
      }else{
        window.location.replace('#/accounts/show/'+searchQuery.id);
      }
      $scope.searchQuery='';
     }



     
     
   

    
}]);

app.controller('SearchShowController', ['$scope','$route','$location','Conf','Search',
    function($scope,$route,$location,Conf,Search) {
     console.log('i am in account list controller');

    
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
     
     $scope.accounts = [];
     
     

     $scope.renderSignIn = function() {
          console.log('$scope.renderSignIn #start_debug');
          if (window.is_signed_in){
              console.log('I am signed-in so you can continue');
              $scope.processAuth(window.authResult);
          }else{
            console.log('I am  not signed-in so render Button');
            gapi.signin.render('myGsignin', {
            'callback': $scope.signIn,
            'clientid': Conf.clientId,
            'requestvisibleactions': Conf.requestvisibleactions,
            'scope': Conf.scopes,
            'theme': 'dark',
            'cookiepolicy': Conf.cookiepolicy,
            'accesstype': 'offline'
            });
          }
      }
     $scope.listNextPageItems = function(){
        
        
        var nextPage = $scope.currentPage + 1;
        var params = {};
          if ($scope.pages[nextPage]){
            params = {'q':$route.current.params.q,
                      'limit':7,
                      'pageToken':$scope.pages[nextPage]
                     }
          }else{
            params = {'q':$route.current.params.q,
                      'limit':7}
          }
          console.log('in listNextPageItems');
          $scope.currentPage = $scope.currentPage + 1 ; 
          Search.list($scope,params);
     }
     $scope.listPrevPageItems = function(){
       
       var prevPage = $scope.currentPage - 1;
       var params = {};
          if ($scope.pages[prevPage]){
            params = { 'q':$route.current.params.q,
                      'limit':7,

                      'pageToken':$scope.pages[prevPage]
                     }
          }else{
            params = {'q':$route.current.params.q,
                      'limit':7}
          }
          $scope.currentPage = $scope.currentPage - 1 ;
          Search.list($scope,params);
     }
     $scope.signIn = function(authResult) {
        console.log('signIn callback #start_debug');
        $scope.processAuth(authResult);
        
     }

     $scope.processAuth = function(authResult) {
        console.log('process Auth #startdebug');
        $scope.immediateFailed = true;
        if (authResult['access_token']) {
          // User is signed-in
          console.log('User is signed-in');
          $scope.immediateFailed = false;
          $scope.isSignedIn = true;
          window.is_signed_in = true;
          window.authResult = authResult;
          // Call the backend to get the list of accounts
          
          var params = {'limit':7,'q':$route.current.params.q};
          Search.list($scope,params);

        } else if (authResult['error']) {
          if (authResult['error'] == 'immediate_failed') {
            $scope.immediateFailed = true;

            window.location.replace('/sign-in');
            console.log('Immediate Failed');
          } else {
            console.log('Error:' + authResult['error']);
          }
        }
     }
     $scope.renderSignIn();
     $scope.showModal = function(){
        console.log('button clicked');
        $('#addAccountModal').modal('show');

      };
    
}]);

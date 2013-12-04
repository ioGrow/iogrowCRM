app.controller('ContactListCtrl', ['$scope','$route','$location','Conf','Account','Contact',
    function($scope,$route,$location,Conf,Account,Contact) {
      $("#id_Contacts").addClass("active");
      
      console.log('i am in contact list controller');
       $("#id_Contacts").addClass("active");
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
    	
      $scope.contacts = [];
      $scope.contact = {};
      $scope.contact.access = 'public';

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
        $scope.isLoading = true;
       var params = {};
          if ($scope.nextPageToken){
            params = {'limit':7,
                      'pageToken':$scope.nextPageToken
                     }
          }else{
            params = {'limit':7}
          }
          console.log('in listNextPageItems');
          console.log($scope);
          Contact.list($scope,params);

     }
     $scope.listPrevPageItems = function(){
       $scope.isLoading = true;
       var params = {};
          if ($scope.nextPageToken){
            params = {'limit':7,
                      'pageToken':$scope.prevPageToken
                     }
          }else{
            params = {'limit':7}
          }
          Contact.list($scope,params);
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

          var params = {'limit':7}
          Contact.list($scope,params);
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
    
      // new Contact
      $scope.showModal = function(){
        $('#addContactModal').modal('show');

      };
      
    
      $scope.save = function(contact){
        var params = {};
        var contact_name = new Array();
        contact_name.push(contact.firstname);
        contact_name.push(contact.lastname);
        contact.display_name = contact_name;
        if (typeof(contact.account)=='object'){
          contact.account_name = contact.account.name;
          contact.account = contact.account.entityKey;
          
          Contact.insert($scope,contact);

        }else if($scope.searchAccountQuery.length>0){
            // create a new account with this account name
            var params = {'name': $scope.searchAccountQuery,
                          'access': contact.access
            };
            $scope.contact = contact;
            Account.insert($scope,params);


        };

        
        $('#addContactModal').modal('hide');
      };
      $scope.addContactOnKey = function(contact){
      if(event.keyCode == 13 && contact){
          $scope.save(contact);
      }
      
      
    };
      $scope.accountInserted = function(resp){
          $scope.contact.account = resp;
          $scope.save($scope.contact);
      };
      
     var params_search_account ={};
     $scope.result = undefined;
     $scope.q = undefined;
     
      $scope.$watch('searchAccountQuery', function() {
         params_search_account['q'] = $scope.searchAccountQuery;
         gapi.client.crmengine.accounts.search(params_search_account).execute(function(resp) {
            console.log("in accouts.search api");
            console.log(params_search_account);

            console.log(resp);
            if (resp.items){
              $scope.results = resp.items;
              console.log($scope.results);
              $scope.$apply();
            };
            
          });
         console.log($scope.results);
      });
      $scope.selectAccount = function(){
        $scope.contact.account = $scope.searchAccountQuery;

     };
     


      
}]);
app.controller('ContactShowCtrl', ['$scope','$filter','$route','$location','Conf','Task','Event','Note','Topic','Contact','Opportunity','Case','Permission','User',
    function($scope,$filter,$route,$location,Conf,Task,Event,Note,Topic,Contact,Opportunity,Case,Permission,User) {
 console.log('I am in ContactShowCtrl');
      $("#id_Contacts").addClass("active");
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
     $scope.isContentLoaded = false;
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
     //HKA 11.11.2013 
     $scope.listNextPageItems = function(){
        
        
        var nextPage = $scope.currentPage + 1;
        var params = {};
          if ($scope.pages[nextPage]){
            params = {'about_kind':'Contact',
                      'about_item':$scope.contact.id,
                      'order': '-updated_at',
                      'limit': 5,
                      'pageToken':$scope.pages[nextPage]
                     }
          }else{
            params = {'about_kind':'Contact',
                      'about_item':$scope.contact.id,
                      'order': '-updated_at',
                      'limit': 5}
          }
          console.log('in listNextPageItems');
          $scope.currentPage = $scope.currentPage + 1 ; 
          Topic.list($scope,params);
     }
     $scope.listPrevPageItems = function(){
       
       var prevPage = $scope.currentPage - 1;
       var params = {};
          if ($scope.pages[prevPage]){
            params = {'about_kind':'Contact',
                      'about_item':$scope.contact.id,
                      'order': '-updated_at',
                      'limit': 5,
                      'pageToken':$scope.pages[prevPage]
                     }
          }else{
            params = {'about_kind':'Account',
                      'about_item':$scope.contact.id,
                      'order': '-updated_at',
                      'limit': 5}
          }
          $scope.currentPage = $scope.currentPage - 1 ;
          Topic.list($scope,params);
          console.log()
     }
     $scope.signIn = function(authResult) {
        console.log('signIn callback #start_debug');
        $scope.processAuth(authResult);
        
     }
     $scope.listTopics = function(contact){
        var params = {'about_kind':'Contact',
                      'about_item':$scope.contact.id,
                      'order': '-updated_at',
                      'limit': 5
                      };
        Topic.list($scope,params);

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
          // Call the backend to get the list of contact
          var contactid = {'id':$route.current.params.contactId};
          Contact.get($scope,contactid);
          User.list($scope,{});
        } else if (authResult['error']) {
          if (authResult['error'] == 'immediate_failed') {
            $scope.immediateFailed = true;

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
     $scope.updateCollaborators = function(){
          var contactid = {'id':$route.current.params.contactId};
          Contact.get($scope,contactid);

     };
      $scope.share = function(slected_memeber){
        console.log('permissions.insert share');
        console.log(slected_memeber);
        $scope.$watch($scope.contact.access, function() {
         var body = {'access':$scope.contact.access};
         var id = $scope.contact.id;
         var params ={'id':id,
                      'access':$scope.contact.access}
         Contact.patch($scope,params);
        });
        $('#sharingSettingsModal').modal('hide');

        if (slected_memeber.email){
        var params = {  'type': 'user',
                        'role': 'writer',
                        'value': slected_memeber.email,
                        'about_kind': 'Contact',
                        'about_item': $scope.contact.id

                        
          };
          Permission.insert($scope,params); 
          
          
        }else{ 
          alert('select a user to be invited');
        };


     };

  $scope.editacontact = function(contact){
    $('#EditContactModal').modal('show');
  }
  //HKA 27.11.2013 Update Contact updatecontact
  $scope.updatecontact = function(contact){
    var params={'id':$scope.contact.id,
                'firstname':contact.firstname,
                'lastname':contact.lastname,
                'title':contact.title};
        Contact.patch($scope,params);
        $('#EditContactModal').modal('hide')

  };
  //HKA 01.12.2013 Edit tagline of Account
    $scope.edittagline = function() {
       $('#EditTagModal').modal('show');
    };
    //HKA 01.12.2013 Edit Introduction on Account
    $scope.editintro = function() {
       $('#EditIntroModal').modal('show');
    };

 //HKA 09.11.2013 Add a new Task
   $scope.addTask = function(task){
      
        $('#myModal').modal('hide');
        var params ={}

        console.log('adding a new task');
        console.log(task);
        
        if (task.due){

            var dueDate= $filter('date')(task.due,['yyyy-MM-dd']);
            dueDate = dueDate +'T00:00:00.000000'
            params ={'title': task.title,
                      'due': dueDate,
                      'about_kind':'Contact',
                     'about_item':$scope.contact.id
            }
            console.log(dueDate);
        }else{
            params ={'title': task.title,
                     'about_kind':'Contact',
                     'about_item':$scope.contact.id}
        };
        Task.insert($scope,params);
        $scope.task.title='';
        $scope.task.dueDate='T00:00:00.000000';
     }

     $scope.hilightTask = function(){
        console.log('Should higll');
        $('#task_0').effect("highlight","slow");
        $('#task_0').effect( "bounce", "slow" );
       
     }
     $scope.listTasks = function(){
        var params = {'about_kind':'Contact',
                      'about_item':$scope.contact.id,
                      'order': '-updated_at',
                      'limit': 5
                      };
        Task.list($scope,params);

     }
 //HKA 10.11.2013 Add event 
 $scope.addEvent = function(ioevent){
      
        $('#newEventModal').modal('hide');
        var params ={}       
        
        if (ioevent.starts_at){
            if (ioevent.ends_at){
              params ={'title': ioevent.title,
                      'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'ends_at': $filter('date')(ioevent.ends_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'where': ioevent.where,
                      'about_kind':'Contact',
                      'about_item':$scope.contact.id
              }

            }else{
              params ={'title': ioevent.title,
                      'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'where': ioevent.where,
                      'about_kind':'Contact',
                      'about_item':$scope.contact.id
              }
            }
            console.log('inserting the event');
            console.log(params);
            Event.insert($scope,params);
            $scope.ioevent.title='';
            $scope.ioevent.starts_at='';
            $scope.ioevent.ends_at='';
            $scope.ioevent.where='';

            
        };
     }
     $scope.hilightEvent = function(){
        console.log('Should higll');
        $('#event_0').effect("highlight","slow");
        $('#event_0').effect( "bounce", "slow" );
       
     }
     $scope.listEvents = function(){
        var params = {'about_kind':'Contact',
                      'about_item':$scope.contact.id,
                      'order': 'starts_at',
                      'limit': 5
                      };
        Event.list($scope,params);

     };
  //HKA 02.12.2013 List Opportunities related to Contact
     $scope.listOpportunities = function(){
        var params = {'contact':$scope.contact.entityKey,
                      'order': '-created_at',
                      'limit': 5
                      };
        Opportunity.list($scope,params);

     };

  //HKA 02.12.2013 List Cases related to Contact
  $scope.listCases = function(){
    var params ={'contact':$scope.contact.entityKey,
                  'order':'-creationTime',
                  'limit':5};

    Case.list($scope,params)
  };
     //HKA 11.11.2013 Add Note
  $scope.addNote = function(note){
    var params = {'title':$scope.note.title,
                  'content':$scope.note.content,
                  'about_item':$scope.contact.id,
                  'about_kind':'Contact' };
    Note.insert($scope,params);
    $scope.note.title='';
    $scope.note.content='';

};
//HKA 26.11.2013 Update Case
$scope.updatContactHeader = function(contact){
 
  params = {'id':$scope.contact.id,
             'name':contact.name,
             'priority' :casee.priority,
           'status':casee.status,
           'type_case':casee.type_case};
  Case.patch($scope,params);
 $('#EditCaseModal').modal('hide');
  };


  // HKA 01.12.2013 Show modal Related list (Opportunity)
  $scope.addOppModal = function(){
    $('#addOpportunityModal').modal('show');
  };

  //HKA 01.12.2013 Show modal Related list (Case)
  $scope.addCaseModal = function(){
    $('#addCaseModal').modal('show');
  };
  // HKA 02.12.2013 Add Opportunty related to Contact
    $scope.saveOpp = function(opportunity){
      console.log('hahahahhahahahaaha');
      console.log($scope.contact.account);
       var params = {'name':opportunity.name,
                      'description':opportunity.description,
                      'amount': opportunity.amount,
                      'stage':opportunity.stage,
                      'account':$scope.contact.account,
                      'account_name':$scope.contact.account_name,
                      'contact':$scope.contact.entityKey,
                      'contact_name': $scope.contact.firstname+' '+$scope.contact.lastname,
                      'access': $scope.contact.access
                      };

      Opportunity.insert(params);
      $('#addOpportunityModal').modal('hide');
    };

  // HKA 01.12.2013 Add Case related to Contact
    $scope.saveCase = function(casee){
          
        var params = {'name':casee.name,
                      'priority':casee.priority,
                      'status': casee.statuss,
                      'type_case':casee.type_case,
                      'account':$scope.contact.account,
                      'account_name':$scope.contact.account_name,
                      'contact':$scope.contact.entityKey,
                      'contact_name': $scope.contact.firstname+' '+$scope.contact.lastname,
                      'access': $scope.contact.access
                      };
      Case.insert(params);
      $('#addCaseModal').modal('hide');
    };

  //HKA 01.12.2013 Add Phone
 $scope.addPhone = function(phone){
  //HKA 19.11.2013  Concatenate old phones with new phone
  var phonesArray = undefined;
  
  if ($scope.contact.phones){
    phonesArray = new Array();
    phonesArray = $scope.contact.phones;
    phonesArray.push(phone);
  }else{
    phonesArray = phone;
  }

  params = {'id':$scope.contact.id,
            'phones':phonesArray
            };
  Contact.patch($scope,params);
  $('#phonemodal').modal('hide');
  };

//HKA 20.11.2013 Add Email
$scope.addEmail = function(email){
  var emailsArray = undefined;
  
  if ($scope.contact.emails){
    emailsArray = new Array();
    emailsArray = $scope.contact.emails;
    emailsArray.push(email);
  }else{
    emailsArray = email;
  }

  params = {'id':$scope.contact.id,
            'emails':emailsArray
            };
  Contact.patch($scope,params);
  $('#emailmodal').modal('hide');
  };
  
//HKA 20.11.2013 Add Addresse
$scope.addAddress = function(address){
  var addressArray = undefined;
  if ($scope.contact.addresses){
    addressArray = new Array();
    addressArray = $scope.contact.addresses;
    addressArray.push(address);

  }else{ 
    addressArray = address;
  }
  params = {'id':$scope.contact.id,
             'addresses':addressArray}
  Contact.patch($scope,params);
  $('#addressmodal').modal('hide');
};

//HKA 01.12.2013 Add Website
$scope.addWebsite = function(website){
  var websiteArray = undefined;
  if ($scope.contact.websites){
    websiteArray = new Array();
    websiteArray = $scope.contact.websites;
    websiteArray.push(website);

  }else{ 
    websiteArray = website;
  }
  params = {'id':$scope.contact.id,
             'websites':websiteArray}
  Contact.patch($scope,params);
  $('#websitemodal').modal('hide');
};

//HKA 01.12.2013 Add Social
$scope.addSocial = function(social){
  var socialArray = undefined;
  if ($scope.contact.sociallinks){
    socialArray = new Array();
    socialArray = $scope.contact.sociallinks;
    socialArray.push(social);

  }else{ 
    socialArray = social;
  }
  params = {'id':$scope.contact.id,
             'sociallinks':socialArray}
  Contact.patch($scope,params);
  $('#socialmodal').modal('hide');
};

//HKA 01.12.2013 Add Tagline
$scope.updateTagline = function(contact){
 
  params = {'id':$scope.contact.id,
             'tagline':contact.tagline}
  Contact.patch($scope,params);
  $('#EditTagModal').modal('hide');
};

//HKA 01.12.2013 Add Introduction
$scope.updateintro = function(contact){
 
  params = {'id':$scope.contact.id,
             'introduction':contact.introduction}
  Contact.patch($scope,params);
  $('#EditIntroModal').modal('hide');
};


}]);
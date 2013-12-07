app.controller('LeadListCtrl', ['$scope','$route','$location','Conf','Lead',
    function($scope,$route,$location,Conf,Lead) {
      $("#id_Leads").addClass("active");
      
      console.log('i am in lead list controller');
       $("#id_Leads").addClass("active");
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.leadpagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
    	
      $scope.leads = [];
      $scope.lead = {};
      $scope.lead.access ='public';

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
          Lead.list($scope,params);
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
          Lead.list($scope,params);
     }
     $scope.signIn = function(authResult) {
        console.log('signIn callback #start_debug');
        $scope.connectServer(authResult);
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
          // Call the backend to get the list of leads
          var params = {'limit':7};
          Lead.list($scope,params);

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
    
      // new Lead
      $scope.showModal = function(){
        $('#addLeadModal').modal('show');

      };
      
    
      $scope.save = function(lead){
        Lead.insert($scope,lead);
        $('#addLeadModal').modal('hide')
      };
      $scope.addLeadOnKey = function(lead){
        if(event.keyCode == 13 && lead){
            $scope.save(lead);
        }
      };


      
}]);
app.controller('LeadShowCtrl', ['$scope','$filter','$route','$location','Conf','Task','Event','Topic','Note','Lead','Permission','User',
    function($scope,$filter,$route,$location,Conf,Task,Event,Topic,Note,Lead,Permission,User) {
 console.log('I am in LeadShowCtrl f');

      $("#id_Leads").addClass("active");
      var tab = $route.current.params.accountTab;
      switch (tab)
        {
        case 'notes':
         $scope.selectedTab = 1;
          break;
        case 'about':
         $scope.selectedTab = 2;
          break;
        case 'leads':
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
      $scope.editLead = function(){
      $('#EditLeadModal').modal('show');
     }

     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.isContentLoaded = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
     $scope.leads = [];
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
     $scope.listNextPageItems = function(){
        
        
        var nextPage = $scope.currentPage + 1;
        var params = {};
          if ($scope.pages[nextPage]){
            params = {'about_kind':'Lead',
                      'about_item':$scope.lead.id,
                      'order': '-updated_at',
                      'limit': 5,
                      'pageToken':$scope.pages[nextPage]
                     }
          }else{
            params = {'about_kind':'Lead',
                      'about_item':$scope.lead.id,
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
            params = {'about_kind':'Lead',
                      'about_item':$scope.lead.id,
                      'order': '-updated_at',
                      'limit': 5,
                      'pageToken':$scope.pages[prevPage]
                     }
          }else{
            params = {'about_kind':'Lead',
                      'about_item':$scope.lead.id,
                      'order': '-updated_at',
                      'limit': 5}
          }
          $scope.currentPage = $scope.currentPage - 1 ;
          Topic.list($scope,params);
          console.log()
     }
     $scope.signIn = function(authResult) {
        console.log('signIn callback #start_debug');
        $scope.connectServer(authResult);
        $scope.processAuth(authResult);
        
     }
     $scope.listTopics = function(lead){
        var params = {'about_kind':'Lead',
                      'about_item':$scope.lead.id,
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
          // Call the backend to get the list of lead
          var leadid = {'id':$route.current.params.leadId};
          Lead.get($scope,leadid);
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
     $scope.share = function(slected_memeber){
        console.log('permissions.insert share');
        console.log(slected_memeber);
        $scope.$watch($scope.lead.access, function() {
         var body = {'access':$scope.lead.access};
         var id = $scope.account.id;
         var params ={'id':id,
                      'access':$scope.lead.access}
         Lead.patch($scope,params);
        });
        $('#sharingSettingsModal').modal('hide');

        if (slected_memeber.email){
        var params = {  'type': 'user',
                        'role': 'writer',
                        'value': slected_memeber.email,
                        'about_kind': 'Lead',
                        'about_item': $scope.lead.id

                        
          };
          Permission.insert($scope,params); 
          
          
        }else{ 
          alert('select a user to be invited');
        };


     };

     
     $scope.updateCollaborators = function(){
          
          Lead.get($scope,$scope.lead.id);

     };
     //$('#addLeadModal').modal('show');
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
                      'about_kind':'Lead',
                     'about_item':$scope.lead.id
            }
            console.log(dueDate);
        }else{
            params ={'title': task.title,
                     'about_kind':'Lead',
                     'about_item':$scope.lead.id}
        };
        Task.insert($scope,params);
     }

     $scope.hilightTask = function(){
        console.log('Should higll');
        $('#task_0').effect("highlight","slow");
        $('#task_0').effect( "bounce", "slow" );
       
     }
     $scope.listTasks = function(){
        var params = {'about_kind':'Lead',
                      'about_item':$scope.lead.id,
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
                      'about_kind':'Lead',
                      'about_item':$scope.lead.id
              }

            }else{
              params ={'title': ioevent.title,
                      'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'where': ioevent.where,
                      'about_kind':'Lead',
                      'about_item':$scope.lead.id
              }
            }
            console.log('inserting the event');
            console.log(params);
            Event.insert($scope,params);

            
        };
     }
     $scope.hilightEvent = function(){
        console.log('Should higll');
        $('#event_0').effect("highlight","slow");
        $('#event_0').effect( "bounce", "slow" );
       
     }
     $scope.listEvents = function(){
        var params = {'about_kind':'Lead',
                      'about_item':$scope.lead.id,
                      'order': 'starts_at',
                      'limit': 5
                      };
        Event.list($scope,params);

     }
  //HKA 11.11.2013 Add Note
  $scope.addNote = function(note){
    var params = {'title':$scope.note.title,
                  'content':$scope.note.content,
                  'about_item':$scope.lead.id,
                  'about_kind':'Lead' };
    Note.insert($scope,params);
    $scope.note.title='';
    $scope.note.content='';
  };
//HKA 27.11.2013 Update Lead
  $scope.updatelead = function(lead){
    var params={'id':$scope.lead.id,
                'firstname':lead.firstname,
                'lastname':lead.lastname,
                'company':lead.company};
        Lead.patch($scope,params);
        $('#EditLeadModal').modal('hide')

  };

   
//HKA 01.12.2013 Add Phone
 $scope.addPhone = function(phone){
  //HKA 01.12.2013  Concatenate old phones with new phone
  var phonesArray = undefined;
  
  if ($scope.lead.phones){
    phonesArray = new Array();
    phonesArray = $scope.lead.phones;
    phonesArray.push(phone);
  }else{
    phonesArray = phone;
  }

  params = {'id':$scope.lead.id,
            'phones':phonesArray
            };
  Lead.patch($scope,params);
  $('#phonemodal').modal('hide');
  };

//HKA 01.12.2013 Add Email
$scope.addEmail = function(email){
  var emailsArray = undefined;
  
  if ($scope.lead.emails){
    emailsArray = new Array();
    emailsArray = $scope.lead.emails;
    emailsArray.push(email);
  }else{
    emailsArray = email;
  }

  params = {'id':$scope.lead.id,
            'emails':emailsArray
            };
  Lead.patch($scope,params);
  $('#emailmodal').modal('hide');

  };
  
//HKA 01.12.2013 Add Addresse
$scope.addAddress = function(address){
  var addressArray = undefined;
  if ($scope.lead.addresses){
    addressArray = new Array();
    addressArray = $scope.lead.addresses;
    addressArray.push(address);

  }else{ 
    addressArray = address;
  }
  params = {'id':$scope.lead.id,
             'addresses':addressArray}
  Lead.patch($scope,params);
  $('#addressmodal').modal('hide');
};

//HKA 01.12.2013 Add Website
$scope.addWebsite = function(website){
  var websiteArray = undefined;
  if ($scope.lead.websites){
    websiteArray = new Array();
    websiteArray = $scope.lead.websites;
    websiteArray.push(website);

  }else{ 
    websiteArray = website;
  }
  params = {'id':$scope.lead.id,
             'websites':websiteArray}
  Lead.patch($scope,params);
  $('#websitemodal').modal('hide');
};

//HKA 01.12.2013 Add Social
$scope.addSocial = function(social){
  var socialArray = undefined;
  if ($scope.lead.sociallinks){
    socialArray = new Array();
    socialArray = $scope.lead.sociallinks;
    socialArray.push(social);

  }else{ 
    socialArray = social;
  }
  params = {'id':$scope.lead.id,
             'sociallinks':socialArray}
  Lead.patch($scope,params);
  $('#socialmodal').modal('hide');
};

//HKA 22.11.2013 Edit tagline of Account
$scope.edittagline = function() {
       $('#EditTagModal').modal('show');
    };
    //HKA Edit Introduction on Account
$scope.editintro = function() {
       $('#EditIntroModal').modal('show');
    };

//HKA 22.11.2013 Add Tagline
$scope.updateTagline = function(lead){
 
  params = {'id':$scope.lead.id,
             'tagline':lead.tagline}
  Lead.patch($scope,params);
  $('#EditTagModal').modal('hide');
};

//HKA 22.11.2013 Add Introduction
$scope.updateintro = function(lead){
 
  params = {'id':$scope.lead.id,
             'introduction':lead.introduction}
  Lead.patch($scope,params);
  $('#EditIntroModal').modal('hide');
};
  

     
      



}]);

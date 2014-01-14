app.controller('AccountListCtrl', ['$scope','Auth','Account',
    function($scope,Auth,Account) {
     $("#id_Accounts").addClass("active");
     document.title = "Accounts: Home";
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
     $scope.order = '-updated_at';
     $scope.account.account_type = 'Customer'
     
     // What to do after authentication
     $scope.runTheProcess = function(){
          var params = { 'order': $scope.order,
                        'limit':7}
          Account.list($scope,params);
     };
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
          Auth.refreshToken();
     };
     // Next and Prev pagination
     $scope.listNextPageItems = function(){
        var nextPage = $scope.currentPage + 1;
        var params = {};
          if ($scope.pages[nextPage]){
            params = {'limit':7,
                      'order' : $scope.order,
                      'pageToken':$scope.pages[nextPage]
            }
          }else{
            params = {'order' : $scope.order,'limit':7}
          }
          $scope.currentPage = $scope.currentPage + 1 ; 
          Account.list($scope,params);
     };
     $scope.listPrevPageItems = function(){
       var prevPage = $scope.currentPage - 1;
       var params = {};
          if ($scope.pages[prevPage]){
            params = {'limit':7,
                      'order' : $scope.order,
                      'pageToken':$scope.pages[prevPage]
            }
          }else{
            params = {'order' : $scope.order,'limit':7}
          }
          $scope.currentPage = $scope.currentPage - 1 ;
          Account.list($scope,params);
     };
     // Add a new account methods
     // Show the modal 
     $scope.showModal = function(){
        $('#addAccountModal').modal('show');
     };
     // Insert the account if enter button is pressed
     $scope.addAccountOnKey = function(account){
        if(event.keyCode == 13 && account){
            $scope.save(account);
        };
     };
     // inserting the account  
     $scope.save = function(account){
          if (account.name) {
      	     Account.insert($scope,account);
           };
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
     // Quick Filtering
     var searchParams ={};
     $scope.result = undefined;
     $scope.q = undefined;
     
     $scope.$watch('searchQuery', function() {
         searchParams['q'] = $scope.searchQuery;
         Account.search($scope,searchParams);
     });
     $scope.selectResult = function(){
          window.location.replace('#/accounts/show/'+$scope.searchQuery.id);
     };
     $scope.executeSearch = function(searchQuery){
        if (typeof(searchQuery)=='string'){
           var goToSearch = 'type:Account ' + searchQuery;
           window.location.replace('#/search/'+goToSearch);
        }else{
          window.location.replace('#/accounts/show/'+searchQuery.id);
        }
        $scope.searchQuery=' ';
        $scope.$apply();
     };
     // Sorting
     $scope.orderBy = function(order){
        var params = { 'order': order,
                        'limit':7};
        $scope.order = order;
        Account.list($scope,params);
     };
     $scope.filterByOwner = function(filter){
        if (filter){
          var params = { 'owner': filter,
                         'order': $scope.order, 
                         'limit':7}
        }
        else{
          var params = {
              'order': $scope.order, 
              
              'limit':7}
        };
        console.log('Filtering by');
        console.log(params);
        Account.list($scope,params);
     };

     // Google+ Authentication 
     Auth.init($scope);

}]);
app.controller('AccountShowCtrl', ['$scope','$filter', '$route','Auth','Account','Contact','Case','Opportunity', 'Topic','Note','Task','Event','Permission','User','Attachement','Email','Need','Opportunitystage','Casestatus','Map',
    function($scope,$filter,$route,Auth,Account,Contact,Case,Opportunity,Topic,Note,Task,Event,Permission,User,Attachement,Email,Need,Opportunitystage,Casestatus,Map) {
       $("#id_Accounts").addClass("active");
          
       $scope.selectedTab = 1;
       $scope.isSignedIn = false;
       $scope.immediateFailed = false;
       $scope.nextPageToken = undefined;
       $scope.prevPageToken = undefined;
       $scope.isLoading = false;
       $scope.pagination = {};
       $scope.currentPage = 01;
       //HKA 10.12.2013 Var topic to manage Next & Prev
       $scope.topicCurrentPage=01;
       $scope.topicpagination={};
       $scope.topicpages = [];
       //HKA 10.12.2013 Var Contact to manage Next & Prev
       $scope.contactpagination={};
       $scope.contactCurrentPage=01;
       $scope.contactpages = [];
       //HKA 11.12.2013 var Opportunity to manage Next & Prev
       $scope.opppagination = {};
       $scope.oppCurrentPage=01;
       $scope.opppages=[];
       //HKA 11.12.2013 var Case to manage Next & Prev
       $scope.casepagination = {};
       $scope.caseCurrentPage=01;
       $scope.casepages=[];
       $scope.needspagination = {};
       $scope.needsCurrentPage=01;
       $scope.needspages=[];
       $scope.pages = [];
       $scope.accounts = [];  
       $scope.users = [];
       $scope.user = undefined;
       $scope.slected_memeber = undefined;
       $scope.email = {};
       $scope.stage_selected={};
       $scope.status_selected={};

       // What to do after authentication
       $scope.runTheProcess = function(){
          var accountid = {'id':$route.current.params.accountId};
          Account.get($scope,accountid);
          User.list($scope,{});
          Opportunitystage.list($scope,{});
          Casestatus.list($scope,{});
         

       };
       // We need to call this to refresh token when user credentials are invalid
       $scope.refreshToken = function() {
            Auth.refreshToken();
       };
    //HKA 06.12.2013  Manage Next & Prev Page of Topics
     $scope.TopiclistNextPageItems = function(){
        
        
        var nextPage = $scope.topicCurrentPage + 1;
        var params = {};
          if ($scope.topicpages[nextPage]){

            params = {'about_kind':'Account',
                      'about_item':$scope.account.id,
                      'order': '-updated_at',
                      'limit': 5,
                      'pageToken':$scope.topicpages[nextPage]
                     }
          }else{
            params = {'about_kind':'Account',
                      'about_item':$scope.account.id,
                      'order': '-updated_at',
                      'limit':5}
          }
          console.log('in listNextPageItems');
          $scope.topicCurrentPage = $scope.topicCurrentPage + 1 ; 
          Topic.list($scope,params);
     }
     $scope.TopiclistPrevPageItems = function(){
       
       var prevPage = $scope.topicCurrentPage - 1;
       var params = {};
       console.log('i am here now');
          if ($scope.topicpages[prevPage]){
            params = {'about_kind':'Account',
                      'about_item':$scope.account.id,
                      'order': '-updated_at',
                      'limit': 5,
                      'pageToken':$scope.topicpages[prevPage]
                     }
          }else{
            params = {'about_kind':'Account',
                      'about_item':$scope.account.id,
                      'order': '-updated_at',
                      'limit': 5}
          }
          $scope.topicCurrentPage = $scope.topicCurrentPage - 1 ;
          Topic.list($scope,params);
          
     }

//HKA 06.12.2013 Manage Prev & Next Page on Related List Contact
$scope.ContactlistNextPageItems = function(){

                
        var nextPage = $scope.contactCurrentPage + 1;
        var params = {};
          if ($scope.contactpages[nextPage]){
            params = {'limit':5,
                      'account':$scope.account.entityKey,
                      'pageToken':$scope.contactpages[nextPage]
                     }
          }else{
            params = {'limit':5,
            'account':$scope.account.entityKey}
          }
          console.log('in listNextPageItems');
          $scope.contactCurrentPage = $scope.contactCurrentPage + 1 ; 
          Contact.list($scope,params);
     }
     $scope.ContactlistPrevPageItems = function(){
       
       var prevPage = $scope.contactCurrentPage - 1;
       var params = {};
          if ($scope.contactpages[prevPage]){
            params = {'limit':5,
                      'account':$scope.account.entityKey,
                      'pageToken':$scope.contactpages[prevPage]
                     }
          }else{
            params = {'limit':5,
                      'account':$scope.account.entityKey}
          }
          $scope.contactCurrentPage = $scope.contactCurrentPage - 1 ;
            Contact.list($scope,params);
     }
//HKA 07.12.2013 Manage Prev & Next Page on Related List Opportunities
$scope.OpplistNextPageItems = function(){
        
    
        var nextPage = $scope.oppCurrentPage + 1;
        var params = {};
          if ($scope.opppages[nextPage]){
            params = {'limit':5,
                      'account':$scope.account.entityKey,
                      'pageToken':$scope.opppages[nextPage]
                     }
          }else{
            params = {'limit':5,
            'account':$scope.account.entityKey}
          }
          console.log('in listNextPageItems');
          $scope.oppCurrentPage = $scope.oppCurrentPage + 1 ; 
          Opportunity.list($scope,params);
     }
     $scope.OppPrevPageItems = function(){
       
       var prevPage = $scope.oppCurrentPage - 1;
       var params = {};
          if ($scope.opppages[prevPage]){
            params = {'limit':5,
                      'account':$scope.account.entityKey,
                      'pageToken':$scope.opppages[prevPage]
                     }
          }else{
            params = {'limit':5,
                      'account':$scope.account.entityKey}
          }
          $scope.oppCurrentPage = $scope.oppCurrentPage - 1 ;
            Opportunity.list($scope,params);
     };

     //HKA 07.12.2013 Manage Prev & Next Page on Related List Cases
$scope.CaselistNextPageItems = function(){
        
 
        var nextPage = $scope.caseCurrentPage + 1;
        var params = {};
          if ($scope.casepages[nextPage]){
            params = {'limit':5,
                      'account':$scope.account.entityKey,
                      'pageToken':$scope.casepages[nextPage]
                     }
          }else{
            params = {'limit':5,
            'account':$scope.account.entityKey}
          }
          console.log('in listNextPageItems');
          $scope.caseCurrentPage = $scope.caseCurrentPage + 1 ; 
          Case.list($scope,params);
     }
     $scope.CasePrevPageItems = function(){
            
       var prevPage = $scope.caseCurrentPage - 1;
       var params = {};
          if ($scope.casepages[prevPage]){
            params = {'limit':5,
                      'account':$scope.account.entityKey,
                      'pageToken':$scope.casepages[prevPage]
                     }
          }else{
            params = {'limit':5,
                      'account':$scope.account.entityKey}
          }
          $scope.caseCurrentPage = $scope.caseCurrentPage - 1 ;
            Case.list($scope,params);
     };
     $scope.NeedlistNextPageItems = function(){
        
 
        var nextPage = $scope.needsCurrentPage + 1;
        var params = {};
          if ($scope.needspages[nextPage]){
            params = {'limit':5,
                      'about_kind':'Account',
                      'about_item': $scope.account.id,
                      'pageToken':$scope.needspages[nextPage]
                     }
          }else{
            params = {'limit':5,
                      'about_kind':'Account',
                      'about_item': $scope.account.id}
          }
          console.log('in listNextPageItems');
          $scope.needsCurrentPage = $scope.needsCurrentPage + 1 ; 
          Need.list($scope,params);
     }
     $scope.NeedPrevPageItems = function(){
            
       var prevPage = $scope.needsCurrentPage - 1;
       var params = {};
          if ($scope.needspages[prevPage]){
            params = {'limit':5,
                      'about_kind':'Account',
                      'about_item': $scope.account.id,
                      'pageToken':$scope.needspages[prevPage]
                     }
          }else{
            params = {'limit':5,
                      'about_kind':'Account',
                      'about_item': $scope.account.id}
          }
          $scope.needsCurrentPage = $scope.needsCurrentPage - 1 ;
            Need.list($scope,params);
     };

     
     $scope.listTopics = function(account){
        var params = {'about_kind':'Account',
                      'about_item':$scope.account.id,
                      'order': '-updated_at',
                      'limit': 5
                      };
        Topic.list($scope,params);

     }
     $scope.listDocuments = function(){
        var params = {'about_kind':'Account',
                      'about_item':$scope.account.id,
                      'order': '-updated_at',
                      'limit': 5
                      };
        Attachement.list($scope,params);

     }
     
     $scope.hilightTopic = function(){
        console.log('Should higll');
       $('#topic_0').effect( "bounce", "slow" );
       $('#topic_0 .message').effect("highlight","slow");
     }

     
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
          var docsView = new google.picker.DocsView()
              .setIncludeFolders(true) 
              .setSelectFolderEnabled(true);
          var picker = new google.picker.PickerBuilder().
              addView(new google.picker.DocsUploadView().setParent(projectfolder)).
              addView(docsView).
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
                      'limit': 5
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
                      'limit': 5
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
  $scope.addNeedModal = function(){
    $('#addNeedModal').modal('show');
  };
  
  //HKA 22.11.2013 List of Contacts related to account
   $scope.listContacts = function(){
    var params = {'account':$scope.account.entityKey,
                   'limit':5
                      };
         Contact.list($scope,params);
   };

  //HKA 22.11.2013 List of Opportunities related to account
   $scope.listOpportunities = function(){
    var params = {'account':$scope.account.entityKey,
                   'limit':5
                      };
         Opportunity.list($scope,params);
   };

  //HKA 22.11.2013 List of Cases related to account
   $scope.listCases = function(){

    var params = {'account':$scope.account.entityKey,
                   'limit':5
                      };
         Case.list($scope,params);
        
   };
   $scope.listNeeds = function(){

    var params = {'about_kind':'Account',
                  'about_item': $scope.account.id,
                   'limit':5
                      };
         Need.list($scope,params);
        
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
                      'account':$scope.account.entityKey,
                      'account_name': $scope.account.name,
                      'stagename' :$scope.stage_selected.name,
                      'stage_probability':$scope.stage_selected.probability,
                      'access': $scope.account.access
                      };


      Opportunity.insert($scope,params);
      $('#addOpportunityModal').modal('hide');
    };

  // HKA 19.11.2013 Add Case related to account
    $scope.saveCase = function(casee){
          console.log($scope.status_selected.status);
        var params = {'name':casee.name,
                      'priority':casee.priority,
                      'status': $scope.status_selected.status,
                      'type_case':casee.type_case,
                      'account':$scope.account.entityKey,
                      'account_name': $scope.account.name,
                      'access': $scope.account.access
                      };
      Case.insert($scope,params);
      $('#addCaseModal').modal('hide');
    };
    $scope.saveNeed = function(need){
          
        var params = {'name':need.name,
                      'description': need.description,
                      'priority':need.priority,
                      'status': need.status,
                      'folder': $scope.account.folder,
                      'about_kind':'Account',
                      'about_item': $scope.account.id,
                      'about_name': $scope.account.name,
                      'access': $scope.account.access
                      };
     
      Need.insert($scope,params);
     
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
  $scope.phone={};
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
  $scope.email={};
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
  $scope.website={};
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
  $scope.social={};
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

    $('#some-textarea').wysihtml5();
      
      $scope.sendEmail = function(email){
        email.body = $('#some-textarea').val();
        
        var params = {
                  'to': email.to,
                  'cc': email.cc,
                  'bcc': email.bcc,
                  'subject': email.subject,
                  'body': email.body,

                  'about_item':$scope.account.id,
                  'about_kind':'Account' };
        
        Email.send($scope,params);
      };


$scope.editbeforedelete = function(){
     $('#BeforedeleteAccount').modal('show');
   };
$scope.deleteaccount = function(){
     var accountid = {'id':$route.current.params.accountId};
     Account.delete($scope,accountid);
     $('#BeforedeleteAccount').modal('hide');
     };

      $scope.renderMaps = function(){
       
          $scope.addresses = $scope.account.addresses;
          Map.render($scope);
      };
      $scope.addAddress = function(address){
        var addressArray = undefined;
        if ($scope.account.addresses){
          addressArray = new Array();
          addressArray = $scope.account.addresses;
          addressArray.push(address);

        }else{ 
          addressArray = address;
        }
        Map.searchLocation($scope,address);

        $('#addressmodal').modal('hide');
        $scope.address={};
      };
      $scope.locationUpdated = function(addressArray){

          var params = {'id':$scope.account.id,
                         'addresses':addressArray};
          console.log(params);
          Account.patch($scope,params);
      };
      $scope.addGeo = function(addressArray){
          params = {'id':$scope.account.id,
             'addresses':addressArray}
          Account.patch($scope,params);
      };
  //HKA 08.01.2014 
  $scope.About_render = function(accid){
   console.log('we are on About Render');
    var acc = Account.get($scope,accountid);

          $scope.addresses = acc.addresses;
          Map.render($scope);
      };

     // Google+ Authentication 
     Auth.init($scope);
  
}]);

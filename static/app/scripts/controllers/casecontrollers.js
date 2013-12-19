app.controller('CaseListCtrl', ['$scope','Auth','Case','Account',
    function($scope,Auth,Case,Account) {
    

     $("#id_Cases").addClass("active");
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.casepagination={};
     $scope.currentPage = 01;
     $scope.pages = [];
     //HKA 11.12.2013 Manage Next & Prev
     $scope.casepagination = {};
     $scope.caseCurrentPage=01;
     $scope.casepages=[];

     $scope.cases = [];
     $scope.casee = {};
     $scope.casee.access ='public';
     $scope.casee.status = 'pending';
     
      // What to do after authentication
       $scope.runTheProcess = function(){
            var params = {'limit':7}
            Case.list($scope,params);
       };
        // We need to call this to refresh token when user credentials are invalid
       $scope.refreshToken = function() {
            Auth.refreshToken();
       };
     
     $scope.listNextPageItems = function(){
                    
        var nextPage = $scope.caseCurrentPage + 1;
        var params = {};
          if ($scope.casepages[nextPage]){
            params = {'limit':7,
                      'pageToken':$scope.casepages[nextPage]
                     }
          }else{
            params = {'limit':7}
          }
          console.log('in listNextPageItems');
          $scope.caseCurrentPage = $scope.caseCurrentPage + 1 ; 
          Case.list($scope,params);
     }
     $scope.listPrevPageItems = function(){
                
       var prevPage = $scope.caseCurrentPage - 1;
       var params = {};
          if ($scope.casepages[prevPage]){
            params = {'limit':7,
                      'pageToken':$scope.casepages[prevPage]
                     }
          }else{
            params = {'limit':7}
          }
          $scope.caseCurrentPage = $scope.caseCurrentPage - 1 ;
          Case.list($scope,params);
     }
     
     
     
     $scope.showModal = function(){
        console.log('button clicked');
        $('#addCaseModal').modal('show');

      };
      
    
    $scope.save = function(casee){
        
        
        
        if (typeof(casee.account)=='object'){
          casee.account = casee.account.entityKey;
          casee.account_name = casee.account.name;
          if (typeof(casee.contact)=='object'){
              casee.contact = casee.contact.entityKey;
              casee.contact_name = casee.contact.firstname + ' '+ casee.contact.lastname ;
          }
          Case.insert($scope,casee);

        }else if($scope.searchAccountQuery.length>0){
            // create a new account with this account name
            var params = {'name': $scope.searchAccountQuery,
                          'access': casee.access
            };
            $scope.casee = casee;
            Account.insert($scope,params);


        };

        
        $('#addCaseModal').modal('hide');
      };
      $scope.addCaseOnKey = function(casee){
        if(event.keyCode == 13 && casee.name){
            $scope.save(casee);
        }
      };
      $scope.accountInserted = function(resp){
          $scope.casee.account = resp;
          $scope.save($scope.casee);
      };
      
     var params_search_account ={};
     $scope.contactResult = undefined;
     $scope.accountResult = undefined;
     $scope.q = undefined;
     
      $scope.$watch('searchAccountQuery', function() {
        if ($scope.searchAccountQuery.length>1){
         params_search_account['q'] = $scope.searchAccountQuery;
         gapi.client.crmengine.accounts.search(params_search_account).execute(function(resp) {
            console.log("in accouts.search api");
            console.log(params_search_account);

            console.log(resp);
            if (resp.items){
              $scope.accountsResults = resp.items;
              
              $scope.$apply();
            };
            
          });
         }
      });
      $scope.selectAccount = function(){
        $scope.casee.account = $scope.searchAccountQuery;

     };
     var params_search_contact ={};
     $scope.$watch('searchContactQuery', function() {
        if($scope.searchContactQuery.length>1){
         params_search_contact['q'] = $scope.searchContactQuery;
         gapi.client.crmengine.contacts.search(params_search_contact).execute(function(resp) {
            
            if (resp.items){
              $scope.contactsResults = resp.items;
              
              $scope.$apply();
            };
            
          });
         }
        
      });
     $scope.selectContact = function(){
        $scope.casee.contact = $scope.searchContactQuery;
        var account = {'entityKey':$scope.searchContactQuery.account,
                      'name':$scope.searchContactQuery.account_name};
        $scope.casee.account = account;
        $scope.searchAccountQuery = $scope.searchContactQuery.account_name;
      };
     
     
   // Google+ Authentication 
     Auth.init($scope);

    
}]);
app.controller('CaseShowCtrl', ['$scope','$filter', '$route','Auth','Case', 'Topic','Note','Task','Event','Permission','User','Casestatus',
    function($scope,$filter,$route,Auth,Case,Topic,Note,Task,Event,Permission,User,Casestatus) {
      console.log('i am in account list controller');
      $("#id_Cases").addClass("active");
      
     
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
      //HKA 10.12.2013 Var topic to manage Next & Prev
     $scope.topicCurrentPage=01;
     $scope.topicpagination={};
     $scope.topicpages = [];
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.status_selected={};
     $scope.currentPage = 01;
     $scope.pages = [];
     $scope.cases = [];
     $scope.users = [];
     $scope.user = undefined;
     $scope.slected_memeber = undefined;
     
   
     // What to do after authentication
       $scope.runTheProcess = function(){
          var caseid = {'id':$route.current.params.caseId};
          Case.get($scope,caseid);
          User.list($scope,{});
          Casestatus.list($scope,{});
       };
        // We need to call this to refresh token when user credentials are invalid
       $scope.refreshToken = function() {
            Auth.refreshToken();
       };
     $scope.TopiclistNextPageItems = function(){
         
        
        var nextPage = $scope.topicCurrentPage + 1;
        var params = {};
          if ($scope.topicpages[nextPage]){
            params = {'about_kind':'Case',
                      'about_item':$scope.casee.id,
                      'order': '-updated_at',
                      'limit': 5,
                      'pageToken':$scope.topicpages[nextPage]
                     }
          }else{
            params = {'about_kind':'Case',
                      'about_item':$scope.casee.id,
                      'order': '-updated_at',
                      'limit': 5}
          }
          console.log('in listNextPageItems');
          $scope.topicCurrentPage = $scope.topicCurrentPage + 1 ; 
          Topic.list($scope,params);
     }
     $scope.TopiclistPrevPageItems = function(){
       
       var prevPage = $scope.topicCurrentPage - 1;
       var params = {};
          if ($scope.topicpages[prevPage]){
            params = {'about_kind':'Case',
                      'about_item':$scope.casee.id,
                      'order': '-updated_at',
                      'limit': 5,
                      'pageToken':$scope.topicpages[prevPage]
                     }
          }else{
            params = {'about_kind':'Case',
                      'about_item':$scope.casee.id,
                      'order': '-updated_at',
                      'limit': 5}
          }
          $scope.topicCurrentPage = $scope.topicCurrentPage - 1 ;
          Topic.list($scope,params);
          
     }
    
     $scope.listTopics = function(casee){
        var params = {'about_kind':'Case',
                      'about_item':$scope.casee.id,
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

    
     $scope.selectMember = function(){
        console.log('slecting user yeaaah');
        $scope.slected_memeber = $scope.user;
        $scope.user = $scope.slected_memeber.google_display_name;

     };
     $scope.share = function(slected_memeber){
        console.log('permissions.insert share');
        console.log(slected_memeber);
        $scope.$watch($scope.casee.access, function() {
         var body = {'access':$scope.casee.access};
         var id = $scope.account.id;
         var params ={'id':id,
                      'access':$scope.casee.access};
          console.log('patching');
          console.log(params);
         Case.patch($scope,params);
        });
        $('#sharingSettingsModal').modal('hide');

        if (slected_memeber.email){
        var params = {  'type': 'user',
                        'role': 'writer',
                        'value': slected_memeber.email,
                        'about_kind': 'Case',
                        'about_item': $scope.account.id

                        
          };
          Permission.insert($scope,params); 
          
          
        }else{ 
          alert('select a user to be invited');
        };


     };
     
     $scope.updateCollaborators = function(){
         
          Case.get($scope,$scope.case.id);

     };
     $scope.showModal = function(){
        console.log('button clicked');
        $('#addCaseModal').modal('show');

      };
      
    $scope.addNote = function(note){
      console.log('debug addNote');
      
      var params ={
                  'about_kind': 'Case',
                  'about_item': $scope.casee.id,
                  'title': note.title,
                  'content': note.content
      };
      console.log(params);
      Note.insert($scope,params);
      $scope.note.title = '';
      $scope.note.content = '';
    };
      



    $scope.editcase = function() {
       $('#EditCaseModal').modal('show');
    }
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
                      'about_kind':'Case',
                     'about_item':$scope.casee.id
            }
            console.log(dueDate);
        }else{
            params ={'title': task.title,
                     'about_kind':'Case',
                     'about_item':$scope.casee.id}
        };
        Task.insert($scope,params);
     }

     $scope.hilightTask = function(){
        console.log('Should higll');
        $('#task_0').effect("highlight","slow");
        $('#task_0').effect( "bounce", "slow" );
       
     }
     $scope.listTasks = function(){
        var params = {'about_kind':'Case',
                      'about_item':$scope.casee.id,
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
                      'about_kind':'Case',
                      'about_item':$scope.casee.id
              }

            }else{
              params ={'title': ioevent.title,
                      'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'where': ioevent.where,
                      'about_kind':'Case',
                      'about_item':$scope.casee.id
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
        var params = {'about_kind':'Case',
                      'about_item':$scope.casee.id,
                      'order': 'starts_at',
                      'limit': 5
                      };
        Event.list($scope,params);

     }
  //HKA 11.11.2013 Add Note
  $scope.addNote = function(note){
    var params = {'title':$scope.note.title,
                  'content':$scope.note.content,
                  'about_item':$scope.casee.id,
                  'about_kind':'Case' };
    Note.insert($scope,params);
    $scope.note.title='';
    $scope.note.content='';
  }

//HKA 22.11.2013 Update Case
$scope.updatCasetHeader = function(casee){
 
  params = {'id':$scope.casee.id,
             'name':casee.name,
             'priority' :casee.priority,
           'status':$scope.status_selected.status,
           'type_case':casee.type_case}
  Case.patch($scope,params);
  $scope.$watch($scope.casee.priority, function() {
      var paramsNote = {
                  'about_kind': 'Case',
                  'about_item': $scope.casee.id,
                  'title': 'status updated to '+ casee.priority
                  
      };
      console.log('inserting a new note');
      console.log(paramsNote);
      
      Note.insert($scope,paramsNote);
   });
  
 $('#EditCaseModal').modal('hide');
};

      

     // Google+ Authentication 
     Auth.init($scope);

}]);
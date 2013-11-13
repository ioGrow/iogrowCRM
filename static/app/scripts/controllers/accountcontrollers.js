app.controller('AccountListCtrl', ['$scope','$route','$location','Conf','MultiAccountLoader','Account',
    function($scope,$route,$location,Conf,MultiAccountLoader,Account) {
     console.log('i am in account list controller');

     $("#id_Accounts").addClass("active");
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
          Account.list($scope,params);

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
      
    $scope.save = function(account){
      Account.insert(account);
    };
     
     
   

    
}]);
app.controller('AccountShowCtrl', ['$scope','$filter', '$route','$location','Conf','Account', 'Topic','Note','Task','Event','WhoHasAccess','User',
    function($scope,$filter,$route,$location,Conf,Account,Topic,Note,Task,Event,WhoHasAccess,User) {
      console.log('i am in account list controller');
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
     $scope.currentPage = 01;
     $scope.pages = [];
     
     $scope.accounts = [];
     
     
     $scope.addTask = function(task){
      
        $('#myModal').modal('hide');
        var params ={}

        console.log('adding a new task');
        console.log(task);
        
        if (task.due){

            var dueDate= $filter('date')(task.due,['yyyy-MM-dd']);
            dueDate = dueDate +'T00:00:00.000000'
            params ={'title': task.title,
                      'due': dueDate
            }
            console.log(dueDate);
        }else{
            params ={'title': task.title}
        };
        Task.insert($scope,params);
     }

     $scope.hilightTask = function(){
        console.log('Should higll');
        $('#task_0').effect("highlight","slow");
        $('#task_0').effect( "bounce", "slow" );
       
     }
     $scope.listTasks = function(){
        var params = {/*'about_kind':'Account',
                      'about_item':$scope.account.id,*/
                      'order': '-updated_at',
                      'limit': 5
                      };
        Task.list($scope,params);

     }
     $scope.addEvent = function(ioevent){
      
        $('#newEventModal').modal('hide');
        var params ={}

        console.log('adding a new event');
        
        
        if (ioevent.starts_at){
            if (ioevent.ends_at){
              params ={'title': ioevent.title,
                      'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'ends_at': $filter('date')(ioevent.ends_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'where': ioevent.where
              }

            }else{
              params ={'title': task.title,
                      'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'where': ioevent.where
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
        var params = {/*'about_kind':'Account',
                      'about_item':$scope.account.id,*/
                      'order': 'starts_at',
                      'limit': 5
                      };
        Event.list($scope,params);

     }

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
            params = {'about_kind':'Account',
                      'about_item':$scope.account.id,
                      'order': '-updated_at',
                      'limit': 5,
                      'pageToken':$scope.pages[prevPage]
                     }
          }else{
            params = {'about_kind':'Account',
                      'about_item':$scope.account.id,
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
     $scope.listTopics = function(account){
        var params = {'about_kind':'Account',
                      'about_item':account.id,
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
          // Call the backend to get the list of accounts
          
          var accountid = {'id':$route.current.params.accountId};
          Account.get($scope,accountid);

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
    }

      



}]);
app.controller('SearchFormController', ['$scope','$route','$location','Conf','User',
    function($scope,$route,$location,Conf,User) {
     console.log('Search Form Controller');
     var params ={};
     $scope.result = undefined;
     $scope.searchresults = function(q) {
        console.log('searchResults ');
        console.log(q);
        
        console.log("just before calling the usersearch api");
        gapi.client.crmengine.search().execute(function(resp) {
          console.log("in usersearch api");
          $scope.results = resp.items;
          //$scope.$apply();
        });
        
        return $scope.results;

      };
      $scope.selectResult = function(){
        console.log('slecting result yeaaah');
        console.log($scope.searchQuery);
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
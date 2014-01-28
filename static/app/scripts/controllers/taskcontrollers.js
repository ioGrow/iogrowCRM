app.controller('TaskShowController',['$scope','$filter','$route','Auth','Note','Task','Topic','Comment','User','Contributor',
   function($scope,$filter,$route,Auth,Note,Task,Topic,Comment,User,Contributor) {
//HKA 14.11.2013 Controller to show Notes and add comments
   $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.paginationcomment = {};
     $scope.currentPagecomment = 01;
     $scope.currentPage = 01;
     $scope.pagescomment = [];
     
     $scope.notes = [];  
     $scope.users = [];
     
     $scope.user = undefined;
     $scope.slected_memeber = undefined;
     $scope.role= 'participant';

 
    // What to do after authentication
     $scope.runTheProcess = function(){
          var taskid = {'id':$route.current.params.taskId};
          Task.get($scope,taskid);

          User.list($scope,{});
     };
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
            Auth.refreshToken();
     };
   $scope.listNextPageItemscomment= function(){
        
        
        var nextPage = $scope.currentPagecomment + 1;
        
        var params = {};
          if ($scope.pagescomment[nextPage]){
            params = {'limit':5,
                      'discussion':$scope.task.entityKey,                    
                       'order':'-updated_at',
                      'pageToken':$scope.pagescomment[nextPage]
                     }
          }else{
            params = {'limit':5,
                      'discussion':$scope.task.entityKey,
                      'order':'-updated_at',}
          }
          console.log('in listNextPageItems');
          $scope.currentPagecomment = $scope.currentPagecomment + 1 ; 
          Comment.list($scope,params);
     }
     $scope.listPrevPageItemscomment = function(){
       
       var prevPage = $scope.currentPagecomment - 1;
       var params = {};
          if ($scope.pagescomment[prevPage]){
            params = {'limit':5,
                      'discussion':$scope.task.entityKey,
                      'order':'-updated_at',
                      'pageToken':$scope.pagescomment[prevPage]
                     }
          }else{
            params = {'limit':5,
            'order':'-updated_at',
            'discussion':$scope.task.entityKey}
          }
          $scope.currentPagecomment = $scope.currentPagecomment - 1 ;
          Comment.list($scope,params);
     }
   
    

     
     $scope.showModal = function(){
        console.log('button clicked');
        $('#addAccountModal').modal('show');

      };

      $scope.selectMember = function(){
        
        $scope.slected_memeber = $scope.user;
        $scope.user = $scope.slected_memeber.google_display_name;

     };
     $scope.addNewContributor = function(selected_user,role){
      console.log('*************** selected user ***********************');
      console.log(selected_user);
      
      var params = {   
                      'discussionKey': $scope.task.entityKey,

                      'type': 'user',
                      'value': selected_user.email,
                      'name': selected_user.google_display_name,
                      'photoLink': selected_user.google_public_profile_photo_url,
                      'role': role


                      // Create Contributor Service
                      // Create contributors.list api
                      //list all contributors after getting the task.
                     
                      
        }  
        console.log('selected member');
        console.log(params); 
        Contributor.insert($scope,params);
     $('#addContributor').modal('hide');
     };
     $scope.listContributors = function(){
      var params = {'discussionKey':$scope.task.entityKey,
                     'order':'-created_at'};
      Contributor.list($scope,params);
      };

    $scope.addComment = function(comment){

      var params ={'discussion':$scope.task.entityKey,
        'content':$scope.comment.content
      };
      Comment.insert($scope,params);
      $scope.comment.content='';
     
      
    };
    $scope.ListComments = function(){
      var params = {'discussion':$scope.task.entityKey,
                     'limit':5,
                      'order':'-updated_at'};
      Comment.list($scope,params);
      
      
    };
//HKA 18.11.2013 highlight the comment
   $scope.hilightComment = function(){
        console.log('Should higll');
       $('#comment_0').effect( "bounce", "slow" );
       $('#comment_0 .message').effect("highlight","slow");
     };
    $scope.showEditTaskModal =function(){
      $('#EditTaskModal').modal('show');
      
    };
    $scope.updateTask = function(task){
      if (task.due){

            var dueDate= $filter('date')(task.due,['yyyy-MM-dd']);
            dueDate = dueDate +'T00:00:00.000000'
            params ={ 'id':$scope.task.id,
                      'title': task.title,
                      'due': dueDate,
                      'status':task.status
            };
      }else{
            params ={ 'id':$scope.task.id,
                      'title': task.title,
                      'status':task.status
            };
      }

      Task.patch($scope,params);
    };
  // Google+ Authentication 
    Auth.init($scope);

  }]);

app.controller('AllTasksController', ['$scope','Auth','Task','User',
    function($scope,Auth,Task,User) {
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
     $scope.account.account_type = 'Customer';
     $scope.slected_members = [];
     
     // What to do after authentication
     $scope.runTheProcess = function(){
          var params = { 'order': $scope.order,
                        'limit':7}
          Task.list($scope,params);
          User.list($scope,{});
     };
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
          Auth.refreshToken();
     };
     $scope.assigneeModal = function(){
        $('#assigneeModal').modal('show');
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

    $scope.selectMember = function(){
        if ($scope.slected_members.indexOf($scope.user) == -1) {
           $scope.slected_members.push($scope.user);
           $scope.slected_memeber = $scope.user;
           $scope.user = $scope.slected_memeber.google_display_name;
        }
        $scope.user='';
     };
     $scope.unselectMember =function(index){
         $scope.slected_members.splice(index, 1);
          console.log($scope.slected_members);

         
     };
     $scope.addNewContributor = function(selected_user){
      console.log('*************** selected user ***********************');
      console.log(selected_user);
      angular.forEach($scope.slected_members, function(selected_user){
     
      var params = {   
                      'discussionKey': $scope.task.entityKey,
                      'type': 'user',
                      'value': selected_user.email,
                      'name': selected_user.google_display_name,
                      'photoLink': selected_user.google_public_profile_photo_url
        }  
        console.log('selected member');
        console.log(params); 
        Contributor.insert($scope,params);
      });
     $('#addContributor').modal('hide');
     };
     $scope.listContributors = function(){
      var params = {'discussionKey':$scope.task.entityKey,
                     'order':'-created_at'};
      Contributor.list($scope,params);
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
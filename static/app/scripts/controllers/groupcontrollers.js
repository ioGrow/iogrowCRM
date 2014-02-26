app.controller('GroupListCtrl', ['$scope','Auth','Group',
    function($scope,Auth,Group) {
     $("#id_Groups").addClass("active");
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
     $scope.users = [];
     // What to do after authentication
     $scope.runTheProcess = function(){
          var params = {'limit':7}
          Group.list($scope,params);
     };
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
            Auth.refreshToken();
     };
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
          Group.list($scope,params);
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
          Group.list($scope,params);
     }
     

    
     $scope.showModal = function(){
        console.log('button clicked');
        $('#addGroupModal').modal('show');

      };
      
    $scope.addGroup = function(group){
      
      Group.insert($scope,group);
      $('#addGroupModal').modal('hide');
    };
    // Google+ Authentication 
    Auth.init($scope);
     
     
}]);

app.controller('GroupShowCtrl', ['$scope','$route','Auth','User', 'Group', 'Member',
    function($scope,$route,Auth,User,Group,Member) {
    

     $("#id_Groups").addClass("active");
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
     
     $scope.users = [];
     $scope.user = undefined;
     $scope.slected_memeber = undefined;
     $scope.role= 'member';

     // What to do after authentication
     $scope.runTheProcess = function(){
          var params = {'id':$route.current.params.groupId};
          Group.get($scope,params);
          User.list($scope,{});
     };
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
            Auth.refreshToken();
     };

     $scope.selectMember = function(){
        console.log('slecting user yeaaah');
        $scope.slected_memeber = $scope.user;
        $scope.user = $scope.slected_memeber.google_display_name;

     };
     $scope.addNewMember = function(selected_user,role){
      console.log('groups members.insert');
      console.log(selected_user);
      console.log(role);
      var params = {
                      'groupKey': $scope.group.entityKey,
                      'memberKey':$scope.slected_memeber.entityKey,
                      'role': role
        }  
        console.log('selected member');
        console.log(params); 
        Member.insert($scope,params);
     $('#addMemberModal').modal('hide');
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
          Group.list($scope,params);
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
          Group.list($scope,params);
     }
     $scope.listMembers = function(){
        console.log('listMembers');
        var params = {'id':$route.current.params.groupId};
        Group.get($scope,params);
     }
     $scope.showModal = function(){
        console.log('button clicked');
        $('#addMemberModal').modal('show');

      };
      
    $scope.addNewUser = function(user){
      
      Group.insert(user);
    };
     
    // Google+ Authentication 
    Auth.init($scope);
}]);

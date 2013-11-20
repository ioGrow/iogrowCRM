var accountservices = angular.module('crmEngine.userservices',[]);
// Base sercice (create, delete, get)

accountservices.factory('User', function($http) {
  
  var User = function(data) {
    angular.extend(this, data);
  }

  
  User.get = function($scope,id) {
          gapi.client.crmengine.accounts.get(id).execute(function(resp) {
            if(!resp.code){
               $scope.account = resp;
               $scope.isContentLoaded = true;
               $scope.listTopics(resp);
               $scope.listTasks();
               $scope.listEvents();
               // Call the method $apply to make the update on the scope
               //$scope.apply();

            }else {
               alert("Error, response is: " + angular.toJson(resp));
            }
            console.log('gapi #end_execute');
          });
  };
  User.list = function($scope,params){
      $scope.isLoading = true;
      console.log('in users.list');
      gapi.client.crmengine.users.list(params).execute(function(resp) {
              if(!resp.code){
                 $scope.users = resp.items;
                 if ($scope.currentPage>1){
                      $scope.pagination.prev = true;
                   }else{
                       $scope.pagination.prev = false;
                   }
                 if (resp.nextPageToken){
                   var nextPage = $scope.currentPage + 1;
                   // Store the nextPageToken
                   $scope.pages[nextPage] = resp.nextPageToken;
                   $scope.pagination.next = true;
                   
                 }else{
                  $scope.pagination.next = false;
                 }
                 // Loaded succefully
                 $scope.isLoading = false;
                 // Call the method $apply to make the update on the scope
                 $scope.$apply();
              }else {
                 alert("Error, response is: " + angular.toJson(resp));
              }
      });
  };
  User.insert = function($scope,params){
      gapi.client.crmengine.users.insert(params).execute(function(resp) {
         console.log('in insert resp');
         console.log(resp);
         if(!resp.code){

          $('#addAccountModal').modal('hide');
          
          User.list($scope,params);
          
         }else{
          //console.log(resp.code);
          window.location.replace('/sign-in');
         }
      });
  };
  

return User;
});

accountservices.factory('Permission', function($http) {
  
  var Permission = function(data) {
    angular.extend(this, data);
  }

  
  
  Permission.insert = function($scope,params){
      console.log(params);
      gapi.client.crmengine.permissions.insert(params).execute(function(resp) {
         console.log('in insert resp');
         console.log(resp);
         if(!resp.code){
              $scope.updateCollaborators();
          
         }else{
          console.log(resp.code);
         }
      });
  };
  

return Permission;
});

var accountservices = angular.module('crmEngine.userservices',[]);
// Base sercice (create, delete, get)

accountservices.factory('User', function($http) {
  
  var User = function(data) {
    angular.extend(this, data);
  }

  
  User.get = function($scope,id) {

          gapi.client.crmengine.users.get(id).execute(function(resp) {
            if(!resp.code){
               $scope.user = resp;
               
               // Call the method $apply to make the update on the scope
               $scope.apply();

            }else {
               if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
               };
            }
            console.log('gapi #end_execute');
          });
  };
  User.list = function($scope,params){
      $scope.isLoading = true;
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
                 if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
               };
              }
      });
  };
  User.insert = function($scope,params){
      $scope.isLoading = true;
      gapi.client.crmengine.users.insert(params).execute(function(resp) {
         console.log('in insert resp');
         console.log(resp);
         if(!resp.code){
          $scope.user.email = '';
          
          
          User.list($scope,params);
          
         }else{
              console.log(resp.message);
               $('#addAccountModal').modal('hide');
                $('#errorModal').modal('show');
              if(resp.message=="Invalid grant"){
               $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
            };
              // To do add custom error handler


         }
      });
  };

  User.patch = function($scope,params){
      gapi.client.crmengine.users.patch(params).execute(function(resp) {
            if(!resp.code){
               $scope.user = resp;
               window.location.reload();
              
               
               // Call the method $apply to make the update on the scope
                $scope.$apply();

            }else {
               if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
               };
            }
            console.log('User.patch gapi #end_execute');
          });
  }
  

return User;
});

accountservices.factory('Permission', function($http) {
  
  var Permission = function(data) {
    angular.extend(this, data);
  }

  
  
  Permission.insert = function($scope,params){
      console.log(params);
      gapi.client.crmengine.permissions.insertv2(params).execute(function(resp) {
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

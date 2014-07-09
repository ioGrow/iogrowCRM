var accountservices = angular.module('crmEngine.groupservices',[]);
// Base sercice (create, delete, get)

accountservices.factory('Group', function($http) {
  
  var Group = function(data) {
    angular.extend(this, data);
  }

  
  Group.get = function($scope,params) {
           $scope.isLoading = true;
          console.log('in groups.get');
          gapi.client.crmengine.groups.get(params).execute(function(resp) {
            if(!resp.code){
              

               $scope.group = resp;
               $scope.isContentLoaded = true;
               //$scope.listMembers();
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
            console.log('gapi #end_execute');
          });
          $scope.isLoading=false;

  };
  Group.list = function($scope,params){
      $scope.isLoading = true;
      console.log('in users.list');
      gapi.client.crmengine.groups.list(params).execute(function(resp) {
              if(!resp.code){
                if(!resp.items){
                 $scope.blankstategroup = true;

              };
                 $scope.groups = resp.items;
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
     $scope.isLoading=false;
     
  };
  Group.insert = function($scope,params){
      gapi.client.crmengine.groups.insert(params).execute(function(resp) {
         console.log('in insert resp');
         console.log(resp);
         if(!resp.code){
          $scope.groups.push(resp);
          $scope.$apply();
          
         }else{
          console.log(resp.code);
         }
      });
  };
  

return Group;
});
accountservices.factory('Member', function($http) {
  
  var Member = function(data) {
    angular.extend(this, data);
  }

  
  Member.get = function($scope,params) {
          gapi.client.crmengine.groups.get(params).execute(function(resp) {
            if(!resp.code){
               $scope.group = resp;
               $scope.isContentLoaded = true;
               $scope.listMembers();
               // Call the method $apply to make the update on the scope
               //$scope.apply();

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
  Member.list = function($scope,params){
      $scope.isLoading = true;
      console.log('in members.list');
      gapi.client.crmengine.members.list(params).execute(function(resp) {
              if(!resp.code){
                 $scope.members = resp.items;
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
     $scope.isLoading=false;
       
  };
  Member.insert = function($scope,params){
      gapi.client.crmengine.members.insert(params).execute(function(resp) {
         console.log('in insert resp');
         console.log(resp);
         if(!resp.code){
          console.log('succsse inserted members');
          $scope.listMembers();
          $scope.$apply();
          
         }else{
          console.log(resp.code);
         }
      });
  };
  

return Member;
});


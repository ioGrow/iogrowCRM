var accountservices = angular.module('crmEngine.productservices',[]);
// Base sercice (create, delete, get)

accountservices.factory('Product', function($http) {
  
  var Product = function(data) {
    angular.extend(this, data);
  }

  
  Product.get = function($scope,id) {
     $scope.isLoading=true;

          gapi.client.crmengine.accounts.get(id).execute(function(resp) {
            if(!resp.code){
               $scope.account = resp;
               $scope.isContentLoaded = true;
               $scope.listTopics(resp);
               $scope.listTasks();
               $scope.listEvents();
               // Call the method $apply to make the update on the scope
                $scope.$apply();

            }else {
               alert("Error, response is: " + angular.toJson(resp));
            }
            console.log('gapi #end_execute');
          });
     $scope.isLoading=false;

  };
  Product.patch = function($scope,params) {
          console.log('in accounts.patch service');
          console.log(params);
          $scope.isLoading=true;

          gapi.client.crmengine.accounts.patch(params).execute(function(resp) {
            if(!resp.code){
               $scope.account = resp;
               
               // Call the method $apply to make the update on the scope
                $scope.$apply();

            }else {
               alert("Error, response is: " + angular.toJson(resp));
            }
            console.log('accounts.patch gapi #end_execute');
          });
     $scope.isLoading=false;

  };
  Product.list = function($scope,params){
      $scope.isLoading = true;
      gapi.client.crmengine.products.list(params).execute(function(resp) {
              if(!resp.code){
                
                 $scope.products = resp.items;
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
     $scope.isLoading=false;

  };
  Product.insert = function($scope,params){
     $scope.isLoading=true;

      gapi.client.crmengine.products.insert(params).execute(function(resp) {
        console.log('in insert resp');
         console.log(resp);
         if(!resp.code){
          $('#addAccountModal').modal('hide');
          window.location.replace('#/products/show/'+resp.id);
          
         }else{
          console.log(resp.code);
         }
      });
     $scope.isLoading=false;
      
  };
  

return Product;
});



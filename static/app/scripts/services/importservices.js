var accountservices = angular.module('crmEngine.importservices',[]);
// Base sercice (create, delete, get)

accountservices.factory('Import', function($http) {
  
  var Import = function(data) {
    angular.extend(this, data);
  }


  
  Import.highrise = function($scope,params){
  
      $scope.isLoading=true;

      gapi.client.crmengine.highrise.import_peoples(params).execute(function(resp) {
         console.log('in insert resp');
         console.log($scope.isLoading);
         if(!resp.code){
          //$scope.groups.push(resp);
          $scope.isLoading=false;
          $scope.$apply();
          
         }else{
          console.log(resp.code);
         }
      });
  };
  

return Import;
});
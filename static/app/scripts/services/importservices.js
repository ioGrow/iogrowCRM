var accountservices = angular.module('crmEngine.importservices',[]);
// Base sercice (create, delete, get)

accountservices.factory('Import', function($http) {
  
  var Import = function(data) {
    angular.extend(this, data);
  }


  
  Import.highrise = function($scope,params){
      console.log(params);
      console.log("ppppppppppparr");
      gapi.client.crmengine.highrise.import_peoples(params).execute(function(resp) {
         console.log('in insert resp');
         console.log(resp);
         if(!resp.code){
          //$scope.groups.push(resp);
          $scope.$apply();
          
         }else{
          console.log(resp.code);
         }
      });
  };
  

return Import;
});
var companyprofileservices = angular.module('crmEngine.companyprofileservices',[]);

companyprofileservices.factory('Companyprofile', function($http) {
  
  var Companyprofile = function(data) {
    angular.extend(this, data);
  }

  
  Companyprofile.get = function($scope,params) {
          gapi.client.crmengine.companyprofiles.get(params).execute(function(resp) {
            if(!resp.code){
               $scope.companyprof = resp;
               $scope.renderMaps();
              
               // Call the method $apply to make the update on the scope
               $scope.$apply();

            }else {
               alert("Error, response is: " + angular.toJson(resp));
            }
            console.log('gapi #end_execute');
          });
  };
  

  Companyprofile.patch = function($scope,params){
    console.log('####@*');

    console.log(params);
    console.log(angular.toJson(params));
    gapi.client.crmengine.companyprofiles.patch(params).execute(function(resp){

      $scope.companyprof = resp;

      $scope.$apply();

    }

      )};

  

  

return Companyprofile;
});

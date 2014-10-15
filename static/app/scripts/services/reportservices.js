var reportservices = angular.module('crmEngine.reportservices',[]);
// Base sercice (create, delete, get)

reportservices.factory('Reports', function($http) {

  var Reports = function(data) {
    angular.extend(this, data);
  }


  Reports.Leads = function($scope,params) {
          $scope.isLoading = true;
          $scope.$apply();

          gapi.client.crmengine.reports.get(params).execute(function(resp) {
            if(!resp.code){
       
                      console.log(resp)
                      $scope.prepareDataForCharts(resp)
                      $scope.isLoading=false;

                      $scope.$apply();
                      $(window).trigger("resize");
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
  


return Reports;
});

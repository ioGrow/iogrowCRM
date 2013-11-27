var campaignservices = angular.module('crmEngine.campaignservices',[]);

campaignservices.factory('Campaign', function($http) {
  
  var Campaign = function(data) {
    angular.extend(this, data);
  }

  
  Campaign.get = function($scope,id) {
          gapi.client.crmengine.campaigns.get(id).execute(function(resp) {
            if(!resp.code){
               $scope.campaign = resp;
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
  Campaign.list = function($scope,params){
      $scope.isLoading = true;
      gapi.client.crmengine.campaigns.list(params).execute(function(resp) {
              if(!resp.code){
                 $scope.campaigns = resp.items;
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
  Campaign.insert = function(campaign){
      gapi.client.crmengine.campaigns.insert(campaign).execute(function(resp) {
         console.log('in insert resp');
         console.log(resp);
         if(!resp.code){
          $('#addCampaignModal').modal('hide');
          window.location.replace('#/campaigns/show/'+resp.id);
          
         }else{
          console.log(resp.code);
         }
      });
  };
  

return Campaign;
});


campaignservices.factory('MultiCampaignLoader', ['Campaign','$route', '$q',
    function(Campaign, $route, $q) {
    return function() {
    var delay = $q.defer();
    gapi.client.crmengine.campaigns.list().execute(function(resp) {
            console.log('after execution');
           // console.log(resp);
            
            delay.resolve(resp.items);

            console.log('resoleved');
            console.log(resp.items);
            console.log('continue');
      // pagination
    
    });
    console.log('continued');
    
    return delay.promise;
    };
}]);

// retrieve an account
accountservices.factory('CampaignLoader', ['Campaign', '$route', '$q',
    function(Campaign, $route, $q) {
  return function() {
    var delay = $q.defer();
    
    var campaignId = $route.current.params.campaignId;
    
    
    return Campaign.get($route.current.params.campaignId);
  };
}]);

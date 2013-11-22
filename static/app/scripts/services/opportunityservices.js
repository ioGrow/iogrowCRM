var opportunityservices = angular.module('crmEngine.opportunityservices',[]);
 /*****************HKA 20.10.2013 Opportunity services ****************/
//HKA 20.10.2013   Base service (create, delete, get)


opportunityservices.factory('Opportunity', function($http) {
  
  var Opportunity = function(data) {
    angular.extend(this, data);
  }

  
  //HKA .5.112013 Add function get Opportunity
  Opportunity.get = function($scope,id){
    gapi.client.crmengine.opportunities.get(id).execute(function(resp){
      if(!resp.code){
        $scope.opportunity = resp;
        $scope.isContentLoaded = true;
        $scope.listTopics(resp);
        $scope.listTasks();
        $scope.listEvents();
        $scope.$apply();

      }else {
        alert("Error, response is :"+angular.toJson(resp))
      }
    });

  };

  //HKA 05.11.2013 Add list function
  Opportunity.list = function($scope,params){
      $scope.isLoading = true;
      gapi.client.crmengine.opportunities.list(params).execute(function(resp) {
              if(!resp.code){
                
                 $scope.opportunities = resp.items;
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
    Opportunity.patch = function($scope,params) {
          console.log('in opportunities.patch service');
          console.log(params);
          gapi.client.crmengine.opportunities.patch(params).execute(function(resp) {
            if(!resp.code){
               $scope.opportunity = resp;
               
               // Call the method $apply to make the update on the scope
                $scope.$apply();

            }else {
               alert("Error, response is: " + angular.toJson(resp));
            }
            console.log('accounts.patch gapi #end_execute');
          });
  };
    //HKA 09.11.2013 Add an opportunity
    Opportunity.insert = function(opportunity){
      gapi.client.crmengine.opportunities.insert(opportunity).execute(function(resp) {
         console.log('in insert resp');
         console.log(resp);
         if(!resp.code){
          $('#addOpportunityModal').modal('hide');
          window.location.replace('#/opportunities/show/'+resp.id);
          
         }else{
          console.log(resp.code);
         }
      });
  };
  

return Opportunity;
});
//HKA 06.11.2013 retrive an Opportunity
opportunityservices.factory('OpportunityLoader',['Opportunity','$route','$q',
  function(Opportunity,$route,$q){
   return function() {
    var delay = $q.defer();
    var opportunityId = $route.current.params.opportunityId;
  return Opportunity.get($route.current.params.opportunityId);
   };  
    

  }]);


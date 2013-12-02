var leadservices = angular.module('crmEngine.leadservices',[]);

leadservices.factory('Lead', function($http) {
  
  var Lead = function(data) {
    angular.extend(this, data);
  }

  
  Lead.get = function($scope,id) {
          gapi.client.crmengine.leads.get(id).execute(function(resp) {
            if(!resp.code){
               $scope.lead = resp;
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
  };
  Lead.patch = function($scope,params) {
          console.log('in accounts.patch service');
          console.log(params);
          gapi.client.crmengine.leads.patch(params).execute(function(resp) {
            if(!resp.code){
               $scope.lead = resp;
               
               // Call the method $apply to make the update on the scope
                $scope.$apply();

            }else {
               alert("Error, response is: " + angular.toJson(resp));
            }
            console.log('leads.patch gapi #end_execute');
          });
  };
  Lead.list = function($scope,params){
      gapi.client.crmengine.leads.list(params).execute(function(resp) {

              if(!resp.code){
                if (!resp.items){
                    $scope.blankState = true;
                  }
                 $scope.leads = resp.items;
                 if (resp.nextPageToken){
                   $scope.prevPageToken = $scope.nextPageToken;
                   $scope.nextPageToken = resp.nextPageToken;

                   $scope.pagination.next = true;
                   $scope.pagination.prev = true;
                 }else{
                  $scope.pagination.next = false;
                 }
                 // Call the method $apply to make the update on the scope
                 $scope.isLoading = false;
                 $scope.$apply();
                 

              }else {
                 alert("Error, response is: " + angular.toJson(resp));
              }
              console.log('gapi #end_execute');
        });
    
  	

  };
  Lead.insert = function(lead){
      gapi.client.crmengine.leads.insert(lead).execute(function(resp) {
         console.log('in insert resp');
         console.log(resp);
         if(!resp.code){
          $('#addLeadModal').modal('hide');
          window.location.replace('#/leads/show/'+resp.id);
          
         }else{
            console.log(resp.message);
             $('#addLeadModal').modal('hide');
             $('#errorModal').modal('show');
             if(resp.message=="Invalid grant"){
                window.location.replace('/sign-in');
             };
         }
      });
  };
  

return Lead;
});


// retrieve a contact
contactservices.factory('LeadLoader', ['Lead', '$route', '$q',
    function(Lead, $route, $q) {
  return function() {
    var delay = $q.defer();
    
    var leadId = $route.current.params.leadId;
    
    
    return Lead.get($route.current.params.leadId);
  };
}]);

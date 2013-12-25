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
     $scope.isLoading = true;
      gapi.client.crmengine.leads.list(params).execute(function(resp) {

              if(!resp.code){
                if (!resp.items){
                    $scope.blankStatelead = true;
                  }
                 $scope.leads = resp.items;
                  if ($scope.currentPage>1){
                      $scope.leadpagination.prev = true;
                   }else{
                       $scope.leadpagination.prev = false;
                   }
                 if (resp.nextPageToken){
                   var nextPage = $scope.currentPage + 1;
                   // Store the nextPageToken
                   $scope.pages[nextPage] = resp.nextPageToken;
                   $scope.leadpagination.next = true;
                   
                 }else{
                  $scope.leadpagination.next = false;
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
  Lead.insert = function($scope,lead){
      $scope.isLoading = true;
      gapi.client.crmengine.leads.insert(lead).execute(function(resp) {
         console.log('in insert resp');
         console.log(resp);
         if(!resp.code){
          $scope.isLoading = false;
          $('#addLeadModal').modal('hide');
          window.location.replace('#/leads/show/'+resp.id);
          
         }else{
            console.log(resp.message);
             $('#addLeadModal').modal('hide');
             $('#errorModal').modal('show');
             if(resp.message=="Invalid grant"){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
             };
         }
      });
  };
  Lead.convert = function($scope,id){
      $scope.isLoading = true;
      gapi.client.crmengine.leads.convert(id).execute(function(resp) {
         console.log('in insert resp');
         console.log(resp);
         if(!resp.code){
          $scope.isLoading = false;
          $('#convertLeadModal').modal('hide');
          window.location.replace('#/contacts/show/'+resp.id);
          
         }else{
            console.log(resp.message);
             $('#addLeadModal').modal('hide');
             $('#errorModal').modal('show');
             if(resp.message=="Invalid grant"){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
             };
         }
      });
  };
  Lead.search = function($scope,params){
      gapi.client.crmengine.leads.search(params).execute(function(resp) {
          console.log(resp);
           if (resp.items){
              $scope.results = resp.items;
              
              $scope.$apply();
            };
            
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

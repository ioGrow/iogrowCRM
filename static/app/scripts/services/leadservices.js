var leadservices = angular.module('crmEngine.leadservices',[]);
// Base sercice (create, delete, get)
contactservices.factory('Conf', function($location) {
      function getRootUrl() {
        var rootUrl = $location.protocol() + '://' + $location.host();
        if ($location.port())
          rootUrl += ':' + $location.port();
        return rootUrl;
      };
      return {
        'clientId': '330861492018.apps.googleusercontent.com',
        'apiBase': '/api/',
        'rootUrl': getRootUrl(),
        'scopes': 'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/userinfo.email',
        'requestvisibleactions': 'http://schemas.google.com/AddActivity ' +
                'http://schemas.google.com/ReviewActivity',
         'cookiepolicy': 'single_host_origin'
      };
});
leadservices.factory('Lead', function($http) {
  
  var Lead = function(data) {
    angular.extend(this, data);
  }

  
  Lead.get = function($scope,id) {
          gapi.client.crmengine.leads.get(id).execute(function(resp) {
            if(!resp.code){
               $scope.lead = resp;
               $scope.isContentLoaded = true;
                $scope.listTasks();
               // Call the method $apply to make the update on the scope
               $scope.$apply();

            }else {
               alert("Error, response is: " + angular.toJson(resp));
            }
            console.log('gapi #end_execute');
          });
  };
  Lead.list = function($scope,params){
      gapi.client.crmengine.leads.list(params).execute(function(resp) {

              if(!resp.code){
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
          console.log(resp.code);
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

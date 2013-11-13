var opportunityservices = angular.module('crmEngine.opportunityservices',[]);
 /*****************HKA 20.10.2013 Opportunity services ****************/
//HKA 20.10.2013   Base service (create, delete, get)

opportunityservices.factory('Conf', function($location) {
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
    gapi.client.crmengine.opportunities.list(params).execute(function(resp){
      if(!resp.code){
        $scope.opportunities = resp.items;

        if (resp.nextPageToken){
          $scope.prevPageToken = $scope.nextPageToken;
          $scope.nextPageToken = resp.nextPageToken;
          $scope.pagination.next = true;
          $scope.pagination.prev = true;
        }else{
          $scope.isLoading = false;
          $scope.$apply();
        }
      }else {
        alert("Error, response is: " + angular.toJson(resp));
      }
    });
    };
    //HKA 09.11.2013 Add an opportunity
    Opportunity.insert = function(opportunity){
      gapi.client.crmengine.opportunities.insert(opportunity).execute(function(resp){
        if(!resp.code){
          $('#addOpportunityModal').modal('hide');
          window.location.replace('#/opportunities/show/'+resp.id);
          
         }else{
          console.log(resp.code);
         }


      })}
  





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


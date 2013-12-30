var caseservices = angular.module('crmEngine.caseservices',[]);
// Base sercice (create, delete, get)

accountservices.factory('Case', function($http) {
  
  var Case = function(data) {
    angular.extend(this, data);
  }

  
  Case.get = function($scope,id) {
          gapi.client.crmengine.cases.get(id).execute(function(resp) {
            if(!resp.code){
               $scope.casee = resp;
               $scope.isContentLoaded = true;
               $scope.listTopics(resp);
               $scope.listTasks();
               $scope.listEvents();
               $scope.listDocuments();
               // Call the method $apply to make the update on the scope
               //$scope.apply();

            }else {
               alert("Error, response is: " + angular.toJson(resp));
            }
            console.log('gapi #end_execute');
          });
  };
  Case.search = function($scope,params){
      gapi.client.crmengine.cases.search(params).execute(function(resp) {
          console.log(resp);
           if (resp.items){
              $scope.results = resp.items;
              
              $scope.$apply();
            };
            
      });
  };

  Case.list = function($scope,params){
      $scope.isLoading = true;
      gapi.client.crmengine.cases.list(params).execute(function(resp) {
              if(!resp.code){
                  if (!resp.items){
                    $scope.blankStatecase = true;
                  }
                 $scope.cases = resp.items;
                         
                 if ($scope.caseCurrentPage>1){
                      $scope.casepagination.prev = true;
                   }else{
                       $scope.casepagination.prev = false;
                   }
                 if (resp.nextPageToken){
                   var nextPage = $scope.caseCurrentPage + 1;
                   // Store the nextPageToken
                   $scope.casepages[nextPage] = resp.nextPageToken;
                   $scope.casepagination.next = true;
                   
                 }else{
                  $scope.casepagination.next = false;
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
  Case.insert = function($scope,casee){
     $scope.isLoading = true;
      gapi.client.crmengine.cases.insert(casee).execute(function(resp) {
         console.log('in insert resp');
         console.log(resp);
         if(!resp.code){
          $scope.isLoading = false;
          $('#addCaseModal').modal('hide');
          window.location.replace('#/cases/show/'+resp.id);
          
         }else{
          console.log(resp.message);
             $('#addCaseModal').modal('hide');
             $('#errorModal').modal('show');
             if(resp.message=="Invalid grant"){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
             };
         }
      });
  };
  Case.patch = function($scope,params) {
          console.log('in cases.patch service');
          console.log(params);
          gapi.client.crmengine.cases.patch(params).execute(function(resp) {
            if(!resp.code){
                console.log('in cases.patch');
                console.log(resp);
               $scope.casee = resp;
               
               // Call the method $apply to make the update on the scope
                $scope.$apply();

            }else {
               alert("Error, response is: " + angular.toJson(resp));
            }
            console.log('accounts.patch gapi #end_execute');
          });
  };

  Case.delete = function($scope,id){
    gapi.client.crmengine.cases.delete(id).execute(function(resp){
        window.location.replace('#/cases');
      }
    )};

return Case;
});

// retrieve list account
accountservices.factory('MultiAccountLoader', ['Account','$route', '$q',
    function(Account, $route, $q) {
    return function() {
    var delay = $q.defer();
    gapi.client.crmengine.accounts.list().execute(function(resp) {
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
accountservices.factory('CaseLoader', ['Case', '$route', '$q',
    function(Case, $route, $q) {
  return function() {
    var delay = $q.defer();
    
    var caseId = $route.current.params.caseId;
    
    
    return Case.get($route.current.params.caseId);
  };
}]);

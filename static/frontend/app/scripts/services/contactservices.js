var contactservices = angular.module('crmEngine.contactservices',[]);
// Base sercice (create, delete, get)

accountservices.factory('Contact', function($http) {
  
  var Contact = function(data) {
    angular.extend(this, data);
  }

  
  Contact.get = function($scope,id) {
          gapi.client.crmengine.contacts.get(id).execute(function(resp) {
            if(!resp.code){
               $scope.contact = resp;
               $scope.isContentLoaded = true;
               $scope.listTopics(resp);
               $scope.listTasks();
               $scope.listEvents();
               $scope.listOpportunities();
               $scope.listCases();
               // Call the method $apply to make the update on the scope
               $scope.$apply();

            }else {
               alert("Error, response is: " + angular.toJson(resp));
            }
            console.log('gapi #end_execute');
          });
  };
  Contact.patch = function($scope,params) {
          console.log('in contacts.patch service');
          console.log(params);
          gapi.client.crmengine.contacts.patch(params).execute(function(resp) {
            if(!resp.code){
               $scope.contact = resp;
               
               // Call the method $apply to make the update on the scope
                $scope.$apply();

            }else {
               alert("Error, response is: " + angular.toJson(resp));
            }
            console.log('Contact.patch gapi #end_execute');
          });
  };
  Contact.list = function($scope,params){
      gapi.client.crmengine.contacts.list(params).execute(function(resp) {

              if(!resp.code){
                  if (!resp.items){
                    $scope.blankState = true;
                  }
                 $scope.contacts = resp.items;
                 if ($scope.currentPage>1){
                      $scope.contactpagination.prev = true;
                   }else{
                       $scope.contactpagination.prev = false;
                   }
                 if (resp.nextPageToken){
                   var nextPage = $scope.currentPage + 1;
                   // Store the nextPageToken
                   $scope.pages[nextPage] = resp.nextPageToken;
                   $scope.contactpagination.next = true;
                   
                 }else{
                  $scope.contactpagination.next = false;
                 }
                 // Loaded succefully
                 $scope.isLoading = false;
                 // Call the method $apply to make the update on the scope
                 $scope.$apply();

              } else {
                 alert("Error, response is: " + angular.toJson(resp));
              }
              console.log('gapi #end_execute');
        });
    
  	

  };
  Contact.insert = function($scope,params){
      $scope.isLoading = true;
      gapi.client.crmengine.contacts.insert(params).execute(function(resp) {
         
         if(!resp.code){
          $scope.isLoading = false;
          $('#addAContactModal').modal('hide');
          window.location.replace('#/contacts/show/'+resp.id);
          
         }else{
            console.log(resp.message);
             $('#addAContactModal').modal('hide');
             $('#errorModal').modal('show');
             if(resp.message=="Invalid grant"){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
             };
         }
      });
  };
  

return Contact;
});

// retrieve list account
contactservices.factory('MultiContactLoader', ['Account','$route', '$q',
    function(Account, $route, $q) {
    return function() {
    var delay = $q.defer();
    gapi.client.crmengine.contacts.list().execute(function(resp) {
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

   // function(Account,$route, $q) {
  //return function() {
   // return Account.list($route.current.params.page);
 // };
}]);

// retrieve a contact
contactservices.factory('ContactLoader', ['Contact', '$route', '$q',
    function(Contact, $route, $q) {
  return function() {
    var delay = $q.defer();
    
    var contactId = $route.current.params.contactId;
    
    
    return Contact.get($route.current.params.contactId);
  };
}]);

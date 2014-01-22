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
               $scope.listDocuments();
               $scope.selectedTab = 2;
               $scope.renderMaps();

              document.title = "Contact: " + $scope.contact.firstname +' ' +$scope.contact.lastname ;
              $scope.email.to = '';
                angular.forEach($scope.contact.emails, function(value, key){
                  $scope.email.to = $scope.email.to + value.email + ',';
                  
                });
               // Call the method $apply to make the update on the scope
               $scope.$apply();

            }else {
              if(resp.message=="Invalid token"){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
               };
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
               $scope.email.to = '';
                angular.forEach($scope.contact.emails, function(value, key){
                  $scope.email.to = $scope.email.to + value.email + ',';
                  
                });
               
               // Call the method $apply to make the update on the scope
                $scope.$apply();

            }else {
               if(resp.message=="Invalid token"){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
               };
            }
            console.log('Contact.patch gapi #end_execute');
          });
  };
  Contact.list = function($scope,params){
      gapi.client.crmengine.contacts.list(params).execute(function(resp) {

    
              if(!resp.code){
                  if (!resp.items){
                    $scope.blankStatecontact = true;
                  }
                 $scope.contacts = resp.items;
                 if ($scope.contactCurrentPage>1){
                      $scope.contactpagination.prev = true;
                   }else{
                       $scope.contactpagination.prev = false;
                   }
                 if (resp.nextPageToken){
                   var nextPage = $scope.contactCurrentPage + 1;
                   // Store the nextPageToken
                   $scope.contactpages[nextPage] = resp.nextPageToken;
                   $scope.contactpagination.next = true;
                   
                 }else{
                  $scope.contactpagination.next = false;
                 }
                 // Loaded succefully
                 $scope.isLoading = false;
                 // Call the method $apply to make the update on the scope
                 $scope.$apply();

              } else {
                 if(resp.message=="Invalid token"){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
               };
              }
              console.log('gapi #end_execute');
        });
    
  	

  };
  Contact.search = function($scope,params){
      gapi.client.crmengine.contacts.search(params).execute(function(resp) {
           if (resp.items){
              $scope.results = resp.items;
              
              $scope.$apply();
            };
            
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
Contact.delete = function($scope,id){
    gapi.client.crmengine.contacts.delete(id).execute(function(resp){
        window.location.replace('#/contacts');
    }

    )};
  

return Contact;
});


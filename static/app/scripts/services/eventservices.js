var eventservices = angular.module('crmEngine.eventservices',[]);

eventservices.factory('Event', function($http) {
  
  var Event = function(data) {
    angular.extend(this, data);
  }

  Event.get = function($scope,id) {
          gapi.client.crmengine.events.get(id).execute(function(resp) {
            if(!resp.code){
               $scope.eventt = resp;
               var url = Event.getUrl($scope.eventt.about_kind,$scope.eventt.about_item);
               $scope.uri =url;
               // $scope.isContentLoaded = true;
               // $scope.listTopics(resp);
               // $scope.listTasks();
               // $scope.listEvents();
               // Call the method $apply to make the update on the scope
                $scope.$apply();

            }else {
               alert("Error, response is: " + angular.toJson(resp));
            }
            console.log('gapi #end_execute');
          });
  };
  Event.list = function($scope,params){
      console.log('in events.list');
      console.log(params);

      $scope.isLoading = true;

      gapi.client.crmengine.events.list(params).execute(function(resp) {
              console.log(resp);
              if(!resp.code){
               
                  console.log(resp);

                 $scope.events = resp.items;
                 /*if ($scope.currentPage>1){
                      console.log('Should show PREV');
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
                 */
                 // Loaded succefully
                 $scope.isLoading = false;

                 // Call the method $apply to make the update on the scope
                 $scope.$apply();
                 $scope.hilightEvent();
              }else {
                 alert("Error, response is: " + angular.toJson(resp));
              }
      });
  };
   Event.insert = function($scope,params){
      $scope.isLoading = true;
      console.log('**************before events.insert*********************');
      console.log(params);
      gapi.client.crmengine.events.insert(params).execute(function(resp) {
         console.log('in insert Event resp');
         console.log(resp);
         console.log('after resp');
         if(!resp.code){
          console.log(resp);
          // TME_02_11_13 when a note is inserted reload topics
          $scope.listEvents();
          $scope.isLoading = false;

          $scope.$apply();
         // $('#addAccountModal').modal('hide');
         // window.location.replace('#/accounts/show/'+resp.id);
          
         }else{
          console.log(resp.code);
         }
      });
  };
Event.getUrl = function(type,id){
  var base_url = undefined;
    switch (type)
        {
        case 'Account':
          base_url = '/#/accounts/show/';
          break;
        case 'Contact':
          base_url = '/#/contacts/show/';
          break;
        case 'Lead':
          base_url = '/#/leads/show/';
          break;
        case 'Opportunity':
          base_url = '/#/opportunities/show/';
          break;
        case 'Case':
          base_url = '/#/cases/show/';
          break;
        case 'Show':
          base_url = '/#/shows/show/';
          break;
        }

    return base_url+id;

 };

  

return Event;
});

var topicservices = angular.module('crmEngine.showservices',[]);

topicservices.factory('Show', function($http) {
  
  var Show = function(data) {
    angular.extend(this, data);
  }

  
  Show.get = function($scope,params) {
          gapi.client.crmengine.shows.get(params).execute(function(resp) {
            if(!resp.code){
               $scope.show = resp;
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
  Show.list = function($scope,params){
      console.log('in events.list');
      console.log(params);

      $scope.isLoading = true;
      gapi.client.crmengine.shows.list(params).execute(function(resp) {
              console.log('Shows');
              console.log(resp);
              if(!resp.code){
                console.log('in topics.list looking for pagingation');
                console.log($scope.currentPage);

                 $scope.shows = resp.items;
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
                 
              }else {
                 alert("Error, response is: " + angular.toJson(resp));
              }
      });
  };
   Show.insert = function($scope,params){
      $scope.isLoading = true;
      gapi.client.crmengine.shows.insert(params).execute(function(resp) {
         console.log('in insert Event resp');
         console.log(resp);
         if(!resp.code){
          console.log(resp);
          // TME_02_11_13 when a note is inserted reload topics
          $('#newShowModal').modal('hide');
          window.location.replace('#/shows/show/'+resp.id);
         // $('#addAccountModal').modal('hide');
         // window.location.replace('#/accounts/show/'+resp.id);
          
         }else{
          console.log(resp.code);
         }
      });
  };

  

return Show;
});

var topicservices = angular.module('crmEngine.taskservices',[]);

topicservices.factory('Task', function($http) {
  
  var Task = function(data) {
    angular.extend(this, data);
  }

  
  Task.get = function(id) {
    return $http.get('/api/topics/' + id).then(function(response) {
      return new Topic(response.data);
    });
  };
  Task.list = function($scope,params){
      console.log('in tasks.list');
      console.log(params);

      $scope.isLoading = true;
      gapi.client.crmengine.tasks.list(params).execute(function(resp) {
              if(!resp.code){
                console.log('in topics.list looking for pagingation');
                console.log($scope.currentPage);

                 $scope.tasks = resp.items;
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
                 $scope.hilightTask();
              }else {
                 alert("Error, response is: " + angular.toJson(resp));
              }
      });
  };
   Task.insert = function($scope,params){
      $scope.isLoading = true;
      gapi.client.crmengine.tasks.insert(params).execute(function(resp) {
         console.log('in insert TASK resp');
         console.log(resp);
         if(!resp.code){
          console.log(resp);
          // TME_02_11_13 when a note is inserted reload topics
          $scope.listTasks();
          $scope.isLoading = false;

          $scope.$apply();
         // $('#addAccountModal').modal('hide');
         // window.location.replace('#/accounts/show/'+resp.id);
          
         }else{
          console.log(resp.code);
         }
      });
  };

  

return Task;
});

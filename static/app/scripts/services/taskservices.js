var topicservices = angular.module('crmEngine.taskservices',[]);

topicservices.factory('Task', function($http) {
  
  var Task = function(data) {
    angular.extend(this, data);
  }

  
 Task.get = function($scope,id) {
          gapi.client.crmengine.tasks.get(id).execute(function(resp) {
            if(!resp.code){
               $scope.task = resp;
               var url = Task.getUrl($scope.task.about.kind,$scope.task.about.id);
               $scope.uri =url;
               $scope.ListComments();
               $scope.listContributors();
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

 Task.getUrl = function(type,id){
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
          base_url = '/#/live/shows/show/';
          break;
        }

    return base_url+id;

 }

  

return Task;
});
topicservices.factory('Contributor', function($http) {
  
  var Contributor = function(data) {
    angular.extend(this, data);
  }


  Contributor.list = function($scope,params){
      console.log('in tasks.list');
      console.log(params);

      $scope.isLoading = true;
      gapi.client.crmengine.contributors.list(params).execute(function(resp) {
              if(!resp.code){
                
                console.log($scope.currentPage);

                 $scope.contributors = resp.items;
                
                 $scope.isLoading = false;

                 // Call the method $apply to make the update on the scope
                 $scope.$apply();
                 
              }else {
                 alert("Error, response is: " + angular.toJson(resp));
              }
      });
  };
   Contributor.insert = function($scope,params){
      $scope.isLoading = true;
      gapi.client.crmengine.contributors.insert(params).execute(function(resp) {
         console.log('in insert contributors resp');
         console.log(resp);
         if(!resp.code){
          console.log(resp);
          // TME_02_11_13 when a note is inserted reload topics
          $scope.listContributors();
          $scope.isLoading = false;

          $scope.$apply();
         // $('#addAccountModal').modal('hide');
         // window.location.replace('#/accounts/show/'+resp.id);
          
         }else{
          console.log(resp.code);
         }
      });
  };


  

return Contributor;
});

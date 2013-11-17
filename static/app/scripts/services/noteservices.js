var noteservices = angular.module('crmEngine.noteservices',[]);

noteservices.factory('Note', function($http) {
  
  var Note = function(data) {
    angular.extend(this, data);
  }

  
  
  Note.list = function($scope,params){
      console.log('in notes.list');
      console.log(params);

      $scope.isLoading = true;
      gapi.client.crmengine.notes.list(params).execute(function(resp) {
              if(!resp.code){
                console.log('in topics.list looking for pagingation');
                console.log('CurrentPage   is '+$scope.currentPage);

                 $scope.topics = resp.items;
                  if ($scope.currentPage>1){
                      console.log('Should show PREV');
                    $scope.pagination.prev = true;
                  }else{
                      $scope.pagination.prev= false;
                   }
                 if (resp.nextPageToken){
                   var nextPage = $scope.currentPage + 1;
                    // Store the nextPageToken
                   $scope.pages[nextPage] = resp.nextPageToken;
                   $scope.pagination.next = true;

                   }else{
                  $scope.pagination.next = false;
                 }
                 //Loaded succefully
                 $scope.isLoading = false;

                 // Call the method $apply to make the update on the scope
                 $scope.$apply();
                 $scope.hilightTopic();
              }else {
                 alert("Error, response is: " + angular.toJson(resp));
              }
      });
  };

  Note.get = function($scope,id) {
          gapi.client.crmengine.notes.get(id).execute(function(resp) {
            if(!resp.code){
               $scope.note = resp;
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

Note.insert = function($scope,note){
      $scope.isLoading = true;
      gapi.client.crmengine.notes.insert(note).execute(function(resp) {
         console.log('in insert resp');
         console.log(resp);
         if(!resp.code){
          console.log(resp);
          // TME_02_11_13 when a note is inserted reload topics
          $scope.listTopics();
          $scope.isLoading = false;

          $scope.$apply();
         // $('#addAccountModal').modal('hide');
         // window.location.replace('#/accounts/show/'+resp.id);
          
         }else{
          console.log(resp.code);
         }
      });
  };
  

return Note;
});

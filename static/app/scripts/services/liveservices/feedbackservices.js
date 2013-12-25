var feedbackservices = angular.module('crmEngine.feedbackservices',[]);

feedbackservices.factory('Feedback', function($http) {
  
  var Feedback = function(data) {
    angular.extend(this, data);
  }

  
  Feedback.get = function($scope,params) {
          gapi.client.crmengine.feedbacks.get(params).execute(function(resp) {
            if(!resp.code){
               $scope.feedback = resp;
               $scope.isContentLoaded = true;
               
               // Call the method $apply to make the update on the scope
               //$scope.apply();

            }else {
               alert("Error, response is: " + angular.toJson(resp));
            }
            console.log('gapi #end_execute');
          });
  };

  Feedback.list = function($scope,params){
      
      $scope.isLoading = true;
      gapi.client.crmengine.feedbacks.list(params).execute(function(resp) {
              
              if(!resp.code){
                 if (!resp.items){
                    $scope.blankStatefeedback = true;
                  }

                 $scope.feedbacks = resp.items;
                 if ($scope.currentPage>1){
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
                 $scope.isLoading = false;

                 // Call the method $apply to make the update on the scope
                 $scope.$apply();
                 
              }else {
                 alert("Error, response is: " + angular.toJson(resp));
              }
      });
  };

   Feedback.insert = function($scope,params){
      $scope.isLoading = true;
      gapi.client.crmengine.feedbacks.insert(params).execute(function(resp) {
        if(!resp.code){
          console.log(resp);
          
         // $('#newShowModal').modal('hide');
          window.location.replace('#/live/feedbacks/feedback/'+resp.id);
         
          
         }else{
          console.log(resp.code);
         }
      });
  };

  Feedback.patch = function($scope,params){
    gapi.client.crmengine.feedbacks.patch(params).execute(function(resp){

      $scope.feedback = resp;

      $scope.$apply();

    }

      )};
  Feedback.delete = function($scope,id){
    gapi.client.crmengine.feedback.delete(id).execute(function(resp){
        window.location.replace('#/live/feedbacks');
      

    }

    )};

  

return Feedback;
});

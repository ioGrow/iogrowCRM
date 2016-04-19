var commentservices = angular.module('crmEngine.commentservices',[]);

commentservices.factory('Comment', function($http) {

  var Comment = function(data) {
    angular.extend(this, data);
  }



  Comment.list = function($scope,params){
      $scope.isLoading = true;
      gapi.client.crmengine.comments.listv2(params).execute(function(resp) {
              if(!resp.code){
                 $scope.comments = resp.items;
                  $scope.paginationcomment.prev = $scope.currentPagecomment > 1;
                 if (resp.nextPageToken){
                   var nextPage = $scope.currentPagecomment + 1;
                    // Store the nextPageToken
                   $scope.pagescomment[nextPage] = resp.nextPageToken;
                   $scope.paginationcomment.next = true;

                   }else{
                  $scope.paginationcomment.next = false;
                 }
                 //Loaded succefully
                 $scope.isLoading = false;


                 // Call the method $apply to make the update on the scope

                 $scope.hilightComment();
                 $scope.$apply();
                 //$scope.hilightComment();
              }else {
                 alert("Error, response is: " + angular.toJson(resp));
              }
      });
  $scope.isLoading=false;
  };

  Comment.get = function($scope,id) {
          gapi.client.crmengine.comments.get(id).execute(function(resp) {
            if(!resp.code){
               $scope.comment = resp;

               // $scope.isContentLoaded = true;
               // $scope.listTopics(resp);
               // $scope.listTasks();
               // $scope.listEvents();
               // Call the method $apply to make the update on the scope
                $scope.$apply();

            }else {
               alert("Error, response is: " + angular.toJson(resp));
            }
          });
  };

Comment.insert = function($scope,params){
      $scope.isLoading = true;

      gapi.client.crmengine.comments.insertv2(params).execute(function(resp) {
         if(!resp.code){
          // TME_02_11_13 when a note is inserted reload topics
          //$scope.listTopics();
          $scope.isLoading = false;
          $scope.$apply();
           $scope.ListComments();






         }else{
          console.log(resp.code);
         }
      });
      $scope.isLoading=false;
  };


//  HADJI HICHAM - 23/10/2014 Delete comments.
Comment.delete=function($scope,params){
     $scope.isLoading=true;
   gapi.client.crmengine.comments.delete(params).execute(function(resp){
           $scope.isLoading=false;
           $scope.ListComments();
           $scope.$apply();
     

   });


};

// HADJI HICHAM -23/10/2014 PATCH comment.
Comment.patch=function($scope,params){
        $scope.isLoading=true;
   gapi.client.crmengine.comments.patch(params).execute(function(resp){
        $scope.isLoading=false;
        $scope.$apply();

   });

}; 





return Comment;
});

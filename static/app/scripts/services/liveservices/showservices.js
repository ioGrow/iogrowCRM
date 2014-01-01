var showservices = angular.module('crmEngine.showservices',[]);

showservices.factory('Show', function($http) {
  
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
               $scope.listLead();
               $scope.listDocuments();
               $scope.listFeedbacks();
               // Call the method $apply to make the update on the scope
               //$scope.apply();

            }else {
               alert("Error, response is: " + angular.toJson(resp));
            }
            console.log('gapi #end_execute');
          });
  };
  Show.list = function($scope,params){
      

      $scope.isLoading = true;
      gapi.client.crmengine.shows.list(params).execute(function(resp) {
              console.log('Shows');
              console.log(resp);

              if(!resp.code){
                console.log('in topics.list looking for pagingation');
                console.log($scope.currentPage);
                if (!resp.items){
                    $scope.blankStateshow = true;
                  }

                
                if ($scope.currentPage>1){
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
                  $scope.shows = resp.items;
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
           if (resp.type_show=='Show'){
             window.location.replace('#/live/shows/show/'+resp.id);
           };
           if (resp.type_show=='Product_Video'){
             window.location.replace('#/live/product_videos/product_video/'+resp.id);
           };
           if (resp.type_show=='Customer_Story'){
             window.location.replace('#/live/customer_stories/customer_story/'+resp.id);
           };
        
          
         }else{
          console.log(resp.code);
         }
      });
  };

  Show.patch = function($scope,params){
    gapi.client.crmengine.shows.patch(params).execute(function(resp){

      $scope.show = resp;

      $scope.$apply();

    }

      )};
  Show.delete = function($scope,id){
    gapi.client.crmengine.shows.delete(id).execute(function(resp){
        

    }

    )};

  

return Show;
});

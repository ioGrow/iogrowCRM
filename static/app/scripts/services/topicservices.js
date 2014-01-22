var topicservices = angular.module('crmEngine.topicservices',[]);

topicservices.factory('Topic', function($http) {
  
  var Topic = function(data) {
    angular.extend(this, data);
  }

  
  
  Topic.list = function($scope,params){
      console.log('in topics.list');
      console.log(params);

      $scope.isLoading = true;
      gapi.client.crmengine.topics.list(params).execute(function(resp) {
              if(!resp.code){
                console.log('in topics.list looking for pagingation');
                console.log('topicCurrentPage   is '+$scope.topicCurrentPage);

                 $scope.topics = resp.items;
                 
                  if ($scope.topicCurrentPage >1){
                      console.log('Should show PREV');
                    $scope.topicpagination.prev = true;
                  }else{
                      $scope.topicpagination.prev= false;
                   }
                 if (resp.nextPageToken){
                   var nextPage = $scope.topicCurrentPage + 1;
                    // Store the nextPageToken
                   $scope.topicpages[nextPage] = resp.nextPageToken;
                   $scope.topicpagination.next = true;

                   }else{
                  $scope.topicpagination.next = false;
                 }
                 //Loaded succefully
                 $scope.isLoading = false;

                 // Call the method $apply to make the update on the scope
                 $scope.$apply();
                 $scope.hilightTopic();
              }else {
                 if(resp.message=="Invalid token"){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
               };
              }
      });
  };

  Topic.get = function($scope,id) {
          gapi.client.crmengine.topics.get(id).execute(function(resp) {
            if(!resp.code){
               $scope.topic = resp;
               // $scope.isContentLoaded = true;
               // $scope.listTopics(resp);
               // $scope.listTasks();
               // $scope.listEvents();
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
  

return Topic;
});


topicservices.factory('WhoHasAccess', function($http) {
  
  var WhoHasAccess = function(data) {
    angular.extend(this, data);
  }

  
  
  WhoHasAccess.prototype.get = function(){
    var who = this;
    return $http.get('/api/whohasaccess/object/'+who.obj+'/item/'+who.itemid).then(function(response) {
      var results = {}
      console.log('in service');
      console.log(response.data[0].results);
      results.whohasaccess = response.data[0].results;
      results.is_public = response.data[0].is_public;


      return results;
    });

  };
   
  return WhoHasAccess;
});

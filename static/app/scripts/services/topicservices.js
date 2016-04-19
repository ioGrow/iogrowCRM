var topicservices = angular.module('crmEngine.topicservices',[]);

topicservices.factory('Topic', function($http) {
  
  var Topic = function(data) {
    angular.extend(this, data);
  }

  
  Topic.getUrl = function(type,id){
    var base_url = undefined;
    switch (type)
        {
        case 'Note':
          base_url = '/#/notes/show/';
          break;
        case 'Task':
          base_url = '/#/tasks/show/';
          break;
        case 'Event':
          base_url = '/#/events/show/';
          break;
        }

    return base_url+id;
  };

  Topic.list = function($scope,params){
    

      $scope.isLoading = true;
      gapi.client.crmengine.topics.list(params).execute(function(resp) {
              if(!resp.code){
               
                 $scope.topics = resp.items;
                 
                  $scope.topicpagination.prev = $scope.topicCurrentPage > 1;
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
                 if(resp.code==401){
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
               if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
               };
            }
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
     
      results.whohasaccess = response.data[0].results;
      results.is_public = response.data[0].is_public;


      return results;
    });

  };
   
  return WhoHasAccess;
});

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
               alert("Error, response is: " + angular.toJson(resp));
            }
            console.log('gapi #end_execute');
          });
  };
  

return Topic;
});
topicservices.factory('Comment', function($http) {
  
  var Comment = function(data) {
    angular.extend(this, data);
  }

  
  Comment.get = function(id) {
    return $http.get('/api/comments/' + id).then(function(response) {
      return new Comment(response.data);
    });
  };
  Comment.prototype.list = function(){
    var comment = this;
    return $http.get('/api/comments/?search='+comment.topic+'&page='+comment.page).then(function(response) {
      var results = {}
      results.comments = response.data.results;
      results.count = response.data.count;

      return results;
    });

  };
  Comment.prototype.create = function() {
    
    var comment = this;
    return $http.post('/api/comments/', comment).then(function(response) {
      
      comment.id = response.data.id;
      return comment;
    });
  } 
  return Comment;
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
// topicservices.factory('Note', function($http) {
  
//   var Note = function(data) {
//     angular.extend(this, data);
//   }

  
//   Note.get = function(id) {
//     return $http.get('/api/notes/' + id).then(function(response) {
//       return new Note(response.data);
//     });
//   };
//   Note.prototype.list = function(search,page){
//     var topic = this;
//     return $http.get('/api/topics/?topicaboutkind='+topic.topicaboutkind+'&topicaboutitem='+topic.topicaboutitem+'&page='+topic.page).then(function(response) {
//       var results = {}
//       results.topics = response.data.results;
//       results.count = response.data.count;

//       return results;
//     });

//   };

//   Note.insert = function($scope,note){
//       $scope.isLoading = true;
//       gapi.client.crmengine.notes.insert(note).execute(function(resp) {
//          console.log('in insert resp');
//          console.log(resp);
//          if(!resp.code){
//           console.log(resp);
//           // TME_02_11_13 when a note is inserted reload topics
//           $scope.listTopics($scope.account);
//           $scope.isLoading = false;

//           $scope.$apply();
//          // $('#addAccountModal').modal('hide');
//          // window.location.replace('#/accounts/show/'+resp.id);
          
//          }else{
//           console.log(resp.code);
//          }
//       });
//   };

// return Note;
// });

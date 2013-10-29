var topicservices = angular.module('crmEngine.topicservices',[]);

topicservices.factory('Topic', function($http) {
  
  var Topic = function(data) {
    angular.extend(this, data);
  }

  
  Topic.get = function(id) {
    return $http.get('/api/topics/' + id).then(function(response) {
      return new Topic(response.data);
    });
  };
  Topic.prototype.list = function(search,page){
    var topic = this;
  	return $http.get('/api/topics/?topicaboutkind='+topic.topicaboutkind+'&topicaboutitem='+topic.topicaboutitem+'&page='+topic.page).then(function(response) {
      var results = {}
      results.topics = response.data.results;
      results.count = response.data.count;

      return results;
    });

  };
  Topic.prototype.create = function() {
    
    var topic = this;
    return $http.post('/api/accounts/', topic).then(function(response) {
      
      topic.id = response.data.id;
      return topic;
    });
  } 

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
topicservices.factory('Note', function($http) {
  
  var Note = function(data) {
    angular.extend(this, data);
  }

  
  Note.get = function(id) {
    return $http.get('/api/notes/' + id).then(function(response) {
      return new Note(response.data);
    });
  };
  Note.prototype.list = function(search,page){
    var topic = this;
    return $http.get('/api/topics/?topicaboutkind='+topic.topicaboutkind+'&topicaboutitem='+topic.topicaboutitem+'&page='+topic.page).then(function(response) {
      var results = {}
      results.topics = response.data.results;
      results.count = response.data.count;

      return results;
    });

  };

  Note.prototype.create = function() {
    
    var note = this;
    return $http.post('/api/notes/', note).then(function(response) {
      
      note.id = response.data.id;
      return note;
    });
  } 

return Note;
});

topicservices.factory('User', function($http) {
  
  var User = function(data) {
    angular.extend(this, data);
  }

  
  User.prototype.list = function(){
    var user = this;
    return $http.get('/api/invitees/').then(function(response) {
      

      return response.data;
    });

  };

return User;
});

topicservices.factory('MultiTopicLoader', ['Topic','$route', '$q',
    function(Topic) {
  return function() {
    return Topic.list();
  };
}]);

topicservices.factory('TopicLoader', ['Topic', '$route', '$q',
    function(Topic, $route, $q) {
  return function() {
    var delay = $q.defer();
    
    var topicId = $route.current.params.topicId;
    
    
    return Topic.get($route.current.params.topicId);
  };
}]);
topicservices.factory('NoteLoader', ['Note', '$route', '$q',
    function(Note, $route, $q) {
  return function() {
    var delay = $q.defer();
    
    var noteId = $route.current.params.noteId;
    
    
    return Note.get($route.current.params.noteId);
  };
}]);
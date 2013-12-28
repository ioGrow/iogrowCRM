app.controller('FeedBacksListCtrl', ['$scope','$filter','Auth','Feedback',
    function($scope,$filter,Auth,Feedback) {
     $("#id_Feedbacks").addClass("active");
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
     $scope.feedback = {};
    
         

     // What to do after authentication
     $scope.runTheProcess = function(){
          var params = {'limit':7};
          Feedback.list($scope,params);
     };
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
            Auth.refreshToken();
     };
     $scope.listNextPageItems = function(){
        
        
        var nextPage = $scope.currentPage + 1;
        var params = {};
          if ($scope.pages[nextPage]){
            params = {'limit':7,
                      'pageToken':$scope.pages[nextPage]
                     }
          }else{
            params = {'limit':7}
          }
          console.log('in listNextPageItems');
          $scope.currentPage = $scope.currentPage + 1 ; 
          Feedback.list($scope,params);
     }
     $scope.listPrevPageItems = function(){
       
       var prevPage = $scope.currentPage - 1;
       var params = {};
          if ($scope.pages[prevPage]){
            params = {'limit':7,
                      'pageToken':$scope.pages[prevPage]
                     }
          }else{
            params = {'limit':7}
          }
          $scope.currentPage = $scope.currentPage - 1 ;
          Feedback.list($scope,params);
     }
      
     

     $scope.showFeedbackModal = function(){
        console.log('button clicked');
       $scope.feedback.type_feedback = 'DADy';
       $scope.feedback.source = 'Email';
       $scope.feedback.status = 'Pending';
        $('#addFeedModal').modal('show');

      };
      /*$scope.addFeedbackOnKey = function(feedback){
        if(event.keyCode == 13 && feedback){
            $scope.savefeedback(feedback);
        };
     };*/
     // inserting the feedback  
     $scope.savefeedback = function(feedback){
         
            var params ={'name':feedback.name,
                         'content':feedback.content,
                         'type_feedback':feedback.type_feedback,
                         'source':feedback.source,
                         'status':feedback.status}
             Feedback.insert($scope,params);
             $('#addFeedModal').modal('hide');
            };
    

      

     
     
   // Google+ Authentication 
    Auth.init($scope);

    
}]);

app.controller('FeedBacksShowCtrl', ['$scope','$filter', '$route','Auth','Show', 'Topic','Note','Task','Event','WhoHasAccess','User','Feedback','Leadstatus','Lead',
    function($scope,$filter,$route,Auth,Show,Topic,Note,Task,Event,WhoHasAccess,User,Feedback,Leadstatus,Lead) {
      
      $("#id_Feedbacks").addClass("active");
      var tab = $route.current.params.accountTab;
      switch (tab)
        {
        case 'notes':
         $scope.selectedTab = 1;
          break;
        case 'about':
         $scope.selectedTab = 2;
          break;
        case 'contacts':
         $scope.selectedTab = 3;
          break;
        case 'opportunities':
         $scope.selectedTab = 4;
          break;
        case 'cases':
         $scope.selectedTab = 5;
          break;
        default:
        $scope.selectedTab = 1;

        }

     
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.feedback={};
     $scope.currentPage = 01;
     $scope.pages = [];
     //HKA 22.12.2013 Var topic to manage Next & Prev
      $scope.topicCurrentPage=01;
      $scope.topicpagination={};
      $scope.topicpages = [];
      $scope.stage_selected={};
      $scope.leadpagination = {};
     
   
     
     $scope.accounts = [];
     
     
     // What to do after authentication
     $scope.runTheProcess = function(){
          var params = {'id':$route.current.params.feedbackId};
          Feedback.get($scope,params);
          Leadstatus.list($scope,{});
          User.list($scope,{});
     };
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
            Auth.refreshToken();
     };

     $scope.createYoutubePicker = function() {
          console.log('ok should create youtube picker');
          var picker = new google.picker.PickerBuilder().
          addView(google.picker.ViewId.YOUTUBE).
         
          build();
          picker.setVisible(true);
      };
     
     $scope.addTask = function(task){
      
        $('#myModal').modal('hide');
       var params ={'about_kind':'Feedback',
                      'about_item':$scope.feedback.id}

       
        
        if (task.due){

            var dueDate= $filter('date')(task.due,['yyyy-MM-dd']);
            dueDate = dueDate +'T00:00:00.000000'
            params ={'title': task.title,
                      'due': dueDate,
                      'about_kind':'Feedback',
                      'about_item':$scope.feedback.id
            }
     
        }else{
            params ={'title': task.title,
                     'about_kind':'Feedback',
                     'about_item':$scope.feedback.id}
        };
        Task.insert($scope,params);
     }

     $scope.hilightTask = function(){
        console.log('Should higll');
        $('#task_0').effect("highlight","slow");
        $('#task_0').effect( "bounce", "slow" );
       
     }
     $scope.listTasks = function(){
        var params = {'about_kind':'Feedback',
                      'about_item':$scope.feedback.id,
                      'order': '-updated_at',
                      'limit': 5
                      };
        Task.list($scope,params);

     }
     $scope.addEvent = function(ioevent){
      
        $('#newEventModal').modal('hide');
        var params ={}

        console.log('adding a new event');
        
        
        if (ioevent.starts_at){
            if (ioevent.ends_at){
              params ={'title': ioevent.title,
                      'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'ends_at': $filter('date')(ioevent.ends_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'where': ioevent.where
              }

            }else{
              params ={'title': task.title,
                      'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'where': ioevent.where
              }
            }
            console.log('inserting the event');
            console.log(params);
            Event.insert($scope,params);

            
        };
     }
     $scope.hilightEvent = function(){
        console.log('Should higll');
        $('#event_0').effect("highlight","slow");
        $('#event_0').effect( "bounce", "slow" );
       
     }
     

     
    $scope.TopiclistNextPageItems = function(){
        
        
       var nextPage = $scope.topicCurrentPage + 1;
        var params = {};
           if ($scope.topicpages[nextPage]){
            params = {'about_kind':'Feedback',
                      'about_item':$scope.feedback.id,
                      'order': '-updated_at',
                      'limit': 5,
                      'pageToken':$scope.topicpages[nextPage]
                     }
          }else{
            params = {'about_kind':'Feedback',
                      'about_item':$scope.feedback.id,
                      'order': '-updated_at',
                      'limit': 5}
          }
          
          $scope.topicCurrentPage = $scope.topicCurrentPage + 1 ;  
          Topic.list($scope,params);
     }
     $scope.TopiclistPrevPageItems = function(){
       
       var prevPage = $scope.topicCurrentPage - 1;
       var params = {};
          if ($scope.topicpages[prevPage]){
            params = {'about_kind':'Feedback',
                      'about_item':$scope.feedback.id,
                      'order': '-updated_at',
                      'limit': 5,
                      'pageToken':$scope.topicpages[prevPage]
                     }
          }else{
            params = {'about_kind':'Feedback',
                      'about_item':$scope.feedback.id,
                      'order': '-updated_at',
                      'limit': 5}
          }
          $scope.topicCurrentPage = $scope.topicCurrentPage - 1 ;
          Topic.list($scope,params);
         
     };
    $scope.listTopics = function(){
        var params = {'about_kind':'Feedback',
                      'about_item':$scope.feedback.id,
                      'order': '-updated_at',
                      'limit': 5
                      };
        Topic.list($scope,params);

     };
     
     $scope.hilightTopic = function(){
        console.log('Should higll');
       $('#topic_0').effect( "bounce", "slow" );
       $('#topic_0 .message').effect("highlight","slow");
     }

    
     $scope.showModal = function(){
        console.log('button clicked');
        $('#addAccountModal').modal('show');

      };
      
    $scope.addNote = function(note){
      console.log('debug addNote');
      
      var params ={
                  'about_kind': 'Feedback',
                  'about_item': $scope.feedback.id,
                  'title': note.title,
                  'content': note.content
      };
      console.log(params);
      Note.insert($scope,params);
      $scope.note.title = '';
      $scope.note.content = '';
    };
      
//HKA 28.12.2013 Show Lead
$scope.listLead = function(){
  var params = {'show':$scope.feedback.entityKey,
                 'limit':5};
  Lead.list($scope,params);
};

      
// Google+ Authentication 
    Auth.init($scope);


}]);
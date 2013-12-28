app.controller('NoteShowController',['$scope','$filter','$route','Auth','Note','Topic','Comment','User','Contributor',
	 function($scope,$filter,$route,Auth,Note,Topic,Comment,User,Contributor) {
//HKA 14.11.2013 Controller to show Notes and add comments
	 $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
     $scope.paginationcomment = {};
     $scope.currentPagecomment = 01;
     $scope.pagescomment = [];
     
     $scope.notes = [];
     $scope.users = [];
     $scope.user = undefined;
     $scope.slected_memeber = undefined;
     $scope.role= 'participant';

 
      // What to do after authentication
     $scope.runTheProcess = function(){
          var noteId = $route.current.params.noteId;
          var params = {'id':noteId};
          Note.get($scope,params);
          User.list($scope,{});
     };
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
            Auth.refreshToken();
     };
    $scope.listNextPageItemscomment= function(){
        
        
        var nextPage = $scope.currentPagecomment + 1;
        console.log(nextPage);
        var params = {};
          if ($scope.pagescomment[nextPage]){
            params = {'limit':5,
                      'discussion':$scope.note.entityKey,                    
                      'order':'-updated_at',
                      'pageToken':$scope.pagescomment[nextPage]
                     }
            console.log($scope.pagescomment[nextPage]);
          }else{
            params = {'limit':5,
                      'order':'-updated_at',
                      'discussion':$scope.note.entityKey}
          }
          console.log('in listNextPageItems');
          $scope.currentPagecomment = $scope.currentPagecomment + 1 ; 
          Comment.list($scope,params);
     }
     $scope.listPrevPageItemscomment = function(){
       
       var prevPage = $scope.currentPagecomment - 1;
       var params = {};
          if ($scope.pagescomment[prevPage]){
            params = {'limit':5,
                      'discussion':$scope.note.entityKey,
                      'order':'-updated_at',
                      'pageToken':$scope.pagescomment[prevPage]
                     }
          }else{
            params = {'limit':5,
            'discussion':$scope.note.entityKey,
            'order':'-updated_at'}
          }
          $scope.currentPagecomment = $scope.currentPagecomment - 1 ;
          Comment.list($scope,params);
     }
   
     
     $scope.showModal = function(){
        console.log('button clicked');
        $('#addAccountModal').modal('show');

      };

    $scope.addComment = function(comment){

      var params ={
        'discussion':$scope.note.entityKey,
        'content':$scope.comment.content
      };
      Comment.insert($scope,params);
      $scope.comment.content='';
     
      
    };
    $scope.ListComments = function(){
      var params = {'discussion':$scope.note.entityKey,
                     'limit':5,
                      'order':'-updated_at'};
      Comment.list($scope,params);
      
      
    };
//HKA 18.11.2013 highlight the comment
   $scope.hilightComment = function(){
        console.log('Should higll');
       $('#comment_0').effect( "bounce", "slow" );
       $('#comment_0 .message').effect("highlight","slow");
     };

  $scope.selectMember = function(){
        
        $scope.slected_memeber = $scope.user;
        $scope.user = $scope.slected_memeber.google_display_name;

     };
     $scope.addNewContributor = function(selected_user,role){
      console.log('*************** selected user ***********************');
      console.log(selected_user);
      
      var params = {   
                      'discussionKey': $scope.note.entityKey,

                      'type': 'user',
                      'value': selected_user.email,
                      'name': selected_user.google_display_name,
                      'photoLink': selected_user.google_public_profile_photo_url,
                      'role': role


                      // Create Contributor Service
                      // Create contributors.list api
                      //list all contributors after getting the task.
                     
                      
        }  
        console.log('selected member');
        console.log(params); 
        Contributor.insert($scope,params);
     $('#addContributor').modal('hide');
     };
     $scope.listContributors = function(){
      var params = {'discussionKey':$scope.note.entityKey
                     //'order':'-created_at'
                   };
      Contributor.list($scope,params);
      };

    // Google+ Authentication 
    Auth.init($scope);

	}]);

app.controller('DocumentShowController',['$scope','$filter','$route','Auth','Attachement','Note','Comment',
   function($scope,$filter,$route,Auth,Attachement,Note,Comment) {
//HKA 14.11.2013 Controller to show Notes and add comments
   $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
     
     $scope.notes = [];  

 
      // What to do after authentication
     $scope.runTheProcess = function(){
          var noteId = $route.current.params.noteId;
          var params = {'id':$route.current.params.documentId};
          Attachement.get($scope,params);
     };
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
            Auth.refreshToken();
     };
   $scope.listNextPageItems= function(){
        
        
        var nextPage = $scope.currentPage + 1;
        var params = {};
          if ($scope.pages[nextPage]){
            params = {'limit':5,
                      'discussion':$scope.note.entityKey,
                      'pageToken':$scope.pages[nextPage]

                     }
          }else{
            params = {'limit':5}
          }
          console.log('in listNextPageItems');
          $scope.currentPage = $scope.currentPage + 1 ; 
          Comment.list($scope,params);
     }
     $scope.listPrevPageItems = function(){
       
       var prevPage = $scope.currentPage - 1;
       var params = {};
          if ($scope.pages[prevPage]){
            params = {'limit':5,
                      'discussion':$scope.note.entityKey,
                      'pageToken':$scope.pages[prevPage]
                     }
          }else{
            params = {'limit':5}
          }
          $scope.currentPage = $scope.currentPage - 1 ;
          Comment.list($scope,params);
     }
   
     $scope.prepareUrls = function(){

               var url = Note.getUrl($scope.attachment.about.kind,$scope.attachment.about.id);
               $scope.uri =url;
               $scope.attachment.embedLink = $scope.attachment.content;
     };
     
     $scope.showModal = function(){
        console.log('button clicked');
        $('#addAccountModal').modal('show');

      };

    $scope.addComment = function(comment){

      var params ={
        'discussion':$scope.note.entityKey,
        'content':$scope.comment.content
      };
      Comment.insert($scope,params);
      $scope.comment.content='';
     
      
    };
    $scope.ListComments = function(){
      var params = {'discussion':$scope.note.entityKey,
                     'limit':5,
                      'order':'-updated_at'};
      Comment.list($scope,params);
      
      
    };
//HKA 18.11.2013 highlight the comment
   $scope.hilightComment = function(){
        console.log('Should higll');
       $('#comment_0').effect( "bounce", "slow" );
       $('#comment_0 .message').effect("highlight","slow");
     };


    // Google+ Authentication 
    Auth.init($scope);

  }]);
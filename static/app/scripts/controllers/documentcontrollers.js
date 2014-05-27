app.controller('DocumentShowController',['$scope','$filter','$route','Auth','Attachement','Note','Comment',
   function($scope,$filter,$route,Auth,Attachement,Note,Comment) {
//HKA 14.11.2013 Controller to show Notes and add comments
   $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.paginationcomment = {};
     $scope.currentPagecomment = 01;
     $scope.pagescomment = [];
     $scope.attachment={};
     $scope.notes = [];
     $scope.entityKey="";
     $scope.attachment.assignees=[];


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
                  'about':$scope.attachment.entityKey,
                  'content':$scope.comment.content
                };
      Comment.insert($scope,params);
      $scope.comment.content='';


    };
    $scope.ListComments = function(){
      var params = {
                    'about':$scope.attachment.entityKey
                  };

      Comment.list($scope,params);


    };
//HKA 18.11.2013 highlight the comment
   $scope.hilightComment = function(){
        console.log('Should higll');
       $('#comment_0').effect( "bounce", "slow" );
       $('#comment_0 .message').effect("highlight","slow");
     };
   $scope.deleteAttachement = function(){
    var params={'entityKey':$scope.attachment.entityKey};
    Attachement.delete($scope,params);
   }
    // Google+ Authentication
    Auth.init($scope);

  }]);

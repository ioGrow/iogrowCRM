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
     $scope.inProcess=function(varBool,message){
          if (varBool) {
            $scope.nbLoads += 1;
            if ($scope.nbLoads==1) {
              $scope.isLoading=true;
            };
          }else{
            $scope.nbLoads -= 1;
            if ($scope.nbLoads==0) {
               $scope.isLoading=false;
            };
          };
        }       
        $scope.apply=function(){
         
          if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
               $scope.$apply();
              }
              return false;
        }
 $scope.editbeforedelete = function(){
    $('#BeforedeleteAttachement').modal('show');
   };
    $scope.inProcess=function(varBool,message){
          if (varBool) {
            $scope.nbLoads += 1;
            if ($scope.nbLoads==1) {
              $scope.isLoading=true;
            };
          }else{
            $scope.nbLoads -= 1;
            if ($scope.nbLoads==0) {
               $scope.isLoading=false;
            };
          };
        }       
       
        $scope.apply=function(){
         
          if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
               $scope.$apply();
              }
              return false;
        }

      // What to do after authentication
     $scope.runTheProcess = function(){
          var noteId = $route.current.params.noteId;
          var params = {'id':$route.current.params.documentId};
          Attachement.get($scope,params);

     };

     //HADJI HICHAM HH 24/10/2014.
      $scope.inlinePatch=function(kind,edge,name,id,value){

 if(kind=="Comment"){

     var params={
       'id':id,
       'content':value 
     }
     Comment.patch($scope,params);


}

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
          $scope.currentPage += 1 ;
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
          $scope.currentPage -= 1 ;
          Comment.list($scope,params);
     }

     $scope.prepareUrls = function(){



               var url = Note.getUrl($scope.attachment.about.kind,$scope.attachment.about.id);


               $scope.uri =url;
               $scope.attachment.embedLink = $scope.attachment.content;
     };


/*************************/
      $scope.inProcess=function(varBool,message){
          if (varBool) {
            $scope.nbLoads += 1;
            if ($scope.nbLoads==1) {
              $scope.isLoading=true;
            };
          }else{
            $scope.nbLoads -= 1;
            if ($scope.nbLoads==0) {
               $scope.isLoading=false;
 
            };

          };
        }    

/*************************/



     $scope.showModal = function(){
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

    // HADJI HICHAM - 23/10/2014 - delete a comment

$scope.commentDelete=function(commentId){

      params={'id':commentId}
      Comment.delete($scope,params);

}  
//HKA 18.11.2013 highlight the comment
   $scope.hilightComment = function(){
       $('#comment_0').effect( "bounce", "slow" );
       $('#comment_0 .message').effect("highlight","slow");
     };
   $scope.deleteAttachement = function(){
    var params={'entityKey':$scope.attachment.entityKey};
    Attachement.delete($scope,params);
     $('#BeforedeleteAttachement').modal('hide');
   }
    // Google+ Authentication
    Auth.init($scope);

  }]);

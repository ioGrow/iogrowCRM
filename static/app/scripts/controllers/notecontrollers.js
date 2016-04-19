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
		 $scope.isContentLoaded = true;


      // What to do after authentication
     $scope.runTheProcess = function(){
          var noteId = $route.current.params.noteId;
          var params = {'id':noteId};
          Note.get($scope,params);
          User.list($scope,{});
          ga('send', 'pageview', '/notes/show');
          window.Intercom('update');
     };
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
            Auth.refreshToken();
     };
    $scope.listNextPageItemscomment= function(){


        var nextPage = $scope.currentPagecomment + 1;
        var params = {};
          if ($scope.pagescomment[nextPage]){
            params = {'limit':5,
                      'discussion':$scope.note.entityKey,
                      'order':'-updated_at',
                      'pageToken':$scope.pagescomment[nextPage]
                     }
          }else{
            params = {'limit':5,
                      'order':'-updated_at',
                      'discussion':$scope.note.entityKey}
          }
          $scope.currentPagecomment += 1 ;
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
          $scope.currentPagecomment -= 1 ;
          Comment.list($scope,params);
     }


     $scope.showModal = function(){
        $('#addAccountModal').modal('show');

      };

    $scope.addComment = function(comment){

      var params ={
        					'about':$scope.note.entityKey,
        					'content':$scope.comment.content
      };
      Comment.insert($scope,params);
      $scope.comment.content='';


    };
    $scope.ListComments = function(){
      var params = {
										'about':$scope.note.entityKey,
                    'order':'-updated_at'
									};
      Comment.list($scope,params);


    };

    // HKA 08.05.2014 inprocess

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
        };

         $scope.apply=function(){
         
          if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
               $scope.$apply();
              }
              return false;
        }


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

  $scope.selectMember = function(){

        $scope.slected_memeber = $scope.user;
        $scope.user = $scope.slected_memeber.google_display_name;

     };
     $scope.addNewContributor = function(selected_user,role){
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
        Contributor.insert($scope,params);
     $('#addContributor').modal('hide');
     };
     $scope.listContributors = function(){
      var params = {'discussionKey':$scope.note.entityKey
                     //'order':'-created_at'
                   };
      Contributor.list($scope,params);
      };
  // lebdiri arezki 28-06-21-014  inline edite note.title
  $scope.inlinePatch=function(kind,edge,name,id,value){

if(kind=="Note"){
     var params={
      'id':id,
      'title':value
    };
    Note.patch($scope,params);
}else if(kind=="Comment"){

     var params={
       'id':id,
       'content':value 
     }
     Comment.patch($scope,params);


}
 
   

  };

  // lebdiri arezki 28-06-21-014 add modale
  $scope.editNote = function(){
      $scope.NewTitle=$scope.note.title;
      $('#EditNoteModal').modal('show');

     };
  $scope.NoteUpdatedFromModal=function(kind,edge,name,id,value){
    var params={
      'id':id,
      'title':value
    };
    Note.patch($scope,params);
    $scope.note.title=$scope.NewTitle;

  };
  $scope.editbeforedelete = function(){
    
      $('#BeforedeleteNote').modal('show');

     };  

  $scope.deletenote = function(){

    var params={'entityKey':$scope.note.entityKey};
    Note.delete($scope,params);
    $('#BeforedeleteNote').modal('hide');
     
  
 


     };

    // Google+ Authentication
    Auth.init($scope);

	}]);

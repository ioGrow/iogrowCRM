app.controller('EventShowController',['$scope','$filter','$route','Auth','Note','Event','Task','Topic','Comment','User','Contributor','Show','Map',
   function($scope,$filter,$route,Auth,Note,Event,Task,Topic,Comment,User,Contributor,Show,Map) {
//HKA 14.11.2013 Controller to show Events and add comments
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
     $scope.addresses=[];
     $scope.event={};
     $scope.notes = [];
     $scope.users = [];
     $scope.user = undefined;
     $scope.slected_memeber = undefined;
     $scope.role= 'participant';  
     // What to do after authentication
     $scope.runTheProcess = function(){
          var eventid = {'id':$route.current.params.eventId};
          Event.get($scope,eventid);
          User.list($scope,{});
     };
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
            Auth.refreshToken();
     };
     $scope.$watch('event.starts_at', function(newValue, oldValue) {
              $scope.patchDate($scope.event.starts_at);
     });
     $scope.patchDate = function(newValue){
        var starts_at = $filter('date')(newValue,['yyyy-MM-ddTHH:mm:00.000000']);

        var params = {
                    'entityKey':$scope.event.entityKey,
                    'starts_at':starts_at
        };
        if ((!$scope.isLoading) && (params.entityKey != undefined )){
            Event.patch($scope,params);
        }
     }
      $scope.listNextPageItemscomment= function(){
        
         console.log('i am in list next comment page')
        var nextPage = $scope.currentPagecomment + 1;
        
        var params = {};
          if ($scope.pagescomment[nextPage]){
            params = {'limit':5,
                      'discussion':$scope.eventt.entityKey,                    
                       'order':'-updated_at',
                      'pageToken':$scope.pagescomment[nextPage]
                     }
          }else{
            params = {'limit':5,
                      'discussion':$scope.eventt.entityKey,
                      'order':'-updated_at',}
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
                      'discussion':$scope.eventt.entityKey,
                      'order':'-updated_at',
                      'pageToken':$scope.pagescomment[prevPage]
                     }
          }else{
            params = {'limit':5,
            'order':'-updated_at',
            'discussion':$scope.eventt.entityKey}
          }
          $scope.currentPagecomment = $scope.currentPagecomment - 1 ;
          Comment.list($scope,params);
     };
   
     $scope.renderMaps = function(){

          Map.searchLocation($scope,$scope.event.where);
      };
    

     
     $scope.showModal = function(){
        console.log('button clicked');
        $('#addAccountModal').modal('show');

      };

    $scope.addComment = function(comment){

      var params ={
                  'about':$scope.event.entityKey,
                  'content':$scope.comment.content
                };
      Comment.insert($scope,params);
      $scope.comment.content='';
     
      
    };
    $scope.ListComments = function(){
      var params = {
                    'about':$scope.event.entityKey,
                    'limit':7
                   };
      Comment.list($scope,params);
      
      
    };
//HKA 18.11.2013 highlight the comment
   $scope.hilightComment = function(){
        console.log('Should higll');
       $('#comment_0').effect( "bounce", "slow" );
       $('#comment_0 .message').effect("highlight","slow");
     };

 //HKA 02.12.2013 Add Contributor

    $scope.addNewContributor = function(selected_user,role){
      console.log('*************** selected user ***********************');
      console.log(selected_user);
      
      var params = {   
                      'discussionKey': $scope.eventt.entityKey,

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
//HKA 02.12.2013 Select member
$scope.selectMember = function(){
        
        $scope.slected_memeber = $scope.user;
        $scope.user = $scope.slected_memeber.google_display_name;

     };
//HKA 02.12.2013 List contributors
$scope.listContributors = function(){
      var params = {'discussionKey':$scope.eventt.entityKey,
                     'order':'-created_at'};
      Contributor.list($scope,params);
      };
//HKA 20.01.2014 Add 
 $scope.getshow = function(showId){
     var show = Show.get($scope.showId);
     return show;

 }

  // Google+ Authentication 
  Auth.init($scope);
}]);

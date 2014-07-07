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
        
              $scope.patchDate($scope.event.starts_at,"Start");
     });
     $scope.$watch('event.ends_at', function(newValue, oldValue) {

              $scope.patchDate($scope.event.ends_at,"End");
     });
     $scope.patchDate = function(newValue,when){
      if (when=="Start"){
        var starts_at = $filter('date')(newValue,['yyyy-MM-ddTHH:mm:00.000000']);

        var params = {
                    'entityKey':$scope.event.entityKey,
                    'starts_at':starts_at
        };
      }
      if (when=="End"){
        var ends_at = $filter('date')(newValue,['yyyy-MM-ddTHH:mm:00.000000']);

        var params = {
                    'entityKey':$scope.event.entityKey,
                    'ends_at':ends_at
        };
      }
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
         // Map.render($scope);
          Map.destroy();
          console.log("oooooooooo");
          console.log($scope);
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
 // HKA 22.06.2014 Delete Event

 $scope.editbeforedelete = function(){
     $('#BeforedeleteEvent').modal('show');
   };
$scope.deleteEvent = function(){

     var params = {'entityKey':$scope.event.entityKey};
     
     Event.delete($scope, params);
      $('#BeforedeleteEvent').modal('hide');

     };
  $scope.eventDeleted = function(resp){

        window.location.replace('/#/calendar');

     };
// HKA 23.06.2014 update description
  $scope.updateEvent = function(description){
    console.log(description);
    if (description['where']){
      console.log("wheeeeeeeeeeeeeeee");
      var params = {'entityKey':$scope.event.entityKey,
                   'where':description['where']};


    }
     if (description['description']){
      console.log("descrripppppp");
      var params = {'entityKey':$scope.event.entityKey,
                   'description':description['description']};
            
    }
   
 Event.patch($scope,params);

        };

  
  // Google+ Authentication
  Auth.init($scope);
}]);
app.controller('EventListController',['$scope','$filter','$route','Auth','Note','Event','Task','Topic','Comment','User','Contributor','Show','Map',
   function($scope,$filter,$route,Auth,Note,Event,Task,Topic,Comment,User,Contributor,Show,Map) {
//HKA 14.11.2013 Controller to show Events and add comments

   $("ul.page-sidebar-menu li").removeClass("active");
   $("#id_Calendar").addClass("active");

   document.title = "Calendar: Home";
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
     $scope.isContentLoaded = true;
     $scope.title_event="New Event" ;
     $scope.permet_clicking=true ;
     // What to do after authentication

     $scope.runTheProcess = function(){
          var eventid = {'id':$route.current.params.eventId};
          Event.list($scope);
          User.list($scope,{});





     };
     $scope.renderCalendar = function(calendarEventList){

        $('#calendar').fullCalendar({
          header: {
            left: 'prev,next today',
            center: 'title',
            right: 'month,agendaWeek,agendaDay'
          },
          defaultView:'agendaWeek',
          editable: true,
          events: calendarEventList,
          dayClick: function(date,  jsEvent, view) {


               $scope.start_event= moment(date).format('YYYY-MM-DDTHH:mm:00.000000')
               $scope.start_event_draw=date.format();
               $scope.end_event_draw= date.add('hours',1).format();

               $scope.end_event= moment(date.add('hours',1)).format('YYYY-MM-DDTHH:mm:00.000000');
               $scope.$apply();
               
    
            if( $scope.permet_clicking){
              // $scope.end_event=date.add('hours',1).format('YYYY-MM-DDTHH:mm:00.000000');
            var eventObject = {
                    title: $scope.title_event 
                };
                    eventObject.id ="new";
                    eventObject.start = moment($scope.start_event_draw);
               
                   // eventObject.allDay = allDay;
              eventObject.className = $(this).attr("data-class");
    
              $('#calendar').fullCalendar('renderEvent', eventObject, false);     
                   $scope.showEventModal();
               }
                             }, 
      // Triggered when event dragging begins.
       eventDragStart: function( event, jsEvent, ui, view ) { },
       // Triggered when event dragging stops. 
       eventDragStop:function( event, jsEvent, ui, view ) {

           
        },
       // Triggered when dragging stops and the event has moved to a different day/time.
       eventDrop:function( event, revertFunc, jsEvent, ui, view ) { 

                    var params={
                                 'id':event.id,
                                 'starts_at':moment(event.start).format('YYYY-MM-DDTHH:mm:00.000000'),
                                 'ends_at':moment(event.end).format('YYYY-MM-DDTHH:mm:00.000000')
                    }
                 
                console.log(params);
                   Event.patch($scope,params);
               
                
           },

     //Triggered when event resizing begins.
       eventResizeStart:function( event, jsEvent, ui, view ) { },
       //Triggered when event resizing stops.
       eventResizeStop:function( event, jsEvent, ui, view ) { },
       //Triggered when resizing stops and the event has changed in duration.
       eventResize:function( event, jsEvent, ui, view ) { 
       var params={
                                'id':event.id,
                                'starts_at':moment(event.start).format('YYYY-MM-DDTHH:mm:00.000000'),
                                 'ends_at':moment(event.end).format('YYYY-MM-DDTHH:mm:00.000000')
                    }
                    console.log(params);
                    Event.patch($scope,params);
        }
         // the end of initialisation         


        });
     }



     // show event modal 

     $scope.showEventModal= function(){  
     $('#newEventModal').modal('show');
};

// cancel add event operation 

$scope.cancelAddOperation= function(){
  var events =$('#calendar').fullCalendar( 'clientEvents' ,["new"] );
   var event= events[events.length-1];
   
    $('#calendar').fullCalendar( 'removeEvents' ,

 function(event){

    if(event.title == "New Event"){

   return true;
   }
   return false;
  }
      );
    $scope.start_event="" ;
    $scope.end_event="";
     $scope.permet_clicking=true ;
}


// add event operation 


 $scope.addEvent = function(ioevent){
          $scope.permet_clicking=false ;

          var params ={};


        $scope.updateEventRender(ioevent) ;
        $('#newEventModal').modal('hide');


            if(ioevent.title!=""){

              params ={'title': ioevent.title,
                      'starts_at':  $scope.start_event,
                      'ends_at': $scope.end_event,
                      'where': ioevent.where,
                        }
              
            }else{
                 params ={
                      'starts_at':$scope.start_event,
                      'ends_at': $scope.end_event,
                      'where': ioevent.where,
                        }
            };

 


           console.log(params);
          Event.insert($scope,params);
            $scope.ioevent={};

            $scope.start_event="";
            $scope.end_event="";
            
       
     }


// *******************

// update event
$scope.updateEventRender= function(ioevent){
    var events =$('#calendar').fullCalendar( 'clientEvents' ,["new"] );
         events[0].title=ioevent.title;
  $('#calendar').fullCalendar('updateEvent', events[0]);
};
//
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
          console.log("hhhhhhhhhhhhh");
          Map.render($scope);
          //Map.searchLocation($scope,$scope.event.where);
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

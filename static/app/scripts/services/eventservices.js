var eventservices = angular.module('crmEngine.eventservices',[]);

eventservices.factory('Event', function($rootScope) {

  var Event = function(data) {
    angular.extend(this, data);
  }

  

  Event.get = function($scope,id) {
        $scope.isLoading=true;
          gapi.client.crmengine.events.get(id).execute(function(resp) {
            if(!resp.code){
               $scope.event = resp;
               console.log("***********what the what*********");
               console.log($scope.event)
               console.log("**********************************");

               
             
               $scope.isContentLoaded=true;
               $scope.renderMaps();
               // Call the method $apply to make the update on the scope
                $scope.$apply();
                $scope.ListComments();
                $scope.getColaborators();
                console.log($scope.event);
                

            }else {
               if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
               };
            }
            console.log('gapi #end_execute');
            $scope.isLoading = false;
          });
  };

//HADJI HICHAM HH-21/10/2014. get the list of docs attched to event 
Event.get_docs=function($scope,params){
  gapi.client.crmengine.events.get_docs(params).execute(function(resp) {
           if(!resp.code){

          $scope.files=resp.items;
          $scope.$apply();
           }else{
             
           }
        


  });

}



  Event.patch = function($scope,params){

      $scope.isLoading = true;
      gapi.client.crmengine.events.patch(params).execute(function(resp) {

          if(!resp.code){
            console.log(resp)
            
            // for (var k in params){
            //      if (k!='id'&&k!='entityKey'){
            //        $scope.event[k] = resp[k];
            //      }
            // }
            
          
            //$scope.renderMaps();
            $scope.runTheProcess()
            //console.log("working");
            /*$scope.ListComments();
            $scope.listContributors();*/
            $scope.isLoading = false;
           /* $scope.listTags();
            $scope.listTasks();*/
            $scope.$apply();


         }else{
            console.log("not working");
            console.log(resp.message);
             if(resp.message=="Invalid grant"){
              console.log("Invalid grant");
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.listTags();
                $scope.listTasks();
                $scope.$apply();
             };
         }
         $scope.getColaborators();
         $scope.isLoading = false;
      });
  };

  Event.permission=function($scope,params){
      $scope.isLoading = true;

      gapi.client.crmengine.events.permission(params).execute(function(resp) {
            if(!resp.code){
              $scope.isLoading = false;
            }

      });

  };

  Event.list = function($scope,params){


      $scope.isLoading = true;

      gapi.client.crmengine.events.list(params).execute(function(resp) {

              if(!resp.code){



                 $scope.events = resp.items;
                 var calendarEventList = new Array();
                 angular.forEach(resp.items, function(item){
                    var eventSchema = {
                                        'title':item.title,
                                        'url':'/#/events/show/'+item.id.toString(),
                                        'start':item.starts_at,
                                        'end':item.ends_at
                                      };
                    calendarEventList.push(eventSchema);
                 });
                 //$scope.renderCalendar(calendarEventList);
                 /*if ($scope.currentPage>1){
                      console.log('Should show PREV');
                      $scope.pagination.prev = true;
                   }else{
                       $scope.pagination.prev = false;
                   }
                 if (resp.nextPageToken){
                   var nextPage = $scope.currentPage + 1;
                   // Store the nextPageToken
                   $scope.pages[nextPage] = resp.nextPageToken;
                   $scope.pagination.next = true;

                 }else{
                  $scope.pagination.next = false;
                 }
                 */
                 // Loaded succefully
                 $scope.isLoading = false;

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
   Event.insert = function($scope,params){

      $scope.isLoading = true;

      gapi.client.crmengine.events.insertv2(params).execute(function(resp) {
          if (resp.error && resp.error.code == 412){
              window.location.replace($rootScope.subscription_url);
          }
          if(!resp.code){
            //$('#calendar').fullCalendar( 'refetchEvents' );
            if ($scope.events == undefined){
            $scope.events = [];
          }

            $scope.justadded=resp ;
   
            $scope.events.push(resp);
          
            $scope.isLoading = false;
             $scope.permet_clicking=true ;
             // hadji hicham 14-07-2014 . update the event in the calendar after we add it .
         $scope.updateEventRenderAfterAdd();
            $scope.$apply();

         }else{

             $('#newEventModal').modal('hide');
             $('#errorModal').modal('show');
             console.log(resp.message)
             if(resp.message=="Invalid grant"){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
             };
         }
      });
  };
Event.getUrl = function(type,id){
  var base_url = undefined;
    switch (type)
        {
        case 'Account':
          base_url = '/#/accounts/show/';
          break;
        case 'Contact':
          base_url = '/#/contacts/show/';
          break;
        case 'Lead':
          base_url = '/#/leads/show/';
          break;
        case 'Opportunity':
          base_url = '/#/opportunities/show/';
          break;
        case 'Case':
          base_url = '/#/cases/show/';
          break;
        case 'Show':
          base_url = '/#/live/shows/show/';
          break;
          case 'Feedback':
          base_url='/#/live/feedbacks/feedback/';
          break;
        }

    return base_url+id;

 };

 Event.delete = function($scope,params){
    
    $scope.isLoading=true;
    gapi.client.crmengine.events.delete(params).execute(function(resp){
      $scope.eventDeleted();
      $scope.isLoading=false;
      $scope.listEvents();
      $scope.$apply();
    });
    

  };



return Event;
});

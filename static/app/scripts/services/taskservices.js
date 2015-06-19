var topicservices = angular.module('crmEngine.taskservices',[]);

topicservices.factory('Task', function($http) {

  var Task = function(data) {
    angular.extend(this, data);
  }



 Task.get = function($scope,id) {
     $scope.inProcess(true);  
          gapi.client.crmengine.tasks.get(id).execute(function(resp) {
            if(!resp.code){
               $scope.task = resp;
               console.log(resp);
               if($scope.task.about){
                var url = Task.getUrl($scope.task.about.kind,$scope.task.about.id);
               $scope.uri =url;
               }
               $scope.isContentLoaded = true;

               $scope.ListComments();
               $scope.listContributors();
               document.title = "Task: " + $scope.task.title ;
               // $scope.isContentLoaded = true;
               // $scope.listTopics(resp);
               // $scope.listTasks();
               // $scope.listEvents();
               // Call the method $apply to make the update on the scope      
                 $scope.inProcess(false);
                $scope.apply();           
            }else {
               if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoadingTask = false;
                  $scope.inProcess(false);
                $scope.apply();  
               };
            }
          }); 

  };
  
Task.get_docs=function($scope,params){
  $scope.inProcess(true);  
  gapi.client.crmengine.tasks.get_docs(params).execute(function(resp) {
           if(!resp.code){
              $scope.files=resp.items;
               $scope.inProcess(false);
                $scope.apply();  
           }else{
                 $scope.inProcess(false);
                $scope.apply();  
           }
        


  });
}

  Task.patch = function($scope,params){
      $scope.inProcess(true);  
      gapi.client.crmengine.tasks.patch(params).execute(function(resp) {

          if(!resp.code){
            $scope.task = resp;
             $scope.listTags();
             if (!$scope.taskShow) {
              $scope.listTasks();
             };
            $('#EditTaskModal').modal('hide');
                 $scope.inProcess(false);
                $scope.apply();  

         }else{
             $('#EditTaskModal').modal('hide');
             $('#errorModal').modal('show');
             if(resp.message=="Invalid grant"){
              console.log("Invalid grant");
                $scope.refreshToken();
                $scope.listTags();
                $scope.listTasks();
                $scope.inProcess(false);
                $scope.apply();  
             };
         }
      });
  };

  Task.list = function($scope,params,effects){
      $scope.blankStateTask= false;
      $scope.inProcess(true);  
      gapi.client.crmengine.tasks.listv2(params).execute(function(resp) {

              if(!resp.code){
                if (!resp.items){
                    if(!$scope.isFiltering){
                        $scope.blankStateTask= true;
                       
         
                    }
                    $scope.tasks = resp.items;

                   $scope.inProcess(false); 
                   $scope.apply(); 
                  }else{
                 $scope.tasks = resp.items;
                  if ($scope.currentPage>1){
                      $scope.taskpagination.prev = true;
                   }else{
                       $scope.taskpagination.prev = false;
                   }
                 if (resp.nextPageToken){
                   var nextPage = $scope.currentPage + 1;
                   // Store the nextPageToken
                   $scope.pages[nextPage] = resp.nextPageToken;
                   $scope.taskpagination.next = true;

                 }else{
                  $scope.taskpagination.next = false;
                 }
                 // Call the method $apply to make the update on the scope
                 $scope.blankStateTask= false;
                 // $scope.isLoading = false;
                 // $scope.$apply();

               /* $scope.tasks = resp.items;

                // Loaded succefully

                 $scope.isLoading = false;

                 // Call the method $apply to make the update on the scope
                 $scope.$apply();
                 if (effects){
                     $scope.hilightTask();

                 }*/
                  $scope.inProcess(false); 
                   $scope.apply(); 
              }
            }else {
                 if(resp.code==401){
                    $scope.refreshToken();                    
                    $scope.inProcess(false);  
                     $scope.apply();
               };
              }
      });
  };
   Task.insert = function($scope,params){
      $scope.inProcess(true);  

      gapi.client.crmengine.tasks.insertv2(params).execute(function(resp) {


         if(!resp.code){

          if ($scope.tasks == undefined){
            $scope.tasks = [];
          }
            $scope.tasks.push(resp);
            $scope.justaddedtask=resp ;
            $scope.listTags();
           
            if ($scope.selectedTab==2){
              $scope.urgentTasks();
            }else{
               $scope.listTasks();
            }
            $scope.inProcess(false);  
                     $scope.apply();
         }else{
          console.log(resp.code);
          $scope.inProcess(false);  
                     $scope.apply();
         }
      });
  };
Task.delete_assignee=function($scope,edgeKey){
  $scope.inProcess(true);  
  var params= {
                          'entityKey': edgeKey
                      };
gapi.client.crmengine.edges.delete(params).execute(function(resp) {
         if(!resp.code){
         $scope.assignee_deleted();
         $scope.inProcess(false);  
         $scope.apply();

         }else{
         }
      });

};
 Task.getUrl = function(type,id){
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

 }

Task.delete=function($scope,params){
      $scope.inProcess(true);  
       gapi.client. crmengine.tasks.delete(params).execute(function(resp) {
        if ($scope.showPage) {
          window.location.replace('#/tasks');
        }else{
          $scope.listTasks();
          
          $scope.inProcess(false);  
          $scope.apply();
        };       
       });

};
   Task.listMore = function($scope,params){
   $scope.inProcess(true);  
    gapi.client.crmengine.tasks.listv2(params).execute(function(resp) {

            if(!resp.code){

                angular.forEach(resp.items, function(item){
                    $scope.tasks.push(item);
                });
                if ($scope.currentPage>1){
                    $scope.taskpagination.prev = true;
                 }else{
                     $scope.taskpagination.prev = false;
                 }
               if (resp.nextPageToken){
                 var nextPage = $scope.currentPage + 1;
                 // Store the nextPageToken
                 $scope.pages[nextPage] = resp.nextPageToken;
                 $scope.taskpagination.next = true;

               }else{
                $scope.taskpagination.next = false;
               }
                $scope.inProcess(true);  
              $scope.apply();
            }else {
              if(resp.code==401){
              $scope.refreshToken();
               $scope.inProcess(true);  
                $scope.apply();
             };
            }
            console.log('gapi #end_execute');
      });
    

};

  Task.permission=function($scope,params){
    $scope.inProcess(true);  
      gapi.client.crmengine.tasks.permission(params).execute(function(resp) {
          if(!resp.code){
              $scope.inProcess(false);  
              $scope.apply();
            }

      });

  };
return Task;
});



topicservices.factory('Tag', function($http) {

  var Tag = function(data) {
    angular.extend(this, data);
  }

  Tag.attach = function($scope,params,index,tab){

      $scope.inProcess(true,'tag attach');  
      gapi.client.crmengine.tags.attach(params).execute(function(resp) {

         if(!resp.code){
             $scope.tagattached(resp,index,tab);

             // if (callback && typeof(callback) === "function") {  
             //    callback(resp);  
             //   }    
            
            $( window ).trigger( "resize" );
            
            $scope.inProcess(false,'tag attach');  
            $scope.apply();
         // $('#addAccountModal').modal('hide');
         // window.location.replace('#/accounts/show/'+resp.id);
         
         }else{
           
           $scope.inProcess(false,'tag attach');  
           $scope.apply();
         }
      });
  };
  Tag.list = function($scope,params){

      /*$scope.isLoading = true;*/
      $scope.inProcess(true,'tag list');  
      gapi.client.request({
                           'root':ROOT,
                           'path':'/crmengine/v1/tags/list',
                           'method':'POST',
                           'body':params,
                           'callback':(function(resp) {
              if(!resp.code){
                 $scope.tags = resp.items;
                 console.log("eeee"+$scope.tags);
                 console.log($scope.tags);
                 $scope.tagInfoData=resp.items;
                 $scope.inProcess(false,'tag list');  
                 $scope.apply();

              }else {
                 if(resp.code==401){
                    $scope.refreshToken();
                    $scope.inProcess(false,'tag list');  
                    $scope.apply();
                  };
              }
            })
      });
      

  };
  Tag.list_v2 = function($scope,params){
      $scope.inProcess(true);  
      gapi.client.request({
                           'root':ROOT,
                           'path':'/crmengine/v1/tags/list',
                           'method':'POST',
                           'body':params,
                           'callback':(function(resp) {
              if(!resp.code){
                 $scope.tabtags = resp.items;
                 $scope.tagInfoData=resp.items;
                 $scope.inProcess(false,'tag list');  
                 $scope.apply(); 
              }else {
                 if(resp.code==401){
                    $scope.refreshToken();
                    $scope.inProcess(false,'tag list');  
                    $scope.apply(); 
                  };
              }
            })
      });
  };
   Tag.insert = function($scope,params){

      $scope.inProcess(true);  
      gapi.client.request({
                           'root':ROOT,
                           'path':'/crmengine/v1/tags/insert',
                           'method':'POST',
                           'body':params,
                           'callback':(function(resp) {

                       if(!resp.code){
                        
                        if (params["about_kind"]=="topics"){
                          /*$scope.runTheProcess();*/
                          $scope.tagInserted()
                        }
                        

                        // TME_02_11_13 when a note gis inserted reload topics
                        /*$scope.listContributors();*/                                               
                       // $('#addAccountModal').modal('hide');
                       // window.location.replace('#/accounts/show/'+resp.id);
                       if ($scope.fromnewtab){
                        window.location.replace('#/discovers/');
                       }
                       $scope.inProcess(false,'tag list');  
                       $scope.listTags();
                        $scope.apply();

                       }else{
                        $scope.inProcess(false,'tag list');  
                        $scope.apply(); 
                       }
                    })
                    
      });
  };

    Tag.patch = function($scope,params){
      $scope.inProcess(true);  
      gapi.client.crmengine.tags.patch(params).execute(function(resp) {

          if(!resp.code){
            $scope.runTheProcess() ;
            $scope.inProcess(false,'tag list');  
                        $scope.apply();
         }else{
             console.log(resp.message);
             if(resp.message=="Invalid grant"){
                $scope.refreshToken();
                $scope.inProcess(false,'tag list');  
                        $scope.apply();
             };
         }
      });
  };
  Tag.delete = function($scope,params){

    $scope.inProcess(true);  
    gapi.client.crmengine.tags.delete(params).execute(function(resp){
      /*$scope.listTags();*/
      $scope.tagDeleted();     
      $scope.inProcess(false);  
       $scope.apply();
    });
  };

return Tag;
});
topicservices.factory('Contributor', function($http) {

  var Contributor = function(data) {
    angular.extend(this, data);
  }


  Contributor.list = function($scope,params){


      $scope.inProcess(true);  
      gapi.client.crmengine.contributors.list(params).execute(function(resp) {
              if(!resp.code){

                console.log($scope.currentPage);

                 $scope.contributors = resp.items;
                 $scope.inProcess(false,'tag list');  
                        $scope.apply();

              }else {
                 if(resp.code==401){
                $scope.refreshToken();
                $scope.inProcess(false,'tag list');  
                        $scope.apply();
               };
              }
      });

  };
   Contributor.insert = function($scope,params){
      $scope.inProcess(true);  
      gapi.client.crmengine.contributors.insert(params).execute(function(resp) {
         if(!resp.code){
          // TME_02_11_13 when a note is inserted reload topics
          /*$scope.listContributors();*/
         // $('#addAccountModal').modal('hide');
         // window.location.replace('#/accounts/show/'+resp.id);
         $scope.inProcess(false,'tag list');  
                        $scope.apply();

         }else{
          $scope.inProcess(false,'tag list');  
                        $scope.apply();
         }
      });
  };


return Contributor;
});

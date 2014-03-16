var opportunityservices = angular.module('crmEngine.opportunityservices',[]);
 /*****************HKA 20.10.2013 Opportunity services ****************/
//HKA 20.10.2013   Base service (create, delete, get)


opportunityservices.factory('Opportunity', function($http) {
  
  var Opportunity = function(data) {
    angular.extend(this, data);
  }

  
  //HKA .5.112013 Add function get Opportunity
  Opportunity.get = function($scope,id){
    gapi.client.crmengine.opportunities.getv2(id).execute(function(resp){
      if(!resp.code){
        $scope.opportunity = resp;
                // list infonodes
                var renderMap = false;
                if (resp.infonodes){
                    if (resp.infonodes.items){
                        for (var i=0;i<resp.infonodes.items.length;i++)
                        { 
                          if (resp.infonodes.items[i].kind == 'addresses'){
                            renderMap = true;
                          }
                            $scope.infonodes[resp.infonodes.items[i].kind] = resp.infonodes.items[i].items;
                            for (var j=0;j<$scope.infonodes[resp.infonodes.items[i].kind].length;j++)
                              {
                                for (var v=0;v<$scope.infonodes[resp.infonodes.items[i].kind][j].fields.length;v++)
                                  {
                                    $scope.infonodes[resp.infonodes.items[i].kind][j][$scope.infonodes[resp.infonodes.items[i].kind][j].fields[v].field] = $scope.infonodes[resp.infonodes.items[i].kind][j].fields[v].value;
                                  }
                              }
                        }
                        if (renderMap){
                          $scope.renderMaps();
                        }
                    }
                }
                if (resp.topics){
                  $scope.topics = resp.topics.items;
                   
                    if ($scope.topicCurrentPage >1){
                      $scope.topicpagination.prev = true;
                    }else{
                        $scope.topicpagination.prev= false;
                     }
                   if (resp.topics.nextPageToken){
                     var nextPage = $scope.topicCurrentPage + 1;
                      // Store the nextPageToken
                     $scope.topicpages[nextPage] = resp.topics.nextPageToken;
                     $scope.topicpagination.next = true;

                     }else{
                    $scope.topicpagination.next = false;
                   }
                  }
                  
                  
                  if (resp.documents){
                      if (!resp.documents.items){
                        $scope.blankStatdocuments = true;
                      }
                      $scope.documents = resp.documents.items;
                      if ($scope.documentCurrentPage >1){
                          $scope.documentpagination.prev = true;
                      }else{
                           $scope.documentpagination.prev = false;
                      }
                     if (resp.documents.nextPageToken){
                      
                       var nextPage = $scope.documentCurrentPage + 1;
                       // Store the nextPageToken
                       $scope.documentpages[nextPage] = resp.documents.nextPageToken;
                       $scope.documentpagination.next = true;
                       
                     }else{
                      $scope.documentpagination.next = false;
                     }
                  }

                  if (resp.tasks){
                     $scope.tasks = resp.tasks.items;
                  }

                  if (resp.events){
                     $scope.events = resp.events.items;
                  }  

        $scope.isContentLoaded = true;
        // $scope.listTopics(resp);
        // $scope.listTasks();
        // $scope.listEvents();
        // $scope.listDocuments();
        // $scope.listInfonodes();
        
        document.title = "Opportunity: " + $scope.opportunity.name ;
       
        $scope.$apply();
        if (resp.topics){
            $scope.hilightTopic();
        };
        if (resp.tasks){
            $scope.hilightTask();
        }
        if (resp.events){
            $scope.hilightEvent();
        }

      }else {

         if(resp.code==401){
          $scope.refreshToken();;
         };


      }
    });

  };

  //HKA 05.11.2013 Add list function
  Opportunity.list = function($scope,params){
      $scope.isLoading = true;
      gapi.client.crmengine.opportunities.listv2(params).execute(function(resp) {
              if(!resp.code){
                  if (!resp.items){
                    if(!$scope.isFiltering){
                        $scope.blankStateopportunity = true;
                    }
                  }
                 $scope.opportunities = resp.items;
                 if ($scope.oppCurrentPage>1){
                      $scope.opppagination.prev = true;
                   }else{
                       $scope.opppagination.prev = false;
                   }
                 if (resp.nextPageToken){
                   var nextPage = $scope.oppCurrentPage + 1;
                   // Store the nextPageToken
                   $scope.opppages[nextPage] = resp.nextPageToken;
                   $scope.opppagination.next = true;
                   
                 }else{
                  $scope.opppagination.next = false;
                 }
                 // Loaded succefully
                 $scope.isLoading = false;
                 // Call the method $apply to make the update on the scope
                 $scope.$apply();
              }else {

                if(resp.code==401){
                       $scope.refreshToken();;
                           };
                 
              }
      });
  };
  Opportunity.search = function($scope,params){
      gapi.client.crmengine.opportunities.search(params).execute(function(resp) {
          console.log(resp);
           if (resp.items){
              $scope.results = resp.items;
              
              $scope.$apply();
            };
            
      });
  };
    Opportunity.patch = function($scope,params) {
          
          gapi.client.crmengine.opportunities.patch(params).execute(function(resp) {
            if(!resp.code){
               $scope.opportunity = resp;
               $scope.opportunity.stagename= resp.stagename;
               // Call the method $apply to make the update on the scope
                $scope.$apply();

            }else {
               if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
               };
            }
            console.log('opportunities.patch gapi #end_execute');
          });
  };
    //HKA 09.11.2013 Add an opportunity
    Opportunity.insert = function($scope,opportunity){
      $scope.isLoading = true;
      
      gapi.client.crmengine.opportunities.insertv2(opportunity).execute(function(resp) {
         
         if(!resp.code){
          $scope.isLoading = false;
          
          window.location.replace('#/opportunities/show/'+resp.id);
          $('#addOpportunityModal').modal('hide');
          
         }else{
          console.log(resp.message);
             $('#addOpportunityModal').modal('hide');
             $('#errorModal').modal('show');
             if(resp.message=="Invalid grant"){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
             };
         }
      });
  };
Opportunity.delete = function($scope,id){
    gapi.client.crmengine.opportunities.delete(id).execute(function(resp){
        window.location.replace('#/opportunities');
    }
    )};
  

return Opportunity;
});
//HKA 06.11.2013 retrive an Opportunity
opportunityservices.factory('OpportunityLoader',['Opportunity','$route','$q',
  function(Opportunity,$route,$q){
   return function() {
    var delay = $q.defer();
    var opportunityId = $route.current.params.opportunityId;
  return Opportunity.get($route.current.params.opportunityId);
   };  
    

  }]);


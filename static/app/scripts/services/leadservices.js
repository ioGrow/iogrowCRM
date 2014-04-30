var leadservices = angular.module('crmEngine.leadservices',[]);

leadservices.factory('Lead', function($http) {
  
  var Lead = function(data) {
    angular.extend(this, data);
  }

  Lead.get = function($scope,id) {
          gapi.client.crmengine.leads.getv2(id).execute(function(resp) {
            if(!resp.code){
               $scope.lead = resp;
               $scope.isContentLoaded = true;
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
                                    $scope.infonodes[resp.infonodes.items[i].kind][j]['entityKey'] = $scope.infonodes[resp.infonodes.items[i].kind][j].entityKey;
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
                        console.log('Should show PREV');
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
                // $scope.listTopics(resp);
                // $scope.listTasks();
                // $scope.listEvents();
                // $scope.listDocuments();
                // $scope.listInfonodes();
                
                //$scope.renderMaps();
                $scope.email.to = '';
                document.title = "Lead: " + $scope.lead.firstname +' '+ $scope.lead.lastname ;
                angular.forEach($scope.lead.emails, function(value, key){
                  $scope.email.to = $scope.email.to + value.email + ',';
                  
                });
               // Call the method $apply to make the update on the scope
               $scope.$apply();
               if (resp.topics){
                    $scope.hilightTopic();
                };
                // if (resp.tasks){
                //     $scope.hilightTask();
                // }
                // if (resp.events){
                //     $scope.hilightEvent();
                // }
            }else {
               if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
               };
            }
            console.log('gapi #end_execute');
          });
  };
  Lead.patch = function($scope,params) {
          console.log('in leads.patch service');
         
          gapi.client.crmengine.leads.patch(params).execute(function(resp) {
            if(!resp.code){
               $scope.lead = resp;
               $scope.email.to = '';
                angular.forEach($scope.lead.emails, function(value, key){
                  $scope.email.to = $scope.email.to + value.email + ',';
                  
                });
               
               // Call the method $apply to make the update on the scope
                $scope.$apply();

            }else {
               if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
               };
            }
            console.log('leads.patch gapi #end_execute');
          });
  };
  Lead.list = function($scope,params){
     $scope.isLoading = true;
      gapi.client.crmengine.leads.listv2(params).execute(function(resp) {

              if(!resp.code){
                if (!resp.items){
                    if(!$scope.isFiltering){
                        $scope.blankStatelead = true;
                    }
                  }
                 $scope.leads = resp.items;
                  if ($scope.currentPage>1){
                      $scope.leadpagination.prev = true;
                   }else{
                       $scope.leadpagination.prev = false;
                   }
                 if (resp.nextPageToken){
                   var nextPage = $scope.currentPage + 1;
                   // Store the nextPageToken
                   $scope.pages[nextPage] = resp.nextPageToken;
                   $scope.leadpagination.next = true;
                   
                 }else{
                  $scope.leadpagination.next = false;
                 }
                 // Call the method $apply to make the update on the scope
                 $scope.isLoading = false;
                 $scope.$apply();
                 

              }else {
                if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
               };
              }
              console.log('gapi #end_execute');
        });
    
  	

  };
    Lead.listMore = function($scope,params){
     $scope.isLoading = true;
     $scope.$apply();
      gapi.client.crmengine.leads.listv2(params).execute(function(resp) {

              if(!resp.code){
                
                  angular.forEach(resp.items, function(item){
                      $scope.leads.push(item);
                  });
                  if ($scope.currentPage>1){
                      $scope.leadpagination.prev = true;
                   }else{
                       $scope.leadpagination.prev = false;
                   }
                 if (resp.nextPageToken){
                   var nextPage = $scope.currentPage + 1;
                   // Store the nextPageToken
                   $scope.pages[nextPage] = resp.nextPageToken;
                   $scope.leadpagination.next = true;
                   
                 }else{
                  $scope.leadpagination.next = false;
                 }
                 // Call the method $apply to make the update on the scope
                 $scope.isLoading = false;
                 $scope.$apply();
                 

              }else {
                if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
               };
              }
              console.log('gapi #end_execute');
        });
    
    

  };
  Lead.insert = function($scope,lead){
      $scope.isLoading = true;
      gapi.client.crmengine.leads.insertv2(lead).execute(function(resp) {
         
         if(!resp.code){
          $scope.isLoading = false;
          
          if ($scope.leads == undefined){
            $scope.leads = [];
            $scope.blankStatelead = false;
          }
          $scope.leads.push(resp);
          $scope.lead = {};
          $scope.$apply();
          
         }else{
            console.log(resp.message);
             $('#addLeadModal').modal('hide');
             $('#errorModal').modal('show');
             if(resp.message=="Invalid grant"){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
             };
         }
      });
  };
  Lead.convert = function($scope,id){
      $scope.isLoading = true;
      gapi.client.crmengine.leads.convertv2(id).execute(function(resp) {
         
         if(!resp.code){
          $scope.isLoading = false;
          $('#convertLeadModal').modal('hide');
          window.location.replace('#/contacts/show/'+resp.id);
          
         }else{
            console.log(resp.message);
             $('#addLeadModal').modal('hide');
             $('#errorModal').modal('show');
             if(resp.message=="Invalid grant"){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
             };
         }
      });
  };


 Lead.delete = function($scope,params){
    console.log(params);
    gapi.client.crmengine.leads.delete(params).execute(function(resp){
        console.log('i am in delete');
        console.log(resp);
        window.location.replace('#/leads');
      }
    )};

  Lead.search = function($scope,params){
      gapi.client.crmengine.leads.search(params).execute(function(resp) {
          console.log(resp);
           if (resp.items){
              $scope.results = resp.items;
              
              $scope.$apply();
            };
            
      });
  };
  

return Lead;
});


// retrieve a contact
contactservices.factory('LeadLoader', ['Lead', '$route', '$q',
    function(Lead, $route, $q) {
  return function() {
    var delay = $q.defer();
    
    var leadId = $route.current.params.leadId;
    
    
    return Lead.get($route.current.params.leadId);
  };
}]);

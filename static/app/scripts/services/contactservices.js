var contactservices = angular.module('crmEngine.contactservices',[]);
// Base sercice (create, delete, get)

accountservices.factory('Contact', function($http) {
  
  var Contact = function(data) {
    angular.extend(this, data);
  }

  
  Contact.get = function($scope,id) {
          
          gapi.client.crmengine.contacts.getv2(id).execute(function(resp) {
            if(!resp.code){
               $scope.contact = resp;
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
                  
                  if (resp.opportunities){
                      if (!resp.opportunities.items){
                        $scope.blankStateopportunity = true;
                      }
                       $scope.opportunities = resp.opportunities.items;
                       if ($scope.oppCurrentPage>1){
                           $scope.opppagination.prev = true;
                       }else{
                           $scope.opppagination.prev = false;
                       }
                       if (resp.opportunities.nextPageToken){
                         var nextPage = $scope.oppCurrentPage + 1;
                         // Store the nextPageToken
                         $scope.opppages[nextPage] = resp.opportunities.nextPageToken;
                         $scope.opppagination.next = true;
                         
                       }else{
                        $scope.opppagination.next = false;
                       }

                  }

                  if (resp.cases){
                      if (!resp.cases.items){
                        $scope.blankStatecase = true;
                      }
                       $scope.cases = resp.cases.items;
                       if ($scope.caseCurrentPage>1){
                          $scope.casepagination.prev = true;
                       }else{
                          $scope.casepagination.prev = false;
                       }
                     if (resp.cases.nextPageToken){
                       var nextPage = $scope.caseCurrentPage + 1;
                       // Store the nextPageToken
                       $scope.casepages[nextPage] = resp.cases.nextPageToken;
                       $scope.casepagination.next = true;
                       
                     }else{
                      $scope.casepagination.next = false;
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
               //$scope.listInfonodes();
               // $scope.listTopics(resp);
               // $scope.listTasks();
               // $scope.listEvents();
               // $scope.listOpportunities();
               // $scope.listCases();
               // $scope.listDocuments();
               
               //$scope.renderMaps();

              document.title = "Contact: " + $scope.contact.firstname +' ' +$scope.contact.lastname ;
              $scope.email.to = '';
                angular.forEach($scope.contact.emails, function(value, key){
                  $scope.email.to = $scope.email.to + value.email + ',';
                  
                });
               // Call the method $apply to make the update on the scope
                $scope.isLoading = false;
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
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
               };
            }
            console.log('gapi #end_execute');
          });
  };
  Contact.patch = function($scope,params) {
          console.log('in contacts.patch service');
          console.log(params);
          gapi.client.crmengine.contacts.patch(params).execute(function(resp) {
            if(!resp.code){
               $scope.contact = resp;
               $scope.email.to = '';
                angular.forEach($scope.contact.emails, function(value, key){
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
            console.log('Contact.patch gapi #end_execute');
          });
  };
  Contact.list = function($scope,params){
        $scope.isLoading = true;
      gapi.client.crmengine.contacts.listv2(params).execute(function(resp) {

    
              if(!resp.code){
                  
                   if (!resp.items){
                    if(!$scope.isFiltering){
                        $scope.blankStatecontact = true;
                    }
                  }
                 $scope.contacts = resp.items;
                 if ($scope.contactCurrentPage>1){
                      $scope.contactpagination.prev = true;
                   }else{
                       $scope.contactpagination.prev = false;
                   }
                 if (resp.nextPageToken){
                   var nextPage = $scope.contactCurrentPage + 1;
                   // Store the nextPageToken
                   $scope.contactpages[nextPage] = resp.nextPageToken;
                   $scope.contactpagination.next = true;
                   
                 }else{
                  $scope.contactpagination.next = false;
                 }
                 // Loaded succefully
                 $scope.isLoading = false;
                 // Call the method $apply to make the update on the scope
                 $scope.$apply();

              } else {
                 if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
               };
              }
              console.log('gapi #end_execute');
        });
    
  	

  };
  Contact.search = function($scope,params){
      gapi.client.crmengine.contacts.search(params).execute(function(resp) {
           if (resp.items){
              $scope.results = resp.items;
              
              $scope.$apply();
            };
            
      });
  };
  Contact.insert = function($scope,params){
      $scope.isLoading = true;
      gapi.client.crmengine.contacts.insertv2(params).execute(function(resp) {
         
         if(!resp.code){
          $scope.isLoading = false;
          if ($scope.contacts == undefined){
            $scope.contacts = [];
            $scope.blankStatecontact = false;
          }
          $scope.contacts.push(resp);
          $scope.contact = {};
          $scope.searchAccountQuery = '';
          $scope.$apply();
          
         }else{
            console.log(resp.message);
             $('#addAContactModal').modal('hide');
             $('#errorModal').modal('show');
             if(resp.message=="Invalid grant"){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
             };
         }
      });
  };
Contact.delete = function($scope,id){
    gapi.client.crmengine.contacts.delete(id).execute(function(resp){
        window.location.replace('#/contacts');
    }

    )};
  

return Contact;
});


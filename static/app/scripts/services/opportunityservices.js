var opportunityservices = angular.module('crmEngine.opportunityservices',[]);
 /*****************HKA 20.10.2013 Opportunity services ****************/
//HKA 20.10.2013   Base service (create, delete, get)


opportunityservices.factory('Opportunity', function($http) {

  var Opportunity = function(data) {
    angular.extend(this, data);
  }



  //HKA .5.112013 Add function get Opportunity
  Opportunity.get = function($scope,params){
    $scope.inProcess(true);
        
    gapi.client.crmengine.opportunities.getv2(params).execute(function(resp){
      if(!resp.code){
        $scope.opportunity = resp;
        $scope.getColaborators();
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
                                    $scope.infonodes[resp.infonodes.items[i].kind][j]['entityKey'] = $scope.infonodes[resp.infonodes.items[i].kind][j].entityKey;
                                  }
                              }
                        }
                        if (renderMap){
                          $scope.renderMaps();
                        }
                    }
                }
                $scope.getCustomFields('opportunities');
                if (resp.topics){
                  if (params.topics.pageToken){
                     angular.forEach(resp.topics.items, function(item){
                         $scope.topics.push(item);
                     });
                  }
                  else{
                      $scope.topics = resp.topics.items;
                  }

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
                      if (params.documents.pageToken){
                         angular.forEach(resp.documents.items, function(item){
                             $scope.documents.push(item);
                         });
                      }
                      else{
                          $scope.documents = resp.documents.items;
                      }
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
                  }else{
                    $scope.blankStatdocuments = true;
                  }

                  if (resp.tasks){
                     $scope.tasks = resp.tasks.items;
                  }else{
                    $scope.tasks = [];
                  }

                  if (resp.events){
                     $scope.events = resp.events.items;
                  }else{
                    $scope.events = [];
                  }

        $scope.isContentLoaded = true;       
        if (resp.current_stage){
          $scope.opportunity.currentStageSelect = resp.current_stage.name+ ' - ( ' + resp.current_stage.probability + '% )'
        };
          // $scope.listTopics(resp);
        // $scope.listTasks();
        // $scope.listEvents();
        // $scope.listDocuments();
        // $scope.listInfonodes();
        // load opp stages because we need two of them in time        
        document.title = "Opportunity: " + $scope.opportunity.name ;
          if ($scope.opportunity.lead) {
            $scope.searchLeadQuery=$scope.opportunity.lead.firstname+' '+$scope.opportunity.lead.lastname;
           };
          if ($scope.opportunity.contacts) {
             $scope.searchContactQuery=$scope.opportunity.contacts[0].firstname;
          }
         if ($scope.opportunity.account) {
             $scope.searchAccountQuery=$scope.opportunity.account.name;
         };
       
        $scope.apply();
        if (resp.topics && !params.topics.pageToken){
            $scope.hilightTopic();
        };
        // if (resp.tasks){
        //     $scope.hilightTask();
        // }
        // if (resp.events){
        //     $scope.hilightEvent();
        // }
        $scope.inProcess(false);  
        $scope.apply();
        $scope.runStagesList();
        
      }else {

         if(resp.code==401){
          $scope.refreshToken();
          $scope.inProcess(false);  
          $scope.apply();
         };


      }
    });

  };

  //HKA 05.11.2013 Add list function
  Opportunity.list2 = function($scope,params,callback){
        $scope.inProcess(true);
      // Read from the cache
      var resp = iogrow.ioStorageCache.read('opportunities');
      callback(resp);
        gapi.client.crmengine.opportunities.listv3().execute(function(resp) {
            // Update the cache
            iogrow.ioStorageCache.renderIfUpdated('opportunities', resp, callback);

        });
      };
  Opportunity.list = function($scope,params){
      $scope.inProcess(true);
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
                 $scope.inProcess(false);  
                  $scope.apply();
              }else {

                if(resp.code==401){
                       $scope.refreshToken();
                       $scope.inProcess(false);  
                       $scope.apply();
                };

              }
      });
      };
  Opportunity.listMore = function($scope,params){
      $scope.isMoreItemLoading = true;
      $( window ).trigger( "resize" );
      $scope.apply();
      gapi.client.crmengine.opportunities.listv2(params).execute(function(resp) {
              if(!resp.code){
                  angular.forEach(resp.items, function(item){
                      $scope.opportunities.push(item);
                  });
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
                 $scope.isMoreItemLoading = false;
                 // Call the method $apply to make the update on the scope
                 $scope.inProcess(false);  
                 $scope.apply();
              }else {

                if(resp.code==401){
                       $scope.refreshToken();
                       $scope.inProcess(false);  
                       $scope.apply();
                };

              }
      });
  };
  Opportunity.search = function($scope,params){
      gapi.client.crmengine.opportunities.search(params).execute(function(resp) {
           if (resp.items){
              $scope.results = resp.items;

              $scope.inProcess(false);  
               $scope.apply();
            };

      });
};
Opportunity.patch = function($scope,params) {
        trackMixpanelAction('OPPORTUNITY_PATCH');
        $scope.inProcess(true);
         
          gapi.client.crmengine.opportunities.patch(params).execute(function(resp) {
            if(!resp.code){

               for (var k in params){
                 if (k!='id'&&k!='entityKey'){
                   $scope.opportunity[k] = resp[k];
                 }
               }
                if (resp.competitors) {
                    $scope.opportunity.competitors = resp.competitors;
                }
                ;
                if (resp.contacts) {
                    $scope.opportunity.contacts = resp.contacts;
                }
                ;
                console.log('resp after patch');
                console.log(resp);
                console.log($scope.opportunity);
               $scope.inProcess(false);  
               $scope.apply();
            }else {
               if(resp.code==401){
                $scope.refreshToken();
                $scope.inProcess(false);  
                $scope.apply();               
               };
            }
            $scope.getColaborators()
          });
};
    Opportunity.deleteTimeItem = function ($scope, item) {

        $scope.inProcess(true);
        var params = {
            'entityKey': item.entityKey
        }
        gapi.client.crmengine.opportunities.timeline.delete(params).execute(function (resp) {
            if (!resp.code) {
                $scope.timeItemDeleted(item);
                $scope.inProcess(false);
                $scope.apply();
            } else {
                if (resp.code == 401) {
                    $scope.refreshToken();
                    $scope.inProcess(false);
                    $scope.apply();
                }
                ;
            }
          });
};
Opportunity.update_stage = function($scope,params){

    trackMixpanelAction('OPPORTUNITY_UPDATE_STAGE');
    gapi.client.crmengine.opportunities.update_stage(params).execute(function(resp){
      console.log("$scope.isLoading before inProcess true");
      console.log($scope.isLoading);
      $scope.inProcess(true);
      $scope.apply();
      console.log("$scope.isLoading after inProcess true");
      console.log($scope.isLoading);
      console.log("applying");
      if(!resp.code){
         /* console.log("resp.code");
          console.log(params.entityKey);*/
          $scope.stageUpdated(params); 
          console.log("$scope.isLoading before inProcess false");
          console.log($scope.isLoading);
          $scope.inProcess(false);          
          $scope.apply();
          console.log("$scope.isLoading after inProcess false");
          console.log($scope.isLoading);
       }else{
        console.log("error in Update Stage");
         if(resp.code==401){  
          $scope.inProcess(false);
          $scope.apply();
         };
      }
    });
};
    //HKA 09.11.2013 Add an opportunity
Opportunity.insert = function($scope,params){
  trackMixpanelAction('OPPORTUNITY_INSERT');
      $scope.inProcess(true);

      gapi.client.crmengine.opportunities.insertv2(params).execute(function(resp) {

         if(!resp.code){
          $scope.inProcess(false);

          if ($scope.opportunities == undefined){      
            $scope.opportunities = [];
            $scope.blankStateopportunity = false;
          }
          if ($scope.relatedOpp!=true) {
            if ($scope.opportunityInserted){
              $scope.opportunityInserted(resp);
             }
          };    
          $scope.opportunities.push(resp);
         /* $scope.opportunity = {};
          $scope.searchAccountQuery = '';*/
          $scope.inProcess(false);  
          $scope.apply();
          
         }else{
             $('#addOpportunityModal').modal('hide');
             $('#errorModal').modal('show');
             if(resp.message=="Invalid grant"){
                $scope.refreshToken();    
                $scope.inProcess(false);  
          $scope.apply();           
             };
         }
      });
};
Opportunity.delete = function($scope,params){
  trackMixpanelAction('OPPORTUNITY_DELETE');
    $scope.inProcess(true);
    $scope.apply();
      gapi.client.crmengine.opportunities.delete(params).execute(function(resp){
        if ( $scope.relatedOpp==true) {
          console.log("source");
          $scope.oppDeleted(params.entityKey);
        }else{
          if(params.source){
            console.log("source");
            $scope.selectedTab = 5;
            $scope.waterfallTrigger();
            $scope.listOpportunities();

          }else{
            console.log(" non source");
            $scope.oppDeleted(params.entityKey);
          } 
        };
        $scope.inProcess(false);
        $scope.apply();
        
    }
)};

        Opportunity.export = function ($scope, params) {
          trackMixpanelAction('OPPORTUNITY_EXPORT');
        //$("#load_btn").attr("disabled", "true");
        //$("#close_btn").attr("disabled", "true");
        $scope.isExporting = true;
        gapi.client.crmengine.opportunities.export(params).execute(function (resp) {
            if (!resp.code) {
                //$scope.DataLoaded(resp.items)
                console.log("request ssent")

            } else {

            }
        });
    }
    Opportunity.export_key = function ($scope, params) {
        //$("#load_btn").attr("disabled", "true");
        //$("#close_btn").attr("disabled", "true");
        $scope.isExporting = true;
        gapi.client.crmengine.opportunities.export_keys(params).execute(function (resp) {
            if (!resp.code) {
                //$scope.DataLoaded(resp.items)
                console.log("request ssent")

            } else {

            }
        });
    }

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



opportunityservices.factory('Email', function() {

  var Email = function(data) {
    angular.extend(this, data);
  };

  Email.send = function($scope,params,listPage){
      $scope.inProcess(true);
      $scope.sending = true;
      gapi.client.crmengine.emails.send(params).execute(function(resp) {
            $('#sendingEmail').modal('show');
            if(!resp.code){
             console.log("resp.code");
             console.log(resp.code);
             $scope.emailSent= true;
             $scope.sending = false;
             $scope.selectedTab = 1;
             if (!listPage) {
                $scope.listTopics();
                $scope.emailSentConfirmation();
             }else{
                $scope.emailSentConfirmation();
             };             
             
             $scope.inProcess(false);  
             $scope.apply();
            }else{
               $('#errorModal').modal('show');
               if(resp.code==401){
                  $scope.refreshToken();
                  $scope.inProcess(false);  
                 $scope.apply();
                 
               };
         }
     });
  };



return Email;
});

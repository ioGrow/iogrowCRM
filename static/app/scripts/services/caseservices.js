var caseservices = angular.module('crmEngine.caseservices',[]);
// Base sercice (create, delete, get)

accountservices.factory('Case', function() {

  var Case = function(data) {
    angular.extend(this, data);
  };
  Case.get = function($scope,params) {
          $scope.inProcess(true);
          gapi.client.crmengine.cases.getv2(params).execute(function(resp) {
            if(!resp.code){
            
               $scope.casee = resp;
               console.log(resp);
               //$scope.casee.current_status.status = resp.current_status.name;
               
               $scope.isContentLoaded = true;
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
                $scope.getCustomFields('cases');
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

               // $scope.listTopics(resp);
               // $scope.listTasks();
               // $scope.listEvents();
               // $scope.listDocuments();

               document.title = "Case: " + $scope.casee.name ;
               // Call the method $apply to make the update on the scope
                     // $scope.inProcess(false);
                     // $scope.apply();
                     $scope.inProcess(false);  
                        $scope.apply();

            }else {
               if(resp.code==401){
                $scope.refreshToken();
                $scope.inProcess(false);  
                        $scope.apply();

               };
            }
            console.log('gapi get #end_execute');
            $scope.getColaborators();     
          });
         

  };
  Case.search = function($scope,params){
      gapi.client.crmengine.cases.search(params).execute(function(resp) {
           if (resp.items){
              $scope.results = resp.items;

              $scope.apply();
            };

      });
  };

  Case.list = function($scope,params){
      var callback = function (resp) {
              if(!resp.code){

                  if (!resp.items){
                    if(!$scope.isFiltering){
                      $scope.blankStatecase = true;
                      $scope.filterNoResult=false;
                    }else{
                      $scope.filterNoResult=true;
                      $scope.blankStatecase = false;
                    }
                  }else{
                    $scope.filterNoResult=false;
                    $scope.blankStatecase = false;   
                  }
                 
                 $scope.cases = resp.items;

                 if ($scope.caseCurrentPage>1){
                      $scope.casepagination.prev = true;
                   }else{
                       $scope.casepagination.prev = false;
                   }
                 if (resp.nextPageToken){
                   var nextPage = $scope.caseCurrentPage + 1;
                   // Store the nextPageToken
                   $scope.casepages[nextPage] = resp.nextPageToken;
                   $scope.casepagination.next = true;

                 }else{
                  $scope.casepagination.next = false;
                 }
                 $scope.inProcess(false);  
                        $scope.apply();
              }else {
                 if(resp.code==401){
                $scope.refreshToken();
                
                  $( window ).trigger( "resize" );
                  $scope.inProcess(false);  
                        $scope.apply();   
               };
              }
      };
      if ((params.tags) || (params.owner) || (params.order != '-updated_at')) {
          var updateCache = callback;
      } else {
          var updateCache = function (resp) {
              // Update the cache
              iogrow.ioStorageCache.renderIfUpdated('cases', resp, callback);
          };
          var resp = iogrow.ioStorageCache.read('cases');
          callback(resp);
      }
      $scope.inProcess(true);
      $scope.apply();
      gapi.client.crmengine.cases.listv2(params).execute(updateCache);

  };
  Case.listMore = function($scope,params){
      $scope.isMoreItemLoading = true;
      $( window ).trigger( "resize" );
      $scope.apply();
      gapi.client.crmengine.cases.listv2(params).execute(function(resp) {
              if(!resp.code){

                  angular.forEach(resp.items, function(item){
                      $scope.cases.push(item);
                  });
                 if ($scope.caseCurrentPage>1){
                      $scope.casepagination.prev = true;
                   }else{
                       $scope.casepagination.prev = false;
                   }
                 if (resp.nextPageToken){
                   var nextPage = $scope.caseCurrentPage + 1;
                   // Store the nextPageToken
                   $scope.casepages[nextPage] = resp.nextPageToken;
                   $scope.casepagination.next = true;

                 }else{
                  $scope.casepagination.next = false;
                 }
                 // Loaded succefully
                 $scope.isMoreItemLoading = false;
                 // Call the method $apply to make the update on the scope
                 $scope.apply();
              }else {
                 if(resp.code==401){
                $scope.refreshToken();
                $scope.isMoreItemLoading = false;
                $scope.apply();
                 $( window ).trigger( "resize" );
               };
              }
      });
     $scope.isMoreItemLoading=false;

  };
  Case.insert = function($scope,casee){
    trackMixpanelAction('CASE_INSERT');
     $scope.inProcess(true);
      gapi.client.crmengine.cases.insertv2(casee).execute(function(resp) {
          if (resp.error && resp.error.code == 412){
              window.location.replace('/payment');
          }
         if(!resp.code){
          if ($scope.cases == undefined){
            $scope.cases = [];
            $scope.blankStatecase = false;
          }
          $scope.cases.push(resp);
          $scope.casee = {};
          $scope.inProcess(false);
          if ($scope.relatedCase!=true) {
            if ($scope.caseInserted){
              $scope.caseInserted(resp);
            }  
          };
          $scope.inProcess(false);  
                        $scope.apply();

         }else{
             $('#addCaseModal').modal('hide');
             $('#errorModal').modal('show');
             if(resp.code==401){
                $scope.refreshToken();
                $scope.inProcess(false);  
                        $scope.apply();                
             };
         }
      });
  };
  Case.patch = function($scope,params) {
         trackMixpanelAction('CASE_PATCH');
         $scope.inProcess(true);
         $scope.apply();
          gapi.client.crmengine.cases.patch(params).execute(function(resp) {
            if(!resp.code){
                 for (var k in params){
                 if (k!='id'&&k!='entityKey'){
                   $scope.casee[k] = resp[k];
                 }
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
            $scope.getColaborators()
          });
         

  };

  Case.delete = function($scope,id){ 
    trackMixpanelAction('CASE_DELETE');
    $scope.inProcess(true);
    gapi.client.crmengine.cases.delete(id).execute(function(resp){
        if ($scope.relatedCase) {
          $scope.caseDeleted(id.entityKey);
        }else{
          window.location.replace('#/cases');  
        };
        $scope.inProcess(false);  
        $scope.apply();
      }
    )};
    Case.deleteAll = function($scope){ 
      $scope.isLoading=true;
      gapi.client.crmengine.cases.delete_all().execute(function(resp){
          $scope.allCasesDeleted();
          $scope.isLoading=false;  
          $scope.apply();
        }
    )};

    Case.update_status = function($scope,params){
    trackMixpanelAction('CASE_UPDATE_STATUS');
    $scope.inProcess(true);
    gapi.client.crmengine.cases.update_status(params).execute(function(resp){

    });
    $scope.inProcess(false);  
    $scope.apply();
};
        Case.export = function ($scope, params) {
          trackMixpanelAction('CASE_EXPORT');
        //$("#load_btn").attr("disabled", "true");
        //$("#close_btn").attr("disabled", "true");
        $scope.isExporting = true;
        gapi.client.crmengine.cases.export(params).execute(function (resp) {
            if (!resp.code) {
                //$scope.DataLoaded(resp.items)
                console.log("request ssent")

            } else {

            }
        });
    }
    Case.export_key = function ($scope, params) {
        //$("#load_btn").attr("disabled", "true");
        //$("#close_btn").attr("disabled", "true");
        $scope.isExporting = true;
        gapi.client.crmengine.cases.export_keys(params).execute(function (resp) {
            if (!resp.code) {
                //$scope.DataLoaded(resp.items)
                console.log("request ssent")

            } else {

            }
        });
    }

return Case;
});

var caseservices = angular.module('crmEngine.caseservices',[]);
// Base sercice (create, delete, get)

accountservices.factory('Case', function() {

  var Case = function(data) {
    angular.extend(this, data);
  }


  Case.get = function($scope,params) {
          $scope.isLoading = true;
          $scope.$apply();
          gapi.client.crmengine.cases.getv2(params).execute(function(resp) {
            if(!resp.code){
               $scope.casee = resp;
               $scope.isContentLoaded = true;
               $scope.isLoading = false;
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
              $scope.$apply();

            }else {
               if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoading = false;

               };
            }
            console.log('gapi #end_execute');
          });
          $scope.isLoading=false;

  };
  Case.search = function($scope,params){
      gapi.client.crmengine.cases.search(params).execute(function(resp) {
          console.log(resp);
           if (resp.items){
              $scope.results = resp.items;

              $scope.$apply();
            };

      });
  };

  Case.list = function($scope,params){
      $scope.isLoading = true;
      gapi.client.crmengine.cases.listv2(params).execute(function(resp) {
              if(!resp.code){

                  if (!resp.items){
                    if(!$scope.isFiltering){
                        $scope.blankStatecase = true;
                    }
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
                 // Loaded succefully
                 $scope.isLoading = false;
                 // Call the method $apply to make the update on the scope
                 $scope.$apply();
              }else {
                 if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
                  $( window ).trigger( "resize" );
               };
              }
      });
     $scope.isLoading=false;

  };
  Case.listMore = function($scope,params){
      $scope.isMoreItemLoading = true;
      $( window ).trigger( "resize" );
      $scope.$apply();
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
                 $scope.$apply();
              }else {
                 if(resp.code==401){
                $scope.refreshToken();
                $scope.isMoreItemLoading = false;
                $scope.$apply();
                 $( window ).trigger( "resize" );
               };
              }
      });
     $scope.isMoreItemLoading=false;

  };
  Case.insert = function($scope,casee){
     $scope.isLoading = true;
      gapi.client.crmengine.cases.insertv2(casee).execute(function(resp) {

         if(!resp.code){
          $scope.isLoading = false;

          if ($scope.cases == undefined){
            $scope.cases = [];
            $scope.blankStatecase = false;
          }
          $scope.cases.push(resp);
          $scope.casee = {};
          $scope.isLoading = false;
          if ($scope.caseInserted){
              $scope.caseInserted(resp);
          }
          $scope.$apply();

         }else{
          console.log(resp.message);
             $('#addCaseModal').modal('hide');
             $('#errorModal').modal('show');
             if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
             };
         }
      });
     $scope.isLoading=false;

  };
  Case.patch = function($scope,params) {

          gapi.client.crmengine.cases.patch(params).execute(function(resp) {
            if(!resp.code){
                 for (var k in params){
                 if (k!='id'&&k!='entityKey'){
                   $scope.casee[k] = resp[k];
                 }
               }

               // Call the method $apply to make the update on the scope
                $scope.$apply();

            }else {
               if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
               };
            }
            console.log('cases.patch gapi #end_execute');
          });
     $scope.isLoading=false;

  };

  Case.delete = function($scope,id){
    gapi.client.crmengine.cases.delete(id).execute(function(resp){
        window.location.replace('#/cases');
      }
    )};

return Case;
});

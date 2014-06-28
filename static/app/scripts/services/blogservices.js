blogservices = angular.module('blogEngine.blogservices',[]);
// Base sercice (create, delete, get)
blogservices.factory('Article', function($http) {

  var Article = function(data) {
    angular.extend(this, data);
  }


  Article.get = function($scope,params) {
    $scope.isLoading = true;
    $scope.$apply();
          gapi.client.crmengine.accounts.getv2(params).execute(function(resp) {
            if(!resp.code){
               $scope.account = resp;
               if (resp.contacts){
                 if (!resp.contacts.items){
                     $scope.blankStatecontact = true;
                 }
                 if (params.contacts.pageToken){
                    angular.forEach(resp.contacts.items, function(item){
                        $scope.contacts.push(item);
                    });
                 }
                 else{
                    $scope.contacts = resp.contacts.items;
                 }
                 if ($scope.contactCurrentPage>1){
                        $scope.contactpagination.prev = true;
                 }else{

                         $scope.contactpagination.prev = false;
                 }
                 if (resp.contacts.nextPageToken){
                     var nextPage = $scope.contactCurrentPage + 1;
                     // Store the nextPageToken
                     $scope.contactpages[nextPage] = resp.contacts.nextPageToken;
                     $scope.contactpagination.next = true;

                  }else{
                    $scope.contactpagination.next = false;
                  }
                }

                if (resp.logo_img_id){
                    $scope.imageSrc = 'https://docs.google.com/uc?id='+resp.logo_img_id;
                }
                else{
                     $scope.imageSrc = '/static/img/default_company.png';
                }
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


                  if (resp.needs){
                      if (!resp.needs.items){
                        $scope.blankStateneeds = true;
                      }
                       $scope.needs = resp.needs.items;
                       if ($scope.needsCurrentPage>1){
                        $scope.needspagination.prev = true;
                       }else{
                           $scope.needspagination.prev = false;
                       }
                       if (resp.needs.nextPageToken){
                         var nextPage = $scope.needsCurrentPage + 1;
                         // Store the nextPageToken
                         $scope.needspages[nextPage] = resp.needs.nextPageToken;
                         $scope.needspagination.next = true;

                       }else{
                        $scope.needspagination.next = false;
                       }
                  }

                  if (resp.opportunities){
                      if (!resp.opportunities.items){
                        $scope.blankStateopportunity = true;
                      }
                      if (params.opportunities.pageToken){
                         angular.forEach(resp.opportunities.items, function(item){
                             $scope.opportunities.push(item);
                         });
                      }
                      else{
                         $scope.opportunities = resp.opportunities.items;
                      }
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
                       if (params.cases.pageToken){
                          angular.forEach(resp.cases.items, function(item){
                              $scope.cases.push(item);
                          });
                       }
                       else{
                          $scope.cases = resp.cases.items;
                       }
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
                  }

                  if (resp.events){
                     $scope.events = resp.events.items;
                  }

               $scope.isContentLoaded = true;


               $scope.email.to = '';
               document.title = "Account: " + $scope.account.name ;

                angular.forEach($scope.infonodes.emails, function(value, key){
                  $scope.email.to = $scope.email.to + value.email + ',';


                });
               // Call the method $apply to make the update on the scope
                if (resp.topics && !params.topics.pageToken){
                    $scope.hilightTopic();
                };
                // if (resp.tasks){
                //     $scope.hilightTask();
                // }
                // if (resp.events){
                //     $scope.hilightEvent();
                // }
                $scope.renderMaps();
                $scope.isLoading = false;
                $scope.$apply();
            }else {
              alert(resp.message);
               if(resp.code==401){
                console.log('invalid token');
                $scope.refreshToken();

                $scope.isLoading = false;
                $scope.$apply();
             };
            }

          });
  };
  Article.patch = function($scope,params) {
          gapi.client.crmengine.accounts.patch(params).execute(function(resp) {
            if(!resp.code){
                for (var k in params){
                 if (k!='id'&&k!='entityKey'){
                   $scope.account[k] = resp[k];
                 }
               }
               $scope.email.to = '';
                angular.forEach($scope.account.emails, function(value, key){
                  $scope.email.to = $scope.email.to + value.email + ',';

                });

               // Call the method $apply to make the update on the scope
                $scope.$apply();

            }else {
               alert("Error, response is: " + angular.toJson(resp));
            }
            console.log('accounts.patch gapi #end_execute');
          });
  };
  Article.list = function($scope,params){
      $scope.isLoading = true;
      gapi.client.blogengine.articles.list(params).execute(function(resp) {
              if(!resp.code){

                  if (!resp.items){
                    if(!$scope.isFiltering){
                        $scope.blankStateaccount = true;
                    }
                  }


                 $scope.articles = resp.items;
                 console.log($scope.articles);
                 if (resp.nextPageToken){
                   var nextPage = $scope.currentPage + 1;
                   // Store the nextPageToken
                   $scope.pages[nextPage] = resp.nextPageToken;


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
               };
              }
      });
  };
  Article.listMore = function($scope,params){
      $scope.isLoading = true;
      $scope.$apply();
      gapi.client.crmengine.accounts.listv2(params).execute(function(resp) {
              if(!resp.code){

                  angular.forEach(resp.items, function(item){
                      $scope.accounts.push(item);
                  });

                 if ($scope.currentPage>1){
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
  Article.search = function($scope,params){
      console.log(params);
      gapi.client.crmengine.accounts.search(params).execute(function(resp) {

           if (resp.items){
              $scope.accountsResults = resp.items;

              $scope.$apply();
            };

      });
  };
  Article.insert = function($scope,params){
      $scope.isLoading = true;
      gapi.client.crmengine.accounts.insert(params).execute(function(resp) {
         if(!resp.code){
            $scope.accountInserted(resp);
            $scope.isLoading = false;
             $scope.$apply();

         }else{

             $('#addAccountModal').modal('hide');
             $('#errorModal').modal('show');
             if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
             };
         }
      });
  };
  Article.delete = function($scope,id){
    gapi.client.crmengine.accounts.delete(id).execute(function(resp){
        window.location.replace('#/accounts');
      }
    )};

return Article;
});

blogservices.factory('Tag', function($http) {

  var Tag = function(data) {
    angular.extend(this, data);
  }

  Tag.attach = function($scope,params,index){

      $scope.isLoading = true;
      gapi.client.crmengine.tags.attach(params).execute(function(resp) {

         if(!resp.code){
            $scope.isLoading = false;
            $scope.tagattached(resp,index);
            $scope.$apply();
            $( window ).trigger( "resize" );
         // $('#addAccountModal').modal('hide');
         // window.location.replace('#/accounts/show/'+resp.id);

         }else{
          console.log(resp.code);
         }
      });
  };
  Tag.list = function($scope,params){

      $scope.isLoading = true;

      gapi.client.blogengine.tags.list(params).execute(function(resp) {
              if(!resp.code){

                 $scope.tags = resp.items;
                 $scope.tagInfoData=resp.items;


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
   Tag.insert = function($scope,params){

      $scope.isLoading = true;
      gapi.client.crmengine.tags.insert(params).execute(function(resp) {

         if(!resp.code){

          // TME_02_11_13 when a note gis inserted reload topics
          /*$scope.listContributors();*/
          $scope.isLoading = false;
          $scope.listTags();
          $scope.$apply();
         // $('#addAccountModal').modal('hide');
         // window.location.replace('#/accounts/show/'+resp.id);

         }else{
          console.log(resp.code);
         }
      });
  };
    Tag.patch = function($scope,params){
      $scope.isLoading = true;
              console.log('task service');
      gapi.client.crmengine.tags.patch(params).execute(function(resp) {
        console.log(params);
        console.log(resp);
          if(!resp.code){
            $scope.tag = resp;
            $scope.isLoading = false;
            $scope.listTags();
            $scope.listTasks();
            $scope.$apply();
         }else{
             console.log(resp.message);
             if(resp.message=="Invalid grant"){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.listTags();
                $scope.listTasks();
                $scope.$apply();
             };
         }
      });
  };
  Tag.delete = function($scope,params){


    gapi.client.crmengine.tags.delete(params).execute(function(resp){
      $scope.listTags();
      $scope.tagDeleted();
    $scope.$apply();
    });


  };

return Tag;
});

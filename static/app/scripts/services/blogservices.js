blogservices = angular.module('blogEngine.blogservices',[]);
// Base sercice (create, delete, get)
blogservices.factory('Article', function($http) {

  var Article = function(data) {
    angular.extend(this, data);
  }


  Article.get = function($scope,params) {
    $scope.isLoading = true;
          gapi.client.blogengine.articles.get(params).execute(function(resp) {
            if(!resp.code){
                $scope.article = resp;
                $scope.isContentLoaded = true;
                $scope.isLoading = false;
                $scope.articleLoaded();
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
  Article.search = function($scope,params){
      $scope.isLoading = true;
      console.log('$$$$$$');
      console.log(params);
      console.log(gapi.client);
      gapi.client.blogengine.search(params).execute(function(resp) {
              if(!resp.code){

                  if (!resp.items){
                    if(!$scope.isFiltering){
                        $scope.blankStateaccount = true;
                    }
                  }
                 $scope.articles = resp.items;
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
      gapi.client.blogengine.tags.attach(params).execute(function(resp) {

         if(!resp.code){
            $scope.isLoading = false;
            $scope.tagattached(resp,index);
            $scope.$apply();
            $( window ).trigger( "resize" );
         // $('#addAccountModal').modal('hide');
         // window.location.replace('#/accounts/show/'+resp.id);

         }else{
          console.log(resp);
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
      gapi.client.blogengine.tags.insert(params).execute(function(resp) {

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
      gapi.client.blogengine.tags.patch(params).execute(function(resp) {
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


    gapi.client.blogengine.tags.delete(params).execute(function(resp){
      $scope.listTags();
      $scope.tagDeleted();
    $scope.$apply();
    });


  };

return Tag;
});

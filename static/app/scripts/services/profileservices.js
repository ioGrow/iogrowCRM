var profileservices = angular.module('crmEngine.profileservices',[]);
topicservices.factory('Profile', function($http) {

  var Keyword = function(data) {
    angular.extend(this, data);
  }

  Keyword.attach = function($scope,params,index){

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
     $scope.isLoading=false;

  };
  Keyword.list = function($scope,params){

      $scope.isLoading = true;
      gapi.client.request({
                           'root':ROOT,
                           'path':'/crmengine/v1/tags/list',
                           'method':'POST',
                           'body':params,
                           'callback':(function(resp) {
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
            })
      });
      
     $scope.isLoading=false;

  };
   Keyword.insert = function($scope,params){

      $scope.isLoading = true;
      gapi.client.request({
                           'root':ROOT,
                           'path':'/crmengine/v1/tags/insert',
                           'method':'POST',
                           'body':params,
                           'callback':(function(resp) {

                       if(!resp.code){

                        // TME_02_11_13 when a note gis inserted reload topics
                        /*$scope.listContributors();*/
                        $scope.isLoading = false;
                        $scope.listKeywords();
                        $scope.$apply();
                       // $('#addAccountModal').modal('hide');
                       // window.location.replace('#/accounts/show/'+resp.id);

                       }else{
                        console.log(resp.code);
                       }
                       $scope.isLoading=false;
                    })
                    
      });
  };

    Keyword.patch = function($scope,params){
      $scope.isLoading = true;
              console.log('task service');

      gapi.client.crmengine.tags.patch(params).execute(function(resp) {

          if(!resp.code){
            //$scope.tag = resp;
            $scope.isLoading = false;
            $scope.runTheProcess() ;
             //$scope.listKeywords();
            // $scope.listTasks();
            $scope.$apply();
         }else{
             console.log(resp.message);
             if(resp.message=="Invalid grant"){
                $scope.refreshToken();
                $scope.isLoading = false;
                // $scope.listKeywords();
                // $scope.listTasks();
                $scope.$apply();
             };
         }
      });


  };
  Keyword.delete = function($scope,params){


    gapi.client.crmengine.tags.delete(params).execute(function(resp){
      $scope.listKeywords();
      $scope.tagDeleted();
    $scope.$apply();
    });


  };

return Keyword;
});
var profileservices = angular.module('crmEngine.profileservices',[]);
topicservices.factory('Profile', function($http) {

  var Profile = function(data) {
    angular.extend(this, data);
  }

  Profile.attach = function($scope,params,index){

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
  Profile.listKeywords = function($scope,params){

      $scope.isLoading = true;
      gapi.client.request({
                           'root':ROOT,
                           'path':'/crmengine/v1/keywords/list',
                           'method':'POST',
                           'body':params,
                           'callback':(function(resp) {
              if(!resp.code){

                 $scope.keywords = resp.items;
              
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
  Profile.list= function($scope,params){

      $scope.isLoading = true;
      $scope.$apply();
      gapi.client.request({
                           'root':ROOT,
                           'path':'/crmengine/v1/linkedin/get',
                           'method':'POST',
                           'body':params,
                           'callback':(function(resp) {
              if(!resp.code){

                console.log(resp)
              var data =JSON.parse(resp.items);
              if (params.page>1) {
                    $scope.profiles=$scope.profiles.concat(data.results);
                }else {
                    $scope.profiles = data.results;
                };
                if (data.more){
                  $scope.page++;
                }
               
               $scope.more=data.more;
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
      

  };
   Profile.insertKeyword = function($scope,params){

      $scope.isLoading = true;
      gapi.client.request({
                           'root':ROOT,
                           'path':'/crmengine/v1/keywords/insert',
                           'method':'POST',
                           'body':params,
                           'callback':(function(resp) {

                       if(!resp.code){
        
                        data=JSON.parse(resp.results)
                        if(data.satatus=="ok"){
                          alert("is carawlink")
                        }else{
                          $scope.profiles=data.results
                        }
                      $scope.listKeywords($scope,{});
                        $scope.isLoading = false;
                        // $scope.listProfiles();
                        $scope.$apply();
                          $( window ).trigger( "resize" );
                       // $('#addAccountModal').modal('hide');
                       // window.location.replace('#/accounts/show/'+resp.id);

                       }else{
                        console.log(resp.code);
                       }
                       $scope.isLoading=false;
                    })
                    
      });
  };

    Profile.patch = function($scope,params){
      $scope.isLoading = true;

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
  Profile.delete = function($scope,params){

    $scope.isLoading=true;
    gapi.client.crmengine.keywords.delete(params).execute(function(resp){
      $scope.keywords = resp.items;
      $scope.keywordDeleted();
      $scope.isLoading=false;
    $scope.$apply();
    });


  };

return Profile;
});
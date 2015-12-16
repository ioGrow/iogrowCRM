var contactservices = angular.module('crmEngine.infonodeservices',[]);
// Base sercice (create, delete, get)

accountservices.factory('InfoNode', function($http) {

  var InfoNode = function(data) {
    angular.extend(this, data);
  }



  InfoNode.list = function($scope,params){
      console.log('params');
      console.log(params);
      gapi.client.crmengine.infonode.list(params).execute(function(resp) {
            console.log("params");
            console.log(params);
            if(!resp.code){
              var renderMap = false;
              $scope.infonodes=[];
              if(resp.items!=undefined){
                  console.log('test1111');
                  console.log(resp.items);
                  for (var i=0;i<resp.items.length;i++)
                  {
                    if (resp.items[i].kind == 'addresses'){
                      renderMap = true;
                    }
                      console.log('resp.items[i].items');
                      console.log(resp.items[i].items);
                      $scope.infonodes[resp.items[i].kind] = resp.items[i].items;
                      for (var j=0;j<$scope.infonodes[resp.items[i].kind].length;j++)
                        {
                          for (var v=0;v<$scope.infonodes[resp.items[i].kind][j].fields.length;v++)
                            {
                              $scope.infonodes[resp.items[i].kind][j][$scope.infonodes[resp.items[i].kind][j].fields[v].field] = $scope.infonodes[resp.items[i].kind][j].fields[v].value;
                            }
                        }
                  }
              }
              else{
                  console.log('test2222');
                  $scope.infonodes[params.connections] = [];
                 
              }
                
              // Loaded succefully
                 $scope.isLoading = false;
              // Call the method $apply to make the update on the scope
                 $scope.$apply();
                 //$scope.responseCustomFields();
                 console.log($scope.infonodes.customfields);

              } else {
                console.log('test3333');
                 if(resp.message=="Invalid token"){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
               }
              }
               $scope.$apply();
      });
  };
  InfoNode.insertCustom = function($scope,params, customfield){
      $scope.inProcess(true);
      gapi.client.request({
                           'root':ROOT,
                           'path':'/crmengine/v1/infonode/insert',
                           'method':'POST',
                           'body':params,
                           'callback':(function(resp) {
                              if(!resp.code){
                                customfield.infonode_key=resp.entityKey;
                                $scope.inProcess(false);
                                $scope.apply();
                              }else{
                                  $scope.relatedInfonode=null;
                                   if(resp.message=="Invalid grant"){
                                      $scope.refreshToken();
                                      $scope.isLoading = false;
                                      $scope.$apply();
                                   }
                               }
                            })
    });
      
  };
  InfoNode.deleteCustom = function($scope,params){
      $scope.isLoading = true;
      gapi.client.crmengine.infonode.delete(params).execute(function(resp) {
          if(!resp.code){
          $scope.isLoading = false;
          $scope.customfieldDeleted(params.entityKey);
          $scope.$apply();
        }else{
             if(resp.message=="Invalid grant"){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
             }
         }
      });
  };
  InfoNode.insert = function($scope,params){
      console.log("params in infonodes service");
      console.log(params);
      $scope.inProcess(true);
      gapi.client.request({
                           'root':ROOT,
                           'path':'/crmengine/v1/infonode/insert',
                           'method':'POST',
                           'body':params,
                           'callback':(function(resp) {
                            console.log("insert resp");
                            console.log(resp);
          if(!resp.code){
           var tw = new RegExp("twitter");
           var isTwitter = tw.test(resp.fields[0].value);
           var linked = new RegExp("linkedin");
           var isLinkedin = linked.test(resp.fields[0].value);
           if (isTwitter) {
            if ($scope.twProfile) {
              $scope.twProfile.entityKey=resp.entityKey;
            };
           };
           if (isLinkedin) {

            if ($scope.inProfile) {
              $scope.inProfile.entityKey=resp.entityKey;
            };
           };
           
          $scope.inProcess(false);
          $scope.apply();
         $scope.listInfonodes(params.kind);
        }else{
            console.log(resp.message);
            $scope.relatedInfonode=null;
             $('#errorModal').modal('show');
             if(resp.message=="Invalid grant"){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
             };
         }
      })
    });
      
  };
  InfoNode.patch = function($scope,params){
      $scope.isLoading = true;
     gapi.client.request({
                           'root':ROOT,
                           'path':'/crmengine/v1/infonode/patch',
                           'method':'POST',
                           'body':params,
                           'callback':(function(resp) {

                            if(!resp.code){
                              $scope.isLoading = false;
                              $scope.listInfonodes(params.kind);
                            }else{
                                console.log(resp.message);

                                 $('#errorModal').modal('show');
                                 if(resp.message=="Invalid grant"){
                                    $scope.refreshToken();
                                    $scope.isLoading = false;
                                    $scope.$apply();
                                 };
                             }
                        }) });
                        $scope.isLoading=false;
                    };

  InfoNode.delete = function($scope,params){
      $scope.isLoading = true;
      gapi.client.crmengine.infonode.delete(params).execute(function(resp) {
          if(!resp.code){
          $scope.isLoading = false;
          $scope.listInfonodes(params.kind);
          console.log($scope.infonodes.customfields);
          $scope.$apply();
        }else{
             if(resp.message=="Invalid grant"){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
             };
         }
      });
  };

return InfoNode;
});

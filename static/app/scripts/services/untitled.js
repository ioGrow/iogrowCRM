      gapi.client.crmengine.infonode.list(params).execute(function(resp) {
            if(!resp.code){
                  $scope.infonodes=[];
                  if(resp.items!=undefined){
                      for (var i=0;i<resp.items.length;i++)
                      {
                        if (resp.items[i].kind == 'addresses'){
                        }
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
                      $scope.infonodes[params.connections] = [];
                     
                  }
                    
                     $scope.isLoading = false;
                     $scope.$apply();
              } else {
                 if(resp.message=="Invalid token"){
                    $scope.refreshToken();
                    $scope.isLoading = false;
                    $scope.$apply();
                  };
              }
           $scope.$apply();
      });
  };
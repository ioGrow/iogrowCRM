app.controller('SearchFormController', ['$scope','Search','User','$rootScope',
    function($scope,Search,User,$rootScope) {
    $scope.apply=function(){
         
          if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
               $scope.$apply();
              }
              return false;
        }
     if(localStorage["iogrowSearch"]){
        $scope.iogrowSearch=localStorage["iogrowSearch"];
        $rootScope.iogrowSearch=$scope.iogrowSearch;
     }else{
       
       localStorage["iogrowSearch"]=true;
       $scope.iogrowSearch=true;
       $rootScope.iogrowSearch=true
     }
     if (localStorage["linkedSearch"]) {
       $scope.linkedSearch=localStorage["linkedSearch"];
       $rootScope.linkedSearch=$scope.linkedSearch;
     }else{
       localStorage["iogrowSearch"]=true;
       $scope.iogrowSearch=true;
       $rootScope.iogrowSearch=true;
     };    
    $scope.inProcess=function(varBool,message){
          if (varBool) {
            $scope.nbLoads += 1;
             var d = new Date();
            if ($scope.nbLoads==1) {
              $scope.isLoading=true;
            };
          }else{
            var d = new Date();
            $scope.nbLoads -= 1;
            if ($scope.nbLoads==0) {
               $scope.isLoading=false;

            };

          };
        }        
    $scope.iogrowSearchSwitch=function(){
        if ($scope.iogrowSearch) {
          if ($scope.linkedSearch) {
             $scope.iogrowSearch=false;
             localStorage['iogrowSearch']=false;
              $rootScope.iogrowSearch=false;
          };
        }else{
           $scope.iogrowSearch=true;
           localStorage['iogrowSearch']=true;
           $rootScope.iogrowSearch=true;
        };
    }

 // HADJI HICHAM - 08/02/2015
  $scope.createPickerUploader= function(){

          $('#importModal').modal('hide');
          var developerKey = ENV_CONFIG['BROWSER_API_KEY'];
          var docsView = new google.picker.DocsView()
              .setIncludeFolders(true)
              .setSelectFolderEnabled(true);
          var picker = new google.picker.PickerBuilder().
              addView(new google.picker.DocsUploadView().setMimeTypes("image/png,image/jpeg,image/jpg")).
             
              setCallback($scope.uploaderCallback).
              setOAuthToken(window.authResult.access_token).
              setDeveloperKey(developerKey).
              setAppId(ENV_CONFIG['CLIENT_ID']).
              build();
          picker.setVisible(true);
      };

$scope.uploaderCallback=function(data) {


        if (data.action == google.picker.Action.PICKED) {
                if(data.docs){
                       
                        var params={
                                   'fileUrl':data.docs[0].downloadUrl,
                                   'fileId':data.docs[0].id   
                        }

           
                      User.upLoadLogo($scope, params);
                }
        }
      }

     var params ={};
     $scope.results =[];
     $scope.result = undefined;
     $scope.q = undefined;
     $scope.searchQuery = undefined;
     $scope.$watch('searchQuery', function() {

         if($scope.searchQuery!=undefined){
           params['q'] = $scope.searchQuery;
           gapi.client.crmengine.search(params).execute(function(resp) {
              if (resp.items){
                $scope.results = resp.items;
                $scope.$apply();
              };

            });
        }
     });
     $scope.selectResult = function(){
         var url="" ;
        if($scope.searchQuery.type=="Comment"){
            url=Search.getParentUrl($scope.searchQuery.parent_kind,$scope.searchQuery.parent_id);
        }else{
          url = Search.getUrl($scope.searchQuery.type,$scope.searchQuery.id);
      }
        $scope.searchQuery=' ';
        window.location.replace(url);
     };
     $scope.executeSearch = function(searchQuery){
      if (typeof(searchQuery)=='string'){
         window.location.replace('#/search/'+searchQuery);
      }else{
        var url = Search.getUrl($scope.searchQuery.type,$scope.searchQuery.id);
        $scope.searchQuery=' ';
        window.location.replace(url);

      }

     };
//HKA 25.03.2014 update user language
$scope.updatelanguage = function(user){
   $('#EditSetting').modal('hide');
}

}]);
public_blog_app.controller('BlogSearchFormController', ['$scope','Article',
    function($scope,Article) {
     var params ={};
     $scope.results =[];
     $scope.result = undefined;
     $scope.q = undefined;
     $scope.searchQuery = undefined;
     $scope.$watch('searchQuery', function() {

         if($scope.searchQuery!=undefined){
           params['q'] = $scope.searchQuery;
           gapi.client.blogengine.search(params).execute(function(resp) {
              if (resp.items){
                $scope.results = resp.items;
                $scope.$apply();
              };

            });
        }
     });
     $scope.selectResult = function(){
        var url = '/blog/articles/' + $scope.searchQuery.id;
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
   //var params = {'id':$scope.user.id,
   // 'language':user.language};
    console.log('-----------hello user language--------');
   //User.patch($scope,params);
   $('#EditSetting').modal('hide');
}

}]);
app.controller('BlogSearchFormController', ['$scope','Article',
    function($scope,Article) {
     var params ={};
     $scope.results =[];
     $scope.result = undefined;
     $scope.q = undefined;
     $scope.searchQuery = undefined;
     $scope.$watch('searchQuery', function() {

         if($scope.searchQuery!=undefined){
           params['q'] = $scope.searchQuery;
           gapi.client.blogengine.search(params).execute(function(resp) {
              if (resp.items){
                $scope.results = resp.items;
                $scope.$apply();
              };

            });
        }
     });
     $scope.selectResult = function(){
        var url = '/blog/articles/' + $scope.searchQuery.id;
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
   //var params = {'id':$scope.user.id,
   // 'language':user.language};
    console.log('-----------hello user language--------');
   //User.patch($scope,params);
   $('#EditSetting').modal('hide');
}

}]);
app.controller('SearchFormController', ['$scope','Search','User',
    function($scope,Search,User) {


 // HADJI HICHAM - 08/02/2015
  $scope.createPickerUploader= function(){

          $('#importModal').modal('hide');
          var developerKey = 'AIzaSyDHuaxvm9WSs0nu-FrZhZcmaKzhvLiSczY';
          var docsView = new google.picker.DocsView()
              .setIncludeFolders(true)
              .setSelectFolderEnabled(true);
          var picker = new google.picker.PickerBuilder().
              addView(new google.picker.DocsUploadView().setMimeTypes("image/png,image/jpeg,image/jpg")).
             
              setCallback($scope.uploaderCallback).
              setOAuthToken(window.authResult.access_token).
              setDeveloperKey(developerKey).
              setAppId('935370948155-qm0tjs62kagtik11jt10n9j7vbguok9d').
              build();
          picker.setVisible(true);
      };

$scope.uploaderCallback=function(data) {


        if (data.action == google.picker.Action.PICKED) {
                if(data.docs){
                       
                        var params={
                                   'fileUrl':data.docs[0].downloadUrl    
                        }

           
                      User.upLoadLogo($scope, params);
                }
        }
      }



     // if (annyang) {

     //    // Let's define our first command. First the text we expect, and then the function it should call
     //    var commands = {
     //      'go to contacts': function(account) {
     //        window.location.replace('/#/contacts');
     //      },
     //      'go to accounts': function(account) {
     //        window.location.replace('/#/accounts');
     //      },
     //      'go to leads': function(account) {
     //        window.location.replace('/#/leads');
     //      },
     //      'go to opportunities': function(account) {
     //        window.location.replace('/#/opportunities');
     //      },
     //      'go to cases': function(account) {
     //        window.location.replace('/#/cases');
     //      },
     //      'go to tasks': function(account) {
     //        window.location.replace('/#/tasks');
     //      },
     //      'search :account contacts': function(account) {
     //        $scope.searchQuery = account + ' and type:Contact';


     //        $scope.$apply();
     //        $scope.executeSearch($scope.searchQuery);
     //      },
     //      'search *term': function(term) {
     //        $scope.searchQuery = term;


     //        $scope.$apply();
     //        $scope.executeSearch($scope.searchQuery);
     //      }

     //    };


     //    // Add our commands to annyang
     //    annyang.addCommands(commands);

     //    // Start listening. You can call this here, or attach this call to an event, button, etc.
     //    // annyang.start();
     //  }
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
   //var params = {'id':$scope.user.id,
   // 'language':user.language};
    console.log('-----------hello user language--------');
   //User.patch($scope,params);
   $('#EditSetting').modal('hide');
}

}]);


app.controller('SearchShowController', ['$scope','$route', 'Auth','Search','User',
    function($scope,$route,Auth,Search,User) {
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
      $scope.inProcess=function(varBool,message){
          if (varBool) {   
            if (message) {
              console.log("starts of :"+message);
             
            };
            $scope.nbLoads=$scope.nbLoads+1;
            if ($scope.nbLoads==1) {
              $scope.isLoading=true;
            };
          }else{
            if (message) {
              console.log("ends of :"+message);
            };
            $scope.nbLoads=$scope.nbLoads-1;
            if ($scope.nbLoads==0) {
               $scope.isLoading=false;
            };
          };
        }       
        $scope.apply=function(){
         
          if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
               $scope.$apply();
              }
              return false;
        }
     // What to do after authentication
     $scope.runTheProcess = function(){
          var params = {'q':$route.current.params.q};
          Search.list($scope,params);
          ga('send', 'pageview', '/search');
     };
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
          Auth.refreshToken();
     };

     $scope.listNextPageItems = function(){
        var nextPage = $scope.currentPage + 1;
        var params = {};
          if ($scope.pages[nextPage]){
            params = {'q':$route.current.params.q,
                      'limit':7,

                      'pageToken':$scope.pages[nextPage]
                     }
          }else{
            params = {'q':$route.current.params.q,
                      'limit':7}
          }

          $scope.currentPage = $scope.currentPage + 1 ;
          Search.list($scope,params);
     };
     $scope.listPrevPageItems = function(){
       var prevPage = $scope.currentPage - 1;
       var params = {};
          if ($scope.pages[prevPage]){
            params = { 'q':$route.current.params.q,
                      'limit':7,

                      'pageToken':$scope.pages[prevPage]
                     }
        }else{
            params = {'q':$route.current.params.q,
                      'limit':7}
          }
          $scope.currentPage = $scope.currentPage - 1 ;
          Search.list($scope,params);
     };


//HKA 25.03.2014 update user language
$scope.updatelanguage = function(user,idUser){
  console.log(user.language);
  console.log('i am here');

  var params = {'id':idUser,
     'language':user.language};
   console.log('-----------hello user language--------');
   console.log(params);
   User.patch($scope,params);
   $('#EditSetting').modal('hide');
}
     // Google+ Authentication
     Auth.init($scope);

}]);

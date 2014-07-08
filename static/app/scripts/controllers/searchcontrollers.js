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
     if (annyang) {

        // Let's define our first command. First the text we expect, and then the function it should call
        var commands = {
          'go to contacts': function(account) {
            window.location.replace('/#/contacts');
          },
          'go to accounts': function(account) {
            window.location.replace('/#/accounts');
          },
          'go to leads': function(account) {
            window.location.replace('/#/leads');
          },
          'go to opportunities': function(account) {
            window.location.replace('/#/opportunities');
          },
          'go to cases': function(account) {
            window.location.replace('/#/cases');
          },
          'go to tasks': function(account) {
            window.location.replace('/#/tasks');
          },
          'search :account contacts': function(account) {
            $scope.searchQuery = account + ' and type:Contact';


            $scope.$apply();
            $scope.executeSearch($scope.searchQuery);
          },
          'search *term': function(term) {
            $scope.searchQuery = term;


            $scope.$apply();
            $scope.executeSearch($scope.searchQuery);
          }

        };


        // Add our commands to annyang
        annyang.addCommands(commands);

        // Start listening. You can call this here, or attach this call to an event, button, etc.
        // annyang.start();
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
      console.log('You are welcome On the morning day');
        var url = Search.getUrl($scope.searchQuery.type,$scope.searchQuery.id);
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

     // What to do after authentication
     $scope.runTheProcess = function(){
          var params = {'limit':7,'q':$route.current.params.q};
          Search.list($scope,params);
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

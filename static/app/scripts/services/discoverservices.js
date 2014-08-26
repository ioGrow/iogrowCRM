var discoverservices = angular.module('crmEngine.discoverservices',[]);
// Base sercice (create, delete, get)
discoverservices.factory('Conf', function($location) {
    function getRootUrl() {
        var rootUrl = $location.protocol() + '://' + $location.host();
        if ($location.port())
            rootUrl += ':' + $location.port();
        return rootUrl;
    }
    ;
    return {
        'clientId': '935370948155-a4ib9t8oijcekj8ck6dtdcidnfof4u8q.apps.googleusercontent.com',
        'apiBase': '/api/',
        'rootUrl': getRootUrl(),
        'scopes': 'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/calendar',
        'requestvisibleactions': 'http://schemas.google.com/AddActivity ' +
                'http://schemas.google.com/ReviewActivity',
        'cookiepolicy': 'single_host_origin',
        // Urls
        'dicovers': '/#/discovers/show/',
        'contacts': '#/contacts/show/',
        'leads': '/#/leads/show/',
        'opportunities': '/#/opportunities/show/',
        'cases': '/#/cases/show/',
        'shows': '/#/shows/show/'
    };
});
discoverservices.factory('Discover', function($http) {

  var Discover = function(data) {
    angular.extend(this, data);
  }


  Discover.get_best_tweets = function($scope) {
        //var keywords=["android","mobile"];
        var keyw={"value":"android"};
        $scope.keywords=keyw.value;
        console.log($scope.keywords);
        //console.log(keywords);
          gapi.client.crmengine.twitter.get_best_tweets(keyw).execute(function(resp) {
            if(!resp.code){
               $scope.tweetsFromApi=resp.items;
               $scope.tweets=resp.items;
               console.log($scope.tweets);
               console.log("bestttttt");
               // Call the method $apply to make the update on the scope
               $scope.$apply();
            }else {
               if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
               };
            }
            console.log('gapi #end_execute');
          });
  };

  Discover.get_recent_tweets = function($scope) {
        //var keywords=["android","mobile"];

        var keyw={"value":"android"};
        $scope.keywords=keyw.value;
        console.log($scope.keywords);
        //console.log(keywords);
          gapi.client.crmengine.twitter.get_recent_tweets(keyw).execute(function(resp) {
            if(!resp.code){
               $scope.tweetsFromApi=resp.items;
               $scope.tweets=resp.items;
               console.log($scope.tweets);
               // Call the method $apply to make the update on the scope
               $scope.$apply();
            }else {
               if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
               };
            }
            console.log('gapi #end_execute');
          });
  };


 




return Discover;
});

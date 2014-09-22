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



   Discover.details="ll";
  Discover.get_best_tweets = function($scope,list_of_tags) {
        //var keywords=["android","mobile"];
        var keyw={"value":"android"};
        $scope.keywords=keyw.value;
        $scope.isLoadingtweets = true;


        //console.log(keywords);
          gapi.client.crmengine.twitter.get_best_tweets(list_of_tags).execute(function(resp) {
            if(!resp.code){
               $scope.tweetsFromApi=resp.items;
               $scope.tweets=resp.items;
               $scope.isLoadingtweets = false;
               // Call the method $apply to make the update on the scope
               $scope.$apply();
            }else {
               if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoadingtweets = false;
                $scope.$apply();
               };
            }
            console.log('gapi #end_execute');
          });
  };

  Discover.get_recent_tweets = function($scope,list_of_tags) {
        $scope.isLoadingtweets = true;

        
        console.log($scope.isLoading );
        //console.log(keywords);
          gapi.client.crmengine.twitter.get_tweets_from_datastore(list_of_tags).execute(function(resp) {
            if(!resp.code){
               $scope.tweetsFromApi=resp.items;
               $scope.tweets=resp.items;
               console.log("herrrrrrrrrrrrrrrrrrrrrr");
               console.log($scope.tweets);
               $scope.isLoadingtweets = false;
               // Call the method $apply to make the update on the scope
               $scope.$apply();
            }else {
               if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoadingtweets = false;
                $scope.$apply();
               };
            }
            console.log('gapi #end_execute');
          });
  };

Discover.tag_insert=function($scope,params){
    //Tag.insert($scope,params);
    gapi.client.crmengine.tags.insert(params).execute(function(resp) {
            if(!resp.code){
               
               $scope.initialize(resp.items); 
               $scope.isLoadingtweets = false;
               // Call the method $apply to make the update on the scope
               $scope.$apply();
            }else {
               if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoadingtweets = false;
                $scope.$apply();
               };
            }
            console.log('gapi #end_execute');
          });
    $scope.isLoadingtweets = true;
    gapi.client.crmengine.twitter.get_tweets_from_datastore({"value":params.name}).execute(function(resp) {
            if(!resp.code){
               $scope.tweetsFromApi=resp.items;
               $scope.tweets=resp.items;
               console.log("herrrrrrrrrrrrrrrrrrrrrr");
               console.log($scope.tweets);
               $scope.isLoadingtweets = false;
               // Call the method $apply to make the update on the scope
               $scope.$apply();
            }else {
               if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoadingtweets = false;
                $scope.$apply();
               };
            }
            console.log('gapi #end_execute');
          });

};

 Discover.get_location=function($scope){
      var val={"value":"alger"};
      var keyw=[];
      for (id in $scope.tweets){
        if ($scope.tweets[id].author_location){
        keyw.push($scope.tweets[id].author_location);
        }
      }
      list_of_locations={"value":keyw};

    gapi.client.crmengine.twitter.get_location_tweets(list_of_locations).execute(function(resp) {
            if(!resp.code){
               
               $scope.initialize(resp.items); 
               $scope.isLoadingtweets = false;
               // Call the method $apply to make the update on the scope
               $scope.$apply();
            }else {
               if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoadingtweets = false;
                $scope.$apply();
               };
            }
            console.log('gapi #end_execute');
          });
 };

 Discover.get_tweets_details=function($scope,tweet_id,topic){
    var id={"tweet_id": tweet_id,"topic": topic};
    gapi.client.crmengine.twitter.get_tweets_details(id).execute(function(resp) {
            if(!resp.code){
               
              $scope.tweet_details=resp.items;
              console.log($scope.tweet_details);
               // Call the method $apply to make the update on the scope
               $scope.$apply();
            }else {
               if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoadingtweets = false;
                $scope.$apply();
               };
            }
            console.log('gapi #end_execute');
          });
 };



return Discover;
});

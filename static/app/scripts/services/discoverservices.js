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



 

  Discover.get_recent_tweets = function($scope,params) {
        $scope.isLoadingtweets = true;
        gapi.client.request({
                           'root':ROOT,
                           'path':'/crmengine/v1/twitter/get_tweets_from_datastore',
                           'method':'POST',
                           'body':params,
                           'callback':(function(resp) {
            if(!resp.code){
                if (params.pageToken) {
                    angular.forEach(resp.items, function(item) {
                        $scope.tweets.push(item);
                    });
                }else {
                    $scope.tweets = resp.items;
                };
                $scope.pageToken = resp.nextPageToken;
                $scope.isLoadingtweets = false;
                if(resp.is_crawling){
                   $scope.listNewItems();
                }
                if(!resp.nextPageToken){
                  $scope.pageToken = null;
                }
                $scope.isLoadingtweets = false;
               // Call the method $apply to make the update on the scope
               $scope.$apply();
            }else {
               if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoaddeingtweets = false;
                $scope.$apply();
               };
            }
            console.log('gapi #end_execute');
          })
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
     var params_tweet= {
                          'value': params.name,
                          'order':params.order
                      };
    gapi.client.crmengine.twitter.get_tweets_from_datastore(params_tweet).execute(function(resp) {
            if(!resp.code){
               $scope.tweetsFromApi=resp.items;
               $scope.tweets=resp.items;
               console.log($scope.tweets);
               $scope.isLoadingtweets = false;
               if (resp.is_crawling){
                //appel get resecnt tweets
               }
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

Discover.delete_tweets=function(name){
  var val={"value":name};

    gapi.client.crmengine.twitter.delete_topic(val).execute(function(resp) {
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
Discover.delete_topic=function(topic){
  var val={"value":topic};
  console.log(topic);
  
    gapi.client.crmengine.twitter.delete_topic(val).execute(function(resp) {
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
 Discover.get_location=function($scope){
      var val={"value":"alger"};
      var item=[];
      var counts = {};
      var ll=["ll","k","ll"];
ll.forEach(function(x) { counts[x] = (counts[x] || 0)+1; });
console.log("resusssssssss");
console.log(counts);
      for (id in $scope.tweets){
        if ($scope.tweets[id].author_location){
        item.push({"location":$scope.tweets[id].author_location,"latitude":$scope.tweets[id].latitude,"longitude":$scope.tweets[id].longitude});
        }
      }
      //list_of_locations={"value":keyw};
      var items={"items":item};
      console.log(items);
      console.log("itezzzzzzzzzzzz");
    gapi.client.crmengine.twitter.get_location_tweets(items).execute(function(resp) {
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

 Discover.get_tweets_details=function($scope){
  console.log("helo");
  console.log($scope.tweet_id);
    var idp={"tweet_id": $scope.tweet_id};
    console.log(idp);
    gapi.client.crmengine.twitter.get_tweets_details(idp).execute(function(resp) {
            if(!resp.code){
              $scope.tweet_details=JSON.parse(resp.results);
              console.log( $scope.tweet_details);
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

 Discover.get_influencers_v2=function($scope){

    var keyword={"value": $scope.actual_tag};
    var i=false;
    if ($scope.actual_tag.length==0){
      i=true;
    for (ele in $scope.tags){
      $scope.actual_tag.push($scope.tags[ele]["name"]);
    }
    
     }
    
    gapi.client.crmengine.twitter.get_influencers_v2(keyword).execute(function(resp) {
            if(!resp.code){
              $scope.influencers_list=JSON.parse(resp.results);
              //console.log( $scope.influencers_list);
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
    if (i){
    $scope.actual_tag=[];
  }
 }; 
 Discover.get_tweetsV2=function($scope,params){
    $scope.isLoadingtweets = true;
    $scope.$apply();
    gapi.client.crmengine.discover.get_tweets(params).execute(function(resp) {
            if(!resp.code){
               data=JSON.parse(resp.results)
               if (params.page>1) {
                    $scope.tweets=$scope.tweets.concat(data);
                }else {
                    $scope.tweets = data;
                };
                if (resp.more){
                  $scope.page++;
                }
               
               $scope.more=resp.more;

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



return Discover;
});

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



 



Discover.delete_topic=function(topic){
  var val={"value":topic};
  console.log(topic);
  
    gapi.client.crmengine.twitter.delete_topic(val).execute(function(resp) {
            if(!resp.code){
               
               $scope.initialize(resp.items); 
               $scope.isLoadingtweets = false;
               // Call the method apply to make the update on the scope
               $scope.apply();
            }else {
               if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoadingtweets = false;
                $scope.apply();
               };
            }
            console.log('gapi #end_execute');
          });
};


 Discover.get_tweets_details=function($scope){
  console.log("helo");
  console.log($scope.tweet_id);
    var idp={"tweet_id": String($scope.tweet_id)};

    gapi.client.crmengine.twitter.get_tweets_details(idp).execute(function(resp) {
            if(!resp.code){
              $scope.tweet_details=(JSON.parse(resp.results))[0];

              console.log( $scope.tweet_details);

               // Call the method apply to make the update on the scope
               $scope.apply();
            }else {
               if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoadingtweets = false;
                $scope.apply();
               };
            }
            console.log('gapi #end_execute');
          });
 }; 

 Discover.get_influencers_v2=function($scope){
  console.log("eeeee"+JSON.stringify($scope.selected_tags)+"dddd");

$scope.isLoadingtweets = true;
$scope.apply();
var keywords=[];
if($scope.selected_tags!=""){
  for(keyword in $scope.selected_tags){
    keywords.push($scope.selected_tags[keyword]["name"]);
  }
}

    var params={
                "keywords":keywords,
                "page":$scope.page,
                "more":$scope.more
              }
    gapi.client.crmengine.twitter.get_influencers_v2(params).execute(function(resp) {
            if(!resp.code){
            
               if (resp.results=="null"){
                $scope.isLoadingtweets = false;
              }
              //$scope.influencers_list=JSON.parse(resp.results);
             //delete duplicate influencers
              var list_influencers=[];
               data=JSON.parse(resp.results)
               list_influencers.push(data[0]);
               for ( var i=0, length=data.length;i <length; i++){
                  var insert=true;  
                  for ( var j=0, lengthj=list_influencers.length;j <lengthj; j++){
                      var first=list_influencers[j]["_source"]["user"]["screen_name"]+"";
                       var second=data[i]["_source"]["user"]["screen_name"]+"";
                      
                        if(first==second)
                        {
                          
                          insert=false;
                        }
                  }
                  if (insert){                    
                      list_influencers.push(data[i]);
                                        
                  }   
                }
             
                if(list_influencers.length==1){
                  if(list_influencers[0]==undefined){
                    list_influencers=[];
                  }
                      }
                data=list_influencers;
               if (params.page>1) {
                    $scope.influencers_list=$scope.influencers_list.concat(data);
                    if (typeof $scope.tags=="undefined"){
                      $scope.influencers_list=[];
                    }

                }else {
                    $scope.influencers_list= data;
                    
                };
                if (resp.more){
                  $scope.page++;
                }
               
               $scope.more=true;


              $scope.isLoadingtweets = false;
               // Call the method apply to make the update on the scope
               $scope.apply();
            }else {
               if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoadingtweets = false;
                $scope.apply();
               };
            }
            console.log('gapi #end_execute');
          });
   
 }; 
 Discover.check=function(){
var url = "http://localhost:3000/twitter/crawlers/check?callback=JSON_CALLBACK";
$http.jsonp(url)
    .success(function(data){
        console.log(data.found+"check");
    });
 };
 Discover.get_tweetsV2=function($scope,tags){

  

    $scope.isLoadingtweets = true;
    $scope.apply();
    if(tags!=undefined){
              var params = {
                      'limit':20,
                      'keywords':tags,
                      'page':$scope.page
                      };
    }else{
              var params = {
                      'limit':20,
                      'page':$scope.page
                      };
    }
   





    gapi.client.crmengine.discover.get_tweets(params).execute(function(resp) {
      
            if(!resp.code){
             if (resp.results=="null"){
                $scope.isLoadingtweets = false;
              }
              

               data=JSON.parse(resp.results)

               if (params.page>1) {
                    $scope.tweets=$scope.tweets.concat(data);
                    if (typeof $scope.tags=="undefined"){
                      $scope.tweets=[];
                    }

                }else {
                    $scope.tweets = data;
                    console.log($scope.tweets);
                };
                if (resp.more){
                  $scope.page++;
                }
               
               $scope.more=resp.more;
               
                $scope.isLoadingtweets = false;
               // Call the method apply to make the update on the scope
            $scope.apply();
            }else {
               if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoadingtweets = false;
                $scope.apply();
               };
            }

            console.log('gapi #end_execute');
          });
 };



return Discover;
});

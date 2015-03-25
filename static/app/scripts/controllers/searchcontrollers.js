app.controller('SearchShowController', ['$scope','$route', 'Auth','Search','User','Linkedin','$rootScope','Lead',
    function($scope,$route,Auth,Search,User,Linkedin,$rootScope,Lead) {
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.profiles=[];
     $scope.profilesRT=[];
     $scope.timer=undefined;
     $scope.pages = [];
     $scope.linkedinNextPage=1;
     $scope.morelinkedin=false;
     $scope.moreresults=false;
     $scope.isLoadingLinkedin=false;
     $scope.fullLink=false;
     $scope.fullIogrow=false;
     $scope.isRunning = false;
     $scope.markedAsLead=false;
     /*$scope.socket = io.connect("http://104.154.81.17:3000");*/
     $scope.socket = io.connect("http://localhost:3000");
     // $scope.socket = io.connect("http://localhost:3000");
     /*$scope.linkedSearch=$rootScope.linkedSearch;
     $scope.iogrowSearch=$rootScope.iogrowSearch;*/

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
    console.log("hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh")
     $scope.linkedinSearch=function(params){
         if(params.keyword){
          $scope.isLoadingLinkedin=true;
          Linkedin.listDb(params,function(resp){
            console.log($route.current.params.q)
            var result=JSON.parse(resp.results)
            $scope.profiles=result.hits.hits;
            if(!resp.KW_exist){
              $scope.startSpider({"keyword":$route.current.params.q})
            }
            if (resp.more) {
              $scope.linkedinNextPage=$scope.linkedinNextPage+1
            };
            $scope.morelinkedin=resp.more;
            $scope.isLoadingLinkedin=false;
            $scope.apply();
            
          });
        }
     };
      $scope.linkedinlistMoreItems = function() {
                params = {
                    "keyword":$route.current.params.q,
                    'page': $scope.linkedinNextPage
                }
                if(params.keyword){
                    $scope.isLoadingLinkedin=true;
                    Linkedin.listDb(params,function(resp){
                    console.log($route.current.params.q)
                    var result=JSON.parse(resp.results)
                    $scope.profiles=$scope.profiles.concat(result.hits.hits);
                    console.log($scope.profiles);
                    if (resp.more) {
                      $scope.linkedinNextPage=$scope.linkedinNextPage+1;                      
                    };
                    $scope.morelinkedin=resp.more;
                    $scope.isLoadingLinkedin=false;
                    $scope.apply();
                    });
                  }
        };
     $scope.startSpider=function(params){
       Linkedin.startSpider(params,function(resp){
            var result=JSON.parse(resp.results)
            if (result.status=='ok'){
                $scope.isRunning=true;
                $scope.socket.on(params.keyword, function (data) {
                  console.log("data");
                  console.log(data);
                  var result = $.grep($scope.profiles, function(e){ return e._source.id == data._source.id; })
                  console.log(result)
                  if( data._score!=0 && result.length==0 ) {
                    $scope.profilesRT.push(data);
                    console.log("inserted")
                  }
                $scope.apply();
               });      
                $scope.socket.on('stop:'+params.keyword, function (data) {
                $scope.socket.disconnect();
                $scope.isRunning=false;
                console.log("stooooooooooooooooooooooooooooooooooooooooooooooooooooooooope")
                console.log($scope.socket)
                $scope.apply();
               });

        

            }
       });
     }

     $scope.stopSpider=function(){
       
          $scope.socket.disconnect()
          $scope.isRunning=false;
     };
    $scope.spiderState=function(params){
            $scope.timer=setInterval(function () {
                Linkedin.spiderState(params,function(resp){
                $scope.isRunning=resp.state;
                console.log("resp.state");
                console.log(resp.state);
                $scope.$apply();

                });
             }, 3000);
        $scope.watchIsRunning();
     };
      
      $scope.markAsLead = function(profile){
          var firstName = profile.fullname.split(' ').slice(0, -1).join(' ') || " ";
          var lastName = profile.fullname.split(' ').slice(-1).join(' ') || " ";
          var infonodes = [];
          // twitter url
          var infonode = {
                            'kind':'sociallinks',
                            'fields':[
                                    {
                                    'field':"url",
                                    'value':profile.url
                                    }
                            ]
                          }
          infonodes.push(infonode);
          // location
          infonode = {
                            'kind':'addresses',
                            'fields':[
                                    {
                                    'field':"city",
                                    'value': profile.locality
                                    }
                            ]
                          }
          infonodes.push(infonode);
          var image_profile = '';
          if (profile.img){
            image_profile = profile.img;
          }
          var params ={
                        'firstname':firstName,
                        'lastname':lastName,
                        'source':'Linkedin',
                        'access': 'public',
                        'infonodes':infonodes,
                        'profile_img_url':image_profile,
                        'title':profile.title
                      };
          Lead.insert($scope,params);
     }
     $scope.leadInserted = function(){
        $scope.markedAsLead=true;
        $scope.$apply();
        setTimeout(function(){
            $scope.markedAsLead=false;
            $scope.apply();
        }, 2000);
     }
     $scope.runTheProcess = function(){
          var params = {'q':$route.current.params.q,'limit':20};
          console.log(params)
          if ($rootScope.linkedSearch) {
            $scope.linkedinSearch({"keyword":$route.current.params.q});
          };
          console.log("run the process ---------------------------------------->")         
          Search.list($scope,params);
          ga('send', 'pageview', '/search');
          window.Intercom('update');
     };
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
          Auth.refreshToken();
     };
     $scope.listNextPageItems = function(){
      console.log("ttttttttttttttttttttttttttttttttttt");
        var nextPage = $scope.currentPage + 1;
        var params = {};
          if ($scope.pages[nextPage]){
            console.log('moooooooooooooooooore items');
            params = {'q':$route.current.params.q,
                      'limit':20,

                      'pageToken':$scope.pages[nextPage]
                     }
          }else{
             console.log('nooooooooooo more items');
            params = {'q':$route.current.params.q,
                      'limit':20}
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

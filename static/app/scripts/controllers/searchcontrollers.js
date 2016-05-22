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
             console.log(d.getTime());
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
            // $("#iogrowSearchIcon").attr("src","static/img/sm-iogrow-des.png");
          };
        }else{
           $scope.iogrowSearch=true;
           localStorage['iogrowSearch']=true;
           $rootScope.iogrowSearch=true;
          /// $("#iogrowSearchIcon").attr("src","static/img/sm-iogrow.png");
        };
    }
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
                                   'fileUrl':data.docs[0].downloadUrl,
                                   'fileId':data.docs[0].id   
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
      console.log('test execution');
      if (typeof(searchQuery)=='string'){
         //window.location.replace('#/search/'+searchQuery);
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
   //User.patch($scope,params);
   $('#EditSetting').modal('hide');
}

}]);


app.controller('SearchShowController', ['$scope', '$http', '$route', 'Auth', 'Search', 'User', 'Linkedin', '$rootScope', 'Lead',
    function ($scope, $http, $route, Auth, Search, User, Linkedin, $rootScope, Lead) {
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
   /*  $scope.socket = io.connect("http://:3000");*/
    /* $scope.socket = io.connect("http://localhost:3000");*/
     // $scope.socket = io.connect("http://localhost:3000");
     /*$scope.linkedSearch=$rootScope.linkedSearch;
     $scope.iogrowSearch=$rootScope.iogrowSearch;*/

      $scope.inProcess=function(varBool,message){
          if (varBool) {   
            if (message) {
              console.log("starts of :"+message);
             
            };
            $scope.nbLoads += 1;
            if ($scope.nbLoads==1) {
              $scope.isLoading=true;
            };
          }else{
            $scope.nbLoads -= 1;
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


      /*mark as  lead in the search result in linkedin*/
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
                      'limit':20,

                      'pageToken':$scope.pages[nextPage]
                     }
          }else{
            params = {'q':$route.current.params.q,
                      'limit':20}
          }

          $scope.currentPage += 1 ;
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
          $scope.currentPage -= 1 ;
          Search.list($scope,params);
     };


//HKA 25.03.2014 update user language
$scope.updatelanguage = function(user,idUser){
  var params = {'id':idUser,
     'language':user.language};
   User.patch($scope,params);
   $('#EditSetting').modal('hide');
}
     // Google+ Authentication
     Auth.init($scope);

}]);
app.controller('SearchFormController', ['$scope', '$http', 'Search', 'User', '$rootScope',
    function ($scope, $http, Search, User, $rootScope) {
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
            // $("#iogrowSearchIcon").attr("src","static/img/sm-iogrow-des.png");
          };
        }else{
           $scope.iogrowSearch=true;
           localStorage['iogrowSearch']=true;
           $rootScope.iogrowSearch=true;
          /// $("#iogrowSearchIcon").attr("src","static/img/sm-iogrow.png");
        };
    }
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
                                   'fileUrl':data.docs[0].downloadUrl,
                                   'fileId':data.docs[0].id   
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
        /*$scope.$watch('searchQuery', function() {

         if($scope.searchQuery!=undefined){
           params['q'] = $scope.searchQuery;
           gapi.client.crmengine.search(params).execute(function(resp) {
              if (resp.items){
                $scope.results = resp.items;
                $scope.$apply();
              };

            });
        }
         });*/
        $scope.getResults = function (val) {
            var url = ROOT + '/crmengine/v1/search?alt=json'
            var config = {
                headers: {
                    'Authorization': 'Bearer ' + localStorage['access_token'],
                    'Accept': 'application/json'
                }
            }
            var params = {
                "q": val
            };
            return $http.post(url, params, config).then(function (response) {
                if (response.data.items) {
                    return response.data.items;
                } else {
                    return [];
                }
            });
        }
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
      console.log("test");
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
   //User.patch($scope,params);
   $('#EditSetting').modal('hide');
}

}]);

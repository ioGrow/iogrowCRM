app.controller('DiscoverListCtrl', ['$scope','Auth','Discover','Tag','Lead','$http','Edge',
    function($scope,Auth,Discover,Tag,Lead,$http,Edge){

     $("ul.page-sidebar-menu li").removeClass("active");
        $("#id_Discovery").addClass("active");
        document.title = "Discovery: Home";
        $scope.selectedTab=2;
        $scope.selectedOption = 'all';
        $scope.isSignedIn = false;
        $scope.immediateFailed = false;
        $scope.nextPageToken = undefined;
        $scope.prevPageToken = undefined;
        $scope.isLoading = false;
        $scope.isMoreItemLoading = false;
        $scope.pagination = {};
        $scope.currentPage = 01;
        $scope.pages = [];
        $scope.accounts = [];
        $scope.account = {};
        $scope.selected_tags = [];
        $scope.account.access = 'public';
        $scope.order = '-updated_at';
        $scope.account.account_type = 'Customer';
        $scope.draggedTag = null;
        $scope.tag = {};
        $scope.tweets = [];
        $scope.noresults=false;
        $scope.influencers=[];
        $scope.testtitle = "Customer Support Customer Support";
        $scope.showNewTag = false;
        $scope.showUntag = false;
        $scope.edgekeytoDelete = undefined;
        $scope.discovery_language='all';
        $scope.more=true;
        $scope.tags=[];
        $scope.map_results=[];
        $scope.map_tweets=null;
        $scope.best_tweets=null;

        $scope.no_tweets_map=true;
        //Manage Color
        $scope.color_pallet = [
            {'name': 'red', 'color': '#F7846A'},
            {'name': 'orange', 'color': '#FFBB22'},
            {'name': 'yellow', 'color': '#EEEE22'},
            {'name': 'green', 'color': '#BBE535'},
            {'name': 'blue', 'color': '#66CCDD'},
            {'name': 'gray', 'color': '#B5C5C5'},
            {'name': 'teal', 'color': '#77DDBB'},
            {'name': 'purple', 'color': '#E874D6'},
        ];
        $scope.tag.color = {'name': 'green', 'color': '#BBE535'};
        $scope.selectedAccount=null;
         $scope.currentAccount=null;
         $scope.showTagsFilter=false;
         $scope.showNewTag=false;
        $scope.keywords=[];
        $scope.tweetsFromApi={};
        var keyw=[];
        var list_of_tags={};
      $scope.isLoadingtweets=false;
      $scope.tweet_details={};
      $scope.mapshow=false;
      $scope.tweetsshow=true;
      $scope.influencersshow=false;

      $scope.best_tweets_show=false;
      $scope.props = {
        target: '_blank',
        otherProp: 'otherProperty'
    };
    $('#popup_keywords').modal('hide');
    $scope.influencers=[];
     // What to do after authentication
     $scope.runTheProcess = function(){
      //Discover.read_languages();
      //$scope.selectedOption = 'all';
        $scope.mapshow=false;
        $scope.tweetsshow=true;
        $scope.selected_tags=[];
        //$scope.influencersshow=false;
        $scope.tweets=[];
        console.log("start check");
        Discover.check();

        //var kind = 'topics';
        var paramsTag = {'about_kind':'topics'};
        Tag.list($scope,paramsTag);

        
        var params = {
                      'limit':20
                      };
        // Discover.get_recent_tweets($scope,params);
        
        if ($scope.influencersshow){
          Discover.get_influencers_v2($scope);
         }else{
          console.log("run the processs")
            Discover.get_tweetsV2($scope);
         }
        

        
        ga('send', 'pageview', '/discovery');
        window.Intercom('update');
        
     };
     $scope.apply=function(){
         
          if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
               $scope.$apply();
              }
              return false;
    }
    $scope.inProcess=function(varBool,message){
          if (varBool) {  
            console.log("inProcess starts");      
            if (message) {
              console.log("starts of :"+message);
             
            };
            $scope.nbLoads=$scope.nbLoads+1;
             var d = new Date();
             console.log(d.getTime());
            if ($scope.nbLoads==1) {
              $scope.isLoading=true;
            };
          }else{
            if (message) {
              console.log("ends of :"+message);
            };
            console.log("inProcess ends");
            var d = new Date();
            console.log(d.getTime());
            $scope.nbLoads=$scope.nbLoads-1;
            if ($scope.nbLoads==0) {
               $scope.isLoading=false;
 
            };

          };
        } 
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
            Auth.refreshToken();
     };
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
     $scope.fromNow = function(fromDate){
          var converted_date ={};
          if (typeof(fromDate)=="string"){
            converted_date= new Date(fromDate);
          }
          else {converted_date= new Date(fromDate["$date"]);}
          return moment(converted_date).fromNow();
      }
     $scope.listMoreItems = function(){
        if ($scope.isFiltering && $scope.pageToken){
            var tags = [];
            angular.forEach($scope.selected_tags, function(tag){
                  tags.push(tag.name);
            });
            
            console.log('==================list more items with filtering =============');
            
            Discover.get_tweetsV2($scope,tags);
        }else{
            if($scope.pageToken){
                $scope.isLoadingtweets = true;
                $scope.$apply();
                
                console.log('==================list more items=============');
                
                Discover.get_tweetsV2($scope);
            }
        }
     }

     $scope.listNewItems = function(){
       
        console.log("list ne wtiems");
        if ($scope.influencersshow){
          Discover.get_influencers_v2($scope);
         }else{
          if($scope.mapshow){
            console.log("mapshow")
            Discover.get_map($scope);
          }else{
            console.log("get_tweetsV2")
           Discover.get_tweetsV2($scope);
          }
         }
        
     }
    $scope.popitup =  function(url) {
        newwindow=window.open(url,'name','height=400,width=300');
        if (window.focus) {newwindow.focus()}
        return false;
    }

      $scope.discovery_wizard = function(){
        localStorage['completedTour'] = 'True';
        var tour = {
            id: "hello-hopscotch",
             steps: [
              {
                
                title: "Step 1: Add topics",
                content: "Add Topics related to your bussiness, your industry, your products or services...",
                target: "tag_name",
                placement: "left"
              },
              {
                title: "Step 2: Listen & identify leads",
                content: "Find people who talk about your products, services, competitors, industry...",
                target: "tweets",
                placement: "bottom"
              },
              {
                title: "Step 3: Identify influencers",
                content: "Build community with the most important influencers and increase your brand awareness by promoting your products and services",
                target: "influencers",
                placement: "bottom"
              }
              
              
              ,
              {
                title: "Step 4: Localize",
                content: "Localize where people are talking about your topics ",
                target: "map",
                placement: "bottom"
              }
              
              
              
            ],
            onEnd:function(){
                $scope.saveIntercomEvent('completed Tour');
                var userId = document.getElementById("userId").value;

                if (userId){
                    var params = {'id':parseInt(userId),'completed_tour':true};
                    User.completedTour($scope,params);
                }
                console.log("dddezz");
                $('#installChromeExtension').modal("show");
            }
          };
          // Start the tour!
          console.log("beginstr");
          hopscotch.startTour(tour);
      };

    $scope.back_to_tweets= function(){
      $scope.no_tweets_map=true;
      $scope.map_tweets=null;
      $scope.best_tweets=null;
      $scope.mapshow=false;
       $scope.influencersshow=false;
       $scope.tweetsshow=true;
       $scope.best_tweets_show=false;
      //$scope.runTheProcess();
      var tags = [];
      angular.forEach($scope.selected_tags, function(tag){
            tags.push(tag.name);
      });
      $scope.page=1;
      
   
          //$scope.apply();
          $scope.tweets=[];
      Discover.get_tweetsV2($scope,tags);
    console.log("ddeend"+$scope.tweetsshow);


    }
    

     
    $scope.changeLanguage=function(discovery_language){
      console.log("change"+discovery_language);
      $scope.discovery_language=discovery_language;
      var tags = [];
      console.log($scope.selected_tags);
      angular.forEach($scope.selected_tags, function(tag){
            tags.push(tag.name);
      });
      $scope.page=1;
      if ($scope.influencersshow){
          Discover.get_influencers_v2($scope);
         }else{
          $scope.apply();
          console.log("filterrrr");
      Discover.get_tweetsV2($scope,tags);
    }
    }
     $scope.markAsLead = function(tweet){
          var firstName = tweet.user.name.split(' ').slice(0, -1).join(' ') || " ";
          var lastName = tweet.user.name.split(' ').slice(-1).join(' ') || " ";
          var infonodes = [];
          // twitter url
          var infonode = {
                            'kind':'sociallinks',
                            'fields':[
                                    {
                                    'field':"url",
                                    'value':'https://twitter.com/'+tweet.user.screen_name
                                    },   
                                    {
                                    'field':"screen_name",
                                    'value':tweet.user.screen_name
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
                                    'value': tweet.user.location
                                    }
                            ]
                          }
          infonodes.push(infonode);
          var image_profile = '';
          if (tweet.user.profile_image_url){
            image_profile = tweet.user.profile_image_url;
          }
          var params ={
                        'firstname':firstName,
                        'lastname':lastName,
                        'tagline':tweet.user.description,
                        'source':'Twitter',
                        'access': 'public',
                        'infonodes':infonodes,
                        'profile_img_url':image_profile
                      };
          Lead.insert($scope,params);
     }
     $scope.leadInserted = function(){
        $scope.markedAsLead=true;
        $scope.$apply();
        setTimeout(function(){
            $scope.markedAsLead=false;
            $scope.$apply();
        }, 2000);
     }
     $scope.showNewTagForm=function(){
            $scope.showNewTag=true;
            $( window ).trigger( 'resize' );  
          }
          $scope.hideNewTagForm=function(){
            $scope.showNewTag=false;
            $( window ).trigger( 'resize' ); 
          }
          $scope.hideTagFilterCard=function(){
            $scope.showTagsFilter=false;
            $( window ).trigger( 'resize' ); 
          }
      $scope.tagInserted=function(){
         var paramsTag = {'about_kind':'topics'}
          Tag.list($scope,paramsTag);
          $scope.selected_tags=[];
      }
     $scope.listTags=function(){
      var paramsTag = {'about_kind':'topics'}
      Tag.list($scope,paramsTag);
      $scope.listNewItems();
     };
     $scope.hide_maximum_keywords_popup=function(){
      $('#popup_keywords').modal('hide');
     };
     $scope.addNewtag = function(tag){
      
      list=[]

      if(typeof $scope.tags === 'undefined'){
          list=[]
      }else{
        list=$scope.tags;
      }
      if (list.length>2){
        $("#popup_keywords").modal('show');
      }else{

      $scope.isLoading = true;
      /*keyw.push(tag.name);
      for (var id in $scope.tags){

          keyw.push($scope.tags[id].name);

        }*/

      /* list_of_tags={"value":keyw};*/

       var params = {
                          'name': tag.name,
                          'about_kind':'topics',
                          'color':tag.color.color,
                          'order':'recent'
                      };
        Tag.insert($scope,params);
        $scope.tag.name='';
        $scope.tag.color= {'name':'green','color':'#BBE535'};
         $scope.selected_tags=[];
     }

   }
   $scope.updateTag = function(tag){
            params ={ 'id':tag.id,
                      'title': tag.name,
                      'status':tag.color
            };
      Tag.patch($scope,params);
  };
  $scope.deleteTag=function(tag){
        console.log(JSON.stringify(tag)+"deletetag");
        //$scope.selected_tags.splice($scope.selected_tags.indexOf(tag),1);
          params = {
            'entityKey': tag.entityKey
          }
          Tag.delete($scope,params);
          Discover.delete_topic(tag.name);
          

      };



$scope.selectTag= function(tag,index,$event){

          console.log(JSON.stringify(tag)+"tagg");
          if(!$scope.manage_tags){
         var element=$($event.target);
         if(element.prop("tagName")!='LI'){
              element=element.parent();
              element=element.parent();
         }
         var text=element.find(".with-color");
         if($scope.selected_tags.indexOf(tag) == -1){
            $scope.selected_tags.push(tag);
            console.log("$scope.selected_tags");
            console.log($scope.selected_tags);
            /*element.css('background-color', tag.color+'!important');
            text.css('color',$scope.idealTextColor(tag.color));*/

         }else{
          /*  element.css('background-color','#ffffff !important');*/
          
            console.log("unselect tag");
            console.log($scope.selected_tags);
            console.log('$scope.selected_tags.indexOf(tag)');
            console.log($scope.selected_tags.indexOf(tag));
            $scope.selected_tags.splice($scope.selected_tags.indexOf(tag),1);
            console.log($scope.selected_tags);
             /*text.css('color','#000000');*/
         }
          
         $scope.filterByTags($scope.selected_tags);
       

      }
      

    };
  $scope.filterByTags = function(selected_tags){

      $scope.isFiltering = true;
      var tags = [];
      angular.forEach(selected_tags, function(tag){
            tags.push(tag.name);
      });
      $scope.page=1;
      
      if ($scope.influencersshow){
          Discover.get_influencers_v2($scope);
         }else{
          if($scope.mapshow){
            // get location on google maps
            Discover.get_map($scope);
          }else{

          $scope.apply();
          console.log("filterrrr");
      Discover.get_tweetsV2($scope,tags);
    }
    }
  };

$scope.unselectAllTags= function(){
        $('.tags-list li').each(function(){
            var element=$(this);
            var text=element.find(".with-color");
             element.css('background-color','#ffffff !important');
             text.css('color','#000000');
        });
     };
//HKA 19.02.2014 When delete tag render account list
 $scope.tagDeleted = function(){

   /* var paramsTag = {'about_kind':'topics'};
    Tag.list($scope,paramsTag);
    $scope.listNewItems();
   /*           
          $scope.listTags();
          $scope.page=1;
          $scope.runTheProcess();*/
  $scope.page=1;
  $scope.listTags();
  $scope.selected_tags=[];

 };
 $scope.manage=function(){
        $scope.unselectAllTags();
      };
$scope.tag_save = function(tag){
          if (tag.name) {
             Tag.insert($scope,tag);

           };
      };

$scope.editTag=function(tag){
        $scope.edited_tag=tag;
     }
$scope.doneEditTag=function(tag){
        $scope.edited_tag=null;
        $scope.updateTag(tag);
     }
$scope.addTags=function(){
      var tags=[];
      var items = [];
      tags=$('#select2_sample2').select2("val");

      angular.forEach($scope.selected_tasks, function(selected_task){
          angular.forEach(tags, function(tag){
            var edge = {
              'start_node': selected_task.entityKey,
              'end_node': tag,
              'kind':'tags',
              'inverse_edge': 'tagged_on'
            };
            items.push(edge);
          });
      });

      params = {
        'items': items
      }

      Edge.insert($scope,params);
      $('#assigneeTagsToTask').modal('hide');

     };

     var handleColorPicker = function () {
          if (!jQuery().colorpicker) {
              return;

          }
          $('.colorpicker-default').colorpicker({
              format: 'hex'
          });
      }
      handleColorPicker();

      $('#addMemberToTask > *').on('click', null, function(e) {
            e.stopPropagation();
        });
      $scope.idealTextColor=function(bgColor){
        var nThreshold = 105;
         var components = getRGBComponents(bgColor);
         var bgDelta = (components.R * 0.299) + (components.G * 0.587) + (components.B * 0.114);

         return ((255 - bgDelta) < nThreshold) ? "#000000" : "#ffffff";
      }
      function getRGBComponents(color) {

          var r = color.substring(1, 3);
          var g = color.substring(3, 5);
          var b = color.substring(5, 7);

          return {
             R: parseInt(r, 16),
             G: parseInt(g, 16),
             B: parseInt(b, 16)
          };
      }
      $scope.dragTag=function(tag){
        $scope.draggedTag=tag;
         //$scope.$apply();
      };
      $scope.dropTag=function(contact,index){
        var items = [];

        var params = {
              'parent': contact.entityKey,
              'tag_key': $scope.draggedTag.entityKey
        };
        $scope.draggedTag=null;
        Tag.attach($scope,params,index);

      };
      $scope.tagattached=function(tag,index){
          if ($scope.contacts[index].tags == undefined){
            $scope.contacts[index].tags = [];
          }
           var ind = $filter('exists')(tag, $scope.contacts[index].tags);
           if (ind == -1) {
                $scope.contacts[index].tags.push(tag);
                var card_index = '#card_'+index;
                $(card_index).removeClass('over');
            }else{
                 var card_index = '#card_'+index;
                $(card_index).removeClass('over');
            }

              $scope.$apply();
      };

  // HKA 12.03.2014 Pallet color on Tags
      $scope.checkColor=function(color){
        $scope.tag.color=color;
      }
 //HKA 19.06.2014 Detache tag on contact list
     $scope.dropOutTag=function(){


        var params={'entityKey':$scope.edgekeytoDelete}
        Edge.delete($scope,params);

        $scope.edgekeytoDelete=undefined;
        $scope.showUntag=false;
      };
      $scope.dragTagItem=function(edgekey){
        $scope.showUntag=true;
        $scope.edgekeytoDelete=edgekey;
      };

     $scope.listNextPageItems = function(){
        
        
        var nextPage = $scope.currentPage + 1;
        var params = {};
          if ($scope.pages[nextPage]){
            params = {'limit':7,
                      'pageToken':$scope.pages[nextPage]
                     }
          }else{
            params = {'limit':7}
          }
          console.log('in listNextPageItems');
          $scope.currentPage = $scope.currentPage + 1 ; 
          User.list($scope,params);
     }
     $scope.listPrevPageItems = function(){
       
       var prevPage = $scope.currentPage - 1;
       var params = {};
          if ($scope.pages[prevPage]){
            params = {'limit':7,
                      'pageToken':$scope.pages[prevPage]
                     }
          }else{
            params = {'limit':7}
          }
          $scope.currentPage = $scope.currentPage - 1 ;
          User.list($scope,params);
     }
    

     
     $scope.showModal = function(){
        console.log('button clicked');
        $('#addAccountModal').modal('show');

      };
      
    $scope.addNewUser = function(user){
      console.log('add a new user');
      console.log(user);
      $('#addAccountModal').modal('hide');
      User.insert($scope,user);
    };
    

    $scope.getPosition= function(index){
        if(index<4){
         
          return index+1;
        }else{
          return (index%4)+1;
        }
     };

$scope.get_best_tweets= function(){
  $scope.best_tweets=null;
  $scope.tweetsshow=false;
  $scope.best_tweets_show=true;
  $scope.map_tweets=null;
  Discover.check();

  $scope.best_tweets={};
  
Discover.get_best_tweets($scope);
};
$scope.influencers_V2= function(){
  $scope.no_tweets_map=true;
  $scope.more =true;
  $scope.selectedOption = 'my';
  $scope.mapshow=false;
  $scope.tweetsshow=false;
  $scope.influencersshow=true;
  $scope.map_tweets=null;
  Discover.check();

  $scope.influencers_list={};
  
  $scope.page=1;
  Discover.get_influencers_v2($scope);
};     
   


     $scope.showMaps= function(){
      console.log("ff"+ $scope.map_tweets);
      $scope.map_tweets=null;
      //$scope.influencers_list=null;
      console.log( $scope.map_tweets);

      console.log("mapp");
      console.log($scope.selectedOption );
      $scope.selectedOption = 'map';
             
           $scope.tweetsshow=false;
      $scope.mapshow=true;
      $scope.influencersshow=false;
      
      Discover.get_map($scope);
      
        
            };
$scope.initialize =function() {
  $scope.no_tweets_map=true
 var myLatlng = new google.maps.LatLng(36.7002068,4.0754879);
  var mapOptions = {
    zoom: 2,
    center: myLatlng
  }
  var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

for (var i = 0; i <$scope.map_results.length; i++) {
   var myLatlng = new google.maps.LatLng($scope.map_results[i]["latitude"],
    $scope.map_results[i]["longitude"]);
  var marker = new google.maps.Marker({
      position: myLatlng,
      map: map,
      title: $scope.map_results[i]["key"]
  });
var text=$scope.map_results[i]["doc_count"]+" persons from "+$scope.map_results[i]["key"]+" are talking about these keywords"
  $scope.adddialgo(marker,text,map)


}




}




//   var geocoder;
// var map;

$scope.initialize2= function() {

  geocoder = new google.maps.Geocoder();
  var latlng = new google.maps.LatLng(-34.397, 150.644);
  var mapOptions = {
    zoom: 2
  }
  map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
  for (var i = 0; i < $scope.map_results.length; i++) {
   
//codeAddress($scope.map_results[i]);
var marker = new google.maps.Marker({
          map: map,
          position: new google.maps.LatLng(item[i]["latitude"] , item[i]["longitude"]),
      });

      console.log("ddd"+JSON.stringify(element)+results[0].geometry.location);
      marker.setTitle(element["key"]);
//             $scope.adddialgo(marker,item[i]["number"],item[i]["location"],item[i]["topic"])

   

}

// setTimeout(function(){
//     nextten();
//         }, 10000);

}

function nextten() {
  console.log("tenn")
 for (var i = 10; i < $scope.map_results.length; i++) {
codeAddress($scope.map_results[i]);
}

}
function codeAddress(element) {
  //var address = document.getElementById('address').value;
  var j=0;
  //for (var i = 0; i < $scope.map_results.length; i++) {
    //console.log($scope.map_results[i]["key"]+"keee");
    console.log("ee"+JSON.stringify(element));
  geocoder.geocode( { 'address': element["key"]}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      //console.log(JSON.stringify(results)+"results");
      map.setCenter(results[0].geometry.location);
      
      var marker = new google.maps.Marker({
          map: map,
          position: results[0].geometry.location
      });

      console.log("ddd"+JSON.stringify(element)+results[0].geometry.location);
      marker.setTitle(element["key"]);
//             $scope.adddialgo(marker,item[i]["number"],item[i]["location"],item[i]["topic"])


      var infowindow = new google.maps.InfoWindow({

            //content: val+' tweets from '+location+ " related to " + topic
          content:element["doc_count"]+" person who tweet about this keyword here."
          });
          


          google.maps.event.addListener(marker, 'click', function() {
            infowindow.open(marker.get('map'), marker);
          });

       
          //j=j+1;

    } else {
      console.log('Geocode was not successful for the following reason: ' + status);
    }
  });
   //}
}


// $scope.initialize= function(){
//           values=$scope.tweets;
//           var counts_objects = [];
          
//           var objects=[];
//            var mapOptions = {
//             zoom: 2,
//             mapTypeId: google.maps.MapTypeId.TERRAIN,
//             center: new google.maps.LatLng(15.363882, 1.044922)
//           };
//           var lat=[];
//           var lon=[];
//           if (values ) {
//             for (var i = 0; i < values.length; i++) {
//               if (values[i]['latitude'] ){
               
//               objects.push({"location":values[i]["author_location"],"number":1 ,"latitude":values[i]['latitude'],"longitude":values[i]['longitude'],"topic":values[i]['topic']});
//              lat.push(values[i]['latitude']);
//             lon.push(values[i]['longitude']);  
//             }       
//           }
//           var item=[];
          
//           var list_location=[];
//           for (var ele in objects){
//             var iz=String(objects[ele]["location"]);
//             var boo=$.inArray(iz,list_location);
//             if (boo!=-1){
//               for (var e in item){
//                 if(item[e]["location"]==objects[ele]["location"]){
//                   item[e]["number"]=item[e]["number"]+1
//                 }
//               }
//             }else{
//               list_location.push(objects[ele]['location'])
//               item.push(objects[ele]);
//             }
//           }
//           console.log(item);
//         }
          
//           var map = new google.maps.Map(document.getElementById('map-canvas'),
//               mapOptions);
 
         

//           for (var i = 0; i < item.length ; i++) {
            
//              var marker = new google.maps.Marker({
//               position: new google.maps.LatLng(item[i]["latitude"] , item[i]["longitude"]),
//               map: map
//             });


//             marker.setTitle(item[i]['location']);
//             $scope.adddialgo(marker,item[i]["number"],item[i]["location"],item[i]["topic"])

//             //var message = [values[i][0]];
          
//           }

       

// };
 
// It should go something like this: 
$scope.adddialgo= function (marker,text,map){
          
          var infowindow = new google.maps.InfoWindow({

            //content: val+' tweets from '+location+ " related to " + topic
          content:text
          });
          


          google.maps.event.addListener(marker, 'click', function() {
          
            var location=marker.getTitle();
            $scope.map_tweets=null;
            Discover.get_tweets_map($scope,location);
            map.setZoom(6);
            map.setCenter(marker.getPosition());
            infowindow.open(marker.get('map'), marker);
          });





};




   $scope.page=1
  // Google+ Authentication 
    Auth.init($scope);
    $(window).scroll(function() {
            if (!$scope.isLoadingtweets  && $scope.more && ($(window).scrollTop() > $(document).height() - $(window).height() - 100)) {
              var tags = [];
              angular.forEach($scope.selected_tags, function(tag){
                  tags.push(tag.name);
              });
              
                console.log("more");
                if ($scope.influencersshow){
                  Discover.get_influencers_v2($scope);
                 }else{
                 Discover.get_tweetsV2($scope,tags);
               }

                

            }
        });
    
}]);


app.controller('DiscoverNewCtrl', ['$scope','Auth','Discover','Tag','Edge',
    function($scope,Auth,Discover,Tag,Edge){

     $("ul.page-sidebar-menu li").removeClass("active");
        $("#id_Discovery").addClass("active");
        document.title = "Discovery: Home";
        $scope.selectedTab=2;
        $scope.selectedOption = 'all';
        $scope.isSignedIn = false;
        $scope.immediateFailed = false;
        $scope.nextPageToken = undefined;
        $scope.prevPageToken = undefined;
        $scope.isLoading = false;
        $scope.isMoreItemLoading = false;
        $scope.pagination = {};
        $scope.currentPage = 01;
        $scope.pages = [];
        $scope.accounts = [];
        $scope.account = {};
        $scope.selected_tags = [];
        $scope.account.access = 'public';
        $scope.order = '-updated_at';
        $scope.account.account_type = 'Customer';
        $scope.draggedTag = null;
        $scope.tag = {};
        $scope.tweets = {};
        $scope.testtitle = "Customer Support Customer Support";
        $scope.showNewTag = false;
        $scope.showUntag = false;
        $scope.edgekeytoDelete = undefined;
        //Manage Color
        $scope.color_pallet = [
            {'name': 'red', 'color': '#F7846A'},
            {'name': 'orange', 'color': '#FFBB22'},
            {'name': 'yellow', 'color': '#EEEE22'},
            {'name': 'green', 'color': '#BBE535'},
            {'name': 'blue', 'color': '#66CCDD'},
            {'name': 'gray', 'color': '#B5C5C5'},
            {'name': 'teal', 'color': '#77DDBB'},
            {'name': 'purple', 'color': '#E874D6'},
        ];
        $scope.tag.color = {'name': 'green', 'color': '#BBE535'};
        $scope.selectedAccount=null;
         $scope.currentAccount=null;
         $scope.showTagsFilter=false;
         $scope.showNewTag=false;
         $scope.topic="";
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
          ga('send', 'pageview', '/discovery/new');
          window.Intercom('update');
     };
     $scope.addNewTopic=function(){
      console.log($scope.topic);
      var params = {
                          'name': $scope.topic,
                          'about_kind':'topics',
                          'color':$scope.tag.color.color
                      };
      console.log(params);
      $scope.fromnewtab=true;
       Tag.insert($scope,params);
       console.log("inserts");
      var paramsTag = {'about_kind':'topics'};
        Tag.list($scope,paramsTag);
        
        
      //window.location.reload('#/discovers/');

     }


  // Google+ Authentication 
    Auth.init($scope);
    
}]);


app.controller('DiscoverShowCtrl', ['$scope','Auth','Discover','Tag','Lead','Edge',
    function($scope,Auth,Discover,Tag,Lead,Edge){

     $("ul.page-sidebar-menu li").removeClass("active");
        $("#id_Discovery").addClass("active");
        document.title = "Discovery: Home";
        $scope.selectedTab=2;
        $scope.selectedOption = 'all';
        $scope.isSignedIn = false;
        $scope.immediateFailed = false;
        $scope.nextPageToken = undefined;
        $scope.prevPageToken = undefined;
        $scope.isLoading = false;
        $scope.isMoreItemLoading = false;
        $scope.pagination = {};
        $scope.currentPage = 01;
        $scope.pages = [];
        $scope.accounts = [];
        $scope.account = {};
        $scope.selected_tags = [];
        $scope.account.access = 'public';
        $scope.order = '-updated_at';
        $scope.account.account_type = 'Customer';
        $scope.draggedTag = null;
        $scope.tag = {};
        $scope.tweets = {};
        $scope.testtitle = "Customer Support Customer Support";
        $scope.showNewTag = false;
        $scope.showUntag = false;
        $scope.edgekeytoDelete = undefined;
        //Manage Color
        $scope.color_pallet = [
            {'name': 'red', 'color': '#F7846A'},
            {'name': 'orange', 'color': '#FFBB22'},
            {'name': 'yellow', 'color': '#EEEE22'},
            {'name': 'green', 'color': '#BBE535'},
            {'name': 'blue', 'color': '#66CCDD'},
            {'name': 'gray', 'color': '#B5C5C5'},
            {'name': 'teal', 'color': '#77DDBB'},
            {'name': 'purple', 'color': '#E874D6'},
        ];
        $scope.tag.color = {'name': 'green', 'color': '#BBE535'};
        $scope.selectedAccount=null;
         $scope.currentAccount=null;
         $scope.showTagsFilter=false;
         $scope.showNewTag=false;
         $scope.topic="";
         $scope.tweet_details={};
         $scope.tweet_id="";
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
      var url=document.URL;
      if (url.indexOf("*")>-1){
        url=url.replace("*","");
        $scope.selectedTab=1;
      }else{
        $scope.selectedTab=2;
      }
      var tweet_id=url.substring(url.indexOf("show")+5);
      console.log(tweet_id);
      
      $scope.tweet_id=tweet_id;
      Discover.get_tweets_details($scope);


      ga('send', 'pageview', '/discovery/show');
     window.Intercom('update');

     };
     $scope.popitup =  function(url) {
      
      console.log(url);
        newwindow=window.open(url,'name','height=400,width=300');
        if (window.focus) {newwindow.focus()}
        return false;
    };
   
       $scope.markAsLead = function(tweet){
        $scope.markedAsLead=true;
        $scope.$apply();
        setTimeout(function(){
            $scope.markedAsLead=false;
            $scope.$apply();
        }, 2000);
          var firstName = tweet._source.user.name.split(' ').slice(0, -1).join(' ') || " ";
          var lastName = tweet._source.user.name.split(' ').slice(-1).join(' ') || " ";
          var infonodes = [];
          // twitter url
          var infonode = {
                            'kind':'sociallinks',
                            'fields':[
                                    {
                                    'field':"url",
                                    'value':'https://twitter.com/'+tweet._source.user.screen_name
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
                                    'value': tweet._source.user.location
                                    }
                            ]
                          }
          infonodes.push(infonode);
          var image_profile = '';
          
            image_profile = tweet._source.user.profile_image_url;
          
          
          var params ={
                        'firstname':firstName,
                        'lastname':lastName,
                        'tagline':tweet._source.user.description,
                        'source':'Twitter',
                        'access': 'public',
                        'infonodes':infonodes,
                        'profile_img_url':image_profile
                      };
          Lead.insert($scope,params);
     }



  // Google+ Authentication 
    Auth.init($scope);
    
}]);

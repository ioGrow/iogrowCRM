app.controller('AccountListCtrl', ['$scope','$filter','Auth','Account','Tag','Edge',
    function($scope,$filter,Auth,Account,Tag,Edge) {
     $("ul.page-sidebar-menu li").removeClass("active");
     $("#id_Accounts").addClass("active");
     document.title = "Accounts: Home";
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
     $scope.accounts = [];
     $scope.account = {};
     $scope.selected_tags = [];
     $scope.account.access ='public';
     $scope.order = '-updated_at';
     $scope.account.account_type = 'Customer';
     $scope.draggedTag=null;
     $scope.tag = {};
     $scope.showNewTag=false;
     //Manage Color
     $scope.color_pallet=[
         {'name':'red','color':'#F7846A'},
         {'name':'orange','color':'#FFBB22'},
         {'name':'yellow','color':'#EEEE22'},
         {'name':'green','color':'#BBE535'},
         {'name':'blue','color':'#66CCDD'},
         {'name':'gray','color':'#B5C5C5'},
         {'name':'teal','color':'#77DDBB'},
         {'name':'purple','color':'#E874D6'},
     ];
     $scope.tag.color= {'name':'green','color':'#BBE535'};
     $scope.runTheProcess = function(){
          console.log('i am in account list run the process');
          console.log('here is the access token in the gapi');
          console.log(gapi.auth.getToken());
          console.log('and here is the auth result saved in the window');
          console.log(window.authResult);
          var params = { 'order': $scope.order,
                        'limit':20}
          Account.list($scope,params);
          var paramsTag = {'about_kind':'Account'};
          Tag.list($scope,paramsTag);
          // for (var i=0;i<500;i++)
          // {
          //     var params = {
          //               'name': 'Account ' + i.toString(),
          //               'account_type': 'Customer',
          //               'industry':'Technology',
          //               'access':'public'
          //             }
          //     Account.insert($scope,params);
          // }
          $("card_5").resize(function(){
            console.log("slqdhsqlkdhsqlkhdsq");
            $( window ).trigger( "resize" );
          });
     };
     $scope.getPosition= function(index){
        if(index<4){

          return index+1;
        }else{
          return (index%4)+1;
        }
     };
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
          Auth.refreshToken();
     };
     // Next and Prev pagination
     $scope.listNextPageItems = function(){
        var nextPage = $scope.currentPage + 1;
        var params = {};
          if ($scope.pages[nextPage]){
            params = {'limit':6,
                      'order' : $scope.order,
                      'pageToken':$scope.pages[nextPage]
            }
          }else{
            params = {'order' : $scope.order,'limit':6}
          }
          $scope.currentPage = $scope.currentPage + 1 ;
          Account.list($scope,params);
     };
     $scope.listMoreItems = function(){
        console.log('try to load more');
        var nextPage = $scope.currentPage + 1;
        var params = {};
        if ($scope.pages[nextPage]){
            params = {
                      'limit':20,
                      'order' : $scope.order,
                      'pageToken':$scope.pages[nextPage]
                    }
            $scope.currentPage = $scope.currentPage + 1 ;
            Account.listMore($scope,params);
        }
      };
     $scope.listPrevPageItems = function(){
       var prevPage = $scope.currentPage - 1;
       var params = {};
          if ($scope.pages[prevPage]){
            params = {'limit':6,
                      'order' : $scope.order,
                      'pageToken':$scope.pages[prevPage]
            }
          }else{
            params = {'order' : $scope.order,'limit':6}
          }
          $scope.currentPage = $scope.currentPage - 1 ;
          Account.list($scope,params);
     };
     // Add a new account methods
     // Show the modal
     $scope.showModal = function(){
        $('#addAccountModal').modal('show');
     };
     // Insert the account if enter button is pressed
     $scope.addAccountOnKey = function(account){
        if(event.keyCode == 13 && account){
            $scope.save(account);
        };
     };


    $scope.addAccountOnKey = function(account){
      if(event.keyCode == 13 && account){
          $scope.save(account);
      }


    };


     $scope.accountInserted = function(resp){
          if ($scope.accounts == undefined){
            $scope.accounts = [];
            $scope.blankStateaccount = false;
          }
          $scope.account.name ='';
          $scope.accounts.push(resp);
          $scope.$apply();
     };
     // Quick Filtering
     var searchParams ={};
     $scope.result = undefined;
     $scope.q = undefined;

     
     $scope.selectResult = function(){
          window.location.replace('#/accounts/show/'+$scope.searchQuery.id);
     };
     $scope.executeSearch = function(searchQuery){
        if (typeof(searchQuery)=='string'){
           var goToSearch = 'type:Account ' + searchQuery;
           window.location.replace('#/search/'+goToSearch);
        }else{
          window.location.replace('#/accounts/show/'+searchQuery.id);
        }
        $scope.searchQuery=' ';
        $scope.$apply();
     };
     // Sorting
     $scope.orderBy = function(order){

        var params = { 'order': order,
                        'limit':20};
        $scope.order = order;
        Account.list($scope,params);
     };
     $scope.filterByOwner = function(filter){
        if (filter){
          var params = { 'owner': filter,
                         'order': $scope.order,
                         'limit':20}
        }
        else{
          var params = {
              'order': $scope.order,

              'limit':20}
        };
        $scope.isFiltering = true;
        Account.list($scope,params);
     };

/***********************************************
      HKA 14.02.2014  tags
***************************************************************************************/
$scope.listTags=function(){
      var paramsTag = {'about_kind':'Account'}
      Tag.list($scope,paramsTag);

     };
$scope.edgeInserted = function () {
       $scope.listaccounts();
     };
$scope.listaccounts = function(){
  var params = { 'order': $scope.order,
                      'limit':20/*,
                      'pageToken':$scope.pages[currentPage]*/}
          Account.list($scope,params);
};


$scope.addNewtag = function(tag){
       var params = {
                          'name': tag.name,
                          'about_kind':'Account',
                          'color':tag.color.color
                      }  ;
       Tag.insert($scope,params);

        var paramsTag = {'about_kind':'Account'};
        Tag.list($scope,paramsTag);
        tag.name='';
        $scope.tag.color= {'name':'green','color':'#BBE535'};


     }
$scope.updateTag = function(tag){
            params ={ 'id':tag.id,
                      'title': tag.name,
                      'status':tag.color
            };
      Tag.patch($scope,params);
  };
  $scope.deleteTag=function(tag){
          params = {
            'entityKey': tag.entityKey
          }
          Tag.delete($scope,params);

      };

 $scope.listTags=function(){
  var paramsTag = {'about_kind':'Account'};
      Tag.list($scope,paramsTag);
     };

$scope.selectTag= function(tag,index,$event){
      if(!$scope.manage_tags){
         var element=$($event.target);
         if(element.prop("tagName")!='LI'){
              element=element.parent().closest('LI');
         }
         var text=element.find(".with-color");
         if($scope.selected_tags.indexOf(tag) == -1){
            $scope.selected_tags.push(tag);
            element.css('background-color', tag.color+'!important');
            text.css('color',$scope.idealTextColor(tag.color));

         }else{
            element.css('background-color','#ffffff !important');
            $scope.selected_tags.splice($scope.selected_tags.indexOf(tag),1);
            text.css('color',$scope.idealTextColor(tag.color));
         }

         $scope.filterByTags($scope.selected_tags);

      }

    };
  $scope.filterByTags = function(selected_tags){


         var tags = [];
         angular.forEach(selected_tags, function(tag){
            tags.push(tag.entityKey);
         });
         var params = {
          'tags': tags,
          'order': $scope.order,
          'limit':20
         };
         $scope.isFiltering = true;
         Account.list($scope,params);

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
    $scope.listaccounts();

 };


$scope.manage=function(){
        $scope.unselectAllTags();
      };
$scope.tag_save = function(tag){
          if (tag.name) {
             Tag.insert($scope,tag);
             console.log("tag saved");
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
      console.log('************** Edge *********************');
      console.log(params);

      Edge.insert($scope,params);
      $('#assigneeTagsToTask').modal('hide');

     };

     var handleColorPicker = function () {
          if (!jQuery().colorpicker) {
              return;
              console.log('errooooooooooooooor');
              console.log("working******************************");
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

      }
      $scope.disassociate=function(tag){
        $scope.disassociated=tag;

      }
      $scope.inTag=function(tag){

        $scope.disassociated=tag;

      }
      $scope.dropTag=function(account,index){
        var items = [];

        var params = {
              'parent': account.entityKey,
              'tag_key': $scope.draggedTag.entityKey
        };
        $scope.draggedTag=null;
        Tag.attach($scope,params,index);




      };
      $scope.tagattached=function(tag,index){
          if ($scope.accounts[index].tags == undefined){
            $scope.accounts[index].tags = [];
          }
          var ind = $filter('exists')(tag, $scope.accounts[index].tags);
           if (ind == -1) {
                $scope.accounts[index].tags.push(tag);
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



     // Google+ Authentication
     Auth.init($scope);
     $(window).scroll(function() {
          if (!$scope.isLoading && ($(window).scrollTop() >  $(document).height() - $(window).height() - 100)) {
              $scope.listMoreItems();
          }
      });

}]);
app.controller('AccountShowCtrl', ['$scope','$filter', '$route','Auth','Account','Contact','Case','Opportunity', 'Topic','Note','Task','Event','Permission','User','Attachement','Email','Need','Opportunitystage','Casestatus','Map','InfoNode',
   function($scope,$filter,$route,Auth,Account,Contact,Case,Opportunity,Topic,Note,Task,Event,Permission,User,Attachement,Email,Need,Opportunitystage,Casestatus,Map,InfoNode) {
       $("ul.page-sidebar-menu li").removeClass("active");
       $("#id_Accounts").addClass("active");

       $scope.selectedTab = 2;
       $scope.isSignedIn = false;
       $scope.immediateFailed = false;
       $scope.nextPageToken = undefined;
       $scope.prevPageToken = undefined;
       $scope.isLoading = false;
       $scope.pagination = {};
       $scope.currentPage = 01;
       //HKA 10.12.2013 Var topic to manage Next & Prev
       $scope.topicCurrentPage=01;
       $scope.topicpagination={};
       $scope.topicpages = [];
       //HKA 10.12.2013 Var Contact to manage Next & Prev
       $scope.contactpagination={};
       $scope.contactCurrentPage=01;
       $scope.contactpages = [];
       //HKA 11.12.2013 var Opportunity to manage Next & Prev
       $scope.opppagination = {};
       $scope.oppCurrentPage=01;
       $scope.opppages=[];
       //HKA 11.12.2013 var Case to manage Next & Prev
       $scope.casepagination = {};
       $scope.caseCurrentPage=01;
       $scope.casepages=[];
       $scope.needspagination = {};
       $scope.needsCurrentPage=01;
       $scope.needspages=[];
       $scope.documentpagination = {};
       $scope.documentCurrentPage=01;
       $scope.documentpages=[];
       $scope.pages = [];
       $scope.accounts = [];
       $scope.users = [];
       $scope.user = undefined;
       $scope.slected_memeber = undefined;
       $scope.email = {};
       $scope.stage_selected={};
       $scope.status_selected={};
       $scope.infonodes = {};
       $scope.phone={};
       $scope.phone.type= 'work';
       $scope.need = {};
       $scope.need.need_status = 'pending';
       $scope.need.priority = 'Medium';
       $scope.casee = {};
       $scope.casee.priority = 4;
       $scope.casee.status = 'pending';
       $scope.addingTask = false;
       $scope.sharing_with = [];
       $scope.edited_email = null;
       $scope.currentParam={};
       $scope.showPhoneForm=false;
      $scope.showEmailForm=false;
      $scope.showWebsiteForm=false;
      $scope.showSociallinkForm=false;
      $scope.showCustomFieldForm =false;
       //$scope.cases = {};
       //$scope.cases = [];
       $scope.opportunities = [];
       $scope.phones=[];
       $scope.emails=[];
       $scope.opportunities = {};
        $scope.statuses = [
          {value: 'Home', text: 'Home'},
          {value: 'Work', text: 'Work'},
          {value: 'Mob', text: 'Mob'},
          {value: 'Other', text: 'Other'}
        ];
        $scope.showUpload=false;
        $scope.logo = {
                    'logo_img_id':null,
                    'logo_img_url':null
                  };


        $scope.editdata={'edit':'test()'};
        $scope.percent = 0;
        $scope.chartOptions = {
            animate:{
                duration:0,
                enabled:false
            },
            size:100,
            barColor:'#58a618',
            scaleColor:false,
            lineWidth:7,
            lineCap:'circle'
        };
        $scope.closed_date=new Date();
       // What to do after authentication
       $scope.runTheProcess = function(){
          var params = {
                          'id':$route.current.params.accountId,

                          'topics':{
                            'limit': '7'
                          },

                          'contacts':{
                            'limit': '6'
                          },

                          'needs':{
                            'limit': '6'
                          },

                          'opportunities':{
                            'limit': '6'
                          },

                          'cases':{
                            'limit': '6'
                          },

                          'documents':{
                            'limit': '6'
                          },

                          'tasks':{

                          },

                          'events':{

                          }


                          };
          Account.get($scope,params);
          User.list($scope,{});
          Opportunitystage.list($scope,{});
          Casestatus.list($scope,{});




       };
        $(window).resize(function() {
            var leftMargin=$(".chart").parent().width()-$(".chart").width();
            $(".chart").css( "left",leftMargin/2);
            $(".oppStage").css( "left",leftMargin/2);
        });
       $scope.test=function(email){
        console.log(email);
       };
       $scope.preparePercent = function(percent){

            return parseInt(percent);
       };

       $scope.getPosition= function(index){
        if(index<4){

          return index+1;
        }else{
          return (index%4)+1;
        }
     };
     $scope.waterfallTrigger= function(){


           /* $('.waterfall').hide();
          $('.waterfall').show();*/
          $( window ).trigger( "resize" );
          if($(".chart").parent().width()==0){
           var leftMargin=210-$(".chart").width();
                  $(".chart").css( "left",leftMargin/2);
                  $(".oppStage").css( "left",leftMargin/2-2);
          }else{
              var leftMargin=$(".chart").parent().width()-$(".chart").width();
                  $(".chart").css( "left",leftMargin/2);
                  $(".oppStage").css( "left",leftMargin/2-2);

          }
     };

       // We need to call this to refresh token when user credentials are invalid
       $scope.refreshToken = function() {
            Auth.refreshToken();
       };
    //HKA 06.12.2013  Manage Next & Prev Page of Topics
     $scope.TopiclistNextPageItems = function(){


        var nextPage = $scope.topicCurrentPage + 1;
        var params = {};
          if ($scope.topicpages[nextPage]){
            params = {
                      'id':$scope.account.id,
                        'topics':{
                          'limit': '7',
                          'pageToken':$scope.topicpages[nextPage]
                        }
                     }
            }else{
            params = {
                      'id':$scope.account.id,
                        'topics':{
                          'limit': '7'
                        }
                     }
          }

          $scope.topicCurrentPage = $scope.topicCurrentPage + 1 ;
          Account.get($scope,params);
     }
     $scope.editTrigger=function(name){
        name.$show();
     }
  // HKA 08.05.2014 Delete infonode

  $scope.deleteInfonode = function(entityKey,kind){
    var params = {'entityKey':entityKey,'kind':kind};

    InfoNode.delete($scope,params);

  };
     $scope.TopiclistPrevPageItems = function(){

       var prevPage = $scope.topicCurrentPage - 1;
       var params = {};

          if ($scope.topicpages[prevPage]){
            params = {
                      'id':$scope.account.id,
                        'topics':{
                          'limit': '7',
                          'pageToken':$scope.topicpages[prevPage]
                        }
                     }
          }else{
            params = {
                      'id':$scope.account.id,
                        'topics':{
                          'limit': '7'
                        }
                     }
          }
          $scope.topicCurrentPage = $scope.topicCurrentPage - 1 ;
          Account.get($scope,params);

     }

//HKA 06.12.2013 Manage Prev & Next Page on Related List Contact
$scope.ContactlistNextPageItems = function(){


        var nextPage = $scope.contactCurrentPage + 1;
        var params = {};
          if ($scope.contactpages[nextPage]){
            params = {
                        'id':$scope.account.id,
                        'contacts':{
                          'limit': '6',
                          'pageToken':$scope.contactpages[nextPage]
                        }
                     }
          }else{
            params = {
                        'id':$scope.account.id,
                        'contacts':{
                          'limit': '6'
                        }
                      }
          }

          $scope.contactCurrentPage = $scope.contactCurrentPage + 1 ;
          Account.get($scope,params);
     }
     $scope.ContactlistPrevPageItems = function(){

       var prevPage = $scope.contactCurrentPage - 1;
       var params = {};
          if ($scope.contactpages[prevPage]){
            params = {
                      'id':$scope.account.id,
                        'contacts':{
                          'limit': '6',
                          'pageToken':$scope.contactpages[prevPage]
                        }
                     }
          }else{
            params = {
                      'id':$scope.account.id,
                        'contacts':{
                          'limit': '6'
                        }
                     }
          }
          $scope.contactCurrentPage = $scope.contactCurrentPage - 1 ;
          Account.get($scope,params);
     }
/// update account with inlineEdit
  $scope.inlinePatch=function(kind,edge,name,entityKey,value){

   if (kind=='Account') {
          params = {'id':$scope.account.id,
             name:value}
         Account.patch($scope,params);
   }else{



          params = {
                  'entityKey': entityKey,
                  'parent':$scope.account.entityKey,
                  'kind':edge,
                  'fields':[

                      {
                        "field": name,
                        "value": value
                      }
                  ]
        };

         InfoNode.patch($scope,params);
   }


  };


//HKA 07.12.2013 Manage Prev & Next Page on Related List Opportunities
$scope.OpplistNextPageItems = function(){


        var nextPage = $scope.oppCurrentPage + 1;
        var params = {};
          if ($scope.opppages[nextPage]){
            params = {
                      'id':$scope.account.id,
                        'opportunities':{
                          'limit': '6',
                          'pageToken':$scope.opppages[nextPage]
                        }
                     }
            }else{
            params = {
                      'id':$scope.account.id,
                        'opportunities':{
                          'limit': '6'
                        }
                     }
          }
          $scope.oppCurrentPage = $scope.oppCurrentPage + 1 ;
          Account.get($scope,params);
     }
     $scope.OppPrevPageItems = function(){

       var prevPage = $scope.oppCurrentPage - 1;
       var params = {};
          if ($scope.opppages[prevPage]){
            params = {
                      'id':$scope.account.id,
                        'opportunities':{
                          'limit': '6',
                          'pageToken':$scope.opppages[prevPage]
                        }
                     }
            }else{
            params = {
                      'id':$scope.account.id,
                        'opportunities':{
                          'limit': '6'
                        }
                     }
          }
          $scope.oppCurrentPage = $scope.oppCurrentPage - 1 ;
          Account.get($scope,params);
     };

     //HKA 07.12.2013 Manage Prev & Next Page on Related List Cases
$scope.CaselistNextPageItems = function(){


        var nextPage = $scope.caseCurrentPage + 1;
        var params = {};
          if ($scope.casepages[nextPage]){
            params = {
                      'id':$scope.account.id,
                        'cases':{
                          'limit': '6',
                          'pageToken':$scope.casepages[nextPage]
                        }
                     }
          }else{
            params = {
                      'id':$scope.account.id,
                        'cases':{
                          'limit': '6'
                        }
                     }
          }
          $scope.caseCurrentPage = $scope.caseCurrentPage + 1 ;
          Account.get($scope,params);
     }
     $scope.CasePrevPageItems = function(){

       var prevPage = $scope.caseCurrentPage - 1;
       var params = {};
          if ($scope.casepages[prevPage]){
            params = {
                      'id':$scope.account.id,
                        'cases':{
                          'limit': '6',
                          'pageToken':$scope.casepages[prevPage]
                        }
                     }
            }else{
            params = {
                      'id':$scope.account.id,
                        'cases':{
                          'limit': '6'
                        }
                     }
          }
          $scope.caseCurrentPage = $scope.caseCurrentPage - 1 ;
          Account.get($scope,params);
     };
     $scope.NeedlistNextPageItems = function(){


        var nextPage = $scope.needsCurrentPage + 1;
        var params = {};
          if ($scope.needspages[nextPage]){
            params = {
                      'id':$scope.account.id,
                        'needs':{
                          'limit': '6',
                          'pageToken':$scope.needspages[nextPage]
                        }
                     }

          }else{
            params = {
                      'id':$scope.account.id,
                        'needs':{
                          'limit': '6'
                        }
                     }
          }
          $scope.needsCurrentPage = $scope.needsCurrentPage + 1 ;
          Account.get($scope,params);
     }
     $scope.NeedPrevPageItems = function(){

       var prevPage = $scope.needsCurrentPage - 1;
       var params = {};
          if ($scope.needspages[prevPage]){
            params = {
                      'id':$scope.account.id,
                        'needs':{
                          'limit': '6',
                          'pageToken':$scope.needspages[prevPage]
                        }
                     }
          }else{
            params = {
                      'id':$scope.account.id,
                        'needs':{
                          'limit': '6'
                        }
                     }
          }
          $scope.needsCurrentPage = $scope.needsCurrentPage - 1 ;
          Account.get($scope,params);
     };
  // HKA 09.02.2014 Manage Next Prev page on ducument list
     $scope.DocumentlistNextPageItems = function(){


        var nextPage = $scope.documentCurrentPage + 1;
        var params = {};
          if ($scope.documentpages[nextPage]){
            params = {
                        'id':$scope.account.id,
                        'documents':{
                          'limit': '6',
                          'pageToken':$scope.documentpages[nextPage]
                        }
                      }

          }else{
            params = {
                        'id':$scope.account.id,
                        'documents':{
                          'limit': '6'
                        }
                      }
            }
          $scope.documentCurrentPage = $scope.documentCurrentPage + 1 ;

          Account.get($scope,params);

     }
     $scope.DocumentPrevPageItems = function(){

       var prevPage = $scope.documentCurrentPage - 1;
       var params = {};
          if ($scope.documentpages[prevPage]){
            params = {
                        'id':$scope.account.id,
                        'documents':{
                          'limit': '6',
                          'pageToken':$scope.documentpages[prevPage]
                        }
                      }

          }else{
            params = {
                        'id':$scope.account.id,
                        'documents':{
                          'limit': '6'
                        }
                      }
          }
          $scope.documentCurrentPage = $scope.documentCurrentPage - 1 ;
          Account.get($scope,params);


     };


     $scope.listTopics = function(account){
        var params = {
                      'id':$scope.account.id,
                      'topics':{
                             'limit': '7'
                       }
                    };
          Account.get($scope,params);

     }
     $scope.listDocuments = function(){
        var params = {
                        'id':$scope.account.id,
                        'documents':{
                          'limit': '6'
                        }
                      }
        Account.get($scope,params);

     }

     $scope.hilightTopic = function(){

       $('#topic_0').effect( "bounce", "slow" );
       $('#topic_0 .message').effect("highlight","slow");
     }


     $scope.selectMember = function(){
        $scope.slected_memeber = $scope.user;
        $scope.user = '';
        $scope.sharing_with.push($scope.slected_memeber);

     };
     $scope.showCreateDocument = function(type){

        $scope.mimeType = type;
        $('#newDocument').modal('show');
     };
     $scope.createDocument = function(newdocument){
        var mimeType = 'application/vnd.google-apps.' + $scope.mimeType;
        var params = {
                      'parent': $scope.account.entityKey,
                      'title':newdocument.title,
                      'mimeType':mimeType
                     };
        Attachement.insert($scope,params);

     };
     $scope.createPickerUploader = function() {
          var projectfolder = $scope.account.folder;
          var developerKey = 'AIzaSyCqpqK8oOc4PUe77_nNYNvzh9xhTWd_gJk';
          var docsView = new google.picker.DocsView()
              .setIncludeFolders(true)
              .setSelectFolderEnabled(true);
          var picker = new google.picker.PickerBuilder().
              addView(new google.picker.DocsUploadView().setParent(projectfolder)).
              addView(docsView).
              setCallback($scope.uploaderCallback).
              setOAuthToken(window.authResult.access_token).
              setDeveloperKey(developerKey).
              setAppId(987765099891).
                enableFeature(google.picker.Feature.MULTISELECT_ENABLED).
              build();
          picker.setVisible(true);
      };
      // A simple callback implementation.
      $scope.uploaderCallback = function(data) {


        if (data.action == google.picker.Action.PICKED) {
                var params = {
                              'access': $scope.account.access,
                              'parent':$scope.account.entityKey
                            };
                params.items = new Array();

                 $.each(data.docs, function(index) {

                      var item = { 'id':data.docs[index].id,
                                  'title':data.docs[index].name,
                                  'mimeType': data.docs[index].mimeType,
                                  'embedLink': data.docs[index].url

                      };
                      params.items.push(item);

                  });
                 Attachement.attachfiles($scope,params);


                }
      }
     $scope.createLogoPickerUploader = function() {
          var developerKey = 'AIzaSyCqpqK8oOc4PUe77_nNYNvzh9xhTWd_gJk';
          var picker = new google.picker.PickerBuilder().
              addView(new google.picker.DocsUploadView()).
              setCallback($scope.logoUploaderCallback).
              setOAuthToken(window.authResult.access_token).
              setDeveloperKey(developerKey).
              setAppId(987765099891).
              build();
          picker.setVisible(true);
      };
      // A simple callback implementation.
      $scope.logoUploaderCallback = function(data) {
          if (data.action == google.picker.Action.PICKED) {
                if(data.docs){
                  $scope.logo.logo_img_id = data.docs[0].id ;
                  $scope.logo.logo_img_url = data.docs[0].url ;
                  $scope.imageSrc = 'https://docs.google.com/uc?id='+data.docs[0].id;
                  $scope.$apply();
                  var params ={'id':$scope.account.id};
                  params['logo_img_id'] = $scope.logo.logo_img_id;
                  params['logo_img_url'] = $scope.logo.logo_img_url;
                  Account.patch($scope,params);
                }
          }
      }
     $scope.share = function(slected_memeber){

        $scope.$watch($scope.account.access, function() {
         var body = {'access':$scope.account.access};
         var id = $scope.account.id;
         var params ={'id':id,
                      'access':$scope.account.access}
         Account.patch($scope,params);
        });
        $('#sharingSettingsModal').modal('hide');

        if ($scope.sharing_with.length>0){

          var items = [];

          angular.forEach($scope.sharing_with, function(user){
                      var item = {
                                  'type':"user",
                                  'value':user.entityKey
                                };
                      items.push(item);
          });

          if(items.length>0){
              var params = {
                            'about': $scope.account.entityKey,
                            'items': items
              }
              Permission.insert($scope,params);
          }


          $scope.sharing_with = [];


        }

     };

     $scope.updateCollaborators = function(){
          var accountid = {'id':$route.current.params.accountId};
          Account.get($scope,accountid);

     };
     $scope.showModal = function(){
        console.log('button clicked');
        $('#addAccountModal').modal('show');

      };

    $scope.addNote = function(note){
      var params ={
                  'about': $scope.account.entityKey,
                  'title': note.title,
                  'content': note.content
      };
      Note.insert($scope,params);
      $scope.note.title = '';
      $scope.note.content = '';
    };




    $scope.editaccount = function() {
       $('#EditAccountModal').modal('show');
    };
    //HKA 22.11.2013 Edit tagline of Account
    $scope.edittagline = function() {
       $('#EditTagModal').modal('show');
    };
    //HKA Edit Introduction on Account
    $scope.editintro = function() {
       $('#EditIntroModal').modal('show');
    };


    //HKA 09.11.2013 Add a new Tasks
   $scope.addTask = function(task){

        $('#myModal').modal('hide');
        if (task.due){

            var dueDate= $filter('date')(task.due,['yyyy-MM-ddT00:00:00.000000']);

            params ={'title': task.title,
                      'due': dueDate,
                      'parent': $scope.account.entityKey
            }


        }else{
            params ={'title': task.title,
                     'parent': $scope.account.entityKey
                   }
        };
        $scope.task.title='';
        $scope.task.dueDate='0000-00-00T00:00:00-00:00';
        Task.insert($scope,params);

     };

     $scope.hilightTask = function(){

        $('#task_0').effect("highlight","slow");
        $('#task_0').effect( "bounce", "slow" );

     };
     $scope.listTasks = function(){
        var params = {
                        'id':$scope.account.id,
                        'tasks':{}
                      };
        Account.get($scope,params);
    };
//HKA 11.11.2013 Add new Event
 $scope.addEvent = function(ioevent){

        $('#newEventModal').modal('hide');
        var params ={}

        if (ioevent.starts_at){
            if (ioevent.ends_at){
              params ={'title': ioevent.title,
                      'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'ends_at': $filter('date')(ioevent.ends_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'where': ioevent.where,
                      'parent':$scope.account.entityKey
              }

            }else{
              params ={
                'title': ioevent.title,
                      'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'where': ioevent.where,
                      'parent':$scope.account.entityKey
              }
            }

            Event.insert($scope,params);
            $scope.ioevent.title='';
            $scope.ioevent.where='';
            $scope.ioevent.starts_at='T00:00:00.000000';
          };
     };
     $scope.hilightEvent = function(){

        $('#event_0').effect("highlight","slow");
        $('#event_0').effect( "bounce", "slow" );

     };
     $scope.listEvents = function(){
        var params = {
                        'id':$scope.account.id,
                        'events':{

                        }
                      };
        Account.get($scope,params);

     };

  //HKA 18.11.2013 Show modal Related list (Contact)

  $scope.addContactModal = function(){
    $('#addContactModal').modal('show');
  };

  // HKA 18.11.2013 Show modal Related list (Opportunity)
  $scope.addOppModal = function(){
    $('#addOpportunityModal').modal('show');
  };

  //HKA 18.11.2013 Show modal Related list (Case)
  $scope.addCaseModal = function(){
    $('#addCaseModal').modal('show');
  };
  $scope.addNeedModal = function(){
    $('#addNeedModal').modal('show');
  };

  //HKA 22.11.2013 List of Contacts related to account
   $scope.listContacts = function(){
    var params = {
                  'id':$scope.account.id,
                  'contacts':{
                    'limit': '6'
                  }
                 };
    Account.get($scope,params);
   };

  //HKA 22.11.2013 List of Opportunities related to account
   $scope.listOpportunities = function(){
    var params = {
                  'id':$scope.account.id,
                  'opportunities':{
                    'limit': '6'
                  }
                 };
    Account.get($scope,params);
   };

  //HKA 22.11.2013 List of Cases related to account
   $scope.listCases = function(){

    var params = {
                  'id':$scope.account.id,
                  'cases':{
                    'limit': '6'
                  }
                 };
    Account.get($scope,params);

   };
   $scope.listNeeds = function(){

    var params = {
                  'id':$scope.account.id,
                  'needs':{
                    'limit': '6'
                  }
                 };
    Account.get($scope,params);

   };

//HKA 19.11.2013 Add Contact related to account

    $scope.savecontact = function(contact){
        var contact_name = new Array();
        contact_name.push(contact.firstname);
        contact_name.push(contact.lastname);

         var params = {'lastname':contact.lastname,
                      'firstname':contact.firstname,
                      'title': contact.title,
                      'account':$scope.account.entityKey,
                      'account_name': $scope.account.name,
                      'display_name': contact_name,
                      'access': $scope.account.access
                      };

        console.log(params);

        Contact.insert($scope,params);
        $('#addContactModal').modal('hide');
      };
  // HKA 19.11.2013 Add Opportunty related to account
    $scope.saveOpp = function(opportunity){

       var params = {'name':opportunity.name,
                      'amount': opportunity.amount,
                      'account':$scope.account.entityKey,
                      'stage' :$scope.stage_selected.entityKey,
                      'access': $scope.account.access
                      };


      Opportunity.insert($scope,params);
      $('#addOpportunityModal').modal('hide');
    };

  // HKA 19.11.2013 Add Case related to account
    $scope.saveCase = function(casee){

        var params = {'name':casee.name,
                      'priority':casee.priority,
                      'status': $scope.status_selected.entityKey,
                      'account':$scope.account.entityKey,
                      'access': $scope.account.access,
                      'status_name': $scope.status_selected.name
                      };
      Case.insert($scope,params);
      $('#addCaseModal').modal('hide');
    };
    $scope.saveNeed = function(need){


        var params = {'name':need.name,
                      'description': need.description,
                      'priority':need.priority,
                      'need_status': need.need_status,
                      'folder': $scope.account.folder,
                      'parent': $scope.account.entityKey,
                      'access': $scope.account.access
                      };

      Need.insert($scope,params);
      $('#addNeedModal').modal('hide');

    };
 $scope.listInfonodes = function(kind) {
     params = {'parent':$scope.account.entityKey,
               'connections': kind
              };
     InfoNode.list($scope,params);
      $scope.$apply();

 }
//HKA 19.11.2013 Add Phone
 $scope.addPhone = function(phone){

    params = {'parent':$scope.account.entityKey,
              'kind':'phones',
              'fields':[
                  {
                    "field": "type",
                    "value": phone.type
                  },
                  {
                    "field": "number",
                    "value": phone.number
                  }
              ]
    };
    InfoNode.insert($scope,params);

      $scope.phone={};
       $scope.phone.type= 'work';

      $scope.showPhoneForm=false;


  };

   $scope.patchPhoneNumber = function(entityKey, data){


    params = {
              'entityKey': entityKey,
              'parent':$scope.account.entityKey,
              'kind':'phones',
              'fields':[

                  {
                    "field": "number",
                    "value": data
                  }
              ]
    };
     InfoNode.patch($scope,params);
  };


//HKA 20.11.2013 Add Email
$scope.addEmail = function(email){

  params = {'parent':$scope.account.entityKey,
            'kind':'emails',
            'fields':[
                {
                  "field": "email",
                  "value": email.email
                }
            ]
  };
  InfoNode.insert($scope,params);
  $scope.email={};
  $scope.showEmailForm = false;
  };



//HKA 22.11.2013 Add Website
$scope.addWebsite = function(website){

  params = {'parent':$scope.account.entityKey,
            'kind':'websites',
            'fields':[
                {
                  "field": "url",
                  "value": website.url
                }
            ]
  };
  InfoNode.insert($scope,params);
      $scope.website={};
      $scope.showWebsiteForm=false;
};

//HKA 22.11.2013 Add Social
$scope.addSocial = function(social){
  params = {'parent':$scope.account.entityKey,
            'kind':'sociallinks',
            'fields':[
                {
                  "field": "url",
                  "value": social.url
                }
            ]
  };
  InfoNode.insert($scope,params);
  $scope.sociallink={};
  $scope.showSociallinkForm=false;

};
$scope.addCustomField = function(customField){
  params = {'parent':$scope.account.entityKey,
            'kind':'customfields',
            'fields':[
                {
                  "field": customField.field,
                  "value": customField.value
                }
            ]
  };
  InfoNode.insert($scope,params);
    $scope.customfield={};
    $scope.showCustomFieldForm = false;

};
//HKA 22.11.2013 Add Tagline
$scope.updateTagline = function(account){

  params = {'id':$scope.account.id,
             'tagline':account.tagline}
  Account.patch($scope,params);
  $('#EditTagModal').modal('hide');
};

//HKA 22.11.2013 Add Introduction
$scope.updateintro = function(account){

  params = {'id':$scope.account.id,
             'introduction':account.introduction}
  Account.patch($scope,params);
  $('#EditIntroModal').modal('hide');
};
//HKA 22.11.2013 Add Account
$scope.updatAccountHeader = function(account){

  params = {'id':$scope.account.id,
             'name':account.name,
           'account_type':account.account_type,
           'industry':account.industry}
  Account.patch($scope,params);
  $('#EditAccountModal').modal('hide');
};

    $('#some-textarea').wysihtml5();

      $scope.sendEmail = function(email){
        email.body = $('#some-textarea').val();

        var params = {
                  'to': email.to,
                  'cc': email.cc,
                  'bcc': email.bcc,
                  'subject': email.subject,
                  'body': email.body,

                  'about_item':$scope.account.id,
                  'about_kind':'Account' };

        Email.send($scope,params);
      };


$scope.editbeforedelete = function(){
     $('#BeforedeleteAccount').modal('show');
   };
$scope.beforedeleteInfonde = function(){
    $('#BeforedeleteInfonode').modal('show');
}
$scope.deleteaccount = function(){
     var accountKey = {'entityKey':$scope.account.entityKey};
     Account.delete($scope,accountKey);

     $('#BeforedeleteAccount').modal('hide');
};

      $scope.renderMaps = function(){

          $scope.addresses = $scope.account.addresses;
          Map.render($scope);
      };
      $scope.addAddress = function(address){

        Map.searchLocation($scope,address);

        $('#addressmodal').modal('hide');
        $scope.address={};
      };
      $scope.locationUpdated = function(addressArray){

          var params = {'id':$scope.account.id,
                         'addresses':addressArray};
          console.log(params);
          Account.patch($scope,params);
      };
      $scope.addGeo = function(address){
          params = {'parent':$scope.account.entityKey,
            'kind':'addresses',
            'fields':[
                {
                  "field": "street",
                  "value": address.street
                },
                {
                  "field": "city",
                  "value": address.city
                },
                {
                  "field": "state",
                  "value": address.state
                },
                {
                  "field": "postal_code",
                  "value": address.postal_code
                },
                {
                  "field": "country",
                  "value": address.country
                }
            ]
          };
          if (address.lat){
            params = {'parent':$scope.account.entityKey,
            'kind':'addresses',
            'fields':[
                {
                  "field": "street",
                  "value": address.street
                },
                {
                  "field": "city",
                  "value": address.city
                },
                {
                  "field": "state",
                  "value": address.state
                },
                {
                  "field": "postal_code",
                  "value": address.postal_code
                },
                {
                  "field": "country",
                  "value": address.country
                },
                {
                  "field": "lat",
                  "value": address.lat.toString()
                },
                {
                  "field": "lon",
                  "value": address.lon.toString()
                }
              ]
            };
          }
          InfoNode.insert($scope,params);
      };
  //HKA 08.01.2014
  $scope.About_render = function(accid){
   console.log('we are on About Render');
    var acc = Account.get($scope,accountid);

          $scope.addresses = acc.addresses;
          Map.render($scope);
  };

  $scope.idealTextColor=function(bgColor){
         var nThreshold = 105;
         var components = getRGBComponents(bgColor);
         var bgDelta = (components.R * 0.299) + (components.G * 0.587) + (components.B * 0.114);

         return ((255 - bgDelta) < nThreshold) ? "#000000" : "#ffffff";
  };
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

    $scope.getTopicUrl = function(type,id){
      return Topic.getUrl(type,id);
    };
//HKA 12.03.2014 Edit infonode
$scope.edit_email=function(email){

        $scope.edited_email=email;
     };

$scope.editTag=function(tag){
        $scope.edited_tag=tag;
     }
$scope.doneEditTag=function(tag){
        $scope.edited_tag=null;
        $scope.updateTag(tag);
     };

     $scope.initObject=function(obj){
          for (var key in obj) {
                obj[key]=null;
              }
      }

          $scope.pushElement=function(elem,arr){
          if (arr.indexOf(elem) == -1) {
              var copyOfElement = angular.copy(elem);
              arr.push(copyOfElement);
              console.log(elem);
              $scope.initObject(elem);

          }else{
            alert("item already exit");
          }
      }


     // Google+ Authentication
     Auth.init($scope);

}]);


app.controller('AccountNewCtrl', ['$scope','Auth','Account','Tag','Edge',
    function($scope,Auth,Account,Tag,Edge) {
      $("ul.page-sidebar-menu li").removeClass("active");
      $("#id_Accounts").addClass("active");

      document.title = "Accounts: New";
      $scope.isSignedIn = false;
      $scope.immediateFailed = false;
      $scope.nextPageToken = undefined;
      $scope.prevPageToken = undefined;
      $scope.isLoading = false;
      $scope.leadpagination = {};
      $scope.currentPage = 01;
      $scope.pages = [];
      $scope.stage_selected={};
      $scope.accounts = [];
      $scope.account = {};
      $scope.account.access ='public';
      $scope.order = '-updated_at';
      $scope.status = 'New';
      $scope.showPhoneForm=false;
      $scope.showEmailForm=false;
      $scope.showWebsiteForm=false;
      $scope.showSociallinkForm=false;
      $scope.showCustomFieldForm =false;
      $scope.phones=[];
      $scope.addresses=[];
      $scope.emails=[];
      $scope.websites=[];
      $scope.sociallinks=[];
      $scope.customfields=[];
      $scope.account.account_type = 'Customer';
      $scope.account.industry = 'Technology';
      $scope.phone = {}
      $scope.phone.type= 'work';
    
            $scope.logo = {
                    'logo_img_id':null,
                    'logo_img_url':null
                  };
      $scope.imageSrc = '/static/img/default_company.png';
      $scope.initObject=function(obj){
          for (var key in obj) {
                obj[key]=null;
              }
      }
      $scope.pushElement=function(elem,arr,infos){
        
                  if (arr.indexOf(elem) == -1) {
              var copyOfElement = angular.copy(elem);
              arr.push(copyOfElement);
              $scope.initObject(elem);
              switch(infos){
                case 'phones' :
                   $scope.showPhoneForm=false;
                   $scope.phone.type= 'work';
                break;
                case 'emails' :
                   $scope.showEmailForm=false;
                break;
                case 'websites' :
                    $scope.showWebsiteForm=false;
                break;
                case 'sociallinks' :
                   $scope.showSociallinkForm=false;
                break;
                case 'customfields' :
                   $scope.showCustomFieldForm=false;
                break; 
                case 'addresses' :
                    $('#addressmodal').modal('hide');
                
                break;
              }

              
          }else{
            alert("item already exit");
          }
      };
   //HKA 01.06.2014 Delete the infonode on DOM
      $scope.deleteInfos = function(arr,index){
          arr.splice(index, 1);
      }
      $scope.runTheProcess = function(){
            /*Account.list($scope,{});*/
       };
        // We need to call this to refresh token when user credentials are invalid
       $scope.refreshToken = function() {
            Auth.refreshToken();
       };
      // new Lead
     $scope.save = function(account){
          if (account.name) {
           Account.insert($scope,account);
         };
      };
      $scope.prepareInfonodes = function(){
        var infonodes = [];
        angular.forEach($scope.websites, function(website){
            var infonode = {
                            'kind':'websites',
                            'fields':[
                                    {
                                    'field':"url",
                                    'value':website.url
                                    }
                            ]

                          }
            infonodes.push(infonode);
        });
        angular.forEach($scope.sociallinks, function(sociallink){
            var infonode = {
                            'kind':'sociallinks',
                            'fields':[
                                    {
                                    'field':"url",
                                    'value':sociallink.url
                                    }
                            ]

                          }
            infonodes.push(infonode);
        });
        angular.forEach($scope.customfields, function(customfield){
            var infonode = {
                            'kind':'customfields',
                            'fields':[
                                    {
                                    'field':customfield.field,
                                    'value':customfield.value
                                    }
                            ]

                          }
            infonodes.push(infonode);
        });
        return infonodes;
    };
      $scope.createPickerUploader = function() {
          var developerKey = 'AIzaSyCqpqK8oOc4PUe77_nNYNvzh9xhTWd_gJk';
          var picker = new google.picker.PickerBuilder().
              addView(new google.picker.DocsUploadView()).
              setCallback($scope.uploaderCallback).
              setOAuthToken(window.authResult.access_token).
              setDeveloperKey(developerKey).
              setAppId(987765099891).
              build();
          picker.setVisible(true);
      };

      $scope.uploaderCallback = function(data) {
          if (data.action == google.picker.Action.PICKED) {
                if(data.docs){
                  $scope.logo.logo_img_id = data.docs[0].id ;
                  $scope.logo.logo_img_url = data.docs[0].url ;
                  $scope.imageSrc = 'https://docs.google.com/uc?id='+data.docs[0].id;
                  $scope.$apply();
                }
          }
      }

      $scope.accountInserted = function(resp){
          window.location.replace('/#/accounts');
      };
      $scope.save = function(account){
        if(account.name){
          var params ={
                        'name':account.name,
                        'account_type':account.account_type,
                        'industry':account.industry,
                        'tagline':account.tagline,
                        'introduction':account.introduction,
                        'phones':$scope.phones,
                        'emails':$scope.emails,
                        'infonodes':$scope.prepareInfonodes(),
                        'access': account.access,
                      };
          if ($scope.logo.logo_img_id){
              params['logo_img_id'] = $scope.logo.logo_img_id;
              params['logo_img_url'] = $scope.logo.logo_img_url;
          }
          Account.insert($scope,params);

        }
      };



    $scope.addAccountOnKey = function(account){
      if(event.keyCode == 13 && account){
          $scope.save(account);
      }
    };



   // Google+ Authentication
     Auth.init($scope);


}]);

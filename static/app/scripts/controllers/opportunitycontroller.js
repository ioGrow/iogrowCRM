app.controller('OpportunityListCtrl', ['$scope','$filter','Auth','Account','Opportunity','Opportunitystage','Search','Tag','Edge',
    function($scope,$filter,Auth,Account,Opportunity,Opportunitystage,Search,Tag,Edge) {
     $("ul.page-sidebar-menu li").removeClass("active");
     $("#id_Opportunities").addClass("active");
     document.title = "Opportunities: Home";

     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
     //HKA 11.12.2013 var Opportunity to manage Next & Prev
     $scope.opppagination = {};
     $scope.oppCurrentPage=01;
     $scope.opppages=[];

     $scope.opportunities = [];
     $scope.stage_selected={};
     $scope.opportunity = {
      'currency':'USD',
      'price_type':'fixed'
     };
     $scope.opportunity.access ='public';
     $scope.order = '-updated_at';
     $scope.selected_tags = [];
     $scope.draggedTag=null;
     $scope.showNewTag=false;
     $scope.tag = {};
     $scope.showUntag=false;
     $scope.edgekeytoDelete=undefined;
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
      $scope.percent = 0;
        $scope.chartOptions = {
            animate:{
                duration:0,
                enabled:false
            },
            size:100,
            barColor:'#58a618',
            scaleColor:'#58a618',
            lineWidth:7,
            lineCap:'circle'
        };

      // What to do after authentication
       $scope.runTheProcess = function(){
          var params = {'order' : $scope.order,'limit':20};
          Opportunity.list($scope,params);
          Opportunitystage.list($scope,{'order':'probability'});
          var paramsTag = {'about_kind':'Opportunity'};
          Tag.list($scope,paramsTag);
          // for (var i=0;i<50;i++)
          //   {
          //       var randomAmount = Math.floor((Math.random() * 100) + 1);
          //       var opportunity = {
          //                 'name':  i.toString() + ' kass ta3 lban',
          //                 'amount_total':randomAmount.toString(),
          //
          //                 'access':'public'
          //               }
          //       $scope.searchAccountQuery = 'ioCompare'
          //       $scope.save(opportunity);
          //   }
       };
       $(window).resize(function() {
        });
        // We need to call this to refresh token when user credentials are invalid
       $scope.refreshToken = function() {
            Auth.refreshToken();
       };

    $scope.getPosition= function(index){
        if(index<4){

          return index+1;
        }else{
          console.log((index%4)+1);
          return (index%4)+1;
        }
     };

     $scope.listNextPageItems = function(){

        var nextPage = $scope.oppCurrentPage + 1;
        var params = {};
          if ($scope.opppages[nextPage]){
            params = {'order' : $scope.order,
                      'limit':6,
                      'pageToken':$scope.opppages[nextPage]
                     }
          }else{
            params = {'order' : $scope.order,'limit':6}
          }
          console.log('in listNextPageItems');
          $scope.oppCurrentPage = $scope.oppCurrentPage + 1 ;
          Opportunity.list($scope,params);
     }
     $scope.listMoreItems = function(){

        var nextPage = $scope.oppCurrentPage + 1;
        var params = {};
          if ($scope.opppages[nextPage]){
            params = {'order' : $scope.order,
                      'limit':20,
                      'pageToken':$scope.opppages[nextPage]
                     }
            $scope.oppCurrentPage = $scope.oppCurrentPage + 1 ;
            Opportunity.listMore($scope,params);
          }

     }
     $scope.listPrevPageItems = function(){

       var prevPage = $scope.oppCurrentPage - 1;
       var params = {};
          if ($scope.opppages[prevPage]){
            params = {'order' : $scope.order,'limit':6,
                      'pageToken':$scope.opppages[prevPage]
                     }
          }else{
            params = {'order' : $scope.order,'limit':6}
          }
          $scope.oppCurrentPage = $scope.oppCurrentPage - 1 ;
          Opportunity.list($scope,params);
     }



     $scope.showModal = function(){
        console.log('button clicked');
        $('#addOpportunityModal').modal('show');

      };

    $scope.save = function(opportunity){
      var params = {};
      opportunity.opportunity_type = 'fixed_bid';

       opportunity.stagename= $scope.stage_selected.name;
       opportunity.stage_probability= $scope.stage_selected.probability;
       opportunity.stage = $scope.stage_selected.entityKey;

        if (typeof(opportunity.account)=='object'){
          opportunity.account_name = opportunity.account.name;
          opportunity.account_id = opportunity.account.id;
          opportunity.account = opportunity.account.entityKey;



          Opportunity.insert($scope,opportunity);
            $('#addOpportunityModal').modal('hide');

        }else if($scope.searchAccountQuery.length>0){
            // create a new account with this account name
            var params = {'name': $scope.searchAccountQuery,
                          'access': opportunity.access
            };
            $scope.opportunity = opportunity;
            Account.insert($scope,params);


        };


    };
    $scope.addOpportunityOnKey = function(opportunity){
      if(event.keyCode == 13 && opportunity.amount){
          $scope.save(opportunity);
      }


    };
    $scope.accountInserted = function(resp){
          $scope.opportunity.account = resp;
          $scope.save($scope.opportunity);
      };

    var params_search_account ={};
     $scope.result = undefined;
     $scope.q = undefined;

      $scope.$watch('searchAccountQuery', function() {
         params_search_account['q'] = $scope.searchAccountQuery;
         if ($scope.searchAccountQuery){
            Account.search($scope,params_search_account);
         };
      });
      $scope.selectAccount = function(){
        $scope.opportunity.account = $scope.searchAccountQuery;

     };
     // Quick Filtering
     var searchParams ={};
     $scope.result = undefined;
     $scope.q = undefined;

     $scope.$watch('searchQuery', function() {
         searchParams['q'] = $scope.searchQuery;
         searchParams['limit'] = 7;
         if ($scope.searchQuery){
         Opportunity.search($scope,searchParams);
       };
     });
     $scope.selectResult = function(){
          window.location.replace('#/opportunities/show/'+$scope.searchQuery.id);
     };
     $scope.executeSearch = function(searchQuery){
        if (typeof(searchQuery)=='string'){
           var goToSearch = 'type:Opportunity ' + searchQuery;
           window.location.replace('#/search/'+goToSearch);
        }else{
          window.location.replace('#/opportunities/show/'+searchQuery.id);
        }
        $scope.searchQuery=' ';
        $scope.$apply();
     };
     // Sorting
     $scope.orderBy = function(order){
        var params = { 'order': order,
                        'limit':6};
        $scope.order = order;
        Opportunity.list($scope,params);
     };
     $scope.filterByOwner = function(filter){
        if (filter){
          var params = { 'owner': filter,
                         'order': $scope.order,
                         'limit':6}
        }
        else{
          var params = {
              'order': $scope.order,

              'limit':6}
        };
        $scope.isFiltering = true;
        Opportunity.list($scope,params);
     };
     $scope.filterByStage = function(filter){
      console.log('----------hello--------');


          console.log(filter);
          var params = {
                         'stage': filter,
                         'order': $scope.order,
                         'limit':20
                       }

        $scope.isFiltering = true;
        Opportunity.list($scope,params);
     };

/***********************************************
      HKA 14.02.2014  tags
*************************************************/
$scope.listTags=function(){
      var paramsTag = {'about_kind':'Opportunity'}
      Tag.list($scope,paramsTag);
     };
$scope.edgeInserted = function () {
       $scope.listopportunities();
     };
$scope.listopportunities = function(){
  var params = { 'order': $scope.order,
                        'limit':6}
          Opportunity.list($scope,params);
};


$scope.addNewtag = function(tag){
       var params = {
                          'name': tag.name,
                          'about_kind':'Opportunity',
                          'color':tag.color.color
                      }  ;
       Tag.insert($scope,params);
        $scope.tag.name='';
        $scope.tag.color= {'name':'green','color':'#BBE535'};
        var paramsTag = {'about_kind':'Opportunity'};
        Tag.list($scope,paramsTag);

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
  var paramsTag = {'about_kind':'Opportunity'};
      Tag.list($scope,paramsTag);
     };

$scope.selectTag= function(tag,index,$event){
      if(!$scope.manage_tags){
         var element=$($event.target);
         if(element.prop("tagName")!='LI'){
              element=element.parent();
              element=element.parent();
         }
         var text=element.find(".with-color");
         if($scope.selected_tags.indexOf(tag) == -1){
            $scope.selected_tags.push(tag);
            element.css('background-color', tag.color+'!important');
            text.css('color',$scope.idealTextColor(tag.color));

         }else{
            element.css('background-color','#ffffff !important');
            $scope.selected_tags.splice($scope.selected_tags.indexOf(tag),1);
             text.css('color','#000000');
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
         Opportunity.list($scope,params);

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
    $scope.listopportunities();

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
      };
      $scope.dragTag=function(tag){
        $scope.draggedTag=tag;
      }
      $scope.dropTag=function(opportunity,index){
        console.log("droooooooooooooooop");
        var items = [];

        var params = {
              'parent': opportunity.entityKey,
              'tag_key': $scope.draggedTag.entityKey
        };
        console.log(params);
        $scope.draggedTag=null;
        Tag.attach($scope,params,index);

      };
       $scope.tagattached=function(tag,index){
          if ($scope.opportunities[index].tags == undefined){
            $scope.opportunities[index].tags = [];
          }
          var ind = $filter('exists')(tag, $scope.opportunities[index].tags);
         if (ind == -1) {
              $scope.opportunities[index].tags.push(tag);
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

     // Google+ Authentication
     Auth.init($scope);
     $(window).scroll(function() {
          if (!$scope.isLoading && ($(window).scrollTop() >  $(document).height() - $(window).height() - 100)) {
              $scope.listMoreItems();
          }
      });

}]);
app.controller('OpportunityShowCtrl', ['$scope','$filter','$route','Auth','Task','Event','Topic','Note','Opportunity','Permission','User','Opportunitystage','Email','Attachement','InfoNode','Tag',
    function($scope,$filter,$route,Auth,Task,Event,Topic,Note,Opportunity,Permission,User,Opportunitystage,Email,Attachement,InfoNode,Tag) {
      $("ul.page-sidebar-menu li").removeClass("active");
     $("#id_Opportunities").addClass("active");
     $scope.selectedTab = 2;
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.isContentLoaded = false;
     $scope.pagination = {};
     //HKA 10.12.2013 Var topic to manage Next & Prev
     $scope.topicCurrentPage=01;
     $scope.topicpagination={};
     $scope.topicpages = [];
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.currentPage = 01;
     $scope.pages = [];
     $scope.opportunities = [];
     $scope.users = [];
     $scope.user = undefined;
     $scope.slected_memeber = undefined;
     $scope.stage_selected={};
     $scope.email = {};
     $scope.infonodes = {};
     $scope.documentpagination = {};
     $scope.documentCurrentPage=01;
     $scope.documentpages=[];
     $scope.sharing_with = [];
     $scope.opportunitystages=[];
     $scope.opportunity={'current_stage':{'name':'Incoming','probability':5}};
     $scope.closed_date=new Date();
     $scope.opportunity.current_stage.name=$scope.opportunitystages.name;
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
     $scope.showeditdate=false;
     $scope.newTaskform=false;
     $scope.newEventform=false;
     $scope.newTask={};
     $scope.selected_members=[];
     $scope.selected_member={};
     $scope.ioevent = {};
      $scope.allcurrency=[
        { value:"USD", text:"$ - USD"},
        { value:"EUR", text:"€ - EUR"},
        { value:"CAD", text:"$ - CAD"},
        { value:"GBP", text:"£ - GBP"},
        { value:"AUD", text:"$ - AUD"},
        { value:"", text:"---"},
        { value:"AED", text:"د.إ - AED"},
        { value:"ANG", text:"ƒ - ANG"},
        { value:"AOA", text:"AOA - AOA"},
        { value:"ARS", text:"$ - ARS"},
        { value:"BAM", text:"KM - BAM"},
        { value:"BBD", text:"$ - BBD"},
        { value:"BGL", text:"лв - BGL"},
        { value:"BHD", text:"BD - BHD"},
        { value:"BND", text:"$ - BND"},
        { value:"BRL", text:"R$ - BRL"},
        { value:"BTC", text:"฿ - BTC"},
        { value:"CHF", text:"Fr - CHF"},
        { value:"CLF", text:"UF - CLF"},
        { value:"CLP", text:"$ - CLP"},
        { value:"CNY", text:"¥ - CNY"},
        { value:"COP", text:"$ - COP"},
        { value:"CRC", text:"₡ - CRC"},
        { value:"CZK", text:"Kč - CZK"},
        { value:"DKK", text:"kr - DKK"},
        { value:"EEK", text:"KR - EEK"},
        { value:"EGP", text:"E£ - EGP"},
        { value:"FJD", text:"FJ$ - FJD"},
        { value:"GTQ", text:"Q - GTQ"},
        { value:"HKD", text:"$ - HKD"},
        { value:"HRK", text:"kn  - HRK"},
        { value:"HUF", text:"Ft - HUF"},
        { value:"IDR", text:"Rp - IDR"},
        { value:"ILS", text:"₪ - ILS"},
        { value:"INR", text:"₨ - INR"},
        { value:"IRR", text:"ریال - IRR"},
        { value:"ISK", text:"kr - ISK"},
        { value:"JOD", text:"د.ا - JOD"},
        { value:"JPY", text:"¥ - JPY"},
        { value:"KES", text:"KSh - KES"},
        { value:"KRW", text:"₩ - KRW"},
        { value:"KWD", text:"KD - KWD"},
        { value:"KYD", text:"$ - KYD"},
        { value:"LTL", text:"Lt - LTL"},
        { value:"LVL", text:"Ls - LVL"},
        { value:"MAD", text:"د.م. - MAD"},
        { value:"MVR", text:"Rf - MVR"},
        { value:"MXN", text:"$ - MXN"},
        { value:"MYR", text:"RM - MYR"},
        { value:"NGN", text:"₦ - NGN"},
        { value:"NOK", text:"kr - NOK"},
        { value:"NZD", text:"$ - NZD"},
        { value:"OMR", text:"ر.ع - OMR"},
        { value:"PEN", text:"S/. - PEN"},
        { value:"PHP", text:"₱ - PHP"},
        { value:"PLN", text:"zł - PLN"},
        { value:"QAR", text:"ر.ق - QAR"},
        { value:"RON", text:"L - RON"},
        { value:"RUB", text:"руб. - RUB"},
        { value:"SAR", text:"ر.س - SAR"},
        { value:"SEK", text:"kr - SEK"},
        { value:"SGD", text:"$ - SGD"},
        { value:"THB", text:"฿ - THB"},
        { value:"TRY", text:"TL - TRY"},
        { value:"TTD", text:"$ - TTD"},
        { value:"TWD", text:"$ - TWD"},
        { value:"UAH", text:"₴ - UAH"},
        { value:"VEF", text:"Bs F - VEF"},
        { value:"VND", text:"₫ - VND"},
        { value:"XCD", text:"$ - XCD"},
        { value:"ZAR", text:"R - ZAR"}];

      // What to do after authentication
       $scope.runTheProcess = function(){
          var params = {
                          'id':$route.current.params.opportunityId,

                          'topics':{
                            'limit': '7'
                          },

                          'documents':{
                            'limit': '15'
                          },

                          'tasks':{

                          },

                          'events':{

                          }
                      };
          Opportunity.get($scope,params);
          User.list($scope,{});
          //HKA 13.12.2013 to retrieve the opportunities's stages
          Opportunitystage.list($scope,{'order':'probability'});
           var paramsTag = {'about_kind': 'Opportunity'};
          Tag.list($scope, paramsTag);
       };
        // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
          Auth.refreshToken();
     };
     $scope.listTags=function(){
      var paramsTag = {'about_kind':'Opportunity'}
      Tag.list($scope,paramsTag);
     };
      $scope.beforedeleteOpportunity = function(){
          $('#BeforedeleteOpportunity').modal('show');
      }
      $scope.deleteopportunity = function(){
           var opportunityKey = {'entityKey':$scope.opportunity.entityKey};
           Opportunity.delete($scope,opportunityKey);

           $('#BeforedeleteOpportunity').modal('hide');
      };
      $scope.test=function(){
        console.log('testtest');
      }
     //HKA 09.11.2013 Add a new Task
     $scope.$watch($scope.opportunity.closed_date, function() {
        console.log("work");
     });
      $scope.selectMemberToTask = function() {
            console.log($scope.selected_members);
            if ($scope.selected_members.indexOf($scope.user) == -1) {
                $scope.selected_members.push($scope.user);
                $scope.selected_member = $scope.user;
                $scope.user = $scope.selected_member.google_display_name;
            }
            $scope.user = '';
        };
        $scope.unselectMember = function(index) {
            $scope.selected_members.splice(index, 1);
            console.log($scope.selected_members);
        };
     //$('#addLeadModal').modal('show');
  //HKA 09.11.2013 Add a new Task
   $scope.addTask = function(task){
        if ($scope.newTaskform==false) {
          $scope.newTaskform=true;
           }else{
            if (task.title!=null) {
                    //  $('#myModal').modal('hide');
            if (task.due){
                var dueDate= $filter('date')(task.due,['yyyy-MM-ddT00:00:00.000000']);
                params ={'title': task.title,
                          'due': dueDate,
                          'parent': $scope.opportunity.entityKey
                }

            }else{
                params ={'title': task.title,
                         'parent': $scope.opportunity.entityKey
                       }
            };
            if ($scope.selected_members!=[]) {
                  params.assignees=$scope.selected_members;
                };
                var tags=[];                
                tags=$('#select2_sample2').select2("val");
                if (tags!=[]) {
                  var tagitems = [];
                  angular.forEach(tags, function(tag){
                  var item = {'entityKey': tag };
                  tagitems.push(item);
                });
                  params.tags=tagitems;
                };
            Task.insert($scope,params);
            $scope.newTask={};
            $scope.newTaskform=false;
            $scope.selected_members=[];
            $("#select2_sample2").select2("val", "");
        }else{
            $scope.newTask={};
            $scope.newTaskform=false;
      }
     }
   }
     $scope.$watch('opportunity.closed_date', function(newValue, oldValue) {
            if (newValue!=oldValue){
                $scope.patchDate(newValue);
            }

     });
     $scope.patchDate = function(newValue){
        var closed_at = $filter('date')(newValue,['yyyy-MM-ddTHH:mm:00.000000']);
        var params = {
                    'id':$scope.opportunity.id,
                    'closed_date':closed_at
        };
        if (!$scope.isLoading){
          Opportunity.patch($scope,params);
        }
     }
     $scope.hilightTask = function(){
        console.log('Should higll');
        $('#task_0').effect("highlight","slow");
        $('#task_0').effect( "bounce", "slow" );

     }
     $scope.listTasks = function(){
        var params = {
                        'id':$scope.opportunity.id,
                        'tasks':{}
                      };
        Opportunity.get($scope,params);

     }
     $scope.editOpp = function(){

      $('#EditOpportunityModal').modal('show')
     }
     $scope.updateOpportunity=function(params){
      Opportunity.patch($scope,params);
     }
     $scope.updateOpportunityPrice=function(){
      if($scope.opportunity.duration_unit!='fixed'){
        $scope.opportunity.amount_total=$scope.opportunity.duration*$scope.opportunity.amount_per_unit;
      }else{
        $scope.opportunity.amount_total=$scope.opportunity.amount_per_unit;
      }
      var params={'id':$scope.opportunity.id, 'currency':$scope.opportunity.currency, 'duration_unit':$scope.opportunity.duration_unit,'duration':$scope.opportunity.duration, 'amount_per_unit':$scope.opportunity.amount_per_unit,'amount_total':$scope.opportunity.amount_total}
      Opportunity.patch($scope,params);
     }
     $scope.TopiclistNextPageItems = function(){


        var nextPage = $scope.topicCurrentPage + 1;
        var params = {};
          if ($scope.topicpages[nextPage]){
            params = {
                      'id':$scope.opportunity.id,
                        'topics':{
                          'limit': '7',
                          'pageToken':$scope.topicpages[nextPage]
                        }
                     }
            $scope.topicCurrentPage = $scope.topicCurrentPage + 1 ;
            Opportunity.get($scope,params);
            }


     }

     $scope.waterfallTrigger= function(){
          $( window ).trigger( "resize" );
     };
     $scope.listTopics = function(opportunity){
        var params = {
                      'id':$scope.opportunity.id,
                      'topics':{
                             'limit': '7'
                       }
                    };
          Opportunity.get($scope,params);

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
     $scope.share = function(slected_memeber){
        console.log('permissions.insert share');
        console.log(slected_memeber);
        $scope.$watch($scope.opportunity.access, function() {
         var body = {'access':$scope.opportunity.access};
         var id = $scope.opportunity.id;
         var params ={'id':id,
                      'access':$scope.opportunity.access}
         Opportunity.patch($scope,params);
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
                            'about': $scope.opportunity.entityKey,
                            'items': items
              }
              Permission.insert($scope,params);
          }


          $scope.sharing_with = [];


        }else{
          alert('select a user to be invited');
        };


     };

     $scope.updateCollaborators = function(){
          var opportunityid = {'id':$scope.opportunity.id};
          Opportunity.get($scope,opportunityid);

     };

//HKA 11.11.2013 Add new Event
 $scope.addEvent = function(ioevent){

   /*****************************/

             if ($scope.newEventform==false) {
                $scope.newEventform=true;
           }else{


            if (ioevent.title!=null&&ioevent.title!="") {

                    var params ={}


                  // hadji hicham 13-08-2014.
                  if($scope.allday){
                         var ends_at=moment(moment(ioevent.starts_at_allday).format('YYYY-MM-DDT00:00:00.000000'))

                   params ={'title': ioevent.title,
                            'starts_at': $filter('date')(ioevent.starts_at_allday,['yyyy-MM-ddT00:00:00.000000']),
                            'ends_at':ends_at.add('hours',23).add('minute',59).add('second',59).format('YYYY-MM-DDTHH:mm:00.000000'),
                            'where': ioevent.where,
                            'parent':$scope.opportunity.entityKey,
                            'allday':"true"
                      }


                 
                  }else{
             
                  if (ioevent.starts_at){
                    if (ioevent.ends_at){
                      params ={'title': ioevent.title,
                              'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                              'ends_at': $filter('date')(ioevent.ends_at,['yyyy-MM-ddTHH:mm:00.000000']),
                              'where': ioevent.where,
                              'parent':$scope.opportunity.entityKey,
                              'allday':"false"
                      }

                    }else{
                      params ={
                        'title': ioevent.title,
                              'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                              'where': ioevent.where,
                              'parent':$scope.account.entityKey,
                              'ends_at':moment(ioevent.ends_at).add('hours',2).format('YYYY-MM-DDTHH:mm:00.000000'),
                              'allday':"false"
                      }
                    }


                    
                   
                  }


                  }
                  
                   Event.insert($scope,params);
                  $scope.ioevent={};
                  $scope.newEventform=false;



        }
     }

/*******************/


     
    };
     $scope.deleteEvent =function(eventt){
    var params = {'entityKey':eventt.entityKey};
     Event.delete($scope,params);
     //$('#addLeadModal').modal('show');
   }
      $scope.eventDeleted = function(resp){
   };
    $scope.closeEventForm=function(ioevent){
      $scope.ioevent={};
      $scope.newEventform=false;
    }
     $scope.hilightEvent = function(){

        $('#event_0').effect("highlight","slow");
        $('#event_0').effect( "bounce", "slow" );

     };
     $scope.listEvents = function(){
        var params = {
                        'id':$scope.opportunity.id,
                        'events':{

                        }
                      };
        Opportunity.get($scope,params);

     };


 //HKA 11.11.2013 Add Note
  $scope.addNote = function(note){
    var params ={
                  'about': $scope.opportunity.entityKey,
                  'title': note.title,
                  'content': note.content
      };
    Note.insert($scope,params);
    $scope.note.title='';
    $scope.note.content='';
  };
// 26.11.2013 Update Opportunity
 $scope.UpdateOpportunity = function(opportunity){
  var params = {
                'id':$scope.opportunity.id,
                'name':opportunity.name,
                'description':opportunity.description
              };


  Opportunity.patch($scope,params);

 //$scope.$watch($scope.opportunity.stagename, $scope.createNote());
  /*$scope.$watch($scope.opportunity.stagename, function(newVal, oldVal) {
     var paramsNote = {
                  'about_kind': 'Opportunity',
                  'about_item': $scope.opportunity.id,
                  'title': 'stage updated to '+ $scope.stage_selected.name

      };


      Note.insert($scope,paramsNote);
   });*/
  $('#EditOpportunityModal').modal('hide');
 };
 $scope.updateOpportunityStage = function(){
    var params = {
                  'entityKey':$scope.opportunity.entityKey,
                  'stage': $scope.opportunity.current_stage.entityKey
    };
    Opportunity.update_stage($scope,params);
 }

$scope.createNote = function(){

    var paramsNote = {
                  'about_kind': 'Opportunity',
                  'about_item': $scope.opportunity.id,
                  'title': 'stage updated to '+ $scope.stage_selected.name

      };
       Note.insert($scope,paramsNote);
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
                   'about':$scope.opportunity.entityKey
                   };

        Email.send($scope,params);
      };

 //HKA 29.12.2013 Delete Opportunity
 $scope.editbeforedelete = function(){
     $('#BeforedeleteOpportunity').modal('show');
   };
$scope.deleteopportunity= function(){
     var params = {'entityKey':$scope.opportunity.entityKey};
     Opportunity.delete($scope,params);
     $('#BeforedeleteOpportunity').modal('hide');
     };

     $scope.DocumentlistNextPageItems = function(){


        var nextPage = $scope.documentCurrentPage + 1;
        var params = {};
          if ($scope.documentpages[nextPage]){
            params = {
                        'id':$scope.opportunity.id,
                        'documents':{
                          'limit': '15',
                          'pageToken':$scope.documentpages[nextPage]
                        }
                      }
            $scope.documentCurrentPage = $scope.documentCurrentPage + 1 ;

            Opportunity.get($scope,params);

          }


     }

     $scope.listDocuments = function(){
        var params = {
                        'id':$scope.opportunity.id,
                        'documents':{
                          'limit': '15'
                        }
                      }
        Opportunity.get($scope,params);

     };
     $scope.showCreateDocument = function(type){

        $scope.mimeType = type;
        $('#newDocument').modal('show');
     };
     $scope.createDocument = function(newdocument){
        var mimeType = 'application/vnd.google-apps.' + $scope.mimeType;
        var params = {
                      'parent': $scope.opportunity.entityKey,
                      'title':newdocument.title,
                      'mimeType':mimeType
                     };
        Attachement.insert($scope,params);

     };
     $scope.createPickerUploader = function() {
          var developerKey = 'AIzaSyCqpqK8oOc4PUe77_nNYNvzh9xhTWd_gJk';
          var projectfolder = $scope.opportunity.folder;
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
                              'access': $scope.opportunity.access,
                              'parent':$scope.opportunity.entityKey
                            };
                params.items = new Array();

                 $.each(data.docs, function(index) {
                      console.log(data.docs);
                      /*
                      {'about_kind':'Account',
                      'about_item': $scope.account.id,
                      'title':newdocument.title,
                      'mimeType':mimeType };
                      */
                      var item = { 'id':data.docs[index].id,
                                  'title':data.docs[index].name,
                                  'mimeType': data.docs[index].mimeType,
                                  'embedLink': data.docs[index].url

                      };
                      params.items.push(item);

                  });
                 Attachement.attachfiles($scope,params);

          }
      };

  //06.03.2014 Edit Close date, Reason lost, Main competitor, Type, Description, Source : show Modal
     $scope.editclosedate = function(){
     $('#EditCloseDate').modal('show')
     };
     $scope.editcompetitor = function(){
     $('#EditCompetitor').modal('show')
     };
     $scope.editreasonlost = function(){
     $('#EditReasonLost').modal('show')
     };
     $scope.editdescription = function(){
     $('#EditDescription').modal('show')
     };
      $scope.edittype = function(){
     $('#EditType').modal('show')
     };
     $scope.editsource = function(){
     $('#EditSource').modal('show')
     };

    //07.03.2014 update Close date, Reason lost, Main competitor, Type, Description, Source

     $scope.updateClosedate = function(opportunity){
      console.log('***************close date**************');
      console.log(opportunity.closed_date);
      var close_at = $filter('date')(opportunity.closed_date,['yyyy-MM-ddTHH:mm:00.000000']);
      console.log(close_at);
      params = {'id':$scope.opportunity.id,
              'closed_date':close_at};
      Opportunity.patch($scope,params);
      $('#EditCloseDate').modal('hide');
     };

     $scope.updateCompetitor = function(opportunity){
      params = {'id':$scope.opportunity.id,
             'competitor':opportunity.competitor};
      Opportunity.patch($scope,params);
      $('#EditCompetitor').modal('hide');
     };

     $scope.updateReasonlost = function(opportunity){
      params = {'id':$scope.opportunity.id,
              'reason_lost':opportunity.reason_lost};
      Opportunity.patch($scope,params);
      $('#EditReasonLost').modal('hide');
     };

     $scope.updateDescription = function(opportunity){
      params = {'id':$scope.opportunity.id,
              'description':opportunity.description};
      Opportunity.patch($scope,params);
      $('#EditDescription').modal('hide');
     };


     $scope.updateType = function(opportunity){
      params = {'id':$scope.opportunity.id,
              'opportunity_type':opportunity.opportunity_type};
      Opportunity.patch($scope,params);
      $('#EditType').modal('hide');
     };


     $scope.updatsource = function(opportunity){
      params = {'id':$scope.opportunity.id,
              'source':opportunity.source};
      Opportunity.patch($scope,params);
      $('#EditSource').modal('hide');
     };

    //HKA 07.03.2014 Add Custom field

    $scope.addCustomField = function(customField){
      params = {'parent':$scope.opportunity.entityKey,
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

$scope.listInfonodes = function(kind) {
     params = {'parent':$scope.opportunity.entityKey,
               'connections': kind
              };
     InfoNode.list($scope,params);

 };

  $scope.deleteInfonode = function(entityKey,kind){
    var params = {'entityKey':entityKey,'kind':kind};

    InfoNode.delete($scope,params);

  };

  /// update account with inlineEdit
  $scope.inlinePatch=function(kind,edge,name,entityKey,value){

   if (kind=='Opportunity') {
          params = {'id':$scope.opportunity.id,
             name:value}
         Opportunity.patch($scope,params);
   }else{



          params = {
                  'entityKey': entityKey,
                  'parent':$scope.opportunity.entityKey,
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

     $scope.listMoreOnScroll = function(){
       switch ($scope.selectedTab)
           {
           case 7:
             $scope.DocumentlistNextPageItems();
             break;
           case 1:
             $scope.TopiclistNextPageItems();
             break;

           }
     };
    // Google+ Authentication
    Auth.init($scope);
    $(window).scroll(function() {
         if (!$scope.isLoading && ($(window).scrollTop() >  $(document).height() - $(window).height() - 100)) {
             $scope.listMoreOnScroll();
         }
     });

}]);

app.controller('OpportunityNewCtrl', ['$scope','$filter', 'Auth','Account','Contact', 'Opportunitystage','Opportunity',
    function($scope,$filter,Auth,Account,Contact,Opportunitystage,Opportunity) {
      $("ul.page-sidebar-menu li").removeClass("active");
      $("#id_Opportunities").addClass("active");
      document.title = "Opportunities: New";
      $scope.isSignedIn = false;
      $scope.immediateFailed = false;
      $scope.nextPageToken = undefined;
      $scope.prevPageToken = undefined;
      $scope.pagination = {};
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
      $scope.showPriceForm =false;
      $scope.customfields=[];
      $scope.account.account_type = 'Customer';
      $scope.account.industry = 'Technology';
      $scope.stage_selected={};
      $scope.opportunitystages=[];
      $scope.opportunity={access:'public',currency:'USD',duration_unit:'fixed',closed_date:new Date()};

      $scope.users=[];
      $scope.opportunity.estimated=null;
      $scope.imageSrc = '/static/img/default_company.png';
      $scope.initObject=function(obj){
          for (var key in obj) {
                obj[key]=null;
              }
      }
      $scope.test=function(){
        console.log('testtest');
      }
      $scope.pullElement=function(index,elem,arr){
        if ($scope.customfields.indexOf(elem) != -1) {
            $scope.customfields.splice(index, 1);
        }
      }
      $scope.showRemove=function(id){
        $('#'+id).addClass('hidden');
      }
      $scope.hideRemove=function(id){
       $('#'+id).removeClass('hidden');
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
      $scope.runTheProcess = function(){

           Opportunitystage.list($scope,{'order':'probability'});


       };
        // We need to call this to refresh token when user credentials are invalid
       $scope.refreshToken = function() {
            Auth.refreshToken();
       };

      $scope.prepareInfonodes = function(){
        var infonodes = [];

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




      var params_search_contact ={};
      $scope.$watch('searchContactQuery', function() {
        if($scope.searchContactQuery){
            if($scope.searchContactQuery.length>1){
              params_search_contact['q'] = $scope.searchContactQuery;
              gapi.client.crmengine.contacts.search(params_search_contact).execute(function(resp) {
                if (resp.items){
                $scope.contactsResults = resp.items;
                $scope.$apply();
              };
            });
          }
        }
      });
     $scope.selectContact = function(){

        $scope.opportunity.contact = $scope.searchContactQuery;
        var account = {
                      'entityKey':$scope.searchContactQuery.account.entityKey,
                      'name':$scope.searchContactQuery.account.name
                    };
        $scope.opportunity.account = account;
        $scope.searchAccountQuery = $scope.searchContactQuery.account.name;
      };

      var params_search_account ={};
      $scope.result = undefined;
      $scope.q = undefined;
      $scope.$watch('searchAccountQuery', function() {
          params_search_account['q'] = $scope.searchAccountQuery;
          Account.search($scope,params_search_account);
      });

      $scope.selectAccount = function(){
          $scope.opportunity.account  = $scope.searchAccountQuery;
      };
      $scope.insertNewContact = function(account,access){
          if($scope.searchContactQuery.length>0){
            var firstName = $scope.searchContactQuery.split(' ').slice(0, -1).join(' ') || " ";
            var lastName = $scope.searchContactQuery.split(' ').slice(-1).join(' ') || " ";
            var params = {
                          'firstname':  firstName ,
                          'lastname': lastName ,
                          'account': account,
                          'access': access
                        };
            Contact.insert($scope,params);
          };
      }

      $scope.save = function(opportunity){
        var hasContact = false;
        var hasAccount = false;
        opportunity.closed_date = $filter('date')(opportunity.closed_date,['yyyy-MM-dd']);
        opportunity.stage = $scope.initialStage.entityKey;
        if (typeof(opportunity.account)=='object'){
            hasAccount = true;
            opportunity.account = opportunity.account.entityKey;
            if (typeof(opportunity.contact)=='object'){
                opportunity.contact = opportunity.contact.entityKey;
                hasContact = true;
            }
            else if($scope.searchContactQuery){
                $scope.insertNewContact(opportunity.account,opportunity.access);
            };
        }else if($scope.searchAccountQuery){
            if($scope.searchAccountQuery.length>0){
              // create a new account with this account name
              var params = {
                            'name': $scope.searchAccountQuery,
                            'access': opportunity.access
                          };
              $scope.opportunity = opportunity;
              Account.insert($scope,params);
            };
        };

        if (hasAccount|hasContact){
            opportunity.infonodes = $scope.prepareInfonodes();
            // prepare amount attributes
            if (opportunity.duration_unit=='fixed'){
              opportunity.amount_total = opportunity.amount_per_unit;
              opportunity.opportunity_type = 'fixed_bid';
            }else{
              opportunity.opportunity_type = 'per_' + opportunity.duration;
            }
            Opportunity.insert($scope,opportunity);
        }else{
            // should highlight contact and account
        }

      };
      $scope.accountInserted = function(resp){
          $scope.opportunity.account = resp;
          $scope.save($scope.opportunity);
      };
      $scope.contactInserted = function(resp){
          $scope.opportunity.contact = resp;
          $scope.save($scope.opportunity);
      }
      $scope.opportunityInserted = function(resp){
          window.location.replace('#/opportunities');
      };







   // Google+ Authentication
     Auth.init($scope);


}]);

app.controller('ArticleListCtrl', ['$scope','$filter','Auth','Article','Lead','Leadstatus','Tag','Edge',
    function($scope,$filter,Auth,Article,Lead,Leadstatus,Tag,Edge) {
      $("ul.page-sidebar-menu li").removeClass("active");
      $("#id_Articles").addClass("active");

      document.title = "ioGrow Blog";
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.leadpagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
     $scope.selectedOption='all';
     $scope.stage_selected={};

      $scope.leads = [];
      $scope.lead = {};

      $scope.lead.access ='public';
      $scope.order = '-updated_at';
      $scope.status = 'New';
      $scope.selected_tags = [];
      $scope.draggedTag=null;
      $scope.tag = {};
      $scope.showNewTag=false;
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

      // What to do after authentication
        $scope.runTheProcess = function(){
            var params = {'order' : $scope.order,'limit':20};
            Article.list($scope,params);

            var paramsTag = {'about_kind':'Blog'};
            Tag.list($scope,paramsTag);


        };

      $scope.fromNow = function(fromDate){
          return moment(fromDate,"YYYY-MM-DD HH:mm Z").fromNow();
      }
       $scope.getPosition= function(index){
        if(index<3){

          return index+1;
        }else{

          return (index%3)+1;
        }
     };
        // We need to call this to refresh token when user credentials are invalid
       $scope.refreshToken = function() {
            Auth.refreshToken();
       };
     $scope.listNextPageItems = function(){


        var nextPage = $scope.currentPage + 1;
        var params = {};
          if ($scope.pages[nextPage]){
            params = {'order' : $scope.order,'limit':6,
                      'pageToken':$scope.pages[nextPage]
                     }
          }else{
            params = {'order' : $scope.order,'limit':6}
          }
          console.log('in listNextPageItems');
          $scope.currentPage = $scope.currentPage + 1 ;
          Lead.list($scope,params);
     }
     $scope.listMoreItems = function(){
        var nextPage = $scope.currentPage + 1;
        var params = {};
        if ($scope.pages[nextPage]){
            params = {
                      'limit':20,
                      'order' : $scope.order,
                      'pageToken':$scope.pages[nextPage]
                    }
            $scope.currentPage = $scope.currentPage + 1 ;
            Lead.listMore($scope,params);
        }
      };
     $scope.listPrevPageItems = function(){

       var prevPage = $scope.currentPage - 1;
       var params = {};
          if ($scope.pages[prevPage]){
            params = {'order' : $scope.order,'limit':6,
                      'pageToken':$scope.pages[prevPage]
                     }
          }else{
            params = {'order' : $scope.order,'limit':6}
          }
          $scope.currentPage = $scope.currentPage - 1 ;
          Lead.list($scope,params);
     }

      // new Lead
      $scope.showModal = function(){
        $('#addLeadModal').modal('show');

      };



      $scope.save = function(lead){
        var params ={
                      'firstname':lead.firstname,
                      'lastname':lead.lastname,
                      'company':lead.company,
                      'title':lead.title,
                      'source': lead.source,
                      'access': lead.access,
                      'status':$scope.stage_selected.status
                    };
        console.log(params);
        Lead.insert($scope,params);
        $('#addLeadModal').modal('hide')
      };
      $scope.addLeadOnKey = function(lead){
        if(event.keyCode == 13 && lead){
            $scope.save(lead);
        }
      };


     // Quick Filtering
     var searchParams ={};
     $scope.result = undefined;
     $scope.q = undefined;

     $scope.$watch('searchQuery', function() {
         searchParams['q'] = $scope.searchQuery;
         searchParams['limit'] = 7;
         if ($scope.searchQuery){
         Lead.search($scope,searchParams);
       };
     });
     $scope.selectResult = function(){
          window.location.replace('#/leads/show/'+$scope.searchQuery.id);
     };
     $scope.executeSearch = function(searchQuery){
        if (typeof(searchQuery)=='string'){
           var goToSearch = 'type:Lead ' + searchQuery;
           window.location.replace('#/search/'+goToSearch);
        }else{
          window.location.replace('#/leads/show/'+searchQuery.id);
        }
        $scope.searchQuery=' ';
        $scope.$apply();
     };
     // Sorting
     $scope.orderBy = function(order){
        var params = { 'order': order,
                        'limit':6};
        $scope.order = order;
        Lead.list($scope,params);
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
        Lead.list($scope,params);
     };
     $scope.filterByStatus = function(filter){
        if (filter){
          var params = { 'status': filter,
                         'order': $scope.order,
                         'limit':6}
        }
        else{
          var params = {
              'order': $scope.order,

              'limit':6}
        };
        $scope.isFiltering = true;
        Lead.list($scope,params);
     };


     /***********************************************
      HKA 19.02.2014  tags
***************************************************************************************/
$scope.listTags=function(){
      var paramsTag = {'about_kind':'Blog'}
      Tag.list($scope,paramsTag);
     };

$scope.edgeInserted = function () {
       $scope.listArticles();
     };
$scope.listArticles = function(){
  var params = { 'order': $scope.order,
                        'limit':20}
          Article.list($scope,params);
};


$scope.addNewtag = function(tag){
       var params = {
                          'name': tag.name,
                          'about_kind':'Blog',
                          'color':tag.color.color
                      }  ;
       Tag.insert($scope,params);
        $scope.tag.name='';
        $scope.tag.color= {'name':'green','color':'#BBE535'};
        var paramsTag = {'about_kind':'Blog'};
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
         ;
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
         Article.list($scope,params);

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
    $scope.listArticles();

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
        // $scope.$apply();
      };
      $scope.dropTag=function(article,index){
        var items = [];

        var params = {
              'parent': article.entityKey,
              'tag_key': $scope.draggedTag.entityKey
        };
        $scope.draggedTag=null;
        console.log('**********************************************');
        console.log(params);
        Tag.attach($scope,params,index);

      };
      $scope.tagattached=function(tag,index){
          if ($scope.articles[index].tags == undefined){
            $scope.articles[index].tags = [];
          }
          var ind = $filter('exists')(tag, $scope.articles[index].tags);
           if (ind == -1) {
                $scope.articles[index].tags.push(tag);
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
      };

   //HKA 19.06.2014 Detache tag on contact list
     $scope.dropOutTag=function(){


        var params={'entityKey':$scope.edgekeytoDelete}
        Edge.delete($scope,params);

        $scope.edgekeytoDelete=undefined;
        $scope.showUntag=false;
      };
      $scope.dragTagItem=function(edgekey){
        console.log("true truetrue truetrue ");
        $scope.showUntag=true;
        $scope.edgekeytoDelete=edgekey;
      };

   // Google+ Authentication
     $scope.runTheProcess();


}]);
app.controller('ArticleSearchCtrl', ['$scope','$filter','$route','Auth','Article','Lead','Leadstatus','Tag','Edge',
    function($scope,$filter,$route,Auth,Article,Lead,Leadstatus,Tag,Edge) {
      $("ul.page-sidebar-menu li").removeClass("active");
      $("#id_Articles").addClass("active");

      document.title = "ioGrow Blog";
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.leadpagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
     $scope.selectedOption='all';
     $scope.stage_selected={};

      $scope.leads = [];
      $scope.lead = {};

      $scope.lead.access ='public';
      $scope.order = '-updated_at';
      $scope.status = 'New';
      $scope.selected_tags = [];
      $scope.draggedTag=null;
      $scope.tag = {};
      $scope.showNewTag=false;
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

      // What to do after authentication
        $scope.runTheProcess = function(){
            var params = {'limit':20,'q':$route.current.params.q};
            Article.search($scope,params);

            var paramsTag = {'about_kind':'Blog'};
            Tag.list($scope,paramsTag);


        };

      $scope.fromNow = function(fromDate){
          return moment(fromDate,"YYYY-MM-DD HH:mm Z").fromNow();
      }
       $scope.getPosition= function(index){
        if(index<3){

          return index+1;
        }else{

          return (index%3)+1;
        }
     };
        // We need to call this to refresh token when user credentials are invalid
       $scope.refreshToken = function() {
            Auth.refreshToken();
       };
     $scope.listNextPageItems = function(){


        var nextPage = $scope.currentPage + 1;
        var params = {};
          if ($scope.pages[nextPage]){
            params = {'order' : $scope.order,'limit':6,
                      'pageToken':$scope.pages[nextPage]
                     }
          }else{
            params = {'order' : $scope.order,'limit':6}
          }
          console.log('in listNextPageItems');
          $scope.currentPage = $scope.currentPage + 1 ;
          Lead.list($scope,params);
     }
     $scope.listMoreItems = function(){
        var nextPage = $scope.currentPage + 1;
        var params = {};
        if ($scope.pages[nextPage]){
            params = {
                      'limit':20,
                      'order' : $scope.order,
                      'pageToken':$scope.pages[nextPage]
                    }
            $scope.currentPage = $scope.currentPage + 1 ;
            Lead.listMore($scope,params);
        }
      };
     $scope.listPrevPageItems = function(){

       var prevPage = $scope.currentPage - 1;
       var params = {};
          if ($scope.pages[prevPage]){
            params = {'order' : $scope.order,'limit':6,
                      'pageToken':$scope.pages[prevPage]
                     }
          }else{
            params = {'order' : $scope.order,'limit':6}
          }
          $scope.currentPage = $scope.currentPage - 1 ;
          Lead.list($scope,params);
     }

      // new Lead
      $scope.showModal = function(){
        $('#addLeadModal').modal('show');

      };



      $scope.save = function(lead){
        var params ={
                      'firstname':lead.firstname,
                      'lastname':lead.lastname,
                      'company':lead.company,
                      'title':lead.title,
                      'source': lead.source,
                      'access': lead.access,
                      'status':$scope.stage_selected.status
                    };
        console.log(params);
        Lead.insert($scope,params);
        $('#addLeadModal').modal('hide')
      };
      $scope.addLeadOnKey = function(lead){
        if(event.keyCode == 13 && lead){
            $scope.save(lead);
        }
      };


     // Quick Filtering
     var searchParams ={};
     $scope.result = undefined;
     $scope.q = undefined;

     $scope.$watch('searchQuery', function() {
         searchParams['q'] = $scope.searchQuery;
         searchParams['limit'] = 7;
         if ($scope.searchQuery){
         Lead.search($scope,searchParams);
       };
     });
     $scope.selectResult = function(){
          window.location.replace('#/leads/show/'+$scope.searchQuery.id);
     };
     $scope.executeSearch = function(searchQuery){
        if (typeof(searchQuery)=='string'){
           var goToSearch = 'type:Lead ' + searchQuery;
           window.location.replace('#/search/'+goToSearch);
        }else{
          window.location.replace('#/leads/show/'+searchQuery.id);
        }
        $scope.searchQuery=' ';
        $scope.$apply();
     };
     // Sorting
     $scope.orderBy = function(order){
        var params = { 'order': order,
                        'limit':6};
        $scope.order = order;
        Lead.list($scope,params);
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
        Lead.list($scope,params);
     };
     $scope.filterByStatus = function(filter){
        if (filter){
          var params = { 'status': filter,
                         'order': $scope.order,
                         'limit':6}
        }
        else{
          var params = {
              'order': $scope.order,

              'limit':6}
        };
        $scope.isFiltering = true;
        Lead.list($scope,params);
     };


     /***********************************************
      HKA 19.02.2014  tags
***************************************************************************************/
$scope.listTags=function(){
      var paramsTag = {'about_kind':'Blog'}
      Tag.list($scope,paramsTag);
     };

$scope.edgeInserted = function () {
       $scope.listArticles();
     };
$scope.listArticles = function(){
  var params = { 'order': $scope.order,
                        'limit':20}
          Article.list($scope,params);
};


$scope.addNewtag = function(tag){
       var params = {
                          'name': tag.name,
                          'about_kind':'Blog',
                          'color':tag.color.color
                      }  ;
       Tag.insert($scope,params);
        $scope.tag.name='';
        $scope.tag.color= {'name':'green','color':'#BBE535'};
        var paramsTag = {'about_kind':'Blog'};
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
         ;
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
         Article.list($scope,params);

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
    $scope.listArticles();

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
        // $scope.$apply();
      };
      $scope.dropTag=function(article,index){
        var items = [];

        var params = {
              'parent': article.entityKey,
              'tag_key': $scope.draggedTag.entityKey
        };
        $scope.draggedTag=null;
        console.log('**********************************************');
        console.log(params);
        Tag.attach($scope,params,index);

      };
      $scope.tagattached=function(tag,index){
          if ($scope.articles[index].tags == undefined){
            $scope.articles[index].tags = [];
          }
          var ind = $filter('exists')(tag, $scope.articles[index].tags);
           if (ind == -1) {
                $scope.articles[index].tags.push(tag);
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
      };

   //HKA 19.06.2014 Detache tag on contact list
     $scope.dropOutTag=function(){


        var params={'entityKey':$scope.edgekeytoDelete}
        Edge.delete($scope,params);

        $scope.edgekeytoDelete=undefined;
        $scope.showUntag=false;
      };
      $scope.dragTagItem=function(edgekey){
        console.log("true truetrue truetrue ");
        $scope.showUntag=true;
        $scope.edgekeytoDelete=edgekey;
      };

   // Google+ Authentication
     $scope.runTheProcess();


}]);
app.controller('ArticleShowCtrl', ['$scope','$filter', '$route','Auth','Article',
   function($scope,$filter,$route,Auth,Article) {
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
       $scope.newTaskform=false;
      $scope.selected_members=[];
     $scope.selected_member={};
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
                          'id':$route.current.params.articleId
                        };
          Article.get($scope,params);
       };

        $scope.articleLoaded = function(){

        }
        $scope.runTheProcess();



}]);


app.controller('ArticleNewCtrl', ['$scope','Auth','Article','Account','Tag','Edge',
    function($scope,Auth,Article,Account,Tag,Edge) {
      $("ul.page-sidebar-menu li").removeClass("active");
      $("#id_Articles").addClass("active");

      document.title = "Articles: New";
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
      $scope.article = {};

      $scope.initObject=function(obj){
          for (var key in obj) {
                obj[key]=null;
              }
      }
      $('#intro-card').wysihtml5();
      $('#full-article').wysihtml5();
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

      $scope.addContact=function(current){

       if($scope.newContactform==false){
          $scope.newContactform=true;
        }else{
          if (current.firstname!=null&&current.lastname!=null) {
            $scope.contact={
            'firstname':current.firstname,
            'lastname':current.lastname,
            'access':$scope.account.access
          }
           if (current.title!=null) {
             $scope.contact.title=current.title;
          };
          if (current.phone!=null) {
             $scope.contact.phone=[{'number':current.phone,'type':'work'}];
           }
          if (current.emails!=null) {
             $scope.contact.emails=[{'email':current.email}];
          };
          $scope.account.contacts.push($scope.contact);

          $scope.currentContact={};
          $scope.newContactform=false;
          }else{
            $scope.currentContact={};
          $scope.newContactform=false;
          };

        }
       }


       $scope.unselectContact=function(index){
        $scope.account.contacts.splice(index,1);
       }
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

      $scope.articleInserted = function(resp){
          window.location.replace('/blog#/articles/');
      };
      $scope.save = function(article){
        console.log(article);

        article.intro_text = $('#intro-card').val();
        article.full_text =  $('#full-article').val();
        if (article.title && article.intro_text) {

         Article.insert($scope,article);
       };
      };



    $scope.addAccountOnKey = function(account){
      if(event.keyCode == 13 && account){
          $scope.save(account);
      }
    };



   // Google+ Authentication
     Auth.init($scope);


}]);

app.controller('AccountListCtrl', ['$scope','Auth','Account','Tag','Edge',
    function($scope,Auth,Account,Tag,Edge) {
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

     
     // What to do after authentication
     $scope.runTheProcess = function(){
          var params = { 'order': $scope.order,
                        'limit':6}
          Account.list($scope,params);
          var paramsTag = {'about_kind':'Account'};
          Tag.list($scope,paramsTag);
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
     // inserting the account  
     $scope.save = function(account){
          if (account.name) {
             Account.insert($scope,account);
              $('#addAccountModal').modal('hide');
             
           };
      };

    $scope.addAccountOnKey = function(account){
      if(event.keyCode == 13 && account){
          $scope.save(account);
      }
      
      
    };


     $scope.accountInserted = function(resp){
          
          window.location.replace('#/accounts/show/'+resp.id);
          $('#addAccountModal').modal('hide');
     };
     // Quick Filtering
     var searchParams ={};
     $scope.result = undefined;
     $scope.q = undefined;
     
     $scope.$watch('searchQuery', function() {
         searchParams['q'] = $scope.searchQuery;
         Account.search($scope,searchParams);
     });
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
                        'limit':6};
        $scope.order = order;
        Account.list($scope,params);
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
                      'limit':6/*,
                      'pageToken':$scope.pages[currentPage]*/}
          Account.list($scope,params);
};


$scope.addNewtag = function(tag){
       var params = {   
                          'name': tag.name,
                          'about_kind':'Account',
                          'color':$('#tag-col-pick').val()
                      }  ;
       Tag.insert($scope,params);
        $scope.tag.name='';
        var paramsTag = {'about_kind':'Account'};
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
             text.css('color','#000000');
         }
         console.log('Taaaaaaaaaggggggssss');
         console.log($scope.selected_tags);
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
                        'limit':6
         }
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
      console.log('heeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeer');
      console.log($('#addMemberToTask').children());
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
        console.log('i am here test------------------------------------');
        console.log($scope.draggedTag);
        $scope.$apply();
      }
      $scope.dropTag=function(account){
        var items = [];
        console.log('------------------Account ---------------');
        console.log(account);
        var edge = {
             'start_node': account.entityKey,
              'end_node': $scope.draggedTag.entityKey,
              'kind':'tags',
              'inverse_edge': 'tagged_on'
        };
        items.push(edge);
        params = {
          'items': items
        }
        console.log('params --------------------- params')
        console.log(params);
        Edge.insert($scope,params);
        $scope.draggedTag=null;
      };
      




     // Google+ Authentication 
     Auth.init($scope);

}]);
app.directive('ngBlur', ['$parse', function($parse) {
  return function(scope, element, attr) {
    var fn = $parse(attr['ngBlur']);
    element.bind('blur', function(event) {
      scope.$apply(function() {
        fn(scope, {$event:event});
      });
    });
  }
}]);
app.directive('ngDrag', ['$parse', function($parse) {
  return function(scope, element, attr) {
    var fn = $parse(attr['ngDrag']);
    element.bind('drag', function(event) {
      scope.$apply(function() {
        fn(scope, {$event:event});
      });
    });
  }
}]);
app.directive('ngDrop', ['$parse', function($parse) {
  return function(scope, element, attr) {
    var fn = $parse(attr['ngDrop']);
    element.bind('drop', function(event) {
      scope.$apply(function() {
        fn(scope, {$event:event});
      });
    });
  }
}]);
app.directive('draggable', function() {
   return function(scope, element) {
        // this gives us the native JS object
        var el = element[0];

        el.draggable = true;

        el.addEventListener(
            'dragstart',
            function(e) {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('Text', this.id);
                this.classList.add('drag');
                return false;
            },
            false
        );

        el.addEventListener(
            'dragend',
            function(e) {
                this.classList.remove('drag');
                //alert('end of draggable');
                return false;
            },
            false
        );
        el.addEventListener(
            'drop',
            function(e) {
                // Stops some browsers from redirecting.
                if (e.stopPropagation) e.stopPropagation();

                this.classList.remove('over');

                //var item = document.getElementById(e.dataTransfer.getData('Text'));
                //this.appendChild(item);

                return false;
            },
            false
        );
    }
});
app.directive('droppable', function() {
    return function(scope, element) {
        var el = element[0];
        el.addEventListener(
            'dragover',
            function(e) {
                e.dataTransfer.dropEffect = 'move';
                // allows us to drop
                if (e.preventDefault) e.preventDefault();
                this.classList.add('over');
                return false;
            },
            false
        );
        el.addEventListener(
            'dragenter',
            function(e) {
                this.classList.add('over');
                return false;
            },
            false
        );

        el.addEventListener(
            'dragleave',
            function(e) {
                this.classList.remove('over');
                return false;
            },
            false
        );
    }
});
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
       $scope.phone.type_number= 'work';
       $scope.need = {};
       $scope.need.need_status = 'pending';
       $scope.need.priority = 'Medium';
       $scope.casee = {};
       $scope.casee.priority = 4;
       $scope.casee.status = 'pending';

       // What to do after authentication
       $scope.runTheProcess = function(){
          var params = {
                          'id':$route.current.params.accountId,
                          'contacts':{
                            'limit': '6'
                          },
                          'topics':{
                            'limit': '7'
                          }
                          };
          Account.get($scope,params);
          User.list($scope,{});
          Opportunitystage.list($scope,{});
          Casestatus.list($scope,{});


         

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

            params = {'about_kind':'Account',
                      'about_item':$scope.account.id,
                      'order': '-updated_at',
                      'limit': 5,
                      'pageToken':$scope.topicpages[nextPage]
                     }
          }else{
            params = {'about_kind':'Account',
                      'about_item':$scope.account.id,
                      'order': '-updated_at',
                      'limit':5}
          }
          console.log('in listNextPageItems');
          $scope.topicCurrentPage = $scope.topicCurrentPage + 1 ; 
          Topic.list($scope,params);
     }
     $scope.TopiclistPrevPageItems = function(){
       
       var prevPage = $scope.topicCurrentPage - 1;
       var params = {};
       console.log('i am here now');
          if ($scope.topicpages[prevPage]){
            params = {'about_kind':'Account',
                      'about_item':$scope.account.id,
                      'order': '-updated_at',
                      'limit': 5,
                      'pageToken':$scope.topicpages[prevPage]
                     }
          }else{
            params = {'about_kind':'Account',
                      'about_item':$scope.account.id,
                      'order': '-updated_at',
                      'limit': 5}
          }
          $scope.topicCurrentPage = $scope.topicCurrentPage - 1 ;
          Topic.list($scope,params);
          
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
//HKA 07.12.2013 Manage Prev & Next Page on Related List Opportunities
$scope.OpplistNextPageItems = function(){
        
    
        var nextPage = $scope.oppCurrentPage + 1;
        var params = {};
          if ($scope.opppages[nextPage]){
            params = {'limit':6,
                      'account':$scope.account.entityKey,
                      'pageToken':$scope.opppages[nextPage]
                     }
          }else{
            params = {'limit':6,
            'account':$scope.account.entityKey}
          }
          console.log('in listNextPageItems');
          $scope.oppCurrentPage = $scope.oppCurrentPage + 1 ; 
          Opportunity.list($scope,params);
     }
     $scope.OppPrevPageItems = function(){
       
       var prevPage = $scope.oppCurrentPage - 1;
       var params = {};
          if ($scope.opppages[prevPage]){
            params = {'limit':6,
                      'account':$scope.account.entityKey,
                      'pageToken':$scope.opppages[prevPage]
                     }
          }else{
            params = {'limit':6,
                      'account':$scope.account.entityKey}
          }
          $scope.oppCurrentPage = $scope.oppCurrentPage - 1 ;
            Opportunity.list($scope,params);
     };

     //HKA 07.12.2013 Manage Prev & Next Page on Related List Cases
$scope.CaselistNextPageItems = function(){
        
 
        var nextPage = $scope.caseCurrentPage + 1;
        var params = {};
          if ($scope.casepages[nextPage]){
            params = {'limit':6,
                      'account':$scope.account.entityKey,
                      'pageToken':$scope.casepages[nextPage]
                     }
          }else{
            params = {'limit':6,
            'account':$scope.account.entityKey}
          }
          console.log('in listNextPageItems');
          $scope.caseCurrentPage = $scope.caseCurrentPage + 1 ; 
          Case.list($scope,params);
     }
     $scope.CasePrevPageItems = function(){
            
       var prevPage = $scope.caseCurrentPage - 1;
       var params = {};
          if ($scope.casepages[prevPage]){
            params = {'limit':6,
                      'account':$scope.account.entityKey,
                      'pageToken':$scope.casepages[prevPage]
                     }
          }else{
            params = {'limit':6,
                      'account':$scope.account.entityKey}
          }
          $scope.caseCurrentPage = $scope.caseCurrentPage - 1 ;
            Case.list($scope,params);
     };
     $scope.NeedlistNextPageItems = function(){
        
 
        var nextPage = $scope.needsCurrentPage + 1;
        var params = {};
          if ($scope.needspages[nextPage]){
            params = {'limit':6,
                      'about_kind':'Account',
                      'about_item': $scope.account.id,
                      'pageToken':$scope.needspages[nextPage]
                     }
          }else{
            params = {'limit':6,
                      'about_kind':'Account',
                      'about_item': $scope.account.id}
          }
          console.log('in listNextPageItems');
          $scope.needsCurrentPage = $scope.needsCurrentPage + 1 ; 
          Need.list($scope,params);
     }
     $scope.NeedPrevPageItems = function(){
            
       var prevPage = $scope.needsCurrentPage - 1;
       var params = {};
          if ($scope.needspages[prevPage]){
            params = {'limit':6,
                      'about_kind':'Account',
                      'about_item': $scope.account.id,
                      'pageToken':$scope.needspages[prevPage]
                     }
          }else{
            params = {'limit':6,
                      'about_kind':'Account',
                      'about_item': $scope.account.id}
          }
          $scope.needsCurrentPage = $scope.needsCurrentPage - 1 ;
            Need.list($scope,params);
     };
  // HKA 09.02.2014 Manage Next Prev page on ducument list
     $scope.DocumentlistNextPageItems = function(){
        
 
        var nextPage = $scope.documentCurrentPage + 1;
        var params = {};
          if ($scope.documentpages[nextPage]){
            params = {'limit':6,
                      'about_kind':'Account',
                      'about_item': $scope.account.id,
                      'pageToken':$scope.documentpages[nextPage]
                     }
          }else{
            params = {'limit':6,
                      'about_kind':'Account',
                      'about_item': $scope.account.id}
          }
          $scope.documentCurrentPage = $scope.documentCurrentPage + 1 ;
          
          Attachement.list($scope,params);
            console.log('------------------One two three next ----');
     }
     $scope.DocumentPrevPageItems = function(){
            
       var prevPage = $scope.documentCurrentPage - 1;
       var params = {};
          if ($scope.documentpages[prevPage]){
            params = {'limit':6,
                      'about_kind':'Account',
                      'about_item': $scope.account.id,
                      'pageToken':$scope.documentpages[prevPage]
                     }
          }else{
            params = {'limit':6,
                      'about_kind':'Account',
                      'about_item': $scope.account.id}
          }
          $scope.documentCurrentPage = $scope.documentCurrentPage - 1 ;
            Attachement.list($scope,params);

              console.log('------------------One two three ---- 1SS');
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
        var params = {'about_kind':'Account',
                      'about_item':$scope.account.id,
                      'order': '-updated_at',
                      'limit': 6
                      };
        Attachement.list($scope,params);

     }
     
     $scope.hilightTopic = function(){
      
       $('#topic_0').effect( "bounce", "slow" );
       $('#topic_0 .message').effect("highlight","slow");
     }

     
     $scope.selectMember = function(){
        console.log('slecting user yeaaah');
        $scope.slected_memeber = $scope.user;
        $scope.user = $scope.slected_memeber.google_display_name;

     };
     $scope.showCreateDocument = function(type){
        
        $scope.mimeType = type;
        $('#newDocument').modal('show');
     };
     $scope.createDocument = function(newdocument){
        var mimeType = 'application/vnd.google-apps.' + $scope.mimeType;
        var params = {'about_kind':'Account',
                      'about_item': $scope.account.id,
                      'title':newdocument.title,
                      'mimeType':mimeType };
        Attachement.insert($scope,params);
        $('#newDocument').modal('hide');
        $scope.newdocument.title = '';
     };
     $scope.createPickerUploader = function() {
          var projectfolder = $scope.account.folder;
          var docsView = new google.picker.DocsView()
              .setIncludeFolders(true) 
              .setSelectFolderEnabled(true);
          var picker = new google.picker.PickerBuilder().
              addView(new google.picker.DocsUploadView().setParent(projectfolder)).
              addView(docsView).
              setCallback($scope.uploaderCallback).
              setAppId(12345).
                enableFeature(google.picker.Feature.MULTISELECT_ENABLED).
              build();
          picker.setVisible(true);
      };
      // A simple callback implementation.
      $scope.uploaderCallback = function(data) {
        

        if (data.action == google.picker.Action.PICKED) {
                var params = {'about_kind': 'Account',
                                      'about_item':$scope.account.id};
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
                    
                    console.log('after uploading files');
                    console.log(params);
                }
      }
     $scope.share = function(slected_memeber){
        console.log('permissions.insert share');
        console.log(slected_memeber);
        console.log("---------------- ooooooooooopppppppppppe");
        console.log($scope.account.access);
        $scope.$watch($scope.account.access, function() {
         var body = {'access':$scope.account.access};
         var id = $scope.account.id;
         var params ={'id':id,
                      'access':$scope.account.access}
         Account.patch($scope,params);
        });
        $('#sharingSettingsModal').modal('hide');

        if (slected_memeber.email){
        var params = {  'type': 'user',
                        'role': 'writer',
                        'value': slected_memeber.email,
                        'about_kind': 'Account',
                        'about_item': $scope.account.id

                        
          };
          Permission.insert($scope,params); 
          
          
        }else{ 
          alert('select a user to be invited');
        };


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
      console.log('debug addNote');
      
      var params ={
                  'about': $scope.account.entityKey,
                  'title': note.title,
                  'content': note.content
      };
      console.log(params);
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
        var params ={'about_kind':'Account',
                      'about_item':$scope.account.id}

        console.log('adding a new task');
        console.log(task);
        
        if (task.due){

            var dueDate= $filter('date')(task.due,['yyyy-MM-dd']);
            dueDate = dueDate +'T00:00:00.000000'
            params ={'title': task.title,
                      'due': dueDate,
                      'about': $scope.account.entityKey
            }
            console.log(dueDate);
            
        }else{
            params ={'title': task.title,
                     'about': $scope.account.entityKey
                   }
        };
       
        Task.insert($scope,params);
        $scope.task.title='';
        $scope.task.dueDate='0000-00-00T00:00:00-00:00';
     };

     $scope.hilightTask = function(){
       
        $('#task_0').effect("highlight","slow");
        $('#task_0').effect( "bounce", "slow" );
       
     };
     $scope.listTasks = function(){
        var params = {'about': $scope.account.entityKey,
                      'order': '-updated_at',
                      
                      };
        Task.list($scope,params);

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
                      'about_kind':'Account',
                      'about_item':$scope.account.id
              }

            }else{
              params ={'title': ioevent.title,
                      'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'where': ioevent.where,
                      'about_kind':'Account',
                      'about_item':$scope.account.id
              }
            }
            console.log('inserting the event');
            console.log(params);
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
        var params = {'about_kind':'Account',
                      'about_item':$scope.account.id,
                      'order': 'starts_at',
                      'limit': 5
                      };
        Event.list($scope,params);

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
    var params = {'account':$scope.account.entityKey,
                   'limit':6
                      };
         Contact.list($scope,params);
   };

  //HKA 22.11.2013 List of Opportunities related to account
   $scope.listOpportunities = function(){
    var params = {'account':$scope.account.entityKey,
                   'limit':6
                      };
         Opportunity.list($scope,params);
   };

  //HKA 22.11.2013 List of Cases related to account
   $scope.listCases = function(){

    var params = {'account':$scope.account.entityKey,
                   'limit':6
                      };
         Case.list($scope,params);
        
   };
   $scope.listNeeds = function(){

    var params = {'about_kind':'Account',
                  'about_item': $scope.account.id,
                   'limit':6
                      };
         Need.list($scope,params);
        
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
                      'description':opportunity.description,
                      'amount': opportunity.amount,
                      'account':$scope.account.entityKey,
                      'account_name': $scope.account.name,
                      'stagename' :$scope.stage_selected.name,
                      'stage_probability':$scope.stage_selected.probability,
                      'access': $scope.account.access
                      };


      Opportunity.insert($scope,params);
      $('#addOpportunityModal').modal('hide');
    };

  // HKA 19.11.2013 Add Case related to account
    $scope.saveCase = function(casee){
          console.log($scope.status_selected.status);
        var params = {'name':casee.name,
                      'priority':casee.priority,
                      'status': $scope.status_selected.status,
                      'type_case':casee.type_case,
                      'account':$scope.account.entityKey,
                      'account_name': $scope.account.name,
                      'access': $scope.account.access
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
                      'about_kind':'Account',
                      'about_item': $scope.account.id,
                      'about_name': $scope.account.name,
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
   
 }
//HKA 19.11.2013 Add Phone
 $scope.addPhone = function(phone){
  
  params = {'parent':$scope.account.entityKey,
            'kind':'phones',
            'fields':[
                {
                  "field": "type",
                  "value": phone.type_number
                },
                {
                  "field": "number",
                  "value": phone.number
                }
            ]
  };
  InfoNode.insert($scope,params);
  $('#phonemodal').modal('hide');
  $scope.phone.type_number='work';
  $scope.phone.number='';
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
  $('#emailmodal').modal('hide');
  $scope.emaill={};
  };
  


//HKA 22.11.2013 Add Website
$scope.addWebsite = function(website){
  params = {'parent':$scope.account.entityKey,
            'kind':'websites',
            'fields':[
                {
                  "field": "url",
                  "value": website.website
                }
            ]
  };
  InfoNode.insert($scope,params);
  $('#websitemodal').modal('hide');
};

//HKA 22.11.2013 Add Social
$scope.addSocial = function(social){
  params = {'parent':$scope.account.entityKey,
            'kind':'sociallinks',
            'fields':[
                {
                  "field": "url",
                  "value": social.sociallink
                }
            ]
  };
  InfoNode.insert($scope,params);
  $('#socialmodal').modal('hide');
  
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

  $('#customfields').modal('hide');
  
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
$scope.deleteaccount = function(){
     var accountid = {'id':$route.current.params.accountId};
     Account.delete($scope,accountid);
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
    }

     // Google+ Authentication 
     Auth.init($scope);
  
}]);

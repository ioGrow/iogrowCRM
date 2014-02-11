app.controller('TaskShowController',['$scope','$filter','$route','Auth','Note','Task','Topic','Comment','User','Contributor',
   function($scope,$filter,$route,Auth,Note,Task,Topic,Comment,User,Contributor) {
//HKA 14.11.2013 Controller to show Notes and add comments
   $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.paginationcomment = {};
     $scope.currentPagecomment = 01;
     $scope.currentPage = 01;
     $scope.pagescomment = [];
     
     $scope.notes = [];  
     $scope.users = [];
     
     $scope.user = undefined;
     $scope.slected_memeber = undefined;
     $scope.role= 'participant';

 
    // What to do after authentication
     $scope.runTheProcess = function(){
          var taskid = {'id':$route.current.params.taskId};
          Task.get($scope,taskid);

          User.list($scope,{});
     };
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
            Auth.refreshToken();
     };
   $scope.listNextPageItemscomment= function(){
        
        
        var nextPage = $scope.currentPagecomment + 1;
        
        var params = {};
          if ($scope.pagescomment[nextPage]){
            params = {'limit':5,
                      'discussion':$scope.task.entityKey,                    
                       'order':'-updated_at',
                      'pageToken':$scope.pagescomment[nextPage]
                     }
          }else{
            params = {'limit':5,
                      'discussion':$scope.task.entityKey,
                      'order':'-updated_at',}
          }
          console.log('in listNextPageItems');
          $scope.currentPagecomment = $scope.currentPagecomment + 1 ; 
          Comment.list($scope,params);
     }
     $scope.listPrevPageItemscomment = function(){
       
       var prevPage = $scope.currentPagecomment - 1;
       var params = {};
          if ($scope.pagescomment[prevPage]){
            params = {'limit':5,
                      'discussion':$scope.task.entityKey,
                      'order':'-updated_at',
                      'pageToken':$scope.pagescomment[prevPage]
                     }
          }else{
            params = {'limit':5,
            'order':'-updated_at',
            'discussion':$scope.task.entityKey}
          }
          $scope.currentPagecomment = $scope.currentPagecomment - 1 ;
          Comment.list($scope,params);
     }
   
    

     
     $scope.showModal = function(){
        console.log('button clicked');
        $('#addAccountModal').modal('show');

      };

      $scope.selectMember = function(){
        
        $scope.slected_memeber = $scope.user;
        $scope.user = $scope.slected_memeber.google_display_name;

     };
     $scope.addNewContributor = function(selected_user,role){
      console.log('*************** selected user ***********************');
      console.log(selected_user);
      
      var params = {   
                      'discussionKey': $scope.task.entityKey,

                      'type': 'user',
                      'value': selected_user.email,
                      'name': selected_user.google_display_name,
                      'photoLink': selected_user.google_public_profile_photo_url,
                      'role': role


                      // Create Contributor Service
                      // Create contributors.list api
                      //list all contributors after getting the task.
                     
                      
        }  
        console.log('selected member');
        console.log(params); 
        Contributor.insert($scope,params);
     $('#addContributor').modal('hide');
     };
     $scope.listContributors = function(){
      var params = {'discussionKey':$scope.task.entityKey,
                     'order':'-created_at'};
      Contributor.list($scope,params);
      };

    $scope.addComment = function(comment){

      var params ={'discussion':$scope.task.entityKey,
        'content':$scope.comment.content
      };
      Comment.insert($scope,params);
      $scope.comment.content='';
     
      
    };
    $scope.ListComments = function(){
      var params = {'discussion':$scope.task.entityKey,
                     'limit':5,
                      'order':'-updated_at'};
      Comment.list($scope,params);
      
      
    };
//HKA 18.11.2013 highlight the comment
   $scope.hilightComment = function(){
        console.log('Should higll');
       $('#comment_0').effect( "bounce", "slow" );
       $('#comment_0 .message').effect("highlight","slow");
     };
    $scope.showEditTaskModal =function(){
      $('#EditTaskModal').modal('show');
      
    };
    $scope.updateTask = function(task){
      if (task.due){

            var dueDate= $filter('date')(task.due,['yyyy-MM-dd']);
            dueDate = dueDate +'T00:00:00.000000'
            params ={ 'id':$scope.task.id,
                      'title': task.title,
                      'due': dueDate,
                      'status':task.status
            };
      }else{
            params ={ 'id':$scope.task.id,
                      'title': task.title,
                      'status':task.status
            };
      }

      Task.patch($scope,params);
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
app.controller('AllTasksController', ['$scope','Auth','Task','User','Contributor','Tag','Edge',
    function($scope,Auth,Task,User,Contributor,Tag,Edge) {
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
     $scope.tag = {};
     $scope.account.access ='public';
     $scope.order = '-updated_at';
     $scope.filter = undefined;
     $scope.status = 'pending';
     $scope.account.account_type = 'Customer';
     $scope.slected_members = [];
     $scope.tasks_checked = [];
     $scope.selected_tasks = [];
     $scope.selected_tags = [];
     $scope.manage_tags =false;
     $scope.edited_task =null;
     $scope.edited_tag =null;
     $scope.selectedTab=1;
     $scope.draggedTag=null;
     $scope.task_checked = false;
     $scope.isSelectedAll = false;
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
      $('#search_assignee').click(function (e)
          {                
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
      $scope.dropTag=function(task){
        var items = [];
        var edge = {
              'start_node': task.entityKey,
              'end_node': $scope.draggedTag.entityKey,
              'kind':'tags',
              'inverse_edge': 'tagged_on'
        };
        items.push(edge);
        params = {
          'items': items
        }
        Edge.insert($scope,params);
        $scope.draggedTag=null;
      }
     // What to do after authentication
     $scope.runTheProcess = function(){
          var params = { 'order': $scope.order,
                         'status':'pending',
                        'limit':7}
          Task.list($scope,params);
          User.list($scope,{});
          Tag.list($scope,{});
     };
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
          Auth.refreshToken();
     };
     $scope.assigneeModal = function(){
        $('#assigneeModal').modal('show');
      };
     // Next and Prev pagination
     $scope.listNextPageItems = function(){
        var nextPage = $scope.currentPage + 1;
        var params = {};
          if ($scope.pages[nextPage]){
            params = {'limit':7,
                      'order' : $scope.order,
                      'pageToken':$scope.pages[nextPage]
            }
          }else{
            params = {'order' : $scope.order,'limit':7}
          }
          $scope.currentPage = $scope.currentPage + 1 ; 
          Account.list($scope,params);
     };
     $scope.listPrevPageItems = function(){
       var prevPage = $scope.currentPage - 1;
       var params = {};
          if ($scope.pages[prevPage]){
            params = {'limit':7,
                      'order' : $scope.order,
                      'pageToken':$scope.pages[prevPage]
            }
          }else{
            params = {'order' : $scope.order,'limit':7}
          }
          $scope.currentPage = $scope.currentPage - 1 ;
          Account.list($scope,params);
     };
     // Add a new account methods
     // Show the modal 
     $scope.showModal = function(){
        $('#addAccountModal').modal('show');
     };
     $scope.showAssigneeTags=function(){
        $('#assigneeTagsToTask').modal('show');
     };

     $scope.edit_task=function(task){
        $scope.edited_task=task;
     }

     $scope.done_edit_task=function(task){
        $scope.edited_task=null;
        $scope.updateTask(task);
     }

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
           };
      };

    $scope.addAccountOnKey = function(account){
      if(event.keyCode == 13 && account){
          $scope.save(account);
      }
      
      
    };
    $scope.select_all_tasks = function($event){
        var checkbox = $event.target;
         if(checkbox.checked){
              var tasks=$scope.tasks;
              $scope.selected_tasks=tasks;
           console.log($scope.selected_tasks);
              $scope.isSelectedAll=true;
         }else{
          $scope.selected_tasks=[];
          $scope.isSelectedAll=false;
          console.log($scope.selected_tasks);
         }
    };
   $scope.updateTask = function(task){
            params ={ 'id':task.id,
                      'title': task.title,
                      'status':task.status
            };
      Task.patch($scope,params);
    };

    $scope.select_task= function(task,index,$event){
         var checkbox = $event.target;
         if(checkbox.checked){
            if ($scope.selected_tasks.indexOf(task) == -1) {
              console.log("checked");
              $scope.selected_tasks.push(task);
             console.log($scope.selected_tasks);

           }
         }else{
            $scope.selected_tasks.splice(index, 1);
             console.log("unchecked");
             console.log($scope.selected_tasks);
         } 
    };

     
      $scope.isSelected = function(index) {
        return ($scope.selected_tasks.indexOf(index) >= 0||$scope.isSelectedAll);
      };
      /************************************/
      $scope.beforecloseTask = function(){
          $('#beforecloseTask').modal('show');
         };
      $scope.closeTask = function(){
        angular.forEach($scope.selected_tasks, function(selected_task){
          console.log(selected_task.id);
          params = {'id':selected_task.id,
            'status':'closed'
            };
            Task.patch($scope,params);
        });
             $('#beforecloseTask').modal('hide');
      };
      $scope.reopenTask = function(){
        angular.forEach($scope.selected_tasks, function(selected_task){
          console.log(selected_task.id);
          params = {'id':selected_task.id,
            'status':'pending'
            };
            Task.patch($scope,params);
        });
      };
    $scope.selectMember = function(){
        if ($scope.slected_members.indexOf($scope.user) == -1) {
           $scope.slected_members.push($scope.user);
           $scope.slected_memeber = $scope.user;
           $scope.user = $scope.slected_memeber.google_display_name;
        }
        $scope.user='';
     };
     $scope.unselectMember =function(index){
         $scope.slected_members.splice(index, 1);
          console.log($scope.slected_members);
     };
     $scope.addNewContributors = function(){
      items = [];
      angular.forEach($scope.slected_members, function(selected_user){
         angular.forEach($scope.selected_tasks, function(selected_task){
            
            var edge = {
              'start_node': selected_task.entityKey,
              'end_node': selected_user.entityKey,
              'kind':'assignees',
              'inverse_edge': 'assigned_to'
            };
            items.push(edge);
            
            
         });
      });
      if (items){
        params = {
          'items': items
        }
        Edge.insert($scope,params);
      }
     $('#assigneeModal').modal('hide');
     };
     $scope.listContributors = function(){
      var params = {'discussionKey':$scope.task.entityKey,
                     'order':'-created_at'};
      Contributor.list($scope,params);
      };
     $scope.accountInserted = function(resp){
          $('#addAccountModal').modal('hide');
          window.location.replace('#/accounts/show/'+resp.id);
     };
     //tags
     
     
     $scope.listTasks=function(){
      $scope.selected_tasks=[];/*we have to change it */
      var params = {'status':$scope.status,
                        'limit':7}
        Task.list($scope,params);
     }
     $scope.edgeInserted = function () {
       $scope.listTasks();
     }
     // Quick Filtering
     var searchParams ={};
     $scope.result = undefined;
     $scope.q = undefined;
     
     /*$scope.$watch('searchQuery', function() {
         searchParams['q'] = $scope.searchQuery;
         Account.search($scope,searchParams);
     });*/
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
      if($scope.filter!=undefined){
        var params = { 'order': order,
                        'status': $scope.filter,
                        'limit':7};
      }else{
          var params = { 'order': order,
                        'limit':7};
      }
        
        $scope.order = order;
        Task.list($scope,params);
     };
     $scope.filterByOwner = function(filter){
        if (filter){
          var params = { 'owner': filter,
                         'order': $scope.order, 
                         'limit':7}
        }
        else{
          var params = {
              'order': $scope.order, 
              
              'limit':7}
        };
        console.log('Filtering by');
        console.log(params);
        $scope.filter=filter;
        Task.list($scope,params);
     };
     $scope.filterByStatus = function(){
        if ($scope.status){
          var params = { 'status': $scope.status,
                         'order': $scope.order, 
                         'limit':7}
        }
        else{
          var params = {
              'order': $scope.order, 
              
              'limit':7}
        };
        $scope.filter=$scope.status;
        $scope.isFiltering = true;
        Task.list($scope,params);
     };
/***********************************************
        tags
***************************************************************************************/
$scope.listTags=function(){
      Tag.list($scope,{});
     }
$scope.addNewtag = function(tag){
       var params = {   
                          'name': tag.name,
                          'color':$('#tag-col-pick').val()
                      }  ;
       Tag.insert($scope,params);
        Tag.list($scope,{});
        
     }
$scope.updateTag = function(tag){
            params ={ 'id':tag.id,
                      'title': tag.name,
                      'status':tag.color
            };
      Tag.patch($scope,params);
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
          'tags': tags
         }
         Task.list($scope,params);

  }
  $scope.filterByOwner = function(selected_tags){
         var tags = [];
         angular.forEach(selected_tags, function(tag){
            tags.push(tag.entityKey);
         });
         var params = {
          'tags': tags
         }
         Task.list($scope,params);

  }
  $scope.urgentTasks = function(){
         
         var params = {
          'order': '-due'
         }
         Task.list($scope,params);

  }

$scope.unselectAllTags= function(){
        $('.tags-list li').each(function(){
            var element=$(this);
            var text=element.find(".with-color");
             element.css('background-color','#ffffff !important');
             text.css('color','#000000');
        });
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
$scope.deleteTag=function(tag){
          params = {
            'entityKey': tag.entityKey
          }
          Tag.delete($scope,params);
          
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
     // Google+ Authentication 
     Auth.init($scope);

}]);
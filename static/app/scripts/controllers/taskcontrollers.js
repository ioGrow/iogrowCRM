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
app.factory('taggableParser', ['$parse', function ($parse) {

  //                      00000111000000000000022200000000000000003333333333333330000000000044000
  var TYPEAHEAD_REGEXP = /^\s*(.*?)(?:\s+as\s+(.*?))?\s+for\s+(?:([\$\w][\$\w\d]*))\s+in\s+(.*)$/;

  return {
    parse:function (input) {

      var match = input.match(TYPEAHEAD_REGEXP), modelMapper, viewMapper, source;
      if (!match) {
        throw new Error(
          "Expected typeahead specification in form of '_modelValue_ (as _label_)? for _item_ in _collection_'" +
            " but got '" + input + "'.");
      }
      return {
        itemName:match[3],
        source:(match[4]),
        viewMapper:(match[2] || match[1]), 
        modelMapper:(match[1])
      };
    }
  };
}]);
app.directive('taggable', ['$parse','taggableParser',function($parse,typeaheadParser) {
    return {
      restrict: 'A',
      require:'?ngModel',
      template: '<input typeahead="tag as tag.name  for tag in getAssignedUsers($viewValue) | filter:getValueFrom($viewValue) | limitTo:8" typeahead-on-select="tagMember(<%=modelName%>)"/>',
      replace: true,

      link: function ($scope, elem, attrs,ngModel) {
       /* $scope.$watch('model', function() {
            $scope.$eval(attrs.ngModel + ' = model');
        });

        $scope.$watch(attrs.ngModel, function(val) {
            $scope.model = val;
        });*/
        console.log();
        $scope.modelName=attrs.ngModel;
        $scope.attribute='name';
        $scope.currentAttribute='name';
        $scope.objectName='user';
        $scope.tagInfo=$scope[attrs.taggabledata];
        /*$scope.tag=$scope.tagInfo.tag;*/
        console.log($scope.tagInfo);
        
         $scope.newTaskValue=null;
        $scope.getValueFrom=function(value){
                 $scope.pattern=null;
                var text= value;
                $scope.newTaskValue=value;
                $scope.matchPattern=false;
                angular.forEach($scope.tagInfo, function(item){
                     if (item.tag=='#'){$scope.pattern = /(.*)\s#(.*)/g;}
                     if (item.tag=='@') {$scope.pattern = /(.*)\s@(.*)/g;};
                     if (item.tag=='+') {$scope.pattern = /(.*)\s+(.*)/g;};
                     if (item.tag=='!') {$scope.pattern = /(.*)\s!(.*)/g;};
                     var text=$scope.newTaskValue;
                     if($scope.pattern.test(text)){  
                          $scope.newTaskValue=text.replace($scope.pattern, "$1\s @");
                          console.log('$scope.newTaskValue');
                          console.log($scope.newTaskValue);
                          var newstr = text.replace($scope.pattern, "$2");
                          console.log()
                          console.log('return :'+newstr);
                          $scope.matchPattern=true;
                          return newstr;
                            
                        }
                    });
                if (!$scope.matchPattern) {
                  return null;
                };
                        
            }
          $scope.getAssignedUsers=function(value){
               $scope.patternAs=null;
               $scope.matchPattern=false;
                console.log('$scope.tagInfo');
                console.log($scope.tagInfo);
                $scope.datar={};
                angular.forEach($scope.tagInfo, function(item){
                     console.log('item');
                     console.log(item.data.name);
                     $scope.data=$scope[item.data.name];
                     console.log('$scope.data');
                     console.log($scope[item.data.name]);
                     
                     if (item.tag=='#'){$scope.patternAs = /(.*)\s#(.*)/g;}
                     if (item.tag=='@') {$scope.patternAs = /(.*)\s@(.*)/g;};
                     if (item.tag=='+') {$scope.patternAs = /(.*)\s+(.*)/g;};
                     if (item.tag=='!') {$scope.patternAs = /(.*)\s!(.*)/g;};
                     var text= value;
                     console.log('this is text from getassign:'+text);
                      if($scope.patternAs.test(text)){
                        $scope.matchPattern=true;
                          
                          $scope.attribute=item.data.attribute;
                          console.log('item.data.attribute');
                          console.log(item.data.attribute);
                          console.log('item.data.attribute');
                          console.log($scope.attribute);

                          $scope.datar=$scope.data;
                          angular.forEach($scope.datar, function(item){
                          if (!item.hasOwnProperty('name')) {
                                    item.name = item[$scope.attribute];
                                    console.log('attribute');
                                    console.log(item.name);
                                    
                                }
                                console.log('log forEach item');
                                console.log(item);
                          }); 
                          console.log('$scope.datar in forEach');
                          console.log($scope.datar);
                          $scope.currentAttribute=$scope.attribute;
                          $scope.objectName=item.data.name;
                      }
                    });
                console.log('$scope.datar');
                console.log($scope.datar);
                if (!$scope.matchPattern) {
                  console.log('here not match')
                  return [];
                }else{
                  console.log('here match')

                      console.log('currentAttribute');
                          console.log($scope.currentAttribute);

                  return $scope.datar;
                }
          }
        $scope.tagMember = function(value){
          console.log('element tagggged');
          console.log($scope.objectName);
          angular.forEach($scope.tagInfo, function(item){
              if (item.data.name==$scope.objectName) {
                
                   if ($scope.currentAttribute!='name') {
                    console.log('$scope.currentAttribute');
                    console.log($scope.currentAttribute);
                      delete value["name"];
                   };
                   console.log(item.selected);
                  if (item.selected.indexOf(value) == -1) {
                   item.selected.push(value);
                   }
               $parse(attrs.ngModel).assign($scope, $scope.newTaskValue+value[item.data.attribute]);
               console.log(item.selected);

              }; 
           });
           
         };

      }
  }
}]);
app.config(function(ngQuickDateDefaultsProvider) {
  // Configure with icons from font-awesome
  return ngQuickDateDefaultsProvider.set({
    closeButtonHtml: "<i class='fa fa-times'></i>",
    buttonIconHtml: "<i class='fa fa-calendar'></i>",
    nextLinkHtml: "<i class='fa fa-chevron-right'></i>",
    prevLinkHtml: "<i class='fa fa-chevron-left'></i>",
    placeholder:'',
    // Take advantage of Sugar.js date parsing
    parseDateFunction: function(str) {
      d = Date.create(str);
      return d.isValid() ? d : null;
    }
  });
});
app.controller('AllTasksController', ['$scope','$filter','Auth','Task','User','Contributor','Tag','Edge',
    function($scope,$filter,Auth,Task,User,Contributor,Tag,Edge) {
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
     $scope.newTask={};
     $scope.newTask.title='';
     $scope.newTask.assignees=[];
     $scope.newTaskValue=null;
     $scope.draggedTag={};
     $scope.task_checked = false;
     $scope.isSelectedAll = false;
     $scope.taggableOptions=[];
     $scope.taggableOptions.push(
      {'tag':'#','data':{
      name:'users',
      attribute:'google_display_name'
      },'selected':[]},
      {'tag':'!','data':{
      name:'tags',
      attribute:'name'
      },'selected':[]}
      );
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
      $('.typeahead').css("width", $('.typeahead').prev().width()+'px !important');
      $('.typeahead').width(433);
      console.log('typeahead width');
      console.log( $('.typeahead').width());
      console.log('input befor typeahead width');
      console.log($('.typeahead').prev().width());
      handleColorPicker();
      console.log($('#addMemberToTask').children());
      $scope.$watch('newTask.due', function() {

         if($scope.newTask.due==null&&$scope.newTask.reminder==null){
                $('#new_task_text').css("paddingRight", "270px !important");
           }else{
                if($scope.newTask.due==null||$scope.newTask.reminder==null){
                      
                      $('#new_task_text').css("paddingRight", "170px !important");
                }else{
                    $('#new_task_text').css("paddingRight", "45px !important");
                } 
           }
      });
      $scope.$watch('newTask.reminder', function() {
        
         if($scope.newTask.due==null&&$scope.newTask.reminder==null){
                $("#new_task_text").css("padding-right", "270px !important");
           }else{
                if($scope.newTask.due==null||$scope.newTask.reminder==null){
             
                      $("#new_task_text").css("padding-right", "170px !important");
                }else{
                    $("#new_task_text").css("padding-right", "45px !important");
                } 
           }
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
                         
                        'limit':7}
          Task.list($scope,params,true);
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
            $scope.selected_tasks=[];
             $scope.selected_tasks.push($scope.tasks);
              $scope.isSelectedAll=true;
         }else{
          $scope.selected_tasks=[];
          $scope.isSelectedAll=false;
          console.log($scope.selected_tasks);
         }
    };
    $scope.addNewTask=function(){
        if ($scope.newTask.due){
              console.log("here work!");
              console.log($scope.newTask.due);
            var dueDate= $filter('date')($scope.newTask.due,['yyyy-MM-ddTHH:mm:00.000000']);
           /* dueDate = dueDate +'T00:00:00.000000'*/
            params ={'title': $scope.newTask.title,
                      'due': dueDate,
                      'about': $scope.account.entityKey
            }
            console.log(dueDate);
            
        }else{
            console.log("here not work!");
            params ={'title': $scope.newTask.title}
        };
        angular.forEach($scope.taggableOptions, function(option){
          if(option.data.name=='users'&&option.selected!=[]){
            console.log('in users condition');
            console.log(option.selected);
            params.assignees=option.selected;
            option.selected=[];
            console.log(params.assignees);
          }
          if(option.data.name=='tags'&&option.selected!=[]){
            params.tags=option.selected;
            option.selected=[];
          }

        });
        console.log('************************@@@@@@@@@@@@@@@@@@@@@************************');
        console.log(params);
       
       
        Task.insert($scope,params);
        $scope.tagInfo.selected = [];

         console.log($scope.newTask.title);
        $scope.newTask.title='';
        $scope.newTask.dueDate='0000-00-00T00:00:00-00:00';
    }

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
/**********************************************************
      adding Tag member to new task 
***********************************************************/
    
   
/************************************/
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
     
     
     $scope.listTasks=function(effects){
      $scope.selected_tasks=[];/*we have to change it */
      var params = { 'order': $scope.order,
                        'limit':7}
        if (effects){
          Task.list($scope,params,effects);
        }
        else{
          Task.list($scope,params);
        }
        
     }
     $scope.hilightTask = function(){
        
       $('#task_0').effect( "bounce", "slow" );
       $('#task_0 .list-group-item-heading').effect("highlight","slow");
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
         $scope.tasks = [];
         $scope.isLoading = true;
         var params = { 'order': 'due',
                        'urgent': true,
                        
                        'limit':7}
          Task.list($scope,params,true);

  }
 $scope.allTasks=function(){
   var params = { 'order': $scope.order,
                         
                        'limit':7}
          Task.list($scope,params,true);

 }
 $scope.createdByMe=function(owner){
    var params = { 
                'order': $scope.order,
                'owner': owner,
                'limit':7
              };
    Task.list($scope,params,true);

 }
 $scope.assignedToMe=function(){
   var params = { 'order': $scope.order,
                  'assignee' : true,
                  
                  'limit':7
                }
    Task.list($scope,params,true);

 }
 $scope.privateTasks=function(){
   var params = { 'order': $scope.order,
                         
                        'limit':7}
          Task.list($scope,params,true);

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
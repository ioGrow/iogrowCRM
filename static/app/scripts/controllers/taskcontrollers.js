app.controller('TaskShowController',['$scope','$filter','$route','Auth','Note','Task','Tag','Topic','Comment','User','Contributor','Edge','Permission','Attachement', 
 function($scope,$filter,$route,Auth,Note,Task,Tag,Topic,Comment,User,Contributor,Edge,Permission,Attachement) {
//HKA 14.11.2013 Controller to show Notes and add comments
     $("ul.page-sidebar-menu li").removeClass("active");
     $("#id_Tasks").addClass("active");
     trackMixpanelAction('TASK_SHOW_VIEW');
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.nbLoads=0;
     $scope.pagination = {};
     $scope.paginationcomment = {}; 
     $scope.currentPagecomment = 01;
     $scope.currentPage = 01;
     $scope.pagescomment = [];
     $scope.taskSelected=false;
     $scope.notes = [];
     $scope.users = [];
     $scope.task={};
     $scope.task.access="private";
     $scope.collaborators_list=[];
     $scope.user = undefined;
     $scope.sharing_with=[];
     $scope.slected_memeber = undefined;
     $scope.slected_members = [];
     $scope.role= 'participant';
     $scope.taskShow=true;
     $scope.showPage=true;
     $scope.newDoc=true;
     $scope.inProcess=function(varBool,message){
          if (varBool) {
            $scope.nbLoads=$scope.nbLoads+1;
            if ($scope.nbLoads==1) {
              $scope.isLoading=true;
            };
          }else{
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
          
          var taskid = {'id':$route.current.params.taskId};
          Task.get($scope,taskid);
              var params = {
                        'id':$route.current.params.taskId,
                        'documents':{
                          'limit': '15'
                        }
                      }
        Task.get_docs($scope,params);

          User.list($scope,{});
           var varTagname = {'about_kind':'Task','limit':1};
          Tag.list($scope,varTagname);
         window.Intercom('update');
         
     };
     $scope.deleteassignee = function(edgeKey){

    console.log($scope);
    Task.delete_assignee($scope,edgeKey);
    

    //window.location.reload();
    

  };
// HKA 10.12.2015 new function to create docume
   $scope.docCreated=function(url){
            window.open($scope.prepareEmbedLink(url),'_blank');
        }
   $scope.prepareEmbedLink=function(link){
                return link.replace(/preview/gi, "edit");
        }

  $scope.assignee_deleted=function(){
var taskid = {'id':$route.current.params.taskId};
          Task.get($scope,taskid);
  };
     $scope.assigneeModal = function(){
        
        $('#assigneeModal').modal('show');
      };
     $scope.selectnewMember = function(){
      if ($scope.slected_members.indexOf($scope.user) == -1) {
         $scope.slected_members.push($scope.user);
         $scope.slected_memeber = $scope.user;
         $scope.user = $scope.slected_memeber.google_display_name;
      }
      $scope.user='';
     };
    
     $scope.removeTag = function(tag,$index) {
            
            var params = {'tag': tag,'index':$index}
            Edge.delete($scope, params);
        }
        $scope.edgeDeleted=function(index){
         $scope.task.tags.splice(index, 1);
         $scope.apply();
        }
     $scope.unselectMember =function(index){
         $scope.slected_members.splice(index, 1);
          console.log($scope.slected_members);
     };
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
            Auth.refreshToken();
     };
     $scope.checkOptions=function(){
        $scope.taskSelected=!$scope.taskSelected;
     }
      
     


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
        
        $('#addAccountModal').modal('show');

      };

     $scope.selectMember = function(){

        $scope.slected_memeber = $scope.user;
        $scope.user='';
        $scope.sharing_with.push($scope.slected_memeber);

     };

     $scope.edgeInserted = function () {
       var taskid = {'id':$route.current.params.taskId};
          Task.get($scope,taskid);
     }
     $scope.$watch('task.due', function(newValue, oldValue) {
            if (newValue!=oldValue){
                $scope.patchDate(newValue);
                $scope.showDueCalendar=false;
            }

     });
     $scope.patchDate = function(newValue){
        
        var due_date = $filter('date')(newValue,['yyyy-MM-ddTHH:mm:00.000000']);
        var params = {
                    'id':$scope.task.id,
                    'due':due_date
        };
        Task.patch($scope,params);
     }
     $scope.addNewContributor = function(selected_user,role){
      

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
        Contributor.insert($scope,params);
     $('#addContributor').modal('hide');
     };
     $scope.listContributors = function(){
      var params = {'discussionKey':$scope.task.entityKey,
                     'order':'-created_at'};
      Contributor.list($scope,params);
      };
    $scope.closeTask = function(task){
          params = {'id':task.id,
            'status':'closed'
            };
            Task.patch($scope,params);
      };

      $scope.reopenTask = function(task){
          params = {'id':task.id,
            'status':'open'
            };
            Task.patch($scope,params);
      };
            $scope.idealTextColor=function(bgColor){
        var nThreshold = 105;
         var components = getRGBComponents(bgColor);
         var bgDelta = (components.R * 0.299) + (components.G * 0.587) + (components.B * 0.114);

         return ((255 - bgDelta) < nThreshold) ? "#000000" : "#ffffff";
      }


      // ask before delete task hadji hicham . 08-07-2014 .
       $scope.editbeforedelete = function(){
         $('#BeforedeleteTask').modal('show');
       };
      $scope.addNewContributors = function(){
        items = [];
        angular.forEach($scope.slected_members, function(selected_user){
              var edge = {
                'start_node': $scope.task.entityKey,
                'end_node': selected_user.entityKey,
                'kind':'assignees',
                'inverse_edge': 'assigned_to'
              };
              items.push(edge);
        });
        if (items){
          params = {
            'items': items
          }
          Edge.insert($scope,params);
        }
       $('#assigneeModal').modal('hide');
      $scope.slected_members = [];
      
      };
   // delete task  hadji hicham  08-07-2014 .
   $scope.deleteTask = function(){

     var params = {'entityKey':$scope.task.entityKey};


       Task.delete($scope, params);
      $('#BeforedeleteTask').modal('hide');

     };

     // rederection after delete task . hadji hicham 08--07-2014
      $scope.taskDeleted = function(resp){

        window.location.replace('/#/calendar');

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
      };
      $scope.addTags=function(task){
        var tags=[];
        var items = [];
        tags=$('#select2_sample2').select2("val");

            angular.forEach(tags, function(tag){
              var edge = {
                'start_node': task.entityKey,
                'end_node': tag,
                'kind':'tags',
                'inverse_edge': 'tagged_on'
              };
              items.push(edge);
            });

        params = {
          'items': items
        }

        Edge.insert($scope,params);
        $('#assigneeTagsToTask').modal('hide');
        $('#select2_sample2').select2("val", "");

     };
    $scope.addComment = function(comment){
      
      var params ={
                  'about':$scope.task.entityKey,
                  'content':$scope.comment.content
                };
      Comment.insert($scope,params);
      $scope.comment.content='';


    };
    $scope.ListComments = function(){
      var params = {
                    'about':$scope.task.entityKey,
                    'limit':7
                   };
      Comment.list($scope,params);


    };



    
// HADJI HICHAM - 23/10/2014 - delete a comment

$scope.commentDelete=function(commentId){

      params={'id':commentId}
      Comment.delete($scope,params);

}  
//HKA 18.11.2013 highlight the comment
   $scope.hilightComment = function(){
       $('#comment_0').effect( "bounce", "slow" );
       $('#comment_0 .message').effect("highlight","slow");
     };
    $scope.showEditTaskModal =function(){
      $('#EditTaskModal').modal('show');

    };
         $scope.showAssigneeTags=function(){
        $('#assigneeTagsToTask').modal('show');
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

   $scope.inlineUpdateTask = function(task){
           var params ={ 'id':task.id,
                      'title': task.status
            };
      Task.patch($scope,params);
    };
  $scope.inlinePatch=function(kind,edge,name,task,value){
       
   if (kind=='Task') {
       if (name='title')
          {params = {'id':$scope.task.id,
                      'entityKey':task.entityKey,
                      'due':moment(task.due).format('YYYY-MM-DDTHH:mm:00.000000'),
                      title:value}

         Task.patch($scope,params);

       }

               }else if(kind=="Comment"){

          
               
             var params={
       'id':task,
       'content':value 
     }
     Comment.patch($scope,params);

      };



             }

  $scope.listTags=function(){
     var varTagname = {'about_kind':'Task'};
      Tag.list($scope,varTagname);
     };


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

     };

   //HKA 19.06.2014 Detache tag on contact list
     $scope.dropOutTag=function(){


        var params={'entityKey':$scope.edgekeytoDelete}
        Edge.delete($scope,params);

        $scope.edgekeytoDelete=undefined;
        $scope.showUntag=false;
      };
      $scope.dragTagItem = function(tag,task) {

            $scope.showUntag = true;
            $scope.edgekeytoDelete = tag.edgeKey;
            $scope.tagtoUnattach = tag;
            $scope.tasktoUnattachTag = task;
        }
        $scope.tagUnattached = function() {
            $scope.tasktoUnattachTag.tags.splice($scope.tasktoUnattachTag.tags.indexOf($scope.tagtoUnattach),1)
            $scope.apply()
        };
    // arezki lebdiri 4/9/14
       $scope.getColaborators=function(){

          Permission.getColaborators($scope,{"entityKey":$scope.task.entityKey});  

     
        };


    /*********************atash file to task *********************/
    /**********************************************************/
// HADJI HICHAM HH- 20/10/2014 - 10:34 .

   $scope.showAttachFilesPicker = function() {
          var developerKey = 'AIzaSyDHuaxvm9WSs0nu-FrZhZcmaKzhvLiSczY';
          var docsView = new google.picker.DocsView()
              .setIncludeFolders(true)
              .setSelectFolderEnabled(true);
          var picker = new google.picker.PickerBuilder().
              addView(new google.picker.DocsUploadView()).
              addView(docsView).
              setCallback($scope.attachmentUploaderCallback).
              setOAuthToken(window.authResult.access_token).
              setDeveloperKey(developerKey).
              setAppId('935370948155-qm0tjs62kagtik11jt10n9j7vbguok9d').
                enableFeature(google.picker.Feature.MULTISELECT_ENABLED).
              build();
          picker.setVisible(true);
      };
      $scope.attachmentUploaderCallback= function(data){



        if (data.action == google.picker.Action.PICKED) {

              var params = {
                              'access': $scope.task.access,
                              'parent':$scope.task.entityKey
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
                
        //         $scope.apply();
         }

      }


/***************************************/
//HADJI HICHAM -HH 21/10/2014. list of documents .
$scope.listDocuments=function(){
  
    var params = {
                        'id':$scope.task.id,
                        'documents':{
                          'limit': '15'
                        }
                      }
        Task.get_docs($scope,params);
}
    /*************************************************************/    


// HADJI HICHAM HH-   create new document modal !
     $scope.showCreateDocument = function(type){

        $scope.mimeType = type;
        $('#newDocument').modal('show');
     };


   $scope.createDocument = function(newdocument){
        var mimeType = 'application/vnd.google-apps.' + $scope.mimeType;
        var params = {
                      'parent': $scope.task.entityKey,
                      'title':newdocument.title,
                      'mimeType':mimeType
                     };

       Attachement.insert($scope,params);

     };
    /**************************/ 




      $scope.share = function(){
    
      
     params ={ 'id':$scope.task.id,
               'access':$scope.task.access
            };
  
          Task.patch($scope,params);

        

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
                            'about': $scope.task.entityKey,
                            'items': items
              }
               Permission.insert($scope,params);
          }


          $scope.sharing_with = [];


        }


     };
    // LBA 27-10-2014
    $scope.DeleteCollaborator=function(entityKey){
            var item = {
                          'type':"user",
                          'value':entityKey,
                          'about':$scope.task.entityKey
                        };
            Permission.delete($scope,item)
        };
  // Google+ Authentication
    Auth.init($scope);

  }]);


app.controller('AllTasksController', ['$scope','$filter','Auth','Task','User','Contributor','Tag','Edge',
    function($scope,$filter,Auth,Task,User,Contributor,Tag,Edge) {
     $("ul.page-sidebar-menu li").removeClass("active");
     $("#id_Tasks").addClass("active");
     document.title = "Tasks: Home";
     trackMixpanelAction('TASK_LIST_VIEW');
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.nbLoads=0;
     $scope.isMoreItemLoading = false;
     $scope.pagination = {};
     $scope.taskaccess='public';
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
     $scope.showUntag=false;
     $scope.edgekeytoDelete=undefined;
     $scope.task_title="";
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
     $scope.newTaskValue=null;
     $scope.draggedTag={};
     $scope.task_checked = false;
     $scope.isSelectedAll = false;
     $scope.showNewTag=false;
     $scope.taskpagination={};
     $scope.taggableOptions=[];
     $scope.blankStateTask=false;
     $scope.taggableOptions.push(
      {'tag':'@','data':{
      name:'users',
      attribute:'google_display_name'
      },'selected':[]},
      {'tag':'#','data':{
      name:'tags',
      attribute:'name'
      },'selected':[]}
      );
      $scope.selectedTask=null;
      $scope.currentTask=null;
      $scope.showTagsFilter=false;
      $scope.showNewTag=false;
      $scope.taskfilter="all";
      $scope.tasksAssignee=null;
      $scope.tasksOwner=null;
      $scope.taskUrgent=false;
      $scope.inProcess=function(varBool,message){
          if (varBool) {           

            $scope.nbLoads=$scope.nbLoads+1;
            if ($scope.nbLoads==1) {
              $scope.isLoading=true;
            };
          }else{

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
     var handleColorPicker = function () {
          if (!jQuery().colorpicker) {
              return;
          }
          $('.colorpicker-default').colorpicker({
              format: 'hex'
          });
      }

      $('.typeahead').css("width", $('.typeahead').prev().width()+'px !important');
      $('.typeahead').width(433);
      handleColorPicker();
        $scope.isBlankState=function(tasks){
          if (typeof tasks !== 'undefined' && tasks.length > 0) {
            return false;
          }else{
            return true
          }
        }
   
         $scope.gotoNewUser=function(){
       $('#assigneeModal').modal('hide');
       window.location.replace('/#/admin/users/new');
     }
      $scope.idealTextColor=function(bgColor){
        var nThreshold = 105;
         var components = getRGBComponents(bgColor);
         var bgDelta = (components.R * 0.299) + (components.G * 0.587) + (components.B * 0.114);

         return ((255 - bgDelta) < nThreshold) ? "#000000" : "#ffffff";
      };

       $scope.wizard = function(){
        localStorage['completedTour'] = 'True';
        var tour = {
            id: "hello-hopscotch",
             steps: [
             {
                title: "Step 1: Create New task",
                content: "Click here to create new task and add detail about it.",
                target: "new_task",
                placement: "bottom"
              },
             {
                
                title: "Step 2: Add tags",
                content: "Add Tags to filter your tasks.",
                target: "add_tag",
                placement: "left"
              }
             
              
            ]
           
          };
          // Start the tour!
          hopscotch.startTour(tour);
      };
      //HKA 10.12.2015 tag inserted
      $scope.tagInserted=function(resp){
              if ($scope.tags==undefined) {
                $scope.tags=[];
            };
            $scope.tags.unshift(resp);
            $scope.apply();
        }

     $scope.$watch('newTask.due', function(newValue, oldValue) {
              $scope.showStartsCalendar=false;
     });
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
          $scope.showTagFilterCard=function(){
            $scope.showTagsFilter=true;
            $( window ).trigger( 'resize' ); 
          }
   // delete task from list hadji hicham 08-07-2014 
   $scope.deleteThisTask= function(entityKey){

    var params = {'entityKey':entityKey};
     Task.delete($scope, params);
   };



// HADJI HICHAM -04/02/2015

   $scope.removeTag = function(tag,lead) {
            

            /*var params = {'tag': tag,'index':$index}

            Edge.delete($scope, params);*/
            
            $scope.dragTagItem(tag,lead);
            $scope.dropOutTag();
        }

/***********************************************************/

// rederection after delete from list of tasks. hadji hicham  08-07-2014
   $scope.taskDeleted = function(resp){
   var params = { 'order': $scope.order,

                        'limit':20}
          Task.list($scope,params,true);
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
      $scope.checkColor=function(color){
        $scope.tag.color=color;
      }
      $scope.customWidth=function(width,due,reminder){
       /* if(due==null&&$reminder==null){
                return 30;
           }else{
                if($scope.newTask.due==null||$scope.newTask.reminder==null){

                      return 150;
                }else{
                   return 260;
                }
           }*/
      }
      $scope.dragTag=function(tag){

        $scope.draggedTag=tag;
      }
      $scope.dropTag = function(task) {

            var items = [];
            var params = {
                'parent': task.entityKey,
                'tag_key': $scope.draggedTag.entityKey
            };
       
            $scope.draggedTag = null;
            Tag.attach($scope, params, $scope.tasks.indexOf(task));
            $scope.apply();
        };
      $scope.tagattached = function(tag, index) {
      if (index!=undefined) {
        if ($scope.tasks[index].tags == undefined) {
            $scope.tasks[index].tags = [];
        }
        var ind = $filter('exists')(tag, $scope.tasks[index].tags);      
        if (ind == -1) {
            $scope.tasks[index].tags.push(tag);
            var card_index = '#card_' + index;
            $(card_index).removeClass('over');
        } else {
            var card_index = '#card_' + index;
            $(card_index).removeClass('over');
        }
      }else{

         if ($scope.selected_tasks.length >0) {
            angular.forEach($scope.selected_tasks, function(selected_task){
                var existstag=false;
                angular.forEach(selected_task.tags, function(elementtag){
                    if (elementtag.id==tag.id) {
                       existstag=true;
                    };                       
                }); 
                if (!existstag) {
                   if (selected_task.tags == undefined) {
                      selected_task.tags = [];
                      }
                   selected_task.tags.push(tag);
                };  
             });        
       /* $scope.selected_tasks=[];*/
         };
      };
      $scope.apply();
    };
     // What to do after authentication
     $scope.runTheProcess = function(){
       
          var params = { 'order': $scope.order,

                        'limit':20}
          
          Task.list($scope,params,true);
          User.list($scope,{});
          var varTagname = {'about_kind':'Task'};
          Tag.list($scope,varTagname);
         window.Intercom('update');

     };
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
          Auth.refreshToken();
     };
        $scope.ExportCsvFile = function () {
            if ($scope.selected_tasks.length != 0) {
                $scope.msg = "Do you want export  selected tasks"

            } else {
                if ($scope.selected_tags.length != 0) {
                    $scope.msg = "Do you want export  tasks with the selected tags"

                } else $scope.msg = "Do you want export  all tasks"


            }
            $("#TakesFewMinutes").modal('show');
        }
        $scope.LoadCsvFile = function () {
            if ($scope.selected_tasks.length != 0) {
                var ids = [];
                angular.forEach($scope.selected_tasks, function (selected_task) {
                    ids.push(selected_task.id);
                });
                Task.export_key($scope, {ids: ids});
            } else {
                var tags = [];
                angular.forEach($scope.selected_tags, function (selected_tag) {
                    tags.push(selected_tag.entityKey);
                });
                var params = {"tags": tags};
                Task.export($scope, params);
                $scope.selectedKeyLeads = [];
            }
            $("#TakesFewMinutes").modal('hide');
        }
     $scope.getUrl = function(type,id){
        var base_url = undefined;
          switch (type)
              {
              case 'Account':
                base_url = '/#/accounts/show/';
                break;
              case 'Contact':
                base_url = '/#/contacts/show/';
                break;
              case 'Lead':
                base_url = '/#/leads/show/';
                break;
              case 'Opportunity':
                base_url = '/#/opportunities/show/';
                break;
              case 'Case':
                base_url = '/#/cases/show/';
                break;
              }
            return base_url+id;
        }

        // hadji hicham 23-07-2014 . inlinepatch for labels .
  $scope.inlinePatch=function(kind,edge,name,tag,value){
       
        if(kind=="tag"){

        params={'id':tag.id,
                'entityKey':tag.entityKey,
                'about_kind':'Lead',
                'name':value
                  };


           Tag.patch($scope,params);
      };



             }
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
             $scope.selected_tasks=$scope.selected_tasks.concat($scope.tasks);
             console.log($scope.selected_tasks);
              $scope.isSelectedAll=true;

         }else{
          $scope.selected_tasks=[];
          $scope.isSelectedAll=false;
         }
    };
    $scope.addNewTask=function(){

        $scope.treatTheTitle($scope.newTask.title);
        if($scope.newTask.title != ""){

          if ($scope.newTask.due){

            var dueDate= $filter('date')($scope.newTask.due,['yyyy-MM-ddTHH:mm:00.000000']);
           /* dueDate = dueDate +'T00:00:00.000000'*/
            params ={'title': $scope.task_title,
                      'due': dueDate,
                      'about': $scope.account.entityKey,
                      'access':$scope.taskaccess
            }
            console.log(dueDate);

        }else{
          
            params ={'title': $scope.task_title}
        };
        angular.forEach($scope.taggableOptions, function(option){
          if(option.data.name=='users'&&option.selected!=[]){
            params.assignees=option.selected;
            option.selected=[];
          }
          if(option.data.name=='tags'&&option.selected!=[]){
            params.tags=option.selected;
            option.selected=[];
          }

        });
      
       
        Task.insert($scope,params);
        
        }
        
        $scope.tagInfo.selected = [];

        $scope.newTask.title='';
        $scope.newTask.due=null;
        $scope.newTask.reminder=null;
        $scope.task_title='';
    }

  // hadji hicham ,under the test : treat the title 
  $scope.treatTheTitle=function(title){
    if(title !=""){

      for(var i=0;i<title.length;i++){

       if(title.charAt(i)!="@"){
     
        $scope.task_title+=title.charAt(i);
        $scope.apply();
            
       }else{
        break;
       }
        
      } 


    }
        
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
              $scope.selected_tasks.push(task);
           }
         }else{
            $scope.selected_tasks.splice(index, 1);
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

      // $scope.isSelectedTag=function(index){
      //    return 
      // }
      
      $scope.beforecloseTask = function(){
          $('#beforecloseTask').modal('show');
         };

      $scope.closeTask = function(){


          
        angular.forEach($scope.selected_tasks, function(selected_task){
          // if($scope.isSelectedAll){
          //      angular.forEach(selected_taske, function(selected_task){
             if (selected_task.status=='open'||selected_task.status=='pending') {


              params = {'id':selected_task.id,
            'status':'closed'
            };
            Task.patch($scope,params);
          //  }
          // });
           //   }else{
           //      if (selected_taske.status=='open'||selected_taske.status=='pending') {


           //    params = {'id':selected_taske.id,
           //  'status':'closed'
           //  };
           //  Task.patch($scope,params);
           // }


             }
       

           
        });
            $('#beforecloseTask').modal('hide');
      };
       $scope.deleteTask = function(){
        angular.forEach($scope.selected_tasks, function(selected_task){
            var params = {'entityKey':selected_task.entityKey};
            Task.delete($scope, params);
        });
        $scope.selected_tasks=[];
      };
      $scope.reopenTask = function(){




        angular.forEach($scope.selected_tasks, function(selected_task){

        // if($scope.isSelectedAll){

        //     angular.forEach(selected_taske, function(selected_task){



        if (selected_task.status=='closed') {
            params = {'id':selected_task.id,
            'status':'pending'
            };
            Task.patch($scope,params);
          };

        //   });
        // }else{

        //       if (selected_taske.status=='closed') {
        //     params = {'id':selected_taske.id,
        //     'status':'pending'
        //     };
        //     Task.patch($scope,params);
        //   };

        // }
        
      

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
        $scope.apply();
     };
     // Sorting
     $scope.orderBy = function(order) {
            var params = {'order': order,
                'limit': 20};
            if ($scope.tasksAssignee!=null) {
              params.assignee=$scope.tasksAssignee;
            }
            if ($scope.tasksOwner!=null) {
              params.owner=$scope.tasksOwner;
            };
            $scope.order = order;
            Task.list($scope, params);
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
     var varTagname = {'about_kind':'Task'};
      Tag.list($scope,varTagname);
}
$scope.addNewtag = function(tag){
       var params = {
                          'name': tag.name,
                          'about_kind':'Task',
                          'color':tag.color.color
                      }  ;
       Tag.insert($scope,params);
       /*var varTagname = {'about_kind':'Task'};
        Tag.list($scope,varTagname);*/
       tag.name='';
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
           /* element.css('background-color', tag.color+'!important');
            text.css('color',$scope.idealTextColor(tag.color));*/

         }else{
           /* element.css('background-color','#ffffff !important');*/
            $scope.selected_tags.splice($scope.selected_tags.indexOf(tag),1);
            /* text.css('color','#000000');*/
         }

         $scope.filterByTags($scope.selected_tags);

      }

    };
      $scope.showAssigneeTags=function(task){
            $('#assigneeTagsToTask').modal('show');
            $scope.currentTask=task;
         };
      $scope.addTagsTothis=function(){
          var tags=[];
          var items = [];
          tags=$('#select2_sample2').select2("val");
              angular.forEach(tags, function(tag){
                var edge = {
                  'start_node': $scope.currentTask.entityKey,
                  'end_node': tag,
                  'kind':'tags',
                  'inverse_edge': 'tagged_on'
                };
                items.push(edge);
              });
          params = {
            'items': items
          }
          Edge.insert($scope,params);
          $scope.currentTask=null;
          $('#assigneeTagsToTask').modal('hide');
         };
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
            Task.listMore($scope,params);
        }
      };
  $scope.filterByTags = function(selected_tags){
         var tags = [];
         angular.forEach(selected_tags, function(tag){
            tags.push(tag.entityKey);
         });
         var params = {
          'tags': tags,
          'limit':20
         }
         Task.list($scope,params);

  };

  //HKA 03.03.2014 When tag is deleted render task.list
   $scope.tagDeleted = function(){
    $scope.listTags();
    $scope.listTasks();
 };

 $scope.listasks = function(){
   var params = { 'order': $scope.order,

                        'limit':7}
          Task.list($scope,params,true);
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

/* ------------------------------------*/
  $scope.taskFilterBy=function(filter,owner){
    if ($scope.taskfilter!=filter) {
            switch(filter) {
            case 'all':
               ;
               var params = { 'order': $scope.order,'limit':7}
               Task.list($scope,params,true);
               $scope.taskfilter=filter;
               $scope.tasksAssignee=null;
               $scope.tasksOwner=null;
                break;
            case 'my':
               
                var params = { 'order': $scope.order,'assignee' : owner}
                Task.list($scope,params,true);
                $scope.tasksAssignee=owner;
                $scope.tasksOwner=null;
                $scope.taskfilter=filter;
                break;
            case 'createdByMe':
                 var params = {'order': $scope.order,'owner': owner,'limit':7 };
                 Task.list($scope,params,true);
                 $scope.tasksAssignee=null;
                 $scope.tasksOwner=owner;
                 $scope.taskfilter=filter;
                break;
          }
    };
  }
  $scope.urgentTasks = function(){
         $scope.tasks = [];
         $scope.taskUrgent=!$scope.taskUrgent;
          var params = { 'order': 'due','limit':7};
         if ($scope.taskUrgent) {
            params.urgent= true;
         };
        
          Task.list($scope,params,true);

  }
 $scope.allTasks=function(){
   $scope.isFiltering=false;
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

 $scope.filterByAssignee=function(id){
   $scope.isFiltering=false;
    var params = { 
                  'order': $scope.order,
                  'assignee' : id
                }
    Task.list($scope,params,true);
 }
 /*-----------------------------------------------*/
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
           };
      };
$scope.hideEditable=function(index,tag){

  document.getElementById("tag_"+index).style.backgroundColor=tag.color;
   document.getElementById("closy_"+index).removeAttribute("style");
  document.getElementById("checky_"+index).style.display="inline";
 
  $scope.edited_tag=null;
}
$scope.deleteTag=function(tag){
          params = {
            'entityKey': tag.entityKey
          }
          Tag.delete($scope,params);

      };
$scope.editTag=function(tag,index){
     document.getElementById("tag_"+index).style.backgroundColor="white";
     document.getElementById("closy_"+index).style.display="none";
     document.getElementById("checky_"+index).style.display="none";
  
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
      if ($scope.currentTask!=null) {
        angular.forEach(tags, function(tag){
                var edge = {
                  'start_node': $scope.currentTask.entityKey,
                  'end_node': tag,
                  'kind':'tags',
                  'inverse_edge': 'tagged_on'
                };
                items.push(edge);
              });
      }else{
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
      }
      
      params = {
        'items': items
      }
      Edge.insert($scope,params);
      $('#assigneeTagsToTask').modal('hide');

     };
 // ask before delete task hadji hicham . 08-07-2014 .
    $scope.editbeforedelete = function(){
     $('#BeforedeleteTask').modal('show');
   };

   $scope.deleteTaskonList= function(){
      


     var params = {'entityKey':$scope.selected_tasks.entityKey};
        
       angular.forEach($scope.selected_tasks, function(selected_task){
           
              params = {'entityKey':selected_task.entityKey,
            
            };
             Task.delete($scope, params); 
          
        });
     
    
      $('#BeforedeleteTask').modal('hide');



     };

 //HKA 19.06.2014 Detache tag on contact list
     $scope.dropOutTag=function(){

        var params={'entityKey':$scope.edgekeytoDelete}
      
       Edge.delete($scope,params);

        $scope.edgekeytoDelete=undefined;
        $scope.showUntag=false;
      };

           $scope.dragTagItem = function(tag,task) {

            $scope.showUntag = true;
            $scope.edgekeytoDelete = tag.edgeKey;
            $scope.tagtoUnattach = tag;
            $scope.tasktoUnattachTag = task;
        }


         $scope.tagUnattached = function() {
            $scope.tasktoUnattachTag.tags.splice($scope.tasktoUnattachTag.tags.indexOf($scope.tagtoUnattach),1)
            $scope.apply()
        };

     // Google+ Authentication
     Auth.init($scope);
     $(window).scroll(function() {
          if (!$scope.isLoading && ($(window).scrollTop() >  $(document).height() - $(window).height() - 100)) {
              $scope.listMoreItems();
          }
      });

}]);

app.controller('LeadListCtrl', ['$scope','$filter','Auth','Lead','Leadstatus','Tag','Edge',
    function($scope,$filter,Auth,Lead,Leadstatus,Tag,Edge) {
      $("ul.page-sidebar-menu li").removeClass("active");
      $("#id_Leads").addClass("active");



      document.title = "Leads: Home";
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.isMoreItemLoading = false;
     $scope.leadpagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
     $scope.selectedOption='all';
     $scope.stage_selected={};

      $scope.leads = [];
      $scope.lead = {};
      $scope.selectedLead={};
      $scope.showClose=false;
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
            Lead.list($scope,params);
            Leadstatus.list($scope,{});
            var paramsTag = {'about_kind':'Lead'};
          Tag.list($scope,paramsTag);
          // for (var i=0;i<100;i++)
          //   {
          //       var params = {
          //                 'firstname': 'Dja3fer',
          //                 'lastname':'M3amer ' + i.toString(),
          //                 'access':'public'
          //               }
          //       Lead.insert($scope,params);
          //   }

        };

      $scope.fromNow = function(fromDate){
          return moment(fromDate,"YYYY-MM-DD HH:mm Z").fromNow();
      }
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
                        'limit':20};
        $scope.order = order;
        Lead.list($scope,params);
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
        Lead.list($scope,params);
     };
     $scope.filterByStatus = function(filter){
        if (filter){
          var params = { 'status': filter,
                         'order': $scope.order,
                         'limit':20}
        }
        else{
          var params = {
              'order': $scope.order,

              'limit':20}
        };
        $scope.isFiltering = true;
        Lead.list($scope,params);
     };


     /***********************************************
      HKA 19.02.2014  tags
***************************************************************************************/
$scope.listTags=function(){
      var paramsTag = {'about_kind':'Lead'}
      Tag.list($scope,paramsTag);
     };

$scope.edgeInserted = function () {
       $scope.listleads();
     };
$scope.listleads = function(){
  var params = { 'order': $scope.order,
                        'limit':6}
          Lead.list($scope,params);
};


$scope.addNewtag = function(tag){
       var params = {
                          'name': tag.name,
                          'about_kind':'Lead',
                          'color':tag.color.color
                      }  ;
       Tag.insert($scope,params);
        $scope.tag.name='';
        $scope.tag.color= {'name':'green','color':'#BBE535'};
        var paramsTag = {'about_kind':'Lead'};
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
         Lead.list($scope,params);

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
    $scope.listleads();

 };

$scope.editbeforedelete = function(lead){
  console.log('test');
   $scope.selectedLead=lead;
   $('#BeforedeleteLead').modal('show');
 };
 $scope.deletelead = function(){
     var params = {'entityKey':$scope.selectedLead.entityKey};
     Lead.delete($scope,params);
     $('#BeforedeleteLead').modal('hide');
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
      $scope.dropTag=function(lead,index){
        var items = [];

        var params = {
              'parent': lead.entityKey,
              'tag_key': $scope.draggedTag.entityKey
        };
        $scope.draggedTag=null;
        console.log('**********************************************');
        console.log(params);
        Tag.attach($scope,params,index);

      };
      $scope.tagattached=function(tag,index){
          if ($scope.leads[index].tags == undefined){
            $scope.leads[index].tags = [];
          }
          var ind = $filter('exists')(tag, $scope.leads[index].tags);
           if (ind == -1) {
                $scope.leads[index].tags.push(tag);
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
 $scope.showConvertModal = function(){
        $('#LeadsShow').modal('show');

      };
   // Google+ Authentication
     Auth.init($scope);
     $(window).scroll(function() {
          if (!$scope.isLoading && ($(window).scrollTop() >  $(document).height() - $(window).height() - 100)) {
              $scope.listMoreItems();
          }
      });


}]);

app.controller('LeadShowCtrl', ['$scope','$filter','$route','Auth','Email', 'Task','Event','Topic','Note','Lead','Permission','User','Leadstatus','Attachement','Map','InfoNode','Tag',
    function($scope,$filter,$route,Auth,Email,Task,Event,Topic,Note,Lead,Permission,User,Leadstatus,Attachement,Map,InfoNode,Tag) {
      $("ul.page-sidebar-menu li").removeClass("active");
      $("#id_Leads").addClass("active");


      $scope.editLead = function(){
      $('#EditLeadModal').modal('show');
     };

     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.isContentLoaded = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     //HKA 10.12.2013 Var topic to manage Next & Prev
     $scope.topicCurrentPage=01;
     $scope.topicpagination={};
     $scope.topicpages = [];
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.pages = [];
     $scope.lead = {};
     $scope.status_selected={};
     $scope.selected_members=[];
     $scope.selected_member={};
     $scope.users = [];
     $scope.user = undefined;
     $scope.slected_memeber = undefined;
     $scope.isLoading = false;
     $scope.email = {};
     $scope.infonodes = {};
     $scope.phone={};
     $scope.ioevent={};
     $scope.phone.type= 'work';
     $scope.documentpagination = {};
     $scope.documentCurrentPage=01;
     $scope.documentpages=[];
     $scope.selectedTab = 2;
     $scope.sharing_with = [];
     $scope.newTaskform=false;
     $scope.newEventform=false;
     $scope.newTask={};
     $scope.ioevent = {};
     $scope.statuses = [
      {value: 'Home', text: 'Home'},
      {value: 'Work', text: 'Work'},
      {value: 'Mob', text: 'Mob'},
      {value: 'Other', text: 'Other'}
      ];
    $scope.profile_img = {
                          'profile_img_id':null,
                          'profile_img_url':null
                        };

      // What to do after authentication
      console.log("check navigator infos");
      console.log(navigator.appVersion);
      $scope.runTheProcess = function(){
            var params = {
                          'id':$route.current.params.leadId,

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
          Lead.get($scope,params);
          User.list($scope,{});
          Leadstatus.list($scope,{});
          var paramsTag = {'about_kind': 'Lead'};
          Tag.list($scope, paramsTag);

      };
      // We need to call this to refresh token when user credentials are invalid
      $scope.refreshToken = function() {
              Auth.refreshToken();
      };


      // HKA 08.05.2014 Delete infonode

  $scope.deleteInfonode = function(entityKey,kind,val){
    var params = {'entityKey':entityKey,'kind':kind};

    InfoNode.delete($scope,params);
    var str=$scope.email.to
    var newstr=str.replace(val+",","");
    $scope.email.to=newstr;

  };


     $scope.TopiclistNextPageItems = function(){


        var nextPage = $scope.topicCurrentPage + 1;
        var params = {};
          if ($scope.topicpages[nextPage]){
            params = {
                      'id':$scope.lead.id,
                        'topics':{
                          'limit': '7',
                          'pageToken':$scope.topicpages[nextPage]
                        }
                     }
            $scope.topicCurrentPage = $scope.topicCurrentPage + 1 ;
            Lead.get($scope,params);
            }

     }


     $scope.listTopics = function(contact){
        var params = {
                      'id':$scope.lead.id,
                      'topics':{
                             'limit': '7'
                       }
                    };
          Lead.get($scope,params);

     };
     $scope.hilightTopic = function(){
        console.log('Should higll');
       $('#topic_0').effect( "bounce", "slow" );
       $('#topic_0.message').effect("highlight","slow");
     }


     $scope.selectMember = function(){
        $scope.slected_memeber = $scope.user;
        $scope.user = '';
        $scope.sharing_with.push($scope.slected_memeber);

     };
     $scope.share = function(slected_memeber){
        console.log('permissions.insert share');
        console.log(slected_memeber);
        console.log("ssssssssss");
        console.log($scope.lead.id);
        $scope.$watch($scope.lead.access, function() {
         var body = {'access':$scope.lead.access};
         var id = $scope.lead.id;
         var params ={'id':id,
                      'access':$scope.lead.access}
         Lead.patch($scope,params);
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
                            'about': $scope.lead.entityKey,
                            'items': items
              }
              Permission.insert($scope,params);
          }
          $scope.sharing_with = [];
        }
     };


     $scope.updateCollaborators = function(){

          Lead.get($scope,$scope.lead.id);

     };
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
   $scope.deleteEvent =function(eventt){
    var params = {'entityKey':eventt.entityKey};
     Event.delete($scope,params);
     //$('#addLeadModal').modal('show');
   }
   $scope.eventDeleted = function(resp){
   };
  //HKA 09.11.2013 Add a new Task
   $scope.addTask = function(task){
        if ($scope.newTaskform==false) {
          $scope.newTaskform=true;
           }else{
            if (task.title!=null) {
                    //  $('#myModal').modal('hide');
            if (task.due){
                console.log('enterrrrr');
                console.log(task);
                var dueDate= $filter('date')(task.due,['yyyy-MM-ddT00:00:00.000000']);
                params ={'title': task.title,
                          'due': dueDate,
                          'parent': $scope.lead.entityKey,
                          'access':$scope.lead.access
                }

            }else{
                params ={'title': task.title,
                         'parent': $scope.lead.entityKey,
                         'access':$scope.lead.access
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
    $scope.deleteTask = function(task){
      
       var params = {'entityKey':task.entityKey};
       
       Task.delete($scope, params);

     };

     // rederection after delete task . hadji hicham 08--07-2014
      $scope.taskDeleted = function(resp){

     }; 
     $scope.hilightTask = function(){
        console.log('Should higll');
        $('#task_0').effect("highlight","slow");
        $('#task_0').effect( "bounce", "slow" );

     }
     $scope.listTasks = function(){
        var params = {
                        'id':$scope.lead.id,
                        'tasks':{}
                      };
                      console.log('params');
                      console.log(params);
        Lead.get($scope,params);
        console.log($scope.tasks);

     }
 //HKA 10.11.2013 Add event
 $scope.addEvent = function(ioevent){




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
                            'parent':$scope.lead.entityKey,
                            'allday':"true",
                            'access':$scope.lead.access
                      }



                  }else{

                  if (ioevent.starts_at){
                    if (ioevent.ends_at){
                      params ={'title': ioevent.title,
                              'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                              'ends_at': $filter('date')(ioevent.ends_at,['yyyy-MM-ddTHH:mm:00.000000']),
                              'where': ioevent.where,
                              'parent':$scope.lead.entityKey,
                              'allday':"false",
                              'access':$scope.lead.access
                      }

                    }else{
                      params ={
                        'title': ioevent.title,
                              'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                              'where': ioevent.where,
                              'parent':$scope.lead.entityKey,
                              'ends_at':moment(ioevent.ends_at).add('hours',2).format('YYYY-MM-DDTHH:mm:00.000000'),
                              'allday':"false",
                              'access':$scope.lead.access
                      }
                    }




                  }


                  }

                   Event.insert($scope,params);
                  $scope.ioevent={};
                  $scope.newEventform=false;



        }
     }
    }

// hadji hicham 14-07-2014 . update the event after we add .
$scope.updateEventRenderAfterAdd= function(){};

    $scope.closeEventForm=function(ioevent){
      $scope.ioevent={};
      $scope.newEventform=false;
    }
    $scope.listEvents = function(){
        var params = {
                        'id':$scope.lead.id,
                        'events':{

                        }
                      };
        Lead.get($scope,params);

     }
     $scope.hilightEvent = function(){
        console.log('Should higll');
        $('#event_0').effect("highlight","slow");
        $('#event_0').effect( "bounce", "slow" );

     }
  //HKA 11.11.2013 Add Note
  $scope.addNote = function(note){
    var params ={
                  'about': $scope.lead.entityKey,
                  'title': note.title,
                  'content': note.content
    };
    Note.insert($scope,params);
    $scope.note.title='';
    $scope.note.content='';
  };
//HKA 27.11.2013 Update Lead
  $scope.updatelead = function(lead){
    var params={'id':$scope.lead.id,
                'firstname':lead.firstname,
                'lastname':lead.lastname,
                'company':lead.company,
                 'source':lead.source,
                 'industry':lead.industry,
                 'title' : lead.title,
                'status':$scope.status_selected.status};
        Lead.patch($scope,params);
        $('#EditLeadModal').modal('hide')

  };


 $scope.listInfonodes = function(kind) {
     params = {'parent':$scope.lead.entityKey,
               'connections': kind
              };
     InfoNode.list($scope,params);
 }
//HKA 19.11.2013 Add Phone
 $scope.addPhone = function(phone){
 if (phone.number){
  params = {'parent':$scope.lead.entityKey,
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
  InfoNode.insert($scope,params);}
  $scope.phone={};
  $scope.phone.type= 'work';
  $scope.showPhoneForm=false;
  };


//HKA 20.11.2013 Add Email
$scope.addEmail = function(email){

  params = {'parent':$scope.lead.entityKey,
            'kind':'emails',
            'fields':[
                {
                  "field": "email",
                  "value": email
                }
            ]
  };
  console.log(email)
  // lebdiri arezki 29-06-2014 control add email
  if(email){
    InfoNode.insert($scope,params);
    $scope.email.to = $scope.email.to + email + ',';
  }
  $scope.newEmail=null;
  $scope.showEmailForm = false;
  };



//HKA 22.11.2013 Add Website
$scope.addWebsite = function(website){
  console.log(website)
if(website){
  params = {'parent':$scope.lead.entityKey,
            'kind':'websites',
            'fields':[
                {
                  "field": "url",
                  "value": website.url
                }
            ]
  };
  InfoNode.insert($scope,params);
}
  $scope.website={};
  $scope.showWebsiteForm=false;
};

//HKA 22.11.2013 Add Social
$scope.addSocial = function(social){
  if(social){
  params = {'parent':$scope.lead.entityKey,
            'kind':'sociallinks',
            'fields':[
                {
                  "field": "url",
                  "value": social.url
                }
            ]
  };
  InfoNode.insert($scope,params);
}
  $scope.sociallink={};
      $scope.showSociallinkForm=false;


};
$scope.addCustomField = function(customField){

  if (customField){
   if(customField.field && customField.value){
  params = {'parent':$scope.lead.entityKey,
            'kind':'customfields',
            'fields':[
                {
                  "field": customField.field,
                  "value": customField.value
                }
            ]
  };
  InfoNode.insert($scope,params);
}
}
  $('#customfields').modal('hide');
  $scope.customfield={};
  $scope.showCustomFieldForm = false;

};
//HKA 22.11.2013 Edit tagline of Account
$scope.edittagline = function() {
       $('#EditTagModal').modal('show');
    };
    //HKA Edit Introduction on Account
$scope.editintro = function() {
       $('#EditIntroModal').modal('show');
    };

//HKA 21.06.2014 Update Intro and Tagline
 $scope.updateContactIntroTagline=function(params){
      Lead.patch($scope,params);
     };


      $scope.showConvertModal = function(){
        $('#convertLeadModal').modal('show');

      };
      $scope.convert = function(){
        $('#convertLeadModal').modal('hide');
        var leadid = {'id':$route.current.params.leadId};
        Lead.convert($scope,leadid);
      };
      $('#some-textarea').wysihtml5();

      $scope.sendEmail = function(email){
        email.body = $('#some-textarea').val();
        console.log(email);
        /*
        to = messages.StringField(2)
        cc = messages.StringField(3)
        bcc = messages.StringField(4)
        subject = messages.StringField(5)
        body = messages.StringField(6)
        about_kind = messages.StringField(7)
        about_item = messages.StringField(8)
        */
        var params = {
                  'to': email.to,
                  'cc': email.cc,
                  'bcc': email.bcc,
                  'subject': email.subject,
                  'body': email.body,
                  'about':$scope.lead.entityKey
                  };
        Email.send($scope,params);
      };
//HKA
  $scope.editbeforedelete = function(){
     $('#BeforedeleteLead').modal('show');
   };
$scope.deletelead = function(){
     var params = {'entityKey':$scope.lead.entityKey};
     Lead.delete($scope,params);
     $('#BeforedeleteLead').modal('hide');
     };
     $scope.DocumentlistNextPageItems = function(){


        var nextPage = $scope.documentCurrentPage + 1;
        var params = {};
          if ($scope.documentpages[nextPage]){
            params = {
                        'id':$scope.lead.id,
                        'documents':{
                          'limit': '15',
                          'pageToken':$scope.documentpages[nextPage]
                        }
                      }
            $scope.documentCurrentPage = $scope.documentCurrentPage + 1 ;

            Lead.get($scope,params);

          }


     }
     $scope.listDocuments = function(){
        var params = {
                        'id':$scope.lead.id,
                        'documents':{
                          'limit': '15'
                        }
                      }
        Lead.get($scope,params);

     };
     $scope.showCreateDocument = function(type){

        $scope.mimeType = type;
        $('#newDocument').modal('show');
     };
     $scope.createDocument = function(newdocument){
        var mimeType = 'application/vnd.google-apps.' + $scope.mimeType;
        var params = {
                      'parent': $scope.lead.entityKey,
                      'title':newdocument.title,
                      'mimeType':mimeType
                     };
        Attachement.insert($scope,params);

     };
     $scope.createPickerUploader = function() {
          var developerKey = 'AIzaSyCqpqK8oOc4PUe77_nNYNvzh9xhTWd_gJk';
          var projectfolder = $scope.lead.folder;
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
                              'access': $scope.lead.access,
                              'parent':$scope.lead.entityKey
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
                   $scope.profile_img.profile_img_id = data.docs[0].id ;
                   $scope.profile_img.profile_img_url = 'https://docs.google.com/uc?id='+data.docs[0].id;
                   $scope.imageSrc = 'https://docs.google.com/uc?id='+data.docs[0].id;
                   $scope.$apply();
                   var params ={'id':$scope.lead.id};
                   params['profile_img_id'] = $scope.profile_img.profile_img_id;
                   params['profile_img_url'] = $scope.profile_img.profile_img_url;
                   Lead.patch($scope,params);
                 }
           }
       }
      $scope.renderMaps = function(){
          $scope.addresses = $scope.lead.addresses;
          Map.render($scope);
      };
      $scope.addAddress = function(address){
           //Map.render($scope);
           //renderMaps();
           Map.searchLocation($scope,address);
        //Map.searchLocation($scope,address);

        $('#addressmodal').modal('hide');
        $scope.address={};
      };
      $scope.locationUpdated = function(addressArray){

          var params = {'id':$scope.lead.id,
                         'addresses':addressArray};
          Lead.patch($scope,params);
      };
        $scope.addGeo = function(address){
          params = {'parent':$scope.lead.entityKey,
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
            params = {'parent':$scope.lead.entityKey,
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

  // HKA 19.03.2014 inline update infonode
     $scope.inlinePatch=function(kind,edge,name,entityKey,value){
      console.log("ezzzzzzzzzzzzz");
      console.log(value);
       Map.destroy();
      console.log("ezzzzzzzzzzzzz2");
      console.log($scope);
       //Map.searchLocation($scope,value);
       //Map.searchLocation($scope,address);
   if (kind=='Lead') {
      if (name=='firstname')
        {params = {'id':$scope.lead.id,
             firstname:value};
         Lead.patch($scope,params);};
       if (name=='lastname')
        {params = {'id':$scope.lead.id,
             lastname:value};
         Lead.patch($scope,params);}

   }else{



          params = {
                  'entityKey': entityKey,
                  'parent':$scope.lead.entityKey,
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

   $scope.listTags=function(){
      var paramsTag = {'about_kind':'Lead'}
      Tag.list($scope,paramsTag);
     };

   // Google+ Authentication
   Auth.init($scope);
   $(window).scroll(function() {
        if (!$scope.isLoading && ($(window).scrollTop() >  $(document).height() - $(window).height() - 100)) {
            $scope.listMoreOnScroll();
        }
    });

}]);

app.controller('LeadNewCtrl', ['$scope','Auth','Lead','Leadstatus','Tag','Edge',
    function($scope,Auth,Lead,Leadstatus,Tag,Edge) {
      $("ul.page-sidebar-menu li").removeClass("active");
      $("#id_Leads").addClass("active");

      document.title = "Leads: New";
      $("#id_Leads").addClass("active");
      $scope.isSignedIn = false;
      $scope.immediateFailed = false;
      $scope.nextPageToken = undefined;
      $scope.prevPageToken = undefined;
      $scope.isLoading = false;
      $scope.leadpagination = {};
      $scope.currentPage = 01;
      $scope.pages = [];
      $scope.stage_selected={};
      $scope.leads = [];
      $scope.lead = {};
      $scope.lead.access ='public';
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
      $scope.phone={};
      $scope.phone.type= 'work';
      $scope.imageSrc = '/static/img/avatar_contact.jpg';
      $scope.profile_img = {
                            'profile_img_id':null,
                            'profile_img_url':null
                          }
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
                  $scope.profile_img.profile_img_id = data.docs[0].id ;
                  $scope.profile_img.profile_img_url = data.docs[0].url ;
                  $scope.imageSrc = 'https://docs.google.com/uc?id='+data.docs[0].id;
                  $scope.$apply();
                }
          }
      }


      $scope.initObject=function(obj){
          for (var key in obj) {
                obj[key]=null;
              }
      }
      $scope.pushElement=function(elem,arr,infos){
        if (elem){
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
        }
      };

      //HKA 01.06.2014 Delete the infonode on DOM
      $scope.deleteInfos = function(arr,index){
          arr.splice(index, 1);
      }

       $scope.runTheProcess = function(){

          //   Leadstatus.list($scope,{});
          //   var paramsTag = {'about_kind':'Lead'};
          // Tag.list($scope,paramsTag);


       };

       $scope.getPosition= function(index){
        if(index<3){

          return index+1;
        }else{
          console.log((index%3)+1);
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
    }
    $scope.leadInserted = function(){
      window.location.replace('/#/leads');
    };
      $scope.save = function(lead){
        if(lead.firstname && lead.lastname){
          var params ={
                        'firstname':lead.firstname,
                        'lastname':lead.lastname,
                        'company':lead.company,
                        'title':lead.title,
                        'tagline':lead.tagline,
                        'introduction':lead.introduction,
                        'phones':$scope.phones,
                        'emails':$scope.emails,
                        'industry':lead.industry,
                        'source':lead.source,
                        'infonodes':$scope.prepareInfonodes(),
                        'access': lead.access
                      };
          if ($scope.profile_img.profile_img_id){
              params['profile_img_id'] = $scope.profile_img.profile_img_id;
              params['profile_img_url'] = 'https://docs.google.com/uc?id='+$scope.profile_img.profile_img_id;
          }
          Lead.insert($scope,params);

        }
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
      var paramsTag = {'about_kind':'Lead'}
      Tag.list($scope,paramsTag);
     };

$scope.edgeInserted = function () {
       $scope.listleads();
     };
$scope.listleads = function(){
  var params = { 'order': $scope.order,
                        'limit':6}
          Lead.list($scope,params);
};


$scope.addNewtag = function(tag){
       var params = {
                          'name': tag.name,
                          'about_kind':'Lead',
                          'color':tag.color.color
                      }  ;
       Tag.insert($scope,params);
        $scope.tag.name='';
        $scope.tag.color= {'name':'green','color':'#BBE535'};
        var paramsTag = {'about_kind':'Lead'};
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
                        'limit':6
         };
         $scope.isFiltering = true;
         Lead.list($scope,params);

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
    $scope.listleads();

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
        $scope.$apply();
      };
      $scope.dropTag=function(lead){
        var items = [];

        var edge = {
             'start_node': lead.entityKey,
              'end_node': $scope.draggedTag.entityKey,
              'kind':'tags',
              'inverse_edge': 'tagged_on'
        };
        items.push(edge);
        params = {
          'items': items
        };
                Edge.insert($scope,params);
        $scope.draggedTag=null;
      };

  // HKA 12.03.2014 Pallet color on Tags
      $scope.checkColor=function(color){
        $scope.tag.color=color;
      }

   // Google+ Authentication
     Auth.init($scope);


}]);

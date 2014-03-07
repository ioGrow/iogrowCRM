app.controller('OpportunityListCtrl', ['$scope','Auth','Account','Opportunity','Opportunitystage','Search','Tag','Edge',
    function($scope,Auth,Account,Opportunity,Opportunitystage,Search,Tag,Edge) {
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
     $scope.opportunity = {};
     $scope.opportunity.access ='public';
     $scope.order = '-updated_at';
     $scope.selected_tags = [];
     $scope.draggedTag=null;
     $scope.selectedTab = 2;

      // What to do after authentication
       $scope.runTheProcess = function(){
          var params = {'order' : $scope.order,'limit':6};
          Opportunity.list($scope,params);
          Opportunitystage.list($scope,{'order':'probability'});
          var paramsTag = {'about_kind':'Opportunity'};
          Tag.list($scope,paramsTag);
       };
        // We need to call this to refresh token when user credentials are invalid
       $scope.refreshToken = function() {
            Auth.refreshToken();
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
      console.log('I am here on this method');
          console.log($scope.stage_selected.name);
          console.log($scope.stage_selected.probability);

       opportunity.stagename= $scope.stage_selected.name;
       opportunity.stage_probability= $scope.stage_selected.probability;
        
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
         gapi.client.crmengine.accounts.search(params_search_account).execute(function(resp) {
            console.log("in accouts.search api");
            console.log(params_search_account);

            console.log(resp);
            if (resp.items){
              $scope.results = resp.items;
              console.log($scope.accountsResults);
              $scope.$apply();
            };
            
          });
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
        if (filter){
          var params = { 'stagename': filter,
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
                          'color':$('#tag-col-pick').val()
                      }  ;
       Tag.insert($scope,params);
        $scope.tag.name='';
        $('#tag-col-pick').val('#8fff00');
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
                      'limit':6
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
       
        $scope.$apply();
      }
      $scope.dropTag=function(opportunity){
        var items = [];
        
        var edge = {
             'start_node': opportunity.entityKey,
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
      };




     // Google+ Authentication 
     Auth.init($scope);
     
}]);
app.controller('OpportunityShowCtrl', ['$scope','$filter','$route','Auth','Task','Event','Topic','Note','Opportunity','Permission','User','Opportunitystage','Email','Attachement','InfoNode',
    function($scope,$filter,$route,Auth,Task,Event,Topic,Note,Opportunity,Permission,User,Opportunitystage,Email,Attachement,InfoNode) {
      $("ul.page-sidebar-menu li").removeClass("active");
      $("#id_Opportunities").addClass("active");
      $scope.selectedTab = 1;
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

      // What to do after authentication
       $scope.runTheProcess = function(){
          var opportunityid = {'id':$route.current.params.opportunityId};
          Opportunity.get($scope,opportunityid);
          User.list($scope,{});
          //HKA 13.12.2013 to retrieve the opportunities's stages
          Opportunitystage.list($scope,{});
       };
        // We need to call this to refresh token when user credentials are invalid
       $scope.refreshToken = function() {
            Auth.refreshToken();
       };
     //HKA 09.11.2013 Add a new Task
     $scope.addTask = function(task){
      
        $('#myModal').modal('hide');
        var params ={}

        console.log('adding a new task');
        console.log(task);
        
        if (task.due){

            var dueDate= $filter('date')(task.due,['yyyy-MM-dd']);
            dueDate = dueDate +'T00:00:00.000000'
            params ={'title': task.title,
                      'due': dueDate,
                      'about':$scope.opportunity.entityKey
            }
            console.log(dueDate);
        }else{
            params ={'title': task.title,
                     'about':$scope.opportunity.entityKey}
        };
        Task.insert($scope,params);
     }

     $scope.hilightTask = function(){
        console.log('Should higll');
        $('#task_0').effect("highlight","slow");
        $('#task_0').effect( "bounce", "slow" );
       
     }
     $scope.listTasks = function(){
        var params = {'about':$scope.opportunity.entityKey,
                      'order': '-updated_at'
                      
                      };
        Task.list($scope,params);

     }
     $scope.editOpp = function(){

      $('#EditOpportunityModal').modal('show')
     }

     $scope.TopiclistNextPageItems = function(){
        
        
        var nextPage = $scope.topicCurrentPage + 1;
        var params = {};
          if ($scope.topicpages[nextPage]){
            params = {'about_kind':'Opportunity',
                      'about_item':$scope.opportunity.id,
                      'order': '-updated_at',
                      'limit': 5,
                      'pageToken':$scope.topicpages[nextPage]
                     }
          }else{
            params = {'about_kind':'Opportunity',
                      'about_item':$scope.opportunity.id,
                      'order': '-updated_at',
                      'limit': 5}
          }
          console.log('in listNextPageItems');
          $scope.topicCurrentPage = $scope.topicCurrentPage + 1 ; 
          Topic.list($scope,params);
     }
     $scope.TopiclistPrevPageItems = function(){
       
       var prevPage = $scope.topicCurrentPage - 1;
       var params = {};
          if ($scope.topicpages[prevPage]){
            params = {'about_kind':'Opportunity',
                      'about_item':$scope.opportunity.id,
                      'order': '-updated_at',
                      'limit': 5,
                      'pageToken':$scope.topicpages[prevPage]
                     }
          }else{
            params = {'about_kind':'Opportunity',
                      'about_item':$scope.opportunity.id,
                      'order': '-updated_at',
                      'limit': 5}
          }
          $scope.topicCurrentPage = $scope.topicCurrentPage - 1 ;
          Topic.list($scope,params);
          
     }
    
     $scope.listTopics = function(opportunity){
        var params = {'about_kind':'Opportunity',
                      'about_item':$scope.opportunity.id,
                      'order': '-updated_at',
                      'limit': 5
                      };
        Topic.list($scope,params);

     }
     $scope.hilightTopic = function(){
        console.log('Should higll');
       $('#topic_0').effect( "bounce", "slow" );
       $('#topic_0 .message').effect("highlight","slow");
     }


     
     $scope.selectMember = function(){
        console.log('slecting user yeaaah');
        $scope.slected_memeber = $scope.user;
        $scope.user = $scope.slected_memeber.google_display_name;

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

        if (slected_memeber.email){
        var params = {  'type': 'user',
                        'role': 'writer',
                        'value': slected_memeber.email,
                        'about_kind': 'Opportunity',
                        'about_item': $scope.opportunity.id

                        
          };
          Permission.insert($scope,params); 
          
          
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
      
        $('#newEventModal').modal('hide');
        var params ={}       
        
        if (ioevent.starts_at){
            if (ioevent.ends_at){
              params ={'title': ioevent.title,
                      'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'ends_at': $filter('date')(ioevent.ends_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'where': ioevent.where,
                      'about_kind':'Opportunity',
                      'about_item':$scope.opportunity.id
              }

            }else{
              params ={'title': ioevent.title,
                      'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'where': ioevent.where,
                      'about_kind':'Opportunity',
                      'about_item':$scope.opportunity.id
              }
            }
            console.log('inserting the event');
            console.log(params);
            Event.insert($scope,params);

            
        };
     };
     $scope.hilightEvent = function(){
        
        $('#event_0').effect("highlight","slow");
        $('#event_0').effect( "bounce", "slow" );
       
     };
     $scope.listEvents = function(){
        var params = {'about_kind':'Opportunity',
                      'about_item':$scope.opportunity.id,
                      'order': 'starts_at',
                      'limit': 5
                      };
        Event.list($scope,params);

     };


 //HKA 11.11.2013 Add Note
  $scope.addNote = function(note){
    var params = {'title':$scope.note.title,
                  'content':$scope.note.content,
                  'about_item':$scope.opportunity.id,
                  'about_kind':'Opportunity' };
    Note.insert($scope,params);
    $scope.note.title='';
    $scope.note.content='';
  };
// 26.11.2013 Update Opportunity
 $scope.UpdateOpportunity = function(opportunity){
  var params = {'id':$scope.opportunity.id,
                'name':opportunity.name,
                 'stagename':$scope.stage_selected.name,
                 'stage_probability':$scope.stage_selected.probability,
                'amount':opportunity.amount,
                'description':opportunity.description};
    
  console.log($scope.opportunity.stagename);
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

                  'about_item':$scope.opportunity.id,
                  'about_kind':'Opportunity' };
        
        Email.send($scope,params);
      };

 //HKA 29.12.2013 Delete Opportunity
 $scope.editbeforedelete = function(){
     $('#BeforedeleteOpportunity').modal('show');
   };
$scope.deleteopportunity= function(){
     var opportunityid = {'id':$route.current.params.opportunityId};
     Opportunity.delete($scope,opportunityid);
     $('#BeforedeleteOpportunity').modal('hide');
     };

     $scope.listDocuments = function(){
        var params = {'about_kind':'Opportunity',
                      'about_item':$scope.opportunity.id,
                      'order': '-updated_at',
                      'limit': 5
                      };
        Attachement.list($scope,params);

     };
     $scope.showCreateDocument = function(type){
        
        $scope.mimeType = type;
        $('#newDocument').modal('show');
     };
     $scope.createDocument = function(newdocument){
        var mimeType = 'application/vnd.google-apps.' + $scope.mimeType;
        var params = {'about_kind':'Opportunity',
                      'about_item': $scope.opportunity.id,
                      'title':newdocument.title,
                      'mimeType':mimeType };
        Attachement.insert($scope,params);

     };
     $scope.createPickerUploader = function() {
          var projectfolder = $scope.opportunity.folder;
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
                var params = {'about_kind': 'Opportunity',
                                      'about_item':$scope.opportunity.id};
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

  $('#customfields').modal('hide');
  
};

$scope.listInfonodes = function(kind) {
     params = {'parent':$scope.opportunity.entityKey,
               'connections': kind
              };
     InfoNode.list($scope,params);
   
 };


    
     // Google+ Authentication 
     Auth.init($scope);

}]);






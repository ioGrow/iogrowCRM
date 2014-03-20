app.controller('LeadListCtrl', ['$scope','Auth','Lead','Leadstatus','Tag','Edge',
    function($scope,Auth,Lead,Leadstatus,Tag,Edge) {
      $("ul.page-sidebar-menu li").removeClass("active");
      $("#id_Leads").addClass("active");
      
      document.title = "Leads: Home";
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
      $scope.selected_tags = [];
      $scope.draggedTag=null;
      $scope.tag = {};
        $scope.showNewTag=false;
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
            var params = {'order' : $scope.order,'limit':6};
            Lead.list($scope,params);
            Leadstatus.list($scope,{});
            var paramsTag = {'about_kind':'Lead'};
          Tag.list($scope,paramsTag);


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

app.controller('LeadShowCtrl', ['$scope','$filter','$route','Auth','Email', 'Task','Event','Topic','Note','Lead','Permission','User','Leadstatus','Attachement','Map','InfoNode',
    function($scope,$filter,$route,Auth,Email,Task,Event,Topic,Note,Lead,Permission,User,Leadstatus,Attachement,Map,InfoNode) {
      $("ul.page-sidebar-menu li").removeClass("active");
      $("#id_Leads").addClass("active");
      
     
      $scope.editLead = function(){
      $('#EditLeadModal').modal('show');
     }

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
     $scope.users = [];
     $scope.user = undefined;
     $scope.slected_memeber = undefined;
     $scope.isLoading = false;
     $scope.email = {};
     $scope.infonodes = {};
    $scope.phone={};
    $scope.phone.type_number = 'work';
    $scope.documentpagination = {};
     $scope.documentCurrentPage=01;
     $scope.documentpages=[];
    $scope.selectedTab = 2;
    $scope.sharing_with = [];
    $scope.statuses = [
      {value: 'Home', text: 'Home'},
      {value: 'Work', text: 'Work'},
      {value: 'Mob', text: 'Mob'},
      {value: 'Other', text: 'Other'}
      ];

      // What to do after authentication
      $scope.runTheProcess = function(){
            var params = {
                          'id':$route.current.params.leadId,
                          
                          'topics':{
                            'limit': '7'
                          },

                          'documents':{
                            'limit': '6'
                          },

                          'tasks':{
                            
                          },

                          'events':{
                            
                          }
                      };
          Lead.get($scope,params);
          User.list($scope,{});
          Leadstatus.list($scope,{}); 
            
      };
      // We need to call this to refresh token when user credentials are invalid
      $scope.refreshToken = function() {
              Auth.refreshToken();
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
            }else{
            params = {
                      'id':$scope.lead.id,
                        'topics':{
                          'limit': '7'
                        }
                     }
          }
          
          $scope.topicCurrentPage = $scope.topicCurrentPage + 1 ; 
          Lead.get($scope,params);
     }
     $scope.TopiclistPrevPageItems = function(){

       var prevPage = $scope.topicCurrentPage - 1;
       var params = {};
       
          if ($scope.topicpages[prevPage]){
            params = {
                      'id':$scope.lead.id,
                        'topics':{
                          'limit': '7',
                          'pageToken':$scope.topicpages[prevPage]
                        }
                     }
          }else{
            params = {
                      'id':$scope.lead.id,
                        'topics':{
                          'limit': '7'
                        }
                     }
          }
          $scope.topicCurrentPage = $scope.topicCurrentPage - 1 ;
          Lead.get($scope,params);
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
        $scope.$watch($scope.lead.access, function() {
         var body = {'access':$scope.lead.access};
         var id = $scope.account.id;
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
          
          
        }else{ 
          alert('select a user to be invited');
        };


     };

     
     $scope.updateCollaborators = function(){
          
          Lead.get($scope,$scope.lead.id);

     };
     //$('#addLeadModal').modal('show');
  //HKA 09.11.2013 Add a new Task
   $scope.addTask = function(task){
      
        $('#myModal').modal('hide');
        if (task.due){

            var dueDate= $filter('date')(task.due,['yyyy-MM-ddT00:00:00.000000']);
            
            params ={'title': task.title,
                      'due': dueDate,
                      'parent': $scope.lead.entityKey
            }
            
            
        }else{
            params ={'title': task.title,
                     'parent': $scope.lead.entityKey
                   }
        };
        $scope.task.title='';
        $scope.task.dueDate='0000-00-00T00:00:00-00:00';
        Task.insert($scope,params);
     }

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
        Lead.get($scope,params);

     }
 //HKA 10.11.2013 Add event 
 $scope.addEvent = function(ioevent){
      
        $('#newEventModal').modal('hide');
        var params ={}       
        
        if (ioevent.starts_at){
            if (ioevent.ends_at){
              params ={'title': ioevent.title,
                      'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'ends_at': $filter('date')(ioevent.ends_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'where': ioevent.where,
                      'parent':$scope.lead.entityKey
              }

            }else{
              params ={
                'title': ioevent.title,
                      'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'where': ioevent.where,
                      'parent':$scope.lead.entityKey
              }
            }
            
            Event.insert($scope,params);
            $scope.ioevent.title='';
            $scope.ioevent.where='';
            $scope.ioevent.starts_at='T00:00:00.000000';
          };
     }
     $scope.hilightEvent = function(){
        console.log('Should higll');
        $('#event_0').effect("highlight","slow");
        $('#event_0').effect( "bounce", "slow" );
       
     }
     $scope.listEvents = function(){
        var params = {
                        'id':$scope.lead.id,
                        'events':{
                          
                        }
                      };
        Lead.get($scope,params);

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
  
  params = {'parent':$scope.lead.entityKey,
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
  
  params = {'parent':$scope.lead.entityKey,
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
  $scope.email={};
  };
  


//HKA 22.11.2013 Add Website
$scope.addWebsite = function(website){
  params = {'parent':$scope.lead.entityKey,
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
  params = {'parent':$scope.lead.entityKey,
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

  $('#customfields').modal('hide');
  
};
//HKA 22.11.2013 Edit tagline of Account
$scope.edittagline = function() {
       $('#EditTagModal').modal('show');
    };
    //HKA Edit Introduction on Account
$scope.editintro = function() {
       $('#EditIntroModal').modal('show');
    };

//HKA 22.11.2013 Add Tagline
$scope.updateTagline = function(lead){
 
  params = {'id':$scope.lead.id,
             'tagline':lead.tagline}
  Lead.patch($scope,params);
  $('#EditTagModal').modal('hide');
};

//HKA 22.11.2013 Add Introduction
$scope.updateintro = function(lead){
 
  params = {'id':$scope.lead.id,
             'introduction':lead.introduction}
  Lead.patch($scope,params);
  $('#EditIntroModal').modal('hide');
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

                  'about_item':$scope.lead.id,
                  'about_kind':'Lead' };
        Email.send($scope,params);
      };
//HKA 
  $scope.editbeforedelete = function(){
     $('#BeforedeleteLead').modal('show');
   };
$scope.deletelead = function(){
     var leadid = {'entityKey':$scope.lead.entityKey};
     Lead.delete($scope,leadid);
     $('#BeforedeleteLead').modal('hide');
     };

     $scope.listDocuments = function(){
        var params = {
                        'id':$scope.lead.id,
                        'documents':{
                          'limit': '6'
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
          var developerKey = 'AIzaSyD___EKeONhEP1JDWsNQi0zQhlGGzuwRI4';
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
      $scope.renderMaps = function(){
          $scope.addresses = $scope.lead.addresses;
          Map.render($scope);
      };
      $scope.addAddress = function(address){
      
        Map.searchLocation($scope,address);

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
   
   if (kind=='Lead') {
          params = {'id':$scope.lead.id,
             name:value}
         Lead.patch($scope,params);
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
      
    // Google+ Authentication 
     Auth.init($scope);

}]);

app.controller('ContactListCtrl', ['$scope','Auth','Account','Contact','Tag','Edge',
    function($scope,Auth,Account,Contact,Tag,Edge) {
        $("ul.page-sidebar-menu li").removeClass("active");
        $("#id_Contacts").addClass("active");

        document.title = "Contacts: Home";
        $scope.isSignedIn = false;
        $scope.immediateFailed = false;
        $scope.nextPageToken = undefined;
        $scope.prevPageToken = undefined;
        $scope.isLoading = false;
        $scope.contactpagination = {};
        $scope.currentPage = 01;
        //HKA 10.12.2013 Var Contact to manage Next & Prev
        $scope.contactpagination={};
        $scope.contactCurrentPage=01;
        $scope.contactpages = [];
        $scope.pages = [];
      	$scope.contacts = [];
        $scope.contact = {};
        $scope.contact.access = 'public';
        $scope.order = '-updated_at';
        $scope.selected_tags = [];
        $scope.draggedTag=null;
        
        // What to do after authentication
       $scope.runTheProcess = function(){
            var params = {'order' : $scope.order,'limit':8}
            Contact.list($scope,params);
            var paramsTag = {'about_kind':'Contact'};
          Tag.list($scope,paramsTag);

       };
        // We need to call this to refresh token when user credentials are invalid
       $scope.refreshToken = function() {
            Auth.refreshToken();
       };
       $scope.listNextPageItems = function(){
          
          var nextPage = $scope.contactCurrentPage + 1;
          var params = {};
            if ($scope.contactpages[nextPage]){
              params = {'order' : $scope.order,'limit':8,
                        'pageToken':$scope.contactpages[nextPage]
                       }
            }else{
              params = {'order' : $scope.order,'limit':8}
            }
            
            $scope.contactCurrentPage = $scope.contactCurrentPage + 1 ; 
            Contact.list($scope,params);
       };
       $scope.listPrevPageItems = function(){
         
         var prevPage = $scope.contactCurrentPage - 1;
         var params = {};
            if ($scope.contactpages[prevPage]){
              params = {'limit':8,
                        'pageToken':$scope.contactpages[prevPage]
                       }
            }else{
              params = {'order' : $scope.order,'limit':8}
            }
            $scope.contactCurrentPage = $scope.contactCurrentPage - 1 ;
            Contact.list($scope,params);
       };
      // new Contact
      $scope.showModal = function(){
        $('#addContactModal').modal('show');

      };
      $scope.save = function(contact){
          var params = {};
          var contact_name = new Array();
          contact_name.push(contact.firstname);
          contact_name.push(contact.lastname);
          contact.display_name = contact_name;
          if (typeof(contact.account)=='object'){
            contact.account_name = contact.account.name;
            contact.account = contact.account.entityKey;
            
            Contact.insert($scope,contact);

          }else if($scope.searchAccountQuery.length>0){
              // create a new account with this account name
              var params = {'name': $scope.searchAccountQuery,
                            'access': contact.access
              };
              $scope.contact = contact;
              Account.insert($scope,params);
          };
          $('#addContactModal').modal('hide');
      };
      $scope.addContactOnKey = function(contact){
          if(event.keyCode == 13 && contact){
              $scope.save(contact);
          }
      };
      $scope.accountInserted = function(resp){
          $scope.contact.account = resp;
          $scope.save($scope.contact);
      };
      
     var params_search_account ={};
     $scope.result = undefined;
     $scope.q = undefined;
     $scope.$watch('searchAccountQuery', function() {
         params_search_account['q'] = $scope.searchAccountQuery;
         gapi.client.crmengine.accounts.search(params_search_account).execute(function(resp) {
            console.log("in accouts.search api");
            console.log(params_search_account);

            console.log(resp);
            if (resp.items){
              $scope.results = resp.items;
              console.log($scope.results);
              $scope.$apply();
            };
            
          });
         console.log($scope.results);
      });
      $scope.selectAccount = function(){
        $scope.contact.account = $scope.searchAccountQuery;

     };


     // Quick Filtering
     var searchParams ={};
     $scope.result = undefined;
     $scope.q = undefined;
     
     $scope.$watch('searchQuery', function() {
         searchParams['q'] = $scope.searchQuery;
         Contact.search($scope,searchParams);
     });
     $scope.selectResult = function(){
          window.location.replace('#/contacts/show/'+$scope.searchQuery.id);
     };
     $scope.executeSearch = function(searchQuery){
        if (typeof(searchQuery)=='string'){
           var goToSearch = 'type:Contact ' + searchQuery;
           window.location.replace('#/search/'+goToSearch);
        }else{
          window.location.replace('#/contacts/show/'+searchQuery.id);
        }
        $scope.searchQuery=' ';
        $scope.$apply();
     };
     // Sorting
     $scope.orderBy = function(order){
        var params = { 'order': order,
                        'limit':8};
        $scope.order = order;
        Contact.list($scope,params);
     };
     $scope.filterByOwner = function(filter){
        if (filter){
          var params = { 'owner': filter,
                         'order': $scope.order, 
                         'limit':8}
        }
        else{
          var params = {
              'order': $scope.order, 
              
              'limit':8}
        };
        $scope.isFiltering = true;
        Contact.list($scope,params);
     };

/***********************************************
      HKA 19.02.2014  tags 
***************************************************************************************/
$scope.listTags=function(){
      var paramsTag = {'about_kind':'Contact'}
      Tag.list($scope,paramsTag);
     };
$scope.edgeInserted = function () {
       $scope.listcontacts();
     };
$scope.listcontacts = function(){
  var params = { 'order': $scope.order,
                        'limit':6}
          Contact.list($scope,params);
};


$scope.addNewtag = function(tag){
       var params = {   
                          'name': tag.name,
                          'about_kind':'Contact',
                          'color':$('#tag-col-pick').val()
                      }  ;
       Tag.insert($scope,params);
        $scope.tag.name='';
        var paramsTag = {'about_kind':'Contact'};
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
         }
         Contact.list($scope,params);

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
    $scope.listcontacts();

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
         //$scope.$apply();
      };
      $scope.dropTag=function(account){
        var items = [];
        
        var edge = {
             'start_node': account.entityKey,
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


app.controller('ContactShowCtrl', ['$scope','$filter','$route','Auth','Email', 'Task','Event','Note','Topic','Contact','Opportunity','Case','Permission','User','Attachement','Map','Opportunitystage','Casestatus','InfoNode',
    function($scope,$filter,$route,Auth,Email,Task,Event,Note,Topic,Contact,Opportunity,Case,Permission,User,Attachement,Map,Opportunitystage,Casestatus,InfoNode) {
 console.log('I am in ContactShowCtrl');
      $("ul.page-sidebar-menu li").removeClass("active");
      $("#id_Contacts").addClass("active");
    
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.isContentLoaded = false;
     $scope.pagination = {};
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.currentPage = 01;
     $scope.pages = [];
     //HKA 10.12.2013 Var topic to manage Next & Prev
     $scope.topicCurrentPage=01;
     $scope.topicpagination={};
     $scope.topicpages = [];
    //HKA 11.12.2013 var Opportunity to manage Next & Prev
     $scope.opppagination = {};
     $scope.oppCurrentPage=01;
     $scope.opppages=[];
     //HKA 11.12.2013 var Case to manage Next & Prev
     $scope.casepagination = {};
     $scope.caseCurrentPage=01;
     $scope.casepages=[];

      $scope.accounts = [];
      $scope.email = {};
      $scope.stage_selected={};
      $scope.status_selected={};
      $scope.infonodes = {};
      
      // What to do after authentication
      $scope.runTheProcess = function(){
          var contactid = {'id':$route.current.params.contactId};
          Contact.get($scope,contactid);
          User.list($scope,{});
          Opportunitystage.list($scope,{});
          Casestatus.list($scope,{});
         
      };
        // We need to call this to refresh token when user credentials are invalid
      $scope.refreshToken = function() {
            Auth.refreshToken();
      };
     //HKA 11.11.2013 
    $scope.TopiclistNextPageItems = function(){
        
         
        var nextPage = $scope.topicCurrentPage + 1;
        var params = {};
          if ($scope.topicpages[nextPage]){
            params = {'about_kind':'Contact',
                      'about_item':$scope.contact.id,
                      'order': '-updated_at',
                      'limit': 5,
                      'pageToken':$scope.topicpages[nextPage]
                     }
          }else{
            params = {'about_kind':'Contact',
                      'about_item':$scope.Contact.id,
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
          if ($scope.topicpages[prevPage]){
            params = {'about_kind':'Contact',
                      'about_item':$scope.contact.id,
                      'order': '-updated_at',
                      'limit': 5,
                      'pageToken':$scope.topicpages[prevPage]
                     }
          }else{
            params = {'about_kind':'Contact',
                      'about_item':$scope.contact.id,
                      'order': '-updated_at',
                      'limit': 5}
          }
          $scope.topicCurrentPage = $scope.topicCurrentPage - 1 ;
          Topic.list($scope,params);
          console.log()
     }
     
     $scope.listTopics = function(contact){
        var params = {'about_kind':'Contact',
                      'about_item':$scope.contact.id,
                      'order': '-updated_at',
                      'limit': 5
                      };
        Topic.list($scope,params);

     };
     //HKA 10.12.2013 Page Prev & Next on List Opportunities
  $scope.OpplistNextPageItems = function(){
        
        
        var nextPage = $scope.oppCurrentPage + 1;
        var params = {};
          if ($scope.opppages[nextPage]){
            params = {'limit':6,
                      'contact':$scope.contact.entityKey,
                      'pageToken':$scope.opppages[nextPage]
                     }
          }else{
            params = {'limit':6,
            'account':$scope.contact.entityKey}
          }
          console.log('in listNextPageItems');
          $scope.oppCurrentPage = $scope.oppCurrentPage + 1 ; 
          Opportunity.list($scope,params);
     };
     $scope.OppPrevPageItems = function(){

       
       var prevPage = $scope.oppCurrentPage - 1;
       var params = {};
          if ($scope.opppages[prevPage]){
            params = {'limit':6,
                      'contact':$scope.contact.entityKey,
                      'pageToken':$scope.opppages[prevPage]
                     }
          }else{
            params = {'limit':6,
                      'contact':$scope.contact.entityKey}
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
                      'contact':$scope.contact.entityKey,
                      'pageToken':$scope.casepages[nextPage]
                     }
          }else{
            params = {'limit':6,
            'account':$scope.contact.entityKey}
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
                      'contact':$scope.contact.entityKey,
                      'pageToken':$scope.casepages[prevPage]
                     }
          }else{
            params = {'limit':6,
                      'contact':$scope.contact.entityKey}
          }
          $scope.caseCurrentPage = $scope.caseCurrentPage - 1 ;
            Case.list($scope,params);
     };


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
     $scope.updateCollaborators = function(){
          var contactid = {'id':$route.current.params.contactId};
          Contact.get($scope,contactid);

     };
      $scope.share = function(slected_memeber){
        console.log('permissions.insert share');
        console.log(slected_memeber);
        $scope.$watch($scope.contact.access, function() {
         var body = {'access':$scope.contact.access};
         var id = $scope.contact.id;
         var params ={'id':id,
                      'access':$scope.contact.access}
         Contact.patch($scope,params);
        });
        $('#sharingSettingsModal').modal('hide');

        if (slected_memeber.email){
        var params = {  'type': 'user',
                        'role': 'writer',
                        'value': slected_memeber.email,
                        'about_kind': 'Contact',
                        'about_item': $scope.contact.id

                        
          };
          Permission.insert($scope,params); 
          
          
        }else{ 
          alert('select a user to be invited');
        };


     };

  $scope.editacontact = function(contact){
    $('#EditContactModal').modal('show');
  }
  //HKA 27.11.2013 Update Contact updatecontact
  $scope.updatecontact = function(contact){
    var params={'id':$scope.contact.id,
                'firstname':contact.firstname,
                'lastname':contact.lastname,
                'title':contact.title};
        Contact.patch($scope,params);
        $('#EditContactModal').modal('hide')

  };
  //HKA 01.12.2013 Edit tagline of Account
    $scope.edittagline = function() {
       $('#EditTagModal').modal('show');
    };
    //HKA 01.12.2013 Edit Introduction on Account
    $scope.editintro = function() {
       $('#EditIntroModal').modal('show');
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
                      'about':$scope.contact.entityKey
            }
            console.log(dueDate);
        }else{
            params ={'title': task.title,
                     'about':$scope.contact.entityKey}
        };
        Task.insert($scope,params);
        $scope.task.title='';
        $scope.task.dueDate='T00:00:00.000000';
     }

     $scope.hilightTask = function(){
        console.log('Should higll');
        $('#task_0').effect("highlight","slow");
        $('#task_0').effect( "bounce", "slow" );
       
     }
     $scope.listTasks = function(){
        var params = {'about':$scope.contact.entityKey,
                      'order': '-updated_at'
                      
                      };
        Task.list($scope,params);

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
                      'about_kind':'Contact',
                      'about_item':$scope.contact.id
              }

            }else{
              params ={'title': ioevent.title,
                      'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'where': ioevent.where,
                      'about_kind':'Contact',
                      'about_item':$scope.contact.id
              }
            }
            console.log('inserting the event');
            console.log(params);
            Event.insert($scope,params);
            $scope.ioevent.title='';
            $scope.ioevent.starts_at='';
            $scope.ioevent.ends_at='';
            $scope.ioevent.where='';

            
        };
     }
     $scope.hilightEvent = function(){
        console.log('Should higll');
        $('#event_0').effect("highlight","slow");
        $('#event_0').effect( "bounce", "slow" );
       
     }
     $scope.listEvents = function(){
        var params = {'about_kind':'Contact',
                      'about_item':$scope.contact.id,
                      'order': 'starts_at',
                      'limit': 5
                      };
        Event.list($scope,params);

     };
  //HKA 02.12.2013 List Opportunities related to Contact
     $scope.listOpportunities = function(){
        var params = {'contact':$scope.contact.entityKey,
                      //'order': '-updated_at',
                      'limit': 6
                      };
        Opportunity.list($scope,params);

     };

  //HKA 02.12.2013 List Cases related to Contact
  $scope.listCases = function(){
    var params ={'contact':$scope.contact.entityKey,
                  //'order':'-creationTime',
                  'limit':6};

    Case.list($scope,params)
  };
     //HKA 11.11.2013 Add Note
  $scope.addNote = function(note){
    var params = {'title':$scope.note.title,
                  'content':$scope.note.content,
                  'about_item':$scope.contact.id,
                  'about_kind':'Contact' };
    Note.insert($scope,params);
    $scope.note.title='';
    $scope.note.content='';

};
//HKA 26.11.2013 Update Case
$scope.updatContactHeader = function(contact){
 
  params = {'id':$scope.contact.id,
             'name':contact.name,
             'priority' :casee.priority,
           'status':casee.status,
           'type_case':casee.type_case};
  Case.patch($scope,params);
 $('#EditCaseModal').modal('hide');
  };


  // HKA 01.12.2013 Show modal Related list (Opportunity)
  $scope.addOppModal = function(){
    $('#addOpportunityModal').modal('show');
  };

  //HKA 01.12.2013 Show modal Related list (Case)
  $scope.addCaseModal = function(){
    $('#addCaseModal').modal('show');
  };
  // HKA 02.12.2013 Add Opportunty related to Contact
    $scope.saveOpp = function(opportunity){
      
      console.log($scope.contact.account);
      console.log(opportunity.amount);
       var params = {'name':opportunity.name,
                      'description':opportunity.description,
                      'amount': opportunity.amount,
                      'stagename':$scope.stage_selected.name,
                      'stage_probability':$scope.stage_selected.probability,
                      'account':$scope.contact.account,
                      'account_name':$scope.contact.account_name,
                      'contact':$scope.contact.entityKey,
                      'contact_name': $scope.contact.firstname+' '+$scope.contact.lastname,
                      'access': $scope.contact.access
                      };
        console.log(params);

      Opportunity.insert($scope,params);
      $('#addOpportunityModal').modal('hide');
    };

  
  // HKA 01.12.2013 Add Case related to Contact
    $scope.saveCase = function(casee){
          
        var params = {'name':casee.name,
                      'priority':casee.priority,
                      'status': $scope.status_selected.status,
                      'type_case':casee.type_case,
                      'account':$scope.contact.account,
                      'account_name':$scope.contact.account_name,
                      'contact':$scope.contact.entityKey,
                      'contact_name': $scope.contact.firstname+' '+$scope.contact.lastname,
                      'access': $scope.contact.access
                      };
      Case.insert($scope,params);
      $('#addCaseModal').modal('hide');
    };

  //HKA 01.12.2013 Add Phone
 $scope.addPhone = function(phone){

  params = {'parent':$scope.contact.entityKey,
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
  $('#phonemodal').modal('hide');
  $scope.phone={};
  };
$scope.listInfonodes = function(kind) {
    console.log($scope.contact.entityKey);
     params = {'parent':$scope.contact.entityKey,
               'connections': kind
              };
     InfoNode.list($scope,params);
 }

//HKA 20.11.2013 Add Email
$scope.addEmail = function(email){
  var emailsArray = undefined;
  
   params = {'parent':$scope.contact.entityKey,
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
  params = {'parent':$scope.contact.entityKey,
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
  params = {'parent':$scope.contact.entityKey,
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
  params = {'parent':$scope.contact.entityKey,
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

//HKA 01.12.2013 Add Tagline
$scope.updateTagline = function(contact){
 
  params = {'id':$scope.contact.id,
             'tagline':contact.tagline}
  Contact.patch($scope,params);
  $('#EditTagModal').modal('hide');
};

//HKA 01.12.2013 Add Introduction
$scope.updateintro = function(contact){
 
  params = {'id':$scope.contact.id,
             'introduction':contact.introduction}
  Contact.patch($scope,params);
  $('#EditIntroModal').modal('hide');
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
                  'about_item':$scope.contact.id,
                  'about_kind':'Contact' };
        
        Email.send($scope,params);
      };
      $scope.editbeforedelete = function(){
     $('#BeforedeleteContact').modal('show');
   };
   $scope.deletecontact = function(){
     var contactid = {'id':$route.current.params.contactId};
     Contact.delete($scope,contactid);
     $('#BeforedeleteContact').modal('hide');
     };
     $scope.listDocuments = function(){
        var params = {'about_kind':'Contact',
                      'about_item':$scope.contact.id,
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
        var params = {'about_kind':'Contact',
                      'about_item': $scope.contact.id,
                      'title':newdocument.title,
                      'mimeType':mimeType };
        Attachement.insert($scope,params);

     };
     $scope.createPickerUploader = function() {
          var projectfolder = $scope.contact.folder;
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
                var params = {'about_kind': 'Contact',
                                      'about_item':$scope.contact.id};
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
     $scope.renderMaps = function(){
       
          $scope.addresses = $scope.contact.addresses;
          Map.render($scope);
      };
      $scope.addAddress = function(address){
        var addressArray = undefined;
        if ($scope.contact.addresses){
          addressArray = new Array();
          addressArray = $scope.contact.addresses;
          addressArray.push(address);

        }else{ 
          addressArray = address;
        }
        Map.searchLocation($scope,address);

        $('#addressmodal').modal('hide');
        $scope.address={};
      };
      $scope.locationUpdated = function(addressArray){

          var params = {'id':$scope.contact.id,
                         'addresses':addressArray};
          Contact.patch($scope,params);
      };
       $scope.addGeo = function(address){
          params = {'parent':$scope.contact.entityKey,
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
            params = {'parent':$scope.contact.entityKey,
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
     // Google+ Authentication 
     Auth.init($scope);
}]);

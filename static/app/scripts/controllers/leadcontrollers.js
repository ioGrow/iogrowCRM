app.controller('LeadListCtrl', ['$scope','Auth','Lead','Leadstatus',
    function($scope,Auth,Lead,Leadstatus) {
      $("#id_Leads").addClass("active");
      
      console.log('i am in lead list controller');
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
      $scope.status = 'new';

      // What to do after authentication
       $scope.runTheProcess = function(){
            var params = {'order' : $scope.order,'limit':7};
            Lead.list($scope,params);
            Leadstatus.list($scope,{});


       };
        // We need to call this to refresh token when user credentials are invalid
       $scope.refreshToken = function() {
            Auth.refreshToken();
       };
     $scope.listNextPageItems = function(){
        
        
        var nextPage = $scope.currentPage + 1;
        var params = {};
          if ($scope.pages[nextPage]){
            params = {'order' : $scope.order,'limit':7,
                      'pageToken':$scope.pages[nextPage]
                     }
          }else{
            params = {'order' : $scope.order,'limit':7}
          }
          console.log('in listNextPageItems');
          $scope.currentPage = $scope.currentPage + 1 ; 
          Lead.list($scope,params);
     }
     $scope.listPrevPageItems = function(){
       
       var prevPage = $scope.currentPage - 1;
       var params = {};
          if ($scope.pages[prevPage]){
            params = {'order' : $scope.order,'limit':7,
                      'pageToken':$scope.pages[prevPage]
                     }
          }else{
            params = {'order' : $scope.order,'limit':7}
          }
          $scope.currentPage = $scope.currentPage - 1 ;
          Lead.list($scope,params);
     }
    
      // new Lead
      $scope.showModal = function(){
        $('#addLeadModal').modal('show');

      };

      
    
      $scope.save = function(lead){
        var params ={'firstname':lead.firstname,
                      'lastname':lead.lastname,
                      'company':lead.company,
                      'title':lead.title,
                      'status':$scope.stage_selected.status};
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
                        'limit':7};
        $scope.order = order;
        Lead.list($scope,params);
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
        Lead.list($scope,params);
     };
     $scope.filterByStatus = function(filter){
        if (filter){
          var params = { 'status': filter,
                         'order': $scope.order, 
                         'limit':7}
        }
        else{
          var params = {
              'order': $scope.order, 
              
              'limit':7}
        };
        
        Lead.list($scope,params);
     };

     
   // Google+ Authentication 
     Auth.init($scope);

      
}]);
app.controller('LeadShowCtrl', ['$scope','$filter','$route','Auth','Email', 'Task','Event','Topic','Note','Lead','Permission','User','Leadstatus','Attachement',
    function($scope,$filter,$route,Auth,Email,Task,Event,Topic,Note,Lead,Permission,User,Leadstatus,Attachement) {
      $("#id_Leads").addClass("active");
      
      var tab = $route.current.params.accountTab;
      switch (tab)
        {
        case 'notes':
         $scope.selectedTab = 1;
          break;
        case 'about':
         $scope.selectedTab = 2;
          break;
        case 'leads':
         $scope.selectedTab = 3;
          break;
        case 'opportunities':
         $scope.selectedTab = 4;
          break;
        case 'cases':
         $scope.selectedTab = 5;
          break;
        default:
        $scope.selectedTab = 1;

        }
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

      // What to do after authentication
      $scope.runTheProcess = function(){
            var leadid = {'id':$route.current.params.leadId};
            Lead.get($scope,leadid);
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
            params = {'about_kind':'Lead',
                      'about_item':$scope.lead.id,
                      'order': '-updated_at',
                      'limit': 5,
                      'pageToken':$scope.topicpages[nextPage]
                     }
          }else{
            params = {'about_kind':'Lead',
                      'about_item':$scope.lead.id,
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
            params = {'about_kind':'Lead',
                      'about_item':$scope.lead.id,
                      'order': '-updated_at',
                      'limit': 5,
                      'pageToken':$scope.topicpages[prevPage]
                     }
          }else{
            params = {'about_kind':'Lead',
                      'about_item':$scope.lead.id,
                      'order': '-updated_at',
                      'limit': 5}
          }
          $scope.topicCurrentPage = $scope.topicCurrentPage - 1 ;
          Topic.list($scope,params);
          
     }
    
     $scope.listTopics = function(lead){
        var params = {'about_kind':'Lead',
                      'about_item':$scope.lead.id,
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
        $scope.$watch($scope.lead.access, function() {
         var body = {'access':$scope.lead.access};
         var id = $scope.account.id;
         var params ={'id':id,
                      'access':$scope.lead.access}
         Lead.patch($scope,params);
        });
        $('#sharingSettingsModal').modal('hide');

        if (slected_memeber.email){
        var params = {  'type': 'user',
                        'role': 'writer',
                        'value': slected_memeber.email,
                        'about_kind': 'Lead',
                        'about_item': $scope.lead.id

                        
          };
          Permission.insert($scope,params); 
          
          
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
        var params ={}

        console.log('adding a new task');
        console.log(task);
        
        if (task.due){

            var dueDate= $filter('date')(task.due,['yyyy-MM-dd']);
            dueDate = dueDate +'T00:00:00.000000'
            params ={'title': task.title,
                      'due': dueDate,
                      'about_kind':'Lead',
                     'about_item':$scope.lead.id
            }
            console.log(dueDate);
        }else{
            params ={'title': task.title,
                     'about_kind':'Lead',
                     'about_item':$scope.lead.id}
        };
        Task.insert($scope,params);
     }

     $scope.hilightTask = function(){
        console.log('Should higll');
        $('#task_0').effect("highlight","slow");
        $('#task_0').effect( "bounce", "slow" );
       
     }
     $scope.listTasks = function(){
        var params = {'about_kind':'Lead',
                      'about_item':$scope.lead.id,
                      'order': '-updated_at',
                      'limit': 5
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
                      'about_kind':'Lead',
                      'about_item':$scope.lead.id
              }

            }else{
              params ={'title': ioevent.title,
                      'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'where': ioevent.where,
                      'about_kind':'Lead',
                      'about_item':$scope.lead.id
              }
            }
            console.log('inserting the event');
            console.log(params);
            Event.insert($scope,params);

            
        };
     }
     $scope.hilightEvent = function(){
        console.log('Should higll');
        $('#event_0').effect("highlight","slow");
        $('#event_0').effect( "bounce", "slow" );
       
     }
     $scope.listEvents = function(){
        var params = {'about_kind':'Lead',
                      'about_item':$scope.lead.id,
                      'order': 'starts_at',
                      'limit': 5
                      };
        Event.list($scope,params);

     }
  //HKA 11.11.2013 Add Note
  $scope.addNote = function(note){
    var params = {'title':$scope.note.title,
                  'content':$scope.note.content,
                  'about_item':$scope.lead.id,
                  'about_kind':'Lead' };
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
                'status':$scope.status_selected.status};
        Lead.patch($scope,params);
        $('#EditLeadModal').modal('hide')

  };

   
//HKA 01.12.2013 Add Phone
 $scope.addPhone = function(phone){
  //HKA 01.12.2013  Concatenate old phones with new phone
  var phonesArray = undefined;
  
  if ($scope.lead.phones){
    phonesArray = new Array();
    phonesArray = $scope.lead.phones;
    phonesArray.push(phone);
  }else{
    phonesArray = phone;
  }

  params = {'id':$scope.lead.id,
            'phones':phonesArray
            };
  Lead.patch($scope,params);
  $('#phonemodal').modal('hide');
  };

//HKA 01.12.2013 Add Email
$scope.addEmail = function(email){
  var emailsArray = undefined;
  
  if ($scope.lead.emails){
    emailsArray = new Array();
    emailsArray = $scope.lead.emails;
    emailsArray.push(email);
  }else{
    emailsArray = email;
  }

  params = {'id':$scope.lead.id,
            'emails':emailsArray
            };
  Lead.patch($scope,params);
  $('#emailmodal').modal('hide');

  };
  
//HKA 01.12.2013 Add Addresse
$scope.addAddress = function(address){
  var addressArray = undefined;
  if ($scope.lead.addresses){
    addressArray = new Array();
    addressArray = $scope.lead.addresses;
    addressArray.push(address);

  }else{ 
    addressArray = address;
  }
  params = {'id':$scope.lead.id,
             'addresses':addressArray}
  Lead.patch($scope,params);
  $('#addressmodal').modal('hide');
};

//HKA 01.12.2013 Add Website
$scope.addWebsite = function(website){
  var websiteArray = undefined;
  if ($scope.lead.websites){
    websiteArray = new Array();
    websiteArray = $scope.lead.websites;
    websiteArray.push(website);

  }else{ 
    websiteArray = website;
  }
  params = {'id':$scope.lead.id,
             'websites':websiteArray}
  Lead.patch($scope,params);
  $('#websitemodal').modal('hide');
};

//HKA 01.12.2013 Add Social
$scope.addSocial = function(social){
  var socialArray = undefined;
  if ($scope.lead.sociallinks){
    socialArray = new Array();
    socialArray = $scope.lead.sociallinks;
    socialArray.push(social);

  }else{ 
    socialArray = social;
  }
  params = {'id':$scope.lead.id,
             'sociallinks':socialArray}
  Lead.patch($scope,params);
  $('#socialmodal').modal('hide');
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
     var leadid = {'id':$route.current.params.leadId};
     Lead.delete($scope,leadid);
     $('#BeforedeleteLead').modal('hide');
     };

     $scope.listDocuments = function(){
        var params = {'about_kind':'Lead',
                      'about_item':$scope.lead.id,
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
        var params = {'about_kind':'Lead',
                      'about_item': $scope.lead.id,
                      'title':newdocument.title,
                      'mimeType':mimeType };
        Attachement.insert($scope,params);

     };
     $scope.createPickerUploader = function() {
          var projectfolder = $scope.lead.folder;
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
                var params = {'about_kind': 'Lead',
                                      'about_item':$scope.lead.id};
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
      
    // Google+ Authentication 
     Auth.init($scope);

}]);

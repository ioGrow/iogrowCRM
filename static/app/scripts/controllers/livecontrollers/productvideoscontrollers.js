app.controller('ProductVideoListCtrl', ['$scope','$filter','Auth','Show',
    function($scope,$filter,Auth,Show) {
     $("#id_Product_videos").addClass("active");
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
   
     
     

      // What to do after authentication
     $scope.runTheProcess = function(){
          var params = {'limit':7,
                        'type_show':'Product_Video'};
          Show.list($scope,params);
          
     };
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
            Auth.refreshToken();
     };


     $scope.listNextPageItems = function(){
        
        
        var nextPage = $scope.currentPage + 1;
        var params = {};
          if ($scope.pages[nextPage]){
            params = {'limit':7,
                       'type_show':'Product_Video',
                      'pageToken':$scope.pages[nextPage]
                     }
          }else{
            params = {'limit':7,'type_show':'Product_Video'}
          }
          console.log('in listNextPageItems');
          $scope.currentPage = $scope.currentPage + 1 ; 
          Show.list($scope,params);
     }
     $scope.listPrevPageItems = function(){
       
       var prevPage = $scope.currentPage - 1;
       var params = {};
          if ($scope.pages[prevPage]){
            params = {'limit':7,
                       'type_show':'Product_Video',
                      'pageToken':$scope.pages[prevPage]
                     }
          }else{
            params = {'limit':7,'type_show':'Product_Video'}
          }
          $scope.currentPage = $scope.currentPage - 1 ;
          Show.list($scope,params);
     }
      $scope.scheduleShow = function(ioevent){
      
        $('#newShowModal').modal('hide');
        var params ={}

      
        var tagsplit = ioevent.tags.split(' ');

        var tags = [];
        for (i=0; i<tagsplit.length; i++){
        
            tags.push(tagsplit[i]);
      
        }

       params ={'name': ioevent.name,
                'type_show': 'Product_Video',
                'is_published': true,
                'tags': tags
              }
        
        
                   console.log('inserting the show');
            console.log(params);
            Show.insert($scope,params);

            
        };
   
     

     $scope.showModal = function(){
        console.log('button clicked');
        $('#newShowModal').modal('show');

      };
      
    
     
     
   // Google+ Authentication 
    Auth.init($scope);
      
    
     
     
   // Google+ Authentication 
    Auth.init($scope);

    
}]);

app.controller('ProductVideoShowCtrl', ['$scope','$filter', '$route','Auth','Show', 'Topic','Note','Task','Event','WhoHasAccess','User','Leadstatus','Lead','Permission','Attachement','Feedback',
    function($scope,$filter,$route,Auth,Show,Topic,Note,Task,Event,WhoHasAccess,User,Leadstatus,Lead,Permission,Attachement,Feedback) {
      
      $("#id_Product_videos").addClass("active");
       var tab = $route.current.params.accountTab;
      switch (tab)
        {
        case 'notes':
         $scope.selectedTab = 1;
          break;
        case 'about':
         $scope.selectedTab = 2;
          break;
        case 'Feedbacks':
         $scope.selectedTab = 3;
          break;
        case 'Leads':
         $scope.selectedTab = 4;
          break;
        case 'Documents':
         $scope.selectedTab = 5;
          break;
        default:
        $scope.selectedTab = 2;

        }

     
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
    //HKA 22.12.2013 Var topic to manage Next & Prev
      $scope.topicCurrentPage=01;
      $scope.topicpagination={};
      $scope.topicpages = [];
      $scope.stage_selected={};
      $scope.leadpagination = {};
     
      $scope.pages = [];
      $scope.users = [];
      $scope.user = undefined;
      $scope.slected_memeber = undefined;
      $scope.show = {};
      $scope.show.edited_youtube_url = undefined;
      $scope.list_of_string = [];
      $scope.select2Options = {
          
          'multiple': true,
          'simple_tags': true,
          'tags': ['grow'],
          'tokenSeparators': [",", " " ,"#"]
      };
      $scope.feedback = {};

     
     // What to do after authentication
     $scope.runTheProcess = function(){
          var params = {'id':$route.current.params.productId};
          Show.get($scope,params);
          Leadstatus.list($scope,{});
          User.list($scope,{});
     };
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
            Auth.refreshToken();
     };

     
     
     $scope.addTask = function(task){
      
        $('#myModal').modal('hide');
        var params ={'about_kind':'Show',
                      'about_item':$scope.show.id}

       
        
        if (task.due){

            var dueDate= $filter('date')(task.due,['yyyy-MM-dd']);
            dueDate = dueDate +'T00:00:00.000000'
            params ={'title': task.title,
                      'due': dueDate,
                      'about_kind':'Show',
                      'about_item':$scope.show.id
            }
            console.log(dueDate);
        }else{
            params ={'title': task.title,
                      'about_kind':'Show',
                      'about_item':$scope.show.id}
        };
        Task.insert($scope,params);
     }

     $scope.hilightTask = function(){
        console.log('Should higll');
        $('#task_0').effect("highlight","slow");
        $('#task_0').effect( "bounce", "slow" );
       
     }
     $scope.listTasks = function(){
        var params = {'about_kind':'Show',
                      'about_item':$scope.show.id,
                      'order': '-updated_at',
                      'limit': 5
                      };
        Task.list($scope,params);

     }
     $scope.addEvent = function(ioevent){
      
        $('#newEventModal').modal('hide');
        var params ={}

        console.log('adding a new event');
        
        
        if (ioevent.starts_at){
            if (ioevent.ends_at){
              params ={'title': ioevent.title,
                      'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'ends_at': $filter('date')(ioevent.ends_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'where': ioevent.where,
                      'about_kind':'Show',
                      'about_item':$scope.show.id
              }

            }else{
              params ={'title': task.title,
                      'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'where': ioevent.where,
                      'about_kind':'Show',
                      'about_item':$scope.show.id
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
        var params = {'about_kind':'Show',
                      'about_item':$scope.show.id,
                      'order': 'starts_at',
                      'limit': 5
                      };
        Event.list($scope,params);

     }

     
     $scope.TopiclistNextPageItems = function(){
        
        
       var nextPage = $scope.topicCurrentPage + 1;
        var params = {};
           if ($scope.topicpages[nextPage]){
            params = {'about_kind':'Show',
                      'about_item':$scope.show.id,
                      'order': '-updated_at',
                      'limit': 5,
                      'pageToken':$scope.topicpages[nextPage]
                     }
          }else{
            params = {'about_kind':'Show',
                      'about_item':$scope.show.id,
                      'order': '-updated_at',
                      'limit': 5}
          }
          
          $scope.topicCurrentPage = $scope.topicCurrentPage + 1 ;  
          Topic.list($scope,params);
     }
     $scope.TopiclistPrevPageItems = function(){
       
       var prevPage = $scope.topicCurrentPage - 1;
       var params = {};
          if ($scope.topicpages[prevPage]){
            params = {'about_kind':'Show',
                      'about_item':$scope.show.id,
                      'order': '-updated_at',
                      'limit': 5,
                      'pageToken':$scope.topicpages[prevPage]
                     }
          }else{
            params = {'about_kind':'Show',
                      'about_item':$scope.show.id,
                      'order': '-updated_at',
                      'limit': 5}
          }
          $scope.topicCurrentPage = $scope.topicCurrentPage - 1 ;
          Topic.list($scope,params);
         
     }
     
     $scope.listTopics = function(show){
        var params = {'about_kind':'Show',
                      'about_item':$scope.show.id,
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

         
    $scope.addNote = function(note){
      console.log('debug addNote');
      
      var params ={
                  'about_kind': 'Show',
                  'about_item': $scope.show.id,
                  'title': note.title,
                  'content': note.content
      };
      console.log(params);
      Note.insert($scope,params);
      $scope.note.title = '';
      $scope.note.content = '';
    };
      


/************************HKA 24.12.2013 Edit show *****************************************/
    $scope.editshowdetail = function() {
       if ($scope.show.youtube_url){
          $scope.show.edited_youtube_url = 'http://www.youtube.com/watch?v=' + $scope.show.youtube_url;
       }
       $('#EditShowModal').modal('show');
    };
    $scope.saveshow = function(show){
      if (show.edited_youtube_url){
        var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        var match = show.edited_youtube_url.match(regExp);
        if (match&&match[2].length==11){
            console.log(match);
            var params = {'id':show.id,
                          'name':show.name,
                          'youtube_url':match[2],
                         'is_published':show.is_published,};
            Show.patch($scope,params);
        }else{
          console.log('invalid');
          alert('invalid url');
            //error
        };
      }
      else{
            var params = {'id':show.id,
                          'name':show.name,
                          'is_published':show.is_published,};
            Show.patch($scope,params);
      };
      
   $('#EditShowModal').modal('hide');
    };
     $scope.saveshowispublished = function(show){
      var params = {'id':show.id,'is_published':show.is_published};
     Show.patch($scope,params);

     };
  //HKA 24.12.2013 Add youtube Url
      $scope.edityoutubeurl = function(){
        if ($scope.show.youtube_url){
          $scope.show.edited_youtube_url = 'http://www.youtube.com/watch?v=' + $scope.show.youtube_url;
       };
        $('#AddYoutubeUrl').modal('show');
      };
      $scope.saveyoutubeurl = function(show){
        if (show.edited_youtube_url){
          var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        var match = show.edited_youtube_url.match(regExp);
        if (match&&match[2].length==11){
            console.log(match);
            var params = {'id':$scope.show.id,
                'youtube_url':match[2]};
                console.log()
            Show.patch($scope,params);
        }else{
          console.log('invalid');
          alert('invalid url');
            //error
        };
          
        }
        
        $('#AddYoutubeUrl').modal('hide');
          };

     $scope.createYoutubePicker = function() {
          console.log('ok should create youtube picker');
           $('#AddYoutubeUrl').modal('hide');
          var picker = new google.picker.PickerBuilder().
          addView(google.picker.ViewId.YOUTUBE).
          setCallback($scope.youtubeCallback).
         
          build();
          picker.setVisible(true);
      };
      $scope.youtubeCallback = function(data){
          if (data.docs){
              var params = {'id':$scope.show.id,
                            'youtube_url':data.docs[0].id
              };
              Show.patch($scope,params);
          };
           
      };

 //HKA 24.12.2013 Share the show
     $scope.selectMember = function(){
        console.log('slecting user yeaaah');
        $scope.slected_memeber = $scope.user;
        $scope.user = $scope.slected_memeber.google_display_name;

     };
     $scope.share = function(slected_memeber){
        console.log('permissions.insert share');
        console.log(slected_memeber);
        $scope.$watch($scope.show.access, function() {
         var body = {'access':$scope.show.access};
         var id = $scope.show.id;
         var params ={'id':id,
                      'access':$scope.show.access}
         Show.patch($scope,params);
        });
        $('#sharingSettingsModal').modal('hide');

        if (slected_memeber.email){
        var params = {  'type': 'user',
                        'role': 'writer',
                        'value': slected_memeber.email,
                        'about_kind': 'Show',
                        'about_item': $scope.show.id

                        
          };
          Permission.insert($scope,params); 
          
          
        }else{ 
          alert('select a user to be invited');
        };


     };
     
     $scope.updateCollaborators = function(){
          var showid = {'id':$route.current.params.showId};
          Show.get($scope,showid);

     };
     $scope.showModal = function(){
        console.log('button clicked');
        $('#addAccountModal').modal('show');

      };

      $scope.editwhen = function(show){
       

        $('#Editwhen').modal('show');
      };
      $scope.saveModifTime = function(show){

        var starts_at = $filter('date')(show.starts_at,['yyyy-MM-ddTHH:mm:00.000000']);
         var ends_at = $filter('date')(show.ends_at,['yyyy-MM-ddTHH:mm:00.000000']);
        
       var  params ={'id':$scope.show.id,
                     'starts_at':starts_at,
                    'ends_at':ends_at};
          Show.patch($scope,params);
         $('#Editwhen').modal('hide');
      };

 $scope.editdescription = function(){
  $('#EditShowDescription').modal('show');
}
  
 $scope.updateDescription = function(show){
  var params = {'id':show.id,
    'description':show.description};
    Show.patch($scope,params);
   $('#EditShowDescription').modal('hide');
 };

//HKA 23.12.2013 Add a new lead to the Show
 $scope.AddleadModal = function(){
  $('#addLeadShow').modal('show');
 };

$scope.savelead = function(lead){
        var params ={'firstname':lead.firstname,
                      'lastname':lead.lastname,
                      'company':lead.company,
                      'title':lead.title,
                      'show':$scope.show.entityKey,
                      'show_name':$scope.show.name,
                      'status':$scope.stage_selected.status};
        Lead.insert($scope,params);
        $('#addLeadShow').modal('hide')
      };
$scope.addLeadOnKey = function(lead){
        if(event.keyCode == 13 && lead){
            $scope.save(lead);
        }
      };
$scope.listLead = function(){
  var params = {'show':$scope.show.entityKey,
                 'limit':5};
  Lead.list($scope,params);
};
$scope.editbeforedelete = function(){
 
  $('#BeforedeleteShow').modal('show');

};
$scope.deleteshow = function(){
 console.log($scope.show.id);
  var productid = {'id':$route.current.params.productId};
 
  Show.delete($scope,productid);
  window.location.replace('#/live/product_videos');
  $('#BeforedeleteShow').modal('hide');
 
      
};

//HKA 29.12.2013 Add Feedback to Show
$scope.showfeedback = function(){
  $scope.feedback.type_feedback = 'Questions Q/A';
  $scope.feedback.source = 'Email';
  $scope.feedback.status = 'Pending';
  $('#addFeedModal').modal('show');
};
$scope.savefeedback = function(feedback){
  var params ={'name':feedback.name,
                'content':feedback.content,
                'related_to':$scope.show.entityKey,
                'type_feedback':feedback.type_feedback,
                'source':feedback.source,
                'access':feedback.access,
                'status':feedback.status}
    Feedback.insert($scope,params);
    $('#addFeedModal').modal('hide');
};
$scope.listFeedbacks = function(){
  var params = {'related_to':$scope.show.entityKey};
  Feedback.list($scope,params);

};

//HKA 25.12.2013 Attach Document 
$scope.createDocument = function(newdocument){
        var mimeType = 'application/vnd.google-apps.' + $scope.mimeType;
        var params = {'about_kind':'Show',
                      'about_item': $scope.show.id,
                      'title':newdocument.title,
                      'mimeType':mimeType };
        Attachement.insert($scope,params);

     };
$scope.showCreateDocument = function(type){
        
        $scope.mimeType = type;
        $('#newDocument').modal('show');
     };
$scope.createPickerUploader = function() {
          var projectfolder = $scope.show.folder;
          var picker = new google.picker.PickerBuilder().
              addView(new google.picker.DocsUploadView().setParent(projectfolder)).
              setCallback($scope.uploaderCallback).
              setAppId(12345).
                enableFeature(google.picker.Feature.MULTISELECT_ENABLED).
              build();
          picker.setVisible(true);
      };
// A simple callback implementation.
      $scope.uploaderCallback = function(data) {
        

        if (data.action == google.picker.Action.PICKED) {
                var params = {'about_kind': 'Show',
                                      'about_item':$scope.show.id};
                params.items = new Array();
               
                 $.each(data.docs, function(index) {
                      console.log(data.docs);
                      
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
$scope.listDocuments = function(){
        var params = {'about_kind':'Show',
                      'about_item':$scope.show.id,
                      'order': '-updated_at',
                      'limit': 5
                      };
        Attachement.list($scope,params);

     };

      
// Google+ Authentication 
    Auth.init($scope);


}]);
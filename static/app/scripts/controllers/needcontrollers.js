app.controller('NeedShowCtrl', ['$scope','$filter', '$route','Auth','Need', 'Topic','Note','Task','Event','Permission','User','Email','Attachement',
    function($scope,$filter,$route,Auth,Need,Topic,Note,Task,Event,Permission,User,Email,Attachement) {
      console.log('i am in account list controller');
     
      
     $scope.selectedTab = 1;
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
      //HKA 10.12.2013 Var topic to manage Next & Prev
     $scope.topicCurrentPage=01;
     $scope.topicpagination={};
     $scope.topicpages = [];
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.status_selected={};
     $scope.currentPage = 01;
     $scope.pages = [];
     
     $scope.users = [];
     $scope.user = undefined;
     $scope.slected_memeber = undefined;
     $scope.email = {};
     
   
     // What to do after authentication
       $scope.runTheProcess = function(){
          var needid = {'id':$route.current.params.needId};
          Need.get($scope,needid);
          User.list($scope,{});
         
       };
        // We need to call this to refresh token when user credentials are invalid
       $scope.refreshToken = function() {
            Auth.refreshToken();
       };
     $scope.TopiclistNextPageItems = function(){
         
        
        var nextPage = $scope.topicCurrentPage + 1;
        var params = {};
          if ($scope.topicpages[nextPage]){
            params = {'about_kind':'Need',
                      'about_item':$scope.need.id,
                      'order': '-updated_at',
                      'limit': 5,
                      'pageToken':$scope.topicpages[nextPage]
                     }
          }else{
            params = {'about_kind':'Need',
                      'about_item':$scope.need.id,
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
            params = {'about_kind':'Need',
                      'about_item':$scope.need.id,
                      'order': '-updated_at',
                      'limit': 5,
                      'pageToken':$scope.topicpages[prevPage]
                     }
          }else{
            params = {'about_kind':'Need',
                      'about_item':$scope.need.id,
                      'order': '-updated_at',
                      'limit': 5}
          }
          $scope.topicCurrentPage = $scope.topicCurrentPage - 1 ;
          Topic.list($scope,params);
          
     }
    
     $scope.listTopics = function(need){
        var params = {'about_kind':'Need',
                      'about_item':$scope.need.id,
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
        $scope.$watch($scope.need.access, function() {
         var body = {'access':$scope.need.access};
         var id = $scope.account.id;
         var params ={'id':id,
                      'access':$scope.need.access};
          console.log('patching');
          console.log(params);
         Case.patch($scope,params);
        });
        $('#sharingSettingsModal').modal('hide');

        if (slected_memeber.email){
        var params = {  'type': 'user',
                        'role': 'writer',
                        'value': slected_memeber.email,
                        'about_kind': 'Need',
                        'about_item': $scope.account.id

                        
          };
          Permission.insert($scope,params); 
          
          
        }else{ 
          alert('select a user to be invited');
        };


     };
     
     $scope.updateCollaborators = function(){
         
          Case.get($scope,$scope.case.id);

     };
     $scope.showModal = function(){
        console.log('button clicked');
        $('#addCaseModal').modal('show');

      };
      
    $scope.addNote = function(note){
      console.log('debug addNote');
      
      var params ={
                  'about_kind': 'Need',
                  'about_item': $scope.need.id,
                  'title': note.title,
                  'content': note.content
      };
      console.log(params);
      Note.insert($scope,params);
      $scope.note.title = '';
      $scope.note.content = '';
    };
      



    $scope.editcase = function() {
       $('#EditCaseModal').modal('show');
    }
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
                      'about_kind':'Need',
                     'about_item':$scope.need.id
            }
            console.log(dueDate);
        }else{
            params ={'title': task.title,
                     'about_kind':'Need',
                     'about_item':$scope.need.id}
        };
        Task.insert($scope,params);
     }

     $scope.hilightTask = function(){
        console.log('Should higll');
        $('#task_0').effect("highlight","slow");
        $('#task_0').effect( "bounce", "slow" );
       
     }
     $scope.listTasks = function(){
        var params = {'about_kind':'Case',
                      'about_item':$scope.need.id,
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
                      'about_kind':'Case',
                      'about_item':$scope.need.id
              }

            }else{
              params ={'title': ioevent.title,
                      'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'where': ioevent.where,
                      'about_kind':'Need',
                      'about_item':$scope.need.id
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
        var params = {'about_kind':'Need',
                      'about_item':$scope.need.id,
                      'order': 'starts_at',
                      'limit': 5
                      };
        Event.list($scope,params);

     }
  //HKA 11.11.2013 Add Note
  $scope.addNote = function(note){
    var params = {'title':$scope.note.title,
                  'content':$scope.note.content,
                  'about_item':$scope.need.id,
                  'about_kind':'Need' };
    Note.insert($scope,params);
    $scope.note.title='';
    $scope.note.content='';
  }

//HKA 22.11.2013 Update Case
$scope.updatCasetHeader = function(need){
 
  params = {'id':$scope.need.id,
             'name':need.name,
             'priority' :need.priority,
           'status':$scope.status_selected.status,
           'type_case':need.type_case}
  Case.patch($scope,params);
  $scope.$watch($scope.need.priority, function() {
      var paramsNote = {
                  'about_kind': 'Case',
                  'about_item': $scope.need.id,
                  'title': 'status updated to '+ need.priority
                  
      };
      console.log('inserting a new note');
      console.log(paramsNote);
      
      Note.insert($scope,paramsNote);
   });
  
 $('#EditCaseModal').modal('hide');
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

                  'about_item':$scope.need.id,
                  'about_kind':'Case' };
        
        Email.send($scope,params);
      };


//HKA 29.12.2013 Delet Case
 $scope.editbeforedelete = function(){
     $('#BeforedeleteCase').modal('show');
   };
$scope.deletecase = function(){
     var caseid = {'id':$route.current.params.caseId};
     Case.delete($scope,caseid);
     $('#BeforedeleteCase').modal('hide');
     };

     $scope.listDocuments = function(){
        var params = {'about_kind':'Case',
                      'about_item':$scope.need.id,
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
        var params = {'about_kind':'Need',
                      'about_item': $scope.need.id,
                      'title':newdocument.title,
                      'mimeType':mimeType };
        Attachement.insert($scope,params);

     };
     $scope.createPickerUploader = function() {
          var projectfolder = $scope.need.folder;
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
                var params = {'about_kind': 'Need',
                                      'about_item':$scope.need.id};
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

      

     // Google+ Authentication 
     Auth.init($scope);

}]);
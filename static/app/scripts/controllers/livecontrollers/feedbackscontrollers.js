app.controller('FeedBacksListCtrl', ['$scope','$filter','Auth','Feedback',
    function($scope,$filter,Auth,Feedback) {
     $("#id_Feedbacks").addClass("active");
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
     $scope.feedback = {};
    
         

     // What to do after authentication
     $scope.runTheProcess = function(){
          var params = {'limit':7};
          Feedback.list($scope,params);
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
                      'pageToken':$scope.pages[nextPage]
                     }
          }else{
            params = {'limit':7}
          }
          console.log('in listNextPageItems');
          $scope.currentPage = $scope.currentPage + 1 ; 
          Feedback.list($scope,params);
     }
     $scope.listPrevPageItems = function(){
       
       var prevPage = $scope.currentPage - 1;
       var params = {};
          if ($scope.pages[prevPage]){
            params = {'limit':7,
                      'pageToken':$scope.pages[prevPage]
                     }
          }else{
            params = {'limit':7}
          }
          $scope.currentPage = $scope.currentPage - 1 ;
          Feedback.list($scope,params);
     }
      
     

     $scope.showFeedbackModal = function(){
        console.log('button clicked');
       $scope.feedback.type_feedback = 'Questions Q/A';
       $scope.feedback.source = 'Email';
       $scope.feedback.status = 'Pending';
        $('#addFeedModal').modal('show');

      };
      /*$scope.addFeedbackOnKey = function(feedback){
        if(event.keyCode == 13 && feedback){
            $scope.savefeedback(feedback);
        };
     };*/
     // inserting the feedback  
     $scope.savefeedback = function(feedback){
         
            var params ={'name':feedback.name,
                         'content':feedback.content,
                         'type_feedback':feedback.type_feedback,
                         'source':feedback.source,
                         'access':feedback.access,
                         'status':feedback.status}
             Feedback.insert($scope,params);
             $('#addFeedModal').modal('hide');
            };
    

      

     
     
   // Google+ Authentication 
    Auth.init($scope);

    
}]);

app.controller('FeedBacksShowCtrl', ['$scope','$filter', '$route','Auth','Show', 'Topic','Note','Task','Permission','User','Feedback','Leadstatus','Lead','Attachement','Email',
    function($scope,$filter,$route,Auth,Show,Topic,Note,Task,Permission,User,Feedback,Leadstatus,Lead,Attachement,Email) {
      
      $("#id_Feedbacks").addClass("active");
      var tab = $route.current.params.accountTab;
      switch (tab)
        {
        case 'notes':
         $scope.selectedTab = 1;
          break;
        case 'about':
         $scope.selectedTab = 2;
          break;
        case 'contacts':
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

     
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.feedback={};
     $scope.currentPage = 01;
     $scope.pages = [];
     //HKA 22.12.2013 Var topic to manage Next & Prev
      $scope.topicCurrentPage=01;
      $scope.topicpagination={};
      $scope.topicpages = [];
      $scope.stage_selected={};
      $scope.leadpagination = {};
      $scope.email = {};
     
   
     
     $scope.accounts = [];
     
     
     // What to do after authentication
     $scope.runTheProcess = function(){
          var params = {'id':$route.current.params.feedbackId};
          Feedback.get($scope,params);
          Leadstatus.list($scope,{});
          User.list($scope,{});
     };
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
            Auth.refreshToken();
     };
  //HKA 28.12.2013 Edit feedback
     $scope.editFeedbackdetail = function(){
      $('#EditFeedbackModal').modal('show');
     };

     $scope.savefeedback = function(feedback){

      Feedback.patch($scope,feedback);
      $('#EditFeedbackModal').modal('hide');

     };



     $scope.editbeforedelete = function(){
 
  $('#BeforedeleteFeedback').modal('show');

     };
    $scope.deletefeedback = function(){
 
  var feedbackid = {'id':$route.current.params.feedbackId};
 
  Feedback.delete($scope,feedbackid);
  $('#BeforedeleteFeedback').modal('hide');
     };

  //HKA 28.12.2013 Share Feedback

    $scope.selectMember = function(){
        console.log('slecting user yeaaah');
        $scope.slected_memeber = $scope.user;
        $scope.user = $scope.slected_memeber.google_display_name;

     };
     $scope.share = function(slected_memeber){
        console.log('permissions.insert share');
        console.log(slected_memeber);
        $scope.$watch($scope.feedback.access, function() {
         var body = {'access':$scope.feedback.access};
         var id = $scope.feedback.id;
         var params ={'id':id,
                      'access':$scope.feedback.access}
         Feedback.patch($scope,params);
        });
        $('#sharingSettingsModal').modal('hide');

        if (slected_memeber.email){
        var params = {  'type': 'user',
                        'role': 'writer',
                        'value': slected_memeber.email,
                        'about_kind': 'Feedback',
                        'about_item': $scope.feedback.id

                        
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
     
     $scope.addTask = function(task){
      
        $('#myModal').modal('hide');
       var params ={'about_kind':'Feedback',
                      'about_item':$scope.feedback.id}

       
        
        if (task.due){

            var dueDate= $filter('date')(task.due,['yyyy-MM-dd']);
            dueDate = dueDate +'T00:00:00.000000'
            params ={'title': task.title,
                      'due': dueDate,
                      'about_kind':'Feedback',
                      'about_item':$scope.feedback.id
            }
     
        }else{
            params ={'title': task.title,
                     'about_kind':'Feedback',
                     'about_item':$scope.feedback.id}
        };
        Task.insert($scope,params);
     }

     $scope.hilightTask = function(){
        console.log('Should higll');
        $('#task_0').effect("highlight","slow");
        $('#task_0').effect( "bounce", "slow" );
       
     }
     $scope.listTasks = function(){
        var params = {'about_kind':'Feedback',
                      'about_item':$scope.feedback.id,
                      'order': '-updated_at',
                      'limit': 5
                      };
        Task.list($scope,params);

     };
    
     

     
    $scope.TopiclistNextPageItems = function(){
        
        
       var nextPage = $scope.topicCurrentPage + 1;
        var params = {};
           if ($scope.topicpages[nextPage]){
            params = {'about_kind':'Feedback',
                      'about_item':$scope.feedback.id,
                      'order': '-updated_at',
                      'limit': 5,
                      'pageToken':$scope.topicpages[nextPage]
                     }
          }else{
            params = {'about_kind':'Feedback',
                      'about_item':$scope.feedback.id,
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
            params = {'about_kind':'Feedback',
                      'about_item':$scope.feedback.id,
                      'order': '-updated_at',
                      'limit': 5,
                      'pageToken':$scope.topicpages[prevPage]
                     }
          }else{
            params = {'about_kind':'Feedback',
                      'about_item':$scope.feedback.id,
                      'order': '-updated_at',
                      'limit': 5}
          }
          $scope.topicCurrentPage = $scope.topicCurrentPage - 1 ;
          Topic.list($scope,params);
         
     };
    $scope.listTopics = function(){
        var params = {'about_kind':'Feedback',
                      'about_item':$scope.feedback.id,
                      'order': '-updated_at',
                      'limit': 5
                      };
        Topic.list($scope,params);

     };
     
     $scope.hilightTopic = function(){
        console.log('Should higll');
       $('#topic_0').effect( "bounce", "slow" );
       $('#topic_0 .message').effect("highlight","slow");
     }

    
     $scope.showModal = function(){
        console.log('button clicked');
        $('#addAccountModal').modal('show');

      };
      
    $scope.addNote = function(note){
      console.log('debug addNote');
      
      var params ={
                  'about_kind': 'Feedback',
                  'about_item': $scope.feedback.id,
                  'title': note.title,
                  'content': note.content
      };
      console.log(params);
      Note.insert($scope,params);
      $scope.note.title = '';
      $scope.note.content = '';
    };

//HKA 28.12.2013 Add a new lead to the Feedback
 $scope.AddleadModal = function(){
  $('#addLeadShow').modal('show');
 };

$scope.savelead = function(lead){
        var params ={'firstname':lead.firstname,
                      'lastname':lead.lastname,
                      'company':lead.company,
                      'title':lead.title,
                      'feedback':$scope.feedback.entityKey,
                      'feedback_name':$scope.feedback.name,
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
  var params = {'feedback':$scope.feedback.entityKey,
                 'limit':5};
  Lead.list($scope,params);
};
//HKA 28.12.2013 Add document 
 $scope.showCreateDocument = function(type){
        
        $scope.mimeType = type;
        $('#newDocument').modal('show');
     };
     $scope.createDocument = function(newdocument){
        var mimeType = 'application/vnd.google-apps.' + $scope.mimeType;
        var params = {'about_kind':'Feedback',
                      'about_item': $scope.feedback.id,
                      'title':newdocument.title,
                      'mimeType':mimeType };
        Attachement.insert($scope,params);

     };
     $scope.createPickerUploader = function() {
          var projectfolder = $scope.feedback.folder;
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
                var params = {'about_kind': 'Feedback',
                                      'about_item':$scope.feedback.id};
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
 $scope.listDocuments = function(){
        var params = {'about_kind':'Feedback',
                      'about_item':$scope.feedback.id,
                      'order': '-updated_at',
                      'limit': 5
                      };
        Attachement.list($scope,params);

     };
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

                  'about_item':$scope.feedback.id,
                  'about_kind':'Feedback' };
        Email.send($scope,params);
      };
      
// Google+ Authentication 
    Auth.init($scope);


}]);
app.controller('ContactListCtrl', ['$scope','$route','$location','Conf','MultiContactLoader','Contact',
    function($scope,$route,$location,Conf,MultiContactLoader,Contact) {
      $("#id_Contacts").addClass("active");
      
      console.log('i am in contact list controller');
       $("#id_Contacts").addClass("active");
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
    	
      $scope.contacts = [];

      $scope.renderSignIn = function() {
          console.log('$scope.renderSignIn #start_debug');
          if (window.is_signed_in){
              console.log('I am signed-in so you can continue');
              $scope.processAuth(window.authResult);
          }else{
            console.log('I am  not signed-in so render Button');
            gapi.signin.render('myGsignin', {
            'callback': $scope.signIn,
            'clientid': Conf.clientId,
            'requestvisibleactions': Conf.requestvisibleactions,
            'scope': Conf.scopes,
            'theme': 'dark',
            'cookiepolicy': Conf.cookiepolicy,
            'accesstype': 'offline'
            });

          }
          

     }
     $scope.listNextPageItems = function(){
        $scope.isLoading = true;
       var params = {};
          if ($scope.nextPageToken){
            params = {'limit':7,
                      'pageToken':$scope.nextPageToken
                     }
          }else{
            params = {'limit':7}
          }
          console.log('in listNextPageItems');
          console.log($scope);
          Contact.list($scope,params);
     }
     $scope.listPrevPageItems = function(){
       $scope.isLoading = true;
       var params = {};
          if ($scope.nextPageToken){
            params = {'limit':7,
                      'pageToken':$scope.prevPageToken
                     }
          }else{
            params = {'limit':7}
          }
          Contact.list($scope,params);
     }
     $scope.signIn = function(authResult) {
        console.log('signIn callback #start_debug');
        $scope.processAuth(authResult);
        
     }

     $scope.processAuth = function(authResult) {
        console.log('process Auth #startdebug');
        $scope.immediateFailed = true;
        if (authResult['access_token']) {
          // User is signed-in
          console.log('User is signed-in');
          $scope.immediateFailed = false;
          $scope.isSignedIn = true;
          window.is_signed_in = true;
          window.authResult = authResult;
          // Call the backend to get the list of accounts

          $scope.listNextPageItems();
        } else if (authResult['error']) {
          if (authResult['error'] == 'immediate_failed') {
            $scope.immediateFailed = true;

            window.location.replace('/sign-in');
            console.log('Immediate Failed');
          } else {
            console.log('Error:' + authResult['error']);
          }
        }
     }
     $scope.renderSignIn();
    
      // new Contact
      $scope.showModal = function(){
        $('#addContactModal').modal('show');

      };
      
    
      $scope.save = function(contact){
        Contact.insert(contact);
        $('#addContactModal').modal('hide')
      };


      
}]);
app.controller('ContactShowCtrl', ['$scope','$filter','$route','$location','Conf','Task','Contact',
    function($scope,$filter,$route,$location,Conf,Task,Contact) {
 console.log('I am in ContactShowCtrl');
      $("#id_Contacts").addClass("active");
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
     $scope.isContentLoaded = false;
     $scope.accounts = [];
     $scope.renderSignIn = function() {
          console.log('$scope.renderSignIn #start_debug');
          if (window.is_signed_in){
              console.log('I am signed-in so you can continue');
              $scope.processAuth(window.authResult);
          }else{
            console.log('I am  not signed-in so render Button');
            gapi.signin.render('myGsignin', {
            'callback': $scope.signIn,
            'clientid': Conf.clientId,
            'requestvisibleactions': Conf.requestvisibleactions,
            'scope': Conf.scopes,
            'theme': 'dark',
            'cookiepolicy': Conf.cookiepolicy,
            'accesstype': 'offline'
            });

          }
          

     }
     $scope.signIn = function(authResult) {
        console.log('signIn callback #start_debug');
        $scope.processAuth(authResult);
        
     }


     $scope.processAuth = function(authResult) {
        console.log('process Auth #startdebug');
        $scope.immediateFailed = true;
        if (authResult['access_token']) {
          // User is signed-in
          console.log('User is signed-in');
          $scope.immediateFailed = false;
          $scope.isSignedIn = true;
          window.is_signed_in = true;
          window.authResult = authResult;
          // Call the backend to get the list of contact
          var contactid = {'id':$route.current.params.contactId};
          Contact.get($scope,contactid);
        } else if (authResult['error']) {
          if (authResult['error'] == 'immediate_failed') {
            $scope.immediateFailed = true;

            console.log('Immediate Failed');
          } else {
            console.log('Error:' + authResult['error']);
          }
        }
     }
     $scope.renderSignIn();
     //$('#addContactModal').modal('show');

  $scope.editacontact = function(){
    $('#EditContactModal').modal('show');
  }
 //HKA 09.11.2013 Add a new Tasks
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
                      'about_kind':'Contact',
                     'about_item':$scope.contact.id
            }
            console.log(dueDate);
        }else{
            params ={'title': task.title,
                     'about_kind':'Contact',
                     'about_item':$scope.contact.id}
        };
        Task.insert($scope,params);
     }

     $scope.hilightTask = function(){
        console.log('Should higll');
        $('#task_0').effect("highlight","slow");
        $('#task_0').effect( "bounce", "slow" );
       
     }
     $scope.listTasks = function(){
        var params = {'about_kind':'Contact',
                      'about_item':$scope.contact.id,
                      'order': '-updated_at',
                      'limit': 5
                      };
        Task.list($scope,params);

     }


}]);
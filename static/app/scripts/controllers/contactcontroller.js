app.controller('ContactListCtrl', ['$scope','$route','$location','Account','accounts',
    function($scope,$route,$location,Account,accounts) {
      $("#id_Contacts").addClass("active");
      
      console.log('i am in account list controller');
    	
      $scope.accounts = accounts.accounts;
      // pagination
      var pagesCount = Math.ceil(accounts.count / 7);
    console.log('Number of page'+pagesCount);
      var pagination = {};
      pagination.pages = [];
      pagination.current = $route.current.params.page;
      if ((pagination.current-1)<1){
        pagination.prev = false;
      }
      else{
        pagination.prev =  pagination.current-1
      }
      if ((pagesCount-parseInt(pagination.current))>0){
        pagination.next =  parseInt(pagination.current)+1;
      }
      else{
        pagination.next = false;
      }
      for (var i = 1; i <= pagesCount; i++) {
        var page = {}
        page.id = i;
        page.isCurrent = (i===parseInt($route.current.params.page));
        pagination.pages.push(page);
      }

      $scope.pagination = pagination;
     // console.log(pagination);
      // Todo add next and prev to pagination

      // new account
      $scope.showModal = function(){
        $('#addAccountModal').modal('show');

      };
      
      $scope.account = new Account();
      $scope.save = function(account){
        
        
        var created_account = $scope.account.create();
        created_account.then(function(account){
          
          $('#addAccountModal').modal('hide');
          $location.path('/accounts/show/'+account.id);

        });
        


      };


      
}]);
app.controller('ContactShowCtrl', ['$scope','$route','$location','account','Topic','Note','WhoHasAccess','User',
    function($scope,$route,$location,account,Topic,Note,WhoHasAccess,User) {
      $("#id_Accounts").addClass("active");
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
      

      $scope.account = account;
      var prop = {}
      prop.topicaboutkind = 'Account';
      prop.topicaboutitem = account.id;
      
      prop.page = 1;
      var topic = new Topic(prop);
      console.log(topic);
      $scope.note = new Note();
      var propsharing = {};
      console.log(account);
      propsharing.obj = account.related_object;
      propsharing.itemid = account.id;
      var who = new WhoHasAccess(propsharing);
      $scope.selectedinvitee = undefined;

      

      $scope.showSharingSettings = function () {
            var ac_list = who.get();
            var whohasaccess = [];
            var inv = new User();
      
            ac_list.then(function(ac){
                
                console.log(ac);
                var ownerac = {}
                ownerac.name = account.ownername;
                ownerac.email = account.owner;
                ownerac.role = 'owner';
                ac.whohasaccess.push(ownerac);
                $scope.whohasaccess = ac.whohasaccess;
                console.log(ac.is_public);

                $scope.ispublic = ac.is_public;
            });
            var inv_list = inv.list();
            inv_list.then(function(invitees){
              console.log('in invitees');
              console.log(invitees);
              $scope.users = invitees;

            });
            /*
            user = new User();
        user.organization = $scope.organization;
        console.log(user);
        
            var user_list = user.list();
      
            user_list.then(function(users){
                
                console.log(users);
                $scope.users = users.users;
                
                
                //var arr = $.map(users.users, function (value, key) { return value; });
                
               // console.log(arr);
                
           });*/




            
            $scope.sharingSettingsShouldBeOpen = true;
       };

      $scope.closeSharingSettings = function () {
        
        $scope.sharingSettingsShouldBeOpen = false;
      };
      $scope.shareObject = function (selectedinvitee) {
        console.log(selectedinvitee);
        
      };
      $scope.opts = {
          backdropFade: true,
          dialogFade:true
      };

      $scope.addNote = function(note){
        note.noteaboutkind = 'Account';
        note.noteaboutitemid = $scope.account.id;
        
        
        var created_note = $scope.note.create();
        created_note.then(function(note){
          
          console.log('/accounts/show/'+$scope.account.id+'/notes/'+note.id);
        $location.path('/accounts/show/'+$scope.account.id+'/notes/'+note.id);
        $location.replace();

      });
      };
      
      $scope.paginator = function(topics){
          var pagesCount = Math.ceil(topics.count / 7);
          console.log(pagesCount);
          var pagination = {};
          pagination.pages = [];
          pagination.current = topic.page;
          if ((pagination.current-1)<1){
            pagination.prev = false;
          }
          else{
            pagination.prev =  pagination.current-1
          }
          if ((pagesCount-parseInt(pagination.current))>0){
            pagination.next =  parseInt(pagination.current)+1;
          }
          else{
            pagination.next = false;
          }
          for (var i = 1; i <= pagesCount; i++) {
            var page = {}
            page.id = i;
            page.isCurrent = (i===parseInt(topic.page));
            pagination.pages.push(page);
          }



            return pagination;

      };
      $scope.refreshTopics = function(page){
            topic.page = page;
            var topic_list = topic.list();
      
            topic_list.then(function(topics){
                
                console.log(topics);
                
                $scope.pagination = $scope.paginator(topics);
                
                $scope.topics = topics;
                
               

              });
            

          //  $scope.pagination = $scope.paginator();


      };
      $scope.refreshTopics(1);
     //console.log($scope.topics);
      $("#id_Accounts").addClass("current");
    	
}]);

app.controller('AccountNewCtrl', ['$scope','$location','Account',
    function($scope,$location,Account) {
      $("#id_Accounts").addClass("current");
      $scope.showModal = function(){
        $('#addAccountModal').modal('show');

      };
      
      $scope.account = new Account();
      $scope.save = function(account){
        
        var created_account = $scope.account.create();
        created_account.then(function(account){
          
          $('#addAccountModal').modal('hide');
          $location.path('/accounts/show/'+account.id);

        });
        


      };
      $scope.showModal();
    	
}]);

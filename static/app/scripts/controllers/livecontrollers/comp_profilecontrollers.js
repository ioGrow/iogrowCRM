app.controller('CompanyProfileShowCtrl', ['$scope','$route','$filter','Auth','Companyprofile','Map',
    function($scope,$route,$filter,Auth,Companyprofile,Map) {
     $("#id_Company_profile").addClass("active");
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
     $scope.tabs={};
     $scope.address = {};
     
    
     

     // What to do after authentication
     $scope.runTheProcess = function(){
         var params = {'id':$route.current.params.organizationId};
         
        Companyprofile.get($scope,params);
        
   
     };
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
            Auth.refreshToken();
     };


//HKA 31.12.2013 Edit company prfile name
  $scope.editcompanyprofile = function(){
    $('#EditCompnayProfileModal').modal('show');
  }
$scope.updatCompanyprofilename = function(companyprof){
    params = {'id':$scope.companyprof.id,
             'name':companyprof.name}
  Companyprofile.patch($scope,params);
  $('#EditCompnayProfileModal').modal('hide');
    $scope.companyprof={};
   };

   //HKA 02.10.2014 Edit Youtube Channel of Company Profile
    $scope.edityoutubechannel = function() {
       $('#EditYoutubeChannelModal').modal('show');
    };
   
    //HKA 30.12.2013 Add Tagline
$scope.updateYoutubeChannel = function(companyprof){
 
  params = {'id':$scope.companyprof.id,
             'youtube_channel':companyprof.youtube_channel}
  Companyprofile.patch($scope,params);
   $('#EditYoutubeChannelModal').modal('hide');
 };

  //HKA 29.12.2013 Edit tagline of Company Profile
    $scope.edittagline = function() {
       $('#EditTagModal').modal('show');
    };
   
    //HKA 30.12.2013 Add Tagline
$scope.updateTagline = function(companyprof){
 
  params = {'id':$scope.companyprof.id,
             'tagline':companyprof.tagline}
  Companyprofile.patch($scope,params);
  $('#EditTagModal').modal('hide');
};
    //HKA 29.12.2013 Edit Introduction on Company Profile
    $scope.editintro = function() {
       $('#EditIntroModal').modal('show');
    };
    $scope.updateintro = function(companyprof){
 
  params = {'id':$scope.companyprof.id,
             'introduction':companyprof.introduction}
  Companyprofile.patch($scope,params);
  $('#EditIntroModal').modal('hide');
};

// 31.12.2013 Manage phone, email, address, sociallink, Website


 $scope.addPhone = function(phone){
  //HKA 31.12.2013 Concatenate old phones with new phone
  var phonesArray = undefined;
  
  if ($scope.companyprof.phones){
    phonesArray = new Array();
    phonesArray = $scope.companyprof.phones;
    phonesArray.push(phone);
  }else{
    phonesArray = phone;
  }

  params = {'id':$scope.companyprof.id,
            'phones':phonesArray
            };
  Companyprofile.patch($scope,params);
  $('#phonemodal').modal('hide');
  $scope.phone={};
  };

//HKA 20.11.2013 Add Email
$scope.addEmail = function(email){
  var emailsArray = undefined;
  
  if ($scope.companyprof.emails){
    emailsArray = new Array();
    emailsArray = $scope.companyprof.emails;
    emailsArray.push(email);
  }else{
    emailsArray = email;
  }

  params = {'id':$scope.companyprof.id,
            'emails':emailsArray
            };
  Companyprofile.patch($scope,params);
  $('#emailmodal').modal('hide');
  $scope.email={};
  };
  

     
      

//HKA 22.11.2013 Add Website
$scope.addWebsite = function(website){
  var websiteArray = undefined;
  if ($scope.companyprof.websites){
    websiteArray = new Array();
    websiteArray = $scope.companyprof.websites;
    websiteArray.push(website);

  }else{ 
    websiteArray = website;
  }
  params = {'id':$scope.companyprof.id,
             'websites':websiteArray}
  Companyprofile.patch($scope,params);
  $('#websitemodal').modal('hide');
  $scope.website={}
};

//HKA 22.11.2013 Add Social
$scope.addSocial = function(social){
  var socialArray = undefined;
  if ($scope.companyprof.sociallinks){
    socialArray = new Array();
    socialArray = $scope.companyprof.sociallinks;
    socialArray.push(social);

  }else{ 
    socialArray = social;
  }
  params = {'id':$scope.companyprof.id,
             'sociallinks':socialArray}
  Companyprofile.patch($scope,params);
  $('#socialmodal').modal('hide');
  $scope.social={};
};
   $scope.renderMaps = function(){
          $scope.addresses = $scope.companyprof.addresses;
          Map.render($scope);
      };
      $scope.addAddress = function(address){
        var addressArray = undefined;
        if ($scope.companyprof.addresses){
          addressArray = new Array();
          addressArray = $scope.companyprof.addresses;
          addressArray.push(address);

        }else{ 
          addressArray = address;
        }
        Map.searchLocation($scope,address);

        $('#addressmodal').modal('hide');
        $scope.address={};
      };
      $scope.locationUpdated = function(addressArray){

          var params = {'id':$scope.companyprof.id,
                         'addresses':addressArray};
          Companyprofile.patch($scope,params);
      };
      $scope.addGeo = function(addressArray){
          params = {'id':$scope.companyprof.id,
             'addresses':addressArray}
          Companyprofile.patch($scope,params);
      };

   // Google+ Authentication 
    Auth.init($scope);

    
}]);


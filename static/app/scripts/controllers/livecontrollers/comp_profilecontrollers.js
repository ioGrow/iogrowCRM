app.controller('CompanyProfileShowCtrl', ['$scope','$route','$filter','Auth','Companyprofile',
    function($scope,$route,$filter,Auth,Companyprofile) {
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
  
//HKA 20.11.2013 Add Addresse
$scope.addAddress = function(address){
  var addressArray = [];
  var addressToSearch = address.street + ',' + address.city + ',' + address.country
  console.log('@@@@Addresse');
  console.log(addressToSearch);
  
  $('#map_canvas').gmap('search', {'address': addressToSearch}, function(results, status) {
              console.log('***Searching***');
              console.log(results);
              console.log(results[0].geometry.location);
              
              
              if ($scope.companyprof.addresses){
                addressArray = new Array();
                addressArray = $scope.companyprof.addresses;
                address.lat = results[0].geometry.location.nb.toString();
                address.lon = results[0].geometry.location.ob.toString();
                addressArray.push(address);

              }else{ 
                addressArray = address;
              }
              params = {'id':$scope.companyprof.id,
                         'addresses':addressArray};
              console.log('*************************');
              
              Companyprofile.patch($scope,params);
              
              var position = results[0].geometry.location.nb + ',' + results[0].geometry.location.ob;
              console.log(position);

              $('#map_canvas').gmap('addMarker', {'position': position, 'bounds': true, 'draggable':true,'address':address}).dragend( function(event) {
                      console.log(event);
                      $scope.updateLocation(event.latLng, this);
                    }).click(function() {
                  $('#map_canvas').gmap('openInfoWindow', {'content': 'Hello World!'}, this);
              });
              
  });
  
  $('#addressmodal').modal('hide');
  if (address.street == undefined){
    address.street = '';
  };
  if (address.city == undefined){
    address.city = '';
  };

  
  
  $scope.address={};
};
      $scope.renderMaps = function(){
        // Also works with: var yourStartLatLng = '59.3426606750, 18.0736160278';
                var yourStartLatLng = new google.maps.LatLng(59.3426606750, 18.0736160278);
                var mapOptions = {
                  center: new google.maps.LatLng(0, 0),
                  zoom: 02
                };
                $('#map_canvas').gmap(mapOptions).bind('init', function(event, map) { 
                  for (var i=0; i<$scope.companyprof.addresses.length; i++) {
                    console.log('99999999999999');
                    console.log($scope.companyprof.addresses[i]);
                    if ($scope.companyprof.addresses[i].lat){
                     $('#map_canvas').gmap('addMarker', {
                      'position': $scope.companyprof.addresses[i].lat + ','+ $scope.companyprof.addresses[i].lon, 
                      'draggable': true, 
                      'bounds': true,
                      'address':$scope.companyprof.addresses[i]
                    }, function(map, marker) {
                      // should be deleted;
                    }).dragend( function(event) {
                      console.log(event);
                      $scope.updateLocation(event.latLng, this);
                    });
                  }
                  
                  }
                  
      
                });
                
      };
      $scope.updateLocation = function(location,marker){
              console.log('llllllllllllllllllocation');
              console.log(location);

              
              marker.address.lat = location.nb.toString();
              marker.address.lon = location.ob.toString();
                
              if ($scope.companyprof.addresses){
                for (var i=0; i<$scope.companyprof.addresses.length; i++) {
                   if ($scope.companyprof.addresses[i].city==marker.address.city&$scope.companyprof.addresses[i].country==marker.address.country){
                      $scope.companyprof.addresses.splice(i,1);
                   }
                }
                addressArray = new Array();
                addressArray = $scope.companyprof.addresses;
                addressArray.push(marker.address);

              }else{ 
                addressArray = marker.address;
              }
              params = {'id':$scope.companyprof.id,
                         'addresses':addressArray};
              Companyprofile.patch($scope,params);
      };
      $scope.findLocation = function(location, marker){
            console.log('###');
            console.log(location);
            console.log(marker);
            console.log('@');
          $('#map_canvas').gmap('search', {'location': location}, function(results, status) {
              console.log('***Searching***');
              if ( status == 'OK' ) {
                if ($scope.companyprof.addresses){
                for (var i=0; i<$scope.companyprof.addresses.length; i++) {
                    console.log('see what is the difference?');
                    console.log($scope.companyprof.addresses[i]);
                    console.log('&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&');
                    console.log(marker.address);
                    if ($scope.companyprof.addresses[i].city==marker.address.city&$scope.companyprof.addresses[i].country==marker.address.country){
                      console.log('fooooooooooooooooooooooound');
                      $scope.companyprof.addresses.splice(i,1);
                    }
                }
                addressArray = new Array();
                addressArray = $scope.companyprof.addresses;
                marker.address.lat = results[0].geometry.location.nb.toString();
                marker.address.lon = results[0].geometry.location.ob.toString();
                addressArray.push(marker.address);

              }else{ 
                addressArray = marker.address;
              }
              params = {'id':$scope.companyprof.id,
                         'addresses':addressArray};
              console.log('*************************');
              
              Companyprofile.patch($scope,params);
                console.log('***Ok***');
                console.log(results);
                // getting the country
                
                var address_components = results[0].formatted_address.split(',');


                console.log(address_components);
                $scope.address.country = address_components[address_components.length-1];
                $scope.$apply();
                $.each(results[0].address_components, function(i,v) {
                  if ( v.types[0] == "administrative_area_level_1" || 
                     v.types[0] == "administrative_area_level_2" ) {
                    $('#state'+marker.__gm_id).val(v.long_name);
                  } else if ( v.types[0] == "country") {

                    $scope.address.country = v.long_name;
                    $('#country'+marker.__gm_id).val(v.long_name);
                  }
                });
                  $('#addressmodal').modal('show');
                marker.setTitle(results[0].formatted_address);
                $('#address'+marker.__gm_id).val(results[0].formatted_address);
                console.log(results[0]);
              };
          });
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
   // Google+ Authentication 
    Auth.init($scope);

    
}]);


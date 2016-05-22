var mapservices = angular.module('mapServices',[]);
mapservices.factory('Map', function($http) {
  var Map = function(data) {
    angular.extend(this, data);
  };
  var mapCanvas={};
  var infowindow=new google.maps.InfoWindow();
  Map.render = function($scope){
      var mapOptions = {
                  center: new google.maps.LatLng(0, 0),
                  zoom: 01
      };
      $('#gmap_canvas').gmap(mapOptions).bind('init', function(event, map) { 

      if($scope.infonodes.addresses){
        for (var i=0; i<$scope.infonodes.addresses.length; i++) {
          if ($scope.infonodes.addresses[i].lat){
            var lat = parseFloat($scope.infonodes.addresses[i].lat);
            var lon = parseFloat($scope.infonodes.addresses[i].lon);           
            $('#gmap_canvas').gmap('addMarker', {
                    'position': lat+ ','+ lon, 
                    'draggable': true, 
                    'bounds': true,
                    'address':$scope.infonodes.addresses[i]
                  }, function(map, marker) {
                    // should be deleted;
                  }).dragend( function(event) { 
                      Map.updateLocation($scope,event.latLng, this);
                  });
          }                
        }
      }
      x = map.getZoom();
      c = map.getCenter();
      google.maps.event.trigger(map, 'resize');
      map.setZoom(x);
      map.setCenter(c);
        
      });
  };
  Map.renderEvent = function($scope){
      var mapOptions = {
                  center: new google.maps.LatLng(0, 0),
                  zoom: 01
      };
      $('#gmap_canvas').gmap(mapOptions).bind('init', function(event, map) { 
        if($scope.addresses){
          for (var i=0; i<$scope.addresses.length; i++) {
            if ($scope.addresses[i].lat){
              var lat = parseFloat($scope.addresses[i].lat);
              var lon = parseFloat($scope.addresses[i].lon);             
              $('#gmap_canvas').gmap('addMarker', {
                      'position': lat+ ','+ lon, 
                      'draggable': true, 
                      'bounds': true,
                      'address':$scope.addresses[i]
                    }, function(map, marker) {
                      // should be deleted;
                    }).dragend( function(event) {
                        Map.updateLocation($scope,event.latLng, this);
              });
            }                  
          }
        }
        x = map.getZoom();
        c = map.getCenter();
        google.maps.event.trigger(map, 'resize');
        map.setZoom(x);
        map.setCenter(c);
      });
  };
  Map.renderwith =function($scope){
      var mapOptions = {
                  center: new google.maps.LatLng(0, 0),
                  zoom: 01
      };
      mapCanvas = new google.maps.Map(document.getElementById('gmap_canvas'),mapOptions);
      if($scope.infonodes.addresses){
        for (var i=0; i<$scope.infonodes.addresses.length; i++) {
          if ($scope.infonodes.addresses[i].lat){
            var loca=$scope.infonodes.addresses[i];
               var lat = parseFloat(loca.lat);
               var lng = parseFloat(loca.lon);   
               if (!lng) {
                lng = parseFloat(loca.lng);
               };
             /* var lat = parseFloat($scope.infonodes.addresses[i].lat);
              var lng = parseFloat($scope.infonodes.addresses[i].lng);*/           
              var marker = new google.maps.Marker({
                map: mapCanvas,
                anchorPoint: new google.maps.Point(0, 0)
              });
              marker.setPosition({lat: lat, lng: lng});
              marker.setVisible(true);
              var infowindow = new google.maps.InfoWindow({});
              infowindow.setContent('<div><strong>' + loca.street + ', ' + loca.city + ', ' + loca.state + ', ' + loca.country+'</strong><br>')
              
              google.maps.event.addListener(marker, 'click', function() {
                infowindow.open(mapCanvas, marker);
              });
            }                
        }
      }      
     /* if ($scope.infonodes.addresses[0].lat) {
         map.setCenter({lat: $scope.infonodes.addresses[0].lat, lng: $scope.infonodes.addresses[0].lng});
      };*/
  };
  Map.autocomplete=function($scope,inputId){
      var input = (document.getElementById(inputId));
      var autocomplete = new google.maps.places.Autocomplete(input);
       google.maps.event.addListener(autocomplete, 'place_changed', function() {
        if (inputId=="relatedaddressInput") {
          $scope.isRelatedAddress=true;
        };
        var place = autocomplete.getPlace();
        if (!place.geometry) {

          $scope.notFoundAddress(place,inputId);
          return;
        }
        var address = '';
        var add = {};
        add.lat=place.geometry.location.lat();
        add.lng=place.geometry.location.lng();
         add.formatted=place.formatted_address;
        var component={};
        for (var i=0; i<place.address_components.length; i++) {
           component=place.address_components[i];
          if (component.types[0]=='country') {
            add.country=component.long_name;
          }else{
            if (component.types[0]=='administrative_area_level_1') {
              add.state=component.long_name;
            } else{
              if (component.types[0]=='locality') {
                add.city=component.long_name;
              } else{
                if (component.types[0]=='neighborhood'||component.types[0]=='route') {
                  add.street=component.long_name;
                } 
              };

            };
          }         
        }
           input.value = "";
        $scope.addGeo(add);
      });
  }

  Map.autocompleteCalendar=function($scope,inputId){
      var input = (document.getElementById(inputId));
      var autocomplete = new google.maps.places.Autocomplete(input);
       google.maps.event.addListener(autocomplete, 'place_changed', function() {
        if (inputId=="relatedaddress") {
          $scope.isRelatedAddress=true;
        };
        var place = autocomplete.getPlace();
        if (!place.geometry) {
          $scope.notFoundAddress(place,inputId);
          return;
        }

        var address = '';
        var add = {};
        add.lat=place.geometry.location.lat();
        add.lng=place.geometry.location.lng();
         add.formatted=place.formatted_address;
        var component={};
        for (var i=0; i<place.address_components.length; i++) {
           component=place.address_components[i];
          if (component.types[0]=='country') {
            add.country=component.long_name;
          }else{
            if (component.types[0]=='administrative_area_level_1') {
              add.state=component.long_name;
            } else{
              if (component.types[0]=='locality') {
                add.city=component.long_name;
              } else{
                if (component.types[0]=='neighborhood'||component.types[0]=='route') {
                  add.street=component.long_name;
                } 
              };

            };
          }         
        }
        $scope.addGeoCalendar(add);
      });
  }





  Map.setLocation= function($scope,address){
      var marker = new google.maps.Marker({
        map: mapCanvas,
        anchorPoint: new google.maps.Point(0, 0)
      });
        var lat = parseFloat(address.lat);
        var lon = parseFloat(address.lon);   
        marker.setPosition({lat: lat, lng: lon});
        marker.setVisible(true);
        infowindow.setContent('<div><strong>' + address.street + ', ' + address.city + ', ' + address.state + ', ' + address.country+'</strong><br>' + address);
        infowindow.open(mapCanvas, marker);
  }
  Map.justAutocomplete = function($scope,inputId,addresstosave){
      var input = (document.getElementById(inputId));
      var autocomplete = new google.maps.places.Autocomplete(input);
       google.maps.event.addListener(autocomplete, 'place_changed', function() {

        var place = autocomplete.getPlace();
        if (!place.geometry) {
          $scope.notFoundAddress(place,inputId);
          return;
        }

        var address = '';
        var add = {};
        add.lat=place.geometry.location.lat();
        add.lng=place.geometry.location.lng();
        var component={};
        for (var i=0; i<place.address_components.length; i++) {
           component=place.address_components[i];
          if (component.types[0]=='country') {
            add.country=component.long_name;
          }else{
            if (component.types[0]=='administrative_area_level_1') {
              add.state=component.long_name;
            } else{
              if (component.types[0]=='locality') {
                add.city=component.long_name;
              } else{
                if (component.types[0]=='neighborhood'||component.types[0]=='route') {
                  add.street=component.long_name;
                } 
              };

            };
          }         
        }
        if (addresstosave instanceof Array) {
          addresstosave.push(add);
        } else {
          addresstosave= add;
        }
        input.value="";

      });
  }
  Map.updateLocation = function($scope,location,marker){
              marker.address.lat = location.lat();
              marker.address.lon = location.lng();
              $scope.locationUpdated(marker.address);
  };
  Map.emptyString = function(entry,isLast){
    if (entry==undefined){
      entry = ' ';
    }
    if(isLast==false){
      entry += ',';
    }
    return entry
  }
  Map.destroy = function(){
    $('#gmap_canvas').gmap('destroy');
  }
  Map.searchLocation = function($scope,address){
              
              var addressArray = [];
              if(address.street||address.city||address.country){
                var addressToSearch = Map.emptyString(address.street,false) + Map.emptyString(address.city,false) + Map.emptyString(address.country,false);  
              }else{
                var addressToSearch =address;  
              }      
              $('#gmap_canvas').gmap('search', {'address': addressToSearch}, function(results, status) {
                
              if ( status == 'OK' ) {
                  
                  address.lat = results[0].geometry.location.lat();
                  address.lon = results[0].geometry.location.lng();
                  var position = results[0].geometry.location.lat() + ',' + results[0].geometry.location.lng();
                
                  $('#gmap_canvas').gmap('addMarker', {'position': position, 'bounds': true, 'draggable':true,'address':address}).dragend( function(event) {
                          Map.updateLocation($scope,event.latLng, this);
                  });
                  $scope.addGeo(address);
              }
              else{
                
                $scope.addGeo(address);
              }
              
            });
  };

  
  return Map;
});


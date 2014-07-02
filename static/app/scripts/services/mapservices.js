var mapservices = angular.module('mapServices',[]);
mapservices.factory('Map', function($http) {
  var Map = function(data) {
    angular.extend(this, data);
  };

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
  Map.updateLocation = function($scope,location,marker){
              marker.address.lat = location.lat();
              marker.address.lon = location.lng();
              console.log("markerrrrrrrrrrrrrrrrrr")
              $scope.locationUpdated(marker.address);
  };
  Map.emptyString = function(entry,isLast){
    if (entry==undefined){
      entry = ' ';
    }
    if(isLast=false){
      entry = entry + ',';
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
                  
                  console.log("okkkkkkkkkkkkkkkkkss");
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


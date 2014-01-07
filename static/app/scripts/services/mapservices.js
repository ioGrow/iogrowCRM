var mapservices = angular.module('mapServices',[]);
mapservices.factory('Map', function($http) {
  var Map = function(data) {
    angular.extend(this, data);
  };

  Map.render = function($scope){
      console.log($scope.addresses);
      var mapOptions = {
                  center: new google.maps.LatLng(0, 0),
                  zoom: 01
      };
      $('#gmap_canvas').gmap(mapOptions).bind('init', function(event, map) { 

        if($scope.addresses){
          for (var i=0; i<$scope.addresses.length; i++) {
            if ($scope.addresses[i].lat){
              $('#gmap_canvas').gmap('addMarker', {
                      'position': $scope.addresses[i].lat + ','+ $scope.addresses[i].lon, 
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
              marker.address.lat = location.nb.toString();
              marker.address.lon = location.ob.toString();
              if ($scope.addresses){
                  for (var i=0; i<$scope.addresses.length; i++) {
                     if ($scope.addresses[i].city==marker.address.city&$scope.addresses[i].country==marker.address.country){
                        $scope.addresses.splice(i,1);
                     }
                  }
                  addressArray = new Array();
                  addressArray = $scope.addresses;
                  addressArray.push(marker.address);

              }else{ 
                addressArray = marker.address;
              }
              $scope.locationUpdated(addressArray);
  };
  Map.searchLocation = function($scope,address){
              console.log(address);
              var addressArray = [];
              var addressToSearch = address.street + ',' + address.city + ',' + address.country;
              
              $('#gmap_canvas').gmap('search', {'address': addressToSearch}, function(results, status) {
              console.log('gmap.search');
              console.log(results);
              
              
              if ($scope.addresses){
                addressArray = new Array();
                addressArray = $scope.addresses;
                address.lat = results[0].geometry.location.nb.toString();
                address.lon = results[0].geometry.location.ob.toString();
                addressArray.push(address);

              }else{ 
                addressArray = address;
              }
              
              $scope.addGeo(addressArray);
              
              var position = results[0].geometry.location.nb + ',' + results[0].geometry.location.ob;
              

              $('#gmap_canvas').gmap('addMarker', {'position': position, 'bounds': true, 'draggable':true,'address':address}).dragend( function(event) {
                      console.log(event);
                      Map.updateLocation($scope,event.latLng, this);
              });
              
  });
  };

  
  return Map;
});


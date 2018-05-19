 // Create a map variable
 var map;

 var markers = [];

 // initialize the map
 function initMap() {

     var styles = [{
         featureType: 'water',
         stylers: [{
             color: '#ffffff'
         }]

     }]
     //create a new map JS object.
     // S Arlington
     // 38.862606, -77.087269
     map = new google.maps.Map(document.getElementById('map'), {
         center: { lat: 38.862606, lng: -77.087269 },
         styles: styles,
         zoom: 13
     });

     var singleLatLng = { lat: 38.8630671, lng: -77.0866913 };
     // TODO: Create a single marker appearing on initialize -
     // Create it with the position of the singleLatLng,
     // on the map, and give it your own title!
     var marker = new google.maps.Marker({
         position: singleLatLng,
         map: map,
         title: "Marker TITLE"
     });

     // TODO: create a single infowindow, with your own content.
     // It must appear on the marker
     var infowindow = new google.maps.InfoWindow({
         content: "This is my window content."
     });

     // TODO: create an EVENT LISTENER so that the infowindow opens when
     // the marker is clicked!
     marker.addListener('click', function() {
         infowindow.open(map, marker);
     })



 }

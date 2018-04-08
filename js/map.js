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
     //Albertina Art Gallery - Vienna, Austria
     // 48.203543, 16.3637297,15.8
     map = new google.maps.Map(document.getElementById('map'), {
         center: { lat: 40.74135, lng: -73.99802 },
         styles: styles,
         zoom: 13
     });

     // var albertina = {lat: 48.203543, lng: 16.3637297};
     // var marker = new google.maps.Marker({
     //  position: albertina,
     //  map: map,
     //  title: "Marker: Albertina"
     // });
     // var infowindow = new google.maps.InfoWindow({
     //  content: "Here is an infowinodow. It's working."
     // });
     // marker.addListener('click', function() {
     //  infowindow.open(map, marker);
     // });

     var singleLatLng = { lat: 40.74135, lng: -73.99802 };
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

/*global google */
/*global ko */
"use strict";

function openNav() {
    document.getElementById("mySidenav").style.width = "400px";
    document.getElementById("main").style.marginLeft = "400px";
}

function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
    document.getElementById("main").style.marginLeft = "0";
}

//ASCII Key Code 27 is the ESCAPE button. When that is pressed, collapse the sidenav slideout.
$(document).keyup(function(e) {
    if (e.keyCode == 27) {
        document.getElementById("mySidenav").style.width = "0";
        document.getElementById("main").style.marginLeft = "0";
    }
});

function googleMapsError() {
    alert("Google Maps encountered an error while loading. Please contact the webmaster.");
}

var map;

// Create a new blank array for all the listing markers.
var markers = [];

// This global polygon variable is to ensure only ONE polygon is rendered.
var polygon = null;

// Create placemarkers array to use in multiple functions to have control
// over the number of places that show.
var placeMarkers = [];


function initMap() {
    // Create a styles array to use with the map.
    var styles = [{
        featureType: 'water',
        stylers: [
            { color: '#84b9ef' }
        ]
    }, {
        featureType: 'administrative',
        elementType: 'labels.text.stroke',
        stylers: [
            { color: '#ffffff' },
            { weight: 6 }
        ]
    }, {
        featureType: 'administrative',
        elementType: 'labels.text.fill',
        stylers: [
            { color: '#557669' }
        ]
    }, {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [
            { color: '#efe9e4' },
            { lightness: -40 }
        ]
    }, {
        featureType: 'transit.station',
        stylers: [
            { weight: 9 },
            { hue: '#e85113' }
        ]
    }, {
        featureType: 'road.highway',
        elementType: 'labels.icon',
        stylers: [
            { visibility: 'off' }
        ]
    }, {
        featureType: 'water',
        elementType: 'labels.text.stroke',
        stylers: [
            { lightness: 100 }
        ]
    }, {
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [
            { lightness: -100 }
        ]
    }, {
        featureType: 'poi',
        elementType: 'geometry',
        stylers: [
            { visibility: 'on' },
            { color: '#f0e4d3' }
        ]
    }, {
        featureType: 'road.highway',
        elementType: 'geometry.fill',
        stylers: [
            { color: '#ebebeb' },
            { lightness: -25 }
        ]
    }];

    // Constructor creates a new map - only center and zoom are required.
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 38.862606, lng: -77.087269 },
        zoom: 13,
        styles: styles,
        mapTypeControl: false
    });

    // This autocomplete is for use in the search within time entry box.
    var timeAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById('search-within-time-text'));
    // This autocomplete is for use in the geocoder entry box.
    var zoomAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById('zoom-to-area-text'));
    // Bias the boundaries within the map for the zoom to area text.
    zoomAutocomplete.bindTo('bounds', map);
    // Create a searchbox in order to execute a places search
    var searchBox = new google.maps.places.SearchBox(
        document.getElementById('places-search'));
    // Bias the searchbox to within the bounds of the map.
    searchBox.setBounds(map.getBounds());


    // These are movie theaters that will be shown to the user.
    var locations = [
        { title: 'AMC Courthouse Plaza 8', location: { lat: 38.8902583, lng: -77.0862996 } },
        { title: 'AMC Shirlington 7', location: { lat: 38.841283, lng: -77.088731 } },
        { title: 'Arlington Cinema and Drafthouse', location: { lat: 38.862614, lng: -77.087208, } },
        { title: 'Regal Cinemas Ballston Commons 12', location: { lat: 38.878555, lng: -77.111473 } },
        { title: 'AMC Hoffman Center 22', location: { lat: 38.8023832, lng: -77.0727257 } },
        { title: 'Landmark\'s E Street Cinema', location: { lat: 38.8962795, lng: -77.0287645 } },
        { title: 'AMC Loews Georgetown', location: { lat: 38.902693, lng: -77.061733 } }
    ];

    var Location = function(info) {
        this.title = info.title;
        this.location = info.location;
        this.marker = info.marker;
    }

    /* ----------------------------------------------------------------------
       KNOCKOUT JS - organizing and storing markers
    ---------------------------------------------------------------------- */

    function AppViewModel() {

        /*
                //missing Knockout function
                var stringStartsWith = function(string, startsWith) {
                    string = string || "";
                    if (startsWith.length > string.length)
                        return false;
                    return string.substring(0, startsWith.length) === startsWith;
                };
        */

        var self = this;
        self.filter = ko.observable("");
        self.maxDuration = ko.observableArray([10, 15, 30, 60]);
        self.travelMethod = ko.observableArray([
            { value: "DRIVING", displayText: "drive" },
            { value: "WALKING", displayText: "walk" },
            { value: "BICYCLING", displayText: "bike" },
            { value: "TRANSIT", displayText: "transit" }
        ]);

        // These are movie theaters that will be shown to the user.
        self.listLocations = ko.observableArray([]);

        locations.forEach(function(location) {
            self.listLocations().push(new Location(location))
        });

        // for (var i = 0; i < locations.length; i++) {
        //     self.listLocations().push(locations[i]);
        // }

        //this next launchWindow snippet is my own but I looked at an instructor post at https://discussions.udacity.com/t/open-marker-infowindow-when-clicked-on-from-list/746580 when I got stuck. This helped guide my research.
        self.launchWindow = function(location) {
            //map the selected location to the Google Maps marker from our locations array by matching title
            var marker = markers.filter(m => m.title === location.title)[0];
            if (marker) {
                google.maps.event.trigger(marker, 'click');
            }
        };

        //filter the list of markers as well as the drawn marker icons on the map
        self.filteredItems = ko.computed(function() {
            var filter = self.filter().toLowerCase();
            if (!filter) {
                ko.utils.arrayForEach(self.listLocations(), function(item) {
                    item.marker.setVisible(true);
                });
                return self.listLocations();
            } else {
                return ko.utils.arrayFilter(self.listLocations(), function(item) {
                    var result = (item.title.toLowerCase().search(filter) >= 0)
                    item.marker.setVisible(result);
                    return result;
                });
            }
        });

    }

    /* ----------------------------------------------------------------------
    ---------------------------------------------------------------------- */

    var largeInfowindow = new google.maps.InfoWindow();

    // Initialize the drawing manager.
    var drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.POLYGON,
        drawingControl: true,
        drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_LEFT,
            drawingModes: [
                google.maps.drawing.OverlayType.POLYGON
            ]
        }
    });

    // Style the markers a bit. This will be our listing marker icon.
    var defaultIcon = makeMarkerIcon('155263');

    // Create a "highlighted location" marker color for when the user
    // mouses over the marker.
    var highlightedIcon = makeMarkerIcon('f0b917');

    // The following group uses the location array to create an array of markers on initialize.
    for (var i = 0; i < locations.length; i++) {
        // Get the position from the location array.
        var position = locations[i].location;
        var title = locations[i].title;
        // Create a marker per location, and put into markers array.
        var marker = new google.maps.Marker({
            position: position,
            title: title,
            animation: google.maps.Animation.DROP,
            icon: defaultIcon,
            id: i
        });
        // Push the marker to our array of markers.
        markers.push(marker);
        // Create an onclick event to open the large infowindow at each marker.
        marker.addListener('click', function() {
            populateInfoWindow(this, largeInfowindow);
            animateMarker(this);
            getFoursquare(this);
        });
        // Two event listeners - one for mouseover, one for mouseout,
        // to change the colors back and forth.
        marker.addListener('mouseover', function() {
            this.setIcon(highlightedIcon);
        });
        marker.addListener('mouseout', function() {
            this.setIcon(defaultIcon);
        });
    }

    function animateMarker(marker) {
        highlightMarker(marker)
            .then(unHighlightMarker(marker));
    }

    function highlightMarker(marker) {
        var promise = new Promise(function(resolve, reject) {
            setTimeout(function() {
                resolve(marker.setIcon(highlightedIcon));
            }, 200);
        });
        return promise;
    };

    function unHighlightMarker() {
        var promise = new Promise(function(resolve, reject) {
            setTimeout(function() {
                resolve(marker.setIcon(defaultIcon));
            }, 4000);
        });
        return promise;
    };

    showListings();

    document.getElementById('show-listings').addEventListener('click', showListings);

    document.getElementById('hide-listings').addEventListener('click', function() {
        hideMarkers(markers);
    });

    document.getElementById('toggle-drawing').addEventListener('click', function() {
        toggleDrawing(drawingManager);
    });

    document.getElementById('zoom-to-area').addEventListener('click', function() {
        zoomToArea();
    });

    document.getElementById('search-within-time').addEventListener('click', function() {
        searchWithinTime();
    });

    // Listen for the event fired when the user selects a prediction from the
    // picklist and retrieve more details for that place.
    searchBox.addListener('places_changed', function() {
        searchBoxPlaces(this);
    });

    // Listen for the event fired when the user selects a prediction and clicks
    // "go" more details for that place.
    document.getElementById('go-places').addEventListener('click', textSearchPlaces);

    // Add an event listener so that the polygon is captured,  call the
    // searchWithinPolygon function. This will show the markers in the polygon,
    // and hide any outside of it.
    drawingManager.addListener('overlaycomplete', function(event) {
        // First, check if there is an existing polygon.
        // If there is, get rid of it and remove the markers
        if (polygon) {
            polygon.setMap(null);
            hideMarkers(markers);
        }
        // Switching the drawing mode to the HAND (i.e., no longer drawing).
        drawingManager.setDrawingMode(null);
        // Creating a new editable polygon from the overlay.
        polygon = event.overlay;
        polygon.setEditable(true);
        // Searching within the polygon.
        searchWithinPolygon(polygon);
        // Make sure the search is re-done if the poly is changed.
        polygon.getPath().addListener('set_at', searchWithinPolygon);
        polygon.getPath().addListener('insert_at', searchWithinPolygon);
    });
    ko.applyBindings(new AppViewModel());

}

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {
    // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.marker != marker) {
        // Clear the infowindow content to give the streetview time to load.
        infowindow.setContent('');
        infowindow.marker = marker;
        // Make sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener('closeclick', function() {
            infowindow.marker = null;
        });
        var streetViewService = new google.maps.StreetViewService();
        var radius = 50;
        // In case the status is OK, which means the pano was found, compute the
        // position of the streetview image, then calculate the heading, then get a
        // panorama from that and set the options
        function getStreetView(data, status) {
            if (status == google.maps.StreetViewStatus.OK) {
                var nearStreetViewLocation = data.location.latLng;
                var heading = google.maps.geometry.spherical.computeHeading(
                    nearStreetViewLocation, marker.position);
                infowindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');
                var panoramaOptions = {
                    position: nearStreetViewLocation,
                    pov: {
                        heading: heading,
                        pitch: 30
                    }
                };
                var panorama = new google.maps.StreetViewPanorama(
                    document.getElementById('pano'), panoramaOptions);
            } else {
                infowindow.setContent('<div>' + marker.title + '</div>' +
                    '<div>No Street View Found</div>');
            }
        }
        // Use streetview service to get the closest streetview image within
        // 50 meters of the markers position
        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
        // Open the infowindow on the correct marker.
        infowindow.open(map, marker);
    }
}

// This function will loop through the markers array and display them all.
function showListings() {
    var bounds = new google.maps.LatLngBounds();
    // Extend the boundaries of the map for each marker and display the marker
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
        bounds.extend(markers[i].position);
    }
    map.fitBounds(bounds);
}

// This function will loop through the listings and hide them all.
function hideMarkers(markers) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
}

//This function will filter the visible markers (on the map) by the search term of the theater Brand
function filterMarkers(brand) {
    for (var i = 0; i < markers.length; i++) {
        // Set matching markers to visible
        marker = markers[i];
        if (marker.title.startsWith(brand) || brand.length === 0) {
            marker.setVisible(true);
        } else {
            marker.setVisible(false);
        }
    }
}

// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34));
    return markerImage;
}

// This shows and hides (respectively) the drawing options.
function toggleDrawing(drawingManager) {
    if (drawingManager.map) {
        drawingManager.setMap(null);
        // In case the user drew anything, get rid of the polygon
        if (polygon !== null) {
            polygon.setMap(null);
        }
    } else {
        drawingManager.setMap(map);
    }
}

// This function hides all markers outside the polygon,
// and shows only the ones within it. This is so that the
// user can specify an exact area of search.
function searchWithinPolygon() {
    for (var i = 0; i < markers.length; i++) {
        if (google.maps.geometry.poly.containsLocation(markers[i].position, polygon)) {
            markers[i].setMap(map);
        } else {
            markers[i].setMap(null);
        }
    }
}

// This function takes the input value in the find nearby area text input
// locates it, and then zooms into that area. This is so that the user can
// show all listings, then decide to focus on one area of the map.
function zoomToArea() {
    // Initialize the geocoder.
    var geocoder = new google.maps.Geocoder();
    // Get the address or place that the user entered.
    var address = document.getElementById('zoom-to-area-text').value;
    // Make sure the address isn't blank.
    if (address === '') {
        window.alert('You must enter an area, or address.');
    } else {
        // Geocode the address/area entered to get the center. Then, center the map
        // on it and zoom in
        geocoder.geocode({
            address: address,
            componentRestrictions: { locality: 'New York' }
        }, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                map.setCenter(results[0].geometry.location);
                map.setZoom(15);
            } else {
                window.alert('We could not find that location - try entering a more' +
                    ' specific place.');
            }
        });
    }
}

// This function allows the user to input a desired travel time, in
// minutes, and a travel mode, and a location - and only show the listings
// that are within that travel time (via that travel mode) of the location
function searchWithinTime() {
    // Initialize the distance matrix service.
    var distanceMatrixService = new google.maps.DistanceMatrixService;
    var address = document.getElementById('search-within-time-text').value;
    // Check to make sure the place entered isn't blank.
    if (address === '') {
        window.alert('You must enter an address.');
    } else {
        hideMarkers(markers);
        // Use the distance matrix service to calculate the duration of the
        // routes between all our markers, and the destination address entered
        // by the user. Then put all the origins into an origin matrix.
        var origins = [];
        for (var i = 0; i < markers.length; i++) {
            origins[i] = markers[i].position;
        }
        var destination = address;
        var mode = document.getElementById('mode').value;
        // Now that both the origins and destination are defined, get all the
        // info for the distances between them.
        distanceMatrixService.getDistanceMatrix({
            origins: origins,
            destinations: [destination],
            travelMode: google.maps.TravelMode[mode],
            unitSystem: google.maps.UnitSystem.IMPERIAL,
        }, function(response, status) {
            if (status !== google.maps.DistanceMatrixStatus.OK) {
                window.alert('Error was: ' + status);
            } else {
                displayMarkersWithinTime(response);
            }
        });
    }
}

// This function will go through each of the results, and,
// if the distance is LESS than the value in the picker, show it on the map.
function displayMarkersWithinTime(response) {
    var maxDuration = document.getElementById('max-duration').value;
    var origins = response.originAddresses;
    var destinations = response.destinationAddresses;
    // Parse through the results, and get the distance and duration of each.
    // Because there might be  multiple origins and destinations we have a nested loop
    // Then, make sure at least 1 result was found.
    var atLeastOne = false;
    for (var i = 0; i < origins.length; i++) {
        var results = response.rows[i].elements;
        for (var j = 0; j < results.length; j++) {
            var element = results[j];
            if (element.status === "OK") {
                // The distance is returned in feet, but the TEXT is in miles. If we wanted to switch
                // the function to show markers within a user-entered DISTANCE, we would need the
                // value for distance, but for now we only need the text.
                var distanceText = element.distance.text;
                // Duration value is given in seconds so we make it MINUTES. We need both the value
                // and the text.
                var duration = element.duration.value / 60;
                var durationText = element.duration.text;
                if (duration <= maxDuration) {
                    //the origin [i] should = the markers[i]
                    markers[i].setMap(map);
                    atLeastOne = true;
                    // Create a mini infowindow to open immediately and contain the
                    // distance and duration
                    var infowindow = new google.maps.InfoWindow({
                        content: durationText + ' away, ' + distanceText +
                            '<div><input type=\"button\" value=\"View Route\" onclick =' +
                            '\"displayDirections(&quot;' + origins[i] + '&quot;);\"></input></div>'
                    });
                    infowindow.open(map, markers[i]);
                    // Put this in so that this small window closes if the user clicks
                    // the marker, when the big infowindow opens
                    markers[i].infowindow = infowindow;
                    google.maps.event.addListener(markers[i], 'click', function() {
                        this.infowindow.close();
                    });
                }
            }
        }
    }
    if (!atLeastOne) {
        window.alert('We could not find any locations within that distance!');
    }
}

// This function is in response to the user selecting "show route" on one
// of the markers within the calculated distance. This will display the route
// on the map.
function displayDirections(origin) {
    hideMarkers(markers);
    var directionsService = new google.maps.DirectionsService;
    // Get the destination address from the user entered value.
    var destinationAddress =
        document.getElementById('search-within-time-text').value;
    // Get mode again from the user entered value.
    var mode = document.getElementById('mode').value;
    directionsService.route({
        // The origin is the passed in marker's position.
        origin: origin,
        // The destination is user entered address.
        destination: destinationAddress,
        travelMode: google.maps.TravelMode[mode]
    }, function(response, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            var directionsDisplay = new google.maps.DirectionsRenderer({
                map: map,
                directions: response,
                draggable: true,
                polylineOptions: {
                    strokeColor: 'green'
                }
            });
        } else {
            window.alert('Directions request failed due to ' + status);
        }
    });
}

// This function fires when the user selects a searchbox picklist item.
// It will do a nearby search using the selected query string or place.
function searchBoxPlaces(searchBox) {
    hideMarkers(placeMarkers);
    var places = searchBox.getPlaces();
    if (places.length === 0) {
        window.alert('We did not find any places matching that search!');
    } else {
        // For each place, get the icon, name and location.
        createMarkersForPlaces(places);
    }
}

// This function firest when the user select "go" on the places search.
// It will do a nearby search using the entered query string or place.
function textSearchPlaces() {
    var bounds = map.getBounds();
    hideMarkers(placeMarkers);
    var placesService = new google.maps.places.PlacesService(map);
    placesService.textSearch({
        query: document.getElementById('places-search').value,
        bounds: bounds
    }, function(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            createMarkersForPlaces(results);
        }
    });
}

// This function creates markers for each place found in either places search.
function createMarkersForPlaces(places) {
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < places.length; i++) {
        var place = places[i];
        var icon = {
            url: place.icon,
            size: new google.maps.Size(35, 35),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(15, 34),
            scaledSize: new google.maps.Size(25, 25)
        };
        // Create a marker for each place.
        var marker = new google.maps.Marker({
            map: map,
            icon: icon,
            title: place.name,
            position: place.geometry.location,
            id: place.place_id
        });
        // Create a single infowindow to be used with the place details information
        // so that only one is open at once.
        var placeInfoWindow = new google.maps.InfoWindow();
        // If a marker is clicked, do a place details search on it in the next function.
        marker.addListener('click', function() {
            if (placeInfoWindow.marker == this) {
                console.log("This infowindow already is on this marker!");
            } else {
                console.log(marker);
                getPlacesDetails(this, placeInfoWindow);
            }
        });
        placeMarkers.push(marker);
        if (place.geometry.viewport) {
            // Only geocodes have viewport.
            bounds.union(place.geometry.viewport);
        } else {
            bounds.extend(place.geometry.location);
        }
    }
    map.fitBounds(bounds);
}

// This is the PLACE DETAILS search - it's the most detailed so it's only
// executed when a marker is selected, indicating the user wants more
// details about that place.
function getPlacesDetails(marker, infowindow) {
    var service = new google.maps.places.PlacesService(map);
    service.getDetails({
        placeId: marker.id
    }, function(place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            // Set the marker property on this infowindow so it isn't created again.
            infowindow.marker = marker;
            var innerHTML = '<div>';
            if (place.name) {
                innerHTML += '<strong>' + place.name + '</strong>';
            }
            if (place.formatted_address) {
                innerHTML += '<br>' + place.formatted_address;
            }
            if (place.formatted_phone_number) {
                innerHTML += '<br>' + place.formatted_phone_number;
            }
            if (place.opening_hours) {
                innerHTML += '<br><br><strong>Hours:</strong><br>' +
                    place.opening_hours.weekday_text[0] + '<br>' +
                    place.opening_hours.weekday_text[1] + '<br>' +
                    place.opening_hours.weekday_text[2] + '<br>' +
                    place.opening_hours.weekday_text[3] + '<br>' +
                    place.opening_hours.weekday_text[4] + '<br>' +
                    place.opening_hours.weekday_text[5] + '<br>' +
                    place.opening_hours.weekday_text[6];
            }
            if (place.photos) {
                innerHTML += '<br><br><img src="' + place.photos[0].getUrl({ maxHeight: 100, maxWidth: 200 }) + '">';
            }
            innerHTML += '</div>';
            infowindow.setContent(innerHTML);
            infowindow.open(map, marker);
            // Make sure the marker property is cleared if the infowindow is closed.
            infowindow.addListener('closeclick', function() {
                infowindow.marker = null;
            });
        }
    });
}

/* ----------------------------------------------------------------------
   FOURSQUARE API - Get recommendations for food near selected marker
---------------------------------------------------------------------- */

function getFoursquare(marker) {

    var lat = marker.position.lat();
    var lng = marker.position.lng();

    var foursquareConfig = {
        client_id: 'BS2SBZYCWRNCKASPGYYQIJEF03GJSJDRIQZYPJB52GTXBS3L',
        client_secret: 'V5EW4FXDJL5SI3QNYF4YJDQFWRSZQ105GMQY1XT54A3CT514',
        v: '20180323',
        section: 'food',
        ll: lat + "," + lng,
        limit: '5'
    };

    var url = 'https://api.foursquare.com/v2/venues/explore?client_id=' + foursquareConfig.client_id + '&client_secret=' + foursquareConfig.client_secret + '&v=' + foursquareConfig.v + '&section=' + foursquareConfig.section + '&ll=' + foursquareConfig.ll + '&limit=' + foursquareConfig.limit;


    $.ajax({
        url: url,
        dataType: 'json',
        success: function(data) {
            var venues = data.response.groups[0].items;
            console.log(venues);
            $('.topfive').empty();
            $.each(venues, function(i, venue) {
                var fsURL = "";

                var venueURL = 'https://api.foursquare.com/v2/venues/' + venue.venue.id + '/?client_id=' + foursquareConfig.client_id + '&client_secret=' + foursquareConfig.client_secret + '&v=' + foursquareConfig.v;
                fsURL = getVenueLink(venueURL);
                console.log(fsURL)
                $('.topfive').append('<li><a href="' + fsURL + '">' + venue.venue.name + '</a></li>');
            });
        },
        error: function(data) {
            alert("Error with the Foursquare API. Please contact the webmaster. Sorry for the inconvenience.");
        }
    });

    function getVenueLink(fsurl) {

        $.ajax({
            url: fsurl,
            dataType: 'json',
            success: function(response) {
                var venueLink = response.response.venue.canonicalUrl;
                console.log(venueLink)
                return venueLink;
            },
            error: function(response) {
                alert("Foursquare API error. Please contact the webmaster.")
            }
        });
    }

}

// The ViewModel

// Create global variables used
var map, infoWindow;

// Create the Google Maps, centered in the neighbourhood and empty
map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 41.4029277, lng: 2.157448 },
    zoom: 17
});

// Create a function that will return us a place, with all its characteristics
var Place = function (data) {
    this.category = data.category;
    this.address = data.address;
    this.icon = data.icon;
    this.web = data.web;
    this.name = data.name;
    this.latitude = data.latitude;
    this.longitude = data.longitude;
    this.marker = null;
};

// Create the function to get information from the Yelp API, that we will call when we want to create the infoWindow
var yelpContent = function (name, icon, category, address, web, latitude, longitude, marker) {

    // Basic code for the Authentication of the Yelp API, gotten from an example of coach Mark in the Udacity Forums
    // Generates a random number and returns it as a string for OAuthentication 
    function nonce_generate() {
        return (Math.floor(Math.random() * 1e12).toString());
    }

    // We will use the Search API function
    var yelp_url = 'http://api.yelp.com/v2/search/';

    var parameters = {
        // First the parameters for authentication:
        // https://www.yelp.com/developers/documentation/v2/authentication
        oauth_consumer_key: '-r2e03Przr0NMhHmJIHYzQ',       // Your OAuth consumer key (from Manage API Access).
        oauth_token: 'uH6meisSMEHrR2SqqWcYli3DLd2iBeai',    // The access token obtained (from Manage API Access).
        oauth_nonce: nonce_generate(),                      // A unique string randomly generated per request.
        oauth_timestamp: Math.floor(Date.now() / 1000),     // Timestamp for the request in seconds since the Unix epoch.
        oauth_signature_method: 'HMAC-SHA1',
        oauth_version: '1.0',
        callback: 'cb',

        // Then the parameters for the search filters:
        // https://www.yelp.com/developers/documentation/v2/search_api              
        term: name,                                         // Search term. If term isn't included we search everything. The term also accepts business names.         
        limit: 1,                                           // Number of business results to return.
        location: '08012,Barcelona,Spain',                        // Specifies the combination of "address, neighborhood, city, state or zip, optional cuntry" to be used when searching for businesses.
        cll: latitude + ',' + longitude                     // Latitude + longitude parameter can be specified as a hint to the geocoder.
    };

    var encodedSignature = oauthSignature.generate('GET', yelp_url, parameters, 'G-1cK8iunIRG28AHNI2vYjW-jo0', 'ae9TrbJ_uPTA4qDLTs0RIuwG508');
    parameters.oauth_signature = encodedSignature;

    var settings = {
        url: yelp_url,
        data: parameters,
        cache: true,
        dataType: 'jsonp',
        success: function (results) {
            // Create a Google Maps InfoWindow object
            infoWindow = new google.maps.InfoWindow();

            // Put the information from the place object and from the Yelp API in a variable
            var content = '<div class="info-window">'
            if (results.businesses[0].image_url !== undefined) {
                content += '<img class="yelp-image" src="' + results.businesses[0].image_url + '">'
            }            
            content += '<i class="' + icon + '"></i>&nbsp;'
            content += '<span class="category">' + category + '</span>'
            content += '<h3>' + name + '</h3>'
            content += '<img src="' + results.businesses[0].rating_img_url + '">'
            content += '<p>' + address + '</p>'
            content += '<p><a class="yelp-link" href="' + web + '" target="_blank"><i class="fa fa-globe"></i> Visit website</a>&nbsp;|&nbsp;'
            content += '<a class="yelp-link" href="' + results.businesses[0].url + '" target="_blank"><i class="fa fa-yelp"></i> Visit Yelp site</a></p>'
            if (results.businesses[0].snippet_text !== undefined) {
                content += '<p class="yelp-snippet">' + results.businesses[0].snippet_text + '</p>'
            }            
            content += '</div>';

            // Put the content variable in the infoWindow and open the infoWindow
            infoWindow.setContent(content);
            infoWindow.open(map, marker);
        },
        error: function () {
            console.log("We have no Yelp info");
        }
    };

    // Send AJAX query via jQuery library.
    $.ajax(settings);
};

// Create the KO function, where we will put all the app
var ViewModel = function () {
    var self = this;

    // Create empty array, to put later the list of all the places
    self.allPlaces = [];

    // Loop through all the places in the places.js to put them on screen
    // This way, we have all the places loaded at the beginning
    places.forEach(function (place) {

        // Put the places into the list
        self.allPlaces.push(new Place(place));
    });

    self.allPlaces.forEach(function (place) {
        // Put the places into the Google Maps with markers
        place.marker = new google.maps.Marker({
            map: map,
            position: { lat: place.latitude, lng: place.longitude },
            title: place.name + ' (' + place.category + ')',
            animation: google.maps.Animation.DROP
        });

        // Add listener onto the marker, to bounce the marker when clicked
        place.marker.addListener('click', toggleMarker);

        // Create a function to bounce the marker, when we click into it or into the list
        function toggleMarker() {
            if (place.marker.getAnimation() !== null) {
                place.marker.setAnimation(null);
            } else {
                place.marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(function () {
                    place.marker.setAnimation(null);
                }, 2000);
            }
        }

        // Here we put the infowindow and open it when there is the click event
        google.maps.event.addListener(place.marker, 'click', function () {
            var yelpContentResult = yelpContent(place.name, place.icon, place.category, place.address, place.web, place.latitude, place.longitude, place.marker);

            // If the Yelp API gives us nothing, we create the infoWindow with the basic information only
            if (yelpContentResult === null) {
                // Create a Google Maps InfoWindow object
                infoWindow = new google.maps.InfoWindow();

                // Put all the html and the information from the place object in a variable
                var content = '<div class="info-window">'
                content += '<i class="' + place.icon + '"></i>&nbsp;'
                content += '<span class="category">' + place.category + '</span>'
                content += '<h3>' + place.name + '</h3>'
                content += '<p>' + place.address + '</p>'
                content += '<p><a class="yelp-link" href="' + place.web + '" target="_blank"><i class="fa fa-globe"></i> Visit website</a></p>'
                content += '<p>Yelp has no information for this place.</p>';
                content += '</div>';

                // Put the content variable in the infoWindow and open the infoWindow
                infoWindow.setContent(content);
                infoWindow.open(map, marker);
            }
        });

    });

    // In the HTML, we have put the click databind in the <li> so that, when clicked, this will initiate
    // We trigger the bounce in the map marker
    self.list = function (place, marker) {
        google.maps.event.trigger(place.marker, 'click');
    };

    // Places that should be visible, based on user input.
    self.filteredPlaces = ko.observableArray();

    // All places should be visible at first, so we put them in the visible list
    self.allPlaces.forEach(function (place) {
        self.filteredPlaces.push(place);
    });

    // Create empty variable, which will give us the user's search
    self.query = ko.observable('');

    // Function to filter
    self.filter = function () {

        // First we remove everything from the visible list
        self.filteredPlaces.removeAll();

        // For each of the items in our allPlaces array... 
        self.allPlaces.forEach(function (place) {

            // First we remove the marker
            place.marker.setVisible(false);

            // Then we compare the name of the place in the array, with the name in our search
            if (place.name.toLowerCase().indexOf(self.query().toLowerCase()) >= 0) {

                // If its the same, we push the place in the visible array (which we cleared)
                self.filteredPlaces.push(place);
            }
        });

        // Now we have the list of all the visible places, based on our query search
        self.filteredPlaces().forEach(function (place) {

            // And we put the markers visible for these places
            place.marker.setVisible(true);
        });
    };
};

ko.applyBindings(new ViewModel());
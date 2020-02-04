


chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.query == "checkPrice") {
            console.log(request.url);
            fetch(request.url)
                .then(response => {
                    response.text().then(value => sendResponse({ success: response.ok, status: response.status, body: value }));
                })
                .catch(error => {
                    console.log(error);
                })
            return true; // Will respond asynchronously.
        } else if(request.query == "checkUsedPrice") {
            console.log(request.url);
            fetch(request.url)
                .then(response => {
                    response.text().then(value => sendResponse({ success: response.ok, status: response.status, body: value }));
                })
                .catch(error => {
                    console.log(error);
                })
            return true; // Will respond asynchronously.
        } else if (request.query == "loadCurrencies") {
            // fetch('https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml')
            fetch('https://api.exchangerate-api.com/v4/latest/EUR')
                .then(response => response.text())
                .then(document => sendResponse({status:1, content:document}))
                .catch(error => {
                    console.log(error);
                })
            
            return true;
        } else if(request.query == "setDesiredCurrency") {
            localStorage['desiredCurrency'] = request.data;
            sendResponse({
                currency: request.data
            })
        } else if(request.query == "pullDesiredCurrency") {
            var desiredCurrency = localStorage.getItem("desiredCurrency");
            if(desiredCurrency == "undefined") {
                desiredCurrency = "USD";
            }
            localStorage['desiredCurrency'] = desiredCurrency;
            sendResponse({
                currency: desiredCurrency
            })
        } else if (request.query == "ipCoordinates") {
            //ip geolocation fallback, use message passing
            // $.get(, function (response) {
            //     console.log(response);
            //   }, "jsonp");
            
            // var xhr = new XMLHttpRequest();
            // xhr.onreadystatechange = function() {
            //     if (xhr.readyState == XMLHttpRequest.DONE) {
            //         sendresponse({success: "ok", status = 200, body: xhr.responseText});
            //     }
            // }
            // xhr.open('GET', 'https://api.ipdata.co?api-key=1233b6d72d768130d2a853b1e7533c5ddc54711d0cbde92c1581c011', true);
            // xhr.send(null);

        } else if (request.query == "countryFromCoordinates") {

            // var xhr = new XMLHttpRequest();
            // xhr.onreadystatechange = function() {
            //     if (xhr.readyState == XMLHttpRequest.DONE) {
            //         sendresponse({success: "ok", status = 200, body: xhr.responseText});
            //     }
            // }
            // xhr.open('GET', 'https://maps.googleapis.com/maps/api/geocode/json?latlng='+request.lat+','+request.long+'&key=AIzaSyAAASuXDSw5LhlzYnpYlsXNLKszbU7ZEsk', true);
            // xhr.send(null);

        }
    });
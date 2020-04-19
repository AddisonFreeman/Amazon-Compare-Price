


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
        } else if (request.query == "countryFromCoordinates") {
        }
    });
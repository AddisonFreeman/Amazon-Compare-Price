//jQuery ready block initializes compare object with current ASIN id of product
$(function () {
    var asin = $('#ASIN').val();
    if (asin == undefined)
        return;
    compare.initialize(asin);
});
//Parse query strings from the url and return a list with RegEx
var queryString = function (name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.search);
    if (results == null)
        return "";
    else
        return decodeURIComponent(results[1].replace(/\+/g, " "));
};
//Set the locaStorage value of the desired currency setting on the background script page
//this is necessary because if the user were to open a new tab, content script localSettings would be overwritten
function setDesiredCurrency(currency) {
    //sendMessage to background script
    chrome.runtime.sendMessage({ query: "setDesiredCurrency", data: currency } , function (response) {
        // console.log(response.currency);
        //also load in content script for temporary caching
        localStorage['desiredCurrency'] = response.currency;
    });
}
//Pull the currently set currency from the background page 
//this operation is done during initialization
function pullDesiredCurrency() {
    chrome.runtime.sendMessage({ query: "pullDesiredCurrency" }, function (response) {
        localStorage['desiredCurrency'] = response.currency;
        var desiredCurrency = response.currency;
        Settings.desiredCurrency = desiredCurrency;
        Settings.desiredCulture = currencyCultureMap[desiredCurrency];
        //When the page is loaded and ready
        $(document).ready(() => {
            //Event listener to handle which used option is selected
            //fallback for timed out message response
            setTimeout(() => {
                var desiredCurrency = localStorage.getItem("desiredCurrency");
                //construct select dropdown for currency options
                Object.keys(currencies).forEach((item) => {
                    //set the currently desired currency as the default
                    if(currencies[item] === desiredCurrency) {
                        // console.log(currencies[item]);
                        $('#currency-select').prepend(`<li class="amz-option" value="${currencies[item]}"><span class="flag-icon flag-icon-${currencies[item].toLowerCase().slice(0, -1)}"></span> ${item}</li>`)
                    } else {
                        //all other currencies
                        $('#currency-select').append(`<li class="amz-option" value="${currencies[item]}"><span class="flag-icon flag-icon-${currencies[item].toLowerCase().slice(0, -1)}"></span> ${item}</li>`)
                    }
                });
                //if the desired currency changes, set that value in localStorage
                $('ul#currency-select').click(function() {
                    if($(this).hasClass("expanded")) {
                        $(this).removeClass("expanded").addClass("collapsed");
                        $(this).css({"background-image":"url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E');"});
                    } else {
                        $(this).removeClass("collapsed").addClass("expanded");
                        $(this).css({"background-image":"none"});
                    }
                });

                $('.amz-select ul li.amz-option').click(function() {
                    //if index is zero this is an opening action 
                        var idx = $("li.amz-option").index(this);
                        if(idx === 0) {
                            return;
                        }
                        $(this).parent().css({"background-image":"url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E');"});
                        let currency = $(this).attr("value");
                        $(this).parent().prepend(this);
                        setDesiredCurrency(currency);
                        this.desiredCurrency = currency;
                        this.desiredCulture = currencyCultureMap[currency];
                        location.reload();      
                });
            }, 200);

        });

    });
}

//Various currencies' rates to EUR
window.Rates = {
    timestamp: new Date(),
    'EUR': 1,
    'AED': 0,
    'USD': 0,
    'JPY': 0,
    'BGN': 0,
    'CZK': 0,
    'DKK': 0,
    'GBP': 0,
    'HUF': 0,
    'LTL': 0,
    'LVL': 0,
    'PLN': 0,
    'RON': 0,
    'SEK': 0,
    'CHF': 0,
    'NOK': 0,
    'HRK': 0,
    'RUB': 0,
    'TRY': 0,
    'AUD': 0,
    'BRL': 0,
    'CAD': 0,
    'CNY': 0,
    'HKD': 0,
    'IDR': 0,
    'ILS': 0,
    'INR': 0,
    'KRW': 0,
    'MXN': 0,
    'MYR': 0,
    'NZD': 0,
    'PHP': 0,
    'SGD': 0,
    'THB': 0,
    'ZAR': 0
};
//all currency options
let currencies = {
    'U.S. Dollar': 'USD',
    'Euro': 'EUR',
    'Canadian Dollar': 'CAD',
    'Mexican Peso': 'MXN',
    'British Pound': 'GBP',
    'Australian Dollar': 'AUD',
    'Indian Rupee': 'INR',
    'South Korean Won': 'KRW',
    'Brazilian Real': 'BRL',
    'Japanese Yen': 'JPY',
    'Turkish Lira': 'TRY',
    'Chinese Yuan': 'CNY',
    'Singapore Dollar':'SGD',
    'United Arab Emirates':'AED'
};
//map to connect currency to cultures
let currencyCultureMap = {
    'USD': 'en-US',
    'EUR': 'it',
    'CAD': 'en-CA',
    'MXN': 'es-MX',
    'GBP': 'en-GB',
    'AUD': 'en-AU',
    'INR': 'hi-IN',
    'KRW': 'ko-KR',
    'BRL': 'pt-BR',
    'JPY': 'ja-JP',
    'TRY': 'tr-TR',
    'CNY': 'ii-CN',
    'SGD': 'en-SG',
    'AED': 'ar-AE'
}
//get currency conversion rates from API in background script
function refreshRates() {
    //get the cached rates from localStorage if not longer than 7 hours
    var cachedRates = JSON.parse(localStorage.getItem("conversionRates"));
    if (cachedRates != null && cachedRates.timestamp != undefined) {
        cachedRates.timestamp = new Date(cachedRates.timestamp);
        Rates = cachedRates;
        var ageInHours = (new Date() - cachedRates.timestamp) / 1000 / 60 / 60;
        if (ageInHours < 7)
            return;
    }
    //load currencies from API via background script
    chrome.runtime.sendMessage({ query: "loadCurrencies" }, function (response) {
        var ratesAPI = JSON.parse(response.content)["rates"];
        //add rates to global currency object
        for (var rate in Rates) {
            if (typeof rate !== 'string' || rate === 'EUR')
                continue;
            Rates[rate] = ratesAPI[rate];
        }
        //set current date for timeout calculation
        Rates.timestamp = new Date();
        //commit to localStorage
        localStorage["conversionRates"] = JSON.stringify(Rates);
        console.log('new rates: ', Rates);
    });
}
//Money object to store locale settings
var Money = function (amount, currency, culture, extraAmount) {
    this.amount = amount;
    this.extraAmount = extraAmount;
    this.currency = currency;
    this.culture = culture;
};
//Override for function to allow currency conversion between cultures
Money.prototype["for"] = function (currency, culture) {
    //calculate rate
    var rate = Rates[currency] / Rates[this.currency];
    var convertedAmount = this.amount * rate;
    //extraAmount not used
    var convertedExtraAmount = this.extraAmount !== undefined ? this.extraAmount * rate : undefined;
    return new Money(convertedAmount, currency, culture, convertedExtraAmount);
};
//toString override to format currency as text
Money.prototype.toString = function () {
    if (this.extraAmount === undefined)
        return Globalize.format(this.amount, "c", this.culture);
    else
        return Globalize.format(this.amount, "c", this.culture) + ' - ' + Globalize.format(this.extraAmount, "c", this.culture);
};
//Global object to identify amazon page settings and info
var Shop = function (id, title, domain, base_url, currency, culture) {
    this.id = id;
    this.title = title;
    this.domain = domain;
    this.base_url = base_url;
    this.url = this.base_url;
    this.currency = currency;
    this.culture = culture;
    this.setAsin = function (asin) {
        this.url = this.urlFor(asin);
        this.asin = asin;
    };
    this.urlFor = function (asin) {
        return this.base_url.replace('{asin}', asin);
    };
    this.moneyFrom = function (amount) {
        var culture = this.culture;
        //don't allow price ranges
        if (amount.indexOf('-') == -1) {
            var sanitizedAmount = Globalize.parseFloat(amount.replace(/[^\d^,^.]/g, ''), culture);
            return new Money(sanitizedAmount, this.currency, culture);
        }
        //remove special decimal and money characters from number values
        var sanitizedAmounts = amount.split('-').map(function (a) {
            return Globalize.parseFloat(a.replace(/[^\d^,^.]/g, ''), culture);
        });
        return new Money(sanitizedAmounts[0], this.currency, culture, sanitizedAmounts[1]);
    };
};
//helper function to cast money to number object
function dollarToNumber(dollarAmt) {
    return Number(dollarAmt.slice(1,dollarAmt.length));
}

function getBestPriceLink(bestPrice) {
    var priceList = document.querySelectorAll(".compare-price");
    for (let i = 0; i < priceList.length; i++) {
      if(priceList[i].textContent === bestPrice) {
          var bestLink = $(priceList[i]).siblings('a.compare-link').attr('href');
          return bestLink;
      }
    }
}
//global Settings object with culture map connecting store urls to locales
var Settings = function (asin) {
    this.asin = asin;
    //all shops to scrape from
    this.shops = [
        new Shop(1, 'amazon.com', 'www.amazon.com', 'https://www.amazon.com/dp/{asin}?', 'USD', 'en-US'),
        new Shop(2, 'amazon.ca', 'www.amazon.ca', 'https://www.amazon.ca/dp/{asin}?', 'CAD', 'en-CA'),
        new Shop(3, 'amazon.com.mx', 'www.amazon.com.mx', 'https://www.amazon.com.mx/dp/{asin}?', 'MXN', 'es-MX'),
        new Shop(4, 'amazon.co.uk', 'www.amazon.co.uk', 'https://www.amazon.co.uk/dp/{asin}?', 'GBP', 'en-GB'),
        new Shop(5, 'amazon.com.au', 'www.amazon.com.au', 'https://www.amazon.com.au/dp/{asin}?', 'AUD', 'en-AU'),
        new Shop(6, 'amazon.in', 'www.amazon.in', 'https://www.amazon.in/dp/{asin}?', 'INR', 'hi-IN'),
        new Shop(7, 'amazon.de', 'www.amazon.de', 'https://www.amazon.de/dp/{asin}?', 'EUR', 'de'),
        new Shop(8, 'amazon.fr', 'www.amazon.fr', 'https://www.amazon.fr/dp/{asin}?', 'EUR', 'fr'),
        new Shop(9, 'amazon.es', 'www.amazon.es', 'https://www.amazon.es/dp/{asin}?', 'EUR', 'es'),
        new Shop(10, 'amazon.it', 'www.amazon.it', 'https://www.amazon.it/dp/{asin}?', 'EUR', 'it'),
        new Shop(11, 'amazon.com.br', 'www.amazon.com.br', 'https://www.amazon.com.br/dp/{asin}?', 'BRL', 'pt-BR'),
        new Shop(12, 'amazon.co.jp', 'www.amazon.co.jp', 'https://www.amazon.co.jp/dp/{asin}?', 'JPY', 'ja-JP'),
        new Shop(13, 'amazon.com.tr', 'www.amazon.com.tr', 'https://www.amazon.com.tr/dp/{asin}?', 'TRY', 'tr-TR'),
        new Shop(14, 'amazon.cn', 'www.amazon.cn', 'https://www.amazon.cn/dp/{asin}?', 'CNY', 'ii-CN'),
        new Shop(15, 'amazon.sg', 'www.amazon.sg', 'https://www.amazon.sg/dp/{asin}?', 'SGD', 'en-SG'),
        new Shop(16, 'amazon.ae', 'www.amazon.ae', 'https://www.amazon.ae/dp/{asin}?', 'AED', 'ar-AE'),
    ];
    //set ASIN for each shop
    this.shops.forEach(function (shop) { shop.setAsin(asin); });
    //retrieve desired currency from content script
    var desiredCurrency = localStorage.getItem("desiredCurrency");
    //default desired currency to USD if not previously set
    if(desiredCurrency === "null") {
        //set desired currency to current locale if window.location.host is recognized
        this.shops.forEach(function (shop) {
           if(window.location.host === "www."+shop.title) {
            this.desiredCurrency = shop.currency;
            this.desiredCulture = shop.culture;
            // setTimeout(() => {
            //     document.getElementById('currency-select').value=shop.currency;
            // }, 1000);
            setDesiredCurrency(shop.currency);
            localStorage['desiredCurrency'] = shop.currency;
            location.reload();
           } 
        });
    } else {
        this.desiredCurrency = desiredCurrency;
        this.desiredCulture = currencyCultureMap[desiredCurrency];
    }
    //filter 
    this.currentShop = this.shops.filter(function (shop) { return shop.domain == document.domain; })[0];
    if (this.currentShop.currency != this.desiredCurrency) {
        this.filteredShops = this.shops;
    } else {
        this.filteredShops = this.shops.filter(function (shop) {
            return shop.domain != document.domain;
        });
    }
    //current locale shop info
    this.shop = function (id) {
        var shopById = this.shops.filter(function (shop) { return shop.id == id; });
        if (shopById.length == 1)
            return shopById[0];
        return null;
    };
    this.image = function (file) {
        return chrome.extension.getURL('/images/' + file);
    };
    //get best price for current region
    this.calculateBestPrice = function() {
        var priceArray = [];
        var len = this.shops.length;
        //current page region
        var host = window.location.host.replace("www.","");
        //slight delay to allow page elements to load
        setTimeout(() => {
            //iterate over each locate and compare prices
            $.each(this.shops, function (index, shop) {
                var $shopInfo = $('#compare-shop-' + shop.id);
                //get price info from background script
                pageScraper.getPriceOn(shop, function (price) { 
                    //display price in tooltip
                    page.displayPrice($shopInfo, shop.moneyFrom(price)); 
                    //price parsing for ranges, only compare lowest price
                    if(price.includes(' - ')) {
                        price = price.slice(0, price.indexOf(' - '));    
                    }
                    //two values to compare, minPrice is price on page, convertedPrice is price from foreach loop
                    var convertedPrice = page.returnPrice($shopInfo, shop.moneyFrom(price));
                    var minPrice = $('#temp-compare')[0].innerText;
                    //if no minPrice, set absurdly high so that convertedPrice will be selected in the compare
                    if(minPrice === NaN || minPrice === "Calculating...") {
                        minPrice = "999999999999";
                    }
                    //parse into Number format for comparision
                    var compareCurrentPrice = Number(convertedPrice.slice(1,convertedPrice.length).replace(",","").replace("$","").replace(".","").replace("TL","").replace("ED","").replace("₩","").replace("¥",""));
                    var compareMinPrice = Number(minPrice.slice(1,minPrice.length).replace(",","").replace("$","").replace(".","").replace("TL","").replace("ED","").replace("₩","").replace("¥",""));
                    //get desired locale to format appropriate monetary sign
                    var desiredCurrency = localStorage.getItem("desiredCurrency");

                    if(compareCurrentPrice < compareMinPrice) {
                        //display value in compare box as iterated over
                        $('#temp-compare')[0].innerText = convertedPrice;
                        //show best region if comparing current site
                        if(host === shop.title && compareCurrentPrice < compareMinPrice) {
                            $('#compare-region button')[0].innerText = "Best Region";
                        } else {
                            // getBestPriceLink(convertedPrice)
                            //format with dollar sign for these locals
                            if(desiredCurrency === 'USD' || 
                               desiredCurrency === 'CAD' || 
                               desiredCurrency === 'AUS' || 
                               desiredCurrency === 'MXD' || 
                               desiredCurrency === 'SGD'
                              ) {
                                //Clarify currency with region
                                $('#compare-region button')[0].innerHTML = convertedPrice+'<span class="smallCurrency">('+desiredCurrency+')</span>';
                                //put link in region button later, set data attribute now
                                $('#compare-region button')[0].dataset.pricelink = getBestPriceLink(convertedPrice);
                            } else {
                                //Show regular price
                                $('#compare-region button')[0].innerHTML = convertedPrice;
                                //put link in region button later, set data attribute now
                                $('#compare-region button')[0].dataset.pricelink = getBestPriceLink(convertedPrice);
                            }
                        }
                    }
                }, function (warning, addNotFoundClass) { 
                    page.displayWarning($shopInfo, warning, addNotFoundClass); 
                });
            });
            //interval to determine when all locales are loaded by checking for img element in tooltip
            var timerID = setInterval(() => {
                var finished = [...document.querySelectorAll(".compare-price")]
                if(finished.every((elem) => {
                    return $(elem).find("img").length == 0;
                })) {
                    clearInterval(timerID);
                    //add class to make button background green on completed crawl
                    $('#compare-region button').removeClass("pending-price-scan");
                    $('#compare-region button').addClass("completed-price-scan");
                    setTimeout(() => {
                        var bestPrice = $('#compare-region button').innerText;
                        // bestPrice = bestPrice.substring(0, bestPrice.indexOf('<span'));
                        // console.log(bestPrice);
                        $('.completed-price-scan').on('click',(e) => {
                            //best-region button will open the best region page in a new tab if available
                            if(e.target.tagname === "SPAN") {
                                if(e.target.parentNode.innerText !== "Best Region") {        
                                    e.target.parentNode.style['pointer-events'] = "auto";
                                    window.open($(e.target).parent().data('pricelink'),'_blank');    
                                } else {
                                    e.target.parentNode.style['pointer-events'] = "none";
                                }
                            } else {
                                if(e.target.innerText !== "Best Region") {        
                                    e.target.style['pointer-events'] = "auto";
                                    window.open($(e.target).data('pricelink'),'_blank');
                                } else {
                                    e.target.style['pointer-events'] = "none";
                                }
                            }
                        });
                    }, 500);
                } 
            },0);
        }, 500);
    }
};

var pageScraper = {
    //object for scraping other pages
    warning: {
        networkError: 'Network error',
        unavailable: 'Unavailable',
        notFound: 'Not found',
        multipleOptions: 'Multiple options'
    },

    getPriceOn: function (shop, displayPrice, displayWarning) {
        //strip &ref from URLs
        shop.url = shop.url.replace("&psc=1","");
        //pass metadata and reconstruct the url in background.js, as per Google's recommendation
        chrome.runtime.sendMessage({ query: "checkPrice", url: shop.url }, 
        function (response) {
            if (response.success) {
                var regex = /[nb]\s*?id="priceblock_[\w]*?price".*?>(.*?)</img;
                var cursorPrice = regex.exec(response.body);
                var price = null;
                while (cursorPrice != null) {
                    price = cursorPrice;
                    cursorPrice = regex.exec(response.body);
                }
                if (price != null && price.length == 2) {
                    displayPrice(price[1]);
                    var parser = new DOMParser();
                    var htmlDoc = parser.parseFromString(response.body, 'text/html');
                    var deliveryErr = htmlDoc.querySelectorAll('#dynamicDeliveryMessage .a-color-error');
                    
                    if(deliveryErr.length === 0) {
                        var $shopInfo = $('#compare-shop-' + shop.id);
                        var compareContainer = $shopInfo.parent().find('.compare-link');
                        //add airplane icon iff no shipping errors
                        if(compareContainer.find('span').length === 0)
                            compareContainer.append("<span title=\"Ships to your location\" class=\"airIcon\"> ✈️ </span>");
                    }
                    return;
                }
                displayWarning(pageScraper.warning.unavailable, false);
            }
            else {
                if (response.status == 404)
                    displayWarning(pageScraper.warning.notFound, true);
                else
                    displayWarning(pageScraper.warning.networkError, false);
            }
        });
    }
};

var tooltip = {
    _mouseIsOnIcon: false,
    _mouseIsOnTooltip: false,
    registerShowHideHandlers: function () {
        this._genericRegisterShowHideHandlers($('.compare-tooltip'), function (on) { tooltip._mouseIsOnTooltip = on; });
        this._genericRegisterShowHideHandlers($('#compare-region'), function (on) { tooltip._mouseIsOnIcon = on; });
        this._genericRegisterShowHideHandlersPrice($('.price-tooltip'), function (on) { tooltip._mouseIsOnTooltip = on; });
        this._genericRegisterShowHideHandlersPrice($('#compare-icon'), function (on) { tooltip._mouseIsOnIcon = on; });
    },
    _genericRegisterShowHideHandlers: function ($selector, isOn) {
        $selector
        .mouseenter(function () {
            $('.compare-tooltip').show();
            $('.price-tooltip').hide();
            isOn(true);
        })
        .mouseleave(function () {
            isOn(false);
            setTimeout(function () {
                if (!tooltip._mouseIsOnIcon && !tooltip._mouseIsOnTooltip)
                    $('.compare-tooltip').hide();
                    $('.amz-select ul#currency-select').removeClass("expanded").addClass("collapsed");
            }, 100);
        });
    },
    _genericRegisterShowHideHandlersPrice: function ($selector, isOn) {
        $selector
            .mouseenter(function () {
            $('.price-tooltip').show();
            $('.compare-tooltip').hide();
            isOn(true);
        })
        .mouseleave(function () {
            isOn(false);
            setTimeout(function () {
                if (!tooltip._mouseIsOnIcon && !tooltip._mouseIsOnTooltip)
                    $('.price-tooltip').hide();
            }, 100);
        });
    },    
    findNewUsedPrice: function () {
        var $tries = [
            $('#olp-upd-new-used .a-color-price'),
            $('#olp-upd-new .a-color-price'),
            $('#olp-upd-used .a-color-price'),
            $('#olp-upd-new-freeshipping .a-color-price'),
            $('#olp-upd-new-used-freeshipping .a-color-price'),
            $('#olp-new .a-color-price')
        ];
        for (var i = 0; i < $tries.length; i++) {
            if ($tries[i].length > 0)
                return $tries[i];
        }
        return null;
        throw new Error('Unable to find the price section.');
    },
    findListedPrice: function () {
        var $tries = [
            $('span#priceblock_saleprice.a-color-price'),
            $('span#priceblock_ourprice.a-color-price')
        ];
        for (var i = 0; i < $tries.length; i++) {
            if ($tries[i].length > 0)
                return $tries[i];
        }
        return null;
        throw new Error('Unable to find the price section.');
    }
};

function formatPriceToNumber(priceString) {
    return Number(priceString.slice(1,priceString.length).replace(",","").replace("$","").replace(".","").replace("TL","").replace("ED",""));
}

var page = {
    addTooltipToPage: function (tooltipMarkup) {
        var $placeholderMarkup = $('<img id="compare-placeholder" src="' + settings.image('placeholder.png') + '" alt="Placeholder" />');
        // var $placeholderMarkup = $('<div id="compare-placeholder"></div>');
        // var $imageMarkup = $('<img id="compare-icon" src="' + settings.image('icon.png') + '" alt="Hover to see the prices of the other stores" />');
        var usedPrice = tooltip.findNewUsedPrice();
        var listPrice = tooltip.findListedPrice();
        var label = "";

        if(usedPrice !== null && listPrice !== null) {
            usedPrice = usedPrice.html();
            listPrice = listPrice.html();
            label = usedPrice;
            // console.log(listPrice);

            var link = tooltip.findNewUsedPrice()[0].previousElementSibling;
            if(link !== null) {
                link = link.href;
            } else {
                link = tooltip.findNewUsedPrice()[0].parentNode.href;
            }
            chrome.runtime.sendMessage({ query: "checkUsedPrice", url: link },
                // parse response
            function (response) {
                if (response.success) {
                    //parse all used prices and first cheapest new price
                    var firstNew = $(response.body).find(".olpCondition").filter(function() {
                        return $(this).text().trim() === "New";
                    }); 
                    // get condition of new price (to support other conditions in the future)
                    var condition = firstNew[0].innerText.trim();
                    //set condition in tooltip
                    $(".amz_condition").text(condition);
                    var bestNewPrice = $(firstNew[0]).parent().parent().siblings(".olpPriceColumn").find(".olpOfferPrice");
                    var isPrime = $(bestNewPrice).find(".a-icon-prime").length > 0;
                    if(isPrime) {
                        $(".best_arrive").html("Includes PRIME Shipping");
                    }
                    var bestNewPriceFormatted = bestNewPrice[0].innerText.trim();
                    // set price total in popup
                    $(".amz_total").html(listPrice);
                    $(".amz_price").html(listPrice);
                    $(".best_price").html(bestNewPriceFormatted);
                    $(".best_total").html(bestNewPriceFormatted);
                    $("#compare-icon button").html(bestNewPriceFormatted);
                    // var bestUsedNum = dollarToNumber(usedPrice);
                    // var usedTotal = bestUsedNum;
                    // var amzPrice = dollarToNumber(listPrice);
                    //set price difference in popup

                    var numberListPrice = formatPriceToNumber(listPrice);
                    var numberUsedPrice = formatPriceToNumber(bestNewPriceFormatted);
                    var difference = (Math.round((numberListPrice - numberUsedPrice)) / 100).toFixed(2);
                    console.log(numberListPrice);
                    console.log(numberUsedPrice);
                    console.log(difference);
                    //set other totals
                    
                    // $(".best_price").html(usedPrice);
                    
    
                    // https://www.amazon.com/gp/aws/cart/add.html?ASIN.1=B072HS2CJN&Quantity.1=1
                    $(".best_save_link").attr("href","https://"+settings.currentShop.domain+"/gp/aws/cart/add.html?ASIN.1="+compare.asin+"&Quantity.1="+$("#quantity")[0].value);
                    $(".best_save").html("save $"+difference);
                } else {
                    if (response.status == 404) {
                        // displayWarning(pageScraper.warning.notFound, true);
                    } else {
                        // displayWarning(pageScraper.warning.networkError, false);
                    }
                }
            });
            if(listPrice !== null) {
                // console.log(listPrice[0].innerHTML);
                // listPrice = listPrice[0].innerHTML;
                tmpListPrice = formatPriceToNumber(listPrice);
                // console.log(tmpListPrice);
                var cmpUsedPrice = formatPriceToNumber(usedPrice);
                // console.log(cmpUsedPrice);
                if(tmpListPrice <= cmpUsedPrice) {
                    label = "Best Price";
                }  else {
                    // label = "New Only";
                }
            } else {
                label = "New Only";
            }
        } else {
                label = "New Only";
        }
        
        //compare best used price with current page's price
        var $imageMarkup = $('<div id="compare-container"> <div id="compare-icon"><button>'+label+'</button></div><div id="compare-region"><div id="temp-compare" class="hidden">Calculating...</div><button class="pending-price-scan">Calculating...</button></div></div>');
        var $container = this.findAppropriateTooltipContainer();
        $container.append($imageMarkup);
        $container.append(tooltipMarkup);
        tooltip.registerShowHideHandlers();
    },
    findAppropriateTooltipContainer: function () {
        var $tries = [
            $('#price').parent(),
            $('table.product .priceLarge:first',
            $('#priceBlock')),
            $('#priceblock_dealprice'),
            $('#priceblock_saleprice'),
            $('#priceblock_pospromoprice'),
            $('#priceblock_ourprice'),
            $('#availability_feature_div > #availability > .a-color-price'),
            $('div.buying span.availGreen', $('#handleBuy')),
            $('div.buying span.availRed:nth-child(2)', $('#handleBuy')),
            $('#availability_feature_div')
        ];
        for (var i = 0; i < $tries.length; i++) {
            if ($tries[i].length > 0)
                return $tries[i];
        }
        throw new Error('Unable to find the price section.');
    },
    displayPrice: function ($shopInfo, price) {
        var convertedPrice = price["for"](settings.desiredCurrency, settings.desiredCulture);
        $shopInfo.text(convertedPrice.toString());
        return convertedPrice.toString();
    },
    returnPrice: function ($shopInfo, price) {
        var convertedPrice = price["for"](settings.desiredCurrency, settings.desiredCulture);
        return convertedPrice.toString();
    },
    displayWarning: function ($shopInfo, warning, addNotFoundClass) {
        $shopInfo
            .text(warning)
            .addClass('compare-warning');
        if (addNotFoundClass)
            $shopInfo.parent().addClass('compare-not-found');
    },
    addOptionalBackLink: function () {
        var from = queryString('compare-from');
        var asin = queryString('compare-from-asin');
        if (from == '' || asin == '')
            return;
        var shop = settings.shop(from);
        if (shop == null)
            return;
        $('form#handleBuy').prepend('<span class="back-link"> <img src="' + settings.image('return.png') + '" /> <a href="' + shop.urlFor(asin) + '"  >return to ' + shop.title + '</a> </span>');
    },
    registerInitializationHandler: function (shops) {
        $('#compare-region').mouseover(function () {
            if (window.compare_tooltipInitialized != undefined && window.compare_tooltipInitialized != false)
                return;
            window.compare_tooltipInitialized = true;
            $.each(shops, function (index, shop) {
                var $shopInfo = $('#compare-shop-' + shop.id);
                pageScraper.getPriceOn(shop, function (price) { 
                    page.displayPrice($shopInfo, shop.moneyFrom(price)); 
                }, function (warning, addNotFoundClass) { 
                    page.displayWarning($shopInfo, warning, addNotFoundClass); 
                });
            });
        });
    }
};

var settings;
var compare = {
    tooltip: null,
    asin: null,
    _startMonitoringAsin: function () {
        var observer = new MutationObserver(function (mutations) {
            var asinHasProbablyChanged = mutations.some(function (mutation) {
                return mutation.addedNodes.length > 0;
            });
            if (!asinHasProbablyChanged)
                return;
            var newAsin = $('#ASIN').val();
            if (compare.asin == newAsin)
                return;
            compare.run(newAsin);
        });
        //observe the parent of some content that will change whenever a twister option is changed, and that itself will remain unchanged (otherwise we lose the link)
        //and we don't want it to change too often, so the right add-to-basket column it is
        observer.observe($('#rightCol')[0], { attributes: true, subtree: true, childList: true, characterData: true });
    },
    initialize: function (asin) {
        pullDesiredCurrency();
        this.asin = asin;
        this._startMonitoringAsin();
        refreshRates();
        settings = new Settings(asin);
        settings.calculateBestPrice();
        page.addOptionalBackLink();
        $.get(chrome.extension.getURL("tooltip.html"), function (tooltipTemplate) {
            compare.tooltip = Mustache.to_html(tooltipTemplate, {
                shops: settings.filteredShops,
                from_shop: settings.currentShop.id,
                from_asin: settings.asin,
                loader_url: chrome.extension.getURL('/images/loader.gif')
            });
            compare.run(asin);
        }, 'html');
        
    },
    destroy: function() {
        $("#compare-container").remove();
        $(".compare-tooltip").remove();
    },
    run: function (asin) {
        this.asin = asin;
        settings = new Settings(asin);
        window.compare_tooltipInitialized = false;
        var ensureTooltipHasBeenLoaded = function () {
            if (compare.tooltip == null) {
                setTimeout(ensureTooltipHasBeenLoaded, 50);
            }
            else {
                var tooltipMarkup = compare.tooltip.replace(/{asin}/gm, settings.asin);
                page.addTooltipToPage(tooltipMarkup);
                page.registerInitializationHandler(settings.filteredShops);
            }
        };
        ensureTooltipHasBeenLoaded();
    }
};
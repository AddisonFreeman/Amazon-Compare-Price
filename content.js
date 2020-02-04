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
        console.log(response.currency);
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
            $(".div-block").click((el) => {
                $(".div-block").removeClass("selected"); //remove from all
                $(el).addClass("selected"); //add to current
            });
            //fallback for timed out message response
            setTimeout(() => {
                var desiredCurrency = localStorage.getItem("desiredCurrency");
                //construct select dropdown for currency options
                Object.keys(currencies).forEach((item) => {
                    //set the currently desired currency as the default
                    if(currencies[item] === desiredCurrency) {
                        $('#currency-select').append(`<option selected value="${currencies[item]}">${item}</option>`)
                    } else {
                        //all other currencies
                        $('#currency-select').append(`<option value="${currencies[item]}">${item}</option>`)
                    }
                });
                //if the desired currency changes, set that value in localStorage
                document.getElementById("currency-select").addEventListener('change', function() {
                  let currency = this.value;
                  setDesiredCurrency(currency);
                  this.desiredCurrency = currency;
                  this.desiredCulture = currencyCultureMap[currency];
                  //reload the page to update the price calculations
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
    'Brazilian Real': 'BRL',
    'Japanese Yen': 'JPY',
    'Turkish Lira': 'TRY',
    'Chinese Yuan (Renminbi)': 'CNY',
    'Singapore Dollar':'SGD',
    'United Arab Emirates Dirham':'AED'
};
//map to connect currency to cultures
let currencyCultureMap = {
    'USD': 'en-US',
    'EUR': 'it',
    'CAD': 'en-CA',
    'MXN': 'es-MX',
    'GBP': 'en-GB',
    'AUD': 'en-AU',
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
//global Settings object with culture map connecting store urls to locales
var Settings = function (asin) {
    this.asin = asin;
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
            setTimeout(() => {
                document.getElementById('currency-select').value=shop.currency;
            }, 1000);
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
                    var compareCurrentPrice = Number(convertedPrice.slice(1,convertedPrice.length).replace(",","").replace("$","").replace(".","").replace("TL","").replace("ED",""));
                    var compareMinPrice = Number(minPrice.slice(1,minPrice.length).replace(",","").replace("$","").replace(".","").replace("TL","").replace("ED",""));
                    //get desired locale to format appropriate monetary sign
                    var desiredCurrency = localStorage.getItem("desiredCurrency");
                    // console.log(compareCurrentPrice);
                    // console.log(compareMinPrice);
                    // console.log(' ');
                    if(compareCurrentPrice < compareMinPrice) {
                        //display value in compare box as iterated over
                        $('#temp-compare')[0].innerText = convertedPrice;
                        //show best region if comparing current site
                        if(host == shop.title) {
                            if(convertedPrice < minPrice)
                                $('#compare-region button')[0].innerText = "Best Region";
                        } else {
                            //format with dollar sign for these locals
                            if(desiredCurrency === 'USD' || 
                               desiredCurrency === 'CAD' || 
                               desiredCurrency === 'AUS' || 
                               desiredCurrency === 'MXD' || 
                               desiredCurrency === 'SGD'
                              ) {
                                //Clarify currency with region
                                $('#compare-region button')[0].innerHTML = convertedPrice+'<span class="smallCurrency">('+desiredCurrency+')</span>';
                            } else {
                                //Show regular price
                                $('#compare-region button')[0].innerHTML = convertedPrice;
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
                } 
            },0);
        }, 500);
    }
};

var pageScraper = {
    warning: {
        networkError: 'Network error',
        unavailable: 'Unavailable',
        notFound: 'Not found',
        multipleOptions: 'Multiple options'
    },

    getPriceOn: function (shop, displayPrice, displayWarning) {
        //strip &ref from URLs
        shop.url = shop.url.replace("&psc=1","");
        chrome.runtime.sendMessage({ query: "checkPrice", url: shop.url }, //pass metadata and reconstruct the url in background.js, as per Google's recommendation
        function (response) {
            if (response.success) {
                //TODO check response for shipping error, put airplane icon if not there > $('#dynamicDeliveryMessage .a-color-error') 

                var regex = /[nb]\s*?id="priceblock_[\w]*?price".*?>(.*?)</img;
                var cursorPrice = regex.exec(response.body);
                // console.log(cursorPrice);
                var price = null;
                while (cursorPrice != null) {
                    price = cursorPrice;
                    cursorPrice = regex.exec(response.body);
                }
                if (price != null && price.length == 2) {
                    // console.log('before display price');
                    displayPrice(price[1]);
                    // console.log(response.body);
                    var parser = new DOMParser();
                    var htmlDoc = parser.parseFromString(response.body, 'text/html');
                    var deliveryErr = htmlDoc.querySelectorAll('#dynamicDeliveryMessage .a-color-error');
                    
                    // console.log(deliveryErr);
                    if(deliveryErr.length === 0) {
                        var $shopInfo = $('#compare-shop-' + shop.id);
                        var compareContainer = $shopInfo.parent().find('.compare-link');
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

var page = {
    addTooltipToPage: function (tooltipMarkup) {
        var $placeholderMarkup = $('<img id="compare-placeholder" src="' + settings.image('placeholder.png') + '" alt="Placeholder" />');
        // var $placeholderMarkup = $('<div id="compare-placeholder"></div>');
        // var $imageMarkup = $('<img id="compare-icon" src="' + settings.image('icon.png') + '" alt="Hover to see the prices of the other stores" />');
        var usedPrice = tooltip.findNewUsedPrice();
        var listPrice = tooltip.findListedPrice();

        if(usedPrice !== null) {
            usedPrice = usedPrice.html();
            console.log(usedPrice);
            if(listPrice !== null) {
                console.log(listPrice[0].innerHTML);
                listPrice = listPrice[0].innerHTML;
                listPrice = Number(listPrice.slice(1,listPrice.length).replace(",","").replace("$","").replace(".","").replace("TL","").replace("ED",""));
                usedPrice = Number(usedPrice.slice(1,listPrice.length).replace(",","").replace("$","").replace(".","").replace("TL","").replace("ED",""));

                if(listPrice < usedPrice) {
                    usedPrice = "Best Price";
                }
            }
        } else {
            usedPrice = "New Only";
        }
        

        //compare best used price with current page's price
        
        

        
        // var usedPrice = $('#olp-upd-new-used .a-color-price').html();
        var $imageMarkup = $('<div id="compare-container"> <div id="compare-icon"><button>'+usedPrice+'</button></div><div id="compare-region"><div id="temp-compare" class="hidden">Calculating...</div><button class="pending-price-scan">Calculating...</button></div></div>');
        var $container = this.findAppropriateTooltipContainer();
        // var $container = $('#price').parent();
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
            var newAsin = $('#ASIN').val(); //nu pot sa fac cache la asin, pentru ca se inlocuieste intregul form, nu elementele individuale, si se pierd referintele
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
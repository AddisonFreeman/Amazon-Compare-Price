# Cross Compare Extension Documentation

Cross Compare is a Google Chrome Extension that scrapes different amazon regions and other sellers for the best possible price including shipping and taxes.

## Getting Started

You do not need to have an amazon account to use the extension. Simply load an amazon product page in any world region to view price comparisons. The default price currency option will match the first amazon locale loaded.

When available, additional tax information will be displayed when logged into your amazon account.

### Installing

You must enable the extension in your browser by entering `chrome://extensions` in the omnibar. Ensure the extension is enabled by clicking the extension item toggle.

![Extensions Page](/docs/extensions%20page.png)

## Usage

### Region Comparison Button

![Region Comparison](/docs/demo2-2x.gif)

The right side button is used to see the prices of the current page's product. Hovering over this button will display these prices. If the product is not in stock in another region it will display as unavailable. Products not sold in another region will be listed as not found with a strikethrough style for easy identification. Additionally, if shipping is available to your region an airplane icon will appear to the right of the locale.

You may view this comparison in different currencies by selecting a currency in the dropdown menu at the bottom of this popup. This will trigger a page refresh with a new price comparison in your selected currency. Clicking on the url of a new locale will redirect you that locale's product page. 

Note: to quickly redirect to the best region produt page simply click on the right side button that lists the best region price. If you are already on the best priced region, the button will display 'Best Region'.

### Other Sellers Button

![Other Sellers](/docs/demo1-3x.gif)

When you have arrived at the lowest priced region by clicking on the locale product entry the newly loaded page will show a price comarison with other sellers in this region in the left side button. Hovering over this button will show the best priced other seller price on the right side and the current page's price on the left. Shipping info is also displayed as well as estimated tax when logged in and available. The total will be listed with the price difference shown in the button at the bottom. Click on this button to be redirected to a page with all other sellers listed. The topmost listing is the best new price for this item. Click on 'Add To Cart' to proceed with checkout of this item.

## Authors
This product is owned by Eric Kim.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details


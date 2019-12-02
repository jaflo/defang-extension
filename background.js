var browser = browser || chrome,
	loadCount = 0;

// limit infinite scroll
browser.webRequest.onBeforeRequest.addListener(
	function() {
		loadCount++;
		if (loadCount > 4) {
			// force clicking button
			return { cancel: true };
		} else {
			// random delay
			var waitUntil =
				new Date().getTime() + Math.random() * 1 * 1000 + 500;
			while (new Date() < waitUntil) {}
		}
	},
	{
		urls: [
			"https://www.facebook.com/ajax/pagelet/generic.php/LitestandTailLoadPagelet*"
		]
	},
	["blocking"]
);

// on click of the load more button in UI
browser.runtime.onMessage.addListener(function(message) {
	if (message.type == "RESET_LOAD_COUNT") {
		loadCount = 0;
	}
});

// messenger integration
browser.webRequest.onBeforeRequest.addListener(
	function() {
		return { cancel: true };
	},
	{
		urls: ["https://www.facebook.com/ajax/mercury/delivery_receipts.php"]
	},
	["blocking"]
);

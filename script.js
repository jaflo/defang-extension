(function() {
	var browser = browser || chrome,
		cachedLoadMoreButton,
		isCaughtUp = false,
		forceShowNotifications = false,
		notificationFlyout = document.getElementById("fbNotificationsFlyout"),
		name = document
			.querySelector("#bluebarRoot [data-click=profile_icon]")
			.innerText.trim();

	function defang(container) {
		// reaction counts
		var reactCounts = container.querySelectorAll(
			"[data-testid='UFI2ReactionsCount/root'] span span span"
		);
		if (reactCounts.length > 0) {
			// console.log(reactCounts);
			reactCounts.forEach(function(counter) {
				counter.childNodes.forEach(function(el) {
					if (el.nodeType != 3) return;
					el.nodeValue = el.nodeValue.replace(
						/\d[\d\.\,]*\d?[A-Z]?/g,
						""
					);
				});
			});
		}

		// load more button
		var newLoadMoreButton = container.querySelector(
			"div[id^=more_pager_pagelet_] a"
		);
		if (newLoadMoreButton) cachedLoadMoreButton = newLoadMoreButton;
		if (cachedLoadMoreButton) {
			cachedLoadMoreButton.onclick = function(e) {
				browser.runtime.sendMessage({ type: "RESET_LOAD_COUNT" });
				window.location = window.location;
				return false;
			};
		}
	}

	defang(document.body);

	// re-check when new elements are loaded (infinite scroll)
	new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			if (mutation.addedNodes && mutation.addedNodes.length > 0) {
				mutation.addedNodes.forEach(function(added) {
					if (!added.querySelectorAll) return;
					defang(added);
				});
			}
		});
	}).observe(document.getElementById("stream_pagelet"), {
		childList: true,
		subtree: true
	});

	// stop FB button in top left
	document.querySelector("h1").addEventListener("click", function(e) {
		if (window.location.pathname != "/") return;
		document.body.classList.remove("enabled");
		window.scrollTo(0, 0);
		forceShowNotifications = false;
		checkIfCaughtUp();
		e.preventDefault();
		e.stopPropagation();
	});

	// by default, load notification view
	if (document.body.classList.contains("home"))
		document.querySelector("#fbNotificationsJewel .jewelButton").click();

	// show caught up message when applicable
	function checkIfCaughtUp() {
		notificationFlyout.classList.remove("caughtup");
		isCaughtUp =
			notificationFlyout.querySelector("li") &&
			!notificationFlyout.querySelector(".jewelItemNew");
		if (isCaughtUp && !forceShowNotifications)
			notificationFlyout.classList.add("caughtup");
	}

	// reset force showing nofication
	document
		.querySelector("#fbNotificationsJewel .jewelButton")
		.addEventListener("click", function() {
			forceShowNotifications = false;
		});

	// redirect to messenger for chat
	document.querySelector(
		".jewelButton[name=mercurymessages]"
	).onclick = function(e) {
		window.location = "https://messenger.com/";
		e.stopPropagation();
	};

	// deal with notification changes
	new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			if (mutation.addedNodes && mutation.addedNodes.length > 0) {
				mutation.addedNodes.forEach(function(added) {
					if (!added.querySelectorAll) return;
					var notifications = added.querySelectorAll("li");
					if (notifications.length > 0) {
						notificationFlyout.classList.add("loaded");
						notifications.forEach(function(el) {
							var data = JSON.parse(el.getAttribute("data-gt"));
							if (!data) return;
							if (
								[
									"group_highlights",
									"group_comment_follow"
								].indexOf(data.notif_type) > -1
							) {
								el.remove();
							}
						});

						// remove empty lists
						var subLists = added.querySelectorAll(
							".uiScrollableAreaContent > ul > li:first-child"
						);
						subLists.forEach(function(list) {
							if (list.querySelectorAll("ul li").length == 0) {
								list.remove();
							}
						});
					}

					checkIfCaughtUp();
				});
			}
		});
	}).observe(notificationFlyout, {
		childList: true,
		subtree: true
	});

	// show all caught up when marking as read
	document
		.querySelector(
			"#fbNotificationsFlyout .jewelHeader [data-testid=non_react_mark_all_as_read_link]"
		)
		.addEventListener("click", function(e) {
			isCaughtUp = true;
			notificationFlyout.classList.add("caughtup");
		});

	// "all caught up"-message
	var scrollBy = document.createElement("div");
	scrollBy.appendChild(
		document.createTextNode(name + ", you're all caught up!")
	);
	scrollBy.appendChild(
		document
			.querySelector(
				"#pagelet_composer [data-sprout-tagger-id=ACTIVITY] .img"
			)
			.cloneNode(true)
	);
	scrollBy.setAttribute("class", "allcaughtupmsg");
	var insertPoint = document.querySelector(
		"#fbNotificationsFlyout .jewelFooter"
	);
	insertPoint.parentNode.insertBefore(scrollBy, insertPoint);

	// have see more link show notifications
	document
		.querySelector("#fbNotificationsFlyout .jewelFooter .seeMore")
		.addEventListener("click", function(e) {
			if (isCaughtUp && !forceShowNotifications) {
				forceShowNotifications = true;
				notificationFlyout.classList.remove("caughtup");
				e.preventDefault();
				return false;
			}
		});

	// add button to dismiss notifications
	var showFeed = document.createElement("a");
	showFeed.appendChild(document.createTextNode("Waste Time"));
	showFeed.setAttribute("href", "#");
	showFeed.setAttribute("class", "showfeed");
	showFeed.onclick = function(e) {
		document.body.classList.add("enabled");
		document.body.click();
		forceShowNotifications = false;
		window.dispatchEvent(new CustomEvent("scroll"));
		e.preventDefault();
	};
	document
		.querySelector("#fbNotificationsFlyout .jewelFooter")
		.appendChild(showFeed);
	window.dispatchEvent(new CustomEvent("scroll"));
})();

// ==UserScript==
// @name        Musixmatch Lyrics Info
// @namespace   Violentmonkey Scripts
// @match       https://www.musixmatch.com/lyrics/*
// @grant       none
// @version     2/10/2025
// @author      Lioncat6
// @description Displays info about the current song on musixmatch. (Click to copy data)
// ==/UserScript==

(function () {
	"use strict";

    let notificationCount = 0;

    function newNotification(text, color) {
        let notification = document.createElement("div");
        notification.style.position = "fixed";
        notification.style.top = `${10 + (notificationCount * 50)}px`;
        notification.style.right = "10px";
        notification.style.backgroundColor = color;
        notification.style.color = "white";
        notification.style.padding = "10px";
        notification.style.borderRadius = "5px";
        notification.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.1)";
        notification.style.zIndex = "1000";
        notification.style.fontFamily = "Arial, sans-serif";
        notification.style.cursor = "pointer";
        notification.innerText = text;
        notificationCount++;
        return notification;
    }

    function notificationFadeOut(notification) {
        let fadeOutTimeout;
        let delayTimeout;

        const startFadeOut = () => {
            fadeOutTimeout = setTimeout(() => {
                notification.style.transition = "opacity 1s";
                notification.style.opacity = "0";
                setTimeout(() => {
                    notification.remove();
                    notificationCount--;
                }, 1000);
            }, 5000);
        };

        const delayFadeOut = () => {
            clearTimeout(fadeOutTimeout);
            delayTimeout = setTimeout(startFadeOut, 5000);
        };

        notification.addEventListener("mouseover", () => {
            clearTimeout(fadeOutTimeout);
            clearTimeout(delayTimeout);
        });

        notification.addEventListener("mouseout", delayFadeOut);

        startFadeOut();
    }

    function errorNotification(text) {
        let notification = newNotification(text, "#f44336");
        document.body.appendChild(notification);
        notificationFadeOut(notification);
    }

    function pushNotification(text, copyText) {
        let notification = newNotification(text, "rgb(3, 165, 103)");
        document.body.appendChild(notification);
        notificationFadeOut(notification);

        notification.addEventListener("click", () => {
            navigator.clipboard.writeText(copyText).then(() => {
                console.log("Text copied to clipboard");
            }).catch(err => {
                console.error("Could not copy text: ", err);
            });
        });
    }

	function addNoLabelButton() {
		try {
			let infoJSON = JSON.parse(document.getElementById("__NEXT_DATA__").innerHTML);
            let lyrics_abstrack = infoJSON.props.pageProps.analyticsData.lyrics_abstrack;
            let lyrics_name = infoJSON.props.pageProps.analyticsData.lyrics_name;
            let lyrics_artist_name = infoJSON.props.pageProps.analyticsData.lyrics_artist_name;
            let lyrics_artist_id = infoJSON.props.pageProps.analyticsData.lyrics_artist_id;
            let verified_lyrics = infoJSON.props.pageProps.analyticsData.verified_lyrics;
            pushNotification(lyrics_name + " - " + lyrics_artist_name, lyrics_name + " - " + lyrics_artist_name);
            pushNotification("Lyrics Abstrack: " + lyrics_abstrack, lyrics_abstrack);
            pushNotification("Lyrics Artist ID: " + lyrics_artist_id, lyrics_artist_id);
            pushNotification("Lyrics Verification Level: " + verified_lyrics, verified_lyrics);

		} catch (e) {
            errorNotification("Failed to get lyrics info");
			return;
		}

	}
	window.addEventListener("load", function () {
		addNoLabelButton();
	});
})();

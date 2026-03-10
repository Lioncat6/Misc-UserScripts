// ==UserScript==
// @name        Qobuz Button Fix
// @namespace   Violentmonkey Scripts
// @match       https://open.qobuz.com/*
// @grant       none
// @version     3-10-2026
// @author      Lioncat6
// @description Fix the "Listen on Qobuz" button for open.qobuz.com links
// @icon         https://www.google.com/s2/favicons?sz=64&domain=qobuz.com
// @homepageURL  https://github.com/Lioncat6/Misc-UserScripts
// @supportURL   https://github.com/Lioncat6/Misc-UserScripts/issues
// @updateURL    https://raw.githubusercontent.com/Lioncat6/Misc-UserScripts/main/Qobuz-Button-Fix.user.js
// @downloadURL  https://raw.githubusercontent.com/Lioncat6/Misc-UserScripts/main/Qobuz-Button-Fix.user.js
// @license MIT
// ==/UserScript==

let patchRetry = undefined;

(function () {
    'use strict';
    patchRetry = setInterval(() => patchButton(), 100);
    const originalPushState = history.pushState;
    history.pushState = function () { //Watching for location changes, since open.qobuz.com is a react app
        originalPushState.apply(this, arguments);
        patchRetry = setInterval(() => patchButton(), 100);
    };
    window.addEventListener("popstate", (event) => { //Watching for the back/forward buttons being used
        patchRetry = setInterval(() => patchButton(), 100);
    });
})();



function patchButton() {
    console.log("Attempting to patch button")
    let listenButton = document.getElementsByClassName("pct-play")?.[0];
    if (listenButton) {
        listenButton.href = window.location.href.replace("open", "play")
        console.log(listenButton.href)
        clearInterval(patchRetry);
    }
}
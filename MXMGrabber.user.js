// ==UserScript==
// @name         MusixMatch Lyrics Grabber
// @namespace    MXMGrabber
// @match        https://www.musixmatch.com/lyrics/*
// @version      7-30-2025
// @author       Lioncat6
// @description  Tool to grab lyrics from MusixMatch lyrics pages to either download or upload them to LRCLIB
// @require      https://cdn.jsdelivr.net/npm/toastify-js
// @resource     toastifyCss https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css
// @icon         https://www.google.com/s2/favicons?sz=64&domain=musixmatch.com
// @homepageURL  https://github.com/Lioncat6/Misc-UserScripts
// @supportURL   https://github.com/Lioncat6/Misc-UserScripts/issues
// @updateURL    https://raw.githubusercontent.com/Lioncat6/Misc-UserScripts/main/MXMGrabber.user.js
// @downloadURL  https://github.com/Lioncat6/Misc-UserScripts/raw/refs/heads/main/MXMGrabber.user.js
// ==/UserScript==

(function () {
	"use strict";

	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href = "https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css";
	document.head.appendChild(link);

	let lyricsDict = [];
	let metaDict = [];

	let good = "linear-gradient(to right, #00b09b, #96c93d)";
	let bad = "linear-gradient(to right, #ff416c, #ff4b2b)";

	function notification(message, isBad = false) {
		Toastify({
			text: message,
			duration: 3000,
			close: true,
			gravity: "top", // `top` or `bottom`
			position: "right", // `left`, `center` or `right`
			stopOnFocus: false, // Prevents dismissing of toast on hover
			style: {
				background: isBad ? bad : good,
				"font-family": "Arial",
			},
		}).showToast();
	}

	function showToast() {
		Toastify({
			text: "Click to view lyrics",
			duration: -1,
			close: true,
			gravity: "top", // `top` or `bottom`
			position: "right", // `left`, `center` or `right`
			stopOnFocus: true, // Prevents dismissing of toast on hover
			style: {
				background: good,
				"font-family": "Arial",
			},
			onClick: function () {
				showPopup();
			}, // Callback after click
		}).showToast();
	}

	function instrumentalIcon() {
		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute("fill", "white");
		svg.setAttribute("height", "24");
		svg.setAttribute("viewBox", "0 0 24 24");
		svg.setAttribute("width", "24");
		const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path.setAttribute(
			"d",
			"M4.9 11.3v1.4a1.3 1.3 0 1 1-2.6 0v-1.4a1.3 1.3 0 1 1 2.6 0zM7.8 8a1.3 1.3 0 0 0-1.3 1.3v5.4a1.3 1.3 0 1 0 2.6 0V9.3A1.3 1.3 0 0 0 7.8 8zM12 3a1.3 1.3 0 0 0-1.3 1.3v15.4a1.3 1.3 0 1 0 2.6 0V4.3A1.3 1.3 0 0 0 12 3zm4.2 6a1.3 1.3 0 0 0-1.3 1.3v3.4a1.3 1.3 0 1 0 2.6 0v-3.4A1.3 1.3 0 0 0 16.2 9zm4.2 1a1.3 1.3 0 0 0-1.3 1.3v1.4a1.3 1.3 0 1 0 2.6 0v-1.4a1.3 1.3 0 0 0-1.3-1.3z"
		);
		svg.appendChild(path);
		return svg;
	}

	function createLyricsElements(lyrics) {
		lyrics = JSON.parse(lyrics);
		let lyricsContainer = document.createElement("div");
		lyricsContainer.style.display = "flex";
		lyricsContainer.style.flexDirection = "column";
		lyricsContainer.style.maxHeight = "100px";
		lyricsContainer.style.overflowY = "auto";
		lyricsContainer.className = "mxm-lyrics-container";
		if (lyrics) {
			lyrics.forEach((element) => {
				let lineContainer = document.createElement("div");
				lineContainer.style.display = "flex";
				lineContainer.style.flexDirection = "row";
				lineContainer.style.marginBottom = "5px";
				let timeStamp = document.createElement("div");
				timeStamp.style.borderRadius = "10px";
				timeStamp.style.padding = "5px";
				timeStamp.style.marginRight = "10px";
				timeStamp.style.background = "var(--mxm-backgroundSecondary)";
				timeStamp.innerText = `${element.time.minutes}:${element.time.seconds.toString().padStart(2, "0")}:${element.time.hundredths.toString().padStart(2, "0")}`;
				lineContainer.appendChild(timeStamp);
				let lyricText = document.createElement("div");
				if (element.text.length === 0) {
					let icon = instrumentalIcon();
					icon.style.margin = "0 auto";
					icon.style.display = "block";
					lyricText.style.display = "flex";
					lyricText.style.justifyContent = "center";
					lyricText.style.width = "100%";
					lyricText.appendChild(icon);
				} else {
					lyricText.innerText = element.text;
				}
				lineContainer.appendChild(lyricText);
				lyricsContainer.appendChild(lineContainer);
			});
		}
		return lyricsContainer;
	}

	function expandShrinkLyrics() {
		let lyricsContainer = document.querySelector(".mxm-lyrics-container");
		let button = document.querySelector(".mxm-lyrics-expand-button");
		if (lyricsContainer) {
			lyricsContainer.style.maxHeight = lyricsContainer.style.maxHeight === "400px" ? "100px" : "400px";
		}
		if (button) {
			button.style.transform = button.style.transform === "rotate(180deg)" ? "rotate(0deg)" : "rotate(180deg)";
		}
	}

	function closePopup() {
		let popup = document.querySelector(".mxm-lyrics-popup");
		if (popup) {
			popup.remove();
		}
	}

	function checkFormat() {
		let formatSelect = document.getElementById("mxm-format-select");
		if (formatSelect) {
			return formatSelect.value;
		}
		return "json"; // Default format
	}

	function getLyricsContent(overrideFormat) {
		let format = overrideFormat || checkFormat();
		let lyrics = JSON.parse(lyricsDict[lyricsDict.length - 1]);
		if (format === "json") {
			return JSON.stringify(lyrics, null, 2);
		} else if (format === "text") {
			return lyrics.map((line) => line.text).join("\n");
		} else if (format === "synced") {
			return lyrics
				.map((line) => {
					const min = line.time.minutes.toString().padStart(2, "0");
					const sec = line.time.seconds.toString().padStart(2, "0");
					const hun = line.time.hundredths.toString().padStart(2, "0");
					return `[${min}:${sec}.${hun}] ${line.text}`;
				})
				.join("\n");
		} else if (format === "html") {
			return lyrics.map((line) => `<div>${line.time.minutes}:${line.time.seconds.toString().padStart(2, "0")}:${line.time.hundredths.toString().padStart(3, "0")} ${line.text}</div>`).join("");
		}
		return "";
	}

	function copyLyrics() {
		let lyricsContent = getLyricsContent();
		navigator.clipboard
			.writeText(lyricsContent)
			.then(() => {
				notification("Lyrics copied to clipboard!");
			})
			.catch((err) => {
				console.error("Error copying lyrics: ", err);
			});
	}

	function downloadLyrics() {
		let lyricsContent = getLyricsContent();
		let format = checkFormat();
		let fileName = `lyrics.${format === "json" ? "json" : format === "text" ? "txt" : format === "synced" ? "txt" : "html"}`;
		let blob = new Blob([lyricsContent], { type: format === "json" ? "application/json" : format === "text" || format === "synced" ? "text/plain" : "text/html" });
		let url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = fileName;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		notification("Lyrics downloaded!");
	}


    function submitToLRCLIB() {
        let syncedLyrics = getLyricsContent("synced");
        let plainLyrics = getLyricsContent("text");
        let currentMeta = metaDict[metaDict.length - 1] || {};
        let artistName = currentMeta.artist;
        let trackName = currentMeta.track;
        let albumName = currentMeta.album;
        let duration = currentMeta.duration;
        (async function () {
            try {
                notification("Submitting lyrics to LRCLIB...");
                notification("Requesting challenge...");
                const challengeResp = await fetch("https://lrclib.net/api/request-challenge", {
                    method: "POST",
                });
                if (!challengeResp.ok) {
                    alert("Failed to get challenge");
                    return;
                }
                const challengeData = await challengeResp.json();
                const prefix = challengeData.prefix;
                const targetHex = challengeData.target;

                // Helper: hex string to Uint8Array
                function hexToBytes(hex) {
                    const bytes = new Uint8Array(hex.length / 2);
                    for (let i = 0; i < bytes.length; i++) {
                        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
                    }
                    return bytes;
                }

                // Helper: verify nonce
                function verifyNonce(result, target) {
                    if (result.length !== target.length) return false;
                    for (let i = 0; i < result.length; i++) {
                        if (result[i] > target[i]) return false;
                        else if (result[i] < target[i]) break;
                    }
                    return true;
                }

                // Helper: sha256 as Uint8Array
                async function sha256Bytes(str) {
                    const enc = new TextEncoder();
                    const buf = enc.encode(str);
                    const hash = await crypto.subtle.digest("SHA-256", buf);
                    return new Uint8Array(hash);
                }

                notification("Solving challenge...");
                const target = hexToBytes(targetHex);
                let nonce = 0;
                let found = false;
                let result;

                // Print nonce to console every second
                let lastPrintedNonce = 0;
                const printInterval = setInterval(() => {
                    console.log("Current nonce:", lastPrintedNonce);
                }, 1000);

                while (!found) {
                    const input = `${prefix}${nonce}`;
                    result = await sha256Bytes(input);
                    lastPrintedNonce = nonce;
                    if (verifyNonce(result, target)) {
                        found = true;
                        break;
                    }
                    nonce++;
                }
                clearInterval(printInterval);

                const publishToken = `${prefix}:${nonce}`;

                notification("Submitting lyrics...");
                const payload = {
                    trackName: trackName,
                    artistName: artistName,
                    albumName: albumName,
                    duration: duration,
                    plainLyrics: plainLyrics,
                    syncedLyrics: syncedLyrics,
                };
                let publishResp;
                try {
                    publishResp = await fetch("https://lrclib.net/api/publish", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-Publish-Token": publishToken,
                        },
                        body: JSON.stringify(payload),
                    });
                    if (!publishResp.ok) {
                        // Try with corsproxy if direct fails
                        publishResp = await fetch("https://corsproxy.io/?url=https://lrclib.net/api/publish", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "X-Publish-Token": publishToken,
                            },
                            body: JSON.stringify(payload),
                        });
                    }
                } catch (e) {
                    // Try with corsproxy if fetch throws
                    publishResp = await fetch("https://corsproxy.io/?url=https://lrclib.net/api/publish", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-Publish-Token": publishToken,
                        },
                        body: JSON.stringify(payload),
                    });
                }
                if (publishResp.status === 201) {
                    Toastify({
                        text: "Lyrics submitted to LRCLIB!",
                        duration: 3000,
                        style: { background: good },
                    }).showToast();
                } else {
                    Toastify({
                        text: "Failed to submit lyrics.",
                        duration: 3000,
                        style: { background: bad },
                    }).showToast();
                }
            } catch (error) {
                notification("Error submitting lyrics: " + error.message, true);
            }
        })();
    }

	function showPopup() {
		let popup = document.createElement("div");
		popup.className = "mxm-lyrics-popup";
		popup.style.position = "fixed";
		popup.style.top = "50%";
		popup.style.left = "50%";
		popup.style.transform = "translate(-50%, -50%)";
		popup.style.background = "var(--mxm-backgroundPrimary)";
		popup.style.padding = "20px";
		popup.style.borderRadius = "20px";
		popup.style.color = "var(--mxm-contentPrimary)";
		popup.style.fontFamily = "Arial";
		popup.style.boxShadow = "0px 0px 10px rgba(0, 0, 0, 0.5)";
		let closeButton = document.createElement("button");
		closeButton.innerText = "×";
		closeButton.style.position = "absolute";
		closeButton.style.top = "10px";
		closeButton.style.right = "10px";
		closeButton.style.backgroundColor = "var(--mxm-backgroundSecondary)";
		closeButton.style.color = "var(--mxm-contentPrimary)";
		closeButton.style.border = "none";
		closeButton.style.borderRadius = "50%";
		closeButton.style.cursor = "pointer";
		closeButton.style.width = "30px";
		closeButton.style.height = "30px";
		closeButton.onclick = closePopup;
		popup.appendChild(closeButton);
		let header = document.createElement("h2");
		header.innerText = "Lyrics";
		header.style.textAlign = "center";
		header.style.marginBottom = "20px";
		popup.appendChild(header);
		let lyricsWrapper = document.createElement("div");
		lyricsWrapper.style.marginBottom = "20px";
		lyricsWrapper.style.display = "flex";
		lyricsWrapper.style.flexDirection = "column";
		let expandButton = document.createElement("button");
		expandButton.innerText = "▲";
		expandButton.style.backgroundColor = "var(--mxm-backgroundSecondary)";
		expandButton.style.color = "var(--mxm-contentPrimary)";
		expandButton.style.border = "none";
		expandButton.style.borderRadius = "50px";
		expandButton.style.cursor = "pointer";
		expandButton.style.transform = "rotate(180deg)";
		expandButton.style.width = "40px";
		expandButton.style.fontSize = "large";
		expandButton.style.padding = "5px";
		expandButton.style.margin = "auto";
		expandButton.className = "mxm-lyrics-expand-button";
		expandButton.onclick = expandShrinkLyrics;
		lyricsWrapper.appendChild(createLyricsElements(lyricsDict[lyricsDict.length - 1]));
		lyricsWrapper.appendChild(expandButton);
		popup.appendChild(lyricsWrapper);
		let bottomButtonContainer = document.createElement("div");
		bottomButtonContainer.style.display = "flex";
		bottomButtonContainer.style.justifyContent = "center";
		bottomButtonContainer.style.marginTop = "20px";
		bottomButtonContainer.style.alignItems = "center";
		let formatLabel = document.createElement("label");
		formatLabel.innerText = "Format: ";
		formatLabel.style.marginRight = "5px";
		formatLabel.style.color = "var(--mxm-contentPrimary)";
		formatLabel.htmlFor = "mxm-format-select";
		let formatSelect = document.createElement("select");
		formatSelect.id = "mxm-format-select";
		formatSelect.title = "Select lyrics format";
		formatSelect.style.marginRight = "10px";
		formatSelect.style.padding = "5px";
		formatSelect.style.borderRadius = "5px";
		formatSelect.style.border = "1px solid var(--mxm-borderPrimary)";
		formatSelect.style.background = "var(--mxm-backgroundSecondary)";
		formatSelect.style.color = "var(--mxm-contentPrimary)";
		formatSelect.innerHTML = `
            <option value="json">JSON</option>
            <option value="text">Text</option>
            <option value="synced">Text (Synced)</option>
            <option value="html">HTML</option>
        `;
		bottomButtonContainer.appendChild(formatLabel);
		bottomButtonContainer.appendChild(formatSelect);
		let copyButton = document.createElement("button");
		copyButton.innerText = "Copy Lyrics";
		copyButton.style.backgroundColor = "var(--mxm-backgroundSecondary)";
		copyButton.style.color = "var(--mxm-contentPrimary)";
		copyButton.style.border = "none";
		copyButton.style.borderRadius = "5px";
		copyButton.style.cursor = "pointer";
		copyButton.style.padding = "10px 20px";
		copyButton.style.marginRight = "10px";
		copyButton.onclick = copyLyrics;
		bottomButtonContainer.appendChild(copyButton);
		let downloadButton = document.createElement("button");
		downloadButton.innerText = "Download Lyrics";
		downloadButton.style.backgroundColor = "var(--mxm-backgroundSecondary)";
		downloadButton.style.color = "var(--mxm-contentPrimary)";
		downloadButton.style.border = "none";
		downloadButton.style.borderRadius = "5px";
		downloadButton.style.cursor = "pointer";
		downloadButton.style.padding = "10px 20px";
		downloadButton.style.marginRight = "10px";
		downloadButton.onclick = downloadLyrics;
		bottomButtonContainer.appendChild(downloadButton);
		let submitButton = document.createElement("button");
		submitButton.innerText = "Submit to LRCLIB";
		submitButton.style.backgroundColor = "var(--mxm-backgroundSecondary)";
		submitButton.style.color = "var(--mxm-contentPrimary)";
		submitButton.style.border = "none";
		submitButton.style.borderRadius = "5px";
		submitButton.style.cursor = "pointer";
		submitButton.style.padding = "10px 20px";
		submitButton.onclick = submitToLRCLIB;
		bottomButtonContainer.appendChild(submitButton);
		popup.appendChild(bottomButtonContainer);
		document.body.appendChild(popup);
	}

	const trackTargetString = "https://www.musixmatch.com/ws/1.1/track.subtitle.get?";
	const spotifyDataString = "https://api.spotify.com/v1/tracks/";

	const originalFetch = window.fetch;
	window.fetch = function (...args) {
		const [url] = args;

		return originalFetch.apply(this, args).then(async (response) => {
			// If 404, skip processing and just return response
			if (response.status === 404) {
				return response;
			}

			// Clone the response so we can read its body without affecting downstream usage
			const clonedResponse = response.clone();

			// Check if it's the fetch we're watching
			if (typeof url === "string" && url.includes(trackTargetString)) {
				await clonedResponse.json().then((body) => {
					if (body.message.header.status_code != 200) {
						notification("Failed to fetch lyrics", true);
						return response;
					}
					showToast();
					let rawLyrics = body.message.body.subtitle.subtitle_body;
					lyricsDict.push(rawLyrics);
					console.log("Lyrics Data");
					console.log(body);
					console.log("Raw Lyrics");
					console.log(rawLyrics);
				});
			} else if (typeof url === "string" && url.includes(spotifyDataString)) {
				await clonedResponse.json().then((body) => {
					let trackName = body.name;
					let artistName = body.artists[0].name;
					let albumName = body.album.name;
					let duration = body.duration_ms / 1000; // Convert milliseconds to seconds
					let isrc = body.external_ids.isrc;
					metaDict.push({
						track: trackName,
						artist: artistName,
						album: albumName,
						duration: duration,
						isrc: isrc,
					});
					console.log("Track Metadata");
					console.log(metaDict);
				});
			}

			return response;
		});
	};
})();

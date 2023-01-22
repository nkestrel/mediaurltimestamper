/*
 * Media URL Timestamper
 * Firefox Web Extension
 * Copyright (C) 2017 Kestrel
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

"use strict";

const MESSAGE_ID = "MediaURLTimestamper",
      LOCATION_CHANGE_INTERVAL_MS = 1000;

var options,
    currentSite,
    currentMethod,
    currentLocation,
    initialLocation,
    automaticMode,
    updateTimer,
    locationChangeTimer,
    locationChanged,
    frameWindow,
    prevAutoZone,
    prevLivePlaying;

function setupOptions() {

  identifyWebsite();

  automaticMode = options.automaticTimestamp;
  updatePageAction();

  // Detect location change
  clearInterval(locationChangeTimer);
  locationChangeTimer = setInterval(function(event) {
    let url = window.location.href;
    if (url != currentLocation) {
      checkMethodAvailable();
      updatePageAction();
      currentLocation = url;
      initialLocation = url;
      locationChanged = true;
    }
  }, LOCATION_CHANGE_INTERVAL_MS);

  setupAutomaticTimestamp();
}

function setupAutomaticTimestamp() {
  // Use a simple poll to find media element, read the current time
  // and update URL
  clearInterval(updateTimer);
  if (automaticMode) {
    updateTimer = setInterval(function(event) {
      if (checkMethodAvailable()) {
        doTimestamp();
      }
    }, options.pollIntervalSec * 1000);
  }
}

function identifyWebsite() {
  for (let website of websites) {
    for (let domain of website.domains) {
      if (window.location.hostname.endsWith(domain)) {
        currentSite = website;
        break;
      }
    }
  }
}

function checkMethodAvailable() {
  currentMethod = null;
  for (let method of currentSite.methods) {
    if (!method.disabled && isValidPath(method.paths)) {
      currentMethod = method;
      break;
    }
  }
  return currentMethod != null;
}

function doTimestamp(force) {
  let targetWindow = frameWindow || window;
  targetWindow.postMessage({type: "getMediaTime", force, websiteId: currentSite.id}, '*');
}

window.addEventListener("message", function(event) {
  switch (event.data.type) {
    case "returnMediaTime":
      let timeSec = event.data.time;
      let durationSec = event.data.duration;
      let livePlaying = event.data.livePlaying;
      if (timeSec && durationSec) {
        let force = event.data.force;
        let autoZone = durationSec > options.minimumDurationMin * 60 &&
                       timeSec > options.ignoreStartSec &&
                       timeSec < (durationSec - options.ignoreEndSec);
        if (force || autoZone) {
          let timeString = convertTimeToString(timeSec, currentMethod.format);
          updateTimestamp(timeString);
        }
        // Clear timestamp when transitioning into start/end ignore regions
        if (!locationChanged && !autoZone && prevAutoZone) {
          updateTimestamp("");
        }
        prevAutoZone = autoZone;
        locationChanged = false;
      } else if (livePlaying && !prevLivePlaying) {
        // Clear timestamp when going from delayed to live
        updateTimestamp("");
      }
      prevLivePlaying = livePlaying;
      break;
    case "mediaFrame":
      frameWindow = event.source;
      break;
  }
}, false);


function updateTimestamp(timeString) {
  let oldURL = window.location.href;
  let searchParams = new URLSearchParams(window.location.search);
  let hash = window.location.hash;

  if (!currentMethod) {
    return;
  }

  if (currentMethod.type == "hash") {
    if (!timeString) {
      hash = ""
    } else {
      hash = "#" + currentMethod.parameter + "=" + timeString;
    }
  } else {
    if (!timeString) {
      searchParams.delete(currentMethod.parameter);
    } else {
      searchParams.set(currentMethod.parameter, timeString);
    }
  }

  // Remove other timestamps
  for (let method of currentSite.methods) {
    if (method != currentMethod) {
      if (method.type == "hash") {
        if (window.location.hash.startsWith("#" + method.parameter + "=")) {
          hash = "";
        }
      } else {
        searchParams.delete(method.parameter);
      }
    }
  }
  let query = searchParams.toString();
  query = (query.length > 0 ? "?" : "") + query;

  if (query != window.location.search ||
      hash != window.location.hash) {

    let newPath = window.location.pathname + query + hash;
    // Replace history and preserve existing state
    window.history.replaceState(window.history.state, "", newPath);
    // Need to reshow pageAction after replacing history.
    updatePageAction();
    // Remove old timestamp URL from global history to avoid spam but
    // optionally keep initial URL so links are still marked as visited.
    if (!options.keepOriginalVisited || oldURL != initialLocation) {
      browser.runtime.sendMessage({action: "historyDeleteUrl", url: oldURL});
    }
    // Update current location so it is not detected as a location change
    currentLocation = window.location.href;
  }
}

function isValidPath(paths) {
  const segments = window.location.pathname.replace(/^\/|\/$/g, '').split("/");
  for (let path of paths) {
    if (["","/"].includes(path))
      return true;
    let patterns = path.replace(/^\/|\/$/g, '').split("/");
    if (patterns.length > segments.length)
      break;
    let match = true;
    for (let i = 0; i < patterns.length; i++) {
      // Wildcard matching for path segments, last segment only needs to match
      // start when not closed with trailing slash.
      if (patterns[i] != "*") {
        if (i == patterns.length - 1 && !path.endsWith("/"))
          match = segments[i].startsWith(patterns[i]);
        else
          match = segments[i] == patterns[i];
      }
      if (!match)
        break;
    }
    if (match)
      return true;
  }
  return false;
}

function convertTimeToString(timeSec, format) {
  let time;
  if (format == "seconds") {
    time = Math.trunc(timeSec);
  } else {
    // Convert seconds to {hours}h{minutes}m{seconds}s
    let hours = Math.trunc(timeSec / 3600);
    let minutes = Math.trunc(timeSec / 60) % 60;
    let seconds = Math.trunc(timeSec % 60);
    time = (hours > 0 ? hours + "h" : "") +
           (minutes > 0 ? minutes + "m" : "") +
           (seconds > 0 ? seconds + "s" : "");
  }
  return time;
}

function updatePageAction() {
    browser.runtime.sendMessage({action: "updatePageAction",
                                 show: (currentMethod ? options.showPageAction : false),
                                 automatic: automaticMode});
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "doTimestamp":
      if (checkMethodAvailable()) {
        doTimestamp(true);
      }
      break;
    case "clearTimestamp":
      updateTimestamp("");
      break;
    case "toggleAuto":
      automaticMode = !automaticMode;
      setupAutomaticTimestamp();
      updatePageAction();
      break;
    case "getAutoMode":
      sendResponse(automaticMode);
      break;
  }
});

const setupItems = (items) => {
  // Firefox 51 and below have items inside items[0]
  if (Array.isArray(items)) {
    options = items[0];
  } else {
    options = items;
  }
  setupOptions();
}

IS_CHROME ? browser.storage.local.get(defaultOptions, setupItems) : browser.storage.local.get(defaultOptions).then(setupItems);

browser.storage.onChanged.addListener(function(changes, areaName) {
  let changedItems = Object.keys(changes);
  for (let item of changedItems) {
    let value = changes[item].newValue;
    if (typeof value === "undefined") {
      value = defaultOptions[item];
    }
    options[item] = value;
  }
  setupOptions();
});








/*
 * Media URL Timestamper
 * Firefox Web Extension
 * Copyright (C) 2017 Kestrel
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const MESSAGE_ID = "MediaURLTimestamper",
      LOCATION_CHANGE_INTERVAL_MS = 1000;

var options,
    currentSite,
    currentMethod,
    currentLocation,
    automaticMode,
    updateTimer,
    locationChangeTimer,
    frameWindow;

function setupOptions() {

  identifyWebsite();

  automaticMode = options.automaticTimestamp;
  updatePageAction();

  // Detect location change
  clearInterval(locationChangeTimer);
  locationChangeTimer = setInterval(function(event) {
    if (window.location.href != currentLocation) {
      checkMethodAvailable();
      updatePageAction();
      currentLocation = window.location.href;
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
  for (let key of Object.keys(websites)) {
    if (window.location.hostname.endsWith(websites[key].domain)) {
      currentSite = websites[key];
      break;
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
  targetWindow.postMessage({type: "getMediaTime", force, domain: currentSite.domain}, '*');
}

window.addEventListener("message", function(event) {
  switch (event.data.type) {
    case "returnMediaTime":
      let timeSec = event.data.time;
      let durationSec = event.data.duration;
      let force = event.data.force;
      if (durationSec > 0) {
        // Important that timestamp does not get overwritten until some
        // media time has passed
        if (force || (timeSec > 0 && validTimerange(timeSec, durationSec))) {
          let timeString = convertTimeToString(timeSec, currentMethod.format);
          updateTimestamp(timeString);
        }
      }
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
    // Remove old timestamp URL from global history to avoid spam
    browser.runtime.sendMessage({action: "historyDeleteUrl", url: oldURL});
    // Update current location so it is not detected as a location change
    currentLocation = newPath;
  }
}

function validTimerange(timeSec, durationSec) {
  return durationSec > options.minimumDurationMin * 60 &&
         timeSec > options.ignoreStartSec &&
         timeSec < (durationSec - options.ignoreEndSec);
}

function isValidPath(paths) {
  for (let path of paths) {
    if (window.location.pathname.startsWith(path)) {
      return true;
    }
  }
  return false;
}

function convertTimeStringToSec(timeString) {
  // Convert time format "00:00:00" to seconds
  let parts = timeString.split(':');
  let result = 0;
  for (let i = 0, len = parts.length; i < 3 && i < len; i++) {
    result = result + parseInt(parts[len - 1 - i], 10) * Math.pow(60, i);
  }
  return result;
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

browser.runtime.onMessage.addListener(function(message) {
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
  }
});

browser.storage.local.get(defaultOptions).then((items) => {
  // Firefox 51 and below have items inside items[0]
  if (Array.isArray(items)) {
    options = items[0];
  } else {
    options = items;
  }
  setupOptions();
});

browser.storage.onChanged.addListener(function(changes, areaName) {
  let changedItems = Object.keys(changes);
  for (item of changedItems) {
    let value = changes[item].newValue;
    if (typeof value === "undefined") {
      value = defaultOptions[item];
    }
    options[item] = value;
  }
  setupOptions();
});








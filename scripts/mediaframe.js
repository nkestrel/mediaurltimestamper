/*
 * Media URL Timestamper
 * Firefox Web Extension
 * Copyright (C) 2017 Kestrel
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */


function getMediaTime(force, currentSite) {
  // Prevent ads from replacing existing timestamp
  let adPlayingOrLive = false;
  if (typeof currentSite.adPlayingOrLive != "undefined") {
    adPlayingOrLive = currentSite.adPlayingOrLive();
  } else {
    adPlayingOrLive = false;
  }

  let result = {};
  if (!adPlayingOrLive) {
    if (typeof currentSite.getTimeAndDuration != "undefined") {
      result = currentSite.getTimeAndDuration();
    } else {
      let video = document.getElementsByTagName("video")[0];
      if (video) {
        result.timeSec = video.currentTime;
        result.durationSec = video.duration;
      }
    }
  }

  window.parent.postMessage({type: "returnMediaTime",
                             time: result.timeSec,
                             duration: result.durationSec,
                             force: force}, '*');

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

function getTimeString(baseElement, className) {
  let el = baseElement.getElementsByClassName(className)[0];
  if (el) {
    for (let node of el.childNodes) {
      // Make sure text starts with number
      if (!isNaN(parseInt(node.textContent, 10))) {
        return node.textContent;
      }
    }
  }
  return "0";
}

// Register frame
window.parent.postMessage({type: "mediaFrame"}, '*');

window.addEventListener("message", function(event) {
  if (event.data.type == "getMediaTime") {
    let currentSite;
    for (let key of Object.keys(websites)) {
      if (websites[key].domain == event.data.domain) {
        currentSite = websites[key];
        break;
      }
    }
    getMediaTime(event.data.force, currentSite);
  }
}, false);


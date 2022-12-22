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

function getMediaTime(force, currentSite) {
  // Prevent ads from replacing existing timestamp
  let adPlaying = false;
  if (typeof currentSite.adPlaying != "undefined") {
    adPlaying = currentSite.adPlaying();
  } else {
    adPlaying = false;
  }
  let livePlaying = false;
  if (typeof currentSite.livePlaying != "undefined") {
    livePlaying = currentSite.livePlaying();
  } else {
    livePlaying = false;
  }

  let result = {};
  if (!adPlaying && !livePlaying) {
    if (typeof currentSite.getTimeAndDuration != "undefined") {
      result = currentSite.getTimeAndDuration();
    } else {
      let mainVideo;
      if (typeof currentSite.getVideo != "undefined") {
        mainVideo = currentSite.getVideo();
      } else {
        let videos = document.getElementsByTagName("video");
        for (let video of videos) {
          // Assume longest video is main content
          if (!isNaN(video.duration) &&
              (!mainVideo || video.duration > mainVideo.duration)) {
            mainVideo = video;
          }
        }
      }
      if (mainVideo) {
        result.timeSec = mainVideo.currentTime;
        result.durationSec = mainVideo.duration;
      }
    }
  }

  window.parent.postMessage({type: "returnMediaTime",
                             time: result.timeSec,
                             duration: result.durationSec,
                             livePlaying,
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
    for (let website of websites) {
      if (website.id == event.data.websiteId) {
        currentSite = website;
        break;
      }
    }
    getMediaTime(event.data.force, currentSite);
  }
}, false);


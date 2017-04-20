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

  function getTimeString(className) {
    let el = document.getElementsByClassName(className)[0];
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

  let result = {};

  // Prevent ads from replacing existing timestamp
  if (!isAdPlayingOrLivestream(currentSite)) {
    if (currentSite == websites.soundcloud) {
      // Location path must match audio being played, use badge avatar path to match up
      let avatar = document.getElementsByClassName("playbackSoundBadge__avatar")[0];
      if (avatar && avatar.pathname == window.location.pathname) {
        let timeString = getTimeString("playbackTimeline__timePassed");
        let durationString = getTimeString("playbackTimeline__duration");
        result.timeSec = convertTimeStringToSec(timeString);
        result.durationSec = convertTimeStringToSec(durationString);
      }
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

function isAdPlayingOrLivestream(currentSite) {
  let adPlaying = false;
  let livestream = false;
  switch (currentSite) {
    case websites.youtube:
      let player = document.getElementsByClassName("html5-video-player")[0];
      if (player) {
        adPlaying = player.classList.contains("ad-interrupting");
      }
      livestream = document.getElementsByClassName("ytp-live").length > 0;
      break;
    case websites.bbciplayer:
      adPlaying = document.getElementsByClassName("trailer").length > 0;
      break;
    case websites.dailymotion:
      let adInfo = document.getElementsByClassName("dmp_AdInfo")[0];
      let liveBadge = document.getElementsByClassName("dmp_LiveBadge")[0];
      if (adInfo) {
        adPlaying = !adInfo.classList.contains("dmp_is-hidden");
      }
      if (liveBadge) {
        livestream = !liveBadge.classList.contains("dmp_is-hidden");
      }
      break;
  }
  return adPlaying || livestream;
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


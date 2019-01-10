/*
 * Media URL Timestamper
 * Firefox Web Extension
 * Copyright (C) 2017 Kestrel
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */


const websites = {
  youtube: {
    domains: ["youtube.com"],
    // Have choice of query or hash but query resumes faster and doesn't
    // cause the video to skip during playback
    methods: [{
      paths: ["/watch"],
      type: "query",
      parameter: "t",
      format: "hms"
    },
    { paths: ["/watch"],
      type: "hash",
      parameter: "t",
      format: "hms",
      disabled: true,
    },
    { paths: ["/embed/"],
      type: "query",
      parameter: "start",
      format: "seconds"
    }],
    adPlayingOrLive: function() {
      let player = document.getElementsByClassName("html5-video-player")[0];
      if (player && player.classList.contains("ad-interrupting")) {
        return true;
      }
      return document.getElementsByClassName("ytp-live").length > 0;
    }
  },
  soundcloud: {
    domains: ["soundcloud.com"],
    methods: [{
      paths: ["/"],
      type: "hash",
      parameter: "t",
      format: "hms"
    }],
    adPlayingOrLive: function() {
      let panel = document.getElementsByClassName("playControlsPanel")[0];
      if (panel &&
          panel.classList.contains("is-visible") &&
          panel.classList.contains("is-active")) {
        if (panel.getElementsByClassName("playControlsPanel__adHeader")[0]) {
          return true;
        }
      }
      return false;
    },
    getTimeAndDuration: function() {
      let result = {};
      // Location path must match audio being played, use badge title path to match up
      let playback = document.getElementsByClassName("playbackSoundBadge__titleLink")[0];
      if (playback) {
        let searchParams = new URLSearchParams(playback.search);
        let inPath = "/" + searchParams.get("in");
        if (window.location.pathname == playback.pathname ||
            window.location.pathname == inPath) {
          let timeString = getTimeString(document, "playbackTimeline__timePassed");
          let durationString = getTimeString(document, "playbackTimeline__duration");
          result.timeSec = convertTimeStringToSec(timeString);
          result.durationSec = convertTimeStringToSec(durationString);
        }
      }
      return result;
    }
  },
  vimeo: {
    domains: ["vimeo.com"],
    methods: [{
      paths: ["/"],
      type: "hash",
      parameter: "t",
      format: "hms"
    }]
  },
  dailymotion: {
    domains: ["dailymotion.com"],
    methods: [{
      paths: ["/video/", "/embed/video/"],
      type: "query",
      parameter: "start",
      format: "seconds"
    }],
    adPlayingOrLive: function() {
      let adInfo = document.getElementsByClassName("np_ButtonAdLink")[0];
      return adInfo && adInfo.style.display != "none";
    }
  },
  twitch: {
    domains: ["twitch.tv"],
    methods: [{
      paths: ["/videos/"],
      type: "query",
      parameter: "t",
      format: "hms"
    }]
  },
  pbs: {
    domains: ["pbs.org"],
    methods: [{
      paths: ["/video/"],
      type: "query",
      parameter: "start",
      format: "seconds"
    }]
  },
  hearthis: {
    domains: ["hearthis.at"],
    methods: [{
      paths: ["/"],
      type: "hash",
      parameter: "t",
      format: "seconds"
    }],
    getTimeAndDuration: function() {
      let result = {};
      // Location path must match audio being played, use micro player path to match up
      let microPlayer = document.getElementsByClassName("micro-player")[0];
      if (microPlayer) {
        let current = microPlayer.getElementsByClassName("gotocurrent")[0];
        if (current && current.pathname == window.location.pathname) {
          let contentLayer = document.getElementsByClassName("content-layer")[0];
          if (contentLayer) {
            let timeString = getTimeString(contentLayer, "sm2_position");
            let durationString = getTimeString(contentLayer, "sm2_total");
            result.timeSec = convertTimeStringToSec(timeString);
            result.durationSec = convertTimeStringToSec(durationString);
          }
        }
      }
      return result;
    }
  },
  framatube: {
    domains: ["framatube.org"],
    methods: [{
      paths: ["/videos/watch/", "/videos/embed/"],
      type: "query",
      parameter: "start",
      format: "hms"
    }]
  },
  bittube: {
    domains: ["bit.tube"],
    methods: [{
      paths: ["/play", "/playerembed/"],
      type: "query",
      parameter: "time",
      format: "seconds"
    }]
  }
};

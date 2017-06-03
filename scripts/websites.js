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
    domain: "youtube.com",
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
    domain: "soundcloud.com",
    methods: [{
      paths: ["/"],
      type: "hash",
      parameter: "t",
      format: "hms"
    }],
    getTimeAndDuration: function() {
      let result = {};
      // Location path must match audio being played, use badge avatar path to match up
      let avatar = document.getElementsByClassName("playbackSoundBadge__avatar")[0];
      if (avatar && avatar.pathname == window.location.pathname) {
        let timeString = getTimeString(document, "playbackTimeline__timePassed");
        let durationString = getTimeString(document, "playbackTimeline__duration");
        result.timeSec = convertTimeStringToSec(timeString);
        result.durationSec = convertTimeStringToSec(durationString);
      }
      return result;
    }
  },
  vimeo: {
    domain: "vimeo.com",
    methods: [{
      paths: ["/"],
      type: "hash",
      parameter: "t",
      format: "hms"
    }]
  },
  dailymotion: {
    domain: "dailymotion.com",
    methods: [{
      paths: ["/video/", "/embed/video/"],
      type: "query",
      parameter: "start",
      format: "seconds"
    }],
    adPlayingOrLive: function() {
      let adInfo = document.getElementsByClassName("dmp_AdInfo")[0];
      if (adInfo && !adInfo.classList.contains("dmp_is-hidden")) {
        return true;
      }
      let liveBadge = document.getElementsByClassName("dmp_LiveBadge")[0];
      if (liveBadge && !liveBadge.classList.contains("dmp_is-hidden")) {
        return true;
      }
      return false;
    }
  },
  twitch: {
    domain: "twitch.tv",
    methods: [{
      paths: ["/videos/"],
      type: "query",
      parameter: "t",
      format: "hms"
    }]
  },
  vidme: {
    domain: "vid.me",
    methods: [{
      paths: ["/"],
      type: "hash",
      parameter: "t",
      format: "hms"
    }]
  },
  pbs: {
    domain: "pbs.org",
    methods: [{
      paths: ["/video/"],
      type: "query",
      parameter: "start",
      format: "seconds"
    }]
  },
  bbciplayer: {
    domain: "bbc.co.uk",
    methods: [{
      paths: ["/iplayer/"],
      type: "hash",
      parameter: "playt",
      format: "hms"
    }],
    adPlayingOrLive: function() {
      return document.getElementsByClassName("trailer").length > 0;
    }
  }
};

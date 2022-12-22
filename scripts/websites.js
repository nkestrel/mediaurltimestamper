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

const websites = [
  { id: "youtube",
    domains: [
      "youtube.com",
      "youtube-nocookie.com",

      // Piped instances
      "piped.video",
      "piped.tokhmi.xyz",
      "piped.moomoo.me",
      "piped.syncpundit.io",
      "piped.mha.fi",
      "watch.whatever.social",
      "piped.garudalinux.org",
      "y.rivo.lol",
      "efy.piped.pages.dev",
      "piped.daviteusz.eu",
      "yt.jae.fi",
      "il.ax",
      "piped.esmailelbob.xyz",
      "piped.projectsegfau.lt",
      "piped.privacydev.net",
      "piped.palveluntarjoaja.eu",
      "piped.smnz.de",
      "piped.adminforge.de",
      "piped.qdi.fi",

      // Invidious instances
      "yewtu.be",
      "invidious.snopyta.org",
      "inv.riverside.rocks",
      "vid.puffyan.us",
      "invidious.flokinet.to",
      "inv.bp.projectsegfau.lt",
      "invidious.esmailelbob.xyz",
      "yt.artemislena.eu",
      "invidious.namazso.eu",
      "invidious.sethforprivacy.com",
      "invidious.baczek.me",
      "invidious.projectsegfau.lt",
      "invidious.weblibre.org",
      "invidious.nerdvpn.de",
      "invidio.xamh.de",
      "inv.vern.cc",
      "y.com.sb",
      "invidious.dhusch.de",
      "inv.odyssey346.dev",
      "youtube.076.ne.jp",
      "invidious.tiekoetter.com",
      "invidious.slipfox.xyz"
    ],
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
    { paths: ["/watch"],
      type: "query",
      parameter: "time_continue",
      format: "hms",
      disabled: true,
    },
    { paths: ["/embed/"],
      type: "query",
      parameter: "start",
      format: "seconds"
    }],
    adPlaying: function() {
      let player = document.getElementsByClassName("html5-video-player")[0];
      return player && player.classList.contains("ad-interrupting");
    },
    livePlaying: function() {
      if (document.getElementsByClassName("ytp-live").length > 0) {
        // Live button is disabled when already live
        let liveBadge = document.getElementsByClassName("ytp-live-badge")[0];
        return liveBadge && liveBadge.disabled;
      }
      return false;
    }
  },
  { id: "soundcloud",
    domains: ["soundcloud.com"],
    methods: [{
      paths: ["/"],
      type: "hash",
      parameter: "t",
      format: "hms"
    }],
    adPlaying: function() {
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
  { id: "vimeo",
    domains: ["vimeo.com"],
    methods: [{
      paths: ["/"],
      type: "hash",
      parameter: "t",
      format: "hms"
    }]
  },
  { id: "dailymotion",
    domains: ["dailymotion.com"],
    methods: [{
      paths: ["/video/", "/embed/video/"],
      type: "query",
      parameter: "start",
      format: "seconds"
    }],
    adPlaying: function() {
      let adInfo = document.getElementsByClassName("np_ButtonAdLink")[0];
      return adInfo && adInfo.style.display != "none";
    }
  },
  { id: "twitch",
    domains: ["twitch.tv"],
    methods: [{
      paths: ["/videos/"],
      type: "query",
      parameter: "t",
      format: "hms"
    }],
    getVideo: function() {
      let player = document.getElementsByClassName("video-player")[0];
      if (player) {
        return player.getElementsByTagName("video")[0];
      }
    }
  },
  { id: "pbs",
    domains: ["pbs.org"],
    methods: [{
      paths: ["/video/"],
      type: "query",
      parameter: "start",
      format: "seconds"
    }]
  },
  { id: "hearthis",
    domains: ["hearthis.at"],
    methods: [{
      paths: ["/"],
      type: "query",
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
  { id: "peertube",
    domains: [
      "framatube.org",
      "bittube.video",
      "tilvids.com",
      "peertube.linuxrocks.online",
      "video.antopie.org"
    ],
    methods: [{
      paths: ["/w/", "/videos/watch/", "/videos/embed/"],
      type: "query",
      parameter: "start",
      format: "hms"
    }]
  },
  { id: "vidlii",
    domains: ["vidlii.com"],
    methods: [{
      paths: ["/watch", "/embed"],
      type: "hash",
      parameter: "t",
      format: "seconds"
    }]
  },
  { id: "lbry",
    domains: [
      "odysee.com",
      "lbry.bcow.xyz",
      "odysee.076.ne.jp",
      "librarian.pussthecat.org",
      "lbry.projectsegfau.lt",
      "librarian.esmailelbob.xyz",
      "lbry.vern.cc",
      "lbry.slipfox.xyz",
      "lbry.sytes.net",
      "lbry.webhop.me",
      "lbry.mywire.org"
    ],
    methods: [{
      paths: ["/@"],
      type: "query",
      parameter: "t",
      format: "seconds"
    }]
  },
  { id: "cloudtube",
    domains: ["tube.cadence.moe"],
    methods: [{
      paths: ["/watch"],
      type: "query",
      parameter: "t",
      format: "hms"
    }]
  },
  { id: "utreon",
    domains: ["utreon.com"],
    methods: [{
      paths: ["/v/"],
      type: "query",
      parameter: "t",
      format: "seconds"
    }],
    adPlaying: () => {
      return document.getElementsByClassName("ad-skip-link")[0];
    }
  },
  { id: "crunchyroll",
    domains: ["crunchyroll.com"],
    methods: [{
      paths: ["/watch/"],
      type: "query",
      parameter: "t",
      format: "seconds"
    }]
  },
  { id: "facebook",
    domains: ["facebook.com"],
    methods: [{
      paths: ["/*/videos/*"],
      type: "query",
      parameter: "t",
      format: "seconds"
    }]
  },
  { id: "vk",
    domains: ["vk.com"],
    methods: [{
      paths: ["/video-"],
      type: "query",
      parameter: "t",
      format: "hms"
    }]
  },
  { id: "niconico",
    domains: ["nicovideo.jp"],
    methods: [{
      paths: ["/watch/"],
      type: "query",
      parameter: "from",
      format: "seconds"
    }]
  },
  { id: "aparat",
    domains: ["aparat.com"],
    methods: [{
      paths: ["/v/"],
      type: "query",
      parameter: "t",
      format: "seconds"
    }]
  }
];

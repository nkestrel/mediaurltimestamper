## Media URL Timestamper
Firefox Web Extension

![](/icons/icon48.png)

**Resume media content where you left off by timestamping the URL.**

Don't lose your spot in long music sets, podcasts, talks/lectures and saved 
live streams. Conveniently get the media's current time and put it in the URL 
for later resuming, either manually or automatically at regular intervals. 
This timestamped URL, also known as a deep link, can then be handled by the 
browser's session, history, bookmarks, sync service, share services etc. 
Anywhere the link goes the timestamp conveniently goes with it.

Supported websites (HTML5):

* Youtube
* Soundcloud
* Vimeo
* Twitch
* Vidme
* DailyMotion
* PBS
* BBC iPlayer

Some of these websites already have resume capabilities but require cookies 
or local storage to be retained. Some also need you to be logged in with 
watch history enabled and have other requirements like video duration and 
time watched. Timestamping the URL is more flexible and reliable, allowing 
you to clear cookies, browse logged out or with watch history disabled, as 
well as permanently store and share the timestamped links.

Automatic mode applies the current timestamp every interval (default 60 
seconds) for media content that exceeds the minimum duration (default 5 
minutes) and the current time is not close to the start or end (default 60 
seconds). Alternatively the timestamp can be applied manually by clicking the 
page action icon in the location bar. The page action has a context menu 
available in Firefox 53+ which allows clearing the timestamp and temporarily 
toggling automatic mode on and off for the current page.

This approach only works with direct media pages and not media embedded in 
other pages.


Tags: resume video media music audio time position continue deep link anchor 
fragment hashtag webextensions webext

## Technical notes

* History permission is needed to remove old timestamped URLs and stop them 
filling up global history.
* Youtube applies timestamps in order: &start -> &t -> #t, changing #t 
interrupts playback.
* Youtube has multiple ways of timestamp deep linking which all need to be 
accounted for so that unused methods can be removed.
* Some sites frame their media content, need to inject in all frames and send 
message back to parent window.
* Important not to overwrite the timestamp due to content taking a while to 
resume or the video element playing an advertisement.
* Soundcloud does not use HTML5 media elements so the time and duration are 
extracted from text nodes.
* For media players that work across multiple pages, the timestamp should 
only be updated when the content matches the page.
* Mixcloud does not support timestamp deep linking for licensing reasons.
* Twitch & BBC iPlayer keep track of the current video time in localStorage 
and automatically resume.
* Youtube keeps track of the current video time if the user is logged in, has 
watch history enabled, video is longer than 20 minutes in addition to other 
requirements. If cookies are cleared the user must access watch history to 
resume.
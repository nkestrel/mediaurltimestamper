
var IS_CHROME = !browser;

var browser = browser || chrome;

var defaultOptions = {
  "showPageAction":              true,
  "keepOriginalVisited":         true,
  "automaticTimestamp":          true,
  "minimumDurationMin":          "10",
  "pollIntervalSec":             60,
  "ignoreStartSec":              120,
  "ignoreEndSec":                120
};

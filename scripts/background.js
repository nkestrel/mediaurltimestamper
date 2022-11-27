/*
 * Media URL Timestamper
 * Firefox Web Extension
 * Copyright (C) 2017 Kestrel
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

browser.runtime.onMessage.addListener(function(message, sender) {
  switch (message.action) {
    case ("historyDeleteUrl"):
      browser.history.deleteUrl({url: message.url});
      break;
    case ("updatePageAction"):
      updatePageAction(sender.tab.id, message.show, message.automatic);
      break;
  }
});

browser.pageAction.onClicked.addListener(function(tab) {
  browser.tabs.sendMessage(tab.id, {action: "doTimestamp"});
});

browser.contextMenus.create({
  id: "updateTimestamp",
  title: browser.i18n.getMessage("menu_updateTimestamp"),
  contexts: ["page_action"]
});

browser.contextMenus.create({
  id: "clearTimestamp",
  title: browser.i18n.getMessage("menu_clearTimestamp"),
  contexts: ["page_action"]
});

browser.contextMenus.create({
  id: "toggleAuto",
  title: browser.i18n.getMessage("menu_toggleAuto"),
  type: "checkbox",
  contexts: ["page_action"]
});

browser.contextMenus.onClicked.addListener(function(info, tab) {
  switch (info.menuItemId) {
    case "updateTimestamp":
      browser.tabs.sendMessage(tab.id, {action: "doTimestamp"});
      break;
    case "clearTimestamp":
      browser.tabs.sendMessage(tab.id, {action: "clearTimestamp"});
      break;
    case "toggleAuto":
      browser.tabs.sendMessage(tab.id, {action: "toggleAuto"});
      break;
  }
});

browser.contextMenus.onShown.addListener((info, tab) => {
  browser.tabs.sendMessage(tab.id, {action: "getAutoMode"}).then(automatic => {
    browser.contextMenus.update("toggleAuto", {checked: automatic});
    browser.contextMenus.refresh();
  });
});

function updatePageAction(tabId, show, enabled) {
  let disabledSuffix = (enabled ? "" : "disabled");
  browser.pageAction.setIcon({
    tabId: tabId,
    path: {
      "19": "icons/icon19" + disabledSuffix + ".png",
      "38": "icons/icon38" + disabledSuffix + ".png",
    }
  });
  let title = browser.i18n.getMessage("extensionName") + " (" +
              (enabled ? browser.i18n.getMessage("tooltip_automaticMode") :
                         browser.i18n.getMessage("tooltip_manualMode")) + ")";
  browser.pageAction.setTitle({
    tabId: tabId,
    title
  });
  if (show) {
    browser.pageAction.show(tabId);
  } else {
    browser.pageAction.hide(tabId);
  }
}


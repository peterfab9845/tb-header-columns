// This Source Code Form is subject to the terms of the
// GNU General Public License, version 3.0.

"use strict";
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
var { ExtensionSupport } = ChromeUtils.import('resource:///modules/ExtensionSupport.jsm');
var { ExtensionParent } = ChromeUtils.import('resource://gre/modules/ExtensionParent.jsm');

const EXTENSION_NAME = "original-to-column@peterfab.com";
var extension = ExtensionParent.GlobalManager.getExtension(EXTENSION_NAME);

// Implements the functions defined in the experiments section of schema.json.
var CustomColumns = class extends ExtensionCommon.ExtensionAPI {
  onStartup() {
  }

  onShutdown(isAppShutdown) {
    if (isAppShutdown) return;
    // Looks like we got uninstalled. Maybe a new version will be installed now.
    // Due to new versions not taking effect (https://bugzilla.mozilla.org/show_bug.cgi?id=1634348)
    // we invalidate the startup cache. That's the same effect as starting with -purgecaches
    // (or deleting the startupCache directory from the profile).
    Services.obs.notifyObservers(null, "startupcache-invalidate");
  }

  getAPI(context) {
    context.callOnClose(this);
    return {
      CustomColumns: {
        addCustomDBHeader() {
          // Add the X-Original-To header to customDBHeaders
          let customDBHeaders = Services.prefs.getStringPref("mailnews.customDBHeaders");
          if (!customDBHeaders.toLowerCase().includes("x-original-to")) {
            // the DB entry is case-insensitive, all are used in lowercase
            customDBHeaders += " X-Original-To";
            Services.prefs.setStringPref("mailnews.customDBHeaders", customDBHeaders);
          }
        },
        addWindowListener() {
          // Adds a listener to detect new windows.
          ExtensionSupport.registerWindowListener(EXTENSION_NAME, {
            chromeURLs: ["chrome://messenger/content/messenger.xul",
                         "chrome://messenger/content/messenger.xhtml"],
            onLoadWindow: paint,
            onUnloadWindow: unpaint,
          });
        }
      }
    }
  }

  close() {
    ExtensionSupport.unregisterWindowListener(EXTENSION_NAME);
    for (let win of Services.wm.getEnumerator("mail:3pane")) {
      unpaint(win);
    }
  }
};

function paint(win) {
  win.CustomColumns = {};
  Services.scriptloader.loadSubScript(extension.getURL("customcol.js"), win.CustomColumns);
  win.CustomColumns.CustomColumnsHeaderView.init(win);
}

function unpaint(win) {
  win.CustomColumns.CustomColumnsHeaderView.destroy();
  delete win.CustomColumns;
}

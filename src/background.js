"use strict";

async function init() {
  browser.CustomColumns.addWindowListener();
}
init();

async function addCustomDBHeader() {
  // Add the X-Original-To header to customDBHeaders
  let customDBHeaders = await messenger.LegacyPrefs.getPref("mailnews.customDBHeaders", "");
  if (!customDBHeaders.toLowerCase().includes("x-original-to")) {
    // the DB entry is case-insensitive, all are used in lowercase
    customDBHeaders += " X-Original-To";
    await messenger.LegacyPrefs.setPref("mailnews.customDBHeaders", customDBHeaders);
  }
}
messenger.runtime.onInstalled.addListener(async (details) => {
  addCustomDBHeader();
});

/* Did not work right - "Error: Can't find profile directory." Not triggered
   soon enough? I removed the management permission since I'm not using it
   anywhere else.
   This functionality is currently in onShutdown() in the CustomColumns API
async function removeCustomDBHeader() {
  // Remove the X-Original-To header from customDBHeaders
  let customDBHeaders = await messenger.LegacyPrefs.getPref("mailnews.customDBHeaders", "");
  customDBHeaders = customDBHeaders.replace(/x-original-to/i, "");
  await messenger.LegacyPrefs.setPref("mailnews.customDBHeaders", customDBHeaders);
}
messenger.management.onUninstalled.addListener(async (info) => {
  if (info.id == messenger.runtime.id) {
    removeCustomDBHeader();
  }
});
*/


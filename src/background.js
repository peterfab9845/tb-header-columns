"use strict";

async function init() {
  browser.CustomColumns.addWindowListener();
}
init();

async function addCustomDBHeader() {
  // Add the X-Original-To header to customDBHeaders if it's missing
  let customDBHeaders = await messenger.LegacyPrefs.getPref("mailnews.customDBHeaders", "");
  if (!customDBHeaders.toLowerCase().includes("x-original-to")) {
    // the DB entry is case-insensitive, all are used in lowercase
    customDBHeaders += " x-original-to";
    await messenger.LegacyPrefs.setPref("mailnews.customDBHeaders", customDBHeaders);
  }
}
addCustomDBHeader();


"use strict";

async function init() {
  await addCustomDBHeader("X-Original-To");
  messenger.ex_runtime.onDisable.addListener(removeCustomDBHeader.bind(null, "X-Original-To"));
  messenger.CustomColumns.registerColumn("originalToColumn", "X-Original-To", "Sort by X-Original-To header", "X-Original-To", false);

  messenger.CustomColumns.addWindowListener(); // this has to come last, TODO make runtime add/remove possible
}
init();

// Add a header to customDBHeaders if it's missing
async function addCustomDBHeader(headerName) {
  let customDBHeaders = await messenger.LegacyPrefs.getPref("mailnews.customDBHeaders", "");
  if (!customDBHeaders.toLowerCase().includes(headerName.toLowerCase())) {
    customDBHeaders += " " + headerName;
    await messenger.LegacyPrefs.setPref("mailnews.customDBHeaders", customDBHeaders);
  }
}

// Remove a header from customDBHeaders if it's present
async function removeCustomDBHeader(headerName) {
  let customDBHeaders = await messenger.LegacyPrefs.getPref("mailnews.customDBHeaders", "");
  let regex = new RegExp(` *${headerName}`, "i");
  customDBHeaders = customDBHeaders.replace(regex, "");
  await messenger.LegacyPrefs.setPref("mailnews.customDBHeaders", customDBHeaders);
}


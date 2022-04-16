"use strict";

async function init() {
  // create window listener for custom columns
  messenger.HeaderColumns.addWindowListener();

  // set up customDBHeaders
  // TODO
  //await addCustomDBHeader("X-Original-To");
  //messenger.ex_runtime.onDisable.addListener(removeCustomDBHeader.bind(null, "X-Original-To"));

  // add the column
  let testTree = {
    "nodeType": "first",
    "children": [
      {
        "nodeType": "regex",
        "pattern": "@.*",
        "flags": "",
        "replacement": "",
        "child": {
          "nodeType": "first",
          "children": [
            {
              "nodeType": "header",
              "headerName": "X-Delivered-to"
            },
            {
              "nodeType": "header",
              "headerName": "X-Original-To"
            }
          ]
        }
      },
      {
        "nodeType": "literal",
        "literalString": "Unknown"
      }
    ]
  };
  messenger.HeaderColumns.registerColumn("headerColumn-test", "test", "Sort by test", testTree, false);
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


"use strict";

async function init() {
  let tree = (await browser.storage.sync.get("tree")).tree;
  if (tree) {
    registerTestTree(tree);
  }
}

function onStorageChanged(changes, areaName) {
  if (areaName == "sync" && "tree" in changes) {
    let tree = changes.tree.newValue;
    if (tree) {
      registerTestTree(tree);
    }
  }
}

function registerTestTree(tree) {
  let testOptions = {
    "sortNumeric": false,
    "useDBHeaders": false
  };
  messenger.HeaderColumns.registerColumn("headerColumn-test", "test", "Sort by test", tree, testOptions);
}

browser.storage.onChanged.addListener(onStorageChanged);
init();


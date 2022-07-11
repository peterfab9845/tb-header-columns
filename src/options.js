"use strict";

const defaultTree = {
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
            "headerName": "X-Original-To",
            "headerIndex": 0
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

function init() {
  document.querySelector("#treeForm").addEventListener("submit", saveStorage);
  document.querySelector("#resetButton").addEventListener("click", resetStorage);
  loadStorage();
}

function saveStorage(e) {
  e.preventDefault();

  let treeText = document.querySelector("#treeInput").value;
  if (!treeText) {
    browser.storage.sync.remove("tree");
  } else {
    let tree = JSON.parse(treeText);
    if (tree) {
      browser.storage.sync.set({
        "tree": tree
      });
    }
  }
}

async function loadStorage() {
  let tree = (await browser.storage.sync.get("tree")).tree;
  showTree(tree);
}

function resetStorage() {
  browser.storage.sync.set({
    "tree": defaultTree
  });
}

function onStorageChanged(changes, areaName) {
  if (areaName === "sync" && "tree" in changes) {
    showTree(changes.tree.newValue);
  }
}

function showTree(tree) {
  let treeText = tree ? JSON.stringify(tree, null, "  ") : "";
  document.querySelector("#treeInput").value = treeText;
}

document.addEventListener("DOMContentLoaded", init);
browser.storage.onChanged.addListener(onStorageChanged);


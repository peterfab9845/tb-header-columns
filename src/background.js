"use strict";

let addedColumn = false;
let parseTree = {};

async function init() {
  let tree = (await browser.storage.sync.get("tree")).tree;
  if (tree) {
    parseTree = tree;
    registerTestTree(tree);
  }
}

function onStorageChanged(changes, areaName) {
  if (areaName === "sync" && "tree" in changes) {
    let tree = changes.tree.newValue;
    if (tree) {
      parseTree = tree;
      // this is too aggressive, only re-register if column definition changed (currently not user-controlled).
      // fix it with multiple columns
      registerTestTree(tree);
    }
  }
}

function registerTestTree(tree) {
  //let testOptions = {
  //  "sortNumeric": false
  //};
  if (addedColumn) {
    browser.mailTabs.removeColumn("headerColumn");
    addedColumn = false;
  }
  browser.mailTabs.addColumn("headerColumn", {
    "sortable": true,
    "name": "Header Column",
    "hidden": false,
    "resizable": true
  });
  addedColumn = true;

  browser.mailTabs.onCellEntriesShown.addListener(updateCellEntries); // async
}

async function updateCellEntries(columnId, entries) {
  if (columnId != "headerColumn") {
    return;
  }

  let cellUpdatePromises = [];
  for (let entry of entries) {
    cellUpdatePromises.push(getCellValue(entry.messageHeader.id));
  }
  let cellUpdates = await Promise.all(cellUpdatePromises);
  browser.mailTabs.setCellData(columnId, cellUpdates);
}

async function getCellValue(messageId) {
  let msg = await messenger.messages.getFull(messageId);
  let parseResult = parse(parseTree, msg.headers);
  let entryData = {
    "messageId": messageId,
    "data": {
      "text": parseResult
      // TODO: sort
    }
  };
  return entryData;
}

function parse(node, headers) {
  // Recursively parse the tree to create the column content.
  switch (node.nodeType) {
    case "literal":
      return node.literalString;
    case "header":
      // at() instead of [] allows -1 => last
      return headers?.[node.headerName.toLowerCase()]?.at(node.headerIndex ?? 0) ?? "";
    case "replace":
      if (node.replaceAll) {
        return parse(node.child, headers).replaceAll(node.target, node.replacement);
      } else {
        return parse(node.child, headers).replace(node.target, node.replacement);
      }
    case "regex":
      let re = new RegExp(node.pattern, node.flags); // potential errors
      return parse(node.child, headers).replace(re, node.replacement);
    case "concat":
      return node.children.map((child) => parse(child, headers)).join('');
    case "first":
      for (const child of node.children) {
        let childResult = parse(child, headers);
        if (childResult != "") {
          return childResult;
        }
      }
      return "";
    default:
      console.error(`HeaderColumns: Unsupported node type '${node.nodeType}'.`);
      return "";
  }
  return "";
}

browser.storage.onChanged.addListener(onStorageChanged);
init();


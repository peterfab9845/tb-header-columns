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

  browser.mailTabs.onCellEntriesShown.addListener(updateCellEntries);

  browser.mailTabs.addColumn("headerColumn", {
    "name": "Header Column",
    "sortable": "bySortKey",
    "hidden": false,
    "resizable": true
  });
  addedColumn = true;
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
  let cellText = parse(parseTree, msg.headers);
  let sortKey = floatToLongOrder(parseFloat(cellText));
  let entryData = {
    "messageId": messageId,
    "data": {
      "text": cellText,
      "sort": sortKey,
      "icon": null
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

function floatToLongOrder(val) {
  // Map float to long, preserving order. This takes advantage of the fact
  // that the binary value of least significant 31 bits of an IEEE-754 float
  // has an ordered correspondence with the absolute magnitude of the number.

  // Sort non-numbers before numbers
  if (!isFinite(val)) {
    // 0 can only result from 0xffffffff, which corresponds to one of the
    // many possible representations of NaN. This one appears unused.
    return 0;
  }

  // Turn the float into a uint32 to allow bitwise operations.
  let view = new DataView(new ArrayBuffer(4));
  view.setFloat32(0, val);
  let bits = view.getUint32(0);

  // There are two problems we need to correct:
  // 1. Negatives sort in reverse order. (More-negative numbers have a higher
  //      unsigned binary value than less-negative numbers.)
  // 2. Negatives sort before positives. (Negatives start with a 1).
  //
  // To address #1, we can invert the non-sign bits if the number is negative.
  // This reverses the ordering within the negative range.
  // To address #2, we can invert the sign bit unconditionally. This swaps
  // the negatives and positives in the unsigned integer range.
  //
  // Here is how these two are accomplished:
  // First, arithmetic right-shift the value by 31 to produce 32 bits of 1s
  // for a negative number and 32 bits of 0s for a positive number. Then, OR
  // this with 0x80000000 to set the MSB to 1 unconditionally. Finally, XOR
  // the resulting mask with the original value to do #1 and #2 simultaneously.
  return bits ^ ((bits >> 31) | (1 << 31));
}

browser.storage.onChanged.addListener(onStorageChanged);
init();


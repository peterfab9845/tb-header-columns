// This Source Code Form is subject to the terms of the
// GNU General Public License, version 3.0.

"use strict";

var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
var { ExtensionSupport } = ChromeUtils.import('resource:///modules/ExtensionSupport.jsm');
var { ExtensionParent } = ChromeUtils.import('resource://gre/modules/ExtensionParent.jsm');

const EXTENSION_NAME = "original-to-column@peterfab.com";
var extension = ExtensionParent.GlobalManager.getExtension(EXTENSION_NAME);

const MSG_VIEW_FLAG_DUMMY = 0x20000000; // from DBViewWrapper.jsm

var columnList = []; // list of columns to be added

// Construct a column handler for the given header name
function ColumnHandler(parseTree, sortNumeric) {
  // access to the window object
  this.init = function(win) { this.win = win; };

  // Required (?) custom column handler functions, per
  // https://searchfox.org/comm-central/source/mailnews/base/public/nsIMsgCustomColumnHandler.idl
  // Not sure if the requirement is up to date on what actually gets called,
  // but it seems to work fine without some of the "required" ones anyway

  // functions directly from nsIMsgCustomColumnHandler
  this.getSortStringForRow = function(aHdr) { return this.getText(aHdr); };
  this.getSortLongForRow = function(aHdr) {
    // Map float to long, preserving order. This takes advantage of the fact
    // that the binary value of least significant 31 bits of an IEEE-754 float
    // has an ordered correspondence with the absolute magnitude of the number.

    // First get the float value
    let val = parseFloat(this.getText(aHdr));

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
  };
  this.isString = function() { return !sortNumeric; };

  // functions inherited from nsITreeView
  this.getRowProperties = function(index) { return ""; };
  this.getCellProperties = function(row, col) { return ""; };
  this.getImageSrc = function(row, col) { return ""; };
  this.getCellText = function(row, col) {
    if (!this.isDummy(row)) {
      return this.getText(this.win.gDBView.getMsgHdrAt(row));
    } else {
      return "";
    }
  };
  this.cycleCell = function(row, col) {};
  this.isEditable = function(row, col) { return false; };

  // local functions
  this.isDummy = function(row) { return (this.win.gDBView.getFlagsAt(row) & MSG_VIEW_FLAG_DUMMY) != 0; };
  this.getText = function(aHdr) {
    return this.parse(parseTree, aHdr);
  };
  this.parse = function(node, aHdr) {
    // Recursively parse the tree to create the column content.
    switch (node.nodeType) {
      case "literal":
        return node.literalString;
      case "header":
        // The desired headers must be stored in the message database, which is
        // controlled by mailnews.customDBHeaders preference.
        // getStringProperty returns "" if nothing is found.
        return aHdr.getStringProperty(node.headerName.toLowerCase());
      case "replace":
        if (node.replaceAll) {
          return this.parse(node.child, aHdr).replace(node.target, node.replacement);
        } else {
          return this.parse(node.child, aHdr).replaceAll(node.target, node.replacement);
        }
      case "regex":
        let re = new RegExp(node.pattern, node.flags); // potential errors
        return this.parse(node.child, aHdr).replace(re, node.replacement);
      case "concat":
        return node.children.map((child) => this.parse(child, aHdr)).join('');
      case "first":
        for (const child of node.children) {
          let childResult = this.parse(child, aHdr);
          if (childResult != "") {
            return childResult;
          }
        }
        return "";
      default:
        console.log(`HeaderColumns: Unsupported node type '${node.nodeType}'.`);
        return "";
    }
    return "";
  }
}

// Implements the functions defined in the experiments section of schema.json.
var HeaderColumns = class extends ExtensionCommon.ExtensionAPI {
  onStartup() {
    // don't actually care about startup, just using the startup event so that
    // the experiment gets loaded
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
      HeaderColumns: {
        addWindowListener() {
          // Adds a listener to detect new windows.
          ExtensionSupport.registerWindowListener(EXTENSION_NAME, {
            chromeURLs: [
              "chrome://messenger/content/messenger.xul",
              "chrome://messenger/content/messenger.xhtml"
            ],
            onLoadWindow: paint,
            onUnloadWindow: unpaint,
          });
        },
        registerColumn(id, label, tooltip, parseTree, sortNumeric) {
          let handler = new ColumnHandler(parseTree, sortNumeric);
          columnList.push({
            "id": id,
            "label": label,
            "tooltip": tooltip,
            "handler": handler
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
  win.HeaderColumns = {};
  Services.scriptloader.loadSubScript(extension.getURL("api/HeaderColumns/customcol.js"), win.HeaderColumns);
  win.HeaderColumns.columnList = columnList;
  win.HeaderColumns.HeaderColumnsView.init(win);
}

function unpaint(win) {
  win.HeaderColumns.HeaderColumnsView.destroy();
  delete win.HeaderColumns;
}


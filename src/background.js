"use strict";

/* globals browser */

var init = async () => {
  browser.CustomColumns.addWindowListener();
};
init();

var setup = async (details) => {
  browser.CustomColumns.addCustomDBHeader();
};
messenger.runtime.onInstalled.addListener(setup);


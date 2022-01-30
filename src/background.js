"use strict";

/* globals browser */

var init = async () => {
  browser.FAC.addWindowListener();
};
init();

var setup = async (details) => {
  browser.FAC.addCustomDBHeader();
};
messenger.runtime.onInstalled.addListener(setup);


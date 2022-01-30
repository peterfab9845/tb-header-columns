"use strict";

/* globals browser */

var init = async () => {
  browser.FAC.addWindowListener("dummy");
};
init();

var setup = async () => {
  browser.FAC.addCustomDBHeader();
};
messenger.runtime.onInstalled.addListener(setup);


var ex_runtime = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    const { ExtensionCommon } = ChromeUtils.import(
        "resource://gre/modules/ExtensionCommon.jsm");
    const { AddonManager } = ChromeUtils.import(
        "resource://gre/modules/AddonManager.jsm");
    const { setTimeout } = ChromeUtils.import(
        "resource://gre/modules/Timer.jsm");
    const tManager = Cc["@mozilla.org/thread-manager;1"].getService();

    return {
      ex_runtime: {
        onDisable: new ExtensionCommon.EventManager({
          context,
          name: "ex_runtime.onDisable",
          register: fire => {
            const handleDisablingAction = function(addon) {
              if (addon.id !== context.extension.id) {
                return;
              }
              // the API we're using here is synchronous, and getting that
              // to play nice with an async event in a scope that dies once we
              // return would be a pain. For now, do the dirty thing and delay
              // for a second.
              fire.async();
              let done = false;
              setTimeout(() => done = true, 1000);
              while (!done) {
                tManager.currentThread.processNextEvent(true);
              }
            };
            const listener = {
              onDisabling(addon, needsRestart) {
                handleDisablingAction(addon);
              },
              onUninstalling(addon, needsRestart) {
                handleDisablingAction(addon);
              },
            };
            AddonManager.addAddonListener(listener);
            return () => { AddonManager.removeAddonListener(listener); };
          }
        }).api()
      }
    };
  }
};

// This Source Code Form is subject to the terms of the
// GNU General Public License, version 3.0.

var { AppConstants } = ChromeUtils.import("resource://gre/modules/AppConstants.jsm");
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

const columnOverlay = {
  init(win) {
    this.win = win;
    this.addColumns();
    Services.obs.addObserver(this, "MsgCreateDBView", false);
  },

  destroy() {
    this.destroyColumns();
    Services.obs.removeObserver(this, "MsgCreateDBView");
  },

  observe(aMsgFolder, aTopic, aData) {
    this.registerHandlers();
  },

  registerHandlers() {
    // Register the column handlers to be used by the column elements.
    // No need to remove old handlers here; they can just be overwritten.
    for (const [id, col] of managedColumns) {
      try {
        // Copy the handler so its window property can be different when
        // the same handler ref is passed to multiple instances of customcol
        const handlerCopy = Object.assign({}, col.handler);
        handlerCopy.init(this.win);
        this.win.gDBView.addColumnHandler(id, handlerCopy);
      } catch (ex) {
        console.error(ex);
        throw new Error(`Cannot add column handler for column ID ${id}`);
      }
    }
  },

  // Add a column element to the tree. This is just the visual element, the
  // handlers are added in observe().
  addColumn(columnId, columnLabel, columnTooltip) {
    // remove an old column if it already exists
    this.destroyColumn(columnId);

    const treeCol = this.win.document.createXULElement("treecol");
    treeCol.setAttribute("id", columnId);
    treeCol.setAttribute("persist", "hidden ordinal sortDirection width");
    treeCol.setAttribute("flex", "2");
    treeCol.setAttribute("closemenu", "none");
    treeCol.setAttribute("label", columnLabel);
    treeCol.setAttribute("tooltiptext", columnTooltip);

    const threadCols = this.win.document.getElementById("threadCols");
    threadCols.appendChild(treeCol);

    // Restore persisted attributes.
    let attributes = Services.xulStore.getAttributeEnumerator(
      this.win.document.URL,
      columnId
    );
    for (let attribute of attributes) {
      let value = Services.xulStore.getValue(this.win.document.URL, columnId, attribute);
      // See Thunderbird bug 1607575 and bug 1612055.
      if (attribute != "ordinal" || parseInt(AppConstants.MOZ_APP_VERSION, 10) < 74) {
        treeCol.setAttribute(attribute, value);
      } else {
        treeCol.ordinal = value;
      }
    }
  },

  addColumns() {
    for (const [id, col] of managedColumns) {
      this.addColumn(id, col.label, col.tooltip);
    }
  },

  // Remove a column element from the tree.
  destroyColumn(columnId) {
    const treeCol = this.win.document.getElementById(columnId);
    if (!treeCol) return;
    treeCol.remove();
  },

  destroyColumns() {
    for (const id of managedColumns.keys()) {
      this.destroyColumn(id);
    }
  },
};

var CustomColumnsView = {
  init(win) {
    this.win = win;
    columnOverlay.init(win);

    // Usually the column handler is added when the window loads.
    // In our setup it's added later and we may miss the first notification.
    // So we fire one ourselves.
    if (win.gDBView && win.document.documentElement.getAttribute("windowtype") == "mail:3pane") {
      columnOverlay.registerHandlers();
    }
  },

  destroy() {
    columnOverlay.destroy();
  },
};

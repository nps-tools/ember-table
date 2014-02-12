Ember.AddeparMixins = Ember.AddeparMixins || Ember.Namespace.create();

Ember.AddeparMixins.SelectionMixin = Ember.Mixin.create({
  selection: [],
  addSelected: function (row) {
    var selection = this.get('selection');
    if (!selection.contains(row)) {
      row.set('isSelected', true);
      selection.pushObject(row);
    }
  },
  addSelectedRows: function (rows) {
    var selection = this.get('selection');
    rows.forEach(function (row) {
      if (!selection.contains(row)) {
        row.set('isSelected', true);
        selection.pushObject(row);
      }
    });
  },
  removeSelected: function (row) {
    var selection = this.get('selection');
    selection.removeObject(row);
    row.set('isSelected', false);
  },
  selectAll: function () {
    var selection = this.get('selection');
    selection.clear();
    // needs to be checked because content might be either regular array or array proxy
    var content = (Array.isArray(this.get('content'))) ? this.get('content') : this.get('content.content');
    content.forEach(function (row) {
      row.set('isSelected', true);
    });
    selection.pushObjects(content);
    
    // Trigger selectedRowsDidChange
    this.sendAction('selectedRowsDidChange', selection);
  },
  clearSelection: function () {
    this.get('selection').forEach(function (row) {
      row.set('isSelected', false);
    });
    this.get('selection').clear();
  },
  selectWithArrow: function (ev, direction) {

    // If selection is not performed with shift key, clear selection
    if (!ev.shiftKey) {
      this.clearSelection();
    }

    // Find the end point, last selected row.
    var endPoint = (this.get('lastIndecClickShift') !== undefined) ? this.get('lastIndecClickShift') : this.get('baseSelectedIndex');

    // Find out the next selected row
    var nextIndex;
    if (direction === 'up') {
      nextIndex = endPoint - 1;
    }
    if (direction === 'down') {
      nextIndex = endPoint + 1;
    }
    var nextRow = this.get('content').objectAt(nextIndex);

    // if the next row is already selected thats mean that selection is 'walking' back. 
    if (this.get('selection').contains(nextRow)) {
      //Remove last selected row.
      var rowToRemove = this.get('content').objectAt(endPoint);
      this.removeSelected(rowToRemove);
    } else {
      this.addSelected(nextRow);
    }

    this.set('baseSelectedIndex', nextIndex);
    this.set('lastIndecClickShift', undefined);

    // Trigger selectedRowsDidChange
    this.sendAction('selectedRowsDidChange', this.get('selection'));
  },
  handleSelection: function (ev, row) {

    if (row === void 0) { return; }
    // if none of the ctrl, meta, and shift keys
    // are pressed, clear the selection
    if (!ev.ctrlKey && !ev.metaKey && !ev.shiftKey) {
      this.clearSelection();
    }

    // Get index of clicked row
    var rowIndex = this.get('content').indexOf(row);

    // if selection is performed with shift key
    // the selected items should be between the first
    // and currently clicked items
    if (ev.shiftKey) {
      var minIndex = Math.min(this.get('baseSelectedIndex'), rowIndex),
        maxIndex = Math.max(this.get('baseSelectedIndex'), rowIndex);
      this.clearSelection();
      var rowsToSelect = [];
      for (var i = minIndex; i <= maxIndex; i += 1) {
        rowsToSelect.pushObject(this.get('content').objectAt(i));
      }
      this.addSelectedRows(rowsToSelect);
    }

    // Save index of click in row without shift (simple click) or first click
    if (!ev.shiftKey || this.get('baseSelectedIndex') === undefined) {
      this.set('baseSelectedIndex', rowIndex);
      this.set('lastIndecClickShift', undefined);
    } else {
      this.set('lastIndecClickShift', rowIndex);
    }

    if ((ev.ctrlKey || ev.metaKey) && this.get('selection').contains(row)) {
      // If ctrl or command, and row is already selected, unselect row.
      this.removeSelected(row);
      // If there is no more selected rows
      if (this.get('selection.length') === 0) {
        this.set('baseSelectedIndex', undefined);
      }
    } else {
      this.addSelected(row);
    }

    // Trigger selectedRowsDidChange
    this.sendAction('selectedRowsDidChange', this.get('selection'));
  },
  mouseDown: function (ev) {
    var row = this.getRowForEvent(ev);
    if (row !== void 0 && !row.get('content').get('isSelected')) {
      this.set('preventClick', true);
      return this.handleSelection(ev, row.get('content'));
    }
  },
  click: function (ev) {
    var row = this.getRowForEvent(ev);
    if (row !== void 0 && row.get('content').get('isSelected') && !this.get('preventClick')) {
      return this.handleSelection(ev, row.get('content'));
    }
    this.set('preventClick', false);
  },
  keyDown: function (ev) {
    // disable default scrolling strategy of the browser
    switch (ev.keyCode) {
      // arrow up
      case 38:
        ev.preventDefault();
        return this.selectWithArrow(ev, 'up');
      // arrow down
      case 40:
        ev.preventDefault();
        return this.selectWithArrow(ev, 'down');
      // a
      case 65:
        if (ev.shiftKey) { return this.selectAll(); }
    }
  },
  /**
   * Content menu event (mouse right click) behavior:
   * 1. If click is on the row that is not selected, the clicked row becomes the selection
   * 2. If click is on the row that currently is in the list of selection, selection does not change
   * @param ev
   */
  contextMenu: function (ev) {
    var clickedRow = this.getRowForEvent(ev);
    if (!this.get('selection').contains(clickedRow.get('content'))) {
      this.clearSelection();
      this.addSelected(clickedRow.get('content'));
    }
    this.sendAction('contextMenuHandler', this.get('selection'));
  }
});

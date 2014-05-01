Ember.AddeparMixins = Ember.AddeparMixins || Ember.Namespace.create();

Ember.AddeparMixins.SelectionMixin = Ember.Mixin.create({
  /**
   * @property {array} selection The array of selected rows (rawRows)
   */
  selection: [],

  /**
   * @property {array} rawRows The content of every Ember.Table.Row currently in the table
   */
  rawRows: function () {
    return this.get('bodyContent').mapBy('content');
  }.property('bodyContent'),

  /**
   * Gets the raw row at a specific index
   * @param {number} rowIndex The index of the row to get
   * @return {mixed} The rawRow (content of the Ember.Table.Row)
   */
  getRawRowAt: function (rowIndex) {
    return this.get('rawRows').objectAt(rowIndex);
  },
  
  /**
   * Adds a row to the selection
   *
   * Does NOT send any actions
   * 
   * @param {mixed} rawRow This is the "rawRow" (the content of the Ember.Table.Row)
   */
  addSelected: function (rawRow) {
    this.addSelectedRows([rawRow]);
  },

  /**
   * Adds an array of rows to the selection
   *
   * Does NOT send any actions
   * 
   * @param {array} rawRows This is the array of "rawRow" items (each the content of 
   * their corresponding Ember.Table.Row)
   */
  addSelectedRows: function (rawRows) {
    var selection;

    selection = this.get('selection');

    rawRows.forEach(function (rawRow) {
      if (!selection.contains(rawRow)) {
        rawRow.set('isSelected', true);
        selection.pushObject(rawRow);
      }
    });
  },
  
  /**
   * Removes a row from the selection
   *
   * Does NOT send any actions
   * 
   * @param {mixed} rawRow This is the "rawRow" (the content of the Ember.Table.Row)
   */
  removeSelected: function (rawRow) {
    var selection;

    selection = this.get('selection');

    selection.removeObject(rawRow);
    rawRow.set('isSelected', false);
  },

  /**
   * Selects all the rows in the table
   *
   * Sends the 'selectedRowsDidChange' action
   */
  selectAll: function () {
    var selection;
    var rawRows;

    selection = this.get('selection');

    selection.clear();
    
    rawRows = this.get('rawRows');

    rawRows.setEach('isSelected', true);
    
    selection.pushObjects(rawRows);
    
    // Trigger selectedRowsDidChange
    this.sendAction('selectedRowsDidChange', selection);
  },

  /**
   * Clears any selected rows in the table.
   *
   * Does NOT send any actions
   */
  clearSelection: function () {
    var selection;

    selection = this.get('selection');

    selection.setEach('isSelected', false);
    selection.clear();
  },
  
  /**
   * Handles the select with arrow key functionality. Up moves up a row, down moves down
   * a row.  Support shift selections with the arrow keys.
   * 
   * Stops at the beginning and end of the table.
   *
   * Sends the 'selectedRowsDidChange' action (on success)
   * 
   * @param {object} ev The event object
   * @param {string} direction The direction (one of 'up' or 'down')
   */
  selectWithArrow: function (ev, direction) {
    var nextIndex;
    var endPoint;
    var nextRawRow;
    var rawRowToRemove;
    var rawRows;

    // Find the end point, last selected row.
    endPoint = (this.get('lastIndecClickShift') !== undefined) ? this.get('lastIndecClickShift') : this.get('baseSelectedIndex');

    rawRows = this.get('rawRows');

    // Find out the next selected row
    if (direction === 'up') {
      // stop on the first row
      if (endPoint === 0) {
        return;
      } else {
        nextIndex = endPoint - 1;
      }
    } else {
      // stop on last row
      if (endPoint === rawRows.get('length') - 1) {
        return;
      } else {
        nextIndex = endPoint + 1;
      }
    }
    
    nextRawRow = this.getRawRowAt(nextIndex);

    // if we could not find the nextRawRow then stop
    if (!nextRawRow) {
      return;
    }

    // Decide what to do about the prev selection
    // based on if shift key is held down
    if (ev.shiftKey) {
      if (this.get('selection').contains(nextRawRow)) {
        // Remove last selected row.
        rawRowToRemove = this.getRawRowAt(endPoint);
        this.removeSelected(rawRowToRemove);
      }
    } else {
      this.clearSelection();
    }

    // add the next row to the selection
    this.addSelected(nextRawRow);

    this.set('baseSelectedIndex', nextIndex);
    this.set('lastIndecClickShift', undefined);

    // Trigger selectedRowsDidChange
    this.sendAction('selectedRowsDidChange', this.get('selection'));
  },

  /**
   * Handles a selection of a row by it's content (rawRow)
   *
   * Sends the 'selectedRowsDidChange' action (on success)
   * 
   * @param {object} ev The event
   * @param {mixed} rawRow The raw row (the content of the Ember.Table.Row)
   */
  handleSelection: function (ev, rawRow) {
    var rowIndex;
    var minIndex;
    var maxIndex;
    var rawRowsToSelect;
    var rawRows;

    if (rawRow === void 0) {
      return; 
    }

    // if none of the ctrl, meta, and shift keys
    // are pressed, clear the selection
    if (!ev.ctrlKey && !ev.metaKey && !ev.shiftKey) {
      this.clearSelection();
    }

    // Get index of clicked row
    rawRows = this.get('rawRows');

    rowIndex = rawRows.indexOf(rawRow);

    // if selection is performed with shift key
    // the selected items should be between the first
    // and currently clicked items
    if (ev.shiftKey) {
      minIndex = Math.min(this.get('baseSelectedIndex'), rowIndex);
      maxIndex = Math.max(this.get('baseSelectedIndex'), rowIndex);

      this.clearSelection();
      
      rawRowsToSelect = [];
      
      for (var i = minIndex; i <= maxIndex; i++) {
        rawRowsToSelect.pushObject(this.getRawRowAt(i));
      }
      
      this.addSelectedRows(rawRowsToSelect);
    }

    // Save index of click in row without shift (simple click) or first click
    if (!ev.shiftKey || this.get('baseSelectedIndex') === undefined) {
      this.set('baseSelectedIndex', rowIndex);
      this.set('lastIndecClickShift', undefined);
    } else {
      this.set('lastIndecClickShift', rowIndex);
    }

    if ((ev.ctrlKey || ev.metaKey) && this.get('selection').contains(rawRow)) {
      // If ctrl or command, and row is already selected, unselect row.
      this.removeSelected(rawRow);

      // If there is no more selected rows
      if (this.get('selection.length') === 0) {
        this.set('baseSelectedIndex', undefined);
      }
    } else {
      this.addSelected(rawRow);
    }

    // Trigger selectedRowsDidChange
    this.sendAction('selectedRowsDidChange', this.get('selection'));
  },

  /**
   * Handles the mouse down event
   */
  mouseDown: function (ev) {
    var row;
    var rawRow;

    row = this.getRowForEvent(ev);

    if (row !== void 0) {
      rawRow = row.get('content');

      if (!rawRow.get('isSelected')) {
        this.set('preventClick', true);
        return this.handleSelection(ev, rawRow);
      }
    }
  },
  
  /**
   * Handles the click event
   */
  click: function (ev) {
    var row;
    var rawRow;

    row = this.getRowForEvent(ev);

    if (row !== void 0 && !this.get('preventClick')) {
      rawRow = row.get('content');

      if (rawRow.get('isSelected')) {
        return this.handleSelection(ev, row.get('content'));
      }
    }
    
    this.set('preventClick', false);
  },
  
  /**
   * Handles special key events
   * - 'up' --> selectWithArrow
   * - 'down' --> selectWithArrow
   * -- shift + 'a' --> selectAll
   * 
   * @param {object} ev The event
   */
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
        if (ev.ctrlKey || ev.metaKey) {
          ev.preventDefault();
          return this.selectAll(); 
        }
        break;
    }
  },

  /**
   * Content menu event (mouse right click) behavior:
   * 1. If click is on the row that is not selected, the clicked row becomes the selection
   * 2. If click is on the row that currently is in the list of selection, selection does not change
   *
   * Sends the 'contextMenuHandler' action
   * 
   * @param {object} ev The event
   */
  contextMenu: function (ev) {
    var clickedRow;
    var rawClickedRow;
    var selection;

    clickedRow = this.getRowForEvent(ev);
    rawClickedRow = clickedRow.get('content');
    selection = this.get('selection');

    if (!selection.contains(rawClickedRow)) {
      this.clearSelection();
      this.addSelected(rawClickedRow);
    }

    this.sendAction('contextMenuHandler', this.get('selection'));
  }
});
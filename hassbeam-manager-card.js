/**
 * HassBeam Manager - Custom Lovelace Card for Home Assistant
 * Displays IR code events from HassBeam devices in a configurable table format.
 */

console.info("HassBeam Manager loaded - " + new Date().toISOString());

class HassBeamManagerCard extends HTMLElement {
  constructor() {
    super();
    this.config = {};
    this.irCodes = [];
    this.currentDevice = '';
    this.currentAction = '';
    this.currentLimit = 10;
    this._hass = null;
    this._activeSubscription = null;
    this._subscriptionTimeout = null;
    
    // Domain configuration
    this.SERVICE_DOMAIN = 'hassbeam_connect_backend';
    this.EVENT_DOMAIN = `${this.SERVICE_DOMAIN}_codes_retrieved`;
  }

  setConfig(config) {
    console.log('HassBeam Manager: setConfig called', config);
    
    if (!config) {
      throw new Error('Invalid configuration');
    }

    this.config = config;
    this.irCodes = [];
    this.currentDevice = config.device || '';
    this.currentAction = config.action || '';
    this.currentLimit = config.limit || 10;

    console.log('HassBeam Manager: Configuration set', {
      device: this.currentDevice,
      action: this.currentAction,
      limit: this.currentLimit,
      show_table: config.show_table
    });

    this.createCard();
    this.attachEventListeners();
  }

  createCard() {
    const showTable = this.config.show_table !== false;
    const cardHeight = this.config.height || 'auto';
    const cardWidth = this.config.width || 'auto';

    this.innerHTML = this.generateCardHTML(showTable, cardHeight, cardWidth);
  }

  generateCardHTML(showTable, cardHeight, cardWidth) {
    return `
      <ha-card header="${this.config.title || 'HassBeam Manager'}" style="height: ${cardHeight}; width: ${cardWidth};">
        <div class="card-content">
          ${showTable ? this.generateTableHTML() : ''}
        </div>
      </ha-card>
      ${this.generateCSS(cardWidth, cardHeight)}
    `;
  }

  /**
   * Generate the HTML for the table and its controls
   * @returns {string} HTML string
   */
  generateTableHTML() {
    return `
      <div class="table-controls">
        <div class="filter-section">
          <label>Filter by Device:</label>
          <input type="text" id="device-filter" placeholder="Enter device name..." value="${this.currentDevice}" />
          <label>Filter by Action:</label>
          <input type="text" id="action-filter" placeholder="Enter action name..." value="${this.currentAction}" />
          <br />
          <label>Limit:</label>
          <input type="number" id="limit-input" min="1" max="100" value="${this.currentLimit}" />
          <button id="refresh-btn">Refresh</button>
        </div>
      </div>
      
      <div class="table-container">          <table id="ir-codes-table">
          <thead>
            <tr>
              <th>Actions</th>
              <th>HassBeam Device</th>
              <th>Device</th>
              <th>Action</th>
              <th>Protocol</th>
              <th>Date</th>
              <th>Event Data</th>
            </tr>
          </thead>
          <tbody id="table-body">
            <tr>
              <td colspan="7" style="text-align: center; padding: 20px; color: var(--secondary-text-color);">
                Loading IR codes...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Generate CSS styles for the card
   * @param {string} cardWidth - Width of the card
   * @param {string} cardHeight - Height of the card
   * @returns {string} CSS string
   */
  generateCSS(cardWidth, cardHeight) {
    return `
      <style>
        ha-card {
          width: ${cardWidth};
          height: ${cardHeight};
          display: block;
        }
        
        .card-content {
          padding: 16px;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .table-controls {
          margin-bottom: 16px;
        }
        
        .filter-section {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }
        
        .filter-section label {
          font-weight: 500;
        }
        
        .filter-section input {
          padding: 6px 8px;
          border: 1px solid var(--divider-color);
          border-radius: 4px;
          background: var(--card-background-color);
          color: var(--primary-text-color);
        }
        
        .filter-section input[type="text"] {
          flex: 1;
          min-width: 120px;
          max-width: 80px;
        }
        
        .filter-section input[type="number"] {
          flex: 1;
          min-width: 60px;
          max-width: 80px;
        }
        
        .filter-section button {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          background: var(--primary-color);
          color: var(--text-primary-color);
          cursor: pointer;
          font-size: 14px;
        }
        
        .filter-section button:hover {
          background: var(--primary-color-dark);
        }
        
        .table-container {
          overflow: auto;
          border: 1px solid var(--divider-color);
          border-radius: 4px;
          width: 100%;
          flex-grow: 1;
          min-height: 400px;
        }
        
        #ir-codes-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        
        #ir-codes-table th,
        #ir-codes-table td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid var(--divider-color);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          user-select: text;
          -webkit-user-select: text;
          -moz-user-select: text;
          -ms-user-select: text;
          min-width: 50px;
        }
        
        #ir-codes-table th {
          background: var(--table-header-background-color, var(--secondary-background-color));
          font-weight: 500;
          position: sticky;
          top: 0;
        }
        
        #ir-codes-table tr:hover {
          background: var(--table-row-hover-color, var(--secondary-background-color));
        }
        
        .actions {
          text-align: center;
          padding: 4px;
          white-space: nowrap;
        }
        
        .actions button {
          display: block;
          width: 100%;
          margin: 2px 0;
        }
        
        .timestamp {
          font-family: monospace;
          font-size: 12px;
          user-select: text;
          cursor: text;
        }
        
        .device {
          font-weight: 500;
          user-select: text;
          cursor: text;
        }
        
        .action {
          color: var(--primary-color);
          user-select: text;
          cursor: text;
        }
        
        .protocol {
          font-weight: 500;
          color: var(--secondary-text-color);
          font-size: 12px;
          user-select: text;
          cursor: text;
        }
        
        .hassbeam-device {
          font-weight: 500;
          color: var(--secondary-text-color);
          font-size: 12px;
          user-select: text;
          cursor: text;
        }
        
        .event-data {
          font-family: monospace;
          font-size: 12px;
          user-select: text;
          cursor: text;
        }
        
        .event-data:hover {
          overflow: visible;
          white-space: normal;
          background: var(--card-background-color);
          position: relative;
          z-index: 1;
          word-break: break-all;
        }
        
        .send-btn {
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          cursor: pointer;
          font-size: 12px;
          margin: 2px 0;
          display: block;
          width: 100%;
          text-align: center;
          transition: background-color 0.2s;
        }
        
        .send-btn:hover {
          background: #45a049;
        }
        
        .send-btn:active {
          transform: scale(0.95);
        }
        
        .delete-btn {
          background: #ff4444;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          cursor: pointer;
          font-size: 12px;
          margin: 2px 0;
          display: block;
          width: 100%;
          text-align: center;
          transition: background-color 0.2s;
        }
        
        .delete-btn:hover {
          background: #cc0000;
        }
        
        .delete-btn:active {
          transform: scale(0.95);
        }
        
        .temp-message {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 10px 20px;
          border-radius: 4px;
          font-weight: 500;
          z-index: 1000;
          display: none;
          max-width: 300px;
          word-wrap: break-word;
        }
        
        .temp-message.success {
          background: #4CAF50;
          color: white;
        }
        
        .temp-message.error {
          background: #f44336;
          color: white;
        }
        
        .temp-message.info {
          background: #2196F3;
          color: white;
        }
      </style>
    `;
  }

  /**
   * Attach event listeners to UI elements
   */
  attachEventListeners() {
    console.log('HassBeam Manager: attachEventListeners called');
    
    // Refresh button
    const refreshBtn = this.querySelector('#refresh-btn');
    if (refreshBtn) {
      console.log('HassBeam Manager: Refresh button event listener added');
      refreshBtn.addEventListener('click', () => {
        console.log('HassBeam Manager: Refresh button clicked');
        this.updateFiltersFromUI();
        this.loadIrCodes();
      });
    } else {
      console.warn('HassBeam Manager: Refresh button not found');
    }
    
    // Action filter input
    const actionFilter = this.querySelector('#action-filter');
    if (actionFilter) {
      actionFilter.addEventListener('input', () => {
        this.updateFiltersFromUI();
      });
    }
    
    // Event delegation for action buttons
    this.addEventListener('click', (event) => {
      if (event.target.classList.contains('delete-btn')) {
        const codeId = event.target.getAttribute('data-code-id');
        if (codeId) {
          this.deleteCode(parseInt(codeId));
        }
      } else if (event.target.classList.contains('send-btn')) {
        const device = event.target.getAttribute('data-device');
        const action = event.target.getAttribute('data-action');
        if (device && action) {
          this.sendIrCode(device, action);
        }
      }
    });
  }

  /**
   * Read filter and limit values from UI elements
   */
  updateFiltersFromUI() {
    console.log('HassBeam Manager: updateFiltersFromUI called');
    
    const deviceFilter = this.querySelector('#device-filter');
    const limitInput = this.querySelector('#limit-input');
    const actionFilter = this.querySelector('#action-filter');

    const oldDevice = this.currentDevice;
    const oldLimit = this.currentLimit;
    const oldAction = this.currentAction;
    this.currentDevice = deviceFilter?.value || '';
    this.currentAction = actionFilter?.value || '';
    this.currentLimit = limitInput?.value || '10';

    console.log('HassBeam Manager: Filters updated', {
      device: { old: oldDevice, new: this.currentDevice },
      action: { old: oldAction, new: this.currentAction },
      limit: { old: oldLimit, new: this.currentLimit }
    });
  }

  /**
   * Set the Home Assistant object
   * @param {Object} hass - Home Assistant object
   */
  set hass(hass) {
    console.log('HassBeam Manager: hass object set', hass ? 'available' : 'not available');
    
    this._hass = hass;
    
    // Automatically load the table when card is loaded
    if (hass && this.config.show_table !== false) {
      console.log('HassBeam Manager: Auto-loading IR codes on card load');
      this.loadIrCodes();
    }
  }

  /**
   * Load IR codes from the HassBeam service
   */
  async loadIrCodes() {
    console.log('HassBeam Manager: loadIrCodes called');
    
    if (!this._hass) {
      console.warn('HassBeam Manager: No hass object available, loadIrCodes will exit');
      return;
    }

    if (!this._hass.connection) {
      console.error('HassBeam Manager: No Home Assistant connection available');
      this.showError('No connection to Home Assistant');
      return;
    }

    // End previous subscription if still active
    this.cleanupSubscription();

    try {
      const serviceData = this.prepareServiceData();
      console.log('HassBeam Manager: Service data prepared', serviceData);
      
      let hasReceived = false;
      
      // Event subscription
      console.log(`HassBeam Manager: Setting up event subscription for "${this.EVENT_DOMAIN}"`);
      try {
        this._activeSubscription = await this._hass.connection.subscribeEvents((event) => {
          console.log('HassBeam Manager: Event "hassbeam_connect_codes_retrieved" received', event);
          
          if (event.data?.codes && !hasReceived) {
            console.log('HassBeam Manager: Valid IR codes received', {
              count: event.data.codes.length,
              codes: event.data.codes
            });
            
            hasReceived = true;
            this.irCodes = event.data.codes;
            this.updateTable();
            this.cleanupSubscription();
          } else {
            console.log('HassBeam Manager: Event without valid codes or already received', {
              hasCodes: !!event.data?.codes,
              hasReceived: hasReceived
            });
          }
        }, this.EVENT_DOMAIN);

        if (this._activeSubscription && typeof this._activeSubscription === 'function') {
          console.log('HassBeam Manager: Event subscription set up successfully');
        } else {
          console.warn('HassBeam Manager: Event subscription might have failed:', typeof this._activeSubscription);
        }
      } catch (subscribeError) {
        console.error('HassBeam Manager: Error setting up event subscription:', subscribeError);
        this._activeSubscription = null;
      }

      // Call service
      console.log(`HassBeam Manager: Calling service "${this.SERVICE_DOMAIN}.get_recent_codes"`, serviceData);
      await this._hass.callService(this.SERVICE_DOMAIN, 'get_recent_codes', serviceData);
      console.log('HassBeam Manager: Service call completed successfully');

      // Timeout as fallback
      console.log('HassBeam Manager: Setting up timeout (5s)');
      this._subscriptionTimeout = setTimeout(() => {
        if (!hasReceived) {
          console.error('HassBeam Manager: Timeout reached - no data received');
          this.showError('No data received (timeout)');
          this.cleanupSubscription();
        } else {
          console.log('HassBeam Manager: Timeout reached but data already received');
        }
      }, 5000);

    } catch (error) {
      console.error('HassBeam Manager: Error loading IR codes:', error);
      this.showError('Error loading data: ' + error.message);
      this.cleanupSubscription();
    }
  }

  /**
   * Prepare service data for the API call
   * @returns {Object} Service data
   */
  prepareServiceData() {
    console.log('HassBeam Manager: prepareServiceData called', {
      currentDevice: this.currentDevice,
      currentLimit: this.currentLimit
    });
    
    const serviceData = { limit: parseInt(this.currentLimit) || 10 };
    if (this.currentDevice?.trim()) {
      serviceData.device = this.currentDevice.trim();
      console.log('HassBeam Manager: Device name added to service data', serviceData.device);
    }
    if (this.currentAction?.trim()) {
      serviceData.action = this.currentAction.trim();
      console.log('HassBeam Manager: Action name added to service data', serviceData.action);
    }

    console.log('HassBeam Manager: Service data prepared', serviceData);
    return serviceData;
  }

  /**
   * Clean up active event subscription and timeout
   */
  cleanupSubscription() {
    console.log('HassBeam Manager: cleanupSubscription called', {
      hasActiveSubscription: !!this._activeSubscription,
      hasTimeout: !!this._subscriptionTimeout
    });

    // Clean up timeout
    if (this._subscriptionTimeout) {
      console.log('HassBeam Manager: Clearing timeout');
      clearTimeout(this._subscriptionTimeout);
      this._subscriptionTimeout = null;
    }

    // Clean up subscription
    if (this._activeSubscription && typeof this._activeSubscription === 'function') {
      console.log('HassBeam Manager: Ending event subscription');
      try {
        this._activeSubscription();
        console.log('HassBeam Manager: Event subscription ended successfully');
      } catch (error) {
        console.error('HassBeam Manager: Error ending event subscription:', error);
      }
      this._activeSubscription = null;
    } else if (this._activeSubscription) {
      console.warn('HassBeam Manager: ActiveSubscription is not a function:', typeof this._activeSubscription);
      this._activeSubscription = null;
    }
  }

  /**
   * Update table with new data
   */
  updateTable() {
    console.log('HassBeam Manager: updateTable called', {
      codeCount: this.irCodes.length,
      codes: this.irCodes
    });
    
    const tableBody = this.querySelector('#table-body');
    if (!tableBody) {
      console.error('HassBeam Manager: table-body element not found');
      return;
    }

    if (this.irCodes.length === 0) {
      console.log('HassBeam Manager: No IR codes available, showing empty table');
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 20px;">
            No IR codes found
          </td>
        </tr>
      `;
      return;
    }

    console.log('HassBeam Manager: Filling table with data');
    tableBody.innerHTML = this.irCodes.map(code => this.createTableRow(code)).join('');
    console.log('HassBeam Manager: Table updated successfully');
  }

  /**
   * Create a single table row
   * @param {Object} code - IR code object
   * @returns {string} HTML string for the table row
   */
  createTableRow(code) {
    console.log('HassBeam Manager: createTableRow called', code);
    
    const timestamp = new Date(code.created_at).toLocaleString('en-US');
    const { protocol, formattedEventData, hassbeamDevice } = this.parseEventData(code.event_data);

    const row = `
      <tr>
        <td class="actions">
          <button class="send-btn" data-device="${code.device}" data-action="${code.action}" title="Send IR Code">
            Send
          </button>
          <button class="delete-btn" data-code-id="${code.id}" title="Delete">
            Delete
          </button>
        </td>
        <td class="hassbeam-device">${hassbeamDevice}</td>
        <td class="device">${code.device}</td>
        <td class="action">${code.action}</td>
        <td class="protocol">${protocol}</td>
        <td class="timestamp">${timestamp}</td>
        <td class="event-data" title="${formattedEventData}">${formattedEventData}</td>
      </tr>
    `;
    
    console.log('HassBeam Manager: Table row created', {
      id: code.id,
      device: code.device,
      action: code.action,
      protocol: protocol,
      hassbeamDevice: hassbeamDevice
    });
    
    return row;
  }

  /**
   * Parse and format event data
   * @param {string} eventData - JSON string with event data
   * @returns {Object} Parsed data with protocol and formatted event data
   */
  parseEventData(eventData) {
    console.log('HassBeam Manager: parseEventData called', eventData);
    
    try {
      const parsed = JSON.parse(eventData);
      const protocol = parsed.protocol || 'N/A';
      const hassbeamDevice = parsed.hassbeam_device || 'N/A';
      
      console.log('HassBeam Manager: Event data parsed successfully', {
        protocol: protocol,
        hassbeamDevice: hassbeamDevice,
        originalData: parsed
      });
      
      // Hide device_name, device_id, hassbeam_device and protocol from display
      const filteredData = Object.entries(parsed)
        .filter(([key]) => !['device_name', 'device_id', 'hassbeam_device', 'protocol'].includes(key))
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      
      console.log('HassBeam Manager: Event data formatted (without device_name, device_id, hassbeam_device, protocol)', {
        protocol: protocol,
        hassbeamDevice: hassbeamDevice,
        formattedEventData: filteredData
      });
      
      return { protocol, formattedEventData: filteredData, hassbeamDevice };
    } catch (e) {
      console.error('HassBeam Manager: Error parsing event data:', e, eventData);
      return { protocol: 'N/A', formattedEventData: eventData, hassbeamDevice: 'N/A' };
    }
  }

  /**
   * Get card size for the dashboard
   * @returns {number} Card size
   */
  getCardSize() {
    // Configurable card size
    // Default values: 6 for cards with table, 1 for cards without table
    if (this.config.card_size !== undefined) {
      return this.config.card_size;
    }
    return this.config.show_table !== false ? 6 : 1;
  }

  /**
   * Show error message in the table
   * @param {string} message - Error message
   */
  showError(message) {
    console.error('HassBeam Manager: showError called', message);
    
    const tableBody = this.querySelector('#table-body');
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 20px; color: var(--error-color);">
            ${message}
          </td>
        </tr>
      `;
      console.log('HassBeam Manager: Error message displayed in table');
    } else {
      console.error('HassBeam Manager: table-body element not found for error message');
    }
  }

  /**
   * Properties for better HACS compatibility
   * @returns {Object} Properties object
   */
  static get properties() {
    return {
      hass: {},
      config: {}
    };
  }

  /**
   * Send IR code
   * @param {string} device - Device name
   * @param {string} action - Action name
   */
  async sendIrCode(device, action) {
    console.log('HassBeam Manager: sendIrCode called', { device, action });
    
    if (!this._hass) {
      console.error('HassBeam Manager: No Home Assistant instance available');
      return;
    }
    
    try {
      // Call the send_ir_code service
      const result = await this._hass.callService(this.SERVICE_DOMAIN, 'send_ir_code', {
        device: device,
        action: action
      });
      
      console.log('HassBeam Manager: IR code sent successfully', result);
      
      // Show success message
      this.showTemporaryMessage(`IR code sent: ${device}.${action}`, 'success');
      
    } catch (error) {
      console.error('HassBeam Manager: Error sending IR code:', error);
      this.showTemporaryMessage(`Error sending IR code: ${error.message}`, 'error');
    }
  }

  /**
   * Show temporary message
   * @param {string} message - Message to show
   * @param {string} type - Message type ('success' or 'error')
   */
  showTemporaryMessage(message, type = 'info') {
    // Create or update message element
    let messageEl = this.querySelector('.temp-message');
    if (!messageEl) {
      messageEl = document.createElement('div');
      messageEl.className = 'temp-message';
      this.querySelector('.card-content').appendChild(messageEl);
    }
    
    messageEl.textContent = message;
    messageEl.className = `temp-message ${type}`;
    messageEl.style.display = 'block';
    
    // Hide after 3 seconds
    setTimeout(() => {
      if (messageEl) {
        messageEl.style.display = 'none';
      }
    }, 3000);
  }

  /**
   * Delete IR code
   * @param {number} codeId - ID of the code to delete
   */
  async deleteCode(codeId) {
    console.log('HassBeam Manager: deleteCode called', codeId);
    
    if (!this._hass) {
      console.error('HassBeam Manager: No Home Assistant instance available');
      return;
    }
    
    // Show confirmation dialog
    if (!confirm('Do you really want to delete this IR code?')) {
      return;
    }
    
    try {
      // Call service
      const result = await this._hass.callService(this.SERVICE_DOMAIN, 'delete_ir_code', {
        id: codeId
      });
      
      console.log('HassBeam Manager: IR code deleted', result);
      
      // Refresh table
      await this.loadIrCodes();
      
    } catch (error) {
      console.error('HassBeam Manager: Error deleting IR code:', error);
      alert('Error deleting IR code: ' + error.message);
    }
  }

  /**
   * Called when the card is removed from the DOM
   */
  disconnectedCallback() {
    console.log('HassBeam Manager: disconnectedCallback - card being removed');
    this.cleanupSubscription();
  }
}

// Register the custom element only if not already registered
if (!customElements.get('hassbeam-manager-card')) {
  customElements.define('hassbeam-manager-card', HassBeamManagerCard);
}

// Export for module usage
export { HassBeamManagerCard };

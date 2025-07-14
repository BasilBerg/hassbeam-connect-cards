console.info("HassBeam Setup loaded - " + new Date().toISOString());

class HassBeamSetupCard extends HTMLElement {
  constructor() {
    super();
    this.config = {};
    this.isListening = false;
    this.capturedEvents = [];
    this.protocolFilter = 'Pronto';
    this._eventSubscription = null;
    
    // Domain configuration
    this.SERVICE_DOMAIN = 'hassbeam_connect_backend';
    this.ESPHOME_DOMAIN = 'esphome';
    this.EVENT_DOMAIN = `${this.ESPHOME_DOMAIN}.hassbeam.ir_received`;
    
    console.log('HassBeam Setup: Constructor called with SERVICE_DOMAIN =', this.SERVICE_DOMAIN);
  }

  setConfig(config) {
    this.config = config;
    this.protocolFilter = config.protocol || 'Pronto';
    this.render();
    this.attachEventListeners();
  }

  set hass(hass) {
    this._hass = hass;
    // Data could be loaded here later
  }

  render() {
    const cardWidth = this.config.width || 'auto';
    const cardHeight = this.config.height || 'auto';
    
    this.innerHTML = `
      <ha-card header="${this.config.title || 'HassBeam Setup'}">
        <div class="card-content">
          <div class="top-controls">
            <button id="start-listening-btn" class="listening-btn">Start Listening</button>
            <button id="clear-table-btn" class="clear-btn">Clear Table</button>
          </div>
          
          <div class="filter-controls">
            <div class="filter-group">
              <label for="protocol-filter">Filter by Protocol:</label>
              <input type="text" id="protocol-filter" placeholder="Enter protocol..." value="${this.protocolFilter}" />
            </div>
          </div>
          
          <div class="setup-table-container">
            <table id="setup-table">
              <thead>
                <tr>
                  <th>Actions</th>
                  <th>HassBeam Device</th>
                  <th>Protocol</th>
                  <th>Time</th>
                  <th>Event Data</th>
                </tr>
              </thead>
              <tbody id="setup-table-body">
                <tr>
                  <td colspan="5" style="text-align: center; padding: 20px; color: var(--secondary-text-color);">
                    Click "Start Listening" to begin
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="setup-controls">
            <div class="input-group">
              <label for="device-input">Device:</label>
              <input type="text" id="device-input" placeholder="Enter device name..." />
            </div>
            <div class="input-group">
              <label for="action-input">Action:</label>
              <input type="text" id="action-input" placeholder="Enter action name..." />
            </div>
          </div>
          
          <div class="save-section">
            <button id="save-code-btn" class="save-btn" disabled>Save IR Code</button>
          </div>
        </div>
      </ha-card>
      ${this.generateSetupCSS(cardWidth, cardHeight)}
    `;
  }

  generateSetupCSS(cardWidth, cardHeight) {
    return `
      <style>
        ha-card {
          width: ${this.config.width || 'auto'};
          height: ${this.config.height || 'auto'};
          display: block;
        }
        .card-content {
          padding: 16px;
        }
        .top-controls {
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .filter-controls {
          margin-bottom: 20px;
          padding: 12px;
          background: var(--secondary-background-color, #f5f5f5);
          border-radius: 4px;
        }
        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .filter-group label {
          font-weight: 500;
          min-width: 140px;
        }
        .filter-group input {
          flex: 1;
          min-width: 120px;
          max-width: 200px;
          padding: 8px 12px;
          border: 1px solid var(--divider-color);
          border-radius: 4px;
          background: var(--card-background-color);
          color: var(--primary-text-color);
          font-size: 14px;
        }
        .setup-controls {
          margin-top: 20px;
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .input-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .input-group label {
          font-weight: 500;
          min-width: 80px;
        }
        .input-group input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid var(--divider-color);
          border-radius: 4px;
          background: var(--card-background-color);
          color: var(--primary-text-color);
          font-size: 14px;
        }
        .listening-btn, .save-btn, .clear-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          background: var(--primary-color);
          color: var(--text-primary-color);
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }
        .clear-btn {
          background: var(--secondary-color, #757575);
        }
        .clear-btn:hover {
          background: var(--secondary-color-dark, #616161);
        }
        .listening-btn:hover, .save-btn:hover {
          filter: brightness(0.9);
        }
        .listening-btn.listening {
          background: var(--error-color);
        }
        .listening-btn.listening:hover {
          background: var(--error-color);
          filter: brightness(0.9);
        }
        .save-btn {
          background: var(--success-color);
        }
        .save-btn:hover {
          background: var(--success-color);
          filter: brightness(0.9);
        }
        .save-btn:disabled {
          background: var(--disabled-color, #cccccc);
          color: var(--disabled-text-color, #888888);
          cursor: not-allowed;
        }
        .save-btn:disabled:hover {
          background: var(--disabled-color, #cccccc);
        }
        .save-section {
          margin-top: 16px;
          text-align: center;
        }
        .setup-table-container {
          border: 1px solid var(--divider-color);
          border-radius: 4px;
          overflow: auto;
          max-height: 400px;
        }
        #setup-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        #setup-table th,
        #setup-table td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid var(--divider-color);
          min-width: 50px;
        }
        #setup-table th {
          background: var(--table-header-background-color, var(--secondary-background-color));
          font-weight: 500;
          position: sticky;
          top: 0;
        }
        #setup-table tr:hover {
          background: var(--table-row-hover-color, var(--secondary-background-color));
        }
        .use-btn {
          padding: 4px 8px;
          border: none;
          border-radius: 2px;
          background: var(--primary-color);
          color: var(--text-primary-color);
          cursor: pointer;
          font-size: 12px;
          display: block;
          width: 100%;
          margin: 2px 0;
          text-align: center;
        }
        .use-btn:hover {
          background: var(--primary-color);
          filter: brightness(0.9);
        }
        .use-btn.selected {
          background: var(--success-color);
          color: var(--text-primary-color);
        }
        .use-btn.selected:hover {
          background: var(--success-color);
          filter: brightness(0.9);
        }
        .send-btn-setup {
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 2px;
          padding: 4px 8px;
          cursor: pointer;
          font-size: 12px;
          display: block;
          width: 100%;
          margin: 2px 0;
          text-align: center;
        }
        .send-btn-setup:hover {
          background: #45a049;
        }
        .send-btn-setup:active {
          transform: scale(0.95);
        }
        .event-data {
          font-family: monospace;
          font-size: 12px;
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .event-data:hover {
          overflow: visible;
          white-space: normal;
          background: var(--card-background-color);
          position: relative;
          z-index: 1;
          word-break: break-all;
        }
      </style>
    `;
  }

  attachEventListeners() {
    const startListeningBtn = this.querySelector('#start-listening-btn');
    const saveCodeBtn = this.querySelector('#save-code-btn');
    const clearTableBtn = this.querySelector('#clear-table-btn');
    const deviceInput = this.querySelector('#device-input');
    const actionInput = this.querySelector('#action-input');
    const protocolFilter = this.querySelector('#protocol-filter');
    
    if (startListeningBtn) {
      startListeningBtn.addEventListener('click', () => {
        this.toggleListening();
      });
    }
    
    if (saveCodeBtn) {
      saveCodeBtn.addEventListener('click', () => {
        this.saveSelectedCode();
      });
    }
    
    if (clearTableBtn) {
      clearTableBtn.addEventListener('click', () => {
        this.clearTable();
      });
    }
    
    if (protocolFilter) {
      protocolFilter.addEventListener('input', () => {
        this.protocolFilter = protocolFilter.value;
        this.updateTable();
      });
    }
    
    // Monitor input fields for save button state
    if (deviceInput) {
      deviceInput.addEventListener('input', () => {
        this.updateSaveButtonState();
      });
    }
    
    if (actionInput) {
      actionInput.addEventListener('input', () => {
        this.updateSaveButtonState();
      });
    }
  }

  async toggleListening() {
    const deviceInput = this.querySelector('#device-input');
    const actionInput = this.querySelector('#action-input');
    const startListeningBtn = this.querySelector('#start-listening-btn');
    const saveCodeBtn = this.querySelector('#save-code-btn');
    
    if (!this.isListening) {
      if (!this._hass || !this._hass.connection) {
        alert('No connection to Home Assistant available.');
        return;
      }
      
      // Start Listening
      this.isListening = true;
      startListeningBtn.textContent = 'Stop Listening';
      startListeningBtn.classList.add('listening');
      
      // Clear table and show status
      this.updateTableWithStatus('Listening for IR codes... Press a button on your remote control.');
      
      console.log('HassBeam Setup: Start Listening');
      
      // Start event subscription
      try {
        this._eventSubscription = await this._hass.connection.subscribeEvents((event) => {
          console.log('HassBeam Setup: IR event received', event);
          this.handleIrEvent(event);
        }, this.EVENT_DOMAIN);
        
        console.log('HassBeam Setup: Event subscription set up successfully');
      } catch (error) {
        console.error('HassBeam Setup: Error setting up event subscription:', error);
        alert('Error starting listening: ' + error.message);
        this.stopListening();
      }
      
    } else {
      // Stop Listening
      this.stopListening();
    }
  }

  stopListening() {
    const startListeningBtn = this.querySelector('#start-listening-btn');
    const saveCodeBtn = this.querySelector('#save-code-btn');
    
    this.isListening = false;
    startListeningBtn.textContent = 'Start Listening';
    startListeningBtn.classList.remove('listening');
    
    // End event subscription
    if (this._eventSubscription && typeof this._eventSubscription === 'function') {
      try {
        this._eventSubscription();
        console.log('HassBeam Setup: Event subscription ended');
      } catch (error) {
        console.error('HassBeam Setup: Error ending event subscription:', error);
      }
      this._eventSubscription = null;
    }
    
    // Enable save button if events are available
    this.updateSaveButtonState();
    
    console.log('HassBeam Setup: Stop Listening');
  }

  handleIrEvent(event) {
    console.log('HassBeam Setup: IR event processed', event);
    
    // Add event to captured events
    const eventData = {
      timestamp: new Date(),
      protocol: event.data?.protocol || 'Unknown',
      hassbeamDevice: event.data?.hassbeam_device || 'Unknown',
      code: event.data?.code || event.data?.data || 'N/A',
      rawData: event.data,
      selected: false
    };
    
    this.capturedEvents.push(eventData);
    
    // Update table
    this.updateTable();
    
    // Update save button state
    this.updateSaveButtonState();
  }

  updateSaveButtonState() {
    const saveCodeBtn = this.querySelector('#save-code-btn');
    const selectedEvent = this.capturedEvents.find(event => event.selected);
    const deviceInput = this.querySelector('#device-input');
    const actionInput = this.querySelector('#action-input');
    
    // Enable button when event is selected and fields are filled
    const canSave = selectedEvent && 
                   deviceInput.value.trim() && 
                   actionInput.value.trim();
    
    if (saveCodeBtn) {
      saveCodeBtn.disabled = !canSave;
    }
  }

  updateTable() {
    const tableBody = this.querySelector('#setup-table-body');
    if (!tableBody) return;
    
    if (this.capturedEvents.length === 0) {
      this.updateTableWithStatus('No IR codes received yet');
      return;
    }
    
    // Remove duplicates based on event data
    const uniqueEvents = this.capturedEvents.filter((event, index, array) => {
      const eventDataStr = JSON.stringify(event.rawData);
      return array.findIndex(e => JSON.stringify(e.rawData) === eventDataStr) === index;
    });
    
    // Filter by protocol if specified
    let filteredEvents = uniqueEvents;
    if (this.protocolFilter && this.protocolFilter.trim()) {
      filteredEvents = uniqueEvents.filter(event => 
        event.protocol.toLowerCase().includes(this.protocolFilter.toLowerCase())
      );
    }
    
    if (filteredEvents.length === 0) {
      this.updateTableWithStatus(`No IR codes found with protocol "${this.protocolFilter}"`);
      return;
    }
    
    tableBody.innerHTML = filteredEvents.map((event, index) => {
      const timeString = event.timestamp.toLocaleTimeString('en-US');
      // Remove device_name, device_id, hassbeam_device and protocol from event data for display
      const eventDataCopy = { ...event.rawData };
      delete eventDataCopy.device_name;
      delete eventDataCopy.device_id;
      delete eventDataCopy.hassbeam_device;
      delete eventDataCopy.protocol;
      const eventDataStr = JSON.stringify(eventDataCopy);
      
      return `
        <tr>
          <td>
            <button class="use-btn ${event.selected ? 'selected' : ''}" data-event-index="${index}">
              ${event.selected ? 'Selected' : 'Select'}
            </button>
            <button class="send-btn-setup" data-event-index="${index}" title="Send IR Code">
              Send
            </button>
          </td>
          <td>${event.hassbeamDevice}</td>
          <td>${event.protocol}</td>
          <td>${timeString}</td>
          <td class="event-data" title="${eventDataStr}">${eventDataStr}</td>
        </tr>
      `;
    }).join('');
    
    // Add event listeners for selection buttons
    const useButtons = tableBody.querySelectorAll('.use-btn');
    useButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const index = parseInt(e.target.getAttribute('data-event-index'));
        // Find the original event based on the filtered index
        const selectedFilteredEvent = filteredEvents[index];
        const originalIndex = this.capturedEvents.findIndex(event => 
          JSON.stringify(event.rawData) === JSON.stringify(selectedFilteredEvent.rawData)
        );
        this.selectEvent(originalIndex);
      });
    });
    
    // Add event listeners for send buttons
    const sendButtons = tableBody.querySelectorAll('.send-btn-setup');
    sendButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const index = parseInt(e.target.getAttribute('data-event-index'));
        const selectedFilteredEvent = filteredEvents[index];
        this.sendIrCodeFromEvent(selectedFilteredEvent.rawData);
      });
    });
  }

  updateTableWithStatus(message) {
    const tableBody = this.querySelector('#setup-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 20px; color: var(--secondary-text-color);">
          ${message}
        </td>
      </tr>
    `;
  }

  selectEvent(index) {
    // Deselect all events
    this.capturedEvents.forEach(event => event.selected = false);
    
    // Select chosen event
    if (this.capturedEvents[index]) {
      this.capturedEvents[index].selected = true;
    }
    
    // Update table
    this.updateTable();
    
    // Enable save button
    this.updateSaveButtonState();
  }

  async saveSelectedCode() {
    const selectedEvent = this.capturedEvents.find(event => event.selected);
    const deviceInput = this.querySelector('#device-input');
    const actionInput = this.querySelector('#action-input');

    if (!selectedEvent) {
      alert('Please select an IR code from the table.');
      return;
    }

    const device = deviceInput.value.trim();
    const action = actionInput.value.trim();

    // Validate inputs
    if (!device || !action) {
      alert('Please enter both device and action.');
      return;
    }

    if (!this._hass) {
      alert('No connection to Home Assistant available.');
      return;
    }

    try {
      // Service call to save
      console.log('HassBeam Setup: Calling save_ir_code service...');
      console.log('HassBeam Setup: SERVICE_DOMAIN =', this.SERVICE_DOMAIN);
      console.log('HassBeam Setup: Full service call =', `${this.SERVICE_DOMAIN}.save_ir_code`);
      const saveResponse = await this._hass.callService(this.SERVICE_DOMAIN, 'save_ir_code', {
        device: device,
        action: action,
        event_data: JSON.stringify(selectedEvent.rawData)
      });
      
      console.log('HassBeam Setup: save_ir_code service completed. Response:', saveResponse);
      
      // Successful save
      alert(`IR code saved successfully!\nDevice: ${device}\nAction: ${action}`);
      actionInput.value = '';
      this.capturedEvents = [];
      this.updateTableWithStatus('IR code saved. Enter a new action for the next code.');
      this.updateSaveButtonState();

    } catch (error) {
      // Error during service call (e.g. duplicate or network error)
      console.error('HassBeam Setup: Error saving IR code:', error);
      
      // Check if it's an "already exists" error
      if (error && error.message && error.message.includes('already exists')) {
        alert(`Error: An IR code for "${device}.${action}" already exists!\n\nPlease first delete the existing entry in the HassBeam Manager or use a different device/action name.`);
      } else {
        alert('Error saving IR code: ' + (error.message || error));
      }
    }
  }

  /**
   * Send IR code directly from event data
   * @param {Object} eventData - Raw event data from the captured IR event
   */
  async sendIrCodeFromEvent(eventData) {
    console.log('HassBeam Setup: sendIrCodeFromEvent called', eventData);
    
    if (!this._hass) {
      console.error('HassBeam Setup: No Home Assistant instance available');
      alert('No connection to Home Assistant available.');
      return;
    }
    
    try {
      // Extract protocol from event data
      const protocol = eventData.protocol;
      const hassbeamDevice = eventData.hassbeam_device;
      
      if (!protocol || !hassbeamDevice) {
        console.error('HassBeam Setup: Missing protocol or hassbeam_device in event data');
        alert('Cannot send IR code: Missing protocol or device information');
        return;
      }
      
      // Prepare service data similar to the main card
      const serviceData = this.prepareServiceDataFromEvent(eventData);
      const serviceName = `${hassbeamDevice}_send_ir_${protocol.toLowerCase()}`;
      
      console.log('HassBeam Setup: Calling ESPHome service', {
        service: serviceName,
        data: serviceData
      });
      
      // Call the ESPHome service directly
      await this._hass.callService(this.ESPHOME_DOMAIN, serviceName, serviceData);
      
      console.log('HassBeam Setup: IR code sent successfully');
      
      // Show success message
      this.showTemporaryMessage(`IR code sent via ${protocol} protocol`, 'success');
      
    } catch (error) {
      console.error('HassBeam Setup: Error sending IR code:', error);
      this.showTemporaryMessage(`Error sending IR code: ${error.message}`, 'error');
    }
  }

  /**
   * Prepare service data from event data for ESPHome service call
   * @param {Object} eventData - Raw event data
   * @returns {Object} Service data for ESPHome call
   */
  prepareServiceDataFromEvent(eventData) {
    const serviceData = {};
    
    // Copy relevant fields from event data, excluding internal fields
    const excludeFields = ['device_name', 'device_id', 'hassbeam_device', 'protocol'];
    
    Object.keys(eventData).forEach(key => {
      if (!excludeFields.includes(key)) {
        let value = eventData[key];
        
        // Convert hex strings to integers for certain fields
        if (typeof value === 'string' && value.startsWith('0x')) {
          value = parseInt(value, 16);
        }
        // Convert string arrays to actual arrays
        else if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
          try {
            value = JSON.parse(value);
          } catch (e) {
            console.warn('HassBeam Setup: Could not parse array string:', value);
          }
        }
        
        serviceData[key] = value;
      }
    });
    
    console.log('HassBeam Setup: Service data prepared from event', serviceData);
    return serviceData;
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
      messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 10px 20px;
        border-radius: 4px;
        font-weight: 500;
        z-index: 1000;
        max-width: 300px;
        word-wrap: break-word;
      `;
      this.appendChild(messageEl);
    }
    
    messageEl.textContent = message;
    messageEl.className = `temp-message ${type}`;
    
    // Set colors based on type
    if (type === 'success') {
      messageEl.style.background = '#4CAF50';
      messageEl.style.color = 'white';
    } else if (type === 'error') {
      messageEl.style.background = '#f44336';
      messageEl.style.color = 'white';
    } else {
      messageEl.style.background = '#2196F3';
      messageEl.style.color = 'white';
    }
    
    messageEl.style.display = 'block';
    
    // Hide after 3 seconds
    setTimeout(() => {
      if (messageEl) {
        messageEl.style.display = 'none';
      }
    }, 3000);
  }

  /**
   * Clear table
   */
  clearTable() {
    console.log('HassBeam Setup: clearTable called');
    
    // Reset captured events
    this.capturedEvents = [];
    
    // Clear table
    const tableBody = this.querySelector('#setup-table-body');
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 20px; color: var(--secondary-text-color);">
            Click "Start Listening" to begin
          </td>
        </tr>
      `;
    }
    
    // Update save button state
    this.updateSaveButtonState();
    
    console.log('HassBeam Setup: Table cleared');
  }

  /**
   * Called when the card is removed from the DOM
   */
  disconnectedCallback() {
    console.log('HassBeam Setup: disconnectedCallback - card being removed');
    this.stopListening();
  }

  static get properties() {
    return {};
  }
}

// Register the custom element only if not already registered
if (!customElements.get('hassbeam-setup-card')) {
  customElements.define('hassbeam-setup-card', HassBeamSetupCard);
}

// Export for module usage
export { HassBeamSetupCard };

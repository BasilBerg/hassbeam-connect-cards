/**
 * HassBeam Connect Cards - Main Entry Point
 * Imports and registers both HassBeam Manager and HassBeam Setup cards
 */

// Import the individual card modules
import { HassBeamManagerCard } from './hassbeam-manager-card.js';
import { HassBeamSetupCard } from './hassbeam-setup-card.js';

// Ensure custom elements are registered (imports should handle this)
// The individual modules handle registration with safety checks

// Register cards for Home Assistant Card Picker
window.customCards = window.customCards || [];

// Add HassBeam Manager Card to custom cards (avoid duplicates)
if (!window.customCards.find(card => card.type === 'hassbeam-manager-card')) {
  window.customCards.push({
    type: 'hassbeam-manager-card',
    name: 'HassBeam Manager',
    description: 'A card for displaying and managing IR events with HassBeam including table'
  });
}

// Add HassBeam Setup Card to custom cards (avoid duplicates)
if (!window.customCards.find(card => card.type === 'hassbeam-setup-card')) {
  window.customCards.push({
    type: 'hassbeam-setup-card',
    name: 'HassBeam Setup',
    description: 'Shows setup options for HassBeam devices'
  });
}

console.info("HassBeam Connect Cards loaded - " + new Date().toISOString());
console.info("- HassBeam Manager Card available");
console.info("- HassBeam Setup Card available");

import { initChildProfileModule } from './safetyTools/child-profile/index.js';
import { initLocationSafetyMapModule } from './safetyTools/location-safety-map/index.js';
import { initStayConnectedModule } from './safetyTools/stay-connected/index.js';
import { initCallForHelpAlarmModule } from './safetyTools/call-for-help-alarm/index.js';

const views = document.querySelectorAll('.view');
const menuButtons = document.querySelectorAll('[data-view]');

function showView(viewId) {
  views.forEach((view) => {
    view.classList.toggle('active', view.id === `${viewId}-view`);
  });
}

menuButtons.forEach((button) => {
  button.addEventListener('click', () => {
    showView(button.dataset.view);
  });
});

async function initializeApp() {
  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      const config = await response.json();
      window.AZURE_MAPS_API_KEY = config.azureMapsApiKey || '';
    }
  } catch (error) {
    console.error('Unable to load app config:', error);
  }

  initChildProfileModule();
  initLocationSafetyMapModule();
  initStayConnectedModule();
  initCallForHelpAlarmModule();

  showView('home');
}

initializeApp();

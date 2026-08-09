import { SafetyApiClient } from '../../api/safety-api-client.js';

const DEFAULT_MESSAGE = 'I need help now. Please check my location and contact me safely.';

function base64EncodeUnicode(value) {
  const encoded = encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_match, code) => {
    return String.fromCharCode(parseInt(code, 16));
  });
  return btoa(encoded);
}

function getCurrentLocation() {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy_m: position.coords.accuracy,
          captured_at: new Date().toISOString(),
        });
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  });
}

export function initCallForHelpAlarmModule(apiClient = new SafetyApiClient()) {
  const form = document.getElementById('help-alert-form');
  const status = document.getElementById('help-alert-status');
  const messageInput = document.getElementById('help-alert-message');
  const useDefaultToggle = document.getElementById('help-use-default-message');
  const decoyToggle = document.getElementById('help-decoy-mode');
  const decoyPanel = document.getElementById('help-decoy-panel');

  if (!form || !status || !messageInput || !useDefaultToggle || !decoyToggle || !decoyPanel) {
    return;
  }

  function hideSensitiveUi() {
    form.classList.add('hidden');
    decoyPanel.classList.remove('hidden');
    status.textContent = 'Updated.';
    status.className = 'status';
  }

  function showSensitiveUi() {
    form.classList.remove('hidden');
    decoyPanel.classList.add('hidden');
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      hideSensitiveUi();
    }
  });

  decoyPanel.addEventListener('click', showSensitiveUi);

  function applyMessageMode() {
    const useDefault = useDefaultToggle.checked;
    messageInput.disabled = useDefault;
    if (useDefault) {
      messageInput.value = DEFAULT_MESSAGE;
    } else if (messageInput.value === DEFAULT_MESSAGE) {
      messageInput.value = '';
    }
  }

  useDefaultToggle.addEventListener('change', applyMessageMode);
  applyMessageMode();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const profileId = String(formData.get('profileId') || '').trim() || 'dependent-profile';
    const recipientId = String(formData.get('recipientId') || '').trim() || 'guardian-primary';
    const hiddenMode = String(formData.get('hiddenMode') || 'off') === 'on';
    const body = useDefaultToggle.checked
      ? DEFAULT_MESSAGE
      : String(formData.get('message') || '').trim() || DEFAULT_MESSAGE;

    status.textContent = 'Sending emergency alert...';
    status.className = 'status';

    try {
      const location = await getCurrentLocation();
      const encryptedPayload = base64EncodeUnicode(body);

      const alertResponse = await apiClient.createHelpAlert({
        profileId,
        recipientId,
        channel: 'guardian',
        hiddenMode,
        encryptedPayload,
        location,
      });

      if (location && alertResponse.alertId) {
        await apiClient.appendHelpAlertLocation(alertResponse.alertId, { location });
      }

      status.textContent = 'Help alert sent. Local message history is not stored in this screen.';
      status.className = 'status success';

      if (hiddenMode && decoyToggle.checked) {
        hideSensitiveUi();
      }

      if (!useDefaultToggle.checked) {
        messageInput.value = '';
      }
    } catch (error) {
      status.textContent = 'Unable to send help alert right now. Please try again.';
      status.className = 'status error';
      console.error(error);
    }
  });
}

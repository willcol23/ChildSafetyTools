import { useEffect, useMemo, useState } from 'react';
import { SafetyApiClient } from '../api/safety-api-client.js';

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

export function App() {
  const apiClient = useMemo(() => new SafetyApiClient(), []);
  const [view, setView] = useState('home');
  const [profileId, setProfileId] = useState('dependent-profile');
  const [recipientId, setRecipientId] = useState('guardian-primary');
  const [useDefaultMessage, setUseDefaultMessage] = useState(true);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [hiddenMode, setHiddenMode] = useState(true);
  const [decoyMode, setDecoyMode] = useState(true);
  const [decoyVisible, setDecoyVisible] = useState(false);
  const [status, setStatus] = useState('');
  const [statusClass, setStatusClass] = useState('status');

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape' && view === 'help') {
        setDecoyVisible(true);
        setStatus('Updated.');
        setStatusClass('status');
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [view]);

  function onToggleDefaultMessage(enabled) {
    setUseDefaultMessage(enabled);
    if (enabled) {
      setMessage(DEFAULT_MESSAGE);
    } else if (message === DEFAULT_MESSAGE) {
      setMessage('');
    }
  }

  async function onSubmitHelpAlert(event) {
    event.preventDefault();

    const finalMessage = useDefaultMessage ? DEFAULT_MESSAGE : (message.trim() || DEFAULT_MESSAGE);
    setStatus('Sending emergency alert...');
    setStatusClass('status');

    try {
      const location = await getCurrentLocation();
      const encryptedPayload = base64EncodeUnicode(finalMessage);

      const alertResponse = await apiClient.createHelpAlert({
        profileId: profileId.trim() || 'dependent-profile',
        recipientId: recipientId.trim() || 'guardian-primary',
        channel: 'guardian',
        hiddenMode,
        encryptedPayload,
        location,
      });

      if (location && alertResponse.alertId) {
        await apiClient.appendHelpAlertLocation(alertResponse.alertId, { location });
      }

      setStatus('Help alert sent. Local message history is not stored in this screen.');
      setStatusClass('status success');

      if (!useDefaultMessage) {
        setMessage('');
      }

      if (hiddenMode && decoyMode) {
        setDecoyVisible(true);
      }
    } catch (_error) {
      setStatus('Unable to send help alert right now. Please try again.');
      setStatusClass('status error');
    }
  }

  return (
    <main className="react-card">
      {view === 'home' ? (
        <section>
          <h1>Eliminition Suite</h1>
          <p>Your unified safety dashboard (React Phase A).</p>
          <div className="menu-list">
            <button className="menu-button alarm-button" onClick={() => setView('help')}>
              <span className="title">Call For Help</span>
              <span className="desc">Discreet emergency alert</span>
            </button>
            <a className="menu-button" href="/legacy">
              <span className="title">Legacy Dashboard</span>
              <span className="desc">Identity vault, map, tracker (phase B migration)</span>
            </a>
          </div>
        </section>
      ) : null}

      {view === 'help' ? (
        <section>
          <button className="back-button" type="button" onClick={() => { setView('home'); setDecoyVisible(false); }}>
            ← Back to Dashboard
          </button>
          <h1>Call For Help Alarm</h1>
          <p>Send a discreet emergency alert with optional location sharing.</p>

          {!decoyVisible ? (
            <form className="form-stack alarm-form" onSubmit={onSubmitHelpAlert}>
              <label>
                <span>Dependent Profile ID</span>
                <input value={profileId} onChange={(event) => setProfileId(event.target.value)} placeholder="dependent-profile" />
              </label>
              <label>
                <span>Send To</span>
                <input value={recipientId} onChange={(event) => setRecipientId(event.target.value)} placeholder="guardian-primary" />
              </label>
              <label className="inline-toggle">
                <input type="checkbox" checked={useDefaultMessage} onChange={(event) => onToggleDefaultMessage(event.target.checked)} />
                <span>Use default emergency message</span>
              </label>
              <label>
                <span>Emergency Message</span>
                <textarea
                  rows="4"
                  placeholder="Type a hidden message"
                  value={message}
                  disabled={useDefaultMessage}
                  onChange={(event) => setMessage(event.target.value)}
                />
              </label>
              <label className="inline-toggle">
                <input type="checkbox" checked={hiddenMode} onChange={(event) => setHiddenMode(event.target.checked)} />
                <span>Hidden mode (no local history shown)</span>
              </label>
              <label className="inline-toggle">
                <input type="checkbox" checked={decoyMode} onChange={(event) => setDecoyMode(event.target.checked)} />
                <span>Auto-switch to decoy screen after send</span>
              </label>
              <button className="menu-button alarm-submit" type="submit">Send Help Alert</button>
            </form>
          ) : (
            <div className="decoy-panel" onClick={() => setDecoyVisible(false)} role="button" tabIndex={0}>
              <h2>Notes</h2>
              <p>Shopping list reminder: milk, fruit, snacks.</p>
            </div>
          )}

          <p className={statusClass}>{status}</p>
        </section>
      ) : null}
    </main>
  );
}

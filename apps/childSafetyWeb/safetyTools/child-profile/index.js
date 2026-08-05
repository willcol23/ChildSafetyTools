export function initChildProfileModule() {
  const form = document.getElementById('child-profile-form');
  const list = document.getElementById('profile-list');
  const status = document.getElementById('form-status');

  if (!form || !list || !status) {
    return;
  }

  async function loadProfiles() {
    try {
      const response = await fetch('/api/children');
      if (!response.ok) {
        throw new Error('Unable to load profiles');
      }

      const profiles = await response.json();
      list.innerHTML = '';

      if (!profiles.length) {
        list.innerHTML = '<li>No profiles saved yet.</li>';
        return;
      }

      profiles.forEach((profile) => {
        const item = document.createElement('li');
        item.innerHTML = `
          <strong>${profile.name}</strong>
          <div>${profile.dob || ''}</div>
          <div>${profile.description || ''}</div>
        `;
        list.appendChild(item);
      });
    } catch (error) {
      list.innerHTML = '<li>Unable to load profiles.</li>';
      console.error(error);
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = 'Saving profile...';
    status.className = 'status';

    const formData = new FormData(form);

    try {
      const response = await fetch('/api/children', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Could not save the profile.');
      }

      status.textContent = 'Child profile saved successfully.';
      status.className = 'status success';
      form.reset();
      await loadProfiles();
    } catch (error) {
      status.textContent = 'A network error occurred while saving the profile.';
      status.className = 'status error';
      console.error(error);
    }
  });

  loadProfiles();
}

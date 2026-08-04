document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('profile-form');
  const status = document.getElementById('form-status');
  const profileList = document.getElementById('profile-list');
  const views = document.querySelectorAll('.view');
  const navButtons = document.querySelectorAll('[data-view]');

  const showView = (viewName) => {
    views.forEach((view) => {
      view.classList.toggle('active', view.id === `${viewName}-view`);
    });
  };

  document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => {
      showView(button.dataset.view);
    });
  });

  const renderProfiles = async () => {
    try {
      const response = await fetch('/api/children');
      const profiles = await response.json();

      if (!profiles.length) {
        profileList.innerHTML = '<li>No profiles saved yet.</li>';
        return;
      }

      profileList.innerHTML = profiles
        .map((profile) => {
          const attachmentsMarkup = (profile.attachments || [])
            .map((attachment) => {
              if (attachment.path) {
                return `<div>• ${attachment.originalName || attachment.filename}</div>`;
              }
              return '';
            })
            .join('');

          return `
            <li>
              <strong>${profile.name}</strong>
              <div>DOB: ${profile.dob}</div>
              <div>${profile.description || 'No description added.'}</div>
              <div>${attachmentsMarkup}</div>
            </li>
          `;
        })
        .join('');
    } catch (error) {
      console.error(error);
      profileList.innerHTML = '<li>Unable to load profiles.</li>';
    }
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    status.textContent = 'Saving profile...';
    status.className = 'status';

    const formData = new FormData(form);

    try {
      const response = await fetch('/api/children', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();

      if (result.success) {
        status.textContent = 'Child profile saved successfully.';
        status.className = 'status success';
        form.reset();
        await renderProfiles();
      } else {
        status.textContent = result.message || 'Could not save the profile.';
        status.className = 'status error';
      }
    } catch (error) {
      console.error(error);
      status.textContent = 'A network error occurred while saving the profile.';
      status.className = 'status error';
    }
  });

  renderProfiles();
});

document.addEventListener('DOMContentLoaded', () => {
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
});

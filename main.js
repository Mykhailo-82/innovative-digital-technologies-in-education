

document.addEventListener('click', (e) => {
  if (e.target.closest('.description-link') || e.target.closest('a')) return;
  if (e.target.closest('.description')) return;

  const clickedEl = e.target.closest('.tab');
  if (!clickedEl) return;

  const descriptionEl = clickedEl.querySelector('.description');
  const isActive = clickedEl.classList.contains('tab--active');

  document.querySelectorAll('.tab--active').forEach(tab => {
    tab.classList.remove('tab--active');
    tab.querySelector('.description').style.maxHeight = '0px';
  });

  if (!isActive) {
    clickedEl.classList.add('tab--active');
    descriptionEl.style.maxHeight = descriptionEl.scrollHeight + 'px';
  } 
});
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.menu-item')
      .forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});
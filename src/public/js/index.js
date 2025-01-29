document.addEventListener('DOMContentLoaded', () => {
  const aboutBtn = document.getElementById('btn-about');
  const overlay = document.getElementById('aboutOverlay');
  const closeBtn = document.getElementById('btn-close-about');

  if (aboutBtn && overlay && closeBtn) {
    // Quando clica no botão "Sobre", mostra overlay
    aboutBtn.addEventListener('click', () => {
      overlay.style.display = 'block';
    });

    // Quando clica no X dentro do popup
    closeBtn.addEventListener('click', () => {
      overlay.style.display = 'none';
    });

    // Se clicar fora do #aboutPopup (ou seja, no overlay), fecha
    overlay.addEventListener('click', (e) => {
      // e.target é exatamente onde clicou. Se for no overlay, fechamos
      if (e.target === overlay) {
        overlay.style.display = 'none';
      }
    });
  }
});

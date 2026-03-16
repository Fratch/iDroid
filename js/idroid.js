/* ══════════════════════════════════════════════════════════
   iDROID — UI Interactions
══════════════════════════════════════════════════════════ */

/* ── Menu item: icona attiva ── */
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.menu-item')
      .forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});

/* ══════════════════════════════════════════════════════════
   MISSIONS DRILL-DOWN
   - Ogni .menu-item[data-panel] apre il sottopannello corrispondente
   - .subpanel-back-btn riporta alla lista principale
══════════════════════════════════════════════════════════ */
(function initMissionsDrillDown() {
  const panelMissions  = document.getElementById('panel-missions');
  const missionsMenu   = document.getElementById('missions-menu');

  if (!panelMissions || !missionsMenu) return;

  /* Apri sottopannello */
  document.querySelectorAll('#missions-menu .menu-item[data-panel]').forEach(item => {
    item.addEventListener('click', () => {
      const panelId = item.dataset.panel;
      const target  = document.querySelector(`.missions-subpanel[data-subpanel="${panelId}"]`);

      if (!target) return;

      /* Disattiva eventuali pannelli già aperti */
      document.querySelectorAll('.missions-subpanel.is-active')
        .forEach(p => p.classList.remove('is-active'));

      /* Attiva drill-down */
      panelMissions.classList.add('is-drilling');
      target.classList.add('is-active');
    });
  });

  /* Torna indietro */
  document.querySelectorAll('.subpanel-back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.missions-subpanel.is-active')
        .forEach(p => p.classList.remove('is-active'));
      panelMissions.classList.remove('is-drilling');

      /* Rimuovi active dal menu-item selezionato */
      document.querySelectorAll('#missions-menu .menu-item.active')
        .forEach(i => i.classList.remove('active'));
    });
  });
})();
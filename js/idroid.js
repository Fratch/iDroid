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

(function initMotherBaseDrillDown() {
  const panelMission = document.getElementById('panel-mission');
  const mbMenu = document.getElementById('mb-menu');
  const breadcrumb = document.getElementById('idroid-breadcrumb');

  if (!panelMission || !mbMenu) return;

  function openMbSubpanel(panelId, label) {
    const target = document.querySelector(`.mb-subpanel[data-subpanel="${panelId}"]`);
    if (!target) return;

    document.querySelectorAll('.mb-subpanel.is-active')
      .forEach(p => p.classList.remove('is-active'));

    panelMission.classList.add('is-drilling');
    target.classList.add('is-active');

    if (breadcrumb) {
      breadcrumb.textContent = '› ' + label;
      breadcrumb.classList.add('is-visible');
    }
  }

  function closeMbSubpanel() {
    document.querySelectorAll('.mb-subpanel.is-active')
      .forEach(p => p.classList.remove('is-active'));

    panelMission.classList.remove('is-drilling');

    document.querySelectorAll('#mb-menu .menu-item.active')
      .forEach(i => i.classList.remove('active'));

    if (breadcrumb) {
      breadcrumb.classList.remove('is-visible');
    }
  }

  document.querySelectorAll('#mb-menu .menu-item[data-panel]').forEach(item => {
    item.addEventListener('click', () => {
      const panelId = item.dataset.panel;
      const label = item.querySelector('.menu-item-title')?.textContent || panelId;
      item.classList.add('active');
      openMbSubpanel(panelId, label);
    });
  });

  document.querySelectorAll('.mb-back-btn').forEach(btn => {
    btn.addEventListener('click', closeMbSubpanel);
  });
})();

/* ══════════════════════════════════════════════════════════
   MISSIONS DRILL-DOWN
   - Ogni .menu-item[data-panel] apre il sottopannello corrispondente
   - .subpanel-back-btn riporta alla lista principale
══════════════════════════════════════════════════════════ */
(function initMissionsDrillDown() {
  const panelMissions = document.getElementById('panel-missions');
  const missionsMenu = document.getElementById('missions-menu');
  const breadcrumb = document.getElementById('idroid-breadcrumb');
  const footerBackBtn = document.getElementById('footer-back-btn');

  if (!panelMissions || !missionsMenu) return;

  function openSubpanel(panelId, label) {
    const target = document.querySelector(`.missions-subpanel[data-subpanel="${panelId}"]`);
    if (!target) return;

    // Chiudi eventuali pannelli già aperti
    document.querySelectorAll('.missions-subpanel.is-active')
      .forEach(p => p.classList.remove('is-active'));

    // Attiva drill-down
    panelMissions.classList.add('is-drilling');
    document.body.classList.add('is-drilling-missions');
    target.classList.add('is-active');

    // Breadcrumb
    if (breadcrumb) {
      breadcrumb.textContent = label;
      breadcrumb.classList.add('is-visible');
    }
  }

  function closeSubpanel() {
    document.querySelectorAll('.missions-subpanel.is-active')
      .forEach(p => p.classList.remove('is-active'));

    panelMissions.classList.remove('is-drilling');
    document.body.classList.remove('is-drilling-missions');

    document.querySelectorAll('#missions-menu .menu-item.active')
      .forEach(i => i.classList.remove('active'));

    // Nascondi breadcrumb
    if (breadcrumb) {
      breadcrumb.classList.remove('is-visible');
    }
  }

  // Apri da menu-item
  document.querySelectorAll('#missions-menu .menu-item[data-panel]').forEach(item => {
    item.addEventListener('click', () => {
      const panelId = item.dataset.panel;
      const label = item.querySelector('.menu-item-title')?.textContent || panelId;
      item.classList.add('active');
      openSubpanel(panelId, label);
    });
  });

  // Back dal bottone interno al subpanel (se lo tieni come fallback)
  document.querySelectorAll('.subpanel-back-btn').forEach(btn => {
    btn.addEventListener('click', closeSubpanel);
  });

  // Back dal footer
  if (footerBackBtn) {
    footerBackBtn.addEventListener('click', closeSubpanel);
  }
})();
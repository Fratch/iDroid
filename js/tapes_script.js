/* ══════════════════════════════════════════════════════════
   iDROID — Cassette Tapes
   Carica i trascritti da Metal Gear Wiki via MediaWiki API
   (action=parse, non più rvparse deprecato)
══════════════════════════════════════════════════════════ */

const WIKI_PAGE = 'Metal Gear Solid V: The Phantom Pain/Cassette Transcripts';
const API_URL   = `https://metalgear.fandom.com/api.php?action=parse&page=${encodeURIComponent(WIKI_PAGE)}&prop=text&format=json&origin=*`;

/* ── Struttura dati globale ── */
const dataObj = {
  tree_structure: { parentTopic: {} }
};

/* ══════════════════════════════════════════════════════════
   1. FETCH + PARSE
══════════════════════════════════════════════════════════ */
function loadData() {
  fetch(API_URL)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(json => {
      const html = json?.parse?.text?.['*'];
      if (!html) throw new Error('Nessun HTML nella risposta API');
      parseHTMLData(html);
    })
    .catch(err => {
      console.error('Tapes: caricamento fallito —', err);
      showLoadError();
    });
}

function showLoadError() {
  $('#column_1_tapes').html(
    '<p style="color:var(--text-secondary);font-size:0.7rem;padding:12px;">UNABLE TO LOAD TAPE DATA</p>'
  );
}

/* ══════════════════════════════════════════════════════════
   2. PARSING HTML → tree_structure
══════════════════════════════════════════════════════════ */
function parseHTMLData(html) {
  /* Crea un DOM temporaneo */
  const parser  = new DOMParser();
  const doc     = parser.parseFromString(html, 'text/html');
  const content = doc.querySelector('.mw-parser-output');
  if (!content) { showLoadError(); return; }

  const tree = dataObj.tree_structure.parentTopic;

  let currentParent  = null;
  let currentSub     = null;

  Array.from(content.children).forEach(el => {
    const tag = el.tagName.toUpperCase();

    /* H2 non ci interessa come categoria (es. "Info Tapes") — usalo come
       guardia per non raccogliere contenuto prima della sezione giusta */
    if (tag === 'H2') {
      const txt = el.textContent.trim();
      /* Resetta se arriviamo a sezioni fuori tema */
      if (txt.toLowerCase().includes('cassette') ||
          txt.toLowerCase().includes('tape') ||
          txt.toLowerCase().includes('info')) {
        /* ok, siamo nella sezione giusta — non fare nulla */
      }
      return;
    }

    /* H3 → Parent Topic */
    if (tag === 'H3') {
      currentParent = el.querySelector('.mw-headline')?.textContent.trim()
                    || el.textContent.trim();
      if (currentParent && !tree[currentParent]) {
        tree[currentParent] = {};
      }
      currentSub = null;
      return;
    }

    /* H4 → Sub Topic */
    if (tag === 'H4') {
      if (!currentParent) return;
      currentSub = el.querySelector('.mw-headline')?.textContent.trim()
                 || el.textContent.trim();
      if (currentSub && !tree[currentParent][currentSub]) {
        tree[currentParent][currentSub] = [];
      }
      return;
    }

    /* P → dialogo */
    if (tag === 'P' && currentParent && currentSub) {
      const lines = parseDialogueParagraph(el);
      lines.forEach(line => tree[currentParent][currentSub].push(line));
    }
  });

  /* Se non ha trovato nulla con H3/H4, prova struttura alternativa (DL/UL) */
  if (Object.keys(tree).length === 0) {
    parseFallbackStructure(content, tree);
  }

  if (Object.keys(tree).length === 0) {
    showLoadError();
    return;
  }

  displayData(dataObj);
}

/* Estrae righe di dialogo da un <p> */
function parseDialogueParagraph(pEl) {
  const fullText = pEl.textContent.trim();
  if (!fullText) return [];

  /* Prova a spezzare per "NOME:" */
  const multiLine = fullText.split('\n').filter(l => l.trim());
  if (multiLine.length > 1) {
    return multiLine.map(l => lineToEntry(l));
  }

  /* Prova a spezzare per ". NOME:" (dialogo compatto) */
  const compact = fullText.split(/(?<=\.)\s+(?=[A-Z][A-Z\s]+:)/);
  if (compact.length > 1) {
    return compact.map(l => lineToEntry(l.trim()));
  }

  return [lineToEntry(fullText)];
}

function lineToEntry(text) {
  const colonIdx = text.indexOf(':');
  if (colonIdx > 0 && colonIdx < 40) {
    const speaker = text.substring(0, colonIdx + 1).trim();
    const line    = text.substring(colonIdx + 1).trim();
    return [speaker, line];
  }
  return ['', text];
}

/* Fallback per strutture non standard (DL, UL, ecc.) */
function parseFallbackStructure(content, tree) {
  let parent = 'TAPES';
  let sub    = 'ALL';
  tree[parent] = { [sub]: [] };

  content.querySelectorAll('p').forEach(p => {
    const t = p.textContent.trim();
    if (!t) return;
    tree[parent][sub].push(lineToEntry(t));
  });
}

/* ══════════════════════════════════════════════════════════
   3. DISPLAY
══════════════════════════════════════════════════════════ */
function displayData(data) {
  const tree = data.tree_structure.parentTopic;

  /* ── Colonna 1: parent topics ── */
  $('#column_1_tapes').empty();
  Object.keys(tree).forEach(topic => {
    $('#column_1_tapes').append(
      `<button class="topic_tape" data-topic="${escHtml(topic)}">${escHtml(topic)}</button>`
    );
  });

  /* ── Delegazione eventi colonna 1 ── */
  $('#column_1_tapes').off('click', 'button.topic_tape')
    .on('click', 'button.topic_tape', function () {
      $('.active_topic').removeClass('active_topic');
      $(this).addClass('active_topic');

      const topic = $(this).data('topic');
      $('#column_2_tapes').empty();

      Object.keys(tree[topic] || {}).forEach(sub => {
        $('#column_2_tapes').append(
          `<button class="topic_tape" data-sub="${escHtml(sub)}">${escHtml(sub)} <span class="sub_topic_playing">[<i class="fas fa-volume-up"></i>]</span></button>`
        );
      });
    });

  /* ── Delegazione eventi colonna 2 ── */
  $('#column_2_tapes').off('click', 'button.topic_tape')
    .on('click', 'button.topic_tape', function () {
      if ($(this).hasClass('active_topic')) return;

      $('#column_2_tapes .active_topic').removeClass('active_topic');
      $('.active_playing').removeClass('active_playing');
      $('.disabled_control').removeClass('disabled_control');
      $('#box_settings .btn_settings > button').removeAttr('aria-hidden tabindex');

      $(this).addClass('active_topic');
      $(this).children('.sub_topic_playing').addClass('active_playing');

      const parentTopic = $('#column_1_tapes .active_topic').data('topic');
      const subTopic    = $(this).data('sub');

      $('#progress_current').css('width', '0%');
      $('#current_tape_heading').text(subTopic);

      const tapeArr = tree[parentTopic]?.[subTopic] || [];
      playTheTape(tapeArr);

      $('#activeToContinue').focus();
    });

  /* Naviga con frecce sinistra/destra tra le colonne */
  $('#column_1_tapes, #column_2_tapes').off('keydown', 'button.topic_tape')
    .on('keydown', 'button.topic_tape', function (e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const sibling = $(this).closest('.column').siblings('.column').find('button.topic_tape');
        const focus   = sibling.filter('.active_topic').length
                        ? sibling.filter('.active_topic')
                        : sibling.first();
        focus.focus();
        e.preventDefault();
      }
    });

  /* Continue / Stop buttons */
  $('#activeToContinue').off('click').on('click', function () {
    $('#dialogueBox > .inner_box').click();
  });
}

/* ══════════════════════════════════════════════════════════
   4. PLAYBACK
══════════════════════════════════════════════════════════ */
function playTheTape(tapeArr) {
  /* Normalizza: ogni item deve essere [speaker, text] */
  const flat = [];
  tapeArr.forEach(item => {
    if (Array.isArray(item) && typeof item[0] === 'string') {
      /* già [speaker, text] */
      flat.push(item);
    } else if (Array.isArray(item) && typeof item[0] === 'object') {
      /* vecchio formato [{speaker: text}] */
      const key = Object.keys(item[0])[0];
      flat.push([key, item[0][key]]);
    }
  });

  /* Spezza frasi lunghe */
  const newArr = [];
  flat.forEach(([speaker, text]) => {
    if (text.length > 150) {
      const sentences = text.split(/(?<=\.)\s+/);
      sentences.forEach(s => newArr.push([speaker, s.trim()]));
    } else {
      newArr.push([speaker, text]);
    }
  });

  if (!newArr.length) {
    $('#current_tape_heading').text('NO DATA');
    return;
  }

  $('#current_progress #current_length').text(newArr.length);
  $('#current_progress #current_now').text('1');

  function pct(curr) {
    return Math.round(100 / newArr.length * curr);
  }

  $('#progress_current').css('width', pct(1) + '%');

  function setText(idx) {
    const [spk, txt] = newArr[idx] || ['', ''];
    $('#dialogueBox h2.current_text').text(spk ? spk + ' ' + txt : txt);
    $('#current_sub_tape_heading').text(spk);
    $('#current_progress #current_now').text(idx + 1);
    $('#progress_current').css('width', pct(idx + 1) + '%');
  }

  setText(0);

  let count = 1;

  /* Rimuovi listener precedenti per evitare stack multipli */
  $('#dialogueBox > .inner_box').off('click.tape').on('click.tape', function () {
    if (count < newArr.length) { setText(count); count++; }
  });

  $('#back_btn').off('click.tape').on('click.tape', function () {
    if (count > 1) { count = Math.max(1, count - 2); setText(count); count++; }
  });

  $('#stop_btn, #activeToStop').off('click.tape').on('click.tape', function () {
    count = newArr.length;
    $('#current_progress #current_now, #current_progress #current_length').text('0');
    $('#progress_current').css('width', '0%');
    $('#dialogueBox h2.current_text').text('');
    $('#column_2_tapes .active_playing').removeClass('active_playing');
    $('#box_settings .btn_settings *').addClass('disabled_control');
    $('#box_settings .btn_settings > button').attr({ 'aria-hidden': 'true', tabindex: '-1' });
  });
}

/* ══════════════════════════════════════════════════════════
   5. CLOCK
══════════════════════════════════════════════════════════ */
(function initClock() {
  let colonOn = true;
  function tick() {
    const d = new Date();
    $('#clock-hours').text(String(d.getHours()).padStart(2, '0'));
    $('#clock-mins').text(String(d.getMinutes()).padStart(2, '0'));
    $('#clock-colon').css('visibility', colonOn ? 'visible' : 'hidden');
    colonOn = !colonOn;
  }
  tick();
  setInterval(tick, 1000);
})();

/* ══════════════════════════════════════════════════════════
   6. KEYBOARD SHORTCUTS
══════════════════════════════════════════════════════════ */
$('body').on('keydown', function (e) {
  if (e.key === 'Enter' && !$('#activeToContinue').hasClass('disabled_control')) {
    $('#activeToContinue').click();
  }
  if (e.key === ' ' && !$('#activeToStop').hasClass('disabled_control')) {
    e.preventDefault();
    $('#activeToStop').click();
  }
});

/* ══════════════════════════════════════════════════════════
   7. UTILS
══════════════════════════════════════════════════════════ */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Avvio ── */
loadData();

/* ── Export per test Node.js (opzionale) ── */
try { module.exports = { parseHTMLData, lineToEntry }; } catch (_) {}
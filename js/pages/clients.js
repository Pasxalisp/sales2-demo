/* Σελίδα «Πελατολόγιο»: λίστα, αναζήτηση, φίλτρα. Μεταφορά από την παλιά σελίδα (render, panel, exp, bak).
   Η καρτέλα είναι στο client.js. Η κατάσταση των φίλτρων μένει όταν γυρνάς πίσω. */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, D = PL.dlg, esc = u.esc, money = u.money, nn = u.nn;
  const st = (PL.clientsState = PL.clientsState || { q: '', city: '', onlyT: false, yf: '', open: false });
  const COLS = ['clients', 'prospects', 'notes', 'sos', 'tech', 'brands', 'cats'];

  const HEAD = `<header>
<div class="row"><h1 id="hm">Πελατολόγιο</h1>
<span class="hmb"><button id="tzb" class="chip">📊 Τζίρος</button><button id="fsb" class="chip">📈 FLASH</button></span></div>
<div style="display:flex;gap:6px;align-items:stretch">
<button id="fb" class="chip" style="flex:none;padding:6px 10px;border-radius:10px">Φίλτρα ▾</button>
<input id="q" type="search" placeholder="Όνομα ή τηλέφωνο…" style="flex:1;min-width:0"></div>
<div id="fbox" hidden>
<div id="cw" style="position:relative;display:flex;gap:6px;margin-top:8px">
<input id="qc" autocomplete="off" placeholder="Πόλη / περιοχή…" style="flex:1">
<button id="cb" aria-label="Όλες οι περιοχές" style="padding:0 16px">▾</button>
<div id="cp"></div></div>
<div id="ct" style="display:none;padding:6px 0 0"></div>
<div class="chips" id="chips"></div>
<div id="yt" style="display:none;padding:6px 0 0"></div>
<div id="at" style="display:none;padding:6px 0 0;font-weight:600"></div></div></header>
<div id="list"></div>
<p class="mu" id="cnt"></p>
<button id="exp">Λήψη σε αρχείο (CSV)</button>
<button class="pri" id="bak">💾 Πλήρες αντίγραφο ασφαλείας</button>`;

  PL.register('clients', {
    title: 'Πελατολόγιο',
    split: ['client'],   /* σε οριζόντια οθόνη: η καρτέλα ανοίγει δεξιά (core.js) */
    nova: () => PL.menu('Πελατολόγιο', [
      { e: '👤', label: 'Νέος πελάτης', d: 'κομμωτήριο που δεν υπάρχει στη λίστα', fn: () => PL.dictation.open('Νέος πελάτης: ') },
      { e: '📝', label: 'Νέα σημείωση σε πελάτη', d: 'πες τι συζητήσατε, μπαίνει στην καρτέλα', fn: () => PL.dictation.open('Στον πελάτη ') },
    ]),
    render(el) {
      el.innerHTML = HEAD;
      const $ = (s) => el.querySelector(s);
      $('#q').value = st.q; $('#qc').value = st.city; $('#fbox').hidden = !st.open;
      COLS.forEach((c) => S.use(c));

      const cities = () => { const cm = {}; M.clients().forEach((c) => { cm[c.city] = (cm[c.city] || 0) + 1; }); return cm; };
      const panel = (f) => { const cm = cities(), k = Object.keys(cm).filter((x) => !f || nn(x).includes(nn(f))).sort((a, b) => a.localeCompare(b, 'el')), p = $('#cp');
        p.innerHTML = k.map((x) => `<div class="pk" data-pick="${esc(x)}"><span>${esc(x)}</span><span class="mu">${cm[x]}</span></div>`).join('') || '<div class="pk mu">Καμία περιοχή</div>'; return p; };

      const draw = () => {
        const C = M.clients(), cq = nn(st.city), t = nn(st.q), yf = st.yf, onlyT = st.onlyT;
        $('#chips').innerHTML = `<button class="chip ${!cq && !onlyT && !yf ? 'on' : ''}" data-c="">Όλοι</button><button class="chip ${onlyT ? 'on' : ''}" data-t="1">Με τζίρο</button><button class="chip ${yf === 'up' ? 'on' : ''}" data-y="up">▲ Θετικοί</button><button class="chip ${yf === 'dn' ? 'on' : ''}" data-y="dn">▼ Αρνητικοί</button>`;
        const base = C.filter((c) => (!cq || nn(c.city).includes(cq)) && (!yf || (M.yoy(c) && M.yoy(c).cls === yf)) &&
          (!t || nn(c.name + ' ' + (c.alt || []).join(' ') + ' ' + c.addr + ' ' + c.city + ' ' + c.t1 + ' ' + c.t2 + ' ' + (c.more || []).join(' ') + ' ' + (c.codes || [c.code]).join(' ')).includes(t)));
        const tz = new Map(base.map((c) => [c.i, M.tz(c)]));
        const L = base.filter((c) => !onlyT || tz.get(c.i) > 0);
        L.sort((a, b) => (!!b.prospect - !!a.prospect) || (tz.get(b.i) - tz.get(a.i)) || a.name.localeCompare(b.name, 'el'));
        const SOS = S.all('sos'), TECH = S.all('tech'), today = u.today();
        $('#list').innerHTML = L.map((c) => {
          const e = M.entries(c.i), nx = M.nextOf(c.i), due = nx && nx <= today, y = M.yoy(c), w = M.works(c.i), td = e.find((z) => z.todo), z = tz.get(c.i);
          return `<div class="card" data-id="${esc(c.i)}"><div class="row"><span class="nm">${TECH[c.i] ? `<span class="ti">${PL.icon.tech16}</span> ` : ''}${PL.prospects.tag(c)}${esc(c.name)}</span>` +
            `<span style="display:flex;align-items:center;gap:4px"><span class="tz">${z > 0 ? money(z) : ''}</span><button data-star="${esc(c.i)}" aria-label="SOS" style="padding:0 4px;border:none;background:none;font-size:22px;line-height:1">${SOS[c.i] ? '⭐' : '☆'}</button></span></div>` +
            `<div class="mu">${esc(c.city)}</div>` + (y ? `<div class="${y.cls}" style="font-size:14px">Goldwell ${y.txt} (${M.dd(y)}) σε σχέση με πέρσι</div>` : '') +
            (w.length ? `<div class="mu">Δουλεύει: ${esc(w.join(', '))}</div>` : '') +
            (e.length ? `<div class="mu">Τελευταία: ${esc(e[0].d)}${e[0].products ? ' · ' + esc(e[0].products) : ''}</div>` : '') +
            (td ? `<div class="say">Να πω: ${esc(td.todo)}</div>` : '') + (due ? `<div class="due">Επικοινωνία: ${esc(nx)}</div>` : '') + '</div>';
        }).join('');
        $('#cnt').textContent = L.length + ' πελάτες';
        const ct = $('#ct');
        if (cq) {
          const Sx = C.filter((c) => nn(c.city).includes(cq)); let tzs = 0, a = 0, b = 0;
          Sx.forEach((c) => { tzs += M.tz(c); const g = M.gold(c); if (g) { a += g[0]; b += g[1]; } });
          const d = b - a, p = a > 0 ? Math.round(Math.abs(d) / a * 100) : null;
          ct.style.display = 'block';
          ct.innerHTML = '<b>' + esc(st.city.trim()) + '</b>: τζίρος ' + money(tzs) + ' · <span class="' + (d >= 0 ? 'up' : 'dn') + '">Goldwell ' + (d >= 0 ? '▲ +' : '▼ −') + money(Math.abs(d)) + (p != null ? ' (' + (d >= 0 ? '+' : '−') + p + '%)' : '') + ' σε σχέση με πέρσι</span>';
        } else ct.style.display = 'none';
        const yt = $('#yt');
        if (yf) { let s = 0; L.forEach((c) => { const y = M.yoy(c); if (y) s += y.ty - y.ly; });
          yt.style.display = 'block'; yt.className = yf === 'up' ? 'up' : 'dn'; yt.textContent = (yf === 'up' ? 'Συν συνολικά: +' : 'Χάθηκαν συνολικά: −') + money(Math.abs(s)) + ' · ' + L.length + ' πελάτες'; } else yt.style.display = 'none';
        const at = $('#at');
        if (onlyT) {
          const a = base.filter((c) => tz.get(c.i) > 150).length, gv = (c) => M.gold(c) || [0, 0, 0], ly = (c) => gv(c)[2] || 0, ty = (c) => gv(c)[1] || 0;
          const l1 = base.filter((c) => ly(c) > 150).length, nw = base.filter((c) => ty(c) > 150 && ly(c) <= 150).length, sp = base.filter((c) => ly(c) > 150 && ty(c) <= 150).length;
          at.style.display = 'block';
          at.innerHTML = 'Ενεργοί (πάνω από 150 €): ' + a + ' · Ανενεργοί: ' + (base.length - a) + '<div class="mu" style="font-weight:400">Πέρσι ενεργοί (Goldwell): ' + l1 + '<br>Ήρθαν από πέρσι: ' + nw + ' · Σταμάτησαν: ' + sp + '</div>';
        } else at.style.display = 'none';
        const fb = $('#fb'), parts = [];
        if (cq) parts.push(st.city.trim()); if (yf) parts.push(yf === 'up' ? '▲ Θετικοί' : '▼ Αρνητικοί'); if (onlyT) parts.push('Με τζίρο');
        fb.textContent = 'Φίλτρα' + (parts.length ? ' (' + parts.length + ')' : '') + (st.open ? ' ▴' : ' ▾'); fb.title = parts.join(' · '); fb.classList.toggle('on', parts.length > 0);
      };
      let raf = 0; const redraw = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); };
      draw();
      const offs = COLS.map((c) => S.on(c, redraw));

      $('#q').addEventListener('input', (e) => { st.q = e.target.value; draw(); });
      $('#qc').addEventListener('input', (e) => { st.city = e.target.value; const p = panel(e.target.value); p.style.display = e.target.value ? 'block' : 'none'; draw(); });
      el.addEventListener('click', async (e) => {
        const t = e.target;
        if (!t.closest('#cw')) $('#cp').style.display = 'none';
        if (t.id === 'cb') { const p = $('#cp'); if (p.style.display === 'block') p.style.display = 'none'; else { panel(''); p.style.display = 'block'; } }
        else if (t.closest('[data-pick]')) { const v = t.closest('[data-pick]').dataset.pick; $('#qc').value = v; st.city = v; $('#cp').style.display = 'none'; draw(); }
        else if (t.id === 'fb') { st.open = !st.open; $('#fbox').hidden = !st.open; draw(); }
        else if (t.id === 'tzb') PL.nav.push('charts');
        else if (t.id === 'fsb') PL.nav.push('flash');
        else if (t.dataset.c !== undefined && t.classList.contains('chip')) { st.city = ''; st.yf = ''; $('#qc').value = ''; st.onlyT = false; draw(); }
        else if (t.dataset.t) { st.onlyT = !st.onlyT; draw(); }
        else if (t.dataset.y) { st.yf = st.yf === t.dataset.y ? '' : t.dataset.y; draw(); }
        else if (t.closest('[data-star]')) {
          const id = t.closest('[data-star]').dataset.star;
          try { if (S.get('sos', id)) await PL.adapter.db.remove('sos/' + id); else await PL.adapter.db.set('sos/' + id, { on: true, d: u.today() }); } catch (x) { D.toast('Δεν αποθηκεύτηκε'); }
        }
        else if (t.closest('.card[data-id]')) PL.nav.push('client', { id: t.closest('.card[data-id]').dataset.id });
        else if (t.id === 'exp') {
          const rows = [['Κωδικός', 'Επωνυμία', 'Διεύθυνση', 'Πόλη', 'Τηλέφωνο 1', 'Τηλέφωνο 2', 'Τζίρος', 'Δουλεύει ήδη', 'Goldwell φέτος', 'Goldwell πέρυσι', 'Goldwell πέρυσι (όλη η χρονιά)', 'Ημερομηνία', 'Προϊόντα', 'Σημείωση', 'Να πω την επόμενη φορά', 'Εκκρεμότητα για']];
          M.clients().forEach((c) => { const en = M.entries(c.i), gy = M.gold(c) || ['', ''], cd = (c.codes || [c.code]).join('+'), w = M.works(c.i).join(', '), tz = M.tz(c);
            if (!en.length) rows.push([cd, c.name, c.addr, c.city, c.t1, c.t2, tz, w, gy[1], gy[0], gy[2] == null ? '' : gy[2], '', '', '', '', '']);
            en.forEach((x) => rows.push([cd, c.name, c.addr, c.city, c.t1, c.t2, tz, w, gy[1], gy[0], gy[2] == null ? '' : gy[2], x.d, x.products, x.text, x.todo || '', x.next])); });
          const csv = '﻿' + rows.map((r) => r.map((v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"').join(';')).join('\n');
          try { await PL.adapter.files.save('pelatologio.csv', csv); } catch (x) { D.toast('Η λήψη δουλεύει μόνο μέσα στο claude.ai'); }
        }
        else if (t.id === 'bak') {
          try { await PL.dataio.backup(); D.toast('💾 Το αντίγραφο κατέβηκε'); } catch (x) { D.toast('Δεν έγινε η λήψη (' + ((x && x.code) || 'σφάλμα') + ')'); }
        }
      });
      return () => { offs.forEach((f) => f()); cancelAnimationFrame(raf); };
    },
  });
})();

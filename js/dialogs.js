/* Κοινά παράθυρα, ίδια με της παλιάς σελίδας: επιβεβαίωση (#cfm), επιλογή (#chm), κλήση (#callm) και μήνυμα (#ntoast).
   Το HTML τους μπαίνει μία φορά στη σελίδα. */
(function () {
  const PL = window.PL, esc = PL.u.esc;
  const WRAP = 'display:none;position:fixed;inset:0;z-index:%Z;background:rgba(0,0,0,.45);align-items:center;justify-content:center;padding:20px';
  const BOX = 'background:var(--card);color:var(--tx);border-radius:14px;padding:16px;max-width:%Wpx;width:100%';
  const wrap = (id, z, w, inner) => `<div id="${id}" style="${WRAP.replace('%Z', z)}"><div style="${BOX.replace('%W', w)}">${inner}</div></div>`;
  const html =
    wrap('cfm', 50, 360, '<div id="cfmt" style="margin-bottom:14px"></div><div style="display:flex;gap:8px;justify-content:flex-end"><button id="cfmn">Άκυρο</button><button class="pri" id="cfmy" style="background:#d9382f;border-color:#d9382f">Ναι, διαγραφή</button></div>') +
    wrap('chm', 55, 380, '<div id="chmt" style="margin-bottom:14px;line-height:1.4"></div><div id="chmb" style="display:flex;flex-direction:column;gap:8px"></div>') +
    wrap('callm', 50, 360, '<div id="callt" style="margin-bottom:14px"></div><div id="calll"></div><div style="display:flex;gap:8px;justify-content:flex-end"><button id="calln">Άκυρο</button><a class="btn" id="cally" href="#" target="_blank" rel="noopener" style="background:var(--ac);color:#fff;margin:0">📞 Κλήση</a></div>') +
    '<div id="ntoast"></div>';
  const $ = (id) => document.getElementById(id);

  function mount() {
    const d = document.createElement('div'); d.innerHTML = html; while (d.firstChild) document.body.appendChild(d.firstChild);
    document.addEventListener('click', (ev) => {
      /* το άνοιγμα του #callm το κάνει το call.js (PL.call.open) */
      if (ev.target.id === 'calln' || ev.target.id === 'callm' || ev.target.id === 'cally' || ev.target.closest('.callo')) $('callm').style.display = 'none';
    });
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);

  let tT = null;
  PL.dlg = {
    /* Ναι/Όχι. Επιστρέφει υπόσχεση true/false. */
    confirm(txt, yes, no) {
      return new Promise((res) => {
        const m = $('cfm'); $('cfmt').textContent = txt; $('cfmy').textContent = yes || 'Ναι, διαγραφή'; $('cfmn').textContent = no || 'Άκυρο'; m.style.display = 'flex';
        const done = (v) => { m.style.display = 'none'; $('cfmy').onclick = null; $('cfmn').onclick = null; res(v); };
        $('cfmy').onclick = () => done(true); $('cfmn').onclick = () => done(false);
      });
    },
    /* Επιλογή ανάμεσα σε κουμπιά. Επιστρέφει τον αριθμό της επιλογής. */
    choice(txt, opts) {
      return new Promise((res) => {
        const m = $('chm'); $('chmt').textContent = txt;
        $('chmb').innerHTML = opts.map((o, k) => `<button data-ch="${k}" class="${k === 0 ? 'pri' : ''}" style="padding:12px;text-align:left">${esc(o)}</button>`).join('');
        m.style.display = 'flex';
        $('chmb').onclick = (ev) => { const b = ev.target.closest('[data-ch]'); if (!b) return; m.style.display = 'none'; $('chmb').onclick = null; res(+b.dataset.ch); };
      });
    },
    toast(msg) { const t = $('ntoast'); t.textContent = msg; t.style.display = 'block'; clearTimeout(tT); tT = setTimeout(() => { t.style.display = 'none'; }, 3200); },
    /* Εφέ «Ολοκληρώθηκε» (πράσινο τικ, 3″) όταν τελειώνει ένα πρόγραμμα. */
    celebrate(p, onClose) {
      PL.dlg.celebrated.add(p && p.id);
      const old = $('cel'); if (old) old.remove();
      const where = p && p.cities && p.cities.length ? p.cities.join(' + ') : '';
      const o = document.createElement('div'); o.id = 'cel'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', 'Το πρόγραμμα ολοκληρώθηκε');
      o.innerHTML = '<div class="cb"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="cc" cx="50" cy="50" r="46"/><path class="ck" d="M29 51 L44 65 L72 36"/></svg><h3>Ολοκληρώθηκε</h3><p>το πρόγραμμα' + (where ? ' <b>' + esc(where) + '</b>' : '') + '</p></div>';
      let T = 0;
      const close = () => { clearTimeout(T); o.classList.remove('on'); setTimeout(() => { o.remove(); if (onClose) try { onClose(); } catch (e) { /* τίποτα */ } }, 260); };
      o.addEventListener('click', close); document.body.appendChild(o);
      requestAnimationFrame(() => requestAnimationFrame(() => o.classList.add('on'))); T = setTimeout(close, 3200);
    },
    celebrated: new Set(),
    open: () => ['cfm', 'chm', 'callm'].some((id) => { const m = $(id); return m && m.style.display === 'flex'; }),
  };
})();

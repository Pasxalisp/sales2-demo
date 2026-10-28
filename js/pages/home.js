/* Αρχική οθόνη: ίδια δομή και εμφάνιση με την παλιά σελίδα (έκδοση 161). Ό,τι αφορά μόνο την αρχική μένει εδώ. */
(function () {
  const PL = window.PL;
  const MARKUP = `<div class="hh"><div class="htt"><svg viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="9" fill="#2f6f5e"/><rect x="8" y="19" width="5" height="8" rx="1.5" fill="#fff"/><rect x="14.5" y="14" width="5" height="13" rx="1.5" fill="#fff"/><rect x="21" y="8" width="5" height="19" rx="1.5" fill="#8fe3c6"/></svg><span>Sales<small>2.0</small></span></div><div class="hdt" id="hdt"></div><button id="hqr" data-go="card" aria-label="Η κάρτα μου (QR)" title="Η κάρτα μου"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/></svg></button><button id="hset" data-go="data" aria-label="Ρυθμίσεις" title="Ρυθμίσεις"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button></div><button id="hdue" class="duec"></button><div id="hmatch"></div><div class="hg"><button id="hc2" class="tl"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="var(--ac)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1m3 0v16"/><path d="M13 8h2M13 12h2"/></svg><span>Πελατολόγιο</span><span class="ts" id="hcnt"></span></button><button id="hp" class="tl"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="var(--ac)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M16 3v4M8 3v4M4 11h16"/><path d="M8 15h2v2H8z"/></svg><span>Πρόγραμμα</span><span class="ts" id="hps">Πού να πας και τι να πεις</span></button><button id="hbal" class="tl"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="var(--ac)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M14.8 9a2 2 0 0 0-1.8-1h-.5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h.5a2 2 0 0 0 1.8-1"/><path d="M7 10h4M7 14h4"/></svg><span>Υπόλοιπα</span><span class="ts" id="hbs">Ανοιχτά υπόλοιπα</span></button><button id="htech" class="tl tech"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="var(--ac)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 10h3V7L6.5 3.5a6 6 0 0 1 8 8l6 6a2 2 0 0 1-3 3l-6-6a6 6 0 0 1-8-8L7 10"/></svg><span>Τεχνικός – Σεμινάρια</span><span class="ts" id="htc"></span></button><button id="hwb" class="tl"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="var(--ac)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 2h4v3h-4z"/><path d="M9 5h6l1 3v12a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V8z"/><path d="M8 12h8"/></svg><span>Προϊόντα</span></button><button id="hdl" class="tl" style="background:rgba(122,63,184,.08);border-color:#b48ce0"><svg style="stroke:#7a3fb8!important" viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#7a3fb8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12l4-4 4 3 3-3 7 6"/><path d="M7 8 3 12l5 5 2-2"/><path d="M21 14l-6 5-3-2"/><path d="M12 17l-2-2"/></svg><span style="color:#7a3fb8">Συμφωνίες</span><span class="ts" id="hdlc"></span></button></div>`;
  const NAV = { hc2: 'clients', hp: 'plan', hbal: 'balances', htech: 'tech', hwb: 'products', hdl: 'deals' };

  PL.register('home', {
    title: 'Αρχική',
    render(el) {
      el.innerHTML = '<div id="home">' + MARKUP + '</div>';
      document.body.classList.add('home');
      const $ = (s) => el.querySelector(s);
      const t = new Date().toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long' });
      $('#hdt').textContent = t.charAt(0).toUpperCase() + t.slice(1);
      /* τα πλακίδια έχουν ως data-go το id της σελίδας */
      Object.entries(NAV).forEach(([id, page]) => { $('#' + id).dataset.go = page; });
      $('#hdue').dataset.go = 'tasks';
      el.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-go]'); if (b) { PL.nav.push(b.dataset.go); return; }
        /* προσωρινός που πέρασε στο orders: «Ένωση» (το πάτημα είναι η έγκριση) ή «Όχι, άλλος» */
        const m = e.target.closest('[data-hmy],[data-hmn]'); if (!m) return;
        const [pid, cid] = (m.dataset.hmy || m.dataset.hmn).split('|'); m.parentNode.querySelectorAll('button').forEach((x) => { x.disabled = true; });
        try {
          if (m.dataset.hmy) { const c = await PL.prospects.merge(pid, cid); PL.dlg.toast('Ενώθηκε με «' + c.name + '»'); }
          else await PL.prospects.dismiss(pid, cid);
        } catch (x) { PL.dlg.toast('Δεν έγινε. Δοκίμασε ξανά.'); setMatch(); }
      });
      const S = PL.store, M = PL.model;
      /* settings: για να ανοίγει αμέσως «Η κάρτα μου» (QR) */
      ['clients', 'prospects', 'notes', 'tasks', 'plans', 'balances', 'tech', 'seminars', 'deals', 'settings'].forEach((c) => S.use(c));
      const setCnt = () => { const n = S.loaded('clients') ? M.clients().length : 0; if (n) $('#hcnt').textContent = n + ' πελάτες'; };
      const setDue = () => {
        const n = S.loaded('notes') ? M.dueList().length : 0, G = S.loaded('clients') ? PL.names.celebrants(PL.names.today()) : { list: [] };
        $('#hdue').innerHTML = '<span class="dc">' + (n ? n : '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>') + '</span><span class="dt"><span class="dl">Εκκρεμότητες</span><span class="dm">' + (n ? n + (n === 1 ? ' πελάτης περιμένει' : ' πελάτες περιμένουν') : 'Καμία σήμερα') + '</span>' +
          /* εορτολόγιο: μία διακριτική γραμμή· η λίστα είναι στις Εκκρεμότητες */
          (G.list.length ? '<span class="dnd">🎉 Γιορτάζουν ' + G.list.length + ' · ' + G.feasts.map((f) => f.s).join(', ') + '</span>' : '') + '</span>';
      };
      const setPlans = () => {
        if (!S.loaded('plans')) return;
        const L = PL.plans.activeList();
        $('#hps').textContent = L.length ? (L.length === 1 ? '1 ενεργό πρόγραμμα' : L.length + ' ενεργά προγράμματα') : 'Πού να πας και τι να πεις';
      };
      const setBits = () => {
        if (S.loaded('tech') && S.loaded('seminars')) $('#htc').textContent = Object.keys(S.all('tech')).filter((id) => M.byId(id)).length + ' τεχνικός · ' + Object.keys(S.all('seminars')).length + ' σεμινάρια';
        if (S.loaded('balances')) {
          const bv = (id, k) => +((S.get('balances', id) || {})[k] || 0);
          const has = (id) => M.byId(id) && (bv(id, 'amount') !== 0 || bv(id, 'over') !== 0 || bv(id, 'bounced') !== 0);
          const big = (id) => Math.abs(bv(id, 'amount')) >= 1 || bv(id, 'over') >= 1 || bv(id, 'bounced') !== 0;
          const L = Object.keys(S.all('balances')).filter(has), n = L.filter(big).length, tot = L.reduce((a, id) => a + bv(id, 'amount'), 0);
          $('#hbs').textContent = n ? n + ' πελάτες · ' + PL.u.money(tot) : 'Ανοιχτά υπόλοιπα';
        }
        if (S.loaded('deals')) {
          /* οι συμφωνίες είναι ΕΝΑ έγγραφο: deals/all = {πελάτης: {goal, ty, ly}, _d: ημερομηνία} */
          const L = Object.entries(S.get('deals', 'all') || {}).filter(([k]) => k[0] !== '_' && M.byId(k)), n = L.length;
          const tg = L.reduce((a, [, x]) => a + (x.goal || 0), 0), tt = L.reduce((a, [, x]) => a + (x.ty || 0), 0);
          $('#hdlc').textContent = n ? n + ' πελάτες · ' + (tg ? Math.round(tt / tg * 100) : 0) + '%' : 'Από το orders';
        }
      };
      const setMatch = () => {
        const esc = PL.u.esc;
        $('#hmatch').innerHTML = PL.prospects.matches().map((m) => { const p = M.byId(m.pid), c = M.byId(m.cid);
          return `<div class="warn" style="margin:0 0 10px">🆕 Ο προσωρινός <b>${esc(p.name)}</b> πέρασε στο orders ως <b>${esc(c.name)}</b>${c.code ? ' (κωδ. ' + esc(c.code) + ')' : ''} · ${esc(m.why)}.<p style="margin:8px 0 0"><button class="pri" data-hmy="${esc(m.pid + '|' + m.cid)}">Ένωση</button> <button data-hmn="${esc(m.pid + '|' + m.cid)}">Όχι, άλλος</button></p></div>`; }).join('');
      };
      const all = () => { setCnt(); setDue(); setPlans(); setBits(); setMatch(); };
      all();
      const offs = ['clients', 'prospects', 'plans', 'tech', 'seminars', 'balances', 'deals'].map((c) => S.on(c, all));
      offs.push(PL.bus.on('due', setDue));
      return () => { document.body.classList.remove('home'); offs.forEach((f) => f && f()); };
    },
  });
})();

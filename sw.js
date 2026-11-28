/* Η ΕΦΑΡΜΟΓΗ ΧΩΡΙΣ ΙΝΤΕΡΝΕΤ (απόφαση Πασχάλη 18/11/2026) — «service worker» της δοκιμαστικής σελίδας (GitHub Pages).
   Κρατά στη συσκευή τα αρχεία της εφαρμογής (σελίδες, css, js) ώστε να ανοίγει αμέσως και χωρίς ίντερνετ.
   Τα ΔΕΔΟΜΕΝΑ τα κρατά χωριστά το lab/supa/cache.js· εδώ μόνο ο κώδικας.
   Το παράγει το demo/build_site.mjs από αυτό το αρχείο: βάζει τη λίστα των αρχείων (FILES) και την έκδοση (VERSION = αποτύπωμα
   των περιεχομένων τους). Κάθε δημοσίευση με αλλαγμένα αρχεία = νέα έκδοση: κατεβαίνει ολόκληρη στο παρασκήνιο και μπαίνει
   την επόμενη φορά που ανοίγει η εφαρμογή ή όταν ο χρήστης πατήσει «Ανανέωση» (lab/offline/offline.js). Ποτέ μισή: αν λείπει
   έστω ένα αρχείο, μένει η προηγούμενη.
   Ό,τι δεν είναι στη λίστα (η βάση, οι γραμματοσειρές του Google…) περνά κανονικά στο ίντερνετ. */
const VERSION = "7818c64c7bd9";
const BUILT = "28/11 15:32";   // πότε χτίστηκε (ημερομηνία και ώρα Ελλάδας)· φαίνεται στα «Σχετικά»
const FILES = ["css/balances.css","css/base.css","css/card.css","css/charts.css","css/client.css","css/clients.css","css/deals.css","css/dictate.css","css/home.css","css/plans.css","css/products.css","css/tech.css","db.html","diaxeirisi.html","icon.png","index.html","js/about.js","js/adapter.js","js/alarm.js","js/background.js","js/call.js","js/core.js","js/dataio.js","js/demo-seed.js","js/deposit.js","js/dialogs.js","js/dictation/find.js","js/dictation/rules.js","js/dictation/tools.js","js/drafts.js","js/enter.js","js/gestures.js","js/help.js","js/lib/qr.js","js/model.js","js/namedays-data.js","js/namedays.js","js/notes.js","js/notify.js","js/nvo.js","js/orders/catalog.js","js/pages/actions.js","js/pages/balances.js","js/pages/buyer.js","js/pages/card.js","js/pages/charts.js","js/pages/client.js","js/pages/clients.js","js/pages/data.js","js/pages/dayplan.js","js/pages/deal.js","js/pages/deals.js","js/pages/debt.js","js/pages/dictate.js","js/pages/flash.js","js/pages/free.js","js/pages/home.js","js/pages/month.js","js/pages/myplans.js","js/pages/order.js","js/pages/orders.js","js/pages/plan.js","js/pages/planview.js","js/pages/products.js","js/pages/sales.js","js/pages/task.js","js/pages/taskedit.js","js/pages/tasks.js","js/pages/tech.js","js/pages/techreq.js","js/pages/trash.js","js/pages/treqs.js","js/pages/visit.js","js/pages/whobought.js","js/picker.js","js/plans/ai.js","js/plans/area.js","js/plans/drag.js","js/plans/engine.js","js/plans/export.js","js/plans/monthplan.js","js/plans/rules.js","js/prospects.js","js/sheet.js","js/slide.js","js/store.js","js/trash.js","js/treq.js","js/util.js","kinisi.html","lab/admin/admin.css","lab/admin/admin.js","lab/errors/errors.css","lab/errors/errors.js","lab/fontpick/fontpick.css","lab/fontpick/fontpick.js","lab/history/history.css","lab/history/history.js","lab/map/leaflet/images/layers-2x.png","lab/map/leaflet/images/layers.png","lab/map/leaflet/images/marker-icon-2x.png","lab/map/leaflet/images/marker-icon.png","lab/map/leaflet/images/marker-shadow.png","lab/map/leaflet/leaflet.css","lab/map/leaflet/leaflet.js","lab/map/map.css","lab/map/map.js","lab/offline/offline.css","lab/offline/offline.js","lab/push/push.js","lab/supa/api.js","lab/supa/cache.js","lab/supa/config.js","lab/supa/session.js","lab/team/accounts.js","lab/team/session.js","lab/team/team.css","lab/team/team.js","lab/usage/usage.css","lab/usage/usage.js"];   // διαδρομές μέσα στον φάκελο της εφαρμογής
const CDN = ["https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"];       // βιβλιοθήκες από άλλο site (με σταθερή έκδοση στη διεύθυνση)
const CACHE = 'sales2-app-' + VERSION;
const ROOT = new URL('./', self.location).pathname;
const KNOWN = new Set(FILES);

self.addEventListener('install', (ev) => ev.waitUntil((async () => {
  const c = await caches.open(CACHE);
  await c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })));   // όλα ή τίποτα (φρέσκα, όχι από την προσωρινή μνήμη του browser)
  /* οι βιβλιοθήκες: αν δεν κατέβει μία (π.χ. μπλοκαρισμένο site), η εφαρμογή απλώς τη ζητά από το ίντερνετ */
  await Promise.all(CDN.map((u) => c.add(new Request(u, { mode: 'cors' })).catch(() => {})));
})()));

self.addEventListener('activate', (ev) => ev.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith('sales2-app-') && k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));

/* η σελίδα λέει «μπες τώρα» τη στιγμή που ανοίγει ή όταν πατηθεί «Ανανέωση», και ρωτά ποια έκδοση τρέχει, βλ. lab/offline/offline.js */
self.addEventListener('message', (ev) => {
  if (ev.data === 'pl-skip') self.skipWaiting();
  else if (ev.data === 'pl-version' && ev.ports[0]) ev.ports[0].postMessage({ version: VERSION, built: BUILT });
});

self.addEventListener('fetch', (ev) => {
  const r = ev.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  let key = null;
  if (u.origin === self.location.origin && u.pathname.startsWith(ROOT)) {
    const p = u.pathname.slice(ROOT.length) || 'index.html';
    if (KNOWN.has(p)) key = p;
  } else if (CDN.includes(r.url)) key = r.url;
  if (!key) return;
  ev.respondWith(caches.open(CACHE).then((c) => c.match(key)).then((hit) => hit || fetch(r)));
});

/* ΕΙΔΟΠΟΙΗΣΕΙΣ ΜΕ ΚΛΕΙΣΤΗ ΕΦΑΡΜΟΓΗ (απόφαση 19/11/2026, Β5· μόνο στο db.html, lab/push/push.js). Η βάση στέλνει την ώρα της
   υπενθύμισης ένα κρυπτογραφημένο μήνυμα {title, body, url, tag}· εδώ γίνεται ειδοποίηση του κινητού. Πάντα ειδοποίηση,
   ακόμη κι αν η εφαρμογή είναι ανοιχτή: το iPhone σταματά τις ειδοποιήσεις μιας εφαρμογής που λαμβάνει μήνυμα χωρίς να δείξει. */
self.addEventListener('push', (ev) => {
  let m = {}; try { m = ev.data ? ev.data.json() : {}; } catch (e) { m = { body: ev.data ? ev.data.text() : '' }; }
  ev.waitUntil(self.registration.showNotification(m.title || 'Sales 2.0', {
    body: m.body || '', tag: m.tag || undefined, icon: ROOT + 'icon.png', badge: ROOT + 'icon.png',
    data: { url: m.url || 'db.html' },
  }));
});
/* πάτημα στην ειδοποίηση: ανοίγει (ή φέρνει μπροστά) την εφαρμογή */
self.addEventListener('notificationclick', (ev) => {
  ev.notification.close();
  const url = new URL((ev.notification.data && ev.notification.data.url) || 'db.html', self.location).href;
  ev.waitUntil((async () => {
    const open = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const same = open.find((c) => c.url.split(/[?#]/)[0] === url);
    if (same) return same.focus();
    return self.clients.openWindow(url);
  })());
});

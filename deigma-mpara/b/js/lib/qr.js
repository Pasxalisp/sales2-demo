/* QR code (ISO/IEC 18004), χωρίς σύνδεση στο διαδίκτυο: κωδικοποίηση byte (UTF-8), διόρθωση λαθών επιπέδου M,
   αυτόματη έκδοση 1–40, επιλογή της καλύτερης μάσκας. Δεν γράφει πουθενά.
   PL.qr.matrix(text) → { size, dark(x, y) }      PL.qr.svg(text) → <svg> (μαύρο σε λευκό, με περιθώριο 4 κουτάκια) */
(function () {
  const PL = window.PL;
  /* επίπεδο M: κωδικολέξεις διόρθωσης ανά μπλοκ και πλήθος μπλοκ, για εκδόσεις 1–40 (θέση 0 αχρησιμοποίητη) */
  const ECC = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28];
  const BLOCKS = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49];
  const FORMAT_M = 0;   // δυαδικό του επιπέδου M στα στοιχεία μορφής

  const rawModules = (v) => { let r = (16 * v + 128) * v + 64; if (v >= 2) { const n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; } return r; };
  const dataCodewords = (v) => Math.floor(rawModules(v) / 8) - ECC[v] * BLOCKS[v];
  const alignPos = (v) => {
    if (v === 1) return [];
    const n = Math.floor(v / 7) + 2, size = v * 4 + 17, step = v === 32 ? 26 : Math.ceil((v * 4 + 4) / (n * 2 - 2)) * 2, out = [6];
    for (let p = size - 7; out.length < n; p -= step) out.splice(1, 0, p);
    return out;
  };

  /* Reed–Solomon στο GF(2^8) με πολυώνυμο 0x11D */
  const mul = (x, y) => { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; } return z & 0xff; };
  const divisor = (deg) => { const r = new Array(deg).fill(0); r[deg - 1] = 1; let root = 1; for (let i = 0; i < deg; i++) { for (let j = 0; j < deg; j++) { r[j] = mul(r[j], root); if (j + 1 < deg) r[j] ^= r[j + 1]; } root = mul(root, 2); } return r; };
  const remainder = (data, div) => { const r = new Array(div.length).fill(0); data.forEach((b) => { const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => { r[i] ^= mul(c, f); }); }); return r; };

  function encode(text) {
    const bytes = Array.from(new TextEncoder().encode(String(text)));
    let v = 1;
    for (; v <= 40; v++) { const cc = v < 10 ? 8 : 16; if (4 + cc + bytes.length * 8 <= dataCodewords(v) * 8) break; }
    if (v > 40) throw new Error('Πολύ μεγάλο κείμενο για QR');
    /* bits: λειτουργία byte (0100), μήκος, δεδομένα, τερματισμός, συμπλήρωση */
    const bits = []; const put = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    put(4, 4); put(bytes.length, v < 10 ? 8 : 16); bytes.forEach((b) => put(b, 8));
    const cap = dataCodewords(v) * 8;
    put(0, Math.min(4, cap - bits.length)); put(0, (8 - (bits.length % 8)) % 8);
    for (let p = 0xec; bits.length < cap; p ^= 0xec ^ 0x11) put(p, 8);
    const data = []; for (let i = 0; i < bits.length; i += 8) { let b = 0; for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j]; data.push(b); }
    /* μπλοκ + διόρθωση λαθών, μετά ανάμειξη */
    const nb = BLOCKS[v], el = ECC[v], raw = Math.floor(rawModules(v) / 8), nShort = nb - (raw % nb), shortLen = Math.floor(raw / nb), div = divisor(el), blocks = [];
    for (let i = 0, k = 0; i < nb; i++) {
      const d = data.slice(k, k + shortLen - el + (i < nShort ? 0 : 1)); k += d.length;
      const e = remainder(d, div); if (i < nShort) d.push(0); blocks.push(d.concat(e));
    }
    const words = [];
    for (let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if (i !== shortLen - el || j >= nShort) words.push(b[i]); });
    return { v, words };
  }

  function build(v, words, mask) {
    const size = v * 4 + 17, M = [], F = [];
    for (let y = 0; y < size; y++) { M.push(new Array(size).fill(false)); F.push(new Array(size).fill(false)); }
    const set = (x, y, d) => { M[y][x] = d; F[y][x] = true; };
    for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    const finder = (cx, cy) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const x = cx + dx, y = cy + dy, d = Math.max(Math.abs(dx), Math.abs(dy)); if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, d !== 2 && d !== 4); } };
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    const ap = alignPos(v), na = ap.length;
    for (let i = 0; i < na; i++) for (let j = 0; j < na; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === na - 1) || (i === na - 1 && j === 0)) continue;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ap[i] + dx, ap[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
    /* στοιχεία μορφής (επίπεδο + μάσκα) */
    const fd = (FORMAT_M << 3) | mask; let r = fd; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
    const fb = ((fd << 10) | r) ^ 0x5412, bit = (x, i) => ((x >>> i) & 1) !== 0;
    for (let i = 0; i <= 5; i++) set(8, i, bit(fb, i));
    set(8, 7, bit(fb, 6)); set(8, 8, bit(fb, 7)); set(7, 8, bit(fb, 8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(fb, i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(fb, i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(fb, i));
    set(8, size - 8, true);
    /* στοιχεία έκδοσης (από 7 και πάνω) */
    if (v >= 7) {
      let rv = v; for (let i = 0; i < 12; i++) rv = (rv << 1) ^ ((rv >>> 11) * 0x1f25);
      const vb = (v << 12) | rv;
      for (let i = 0; i < 18; i++) { const a = size - 11 + (i % 3), b = Math.floor(i / 3); set(a, b, bit(vb, i)); set(b, a, bit(vb, i)); }
    }
    /* δεδομένα σε ζιγκ-ζαγκ */
    let i = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
        const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
        if (!F[y][x] && i < words.length * 8) { M[y][x] = ((words[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0; i++; }
      }
    }
    /* μάσκα */
    const MK = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
      (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
      (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0][mask];
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!F[y][x] && MK(x, y)) M[y][x] = !M[y][x];
    return { size, M };
  }

  /* βαθμός «κακής» εμφάνισης (κανόνες 1–4 του προτύπου): μικρότερος = πιο εύκολο σκανάρισμα */
  function penalty({ size, M }) {
    let p = 0; const lines = [];
    for (let y = 0; y < size; y++) lines.push(M[y].map((d) => (d ? '1' : '0')).join(''));
    for (let x = 0; x < size; x++) { let s = ''; for (let y = 0; y < size; y++) s += M[y][x] ? '1' : '0'; lines.push(s); }
    lines.forEach((s) => {
      (s.match(/0{5,}|1{5,}/g) || []).forEach((r) => { p += 3 + r.length - 5; });
      const q = '0000' + s + '0000'; let k = -1;
      while ((k = q.indexOf('10111010000', k + 1)) >= 0) p += 40;
      k = -1; while ((k = q.indexOf('00001011101', k + 1)) >= 0) p += 40;
    });
    let dark = 0;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      if (M[y][x]) dark++;
      if (x < size - 1 && y < size - 1 && M[y][x] === M[y][x + 1] && M[y][x] === M[y + 1][x] && M[y][x] === M[y + 1][x + 1]) p += 3;
    }
    p += Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
    return p;
  }

  PL.qr = {
    matrix(text) {
      const { v, words } = encode(text); let best = null, bp = Infinity;
      for (let m = 0; m < 8; m++) { const q = build(v, words, m), s = penalty(q); if (s < bp) { bp = s; best = q; } }
      return { size: best.size, version: v, dark: (x, y) => best.M[y][x] };
    },
    svg(text) {
      const q = PL.qr.matrix(text), n = q.size + 8; let d = '';
      for (let y = 0; y < q.size; y++) for (let x = 0; x < q.size; x++) if (q.dark(x, y)) d += `M${x + 4} ${y + 4}h1v1h-1z`;
      return `<svg class="qrimg" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="${n}" height="${n}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
    },
  };
})();

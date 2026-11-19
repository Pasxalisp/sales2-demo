/* Κλήσεις στις εργασίες του server (Supabase Edge Functions) για τους λογαριασμούς (db.html):
   - login:        είσοδος με κλείδωμα μετά από 5 λάθος κωδικούς (χωρίς σύνδεση)
   - account:      ο συνδεδεμένος βάζει δικό του κωδικό
   - admin-users:  εργαλεία διαχειριστή (κατάσταση, ξεκλείδωμα, προσωρινός κωδικός, νέος χρήστης)
   - push-send:    δοκιμαστική ειδοποίηση στις συσκευές μου (τις κανονικές τις στέλνει η ίδια η βάση κάθε λεπτό)
   Μόνο μεταφορά: στέλνει και φέρνει την απάντηση όπως είναι. Τι σημαίνει κάθε απάντηση το αποφασίζει το session.js.
   Λάθος δικτύου → πετάει λάθος· λάθος του server → { error: 'κωδικός' }. */
window.PL_SUPA_API = function (sb) {
  async function call(name, body, signed) {
    const headers = {};
    if (signed) {   // με το κλειδί της συνεδρίας μου (ο server ελέγχει ποιος είμαι)
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return { error: 'auth' };
      headers.Authorization = 'Bearer ' + session.access_token;
    }
    const { data, error } = await sb.functions.invoke(name, { body, headers });
    if (error) throw error;
    return data || {};
  }
  return {
    login: (email, password) => call('login', { email, password }, false),
    setPassword: (password) => call('account', { password }, true),
    admin: (action, extra) => call('admin-users', Object.assign({ action }, extra || {}), true),
    pushTest: () => call('push-send', { action: 'test' }, true),
  };
};

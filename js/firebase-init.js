/**
 * MINEXUS TV — FIREBASE CORE (Auth + Realtime Database)
 * Compat SDK used for simple <script> tag loading (no bundler required)
 */

// ---- Firebase Config (MINEXUS TV project) ----
const firebaseConfig = {
  apiKey: "AIzaSyCe9EAy36fx3RHy_cHOKP9BG8F_zkkTd4c",
  authDomain: "minexustv-a23ba.firebaseapp.com",
  databaseURL: "https://minexustv-a23ba-default-rtdb.firebaseio.com",
  projectId: "minexustv-a23ba",
  storageBucket: "minexustv-a23ba.firebasestorage.app",
  messagingSenderId: "33081080111",
  appId: "1:33081080111:web:cd23b4fe22c0b7c18e09da",
  measurementId: "G-CRYG4T0FDT"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();
try { firebase.analytics(); } catch (e) { /* analytics may be blocked, non-critical */ }

const googleProvider = new firebase.auth.GoogleAuthProvider();

/* ==========================================================================
   AUTH STATE MANAGEMENT
   ========================================================================== */
const MinexusAuth = {
  currentUser: null,
  _readyResolvers: [],

  ready() {
    return new Promise((resolve) => {
      if (this.currentUser !== null) return resolve(this.currentUser);
      this._readyResolvers.push(resolve);
    });
  },

  init(onChangeCallback) {
    auth.onAuthStateChanged(async (user) => {
      this.currentUser = user || false; // false = confirmed signed-out (vs null = unknown)
      if (user) {
        await this._ensureUserProfile(user);
      }
      this._readyResolvers.forEach(r => r(this.currentUser));
      this._readyResolvers = [];
      if (typeof onChangeCallback === 'function') onChangeCallback(user);
    });
  },

  async _ensureUserProfile(user) {
    const ref = db.ref(`users/${user.uid}/profile`);
    const snap = await ref.once('value');
    if (!snap.exists()) {
      await ref.set({
        displayName: user.displayName || user.email.split('@')[0],
        email: user.email,
        photoURL: user.photoURL || '',
        joinedAt: firebase.database.ServerValue.TIMESTAMP,
        watchCount: 0
      });
    } else {
      // Keep display name / photo fresh (e.g. Google profile updates)
      await ref.update({
        displayName: user.displayName || snap.val().displayName,
        photoURL: user.photoURL || snap.val().photoURL || ''
      });
    }
  },

  async signUpWithEmail(email, password, displayName) {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    if (displayName) {
      await cred.user.updateProfile({ displayName });
    }
    await this._ensureUserProfile({ ...cred.user, displayName });
    return cred.user;
  },

  async signInWithEmail(email, password) {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    return cred.user;
  },

  async signInWithGoogle() {
    const cred = await auth.signInWithPopup(googleProvider);
    return cred.user;
  },

  async sendPasswordReset(email) {
    await auth.sendPasswordResetEmail(email);
  },

  async signOut() {
    await auth.signOut();
  },

  isLoggedIn() {
    return !!this.currentUser;
  }
};

/* ==========================================================================
   FRIENDLY ERROR MESSAGES (Firebase Auth error codes → readable text)
   ========================================================================== */
function friendlyAuthError(err) {
  const code = err && err.code ? err.code : '';
  const map = {
    'auth/email-already-in-use': 'Ye email pehle se registered hai. Login try karein.',
    'auth/invalid-email': 'Email address sahi format mein nahi hai.',
    'auth/weak-password': 'Password kam se kam 6 characters ka hona chahiye.',
    'auth/user-not-found': 'Is email se koi account nahi mila.',
    'auth/wrong-password': 'Password galat hai.',
    'auth/invalid-credential': 'Email ya password galat hai.',
    'auth/too-many-requests': 'Bohat zyada attempts ho gaye. Thori dair baad try karein.',
    'auth/popup-closed-by-user': 'Google login popup band ho gaya.',
    'auth/network-request-failed': 'Internet connection check karein.',
    'auth/user-disabled': 'Ye account disable kar diya gaya hai.'
  };
  return map[code] || (err && err.message) || 'Kuch ghalat ho gaya. Dobara koshish karein.';
}

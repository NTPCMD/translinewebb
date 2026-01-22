const KEY = 'transline.portal.localAuth';
const SUPABASE_TOKEN_KEY = 'supabase.auth.token';

export function isLocalAuthed() {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch (error) {
    console.error('Local auth read failed', error);
    return false;
  }
}

export function localLogin(username: string, password: string) {
  if (username === 'admin' && password === 'admin') {
    try {
      localStorage.setItem(KEY, '1');
    } catch (error) {
      console.error('Local auth write failed', error);
    }
    return true;
  }
  return false;
}

export function localLogout() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(SUPABASE_TOKEN_KEY);

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Local auth cleanup failed', error);
  }
}

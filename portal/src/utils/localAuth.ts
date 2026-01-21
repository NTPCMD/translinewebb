const KEY = 'transline.portal.localAuth';

export function isLocalAuthed() {
  return localStorage.getItem(KEY) === '1';
}

export function localLogin(username: string, password: string) {
  if (username === 'admin' && password === 'admin') {
    localStorage.setItem(KEY, '1');
    return true;
  }
  return false;
}

export function localLogout() {
  localStorage.removeItem(KEY);
}

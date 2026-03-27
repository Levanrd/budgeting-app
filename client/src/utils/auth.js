import { getMe } from '../api/auth';

const USER_STORAGE_KEY = 'user';
let sessionPromise = null;

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  localStorage.removeItem(USER_STORAGE_KEY);
}

export async function ensureSessionUser() {
  if (sessionPromise) {
    return sessionPromise;
  }

  sessionPromise = getMe()
    .then(({ data }) => {
      if (data?.user) {
        setStoredUser(data.user);
        return data.user;
      }
      return null;
    })
    .catch(() => {
      clearStoredUser();
      return null;
    })
    .finally(() => {
      sessionPromise = null;
    });

  return sessionPromise;
}

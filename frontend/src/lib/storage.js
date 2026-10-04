/**
 * In-memory access token store.
 *
 * The access token lives here, NOT in localStorage — XSS can read localStorage.
 * On a hard refresh this value is lost, but the HttpOnly refresh cookie
 * silently restores it on app boot.
 */
let accessToken = null;

export const getAccessToken  = () => accessToken;
export const setAccessToken  = (token) => { accessToken = token; };
export const clearAccessToken = () => { accessToken = null; };

/**
 * Utility to get the correct redirect URL for Supabase Auth
 * handles local development, mobile testing via IP, and production
 */
export const getAuthRedirectUrl = () => {
  // Use the current origin
  let url = window.location.origin;
  
  // Supabase is extremely strict about the trailing slash.
  // If the dashboard has it, the request must have it.
  // We'll return the origin with a trailing slash to match the user's dashboard screenshot.
  if (!url.endsWith('/')) {
    url += '/';
  }
  
  console.log('🔗 Auth Redirect URL (Matched with Dashboard):', url);
  return url;
};

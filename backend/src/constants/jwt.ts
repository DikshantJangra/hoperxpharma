// JWT & Cookie Settings
export const JWT = {
  ACCESS_TOKEN_EXPIRATION: '1h',   // How long a user's login is valid
  REFRESH_TOKEN_EXPIRATION: '7d',  // How long a user can be "remembered"
  AUTH_COOKIE_NAME: 'hoperx_auth', // Cookie name for storing JWT
} as const;

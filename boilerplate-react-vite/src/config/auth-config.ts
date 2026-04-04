import { env } from './env'

export const msalConfig = {
  auth: {
    clientId: env.ENTRA_CLIENT_ID,
    authority: env.ENTRA_AUTHORITY,
    redirectUri: globalThis.location?.origin ?? ''
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false
  }
}

export const loginRequest = {
  scopes: []
}

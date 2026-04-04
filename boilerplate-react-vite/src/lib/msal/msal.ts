import { PublicClientApplication } from '@azure/msal-browser'
import { msalConfig } from '@/config/auth-config'

export const msalInstance = new PublicClientApplication(msalConfig)

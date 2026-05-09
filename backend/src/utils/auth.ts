import type { HttpRequest } from '@azure/functions'
import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'
import { getContainer } from '../cosmos/client'

const TENANT = process.env.AZURE_CIAM_TENANT_SUBDOMAIN ?? ''
const CLIENT_ID = process.env.AZURE_CIAM_CLIENT_ID ?? ''

console.log(
  'auth module loaded — TENANT:',
  TENANT || '(empty)',
  'CLIENT_ID:',
  CLIENT_ID || '(empty)'
)

const client = jwksClient({
  jwksUri: `https://${TENANT}.ciamlogin.com/${TENANT}/discovery/v2.0/keys`,
  cache: true,
  rateLimit: true,
})

function getSigningKey(header: jwt.JwtHeader): Promise<string> {
  return new Promise((resolve, reject) => {
    client.getSigningKey(header.kid, (err, key) => {
      if (err || !key) {
        console.error('auth: getSigningKey failed', err)
        return reject(err ?? new Error('No signing key'))
      }
      resolve(key.getPublicKey())
    })
  })
}

export interface AuthUser {
  userId: string
  email?: string
}

export async function getAuthUser(req: HttpRequest): Promise<AuthUser | null> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    console.error('auth: no Bearer token in request')
    return null
  }

  const token = authHeader.slice(7)

  try {
    const decoded = jwt.decode(token, { complete: true })
    if (!decoded) {
      console.error('auth: jwt.decode returned null')
      return null
    }

    console.log('auth: token decoded, kid:', decoded.header.kid)
    console.log('auth: token aud:', (decoded.payload as jwt.JwtPayload).aud)
    console.log('auth: token iss:', (decoded.payload as jwt.JwtPayload).iss)
    console.log('auth: expected aud:', CLIENT_ID)
    console.log('auth: expected iss:', `https://${TENANT}.ciamlogin.com/${TENANT}/v2.0`)

    const signingKey = await getSigningKey(decoded.header)
    console.log('auth: signing key retrieved')

    const payload = jwt.verify(token, signingKey, {
      audience: CLIENT_ID,
      issuer: `https://${TENANT}.ciamlogin.com/${TENANT}/v2.0`,
    }) as jwt.JwtPayload

    console.log('auth: token verified')

    const userId = payload.oid ?? payload.sub
    if (!userId) return null
    console.log('auth: success, userId:', userId)

    const email = payload.email ?? payload.preferred_username ?? ''
    const name = payload.name ?? ''

    const container = getContainer()
    await container.items.upsert({
      id: userId,
      userId: userId,
      type: 'user',
      email,
      name,
      updatedAt: new Date().toISOString(),
    })

    return { userId, email }
  } catch (err) {
    console.error('auth: verification failed:', err instanceof Error ? err.message : String(err))
    return null
  }
}

export function unauthorizedResponse() {
  return { status: 401, jsonBody: { error: 'Unauthorized' } }
}

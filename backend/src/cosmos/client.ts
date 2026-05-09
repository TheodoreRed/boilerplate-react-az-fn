import { CosmosClient, type Container, type Database } from '@azure/cosmos'

let client: CosmosClient | null = null
let database: Database | null = null

function getClient(): CosmosClient {
  if (client) return client

  const endpoint = process.env.COSMOS_ENDPOINT
  const key = process.env.COSMOS_KEY

  if (!endpoint || !key) {
    throw new Error('COSMOS_ENDPOINT and COSMOS_KEY must be set')
  }

  client = new CosmosClient({ endpoint, key })
  return client
}

function getDatabase(): Database {
  if (database) return database

  const dbName = process.env.COSMOS_DB_NAME
  if (!dbName) throw new Error('COSMOS_DB_NAME must be set')

  database = getClient().database(dbName)
  return database
}

export function getContainer(containerName = 'app'): Container {
  return getDatabase().container(containerName)
}

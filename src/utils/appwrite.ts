import { Client, Databases, Account, ID } from 'appwrite';

// Appwrite configuration
const PROJECT_ID = '684590a6001648f0c3d1';
const ENDPOINT = 'https://syd.cloud.appwrite.io/v1';
const DATABASE_ID = 'songbuilder-db';
const SONGS_COLLECTION_ID = 'songs';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID);

// Initialize services
export const databases = new Databases(client);
export const account = new Account(client);

// Database and collection IDs
export const config = {
  databaseId: DATABASE_ID,
  songsCollectionId: SONGS_COLLECTION_ID,
};

// Generate unique ID
export const generateId = () => ID.unique();

export default client;
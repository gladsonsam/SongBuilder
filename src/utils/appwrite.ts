import { Client, Databases, Account, ID } from 'appwrite';

// Appwrite configuration from environment variables
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'songbuilder-db';
const SONGS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_SONGS_COLLECTION_ID || 'songs';

// Validate required environment variables
if (!PROJECT_ID) {
  throw new Error('VITE_APPWRITE_PROJECT_ID environment variable is required');
}
if (!ENDPOINT) {
  throw new Error('VITE_APPWRITE_ENDPOINT environment variable is required');
}

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
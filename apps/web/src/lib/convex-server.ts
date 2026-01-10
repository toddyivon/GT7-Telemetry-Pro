import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';

// Create a Convex HTTP client for server-side API routes
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  console.warn('NEXT_PUBLIC_CONVEX_URL is not set. Using mock mode.');
}

// Create the HTTP client
export const convexClient = convexUrl ? new ConvexHttpClient(convexUrl) : null;

// Export the api for type-safe queries/mutations
export { api };

// Helper function to safely call Convex queries
export async function queryConvex<T>(
  queryFn: Parameters<typeof convexClient.query>[0],
  args: Parameters<typeof convexClient.query>[1]
): Promise<T | null> {
  if (!convexClient) {
    console.warn('Convex client not available, returning null');
    return null;
  }

  try {
    return await convexClient.query(queryFn, args) as T;
  } catch (error) {
    console.error('Convex query error:', error);
    throw error;
  }
}

// Helper function to safely call Convex mutations
export async function mutateConvex<T>(
  mutationFn: Parameters<typeof convexClient.mutation>[0],
  args: Parameters<typeof convexClient.mutation>[1]
): Promise<T | null> {
  if (!convexClient) {
    console.warn('Convex client not available, returning null');
    return null;
  }

  try {
    return await convexClient.mutation(mutationFn, args) as T;
  } catch (error) {
    console.error('Convex mutation error:', error);
    throw error;
  }
}

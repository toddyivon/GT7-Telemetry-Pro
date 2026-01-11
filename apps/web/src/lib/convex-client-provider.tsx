'use client';

import { ReactNode } from 'react';

// Check if Convex URL is configured
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

// Only import and use Convex if URL is configured
let ConvexProviderComponent: React.ComponentType<{ children: ReactNode }> | null = null;

if (convexUrl) {
  // Dynamic import would be better, but for simplicity we'll check at runtime
  try {
    const { ConvexProvider } = require('convex/react');
    const { ConvexHttpClient } = require('convex/browser');
    const convex = new ConvexHttpClient(convexUrl);
    ConvexProviderComponent = ({ children }: { children: ReactNode }) => (
      <ConvexProvider client={convex}>{children}</ConvexProvider>
    );
  } catch (e) {
    console.log('Convex not available, running in mock mode');
  }
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  // If Convex is not configured, just render children directly
  if (!ConvexProviderComponent) {
    return <>{children}</>;
  }
  return <ConvexProviderComponent>{children}</ConvexProviderComponent>;
}

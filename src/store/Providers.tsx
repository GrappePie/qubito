// Providers.tsx - wraps app with Redux Provider
"use client";
import { Provider } from 'react-redux';
import { store } from './store';
import { EntitlementsProvider } from "@/contexts/EntitlementsContext";
import React from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <EntitlementsProvider>
        {children}
      </EntitlementsProvider>
    </Provider>
  );
}


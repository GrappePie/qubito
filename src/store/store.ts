// store.ts - configures Redux store
"use client";
import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './slices/cartSlice';
import { productsApi } from './slices/productsApi';
import { inventoryApi } from './slices/inventoryApi';
import { notificationsApi } from './slices/notificationsApi';
import { categoriesApi } from './slices/categoriesApi';
import { ordersApi } from './slices/ordersApi';
import { accountsApi } from './slices/accountsApi';
import { cashCloseApi } from './slices/cashCloseApi';
import { cashRegisterApi } from './slices/cashRegisterApi';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    [productsApi.reducerPath]: productsApi.reducer,
    [inventoryApi.reducerPath]: inventoryApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
    [categoriesApi.reducerPath]: categoriesApi.reducer,
    [ordersApi.reducerPath]: ordersApi.reducer,
    [accountsApi.reducerPath]: accountsApi.reducer,
    [cashCloseApi.reducerPath]: cashCloseApi.reducer,
    [cashRegisterApi.reducerPath]: cashRegisterApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(productsApi.middleware)
      .concat(inventoryApi.middleware)
      .concat(notificationsApi.middleware)
      .concat(categoriesApi.middleware)
      .concat(ordersApi.middleware)
      .concat(accountsApi.middleware)
      .concat(cashCloseApi.middleware)
      .concat(cashRegisterApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

"use client";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { CheckoutSummary } from "@/types/checkout";

export interface OrderItemDTO {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  sku?: string;
  stock?: number;
}

export interface OrderDTO {
  _id?: string;
  contextId: string;
  mode: "table" | "quick";
  tableNumber?: number | null;
  status: "pending" | "completed";
  items: OrderItemDTO[];
  subtotal: number;
  tax: number;
  total: number;
  customerName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaveOrderPayload {
  contextId: string;
  mode: "table" | "quick";
  tableNumber?: number | null;
  items: OrderItemDTO[];
  subtotal: number;
  tax: number;
  total: number;
  customerName?: string;
}

export interface CheckoutOrderPayload {
  contextId: string;
  mode: "table" | "quick";
  tableNumber?: number | null;
  items: OrderItemDTO[];
  amounts: {
    subtotal: number;
    tax: number;
    total: number;
  };
  summary: CheckoutSummary;
}

export interface TicketDTO {
  _id: string;
  orderContext: "table" | "quick";
  tableNumber?: number | null;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  payments: {
    cash: number;
    card: number;
    change: number;
    paid: number;
  };
  splitCount?: number;
  customerName?: string;
  products: Array<{
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
    sku?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export const ordersApi = createApi({
  reducerPath: "ordersApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Orders", "Order"],
  endpoints: (builder) => ({
    getOrder: builder.query<OrderDTO | null, string>({
      query: (contextId) => ({
        url: `orders/${encodeURIComponent(contextId)}`,
        method: "GET",
      }),
      providesTags: (_result, _error, contextId) => [
        { type: "Order" as const, id: contextId },
      ],
    }),
    saveOrder: builder.mutation<OrderDTO, SaveOrderPayload>({
      query: ({ contextId, ...body }) => ({
        url: `orders/${encodeURIComponent(contextId)}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { contextId }) => [
        { type: "Order" as const, id: contextId },
        { type: "Orders" as const, id: "LIST" },
      ],
    }),
  checkoutOrder: builder.mutation<TicketDTO, CheckoutOrderPayload>({
      query: ({ contextId, ...body }) => ({
        url: `orders/${encodeURIComponent(contextId)}/checkout`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { contextId }) => [
        { type: "Order" as const, id: contextId },
        { type: "Orders" as const, id: "LIST" },
      ],
    }),
    deleteOrder: builder.mutation<{ success: boolean }, string>({
      query: (contextId) => ({
        url: `orders/${encodeURIComponent(contextId)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, contextId) => [
        { type: "Order" as const, id: contextId },
        { type: "Orders" as const, id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetOrderQuery,
  useSaveOrderMutation,
  useCheckoutOrderMutation,
  useDeleteOrderMutation,
} = ordersApi;

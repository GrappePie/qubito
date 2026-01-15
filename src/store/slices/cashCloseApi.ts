"use client";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface CashCloseTicket {
  id: string;
  orderContext: "table" | "quick";
  tableNumber?: number | null;
  customerName?: string | null;
  createdBy?: string | null;
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
  itemsCount: number;
  createdAt: string | null;
}

export interface CashCloseSummary {
  range: { from: string; to: string };
  totals: {
    tickets: number;
    items: number;
    subtotal: number;
    tax: number;
    tip: number;
    total: number;
    cash: number;
    card: number;
    change: number;
    paid: number;
  };
  tickets: CashCloseTicket[];
}

export type CashCloseQuery = {
  from?: string;
  to?: string;
};

export const cashCloseApi = createApi({
  reducerPath: "cashCloseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    prepareHeaders: (headers) => {
      if (typeof window !== "undefined") {
        const t = window.localStorage.getItem("qubito_tenant");
        const sub = window.localStorage.getItem("qubito_sub");
        if (t) headers.set("x-tenant-id", t);
        if (sub) headers.set("x-user-sub", sub);
      }
      return headers;
    },
  }),
  tagTypes: ["CashClose"],
  endpoints: (builder) => ({
    getCashCloseSummary: builder.query<CashCloseSummary, CashCloseQuery | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.from) searchParams.set("from", params.from);
        if (params?.to) searchParams.set("to", params.to);
        const queryString = searchParams.toString();
        return {
          url: `cash-close${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["CashClose"],
    }),
  }),
});

export const { useGetCashCloseSummaryQuery } = cashCloseApi;

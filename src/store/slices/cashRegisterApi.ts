"use client";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type CashRegisterSession = {
  id: string;
  status: "open" | "closed";
  openedAt: string;
  closedAt: string | null;
  openingAmount: number;
  closingAmount: number | null;
  expectedCash: number | null;
  discrepancy: number | null;
  openedBy: string | null;
  closedBy: string | null;
  notes: string | null;
};

export type CashRegisterStatus = {
  open: boolean;
  session: CashRegisterSession | null;
  expectedCash?: number;
  netCash?: number;
  ticketCount?: number;
};

export type OpenCashRegisterPayload = {
  openingAmount: number;
  notes?: string;
};

export type CloseCashRegisterPayload = {
  closingAmount?: number;
  notes?: string;
};

export const cashRegisterApi = createApi({
  reducerPath: "cashRegisterApi",
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
  tagTypes: ["CashRegister"],
  endpoints: (builder) => ({
    getCashRegisterStatus: builder.query<CashRegisterStatus, void>({
      query: () => ({ url: "cash-register", method: "GET" }),
      providesTags: ["CashRegister"],
    }),
    openCashRegister: builder.mutation<CashRegisterStatus, OpenCashRegisterPayload>({
      query: (body) => ({ url: "cash-register/open", method: "POST", body }),
      invalidatesTags: ["CashRegister"],
    }),
    closeCashRegister: builder.mutation<CashRegisterStatus, CloseCashRegisterPayload>({
      query: (body) => ({ url: "cash-register/close", method: "POST", body }),
      invalidatesTags: ["CashRegister"],
    }),
  }),
});

export const {
  useGetCashRegisterStatusQuery,
  useOpenCashRegisterMutation,
  useCloseCashRegisterMutation,
} = cashRegisterApi;

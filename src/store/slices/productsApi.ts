// productsApi.ts - RTK Query API slice para Productos
"use client";
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Tipado de producto según uso en el cliente (Mongoose devuelve _id)
export interface ProductDTO {
  _id?: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  stock: number;
  lowStock: number;
  categories: string[];
  imageUrl: string;
  // Campos adicionales que el backend espera
  barCode?: string;
  description?: string;
  owner?: string;
  supplier?: string;
  variants?: Array<{ type: string; productIds: string[] }>
}

// Payload para crear/actualizar (incluye "category" para que el backend la convierta a array)
export type UpsertProductPayload = ProductDTO & { category?: string };

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers) => {
      if (typeof window !== 'undefined') {
        const t = window.localStorage.getItem('qubito_tenant');
        const sub = window.localStorage.getItem('qubito_sub');
        if (t) headers.set('x-tenant-id', t);
        if (sub) headers.set('x-user-sub', sub);
      }
      return headers;
    },
  }),
  tagTypes: ['Products', 'Product'],
  endpoints: (builder) => ({
    getProducts: builder.query<ProductDTO[], void>({
      query: () => ({ url: 'products', method: 'GET' }),
      providesTags: (result) =>
        result
          ? [
              ...result
                .filter((p) => Boolean(p._id))
                .map((p) => ({ type: 'Product' as const, id: p._id! })),
              { type: 'Products', id: 'LIST' },
            ]
          : [{ type: 'Products', id: 'LIST' }],
    }),
    createProduct: builder.mutation<ProductDTO, UpsertProductPayload>({
      query: (body) => ({ url: 'products', method: 'POST', body }),
      invalidatesTags: [{ type: 'Products', id: 'LIST' }],
    }),
    updateProduct: builder.mutation<ProductDTO, { id: string; data: UpsertProductPayload }>({
      query: ({ id, data }) => ({ url: `products/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Product', id: arg.id },
        { type: 'Products', id: 'LIST' },
      ],
    }),
    deleteProduct: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `products/${id}`, method: 'DELETE' }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'Product', id },
        { type: 'Products', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productsApi;


"use client";
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface CategoryDTO {
  _id: string;
  categoryId: string;
  name: string;
  description: string;
  imageUrl: string;
  parentCategoryId?: string | null;
  isActive: boolean;
}

export type CreateCategoryPayload = {
  name: string;
  description?: string;
  imageUrl?: string;
  parentCategoryId?: string | null;
};

export type UpdateCategoryPayload = Partial<CreateCategoryPayload> & { isActive?: boolean };

export const categoriesApi = createApi({
  reducerPath: 'categoriesApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Categories', 'Category'],
  endpoints: (builder) => ({
    getCategories: builder.query<CategoryDTO[], void>({
      query: () => ({ url: 'categories', method: 'GET' }),
      providesTags: (result) => result
        ? [
            ...result.map((c) => ({ type: 'Category' as const, id: c._id })),
            { type: 'Categories', id: 'LIST' },
          ]
        : [{ type: 'Categories', id: 'LIST' }],
    }),
    createCategory: builder.mutation<CategoryDTO, CreateCategoryPayload>({
      query: (body) => ({ url: 'categories', method: 'POST', body }),
      invalidatesTags: [{ type: 'Categories', id: 'LIST' }],
    }),
    updateCategory: builder.mutation<CategoryDTO, { id: string; data: UpdateCategoryPayload }>({
      query: ({ id, data }) => ({ url: `categories/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Category', id: arg.id },
        { type: 'Categories', id: 'LIST' },
      ],
    }),
    deleteCategory: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `categories/${id}`, method: 'DELETE' }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'Category', id },
        { type: 'Categories', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;


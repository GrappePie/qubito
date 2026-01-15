"use client";
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export type PermissionDef = {
  code: string;
  label: string;
  description: string;
  area: string;
};

export type RoleDTO = {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  isAdmin: boolean;
};

export type AccountDTO = {
  id: string;
  tenantId: string;
  userId: string;
  displayName: string | null;
  email: string | null;
  roleId: string | null;
  roleName: string | null;
  isAdmin: boolean;
  permissions: string[];
};

export type AccountsResponse = {
  accounts: AccountDTO[];
  roles: RoleDTO[];
  availablePermissions: PermissionDef[];
};

export type RolesResponse = {
  roles: RoleDTO[];
  availablePermissions: PermissionDef[];
};

export type BootstrapResponse = {
  tenantId: string;
  hasAdmin?: boolean;
  needsBootstrap?: boolean;
  currentAccount?: AccountDTO | null;
  account?: AccountDTO;
  role?: RoleDTO;
  ok?: boolean;
  availablePermissions: PermissionDef[];
};

export const accountsApi = createApi({
  reducerPath: 'accountsApi',
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
  tagTypes: ['Accounts', 'Account', 'Roles', 'Role', 'Bootstrap'],
  endpoints: (builder) => ({
    getBootstrapStatus: builder.query<BootstrapResponse, void>({
      query: () => ({ url: 'accounts/bootstrap', method: 'GET' }),
      providesTags: [{ type: 'Bootstrap', id: 'BOOTSTRAP' }],
    }),
    createBootstrapAdmin: builder.mutation<
      BootstrapResponse,
      { displayName?: string; email?: string; password?: string }
    >({
      query: (body) => ({ url: 'accounts/bootstrap', method: 'POST', body }),
      invalidatesTags: [
        { type: 'Bootstrap', id: 'BOOTSTRAP' },
        { type: 'Accounts', id: 'LIST' },
        { type: 'Roles', id: 'LIST' },
      ],
    }),
    getAccounts: builder.query<AccountsResponse, void>({
      query: () => ({ url: 'accounts', method: 'GET' }),
      providesTags: (result) =>
        result
          ? [
              { type: 'Accounts', id: 'LIST' },
              ...result.accounts.map((a) => ({ type: 'Account' as const, id: a.id })),
            ]
          : [{ type: 'Accounts', id: 'LIST' }],
    }),
    createAccount: builder.mutation<AccountDTO, Partial<AccountDTO> & { roleId: string; password: string }>({
      query: (body) => ({ url: 'accounts', method: 'POST', body }),
      transformResponse: (response: { account: AccountDTO }) => response.account,
      invalidatesTags: [{ type: 'Accounts', id: 'LIST' }],
    }),
    updateAccount: builder.mutation<
      AccountDTO,
      { id: string; data: Partial<AccountDTO> & { roleId?: string; password?: string } }
    >({
      query: ({ id, data }) => ({
        url: `accounts/${id}`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (response: { account: AccountDTO }) => response.account,
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Account', id: arg.id },
        { type: 'Accounts', id: 'LIST' },
      ],
    }),
    deleteAccount: builder.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `accounts/${id}`, method: 'DELETE' }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'Account', id },
        { type: 'Accounts', id: 'LIST' },
      ],
    }),
    getRoles: builder.query<RolesResponse, void>({
      query: () => ({ url: 'roles', method: 'GET' }),
      providesTags: (result) =>
        result
          ? [
              { type: 'Roles', id: 'LIST' },
              ...result.roles.map((r) => ({ type: 'Role' as const, id: r.id })),
            ]
          : [{ type: 'Roles', id: 'LIST' }],
    }),
    createRole: builder.mutation<RoleDTO, Partial<RoleDTO> & { permissions: string[] }>({
      query: (body) => ({ url: 'roles', method: 'POST', body }),
      transformResponse: (response: { role: RoleDTO }) => response.role,
      invalidatesTags: [{ type: 'Roles', id: 'LIST' }],
    }),
    updateRole: builder.mutation<
      RoleDTO,
      { id: string; data: Partial<RoleDTO> & { permissions?: string[] } }
    >({
      query: ({ id, data }) => ({ url: `roles/${id}`, method: 'PATCH', body: data }),
      transformResponse: (response: { role: RoleDTO }) => response.role,
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Role', id: arg.id },
        { type: 'Roles', id: 'LIST' },
      ],
    }),
    deleteRole: builder.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `roles/${id}`, method: 'DELETE' }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'Role', id },
        { type: 'Roles', id: 'LIST' },
        { type: 'Accounts', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetBootstrapStatusQuery,
  useCreateBootstrapAdminMutation,
  useGetAccountsQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} = accountsApi;

"use client";
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface NotificationDTO {
  _id?: string;
  type: 'email' | 'sms' | 'whatsapp';
  address: string;
  enabled: boolean;
  trigger: 'low_stock' | 'out_of_stock' | 'new_product';
}

export const notificationsApi = createApi({
  reducerPath: 'notificationsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Notifications', 'Notification'],
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationDTO[], void>({
      query: () => ({ url: 'notifications' }),
      providesTags: (res) =>
        res
          ? [
              ...res
                .filter((n) => n._id)
                .map((n) => ({ type: 'Notification' as const, id: n._id! })),
              { type: 'Notifications', id: 'LIST' },
            ]
          : [{ type: 'Notifications', id: 'LIST' }],
    }),
    addNotification: builder.mutation<NotificationDTO, Omit<NotificationDTO, '_id'>>({
      query: (body) => ({ url: 'notifications', method: 'POST', body }),
      invalidatesTags: [{ type: 'Notifications', id: 'LIST' }],
    }),
    updateNotification: builder.mutation<NotificationDTO, { id: string; changes: Partial<NotificationDTO> }>({
      query: ({ id, changes }) => ({ url: `notifications?id=${id}`, method: 'PUT', body: changes }),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Notification', id: arg.id },
        { type: 'Notifications', id: 'LIST' },
      ],
    }),
    deleteNotification: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `notifications?id=${id}`, method: 'DELETE' }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'Notification', id },
        { type: 'Notifications', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useAddNotificationMutation,
  useUpdateNotificationMutation,
  useDeleteNotificationMutation,
} = notificationsApi;

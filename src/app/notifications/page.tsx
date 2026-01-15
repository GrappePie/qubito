'use client';
import React, {JSX, useState} from 'react';
import { Mail, MessageCircle, PhoneCall } from 'lucide-react';
import {
    useGetNotificationsQuery,
    useAddNotificationMutation,
    useUpdateNotificationMutation,
    useDeleteNotificationMutation,
    type NotificationDTO,
} from '@/store/slices/notificationsApi';
import { toast } from 'react-hot-toast';
import PermissionGate from '@/components/PermissionGate';

const iconMap: Record<NotificationDTO['type'], JSX.Element> = {
    email: <Mail size={18} />,
    sms: <PhoneCall size={18} />,
    whatsapp: <MessageCircle size={18} />,
};

function NotificationsContent() {
    const { data: notifications = [], isLoading } = useGetNotificationsQuery();
    const [addNotification, { isLoading: isAdding }] = useAddNotificationMutation();
    const [updateNotification, { isLoading: isUpdating }] = useUpdateNotificationMutation();
    const [deleteNotification, { isLoading: isDeleting }] = useDeleteNotificationMutation();

    const [type, setType] = useState<NotificationDTO['type']>('email');
    const [address, setAddress] = useState('');
    const [trigger, setTrigger] = useState<NotificationDTO['trigger']>('low_stock');
    const [editModal, setEditModal] = useState<{ open: boolean, notification: NotificationDTO | null }>({ open: false, notification: null });
    const [editForm, setEditForm] = useState<NotificationDTO>({ type: 'email', address: '', trigger: 'low_stock', enabled: true });

    const handleAddNotification = async () => {
        try {
            await addNotification({ type, address, enabled: true, trigger }).unwrap();
            setAddress('');
            setTrigger('low_stock');
            toast.success('Notificación creada');
        } catch (e) {
            console.error(e);
            toast.error('No se pudo crear la notificación');
        }
    };

    const openEditModal = (notification: NotificationDTO) => {
        setEditForm({
            type: notification.type,
            address: notification.address,
            trigger: notification.trigger,
            enabled: notification.enabled,
        });
        setEditModal({ open: true, notification });
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type: inputType } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: inputType === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        } as NotificationDTO));
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editModal.notification || !editModal.notification._id) return;
        try {
            await updateNotification({ id: editModal.notification._id, changes: editForm }).unwrap();
            setEditModal({ open: false, notification: null });
            toast.success('Notificación actualizada');
        } catch (err) {
            console.error(err);
            toast.error('No se pudo actualizar la notificación');
        }
    };

    return (
        <>
            <div>
                <h1 className="text-3xl font-bold mb-6">Notifications</h1>
                <form className="flex gap-4 mb-4" onSubmit={(e) => { e.preventDefault(); handleAddNotification(); }}>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value as NotificationDTO['type'])}
                        className="px-4 py-2 rounded border bg-white dark:bg-[#18181b]"
                    >
                        <option value="email">Email</option>
                        <option value="sms">SMS</option>
                        <option value="whatsapp">WhatsApp</option>
                    </select>
                    <select
                        value={trigger}
                        onChange={e => setTrigger(e.target.value as NotificationDTO['trigger'])}
                        className="px-4 py-2 rounded border bg-white dark:bg-[#18181b]"
                        style={{ minWidth: 160 }}
                    >
                        <option value="low_stock">Bajo stock</option>
                        <option value="out_of_stock">Agotado</option>
                        <option value="new_product">Nuevo producto</option>
                    </select>
                    <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Address"
                        className="px-4 py-2 rounded text-black border"
                    />
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded"
                        disabled={isAdding}
                    >
                        Add Notification
                    </button>
                </form>
                <table className="w-full border-collapse bg-white rounded shadow">
                    <thead>
                        <tr className="bg-gray-100 text-left text-black">
                            <th className="p-3">Type</th>
                            <th className="p-3">Trigger</th>
                            <th className="p-3">Address</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td className="p-3" colSpan={5}>Cargando...</td></tr>
                        ) : notifications.map((n) => (
                            <tr key={n._id} className="border-t text-black">
                                <td className="p-3 flex items-center gap-2">{iconMap[n.type] || '🔔'} {n.type}</td>
                                <td className="p-3">{n.trigger}</td>
                                <td className="p-3">{n.address}</td>
                                <td className="p-3">
                                    <input type="checkbox" className="toggle" checked={n.enabled} readOnly />
                                </td>
                                <td className="p-3 flex gap-2">
                                    <>
                                        <button type="button" className="px-3 py-1 rounded bg-yellow-400 text-black" onClick={() => openEditModal(n)}>Editar</button>
                                        <button type="button" className="px-3 py-1 rounded bg-red-500 text-white" onClick={async () => {
                                            if (!n._id) return;
                                            try {
                                                await deleteNotification(n._id).unwrap();
                                                toast.success('Notificación eliminada');
                                            } catch (e) {
                                                console.error(e);
                                                toast.error('No se pudo eliminar la notificación');
                                            }
                                        }} disabled={isDeleting}>Eliminar</button>
                                    </>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {editModal.open && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 className="text-xl font-bold mb-4">Editar notificación</h2>
                        <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
                            <select
                                name="type"
                                value={editForm.type}
                                onChange={handleEditChange}
                                className="px-4 py-2 rounded border"
                                required
                            >
                                <option value="email">Email</option>
                                <option value="sms">SMS</option>
                                <option value="whatsapp">WhatsApp</option>
                            </select>
                            <select
                                name="trigger"
                                value={editForm.trigger}
                                onChange={handleEditChange}
                                className="px-4 py-2 rounded border bg-white dark:bg-[#18181b]"
                                style={{ minWidth: 160 }}
                                required
                            >
                                <option value="low_stock">Bajo stock</option>
                                <option value="out_of_stock">Agotado</option>
                                <option value="new_product">Nuevo producto</option>
                            </select>
                            <input
                                name="address"
                                type="text"
                                value={editForm.address}
                                onChange={handleEditChange}
                                placeholder="Address"
                                className="px-4 py-2 rounded border"
                                required
                            />
                            <label className="flex items-center gap-2">
                                <input
                                    name="enabled"
                                    type="checkbox"
                                    checked={editForm.enabled}
                                    onChange={handleEditChange}
                                />
                                Habilitada
                            </label>
                            <div className="flex gap-2 justify-end">
                                <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={() => setEditModal({ open: false, notification: null })}>Cancelar</button>
                                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white" disabled={isUpdating}>Guardar cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default function NotificationsPage() {
    return (
        <PermissionGate permission="notifications.view" redirectTo="/">
            <NotificationsContent />
        </PermissionGate>
    );
}

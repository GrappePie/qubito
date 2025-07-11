'use client';
import React, {JSX, useEffect, useState} from 'react';
import { Mail, MessageCircle, PhoneCall } from 'lucide-react';

interface Notification {
    _id: string;
    type: 'email' | 'sms' | 'whatsapp';
    address: string;
    enabled: boolean;
    trigger: 'low_stock' | 'out_of_stock' | 'new_product';
}

const iconMap: Record<Notification['type'], JSX.Element> = {
    email: <Mail size={18} />,
    sms: <PhoneCall size={18} />,
    whatsapp: <MessageCircle size={18} />,
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [type, setType] = useState('email');
    const [address, setAddress] = useState('');
    const [trigger, setTrigger] = useState<'low_stock' | 'out_of_stock' | 'new_product'>('low_stock');
    const [editModal, setEditModal] = useState<{ open: boolean, notification: Notification | null }>({ open: false, notification: null });
    const [editForm, setEditForm] = useState({ type: 'email', address: '', trigger: 'low_stock' as 'low_stock' | 'out_of_stock' | 'new_product', enabled: true });

    useEffect(() => {
        fetch('/api/notifications')
            .then(async res => {
                if (!res.ok) return [];
                try {
                    return await res.json();
                } catch {
                    return [];
                }
            })
            .then(data => setNotifications(Array.isArray(data) ? data : []));
    }, []);

    const handleAddNotification = async () => {
        const res = await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, address, enabled: true, trigger }),
        });
        const newNotification = await res.json();
        setNotifications(prev => [...prev, newNotification]);
        setAddress('');
    };

    const openEditModal = (notification: Notification) => {
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
        }));
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editModal.notification) return;
        const res = await fetch(`/api/notifications?id=${editModal.notification._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editForm),
        });
        if (res.ok) {
            setEditModal({ open: false, notification: null });
            fetch('/api/notifications')
                .then(res => res.json())
                .then(data => setNotifications(Array.isArray(data) ? data : []));
        }
    };

    return (
        <>
            <div>
                <h1 className="text-3xl font-bold mb-6">Notifications</h1>
                <form className="flex gap-4 mb-4" onSubmit={(e) => { e.preventDefault(); handleAddNotification(); }}>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="px-4 py-2 rounded border bg-white dark:bg-[#18181b]"
                    >
                        <option value="email">Email</option>
                        <option value="sms">SMS</option>
                        <option value="whatsapp">WhatsApp</option>
                    </select>
                    <select
                        value={trigger}
                        onChange={e => setTrigger(e.target.value as 'low_stock' | 'out_of_stock' | 'new_product')}
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
                        {notifications.map((n: Notification) => (
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
                                            await fetch(`/api/notifications?id=${n._id}`, { method: 'DELETE' });
                                            fetch('/api/notifications')
                                                .then(res => res.json())
                                                .then(data => setNotifications(Array.isArray(data) ? data : []));
                                        }}>Eliminar</button>
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
                                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Guardar cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

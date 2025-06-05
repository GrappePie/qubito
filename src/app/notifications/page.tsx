'use client';
import {JSX, useEffect, useState} from 'react';
import { Mail, MessageCircle, PhoneCall } from 'lucide-react';

const iconMap: Record<string, JSX.Element> = {
    email: <Mail size={18} />,
    sms: <PhoneCall size={18} />,
    whatsapp: <MessageCircle size={18} />,
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [type, setType] = useState('email');
    const [address, setAddress] = useState('');

    useEffect(() => {
        fetch('/api/notifications')
            .then(res => res.json())
            .then(data => setNotifications(data));
    }, []);

    const handleAddNotification = async () => {
        const res = await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, address, enabled: true }),
        });
        const newNotification = await res.json();
        setNotifications(prev => [...prev, newNotification]);
        setAddress('');
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Notifications</h1>
            <div className="flex gap-4 mb-4">
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="text-black px-4 py-2 rounded border"
                >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="whatsapp">WhatsApp</option>
                </select>
                <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Address"
                    className="px-4 py-2 rounded text-black border"
                />
                <button
                    onClick={handleAddNotification}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    Add Notification
                </button>
            </div>
            <table className="w-full border-collapse bg-white rounded shadow">
                <thead>
                <tr className="bg-gray-100 text-left text-black">
                    <th className="p-3">Type</th>
                    <th className="p-3">Address</th>
                    <th className="p-3">Status</th>
                </tr>
                </thead>
                <tbody>
                {notifications.map((n: any) => (
                    <tr key={n._id} className="border-t text-black">
                        <td className="p-3 flex items-center gap-2">{iconMap[n.type] || '🔔'} {n.type}</td>
                        <td className="p-3">{n.address}</td>
                        <td className="p-3">
                            <input type="checkbox" className="toggle" checked={n.enabled} readOnly />
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

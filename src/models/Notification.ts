import mongoose, { Schema } from 'mongoose';

const NotificationSchema = new Schema({
    type: String, // 'email', 'sms', 'whatsapp'
    address: String,
    enabled: Boolean,
});

export const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

import mongoose, { Schema } from 'mongoose';

const NotificationSchema = new Schema({
    address: String,
    enabled: Boolean,
    trigger: {
        type: String,
        enum: ['low_stock', 'out_of_stock', 'new_product'],
        required: true,
        default: 'low_stock',
    },
    type: {
        type: String,
        enum: ['email', 'sms', 'whatsapp'],
        required: true,
        default: 'email',
    },
});

export const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

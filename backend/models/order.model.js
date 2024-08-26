import mongoose from "mongoose";

const OrderSchema = mongoose.Schema({
    orderId: {
        unique: true,
        type: Number,
        required: true,
    },
    accountData: {
        type: Object,
        required: true
    },
    transaction: {
        type: Array,
        required: true
    },
    orderInformation: {
        type: Object,
        required: true
    },
});

export const Order = mongoose.model("Order", OrderSchema);

import mongoose from "mongoose";

const OrderSchema = mongoose.Schema(
  {
    orderId: {
      type: Number,
      required: true,
    },
    accountData: {
      type: Object,
      required: true,
    },
    transaction: {
      type: Array,
      required: true,
    },
    orderInformation: {
      type: Object,
      required: true,
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", OrderSchema);

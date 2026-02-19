import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    date: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    monthKey: {
      type: String,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, monthKey: 1 });
transactionSchema.index({ user: 1, date: -1 });

export default mongoose.model('Transaction', transactionSchema);

import mongoose from 'mongoose';

const allocationSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    monthKey: {
      type: String,
      required: true,
      index: true,
    },
    incomeTarget: {
      type: Number,
      required: true,
      min: 0,
    },
    allocations: [allocationSchema],
  },
  { timestamps: true }
);

budgetSchema.index({ user: 1, monthKey: 1 }, { unique: true });

export default mongoose.model('Budget', budgetSchema);

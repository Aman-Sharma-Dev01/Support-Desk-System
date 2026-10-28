import mongoose from 'mongoose';

export const STATUS_ENUM = ['Open', 'In Progress', 'Waiting on Customer', 'Resolved'];
export const PRIORITY_ENUM = ['Low', 'Medium', 'High', 'Urgent'];

const ticketSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    customer: {
      type: String,
      required: [true, 'Customer name or email is required'],
      trim: true,
      maxlength: [100, 'Customer name/email cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: STATUS_ENUM,
        message: '{VALUE} is not a valid status',
      },
      default: 'Open',
      index: true,
    },
    priority: {
      type: String,
      enum: {
        values: PRIORITY_ENUM,
        message: '{VALUE} is not a valid priority',
      },
      default: 'Medium',
      index: true,
    },
    assignee: {
      type: String,
      default: 'Unassigned',
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual property to calculate whether a ticket is overdue
// Rule: A ticket is overdue when it is not Resolved and its created time is > 24 hours in the past
ticketSchema.virtual('isOverdue').get(function () {
  if (this.status === 'Resolved') return false;
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.createdAt < twentyFourHoursAgo;
});

// Index for text search
ticketSchema.index({ subject: 'text', customer: 'text', description: 'text' });

export default mongoose.model('Ticket', ticketSchema);

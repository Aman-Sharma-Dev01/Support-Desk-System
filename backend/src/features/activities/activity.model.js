import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'CREATED',
        'STATUS_CHANGED',
        'PRIORITY_CHANGED',
        'ASSIGNEE_CHANGED',
        'TICKET_UPDATED',
        'REPLY_ADDED',
        'NOTE_ADDED',
      ],
    },
    field: {
      type: String,
      default: null,
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    performedBy: {
      type: String,
      default: 'Support Agent',
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export default mongoose.model('Activity', activitySchema);

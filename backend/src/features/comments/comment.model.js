import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: [true, 'Ticket ID is required'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Comment type is required'],
      enum: ['reply', 'note'],
      default: 'reply',
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
    },
    authorName: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
    },
    authorEmail: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Comment', commentSchema);

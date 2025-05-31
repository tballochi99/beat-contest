import mongoose, { Schema, Document } from 'mongoose';

export interface IVote extends Document {
  beat1Id: mongoose.Types.ObjectId;
  beat2Id: mongoose.Types.ObjectId;
  votedBeatId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  contestId: string;
  ipHash?: string;
  createdAt: Date;
}

const VoteSchema: Schema = new Schema({
  beat1Id: {
    type: Schema.Types.ObjectId,
    ref: 'Beat',
    required: true,
  },
  beat2Id: {
    type: Schema.Types.ObjectId,
    ref: 'Beat',
    required: true,
  },
  votedBeatId: {
    type: Schema.Types.ObjectId,
    ref: 'Beat',
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  contestId: {
    type: String,
    required: true,
  },
  ipHash: {
    type: String,
  },
}, {
  timestamps: true,
});

// Compound index to prevent duplicate votes
VoteSchema.index({ beat1Id: 1, beat2Id: 1, userId: 1 }, { unique: true });
VoteSchema.index({ beat1Id: 1, beat2Id: 1, ipHash: 1 }, { unique: true });

export default mongoose.models.Vote || mongoose.model<IVote>('Vote', VoteSchema); 
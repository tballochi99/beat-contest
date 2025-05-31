import mongoose, { Schema, Document } from 'mongoose';

export interface IBeat extends Document {
  userId: mongoose.Types.ObjectId;
  contestId: string;
  url: string;
  round: number;
  votes: number;
  submittedAt: Date;
}

const BeatSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  contestId: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  round: {
    type: Number,
    required: true,
    enum: [1, 2, 3],
  },
  votes: {
    type: Number,
    default: 0,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Beat || mongoose.model<IBeat>('Beat', BeatSchema); 
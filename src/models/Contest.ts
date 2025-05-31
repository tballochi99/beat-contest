import mongoose, { Schema, Document } from 'mongoose';

export interface IContest extends Document {
  themeArtist: string;
  startDate: Date;
  endDate: Date;
  currentRound: number;
  status: 'upcoming' | 'active' | 'completed';
}

const ContestSchema: Schema = new Schema({
  themeArtist: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  currentRound: {
    type: Number,
    required: true,
    default: 1,
    enum: [1, 2, 3],
  },
  status: {
    type: String,
    required: true,
    enum: ['upcoming', 'active', 'completed'],
    default: 'upcoming',
  },
});

export default mongoose.models.Contest || mongoose.model<IContest>('Contest', ContestSchema); 
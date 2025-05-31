import mongoose from 'mongoose';

const contestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  theme: {
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
  coverImage: {
    type: String,
    required: true,
  },
  rules: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'ended'],
    default: 'draft',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  submissions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    trackUrl: String,
    submittedAt: Date,
    votes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      score: Number,
      votedAt: Date,
    }],
  }],
}, {
  timestamps: true,
});

// Supprimer le modèle existant s'il existe pour éviter les conflits
if (mongoose.models.Contest) {
  delete mongoose.models.Contest;
}

export default mongoose.model('Contest', contestSchema); 
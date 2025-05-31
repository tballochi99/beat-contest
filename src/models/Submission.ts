import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  contest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  trackUrl: {
    type: String,
    required: true
  },
  extractStart: {
    type: Number,
    required: true
  },
  extractEnd: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  votes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    score: Number,
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

// Index composé pour s'assurer qu'un utilisateur ne peut soumettre qu'une fois par concours
submissionSchema.index({ contest: 1, user: 1 }, { unique: true });

// Enregistrer le modèle de manière sûre
const modelName = 'Submission';
const Submission = mongoose.models[modelName] || mongoose.model(modelName, submissionSchema);

export default Submission; 
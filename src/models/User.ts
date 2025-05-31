import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  avatar: string;
  beatstars?: string;
  genius?: string;
  instagram?: string;
  twitter?: string;
  likes: number;
  trophies: number;
  contests: number;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  bio: string;
  socialLinks: {
    soundcloud?: string;
    instagram?: string;
    twitter?: string;
  };
  role: string;
  rewards: {
    type: string;
    amount: number;
    description: string;
    date: Date;
  }[];
}

const UserSchema: Schema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  avatar: {
    type: String,
    required: true,
  },
  beatstars: {
    type: String,
    trim: true,
  },
  genius: {
    type: String,
    trim: true,
  },
  instagram: {
    type: String,
    trim: true,
  },
  twitter: {
    type: String,
    trim: true,
  },
  likes: {
    type: Number,
    default: 0,
  },
  trophies: {
    type: Number,
    default: 0,
  },
  contests: {
    type: Number,
    default: 0,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  bio: {
    type: String,
    default: '',
  },
  socialLinks: {
    soundcloud: String,
    instagram: String,
    twitter: String,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  rewards: [{
    type: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: String,
    date: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

// Mettre à jour le champ updatedAt avant chaque sauvegarde
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema); 
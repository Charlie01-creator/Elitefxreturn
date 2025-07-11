const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: [true, 'Please provide your full name'],
    trim: true,
    index: true
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ],
  },
  phone: {
    type: String,
    required: [true, 'Please provide your phone number'],
    unique: true,
    trim: true,
    index: true,
    match: [
      /^\+?\d{10,15}$/,
      'Please provide a valid phone number'
    ],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 12,
    select: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  hasPaid: {
    type: Boolean,
    default: false,
  },
  accountBalance: {
    type: Number,
    default: 0,
  },
  lastLogin: {
    type: Date,
  },
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true
});

// Password hashing middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Account locking for brute force protection
UserSchema.methods.incrementLoginAttempts = async function() {
  if (this.lockUntil && this.lockUntil > Date.now()) return;
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  if (this.loginAttempts + 1 >= 5) {
    updates.$set = { 
      lockUntil: Date.now() + 15 * 60 * 1000, // 15 minutes lock
      loginAttempts: 0 
    };
  }
  
  return await this.model('User').findByIdAndUpdate(this._id, updates);
};

// Password comparison method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  if (this.lockUntil && this.lockUntil > Date.now()) {
    throw new Error('Account temporarily locked. Try again later.');
  }
  
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  
  if (!isMatch) {
    await this.incrementLoginAttempts();
    throw new Error('Invalid credentials');
  }
  
  // Reset login attempts on successful login
  if (this.loginAttempts > 0 || this.lockUntil) {
    await this.model('User').findByIdAndUpdate(this._id, {
      $set: { loginAttempts: 0 },
      $unset: { lockUntil: 1 }
    });
  }
  
  return isMatch;
};

module.exports = mongoose.model('User', UserSchema);

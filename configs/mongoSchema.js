import mongoose from 'mongoose';

// User Schema
const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  isMember: {
    type: Boolean,
    default: false,
  },
  customerId: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

// Study Material Schema
const studyMaterialSchema = new mongoose.Schema({
  courseId: {
    type: String,
    required: true,
  },
  courseType: {
    type: String,
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  difficultyLevel: {
    type: String,
    default: 'Easy',
  },
  courseLayout: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  createdBy: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: 'Generating',
  },
}, {
  timestamps: true,
});

// Chapter Notes Schema
const chapterNotesSchema = new mongoose.Schema({
  courseId: {
    type: String,
    required: true,
  },
  chapterId: {
    type: Number,
    required: true,
  },
  notes: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

// Study Type Content Schema
const studyTypeContentSchema = new mongoose.Schema({
  courseId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  status: {
    type: String,
    default: 'Generating',
  },
}, {
  timestamps: true,
});

// Payment Record Schema
const paymentRecordSchema = new mongoose.Schema({
  customerId: {
    type: String,
    default: null,
  },
  sessionId: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

// Export models
export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const StudyMaterial = mongoose.models.StudyMaterial || mongoose.model('StudyMaterial', studyMaterialSchema);
export const ChapterNotes = mongoose.models.ChapterNotes || mongoose.model('ChapterNotes', chapterNotesSchema);
export const StudyTypeContent = mongoose.models.StudyTypeContent || mongoose.model('StudyTypeContent', studyTypeContentSchema);
export const PaymentRecord = mongoose.models.PaymentRecord || mongoose.model('PaymentRecord', paymentRecordSchema);
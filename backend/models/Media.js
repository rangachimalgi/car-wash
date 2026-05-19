import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['testimonials', 'transformations', 'seeTheDifference', 'homeSliders', 'whyChooseUs', 'loginBanner'],
    index: true,
  },
  url: {
    type: String,
    required: true,
  },
  /** JPEG poster for video items — generated on upload, fast to load in the app. */
  posterUrl: {
    type: String,
    default: '',
  },
  name: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  order: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

export default mongoose.model('Media', mediaSchema);

import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IGeolocation extends Document {
  country: string;
  state: string;
  city: string;
  ipHash?: string;
  createdAt: Date;
}

const GeolocationSchema: Schema = new Schema({
  country: { type: String, default: 'Unknown' },
  state: { type: String, default: 'Unknown' },
  city: { type: String, default: 'Unknown' },
  ipHash: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Indexing for faster aggregation queries based on time and location
GeolocationSchema.index({ createdAt: -1 });
GeolocationSchema.index({ country: 1, state: 1, city: 1 });

const Geolocation: Model<IGeolocation> =
  mongoose.models.Geolocation || mongoose.model<IGeolocation>('Geolocation', GeolocationSchema);

export default Geolocation;

import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // If already connected, return the existing connection
    if (mongoose.connections[0].readyState) {
      return mongoose.connections[0];
    }

    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
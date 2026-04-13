import mongoose from 'mongoose';
const connectDB=async()=>{try
  {
    const conn=await mongoose.connect(process.env.MONGODB_URI);
     console.log(`mongoDB Connected: ${conn.connection.host}`);
  }catch(error){
    console.error(`error connecting to mongodb:${error.message}`);
    process.exit(1);
  }
}
export default connectDB;
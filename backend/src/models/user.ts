import mongoose, { type Document, type Model } from 'mongoose'

export interface IUser extends Document {
  userId: string
  email: string
  name?: string
  timezone: string
  createdAt: Date
  updatedAt: Date
}

const userSchema = new mongoose.Schema<IUser>(
  {
    userId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    name: { type: String, default: '' },
    timezone: { type: String, default: 'America/New_York' },
  },
  { timestamps: true }
)

export const UserModel: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ?? mongoose.model<IUser>('User', userSchema)

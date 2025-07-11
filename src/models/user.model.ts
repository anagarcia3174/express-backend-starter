import mongoose, { Document, Model} from 'mongoose';
import bcrypt from 'bcrypt';

// Define the interface for a User document instance (with instance methods)
export interface IUserDocument extends Document {
  username: string;
  email: string;
  password: string;
  refreshTokens: string[];
  isVerified: boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Define the interface for the User model (with static methods)
export interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
  findByUsername(username: string): Promise<IUserDocument | null>;
}


const UserSchema = new mongoose.Schema<IUserDocument, IUserModel>({
    username: {type: String, required: true, unique: true, trim: true, minLength: 3, maxLength: 30},
    email: {type: String, required: true, unique: true, trim: true},
    password: { type: String, required: true, select: false},
    refreshTokens: {type: [String], default: []},
    isVerified: {type: Boolean, default: false},
}, {
    timestamps: true
})


UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean>{
  if(!candidatePassword) return false;
    return await bcrypt.compare(candidatePassword, this.password);
}

UserSchema.statics.findByEmail = function(email: string) {
    return this.findOne({ email });
  };
  
  UserSchema.statics.findByUsername = function(username: string) {
    return this.findOne({ username });
  };

  UserSchema.pre('save', async function(next){
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
  })

export const UserModel = mongoose.model<IUserDocument, IUserModel>('User', UserSchema);


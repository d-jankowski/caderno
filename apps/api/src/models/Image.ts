import mongoose, {Document, Schema, Types} from 'mongoose';

export interface IImage extends Document {
    _id: Types.ObjectId;
    entryId: Types.ObjectId;
    userId: Types.ObjectId;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    createdAt: Date;
}

const ImageSchema = new Schema<IImage>(
    {
        entryId: {type: Schema.Types.ObjectId, ref: 'Entry', required: true},
        userId: {type: Schema.Types.ObjectId, ref: 'User', required: true},
        filename: {type: String, required: true},
        originalName: {type: String, required: true, maxlength: 255},
        mimeType: {type: String, required: true},
        size: {type: Number, required: true},
    },
    {
        timestamps: {createdAt: true, updatedAt: false},
    }
);

ImageSchema.index({entryId: 1, userId: 1});

export const Image = mongoose.model<IImage>('Image', ImageSchema);

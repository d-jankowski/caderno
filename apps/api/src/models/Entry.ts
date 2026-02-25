import mongoose, {Document, Schema, Types} from 'mongoose';

export interface IEntry extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    title: string;
    content: string;
    tags: string[];
    includeInSafetyTimer: boolean;
    entryDate: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    locationLatitude?: number;
    locationLongitude?: number;
    locationName?: string;
}

const EntrySchema = new Schema<IEntry>(
    {
        userId: {type: Schema.Types.ObjectId, ref: 'User', required: true},
        title: {type: String, required: true, maxlength: 500},
        content: {type: String, required: true},
        tags: [{type: String, maxlength: 50}],
        includeInSafetyTimer: {type: Boolean, default: true},
        entryDate: {type: Date, default: Date.now},
        deletedAt: {type: Date},
        locationLatitude: {type: Number},
        locationLongitude: {type: Number},
        locationName: {type: String, maxlength: 200},
    },
    {
        timestamps: true,
    }
);

EntrySchema.index({userId: 1, createdAt: -1});
EntrySchema.index({userId: 1, deletedAt: 1});
EntrySchema.index({userId: 1, tags: 1});
EntrySchema.index({userId: 1, content: 'text'});

export const Entry = mongoose.model<IEntry>('Entry', EntrySchema);

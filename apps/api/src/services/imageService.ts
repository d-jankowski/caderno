import multer, {FileFilterCallback, StorageEngine} from 'multer';
import {Request} from 'express';
import path from 'path';
import {randomUUID} from 'crypto';
import fs from 'fs';
import {env} from '../config/env.js';
import {Entry} from '../models/Entry.js';
import {Image, IImage} from '../models/Image.js';
import {AppError} from '../middleware/errorHandler.js';

const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
]);

const MIME_TO_EXT: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
};

const storage: StorageEngine = multer.diskStorage({
    destination(_req, _file, cb) {
        cb(null, env.UPLOADS_DIR);
    },
    filename(_req, file, cb) {
        const ext = MIME_TO_EXT[file.mimetype] ?? '.bin';
        cb(null, `${randomUUID()}${ext}`);
    },
});

function fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new AppError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Only image files are allowed'));
    }
}

export const uploadMiddleware = multer({
    storage,
    fileFilter,
    limits: {fileSize: 20 * 1024 * 1024, files: 1},
}).single('image');

export interface ImageResponse {
    id: string;
    entryId: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    markdown: string;
    createdAt: Date;
}

const MARKDOWN_UNSAFE = /[\][()\n]/g;

function toImageResponse(image: IImage): ImageResponse {
    const url = `/api/v1/entries/${image.entryId.toString()}/images/${image._id.toString()}`;
    const safeAlt = image.originalName.replace(MARKDOWN_UNSAFE, '');
    return {
        id: image._id.toString(),
        entryId: image.entryId.toString(),
        filename: image.filename,
        originalName: image.originalName,
        mimeType: image.mimeType,
        size: image.size,
        url,
        markdown: `![${safeAlt}](${url})`,
        createdAt: image.createdAt,
    };
}

async function assertEntryOwnership(entryId: string, userId: string): Promise<void> {
    const entry = await Entry.findOne({_id: entryId, userId, deletedAt: null});
    if (!entry) throw new AppError(404, 'ENTRY_NOT_FOUND', 'Entry not found');
}

export async function createImage(
    userId: string,
    entryId: string,
    file: Express.Multer.File
): Promise<ImageResponse> {
    try {
        await assertEntryOwnership(entryId, userId);
        const image = await Image.create({
            entryId,
            userId,
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
        });
        return toImageResponse(image);
    } catch (error) {
        fs.unlink(file.path, () => {});
        throw error;
    }
}

export async function getImageFile(
    userId: string,
    entryId: string,
    imageId: string,
): Promise<{filePath: string; mimeType: string}> {
    await assertEntryOwnership(entryId, userId);
    const image = await Image.findOne({_id: imageId, entryId, userId});
    if (!image) throw new AppError(404, 'IMAGE_NOT_FOUND', 'Image not found');
    return {
        filePath: path.join(env.UPLOADS_DIR, image.filename),
        mimeType: image.mimeType,
    };
}

export async function deleteImage(
    userId: string,
    entryId: string,
    imageId: string,
): Promise<void> {
    await assertEntryOwnership(entryId, userId);
    const image = await Image.findOneAndDelete({_id: imageId, entryId, userId});
    if (!image) throw new AppError(404, 'IMAGE_NOT_FOUND', 'Image not found');
    fs.unlink(path.join(env.UPLOADS_DIR, image.filename), () => {});
}

export async function reconcileEntryImages(entryId: string, content: string): Promise<void> {
    const images = await Image.find({entryId});
    if (images.length === 0) return;
    const orphaned = images.filter(img => {
        const url = `/api/v1/entries/${entryId}/images/${img._id.toString()}`;
        return !content.includes(url);
    });
    if (orphaned.length === 0) return;
    await Image.deleteMany({_id: {$in: orphaned.map(img => img._id)}});
    for (const img of orphaned) {
        fs.unlink(path.join(env.UPLOADS_DIR, img.filename), () => {});
    }
}

export async function deleteImagesByEntry(entryId: string): Promise<void> {
    const images = await Image.find({entryId});
    await Image.deleteMany({entryId});
    for (const img of images) {
        fs.unlink(path.join(env.UPLOADS_DIR, img.filename), () => {});
    }
}

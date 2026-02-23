import fs from 'fs';
import {Response, NextFunction} from 'express';
import {AuthRequest} from '../middleware/auth.js';
import {createImage, getImageFile, deleteImage} from '../services/imageService.js';
import {AppError} from '../middleware/errorHandler.js';

export async function upload(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.file) {
            res.status(400).json({error: {code: 'NO_FILE', message: 'No image file provided'}});
            return;
        }
        const image = await createImage(req.userId!, req.params.entryId as string, req.file);
        res.status(201).json(image);
    } catch (error) {
        next(error);
    }
}

export async function remove(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        await deleteImage(req.userId!, req.params.entryId as string, req.params.imageId as string);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

export async function getById(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const {filePath, mimeType} = await getImageFile(
            req.userId!,
            req.params.entryId as string,
            req.params.imageId as string,
        );
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
        fs.createReadStream(filePath)
            .on('error', () => next(new AppError(404, 'IMAGE_FILE_MISSING', 'Image file not found on disk')))
            .pipe(res);
    } catch (error) {
        next(error);
    }
}

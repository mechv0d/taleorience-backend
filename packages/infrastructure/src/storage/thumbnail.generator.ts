import sharp from 'sharp';
import { ThumbnailGenerator } from '@taleorience/application';
import { DomainError } from '@taleorience/domain';

export class SharpThumbnailGenerator implements ThumbnailGenerator {
  async generate(imageBuffer: Buffer, width: number, height: number): Promise<Buffer> {
    try {
      return await sharp(imageBuffer)
        .resize(width, height, { fit: 'cover', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
    } catch {
      throw new DomainError('THUMBNAIL_GENERATION_FAILED', 'errors.thumbnailGenerationFailed', {}, 500);
    }
  }
}
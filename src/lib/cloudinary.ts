import { v2 as cloudinary } from "cloudinary";
import { UploadApiErrorResponse, UploadApiResponse } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

export interface UploadOptions {
  folder?: string;
  publicId?: string;
  transformation?: any[];
  eager?: any[];
}

export interface UploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
}

/**
 * Upload image to Cloudinary with optimization
 */
export async function uploadImage(
  file: File | Buffer,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const {
    folder = "wanderlust/listings",
    publicId,
    transformation = [
      { width: 1200, height: 800, crop: "limit", quality: "auto" },
      { fetch_format: "auto" },
    ],
    eager = [
      { width: 400, height: 300, crop: "limit", quality: "auto" },
      { width: 800, height: 600, crop: "limit", quality: "auto" },
    ],
  } = options;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        transformation,
        eager,
        eager_async: true,
        resource_type: "auto",
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else if (result) {
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
          });
        }
      }
    );

    const writeBuffer = async () => {
      if (file instanceof File) {
        const buffer = Buffer.from(await file.arrayBuffer());
        uploadStream.end(buffer);
      } else {
        uploadStream.end(file);
      }
    };

    writeBuffer();
  });
}

/**
 * Delete image from Cloudinary
 */
export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`Failed to delete image ${publicId}:`, error);
    // Don't throw - we want to continue even if deletion fails
  }
}

/**
 * Batch delete images from Cloudinary
 */
export async function deleteImages(publicIds: string[]): Promise<void> {
  const promises = publicIds.map((publicId) => deleteImage(publicId));
  await Promise.allSettled(promises);
}

/**
 * Get optimized image URL
 */
export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: "scale" | "fit" | "limit" | "fill";
    quality?: number;
    format?: "auto" | "webp" | "avif";
  } = {}
): string {
  const {
    width = 800,
    height = 600,
    crop = "limit",
    quality = 80,
    format = "auto",
  } = options;

  return cloudinary.url(publicId, {
    width,
    height,
    crop,
    quality,
    fetch_format: format,
  });
}

export { cloudinary };
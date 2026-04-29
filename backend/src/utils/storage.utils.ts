
import fs from "fs/promises";
import path from "path";
import { cloudinary } from "../config/storage.js";
import { ensureUploadsDirs, publicUrlFor, uploadPath } from "./image.utils.js";

ensureUploadsDirs();

export const isProductionStorage = process.env.NODE_ENV === "production";

export const isRemoteStoredUrl = (url: string) => /^https?:\/\//i.test(url);

export const buildStoredFileName = (originalName: string) => {
  const extension = path.extname(originalName);
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
};

const toLocalPath = (url: string) => uploadPath(url.replace("/uploads/", ""));

const uploadToCloudinary = async (
  publicId: string,
  buffer: Buffer,
  mimeType: string,
  folder?: string
) => {
  if (!mimeType.startsWith("image/")) {
    throw new Error(`Unsupported mime type: ${mimeType}`);
  }

  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          public_id: publicId,
          resource_type: "image",
          ...(folder ? { folder } : {}),
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Cloudinary upload failed"));
            return;
          }

          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      )
      .end(buffer);
  });
};

export const storeImageBuffer = async (
  buffer: Buffer,
  fileName: string,
  folder: string,
  mimeType: string
) => {
  if (isProductionStorage) {
    return uploadToCloudinary(fileName, buffer, mimeType, folder);
  }

  const relativePath = path.join(folder, fileName);
  await fs.writeFile(uploadPath(relativePath), buffer);

  return {
    url: publicUrlFor(relativePath),
    publicId: fileName,
  };
};

export const readStoredImageBuffer = async (image: { url: string }) => {
  if (!isRemoteStoredUrl(image.url)) {
    return fs.readFile(toLocalPath(image.url));
  }

  const response = await fetch(image.url);
  return Buffer.from(await response.arrayBuffer());
};

export const deleteStoredImage = async (image: { url: string; publicId: string }) => {
  if (!isRemoteStoredUrl(image.url)) {
    await fs.unlink(toLocalPath(image.url));
    return;
  }

  await cloudinary.uploader.destroy(image.publicId);
};

export const saveDerivedImage = async (
  buffer: Buffer,
  fileName: string,
  mimeType: string
) => {
  return storeImageBuffer(buffer, fileName, "derived", mimeType);
};

export const uploadToStorage = async (
  key: string,
  buffer: Buffer,
  mimeType: string
) => {
  return uploadToCloudinary(key, buffer, mimeType);
};

export const getFileBuffer = async (key: string): Promise<Buffer> => {
  const url = cloudinary.url(key);
  const response = await fetch(url);
  return Buffer.from(await response.arrayBuffer());
};

export const deleteFromStorage = async (key: string) => {
  await cloudinary.uploader.destroy(key);
};
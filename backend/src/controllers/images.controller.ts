import type { Response } from "express";
import type { ImageRequest } from "../types/images.types.js";
import type { AuthRequest } from "../types/auth.types.js";
import path from "path";
import sharp, { type OverlayOptions } from "sharp";
import { prisma } from "../config/db.js";
import type { Image as LocalImage } from "../types/images.types.js";
import logger from "../utils/logger.js";
import { publicUrlFor, ensureUploadsDirs } from "../utils/image.utils.js";
import {
  buildStoredFileName,
  deleteStoredImage,
  isProductionStorage,
  readStoredImageBuffer,
  saveDerivedImage,
  storeImageBuffer,
} from "../utils/storage.utils.js";

ensureUploadsDirs();

export const uploadImage = async (req: ImageRequest, res: Response) => {
  try {
    // multer puts file on req.file
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No image uploaded." });
    }
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const fileName = isProductionStorage
      ? buildStoredFileName(file.originalname)
      : file.filename;

    const storedImage = isProductionStorage
      ? await storeImageBuffer(file.buffer, fileName, "originals", file.mimetype)
      : {
          url: publicUrlFor(path.join("originals", fileName)),
          publicId: fileName,
        };

    const image = await prisma.image.create({
      data: {
        url: storedImage.url,
        publicId: storedImage.publicId,
        userId: user.id,
      },
    });

    return res.status(201).json({ image });
  } catch (error) {
    logger.error({ message: "Upload failed", error });
    return res.status(500).json({ message: "Upload failed" });
  }
};

export const listImages = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const images = await prisma.image.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    // enrich with metadata
    const enriched = await Promise.all(
      images.map(async (img: LocalImage) => {
        try {
          const fileBuffer = await readStoredImageBuffer(img);
          const metadata = await sharp(fileBuffer).metadata();
          return { ...img, metadata };
        } catch (_e) {
          return { ...img };
        }
      })
    );

    return res.status(200).json({ images: enriched });
  } catch (error) {
    logger.error({ message: "List images failed", error });
    return res.status(500).json({ message: "Failed to list images" });
  }
};

type QueryParams = Record<string, string | undefined>;

const escapeXml = (value: string): string => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
};

const normalizeQueryParams = (query: AuthRequest["query"]): QueryParams => {
  const toValue = (value: unknown): string | undefined => {
    if (typeof value === "string") return value;
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    return undefined;
  };

  return {
    rotate: toValue(query.rotate),
    width: toValue(query.width),
    height: toValue(query.height),
    crop: toValue(query.crop),
    watermarkText: toValue(query.watermarkText),
    format: toValue(query.format),
    save: toValue(query.save),
  };
};

const applyTransformations = async (buffer: Buffer, qs: QueryParams) => {
  let img = sharp(buffer);

  if (qs.rotate) {
    const angle = parseInt(qs.rotate, 10) || 0;
    img = img.rotate(angle);
  }

  if (qs.width || qs.height) {
    const width = qs.width ? parseInt(qs.width, 10) : undefined;
    const height = qs.height ? parseInt(qs.height, 10) : undefined;
    img = img.resize(width, height, { fit: "cover" });
  }

  if (qs.crop) {
    // expecting crop as x,y,w,h
    const parts = qs.crop.split(",");
    if (parts.length === 4) {
      const x = parseInt(parts[0] ?? "0", 10);
      const y = parseInt(parts[1] ?? "0", 10);
      const w = parseInt(parts[2] ?? "0", 10);
      const h = parseInt(parts[3] ?? "0", 10);
      img = img.extract({ left: x, top: y, width: w, height: h });
    }
  }

  if (qs.watermarkText) {
    const safeText = escapeXml(qs.watermarkText);
    const inputMeta = await img.metadata();
    const requestedWidth = qs.width ? parseInt(qs.width, 10) : undefined;
    const requestedHeight = qs.height ? parseInt(qs.height, 10) : undefined;

    // Keep overlay smaller than the expected output dimensions.
    const targetWidth = requestedWidth ?? inputMeta.width ?? 800;
    const targetHeight = requestedHeight ?? inputMeta.height ?? 600;
    const overlayWidth = Math.max(80, Math.min(targetWidth - 10, Math.floor(targetWidth * 0.45)));
    const overlayHeight = Math.max(40, Math.min(targetHeight - 10, Math.floor(targetHeight * 0.2)));
    const fontSize = Math.max(14, Math.floor(overlayHeight * 0.4));
    const textY = Math.max(20, Math.floor(overlayHeight * 0.65));

    const svg = `<svg width="${overlayWidth}" height="${overlayHeight}"><style>.t{font-size:${fontSize}px;fill:rgba(255,255,255,0.65);font-family:Arial,Helvetica,sans-serif;}</style><text x="10" y="${textY}" class="t">${safeText}</text></svg>`;
    const svgBuffer = Buffer.from(svg);
    const composite: OverlayOptions[] = [{ input: svgBuffer, gravity: "southeast" } as OverlayOptions];
    img = img.composite(composite);
  }

  if (qs.format) {
    const fmt = qs.format.toLowerCase();
    if (fmt === "png") img = img.png();
    else if (fmt === "webp") img = img.webp();
    else if (fmt === "jpeg" || fmt === "jpg") img = img.jpeg();
  }

  return img.toBuffer();
};

export const getImage = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const id = Number(req.params.id);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    if (isNaN(id)) return res.status(400).json({ message: "Invalid image ID" });

    const image = await prisma.image.findUnique({ where: { id } });

    if (!image || image.userId !== user.id) {
      return res.status(404).json({ message: "Image not found" });
    }

    let buffer: Buffer;
    try {
      buffer = await readStoredImageBuffer(image);
    } catch (error) {
      logger.warn({ message: "Image file missing", imageId: image.id, error });
      return res.status(404).json({ message: "Image file not found" });
    }

    const qs = normalizeQueryParams(req.query);

    if (!Object.values(qs).some(Boolean)) {
      const ext = path.extname(image.publicId).slice(1).toLowerCase();
      const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
      res.setHeader("Content-Type", mime);
      return res.send(buffer);
    }

    const out = await applyTransformations(buffer, qs);

    if (qs.save === "true") {
      const outName = `${Date.now()}-${image.publicId}`;
      const outMeta = await sharp(out).metadata();
      const savedMime =
        outMeta.format === "png" ? "image/png" :
        outMeta.format === "webp" ? "image/webp" :
        "image/jpeg";
      const savedImage = await saveDerivedImage(out, outName, savedMime);
      const newImage = await prisma.image.create({
        data: { url: savedImage.url, publicId: savedImage.publicId, userId: user.id },
      });
      // FIX: correct content type for JSON response
      return res.status(201).json({ saved: true, image: newImage });
    }

    // FIX: detect actual mime type from transformed buffer
    const meta = await sharp(out).metadata();
    const mime =
      meta.format === "png" ? "image/png" :
      meta.format === "webp" ? "image/webp" :
      "image/jpeg";
    res.setHeader("Content-Type", mime);
    return res.send(out);

  } catch (error) {
    logger.error({
      message: "Get image failed",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return res.status(500).json({ message: "Failed to retrieve image" });
  }
};

export const updateImage = async (req: ImageRequest, res: Response) => {
  try {
    const user = req.user;
    const id = Number(req.params.id);
    const file = req.file;

    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (isNaN(id)) return res.status(400).json({ message: "Invalid image ID" });
    if (!file) return res.status(400).json({ message: "No image uploaded." });

    const image = await prisma.image.findUnique({ where: { id } });

    if (!image || image.userId !== user.id) {
      return res.status(404).json({ message: "Image not found" });
    }

    const fileName = isProductionStorage
      ? buildStoredFileName(file.originalname)
      : file.filename;

    const updatedStoredImage = isProductionStorage
      ? await storeImageBuffer(file.buffer, fileName, "originals", file.mimetype)
      : {
          url: publicUrlFor(path.join("originals", fileName)),
          publicId: fileName,
        };

    const updatedImage = await prisma.image.update({
      where: { id },
      data: {
        url: updatedStoredImage.url,
        publicId: updatedStoredImage.publicId,
      },
    });

    try {
      await deleteStoredImage(image);
    } catch (error) {
      logger.warn({
        message: "Failed to remove previous image file during update",
        imageId: id,
        error,
      });
    }

    return res.status(200).json({ image: updatedImage });
  } catch (error) {
    logger.error({ message: "Update image failed", error });
    return res.status(500).json({ message: "Failed to update image" });
  }
};

export const deleteImage = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const id = Number(req.params.id);

    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (isNaN(id)) return res.status(400).json({ message: "Invalid image ID" });

    const image = await prisma.image.findUnique({ where: { id } });

    if (!image || image.userId !== user.id) {
      return res.status(404).json({ message: "Image not found" });
    }

    await deleteStoredImage(image);
    await prisma.image.delete({ where: { id } });

    return res.status(200).json({ message: "Image deleted successfully" });
  } catch (error) {
    logger.error({ message: "Delete image failed", error });
    return res.status(500).json({ message: "Failed to delete image" });
  }
};
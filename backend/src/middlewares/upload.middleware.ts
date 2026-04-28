import multer from "multer";
import path from "path";
import type { Request } from "express";
import { ensureUploadsDirs, uploadPath } from "../utils/image.utils.js";

ensureUploadsDirs();

const storage = multer.diskStorage({
  destination: (req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, uploadPath("originals"));
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

export default upload;

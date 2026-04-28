import type { AuthRequest } from "./auth.types.js";

/// <reference types="express" />

export type MulterFile = Express.Multer.File;

export type ImageRequest = AuthRequest & {
  file?: MulterFile | undefined;
};

export type Image = {
  id: number;
  url: string;
  publicId: string;
  userId: number;
  createdAt: Date;
};

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const backendRoot = path.resolve(currentDir, "../..");

export const ensureUploadsDirs = () => {
  const base = path.join(backendRoot, "uploads");
  const originals = path.join(base, "originals");
  const derived = path.join(base, "derived");

  if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true });
  if (!fs.existsSync(originals)) fs.mkdirSync(originals, { recursive: true });
  if (!fs.existsSync(derived)) fs.mkdirSync(derived, { recursive: true });
};

export const uploadPath = (subpath = "") => {
  return path.join(backendRoot, "uploads", subpath);
};

export const publicUrlFor = (subpath: string) => {
  // Simple mapping: return path relative to project root
  return `/uploads/${subpath}`;
};

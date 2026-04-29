import express from "express";
import upload from "../middlewares/upload.middleware.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { uploadImage, listImages, getImage, updateImage, deleteImage } from "../controllers/images.controller.js";

const router = express.Router();


// Upload image
router.post("/", requireAuth, upload.single("image"), uploadImage);

// List images for user
router.get("/", requireAuth, listImages);

// Retrieve image (with optional transforms)
router.get("/:id", requireAuth, getImage);

// Replace an existing image
router.patch("/:id", requireAuth, upload.single("image"), updateImage);

// Delete an image
router.delete("/:id", requireAuth, deleteImage);

export default router;

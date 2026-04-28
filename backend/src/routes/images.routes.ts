import express from "express";
import upload from "../middlewares/upload.middleware.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { uploadImage, listImages, getImage } from "../controllers/images.controller.js";

const router = express.Router();


// Upload image
router.post("/", requireAuth, upload.single("image"), uploadImage);

// List images for user
router.get("/", requireAuth, listImages);

// Retrieve image (with optional transforms)
router.get("/:id", requireAuth, getImage);

export default router;

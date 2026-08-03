import { Router } from "express";
import multer from "multer";
import { analyzeResume } from "../controllers/resume.controller.js";
import { suggestResumeImprovements } from "../controllers/suggestions.controller.js";

const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/png", "image/jpeg"]);

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error("Only PDF, PNG, and JPEG files are supported."));
      return;
    }
    cb(null, true);
  },
});

export const resumeRouter = Router();

resumeRouter.post("/analyze", upload.single("resume"), analyzeResume);
resumeRouter.post("/suggest", suggestResumeImprovements);

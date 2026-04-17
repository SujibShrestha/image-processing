import type { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import type { AuthRequest, JwtPayload } from "../types/auth.types.js";
import logger from "../utils/logger.js";

export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    logger.warn({
      message: "Authorization token is missing.",
    });

    return res.status(401).json({
      message: "Authorization token is missing.",
    });
  }

  const token = authorization.replace("Bearer ", "").trim();
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    logger.error({
      message: "JWT_SECRET is not configured.",
    });

    return res.status(500).json({
      message: "JWT_SECRET is not configured.",
    });
  }

  try {
    const payload = jwt.verify(token, secret) as JwtPayload;

    req.user = {
      id: payload.id,
      email: payload.email,
    };

    logger.info({
      message: "Authorization token verified.",
      userId: payload.id,
      email: payload.email,
    });

    return next();
  } catch (_error) {
    logger.warn({
      message: "Invalid or expired token.",
    });

    return res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
};
import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";
import logger from "../utils/logger.js";

const signToken = (id: number, email: string): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign({ id, email }, secret);
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, name, avatar } = req.body as {
      email: string;
      password: string;
      name?: string;
      avatar?: string;
    };

    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = {
      email,
      password: hashedPassword,
      ...(name ? { name } : {}),
      ...(avatar ? { avatar } : {}),
    };

    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
      },
    });

    if(!user){
        return res.status(401).json({"message":"Error while Registering user"})
    }

    const token = signToken(user.id, user.email);

    logger.info({
      message: "User registered successfully.",
      userId: user.id,
      email: user.email,
    });

    return res.status(201).json({
      message: "User registered successfully.",
      token,
      user,
    });
  } catch (error) {
    const prismaError = error as { code?: string };

    if (prismaError?.code === "P2002") {
      logger.warn({
        message: "Registration attempted with existing email.",
        email: req.body?.email,
      });

      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    logger.error({
      message: "Registration failed.",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = signToken(user.id, user.email);

    logger.info({
      message: "User logged in successfully.",
      userId: user.id,
      email: user.email,
    });

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    logger.error({
      message: "Login failed.",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return next(error);
  }
};



import request from "supertest";
import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Mock } from "jest-mock";
import app from "../src/server.js";
import { prisma } from "../src/config/db.js";

jest.mock("../src/config/db.js", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const mockedPrisma = prisma as unknown as {
  user: {
    findMany: Mock<(args?: unknown) => Promise<unknown[]>>;
    findUnique: Mock<(args?: unknown) => Promise<unknown | null>>;
    update: Mock<(args?: unknown) => Promise<unknown>>;
    findFirst: Mock<(args?: unknown) => Promise<unknown | null>>;
    delete: Mock<(args?: unknown) => Promise<unknown>>;
  };
};

const createToken = (id = 1, email = "test@example.com") => {
  process.env.JWT_SECRET = "test-secret";
  return jwt.sign({ id, email }, process.env.JWT_SECRET);
};

describe("API Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
  });

  describe("GET /", () => {
    it("should return api status", async () => {
      const res = await request(app).get("/").expect(200);

      expect(res.body).toEqual({
        status: "success",
        message: "API is running",
      });
    });
  });

  describe("GET /api/v1/users", () => {
    it("should return all users", async () => {
      const users = [
        {
          id: 1,
          email: "john@example.com",
          name: "John",
          avatar: null,
          createdAt: new Date("2026-04-17T00:00:00.000Z"),
        },
      ];

      mockedPrisma.user.findMany.mockResolvedValue(users);

      const res = await request(app).get("/api/v1/users").expect(200);

      expect(res.body).toEqual({
        success: true,
        count: 1,
        data: users.map((user) => ({
          ...user,
          createdAt: user.createdAt.toISOString(),
        })),
      });
      expect(mockedPrisma.user.findMany).toHaveBeenCalledTimes(1);
    });

    it("should return 500 when fetching users fails", async () => {
      mockedPrisma.user.findMany.mockRejectedValue(new Error("db down"));

      const res = await request(app).get("/api/v1/users").expect(500);

      expect(res.body).toEqual({
        success: false,
        message: "Failed to fetch users",
      });
    });
  });

  describe("GET /api/v1/users/:id", () => {
    it("should return 401 when no auth token is provided", async () => {
      const res = await request(app).get("/api/v1/users/1").expect(401);

      expect(res.body).toEqual({ message: "Authorization token is missing." });
    });

    it("should return current user profile when token is valid", async () => {
      const token = createToken(1, "john@example.com");
      const user = {
        id: 1,
        email: "john@example.com",
        name: "John",
        avatar: "https://example.com/avatar.png",
        createdAt: new Date("2026-04-17T00:00:00.000Z"),
      };

      mockedPrisma.user.findUnique.mockResolvedValue(user);

      const res = await request(app)
        .get("/api/v1/users/1")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body).toEqual({
        message: "User profile retrieved successfully.",
        user: {
          ...user,
          createdAt: user.createdAt.toISOString(),
        },
      });
      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          createdAt: true,
        },
      });
    });

    it("should return 404 when current user is not found", async () => {
      const token = createToken(42, "missing@example.com");
      mockedPrisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get("/api/v1/users/42")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(res.body).toEqual({ message: "User not found." });
    });
  });

  describe("PATCH /api/v1/users/:id", () => {
    it("should return 401 when no auth token is provided", async () => {
      const res = await request(app)
        .patch("/api/v1/users/1")
        .send({ name: "John" })
        .expect(401);

      expect(res.body).toEqual({ message: "Authorization token is missing." });
    });

    it("should return 400 when body is empty", async () => {
      const token = createToken(1, "john@example.com");

      const res = await request(app)
        .patch("/api/v1/users/1")
        .set("Authorization", `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(res.body.message).toBe("Validation failed.");
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: "At least one field is required." }),
        ])
      );
    });

    it("should update and return current user profile", async () => {
      const token = createToken(1, "john@example.com");
      const updatedUser = {
        id: 1,
        email: "john@example.com",
        name: "Updated John",
        avatar: "https://example.com/new-avatar.png",
        createdAt: new Date("2026-04-17T00:00:00.000Z"),
      };

      mockedPrisma.user.update.mockResolvedValue(updatedUser);

      const res = await request(app)
        .patch("/api/v1/users/1")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Updated John",
          avatar: "https://example.com/new-avatar.png",
        })
        .expect(200);

      expect(mockedPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: "Updated John",
          avatar: "https://example.com/new-avatar.png",
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          createdAt: true,
        },
      });

      expect(res.body).toEqual({
        message: "User profile updated successfully.",
        user: {
          ...updatedUser,
          createdAt: updatedUser.createdAt.toISOString(),
        },
      });
    });
  });

  describe("DELETE /api/v1/users/:id", () => {
    it("should return 401 when no auth token is provided", async () => {
      const res = await request(app).delete("/api/v1/users/1").expect(401);

      expect(res.body).toEqual({ message: "Authorization token is missing." });
    });

    it("should return 500 when user does not exist", async () => {
      const token = createToken(99, "missing@example.com");

      mockedPrisma.user.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .delete("/api/v1/users/99")
        .set("Authorization", `Bearer ${token}`)
        .expect(500);

      expect(res.body).toEqual({
        success: false,
        message: "Failed to delete user",
      });
    });

    it("should delete current user successfully", async () => {
      const token = createToken(1, "john@example.com");

      mockedPrisma.user.findFirst.mockResolvedValue({
        id: 1,
        email: "john@example.com",
      });
      mockedPrisma.user.delete.mockResolvedValue({
        id: 1,
        email: "john@example.com",
      });

      const res = await request(app)
        .delete("/api/v1/users/1")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(mockedPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockedPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(res.body).toEqual({
        success: true,
        message: "User deleted Successfully",
      });
    });
  });
});

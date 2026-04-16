import request from "supertest";
import app from "../src/server.js";

describe("API Endpoints", () => {
  describe("GET /", () => {
    it("should return api status", async () => {
      const res = await request(app).get("/").expect(200);

      expect(res.body).toEqual({
        status: "success",
        message: "API is running",
      });
    });
  });
});

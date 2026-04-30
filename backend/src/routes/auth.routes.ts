import { Router } from "express";
import {login, register } from "../controllers/auth.controller.js";
import {
  validateLoginBody,
  validateRegisterBody,
} from "../validations/auth.validation.js";
import { authRateLimiter } from "../middlewares/rate-limit.middleware.js";


const authRouter = Router();

authRouter.post("/register", authRateLimiter, validateRegisterBody, register);
authRouter.post("/login", authRateLimiter, validateLoginBody, login);

export default authRouter;
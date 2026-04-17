import { Router } from "express";
import {login, register } from "../controllers/auth.controller.js";
import {
  validateLoginBody,
  validateRegisterBody,
} from "../validations/auth.validation.js";


const authRouter = Router();

authRouter.post("/register", validateRegisterBody, register);
authRouter.post("/login", validateLoginBody, login);

export default authRouter;
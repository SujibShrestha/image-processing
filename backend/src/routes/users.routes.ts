import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { deleteUser, getAllUser, getMe, updateMe } from "../controllers/users.controller.js";
import { validateUpdateUserProfileBody } from "../validations/users.validation.js";

const usersRouter = Router();

usersRouter.get("/:id", requireAuth, getMe);
usersRouter.patch("/:id", requireAuth, validateUpdateUserProfileBody, updateMe);
usersRouter.get("/",getAllUser)
usersRouter.delete("/:id",requireAuth,deleteUser)

export default usersRouter;
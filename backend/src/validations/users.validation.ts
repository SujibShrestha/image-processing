import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

export const updateUserProfileSchema = z
	.object({
		name: z
			.string()
			.trim()
			.min(1, "Name cannot be empty.")
			.max(100, "Name must be at most 100 characters long.")
			.optional(),
		avatar: z.string().url("Avatar must be a valid URL.").optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field is required.",
	});

export const validateUpdateUserProfileBody = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const result = updateUserProfileSchema.safeParse(req.body);

	if (!result.success) {
		const errors = result.error.issues.map((issue) => ({
			field: issue.path.join("."),
			message: issue.message,
		}));

		return res.status(400).json({
			message: "Validation failed.",
			errors,
		});
	}

	return next();
};
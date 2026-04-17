import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

// Zod schemas for auth
export const registerSchema = z.object({
	email: z.string().email("Invalid email format."),
	password: z.string().min(8, "Password must be at least 8 characters long."),
	name: z.string().optional(),
	avatar: z.string().url("Avatar must be a valid URL.").optional(),
});

export const loginSchema = z.object({
	email: z.string().email("Invalid email format."),
	password: z.string().min(1, "Password is required."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const validateRegisterBody = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const result = registerSchema.safeParse(req.body);

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

export const validateLoginBody = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const result = loginSchema.safeParse(req.body);

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

// Helper function for manual Zod validation
export const validateWithZod = <T,>(schema: z.ZodSchema<T>, data: unknown) => {
	const result = schema.safeParse(data);
	return result;
};
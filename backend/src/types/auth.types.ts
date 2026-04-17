import type { Request } from "express";

export type AuthRequest = Request & {
	user?: {
		id: number;
		email: string;
	};
};

export type JwtPayload = {
	id: number;
	email: string;
};
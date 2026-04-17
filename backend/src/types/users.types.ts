import type { Request } from "express";

export type UpdateUserProfileBody = {
	name?: string;
	avatar?: string;
};

export type UsersRequest = Request & {
	user?: {
		id: number;
		email: string;
	};
};
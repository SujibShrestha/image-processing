import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/db.js";
import logger from "../utils/logger.js";
import type { UpdateUserProfileBody, UsersRequest } from "../types/users.types.js";

const userSelect = {
	id: true,
	email: true,
	name: true,
	avatar: true,
	createdAt: true,
} as const;

export const getMe = async (
	req: UsersRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		if (!req.user) {
			return res.status(401).json({ message: "Unauthorized." });
		}

		const user = await prisma.user.findUnique({
			where: { id: req.user.id },
			select: userSelect,
		});

		if (!user) {
			return res.status(404).json({ message: "User not found." });
		}

		return res.status(200).json({
			message: "User profile retrieved successfully.",
			user,
		});
	} catch (error) {
		logger.error({
			message: "Failed to fetch current user.",
			error: error instanceof Error ? error.message : "Unknown error",
		});

		return next(error);
	}
};

export const updateMe = async (
	req: UsersRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		if (!req.user) {
			return res.status(401).json({ message: "Unauthorized." });
		}

		const { name, avatar } = req.body as UpdateUserProfileBody;

		const user = await prisma.user.update({
			where: { id: req.user.id },
			data: {
				...(name !== undefined ? { name } : {}),
				...(avatar !== undefined ? { avatar } : {}),
			},
			select: userSelect,
		});

		return res.status(200).json({
			message: "User profile updated successfully.",
			user,
		});
	} catch (error) {
		logger.error({
			message: "Failed to update current user.",
			error: error instanceof Error ? error.message : "Unknown error",
		});

		return next(error);
	}
};

export const getAllUser = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: userSelect,
    });

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });

  } catch (error) {
    logger.error("Error fetching users:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

export const deleteUser = async(req:UsersRequest,res:Response)=>{
    try {
        if (!req.user) {
			return res.status(401).json({ message: "Unauthorized." });
		}

        const user = await prisma.user.findFirst({where:{id:req.user.id}})

        if(!user){
            logger.info("User doesnt Exists")
            throw new Error("User doesnt Exists")
        }

        const removingUser = await prisma.user.delete({where:{id:req.user.id}})

        if(!removingUser)res.status(500).json("Unable to Delete the user or User already Deleted")
        
       return res.status(200).json({
        success:true,
        message:"User deleted Successfully"
       })

    } catch (error) {
         logger.error("Error deleting users:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
    }
}
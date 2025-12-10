import bcrypt from "bcryptjs";
import prisma from "../../utils/prismaClient.js";
import { ApiError } from "../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import { signToken } from "../../utils/helper.js";
import{ROLE_CREATION_RULES} from "../../constant.js"
export class AuthService {
  async addingUser({ email, password, name, role: roleName, requestedBy }) {
    
  
    const creator = await prisma.user.findUnique({
      where: { id: requestedBy },
      include: { role: true },
    });

    if (!creator) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");
    }

    const creatorRole = creator.role?.name;


    const allowedRoles = ROLE_CREATION_RULES[creatorRole] || [];

    if (!allowedRoles.includes(roleName)) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        `Users with role '${creatorRole}' cannot create '${roleName}'`
      );
    }


    if (roleName === "Admin") {
      const existingAdmin = await prisma.user.findFirst({
        where: { role: { name: "Admin" } },
      });
      if (existingAdmin) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "An Admin account already exists"
        );
      }
    }

    // 4. Email check
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Email already registered");
    }


    const hashedPassword = await bcrypt.hash(password, 10);


    const roleRecord = await prisma.role.findUnique({
      where: { name: roleName },
    });
    if (!roleRecord) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Role not found");
    }

  
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: { connect: { id: roleRecord.id } },
      },
      include: { role: true },
    });

    return user;
  }


  async login({ email, password }) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
    }

    const token = signToken({ id: user.id, email: user.email });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role ? user.role.name : null,
        createdAt: user.createdAt,
      },
    };
  }

  async deleteUser(userId) {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  if (!existingUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  // Prevent deleting the only admin
  if (existingUser.role?.name === "Admin") {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Admin account cannot be deleted"
    );
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  return true;
}

async getAllUsers({ requesterId, isAdmin }) {
  const whereClause = isAdmin ? {} : { requestedBy: requesterId };

  const users = await prisma.user.findMany({
    where: whereClause,
    include: { role: true },
    orderBy: { createdAt: "desc" },
  });

  return users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role ? user.role.name : null,
    createdAt: user.createdAt,
  }));
}


}

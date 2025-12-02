import bcrypt from "bcryptjs";
import prisma from "../../utils/prismaClient.js";
import { ApiError } from "../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import { signToken } from "../../utils/helper.js";

export class AuthService {
  async signup({ email, password, name, role: roleName }) { // rename argument to roleName
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

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new ApiError(StatusCodes.BAD_REQUEST, "Email already registered");

    const hashedPassword = await bcrypt.hash(password, 10);

 let roleRecord = null;
if (roleName) {
  roleRecord = await prisma.role.findUnique({ where: { name: roleName } });
  if (!roleRecord) throw new ApiError(StatusCodes.BAD_REQUEST, "Role not found");
}

const user = await prisma.user.create({
  data: {
    name,                  
    email,
    password: hashedPassword,
    role: roleRecord ? { connect: { id: roleRecord.id } } : undefined,
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

async getAllUsers() {
  const users = await prisma.user.findMany({
    include: { role: true },
    orderBy: { createdAt: 'desc' }, // optional: newest first
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role ? user.role.name : null,
    createdAt: user.createdAt,
  }));
}


}

import bcrypt from "bcryptjs";
import prisma from "../../utils/prismaClient.js";
import { ApiError } from "../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import { signToken } from "../../utils/helper.js";

export class AuthService {
  async signup({ email, password, name, role: roleName }) { // rename argument to roleName
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
}

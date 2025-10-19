import bcrypt from "bcryptjs";
import  prisma from "../../utils/prismaClient.js";
import { ApiError } from "../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import { signToken } from "../../utils/helper.js";

export class AuthService {
 async signup(data) {
  const { email, password, fullName, roleName } = data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  
  let role;
  if (roleName) {
    role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Role not found");
    }
  }


const user = await prisma.user.create({
  data: {
    name: fullName,
    email,
    password: hashedPassword,
    roles: role
      ? {
          create: [
            {
              roleId: role.id,
            },
          ],
        }
      : undefined,
  },
  include: {
    roles: { include: { role: true } },
  },
});

  return user;
}

   async login(data) {
    const { email, password } = data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { roles: { include: { role: true } } },
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
        fullName: user.fullName,
        roles: user.roles.map((r) => r.role.name),
      },
    };
  }
}

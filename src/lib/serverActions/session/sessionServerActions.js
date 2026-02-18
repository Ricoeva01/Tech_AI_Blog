"use server";
import { Session } from "@/lib/models/session";
import { User } from "@/lib/models/user";
import { connectToDB } from "@/lib/utils/db/connectDB";
import AppError from "@/lib/utils/errorHandling/customError";
import bcrypt from "bcryptjs";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import slugify from "slugify";

export async function register(formData) {
  const { userName, email, password, passwordRepeat } =
    Object.fromEntries(formData);

  try {
    //check password strong ability
    if (typeof userName !== "string" || userName.trim().length < 3) {
      throw new AppError("Username must be at least 3 characters long.");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof email !== "string" || !emailRegex.test(email)) {
      throw new AppError("Invalid email address.");
    }
    if (typeof password !== "string" || password.trim().length < 6) {
      throw new AppError("Password must be at least 6 characters long.");
    }
    if (typeof password !== "string" || password.trim().length > 50) {
      throw new AppError("Password must be less than 50 characters long.");
    }
    if (password !== passwordRepeat) {
      throw new AppError("Passwords do not match.");
    }
    connectToDB(); // Ensure the database connection is established before importing the User model
    const existingUser = await User.findOne({ $or: [{ userName }, { email }] });
    if (existingUser) {
      throw new AppError(
        existingUser.userName === userName
          ? "Username already exists."
          : "Email already exists.",
      );
    }
    const normalizedUserName = slugify(userName, { lower: true, strict: true });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create and save the new user
    const newUser = new User({
      userName,
      normalizedUserName,
      email,
      password: hashedPassword,
    });
    await newUser.save();
    console.log("user saved to db");
    return { success: true };
  } catch (error) {
    console.error("Error registering user:", error);
    if (error instanceof AppError) {
      throw error; // Re-throw custom errors to be handled by the caller
    } else {
      throw new AppError("Failed to register user"); // Wrap other errors in a generic AppError
    }
  }
}

export async function login(formData) {
  const { userName, password } = Object.fromEntries(formData);
  try {
    await connectToDB();
    const user = await User.findOne({ userName: userName });
    if (!user) {
      throw new Error("Invalid credentials");
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }
    let session;
    const existingSession = await Session.findOne({
      userId: user._id,
      expiresAt: { $gt: new Date() },
    });

    const sessionExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (existingSession) {
      session = existingSession;
      existingSession.expiresAt = sessionExpires;
      await existingSession.save();
    } else {
      session = new Session({
        userId: user._id,
        expiresAt: sessionExpires,
      });
      await session.save();
    }

    (await cookies()).set("sessionId", session._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: sessionExpires,
      sameSite: "lax",
      path: "/",
    });
    revalidateTag("auth-session");
    return { success: true, userId: user._id.toString() };
  } catch (error) {
    console.error("Error while login user:", error);
    throw new Error("Failed to login user: " + error.message);
  }
}

export async function logout() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("sessionId")?.value;
  if (!sessionId) {
    return { success: true }; // No session to log out from
  }
  try {
    await Session.findByIdAndDelete(sessionId);
  } catch (error) {
    console.error("Error deleting session from DB:", error);
    // Don't throw here, still try to delete the cookie
  }

  cookieStore.set("sessionId", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    sameSite: "strict",
  });
  revalidateTag("auth-session");

  return { success: true };
}

export async function ServerActionSessionInfo() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("sessionId")?.value;
  if (!sessionId) {
    return { success: false, userId: null };
  }
  await connectToDB();
  const session = await Session.findById(sessionId);
  if (!session || session.expiresAt < new Date()) {
    return { success: false, userId: null };
  }
  const user = await User.findById(session.userId);
  if (!user) {
    return { success: false, userId: null };
  }
  return {
    success: true,
    userId: user._id.toString(),
  };
}

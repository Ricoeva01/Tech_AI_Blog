import { Session } from "@/lib/models/session";
import { User } from "@/lib/models/user";
import { connectToDB } from "@/lib/utils/db/connectDB";
import { cookies } from "next/headers";

export async function sessionInfo() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("sessionId")?.value;
  if (!sessionId) {
    return { success: false };
  }
  await connectToDB();
  const session = await Session.findById(sessionId);
  if (!session || session.expiresAt < new Date()) {
    return { success: false };
  }
  const user = await User.findById(session.userId);
  if (!user) {
    return { success: false };
  }
  return {
    success: true,
    userId: user._id.toString(),
  };
}

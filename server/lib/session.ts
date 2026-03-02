import { SessionOptions } from "iron-session";

export interface SessionData {
  adminId: string;
  role: string;
  name: string;
  createdAt: number;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "nova_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "strict" as const,
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  },
};

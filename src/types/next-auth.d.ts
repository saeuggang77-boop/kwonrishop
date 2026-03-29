import { UserRole } from "@/generated/prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      roleSelected: boolean;
      verified: boolean;
      phone: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyEmailChange } from "@/lib/email-verification";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const searchParams = new URL(request.url).searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return new NextResponse("Token is required", { status: 400 });
    }

    try {
      const result = await verifyEmailChange(token, session.user.id);

      // Set cookie to expire the session
      const cookie = `next-auth.session-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`;

      // Redirect to login page with success message and clear session
      return new Response(null, {
        status: 302,
        headers: {
          'Location': '/login?emailUpdated=true',
          'Set-Cookie': cookie
        },
      });
    } catch (error) {
      console.error("Email verification failed:", error);
      return new NextResponse(
        error instanceof Error ? error.message : "Failed to verify email",
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Internal server error:", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal error",
      { status: 500 }
    );
  }
} 
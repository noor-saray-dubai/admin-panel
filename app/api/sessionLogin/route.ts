import { signInWithEmailAndPassword } from "firebase/auth";
import { adminAuth } from "@/lib/firebaseAdmin";
import { auth } from "@/firebase"; // adjust path as needed

export async function POST(req: Request) {
  try {
    const { email, password, rememberMe } = await req.json();

    // Sign in using Firebase Client SDK (backend-side)
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();

    // Set session expiration (e.g. 5 days if rememberMe else 1 day)
    const expiresIn = rememberMe
      ? 60 * 60 * 24 * 5 * 1000 // 5 days in ms
      : 60 * 60 * 24 * 1 * 1000; // 1 day in ms

    // Create session cookie from ID token
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Create Set-Cookie header value (using 'cookie' package helps, or do manual)
    // Here’s a manual example:
    const cookieValue = `__session=${sessionCookie}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${
      expiresIn / 1000
    };${process.env.NODE_ENV === "production" ? " Secure;" : ""}`;

    // Return response with Set-Cookie header
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookieValue,
      },
    });
  } catch (error) {
    console.error("Session login error:", error);
    return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
  }
}

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    server: process.env.NEXT_PUBLIC_ACKEE_SERVER || process.env.ACKEE_SERVER || "",
    domainId: process.env.NEXT_PUBLIC_ACKEE_DOMAIN_ID || process.env.ACKEE_DOMAIN_ID || "",
  });
}

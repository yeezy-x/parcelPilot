import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const accounts = await prisma.account.findMany({
      select: {
        accountId: true,
        name: true,
        plan: true,
        status: true,
      },
      orderBy: {
        accountId: "asc",
      },
    });
    return NextResponse.json({
      ok: true,
      database: "connected",
      accounts,
    });
  } catch (error: any) {
    console.error("Database health check failed:", error);
  
    return NextResponse.json(
      {
        ok: false,
        database: "disconnected",
        errorMessage: error?.message,
        errorCode: error?.code,
      },
      { status: 500 },
    );
  }
}
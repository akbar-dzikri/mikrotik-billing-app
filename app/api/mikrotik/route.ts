// app/api/mikrotik/route.ts
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-helpers"

export async function POST(request: Request) {
    await getSession(request);

    try {
        const { username, password } = await request.json()

        // Server Next.js nembak MikroTik (Bebas dari CORS)
        const req = await fetch(`${process.env.NEXT_PUBLIC_MIKROTIK_URL}/rest/system/resource`, {
            method: "GET",
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
                'Content-Type': 'application/json'
            }
        })

        if (!req.ok) {
            return NextResponse.json({ error: "Failed to fetch MikroTik" }, { status: req.status })
        }

        const data = await req.json()
        return NextResponse.json(data)
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal server error";
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
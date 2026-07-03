// app/api/mikrotik/route.ts
import { NextResponse } from "next/server"

export async function POST(request: Request) {
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
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
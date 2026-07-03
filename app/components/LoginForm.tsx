'use client'

import { useState } from "react"

export function LoginForm() {
    const [result, setResult] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(false)

    async function submitForm(formData: FormData) {
        setIsLoading(true)
        const username = formData.get("username") as string
        const password = formData.get("password") as string

        if (!username || !password) {
            setResult({ error: "Username and password are required" })
            setIsLoading(false)
            return
        }

        try {
            // Catatan: Pastikan MIKROTIK_URL sudah di-map ke env yang bisa dibaca client atau ganti string langsung buat PoC
            const req = await fetch('/api/mikrotik/', {
                method: "POST",
                body: JSON.stringify({ username, password })
            })

            if (!req.ok) {
                setResult({ status: req.status, statusText: req.statusText })
                return
            }

            const res = await req.json()
            setResult(res)
        } catch (error: any) {
            // Biasanya bakal mentok di CORS error kalau MikroTik belum di-allow origin-nya
            setResult({ error: error.message || "Network error / CORS issue" })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form className="flex flex-col gap-2 max-w-sm p-4" action={submitForm}>
            <h1 className="text-xl font-bold">MikroTik REST API Test</h1>

            <label className="flex flex-col gap-1" htmlFor="mikrotik-username">
                Username:
                <input
                    className="border p-1 rounded text-black"
                    type="text"
                    id="mikrotik-username"
                    name="username" // Dibutuhkan oleh FormData
                    required
                />
            </label>

            <label className="flex flex-col gap-1" htmlFor="mikrotik-password">
                Password:
                <input
                    className="border p-1 rounded text-black"
                    type="password" // Diubah ke password biar mask-ed
                    id="mikrotik-password"
                    name="password" // Dibutuhkan oleh FormData
                    required
                />
            </label>

            <button
                className="bg-blue-500 text-white p-2 rounded disabled:bg-gray-400"
                type="submit"
                disabled={isLoading}
            >
                {isLoading ? "Connecting..." : "Submit"}
            </button>

            <div className="mt-4 p-2 bg-gray-100 rounded text-black font-mono text-xs overflow-auto max-h-60">
                <span className="font-bold text-gray-700">Result:</span>
                <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
        </form>
    )
}
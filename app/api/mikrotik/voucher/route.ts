import { NextRequest, NextResponse } from "next/server";

function getAuthHeader(): string {
  const user = process.env.MIKROTIK_USER;
  const password = process.env.MIKROTIK_PASSWORD;
  return "Basic " + Buffer.from(`${user}:${password}`).toString("base64");
}

const BASE_URL = process.env.NEXT_PUBLIC_MIKROTIK_URL + "/rest/ip/hotspot/user";

async function mikrotikFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `MikroTik responded with ${res.status}`);
  }

  return res;
}

export async function GET(request: NextRequest) {
  try {
    const mikrotikRes = await mikrotikFetch("");
    const data = await mikrotikRes.json();

    return NextResponse.json({ status: "success", data });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { status: "error", message, code: 500 },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mikrotikRes = await mikrotikFetch("", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await mikrotikRes.json();

    return NextResponse.json({ status: "success", data }, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { status: "error", message, code: 500 },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { status: "error", message: "Voucher id is required", code: 400 },
        { status: 400 },
      );
    }

    const mikrotikRes = await mikrotikFetch(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    const data = await mikrotikRes.json();

    return NextResponse.json({ status: "success", data });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { status: "error", message, code: 500 },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { status: "error", message: "Voucher id is required", code: 400 },
        { status: 400 },
      );
    }

    await mikrotikFetch(`/${id}`, { method: "DELETE" });

    return NextResponse.json(
      { status: "success", data: null },
      { status: 204 },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { status: "error", message, code: 500 },
      { status: 500 },
    );
  }
}

import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export async function GET(request: NextRequest, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    const { attemptId } = await params

    if (!attemptId) {
      return NextResponse.json({ error: "attemptId is required" }, { status: 400 })
    }

    const response = await fetch(`${BACKEND_URL}/api/attempt/${attemptId}`)
    
    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`)
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Get attempt error:", error)
    return NextResponse.json({ error: "Failed to get attempt" }, { status: 500 })
  }
}

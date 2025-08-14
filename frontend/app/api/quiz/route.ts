import { NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/quiz`)
    
    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`)
    }
    
    const questions = await response.json()
    return NextResponse.json(questions)
  } catch (error) {
    console.error("Failed to fetch questions from backend:", error)
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"

// In-memory storage for quiz attempts
const attempts = new Map<
  string,
  {
    attemptId: string
    answers: Array<{ questionId: number; selectedIndex: number }>
    remainingSec: number
    isFinished: boolean
    lastSaved: number
  }
>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { attemptId, answers, remainingSec } = body

    if (!attemptId) {
      return NextResponse.json({ error: "attemptId is required" }, { status: 400 })
    }

    // Save the attempt state
    attempts.set(attemptId, {
      attemptId,
      answers: answers || [],
      remainingSec: remainingSec || 60,
      isFinished: false,
      lastSaved: Date.now(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Save attempt error:", error)
    return NextResponse.json({ error: "Failed to save attempt" }, { status: 500 })
  }
}

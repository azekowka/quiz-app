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

export async function GET(request: NextRequest, { params }: { params: { attemptId: string } }) {
  try {
    const { attemptId } = params

    if (!attemptId) {
      return NextResponse.json({ error: "attemptId is required" }, { status: 400 })
    }

    // Get saved attempt or return default state
    const savedAttempt = attempts.get(attemptId)

    if (!savedAttempt) {
      return NextResponse.json({
        answers: [],
        remainingSec: 60,
        isFinished: false,
      })
    }

    return NextResponse.json({
      answers: savedAttempt.answers,
      remainingSec: savedAttempt.remainingSec,
      isFinished: savedAttempt.isFinished,
    })
  } catch (error) {
    console.error("Get attempt error:", error)
    return NextResponse.json({ error: "Failed to get attempt" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"

// Questions data with correct answers
const questions = [
  { id: 1, body: "2 + 2 = ?", options: ["1", "2", "3", "4"], correctIndex: 3 },
  { id: 2, body: "Столица Казахстана?", options: ["Алматы", "Астана", "Шымкент", "Караганда"], correctIndex: 1 },
  { id: 3, body: "Сколько дней в неделе?", options: ["5", "6", "7", "8"], correctIndex: 2 },
  {
    id: 4,
    body: "Какой цвет получится при смешении красного и синего?",
    options: ["Зеленый", "Фиолетовый", "Желтый", "Оранжевый"],
    correctIndex: 1,
  },
  { id: 5, body: "Сколько месяцев в году?", options: ["10", "11", "12", "13"], correctIndex: 2 },
  {
    id: 6,
    body: "Какая планета ближайшая к Солнцу?",
    options: ["Венера", "Земля", "Меркурий", "Марс"],
    correctIndex: 2,
  },
  { id: 7, body: "Сколько сторон у треугольника?", options: ["2", "3", "4", "5"], correctIndex: 1 },
  {
    id: 8,
    body: "В каком году началась Вторая мировая война?",
    options: ["1938", "1939", "1940", "1941"],
    correctIndex: 1,
  },
  {
    id: 9,
    body: "Какой газ составляет большую часть атмосферы Земли?",
    options: ["Кислород", "Углекислый газ", "Азот", "Водород"],
    correctIndex: 2,
  },
  { id: 10, body: "Сколько континентов на Земле?", options: ["5", "6", "7", "8"], correctIndex: 2 },
]

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
    const { attemptId } = body

    if (!attemptId) {
      return NextResponse.json({ error: "attemptId is required" }, { status: 400 })
    }

    // Get existing attempt or create empty one
    const existingAttempt = attempts.get(attemptId) || {
      attemptId,
      answers: [],
      remainingSec: 0,
      isFinished: false,
      lastSaved: Date.now(),
    }

    const userAnswers = existingAttempt.answers
    const totalQuestions = questions.length
    let correctCount = 0
    let incorrectCount = 0

    // Check each user answer against correct answers
    userAnswers.forEach((userAnswer) => {
      const question = questions.find((q) => q.id === userAnswer.questionId)
      if (question) {
        if (question.correctIndex === userAnswer.selectedIndex) {
          correctCount++
        } else {
          incorrectCount++
        }
      }
    })

    const totalAnswered = userAnswers.length
    const unansweredCount = totalQuestions - totalAnswered
    const correctPercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0
    const incorrectPercentage = totalQuestions > 0 ? Math.round((incorrectCount / totalQuestions) * 100) : 0

    const results = {
      totalQuestions,
      totalAnswered,
      correctCount,
      incorrectCount,
      correctPercentage,
      incorrectPercentage,
      unansweredCount,
    }

    // Mark attempt as finished
    attempts.set(attemptId, {
      ...existingAttempt,
      isFinished: true,
      lastSaved: Date.now(),
    })

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error("Finish attempt error:", error)
    return NextResponse.json({ error: "Failed to finish attempt" }, { status: 500 })
  }
}

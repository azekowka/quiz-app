"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, RotateCcw, WifiOff } from "lucide-react"
import { QuizQuestion } from "./quiz-question"
import { QuizStatus } from "./quiz-status"
import { QuizResults } from "./quiz-results"

interface Question {
  id: number
  body: string
  options: string[]
  correctIndex: number
}

interface Answer {
  questionId: number
  selectedIndex: number
}

interface QuizState {
  questions: Question[]
  answers: Answer[]
  remainingSec: number
  isFinished: boolean
  attemptId: string
  results?: {
    totalQuestions: number
    totalAnswered: number
    correctCount: number
    incorrectCount: number
    correctPercentage: number
    incorrectPercentage: number
    unansweredCount: number
  }
}

export function QuizContainer() {
  const [state, setState] = useState<QuizState>({
    questions: [],
    answers: [],
    remainingSec: 60,
    isFinished: false,
    attemptId: "",
    results: undefined,
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")
  const [isRecovering, setIsRecovering] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const autoSaveIntervalRef = useRef<NodeJS.Timeout>()
  const lastSaveTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Initialize or get existing attempt ID
  useEffect(() => {
    let attemptId = localStorage.getItem("quiz-attempt-id")
    if (!attemptId) {
      attemptId = `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem("quiz-attempt-id", attemptId)
    }
    setState((prev) => ({ ...prev, attemptId }))
  }, [])

  // Load questions and restore state
  useEffect(() => {
    if (!state.attemptId) return

    const loadQuiz = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load questions
        const questionsResponse = await fetch("/api/quiz")
        if (!questionsResponse.ok) throw new Error("Не удалось загрузить вопросы")
        const questions = await questionsResponse.json()

        // Try to restore previous state
        setIsRecovering(true)
        const stateResponse = await fetch(`/api/attempt/${state.attemptId}`)
        if (!stateResponse.ok) throw new Error("Не удалось загрузить сохраненное состояние")
        const savedState = await stateResponse.json()

        let recoveredRemainingSec = savedState.remainingSec || 60
        let recoveredIsFinished = savedState.isFinished || false

        // If we have a saved state, check if we need to adjust the timer
        if (savedState.answers && savedState.answers.length > 0) {
          // Get the last save timestamp from localStorage
          const lastSaveTime = localStorage.getItem(`quiz-last-save-${state.attemptId}`)
          if (lastSaveTime && !recoveredIsFinished) {
            const timePassed = Math.floor((Date.now() - Number.parseInt(lastSaveTime)) / 1000)
            recoveredRemainingSec = Math.max(0, recoveredRemainingSec - timePassed)

            // If time ran out while away, mark as finished
            if (recoveredRemainingSec <= 0) {
              recoveredIsFinished = true
              // Finish the quiz on the server
              try {
                await fetch("/api/attempt/finish", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ attemptId: state.attemptId }),
                })
              } catch (err) {
                console.error("Failed to finish quiz on recovery:", err)
              }
            }
          }
        }

        setState((prev) => ({
          ...prev,
          questions,
          answers: savedState.answers || [],
          remainingSec: recoveredRemainingSec,
          isFinished: recoveredIsFinished,
        }))

        lastSaveTimeRef.current = Date.now()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Произошла неизвестная ошибка")
      } finally {
        setLoading(false)
        setIsRecovering(false)
      }
    }

    loadQuiz()
  }, [state.attemptId])

  const saveToServer = useCallback(async () => {
    if (!state.attemptId || state.isFinished || !isOnline) return

    try {
      setSaveStatus("saving")
      const response = await fetch("/api/attempt/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attemptId: state.attemptId,
          answers: state.answers,
          remainingSec: state.remainingSec,
        }),
      })

      if (!response.ok) throw new Error("Failed to save")

      localStorage.setItem(`quiz-last-save-${state.attemptId}`, Date.now().toString())
      lastSaveTimeRef.current = Date.now()

      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 2000)
    } catch (err) {
      console.error("Save failed:", err)
      setSaveStatus("idle")
    }
  }, [state.attemptId, state.answers, state.remainingSec, state.isFinished, isOnline])

  const finishQuiz = useCallback(async () => {
    if (state.isFinished) return

    try {
      if (isOnline) {
        const response = await fetch("/api/attempt/finish", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            attemptId: state.attemptId,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setState((prev) => ({
            ...prev,
            isFinished: true,
            results: data.results,
          }))
        } else {
          setState((prev) => ({ ...prev, isFinished: true }))
        }
      } else {
        setState((prev) => ({ ...prev, isFinished: true }))
      }
    } catch (err) {
      console.error("Failed to finish quiz:", err)
      // Still mark as finished locally
      setState((prev) => ({ ...prev, isFinished: true }))
    }
  }, [state.attemptId, state.isFinished, isOnline])

  const handleSubmit = () => {
    finishQuiz()
  }

  const handleAnswerSelect = (questionId: number, selectedIndex: number) => {
    if (state.isFinished) return

    setState((prev) => {
      const newAnswers = prev.answers.filter((a) => a.questionId !== questionId)
      newAnswers.push({ questionId, selectedIndex })
      return { ...prev, answers: newAnswers }
    })
  }

  const getAnswerForQuestion = (questionId: number): number | undefined => {
    return state.answers.find((a) => a.questionId === questionId)?.selectedIndex
  }

  const getAnsweredCount = () => {
    return state.answers.length
  }

  const retry = () => {
    // Clear all stored data for this attempt
    localStorage.removeItem("quiz-attempt-id")
    localStorage.removeItem(`quiz-last-save-${state.attemptId}`)
    window.location.reload()
  }

  const startNewQuiz = () => {
    // Clear current attempt data
    localStorage.removeItem("quiz-attempt-id")
    localStorage.removeItem(`quiz-last-save-${state.attemptId}`)

    // Generate new attempt ID
    const newAttemptId = `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem("quiz-attempt-id", newAttemptId)

    // Reset state
    setState({
      questions: state.questions,
      answers: [],
      remainingSec: 60,
      isFinished: false,
      attemptId: newAttemptId,
      results: undefined,
    })
  }

  // Timer countdown effect
  useEffect(() => {
    if (state.isFinished || state.remainingSec <= 0) return

    const timer = setInterval(() => {
      setState((prev) => {
        const newRemainingSec = prev.remainingSec - 1
        if (newRemainingSec <= 0) {
          // Time's up - finish the quiz
          finishQuiz()
          return { ...prev, remainingSec: 0, isFinished: true }
        }
        return { ...prev, remainingSec: newRemainingSec }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [state.isFinished, state.remainingSec, finishQuiz])

  // Autosave every 5 seconds
  useEffect(() => {
    if (state.isFinished) return

    autoSaveIntervalRef.current = setInterval(() => {
      saveToServer()
    }, 5000)

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current)
      }
    }
  }, [saveToServer, state.isFinished])

  // Debounced autosave on answer changes
  useEffect(() => {
    if (state.answers.length === 0) return

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(() => {
      saveToServer()
    }, 500)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [state.answers, saveToServer])

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>{isRecovering ? "Восстановление состояния..." : "Загрузка квиза..."}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="py-8">
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Проверьте подключение к интернету и попробуйте снова</p>
            <Button onClick={retry}>Повторить</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Connection status */}
      {!isOnline && (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            Нет подключения к интернету. Ответы будут сохранены локально и отправлены при восстановлении связи.
          </AlertDescription>
        </Alert>
      )}

      {/* Quiz status */}
      <QuizStatus
        remainingSec={state.remainingSec}
        answeredCount={getAnsweredCount()}
        totalQuestions={state.questions.length}
        isFinished={state.isFinished}
        saveStatus={saveStatus}
      />

      {state.isFinished && state.results ? (
        <div className="space-y-6">
          <QuizResults results={state.results} />
          <div className="text-center">
            <Button onClick={startNewQuiz} variant="outline" size="lg">
              <RotateCcw className="h-4 w-4 mr-2" />
              Пройти новый квиз
            </Button>
          </div>
        </div>
      ) : state.isFinished ? (
        // Fallback for finished quiz without results
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {state.remainingSec <= 0
                ? `Время вышло! Квиз завершен. Отмечено ответов: ${getAnsweredCount()}/10`
                : `Квиз завершен! Отмечено ответов: ${getAnsweredCount()}/10`}
            </span>
            <Button onClick={startNewQuiz} variant="outline" size="sm" className="ml-4 bg-transparent">
              <RotateCcw className="h-4 w-4 mr-2" />
              Новый квиз
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Questions */}
          <div className="space-y-4">
            {state.questions.map((question, index) => (
              <QuizQuestion
                key={question.id}
                question={question}
                questionNumber={index + 1}
                selectedIndex={getAnswerForQuestion(question.id)}
                onAnswerSelect={handleAnswerSelect}
                disabled={state.isFinished}
              />
            ))}
          </div>

          <div className="text-center pt-4">
            <Button
              onClick={handleSubmit}
              size="lg"
              className="min-w-[200px]"
              disabled={state.isFinished || getAnsweredCount() === 0}
            >
              Отправить результаты
            </Button>
            <p className="text-sm text-muted-foreground mt-2">Отвечено: {getAnsweredCount()}/10 вопросов</p>
          </div>
        </>
      )}
    </div>
  )
}

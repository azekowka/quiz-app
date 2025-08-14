"use client"

import { useEffect, useCallback, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, RotateCcw, WifiOff } from "lucide-react"
import { QuizQuestion } from "./quiz-question"
import { QuizStatus } from "./quiz-status"
import { QuizResults } from "./quiz-results"
import { useQuizStore } from "@/lib/quiz-store"

export function QuizContainer() {
  const {
    questions,
    answers,
    remainingSec,
    isFinished,
    attemptId,
    results,
    loading,
    error,
    saveStatus,
    isRecovering,
    isOnline,
    setQuestions,
    setAnswers,
    addAnswer,
    setRemainingSec,
    decrementTime,
    setIsFinished,
    setAttemptId,
    setResults,
    setLoading,
    setError,
    setSaveStatus,
    setIsRecovering,
    setIsOnline,
    reset,
    getAnswerForQuestion,
    getAnsweredCount,
  } = useQuizStore()

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
    let storedAttemptId = localStorage.getItem("quiz-attempt-id")
    if (!storedAttemptId) {
      storedAttemptId = `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem("quiz-attempt-id", storedAttemptId)
    }
    setAttemptId(storedAttemptId)
  }, [setAttemptId])

  // Load questions and restore state
  useEffect(() => {
    if (!attemptId) return

    const loadQuiz = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load questions
        const questionsResponse = await fetch("/api/quiz")
        if (!questionsResponse.ok) throw new Error("Не удалось загрузить вопросы")
        const questionsData = await questionsResponse.json()
        setQuestions(questionsData)

        // Try to restore previous state
        setIsRecovering(true)
        const stateResponse = await fetch(`/api/attempt/${attemptId}`)
        if (!stateResponse.ok) throw new Error("Не удалось загрузить сохраненное состояние")
        const savedState = await stateResponse.json()

        let recoveredRemainingSec = savedState.remainingSec || 60
        let recoveredIsFinished = savedState.isFinished || false

        // If we have a saved state, check if we need to adjust the timer
        if (savedState.answers && savedState.answers.length > 0) {
          // Get the last save timestamp from localStorage
          const lastSaveTime = localStorage.getItem(`quiz-last-save-${attemptId}`)
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
                  body: JSON.stringify({ attemptId }),
                })
              } catch (err) {
                console.error("Failed to finish quiz on recovery:", err)
              }
            }
          }
        }

        setAnswers(savedState.answers || [])
        setRemainingSec(recoveredRemainingSec)
        setIsFinished(recoveredIsFinished)

        lastSaveTimeRef.current = Date.now()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Произошла неизвестная ошибка")
      } finally {
        setLoading(false)
        setIsRecovering(false)
      }
    }

    loadQuiz()
  }, [attemptId, setLoading, setError, setQuestions, setIsRecovering, setAnswers, setRemainingSec, setIsFinished])

  const saveToServer = useCallback(async () => {
    if (!attemptId || isFinished || !isOnline) return

    try {
      setSaveStatus("saving")
      const response = await fetch("/api/attempt/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attemptId,
          answers,
          remainingSec,
        }),
      })

      if (!response.ok) throw new Error("Failed to save")

      localStorage.setItem(`quiz-last-save-${attemptId}`, Date.now().toString())
      lastSaveTimeRef.current = Date.now()

      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 2000)
    } catch (err) {
      console.error("Save failed:", err)
      setSaveStatus("idle")
    }
  }, [attemptId, answers, remainingSec, isFinished, isOnline, setSaveStatus])

  const finishQuiz = useCallback(async () => {
    if (isFinished) return

    try {
      if (isOnline) {
        const response = await fetch("/api/attempt/finish", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            attemptId,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setIsFinished(true)
          setResults(data.results)
        } else {
          setIsFinished(true)
        }
      } else {
        setIsFinished(true)
      }
    } catch (err) {
      console.error("Failed to finish quiz:", err)
      // Still mark as finished locally
      setIsFinished(true)
    }
  }, [attemptId, isFinished, isOnline, setIsFinished, setResults])

  const handleSubmit = () => {
    finishQuiz()
  }

  const handleAnswerSelect = (questionId: number, selectedIndex: number) => {
    if (isFinished) return
    addAnswer({ questionId, selectedIndex })
  }

  const retry = () => {
    // Clear all stored data for this attempt
    localStorage.removeItem("quiz-attempt-id")
    localStorage.removeItem(`quiz-last-save-${attemptId}`)
    window.location.reload()
  }

  const startNewQuiz = () => {
    // Clear current attempt data
    localStorage.removeItem("quiz-attempt-id")
    localStorage.removeItem(`quiz-last-save-${attemptId}`)

    // Generate new attempt ID
    const newAttemptId = `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem("quiz-attempt-id", newAttemptId)

    // Reset state
    reset()
    setAttemptId(newAttemptId)
  }

  // Timer countdown effect
  useEffect(() => {
    if (isFinished || remainingSec <= 0) return

    const timer = setInterval(() => {
      decrementTime()
      if (remainingSec <= 1) {
        // Time's up - finish the quiz
        finishQuiz()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [isFinished, remainingSec, decrementTime, finishQuiz])

  // Autosave every 5 seconds
  useEffect(() => {
    if (isFinished) return

    autoSaveIntervalRef.current = setInterval(() => {
      saveToServer()
    }, 5000)

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current)
      }
    }
  }, [saveToServer, isFinished])

  // Debounced autosave on answer changes
  useEffect(() => {
    if (answers.length === 0) return

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
  }, [answers, saveToServer])

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
        remainingSec={remainingSec}
        answeredCount={getAnsweredCount()}
        totalQuestions={questions.length}
        isFinished={isFinished}
        saveStatus={saveStatus}
      />

      {isFinished && results ? (
        <div className="space-y-6">
          <QuizResults results={results} />
          <div className="text-center">
            <Button onClick={startNewQuiz} variant="outline" size="lg">
              <RotateCcw className="h-4 w-4 mr-2" />
              Пройти новый квиз
            </Button>
          </div>
        </div>
      ) : isFinished ? (
        // Fallback for finished quiz without results
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {remainingSec <= 0
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
            {questions.map((question, index) => (
              <QuizQuestion
                key={question.id}
                question={question}
                questionNumber={index + 1}
                selectedIndex={getAnswerForQuestion(question.id)}
                onAnswerSelect={handleAnswerSelect}
                disabled={isFinished}
              />
            ))}
          </div>

          <div className="text-center pt-4">
            <Button
              onClick={handleSubmit}
              size="lg"
              className="min-w-[200px]"
              disabled={isFinished || getAnsweredCount() === 0}
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

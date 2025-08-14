"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, AlertCircle } from "lucide-react"

interface QuizStatusProps {
  remainingSec: number
  answeredCount: number
  totalQuestions: number
  isFinished: boolean
  saveStatus: "idle" | "saving" | "saved"
}

export function QuizStatus({ remainingSec, answeredCount, totalQuestions, isFinished, saveStatus }: QuizStatusProps) {
  const progress = (answeredCount / totalQuestions) * 100
  const isLowTime = remainingSec <= 10 && !isFinished

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className={`h-4 w-4 ${isLowTime ? "text-red-500 animate-pulse" : "text-muted-foreground"}`} />
            <span className={`font-mono text-lg ${isLowTime ? "text-red-500 font-bold" : ""}`}>
              {Math.floor(remainingSec / 60)}:{(remainingSec % 60).toString().padStart(2, "0")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {saveStatus === "saving" && (
              <Badge variant="secondary" className="gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                Сохранение...
              </Badge>
            )}
            {saveStatus === "saved" && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Сохранено
              </Badge>
            )}

            <Badge variant={answeredCount === totalQuestions ? "default" : "outline"}>
              {answeredCount}/{totalQuestions}
            </Badge>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {isLowTime && (
          <div className="flex items-center gap-1 mt-2 text-red-500 text-sm">
            <AlertCircle className="w-3 h-3" />
            Время заканчивается!
          </div>
        )}
      </CardContent>
    </Card>
  )
}

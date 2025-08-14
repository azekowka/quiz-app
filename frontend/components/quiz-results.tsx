import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, HelpCircle } from "lucide-react"

interface QuizResults {
  totalQuestions: number
  totalAnswered: number
  correctCount: number
  incorrectCount: number
  correctPercentage: number
  incorrectPercentage: number
  unansweredCount: number
}

interface QuizResultsProps {
  results: QuizResults
}

export function QuizResults({ results }: QuizResultsProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">Результаты квиза</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall score */}
        <div className="text-center">
          <div className="text-4xl font-bold text-green-600 mb-2">{results.correctPercentage}%</div>
          <p className="text-lg text-muted-foreground">правильных ответов</p>
        </div>

        {/* Detailed breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-green-700">{results.correctCount}</div>
              <div className="text-sm text-green-600">Правильно ({results.correctPercentage}%)</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
            <XCircle className="h-8 w-8 text-red-600" />
            <div>
              <div className="text-2xl font-bold text-red-700">{results.incorrectCount}</div>
              <div className="text-sm text-red-600">Неправильно ({results.incorrectPercentage}%)</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <HelpCircle className="h-8 w-8 text-gray-600" />
            <div>
              <div className="text-2xl font-bold text-gray-700">{results.unansweredCount}</div>
              <div className="text-sm text-gray-600">Без ответа</div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-800">
            Вы ответили на <strong>{results.totalAnswered}</strong> из <strong>{results.totalQuestions}</strong>{" "}
            вопросов
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

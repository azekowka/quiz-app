"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Question {
  id: number
  body: string
  options: string[]
  correctIndex: number
}

interface QuizQuestionProps {
  question: Question
  questionNumber: number
  selectedIndex?: number
  onAnswerSelect: (questionId: number, selectedIndex: number) => void
  disabled?: boolean
}

export function QuizQuestion({
  question,
  questionNumber,
  selectedIndex,
  onAnswerSelect,
  disabled = false,
}: QuizQuestionProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">
          {questionNumber}. {question.body}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {question.options.map((option, index) => (
            <Button
              key={index}
              variant={selectedIndex === index ? "default" : "outline"}
              className={cn(
                "h-auto p-4 text-left justify-start whitespace-normal",
                selectedIndex === index && "ring-2 ring-primary ring-offset-2",
              )}
              onClick={() => onAnswerSelect(question.id, index)}
              disabled={disabled}
            >
              <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
              {option}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

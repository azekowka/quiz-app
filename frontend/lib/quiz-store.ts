import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

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

interface QuizResults {
  totalQuestions: number
  totalAnswered: number
  correctCount: number
  incorrectCount: number
  correctPercentage: number
  incorrectPercentage: number
  unansweredCount: number
}

interface QuizState {
  // State
  questions: Question[]
  answers: Answer[]
  remainingSec: number
  isFinished: boolean
  attemptId: string
  results?: QuizResults
  loading: boolean
  error: string | null
  saveStatus: "idle" | "saving" | "saved"
  isRecovering: boolean
  isOnline: boolean

  // Actions
  setQuestions: (questions: Question[]) => void
  setAnswers: (answers: Answer[]) => void
  addAnswer: (answer: Answer) => void
  setRemainingSec: (seconds: number) => void
  decrementTime: () => void
  setIsFinished: (finished: boolean) => void
  setAttemptId: (id: string) => void
  setResults: (results: QuizResults) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSaveStatus: (status: "idle" | "saving" | "saved") => void
  setIsRecovering: (recovering: boolean) => void
  setIsOnline: (online: boolean) => void
  reset: () => void
  getAnswerForQuestion: (questionId: number) => number | undefined
  getAnsweredCount: () => number
}

const initialState = {
  questions: [],
  answers: [],
  remainingSec: 60,
  isFinished: false,
  attemptId: "",
  results: undefined,
  loading: true,
  error: null,
  saveStatus: "idle" as const,
  isRecovering: false,
  isOnline: true,
}

export const useQuizStore = create<QuizState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setQuestions: (questions) => set({ questions }),
        
        setAnswers: (answers) => set({ answers }),
        
        addAnswer: (answer) => set((state) => {
          const newAnswers = state.answers.filter((a) => a.questionId !== answer.questionId)
          newAnswers.push(answer)
          return { answers: newAnswers }
        }),
        
        setRemainingSec: (seconds) => set({ remainingSec: seconds }),
        
        decrementTime: () => set((state) => ({
          remainingSec: Math.max(0, state.remainingSec - 1)
        })),
        
        setIsFinished: (finished) => set({ isFinished: finished }),
        
        setAttemptId: (id) => set({ attemptId: id }),
        
        setResults: (results) => set({ results }),
        
        setLoading: (loading) => set({ loading }),
        
        setError: (error) => set({ error }),
        
        setSaveStatus: (status) => set({ saveStatus: status }),
        
        setIsRecovering: (recovering) => set({ isRecovering: recovering }),
        
        setIsOnline: (online) => set({ isOnline: online }),
        
        reset: () => set({
          ...initialState,
          attemptId: `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          loading: false,
        }),
        
        getAnswerForQuestion: (questionId) => {
          const state = get()
          return state.answers.find((a) => a.questionId === questionId)?.selectedIndex
        },
        
        getAnsweredCount: () => {
          const state = get()
          return state.answers.length
        },
      }),
      {
        name: "quiz-storage",
        partialize: (state) => ({
          answers: state.answers,
          remainingSec: state.remainingSec,
          attemptId: state.attemptId,
          isFinished: state.isFinished,
        }),
      }
    ),
    {
      name: "quiz-store",
    }
  )
)
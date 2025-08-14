import { NextResponse } from "next/server"

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

export async function GET() {
  return NextResponse.json(questions)
}

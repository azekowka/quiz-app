from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import uuid
from datetime import datetime

app = FastAPI(title="Quiz API", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage
quiz_questions = [
    {"id": 1, "body": "2 + 2 = ?", "options": ["1", "2", "3", "4"], "correctIndex": 3},
    {"id": 2, "body": "Столица Казахстана?", "options": ["Алматы", "Астана", "Шымкент", "Караганда"], "correctIndex": 1},
    {"id": 3, "body": "Сколько дней в году?", "options": ["364", "365", "366", "367"], "correctIndex": 1},
    {"id": 4, "body": "Какой язык программирования используется для веб-разработки?", "options": ["Python", "JavaScript", "Java", "C++"], "correctIndex": 1},
    {"id": 5, "body": "Столица России?", "options": ["Санкт-Петербург", "Москва", "Новосибирск", "Екатеринбург"], "correctIndex": 1},
    {"id": 6, "body": "Сколько планет в солнечной системе?", "options": ["7", "8", "9", "10"], "correctIndex": 1},
    {"id": 7, "body": "Какой самый большой океан?", "options": ["Атлантический", "Индийский", "Северный Ледовитый", "Тихий"], "correctIndex": 3},
    {"id": 8, "body": "В каком году была основана компания Google?", "options": ["1996", "1998", "2000", "2002"], "correctIndex": 1},
    {"id": 9, "body": "Сколько минут в часе?", "options": ["50", "60", "70", "80"], "correctIndex": 1},
    {"id": 10, "body": "Какой химический символ у золота?", "options": ["Go", "Gd", "Au", "Ag"], "correctIndex": 2}
]

attempts_storage: Dict[str, dict] = {}

# Pydantic models
class Answer(BaseModel):
    questionId: int
    selectedIndex: int

class SaveAttemptRequest(BaseModel):
    attemptId: str
    answers: List[Answer]
    remainingSec: int

class AttemptResponse(BaseModel):
    answers: List[Answer]
    remainingSec: int
    isFinished: bool = False

@app.get("/api/quiz")
async def get_quiz():
    """Get all quiz questions"""
    return quiz_questions

@app.post("/api/attempt/save")
async def save_attempt(request: SaveAttemptRequest):
    """Save quiz attempt progress"""
    attempts_storage[request.attemptId] = {
        "answers": [answer.dict() for answer in request.answers],
        "remainingSec": request.remainingSec,
        "isFinished": False,
        "lastSaved": datetime.now().isoformat()
    }
    return {"status": "saved"}

@app.get("/api/attempt/{attempt_id}")
async def get_attempt(attempt_id: str):
    """Get saved attempt or return default state"""
    if attempt_id in attempts_storage:
        attempt = attempts_storage[attempt_id]
        return AttemptResponse(
            answers=[Answer(**answer) for answer in attempt["answers"]],
            remainingSec=attempt["remainingSec"],
            isFinished=attempt.get("isFinished", False)
        )
    else:
        # Return default state for new attempt
        return AttemptResponse(
            answers=[],
            remainingSec=60,
            isFinished=False
        )

@app.post("/api/attempt/finish")
async def finish_attempt(request: dict):
    """Mark attempt as finished and calculate results"""
    attempt_id = request.get("attemptId")
    if not attempt_id:
        raise HTTPException(status_code=400, detail="attemptId is required")
    
    # Get existing attempt or create empty one
    attempt = attempts_storage.get(attempt_id, {
        "answers": [],
        "remainingSec": 0,
        "isFinished": False
    })
    
    user_answers = attempt["answers"]
    total_questions = len(quiz_questions)
    correct_count = 0
    incorrect_count = 0
    
    # Check each user answer against correct answers
    for user_answer in user_answers:
        question = next((q for q in quiz_questions if q["id"] == user_answer["questionId"]), None)
        if question:
            if question["correctIndex"] == user_answer["selectedIndex"]:
                correct_count += 1
            else:
                incorrect_count += 1
    
    total_answered = len(user_answers)
    unanswered_count = total_questions - total_answered
    correct_percentage = round((correct_count / total_questions) * 100) if total_questions > 0 else 0
    incorrect_percentage = round((incorrect_count / total_questions) * 100) if total_questions > 0 else 0
    
    results = {
        "totalQuestions": total_questions,
        "totalAnswered": total_answered,
        "correctCount": correct_count,
        "incorrectCount": incorrect_count,
        "correctPercentage": correct_percentage,
        "incorrectPercentage": incorrect_percentage,
        "unansweredCount": unanswered_count
    }
    
    # Mark attempt as finished
    if attempt_id in attempts_storage:
        attempts_storage[attempt_id]["isFinished"] = True
        attempts_storage[attempt_id]["finishedAt"] = datetime.now().isoformat()
    
    return {
        "status": "finished",
        "results": results
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

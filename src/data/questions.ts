
export interface Question {
  id: number;
  text: string;
  answer: string;
  points: number;
  category: string;
  image?: string;
}

const questions: Question[] = [
  {
    id: 1,
    text: "Decode to get the Answer",
    answer: "TREASURE",
    points: 100,
    category: "Technical",
    image: "/1.png"
  },
  {
    id: 2,
    text: "Think a bit hard",
    answer: "Astrophysics",
    points: 150,
    category: "Location",
    image: "/2.png"
  },
  {
    id: 3,
    text: "Find me ?",
    answer: "8",
    points: 200,
    category: "Technical",
    image: "/3.png"
  },
  {
    id: 4,
    text: "Locate me ?",
    answer: "Ground",
    points: 250,
    category: "Location",
    image: "/4.png"
  },
  {
    id: 5,
    text: "solve me ?",
    answer: "e3c6f3h6",
    points: 300,
    category: "Technical",
    image:"/5.png"
    
    
  },
  {
    id: 6,
    text: "find me ?",
    answer: "boys hostel",
    points: 450,
    category: "Location",
    image:"/6.png"
  },
  {
    id: 7,
    text: "decode me ?",
    answer: "Password",
    points: 500,
    category: "Technical",
    image:"/7.png"
    
  },
  {
    id: 8,
    text: "find meee ?",
    answer: "Temple",
    points: 550,
    category: "Location",
    image: "/8.png"
  },
  {
    id: 9,
    text: "Decode me ?",
    answer: "klsgit",
    points: 600,
    category: "Technical",
    image: "/9.png"
  },
  {
    id: 10,
    text: "Muje Dhundoo !",
    answer: "Mango Tree",
    points: 650,
    category: "Location",
    image: "/10.png"
  }
];

export const REGULAR_QUESTION_COUNT = 9;
export const FINAL_QUESTION_ID = 10;
const finalQuestion = questions.find(question => question.id === FINAL_QUESTION_ID);

if (!finalQuestion) {
  throw new Error(`Final question ${FINAL_QUESTION_ID} is not defined`);
}

const getQuestionCount = (count: number) =>
  Math.max(0, Math.min(Math.floor(count), questions.length));

// Questions 1–9 are shuffled. Question 10 is always the final challenge.
export function getRandomQuestions(count: number): Question[] {
  const questionCount = getQuestionCount(count);
  const shuffled = questions.filter(question => question.id !== FINAL_QUESTION_ID);

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  const regularQuestions = shuffled.slice(0, Math.min(questionCount, REGULAR_QUESTION_COUNT));
  return questionCount > REGULAR_QUESTION_COUNT
    ? [...regularQuestions, finalQuestion]
    : regularQuestions;
}

// Every client in a room must see the same question order after reconnecting.
export function getRoomQuestions(roomCode: string, count = questions.length): Question[] {
  const questionCount = getQuestionCount(count);
  let seed = [...roomCode].reduce((value, character) => (value * 31 + character.charCodeAt(0)) >>> 0, 7);
  const ordered = questions.filter(question => question.id !== FINAL_QUESTION_ID);
  for (let index = ordered.length - 1; index > 0; index -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const swapIndex = seed % (index + 1);
    [ordered[index], ordered[swapIndex]] = [ordered[swapIndex], ordered[index]];
  }
  const regularQuestions = ordered.slice(0, Math.min(questionCount, REGULAR_QUESTION_COUNT));
  return questionCount > REGULAR_QUESTION_COUNT ? [...regularQuestions, finalQuestion] : regularQuestions;
}

export function getQuestionsByIds(ids: number[]): Question[] {
  const questionMap = new Map(questions.map(question => [question.id, question]));
  return ids.map(id => questionMap.get(id)).filter((question): question is Question => Boolean(question));
}

// Get all questions for display
export function getAllQuestions(): Question[] {
  return questions;
}

export default questions;

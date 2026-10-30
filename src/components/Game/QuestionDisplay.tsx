
import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, CheckCircle2, Flag, Image as ImageIcon, Lightbulb, LockKeyhole } from 'lucide-react';
import { toast } from "sonner";

interface QuestionDisplayProps {
  onComplete: () => void;
}

const QuestionDisplay = ({ onComplete }: QuestionDisplayProps) => {
  const { activeQuestion, submitAnswer, currentQuestionIndex, questions, solvedQuestionIds, selectQuestion } = useGame();
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  if (!activeQuestion) return null;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!answer.trim()) {
      toast.error("Please enter an answer");
      return;
    }
    
    setIsSubmitting(true);
    
    // Small delay to create suspense
    setTimeout(() => {
      const isCorrect = submitAnswer(answer);
      setAnswer('');
      setIsSubmitting(false);
      
      // The final question is only shown after all nine regular questions are solved.
      if (isCorrect && activeQuestion.id === 10) {
        onComplete();
      }
    }, 1000);
  };
  
  const isLastQuestion = activeQuestion.id === 10;
  const isSolved = solvedQuestionIds.includes(activeQuestion.id);
  const solvedRegularCount = solvedQuestionIds.filter(id => id !== 10).length;
  const finalUnlocked = solvedRegularCount >= 9;
  const canGoPrevious = currentQuestionIndex > 0;
  const canGoNext = currentQuestionIndex < questions.length - 1 && (currentQuestionIndex < 8 || finalUnlocked);

  return (
    <div className="question-card relative overflow-hidden !p-0">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-game-primary via-game-gold to-game-accent" />

      <div className="border-b border-white/10 bg-gradient-to-br from-white/[0.08] to-transparent px-6 py-5 md:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-game-primary/20 ring-1 ring-game-primary/40">
              <ImageIcon size={23} className="text-game-primary" />
            </div>
            <div className="min-w-0">
              <span className="block truncate text-xs font-semibold uppercase tracking-[0.18em] text-game-gold">
                {activeQuestion.category} challenge
              </span>
              <span className="mt-1 block text-sm text-white/55">
                Question {currentQuestionIndex + 1} <span className="text-white/25">/</span> 10
              </span>
              {isSolved && (
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-green-400/30 bg-green-400/10 px-2.5 py-1 text-xs font-semibold text-green-300">
                  <CheckCircle2 size={14} /> Solved
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-full border border-game-gold/25 bg-game-gold/10 px-3 py-1.5 text-sm font-bold text-game-gold">
            <Lightbulb size={15} />
            {activeQuestion.points} pts
          </div>
        </div>
      </div>

      <div className="space-y-6 px-6 py-6 md:px-8 md:py-8">
      {activeQuestion.image && (
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-2 shadow-2xl">
          <img 
            src={activeQuestion.image} 
            alt="Question visual hint" 
            className="max-h-[430px] w-full rounded-xl object-contain transition-transform duration-500 group-hover:scale-[1.015]"
          />
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.09] to-white/[0.03] px-6 py-7 shadow-inner md:px-8 md:py-9">
        <p className="whitespace-pre-line text-2xl font-semibold leading-tight tracking-tight text-white md:text-3xl">
          {activeQuestion.text}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          placeholder="Enter your answer..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          aria-label="Your answer"
          className="h-14 border-white/15 bg-black/20 px-5 text-base text-white placeholder:text-white/35 focus-visible:border-game-primary focus-visible:ring-game-primary/40 md:text-lg"
          disabled={isSubmitting || isSolved}
        />

        <Button
          type="submit"
          className="game-button group h-14 w-full rounded-xl text-base md:text-lg"
          disabled={isSubmitting || isSolved}
        >
          {isSolved ? (
            "Solved"
          ) : isSubmitting ? (
            "Checking..."
          ) : isLastQuestion ? (
            <span className="flex items-center justify-center gap-2">
              <Flag size={18} />
              Claim Final Treasure
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Submit Answer
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </span>
          )}
        </Button>
      </form>

      <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => selectQuestion(currentQuestionIndex - 1)}
          disabled={!canGoPrevious || isSubmitting}
          className="border-white/15 bg-white/5 text-white hover:bg-white/10"
        >
          <ArrowLeft size={16} className="mr-2" /> Previous
        </Button>
        <span className="text-center text-xs text-white/45">
          {solvedRegularCount}/9 solved
        </span>
        {currentQuestionIndex === 8 && !finalUnlocked ? (
          <Button type="button" disabled className="border border-white/10 bg-white/5 text-white/45">
            <LockKeyhole size={16} className="mr-2" /> Final locked
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => selectQuestion(currentQuestionIndex + 1)}
            disabled={!canGoNext || isSubmitting}
            className="border-white/15 bg-white/5 text-white hover:bg-white/10"
          >
            Next <ArrowRight size={16} className="ml-2" />
          </Button>
        )}
      </div>
      </div>
    </div>
  );
};

export default QuestionDisplay;

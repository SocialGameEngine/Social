/**
 * Top Comment Solo/Patron Mode
 * Self-service play interface for solo patrons
 */

import { useState } from "react";
import { Button, Card, TextAreaField } from "@social/ui";
import { AnswerCard } from "@social/ui";

interface SoloGameState {
  phase: "welcome" | "answer" | "vote" | "results" | "ended";
  currentRound: number;
  totalRounds: number;
  prompt: string;
  playerAnswer: string;
  historicalAnswers: Array<{ id: string; text: string }>;
  score: number;
}

export function SoloPage() {
  const [gameState, setGameState] = useState<SoloGameState>({
    phase: "welcome",
    currentRound: 0,
    totalRounds: 5,
    prompt: "",
    playerAnswer: "",
    historicalAnswers: [],
    score: 0,
  });

  const [answerInput, setAnswerInput] = useState("");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const startGame = () => {
    // In a real implementation, this would call the backend to create a session
    setGameState({
      ...gameState,
      phase: "answer",
      currentRound: 1,
      prompt: "What's the worst thing to say at a wedding?",
    });
  };

  const submitAnswer = () => {
    if (!answerInput.trim()) return;

    setGameState({
      ...gameState,
      phase: "vote",
      playerAnswer: answerInput,
      historicalAnswers: [
        { id: "h1", text: "I object!" },
        { id: "h2", text: "Remember when you dated my sibling?" },
        { id: "h3", text: "This won't last." },
      ],
    });
    setAnswerInput("");
  };

  const submitVote = () => {
    if (!selectedAnswer) return;

    const pointsEarned = selectedAnswer !== "player" ? 100 : 0;

    setGameState({
      ...gameState,
      phase: "results",
      score: gameState.score + pointsEarned,
    });
    setSelectedAnswer(null);
  };

  const nextRound = () => {
    const nextRoundNum = gameState.currentRound + 1;
    if (nextRoundNum > gameState.totalRounds) {
      setGameState({ ...gameState, phase: "ended" });
    } else {
      setGameState({
        ...gameState,
        phase: "answer",
        currentRound: nextRoundNum,
        prompt: "What's the most embarrassing thing that could happen on a first date?",
        playerAnswer: "",
        historicalAnswers: [],
      });
    }
  };

  const restartGame = () => {
    setGameState({
      phase: "welcome",
      currentRound: 0,
      totalRounds: 5,
      prompt: "",
      playerAnswer: "",
      historicalAnswers: [],
      score: 0,
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-primary/10 to-purple-100 px-4 py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        {/* Header */}
        <header className="text-center">
          <h1 className="text-4xl font-black text-slate-900">
            Top Comment Solo
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            Play on your own, compete with past answers
          </p>
        </header>

        {/* Welcome Phase */}
        {gameState.phase === "welcome" && (
          <Card className="text-center">
            <h2 className="text-2xl font-bold text-slate-900">
              Ready to Play?
            </h2>
            <p className="mt-4 text-slate-600">
              Answer funny prompts and see how your answers compare to others!
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {gameState.totalRounds} rounds • Quick play • No waiting
            </p>
            <Button onClick={startGame} className="mt-6">
              Start Game
            </Button>
          </Card>
        )}

        {/* Answer Phase */}
        {gameState.phase === "answer" && (
          <>
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-500">
                  Round {gameState.currentRound} of {gameState.totalRounds}
                </span>
                <span className="text-lg font-bold text-brand-primary">
                  {gameState.score} pts
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                {gameState.prompt}
              </h2>
            </Card>

            <Card>
              <TextAreaField
                label="Your Answer"
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                placeholder="Type your funniest answer..."
                maxLength={120}
                rows={4}
              />
              <div className="mt-4 flex justify-between">
                <span className="text-sm text-slate-500">
                  {answerInput.length} / 120
                </span>
                <Button onClick={submitAnswer} disabled={!answerInput.trim()}>
                  Submit Answer
                </Button>
              </div>
            </Card>
          </>
        )}

        {/* Vote Phase */}
        {gameState.phase === "vote" && (
          <>
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-500">
                  Round {gameState.currentRound} of {gameState.totalRounds}
                </span>
                <span className="text-lg font-bold text-brand-primary">
                  {gameState.score} pts
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Which answer is funniest?
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Compare your answer to past responses from other players
              </p>
            </Card>

            <Card className="space-y-3">
              {/* Player's answer */}
              <AnswerCard
                answer={{ id: "player", text: gameState.playerAnswer } as any}
                voteCount={0}
                isSelected={selectedAnswer === "player"}
                onClick={() => setSelectedAnswer("player")}
                variant="team"
              />

              {/* Historical answers */}
              {gameState.historicalAnswers.map((answer) => (
                <AnswerCard
                  key={answer.id}
                  answer={{ id: answer.id, text: answer.text } as any}
                  voteCount={0}
                  isSelected={selectedAnswer === answer.id}
                  onClick={() => setSelectedAnswer(answer.id)}
                  variant="team"
                />
              ))}
            </Card>

            <div className="flex justify-center">
              <Button onClick={submitVote} disabled={!selectedAnswer}>
                Vote
              </Button>
            </div>
          </>
        )}

        {/* Results Phase */}
        {gameState.phase === "results" && (
          <>
            <Card className="text-center">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-500">
                  Round {gameState.currentRound} of {gameState.totalRounds}
                </span>
                <span className="text-lg font-bold text-brand-primary">
                  {gameState.score} pts
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                Round Complete!
              </h2>
              <p className="mt-4 text-lg text-slate-700">
                Your answer:{" "}
                <span className="font-semibold">{gameState.playerAnswer}</span>
              </p>
            </Card>

            <div className="flex justify-center">
              <Button onClick={nextRound}>
                {gameState.currentRound < gameState.totalRounds
                  ? "Next Round"
                  : "View Results"}
              </Button>
            </div>
          </>
        )}

        {/* Ended Phase */}
        {gameState.phase === "ended" && (
          <Card className="text-center">
            <h2 className="text-3xl font-black text-slate-900">Game Over!</h2>
            <p className="mt-4 text-4xl font-bold text-brand-primary">
              {gameState.score} points
            </p>
            <p className="mt-2 text-slate-600">
              Great job! Want to play again?
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button onClick={restartGame}>Play Again</Button>
              <Button variant="secondary" onClick={() => window.location.href = "/"}>
                Back to Home
              </Button>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}

export default SoloPage;





"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Share } from "@/components/share";
import { url } from "@/lib/metadata";

const GRID_SIZE = 4;
const TILE_VALUES = [2, 4];
const TILE_PROBABILITIES = [0.9, 0.1];

function getRandomTile() {
  return Math.random() < TILE_PROBABILITIES[0] ? TILE_VALUES[0] : TILE_VALUES[1];
}

function cloneBoard(board: number[][]) {
  return board.map(row => [...row]);
}

export function Game2048() {
  const [board, setBoard] = useState<number[][]>(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0)));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Add a random tile to an empty spot
  const addRandomTile = (b: number[][]) => {
    const empty: [number, number][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (b[r][c] === 0) empty.push([r, c]);
      }
    }
    if (empty.length === 0) return b;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    b[r][c] = getRandomTile();
    return b;
  };

  // Merge a single row or column
  const mergeLine = (line: number[]) => {
    const filtered = line.filter(v => v !== 0);
    const merged: number[] = [];
    let i = 0;
    while (i < filtered.length) {
      if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
        merged.push(filtered[i] * 2);
        setScore(prev => prev + filtered[i] * 2);
        i += 2;
      } else {
        merged.push(filtered[i]);
        i += 1;
      }
    }
    while (merged.length < GRID_SIZE) merged.push(0);
    return merged;
  };

  const move = (direction: "up" | "down" | "left" | "right") => {
    if (gameOver) return;
    let newBoard = cloneBoard(board);
    let changed = false;

    const rotate = (b: number[][], times: number) => {
      let res = b;
      for (let t = 0; t < times; t++) {
        const tmp = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            tmp[c][GRID_SIZE - 1 - r] = res[r][c];
          }
        }
        res = tmp;
      }
      return res;
    };

    // Normalize to left move
    if (direction === "right") newBoard = rotate(newBoard, 3);
    else if (direction === "up") newBoard = rotate(newBoard, 1);
    else if (direction === "down") newBoard = rotate(newBoard, 2);

    for (let r = 0; r < GRID_SIZE; r++) {
      const original = newBoard[r];
      const merged = mergeLine(original);
      if (!changed && merged.some((v, idx) => v !== original[idx])) changed = true;
      newBoard[r] = merged;
    }

    // Rotate back to original orientation
    if (direction === "right") newBoard = rotate(newBoard, 1);
    else if (direction === "up") newBoard = rotate(newBoard, 3);
    else if (direction === "down") newBoard = rotate(newBoard, 2);

    if (changed) {
      newBoard = addRandomTile(newBoard);
      setBoard(newBoard);
      if (!hasMoves(newBoard)) setGameOver(true);
    }
  };

  const hasMoves = (b: number[][]) => {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (b[r][c] === 0) return true;
        if (c + 1 < GRID_SIZE && b[r][c] === b[r][c + 1]) return true;
        if (r + 1 < GRID_SIZE && b[r][c] === b[r + 1][c]) return true;
      }
    }
    return false;
  };

  useEffect(() => {
    // Start with two tiles
    let init = cloneBoard(board);
    init = addRandomTile(init);
    init = addRandomTile(init);
    setBoard(init);
  }, []);

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowUp") move("up");
    else if (e.key === "ArrowDown") move("down");
    else if (e.key === "ArrowLeft") move("left");
    else if (e.key === "ArrowRight") move("right");
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [board, gameOver]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-4 gap-2">
        {board.flat().map((val, idx) => (
          <div
            key={idx}
            className="flex items-center justify-center h-16 w-16 bg-muted rounded-md text-2xl font-bold"
          >
            {val !== 0 ? val : null}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button onClick={() => move("up")}>↑</Button>
        <Button onClick={() => move("left")}>←</Button>
        <Button onClick={() => move("right")}>→</Button>
        <Button onClick={() => move("down")}>↓</Button>
      </div>
      <div className="text-xl">Score: {score}</div>
      {gameOver && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-2xl font-bold">Game Over!</div>
          <Share text={`I scored ${score} in 2048! ${url}`} />
        </div>
      )}
    </div>
  );
}

const gameManager = (function () {
  let isPlaying = true;
  let playerTurn = true;
  let impossible = false;

  let winCount = 0;
  let tieCount = 0;
  let lossCount = 0;

  let board = [0, 0, 0, 0, 0, 0, 0, 0, 0];

  let playerMoves = [];
  let aiMoves = [];

  const winConditions = [
    [0, 1, 2],
    [0, 4, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 4, 6],
    [2, 5, 8],
    [3, 4, 5],
    [6, 7, 8],
  ];

  const handlePlayerMove = (id) => {
    if (!playerTurn) return false;

    var madeMove = handleMove(id, playerMoves);
    playerTurn = false;

    return madeMove;
  };

  const handleAiMove = async () => {
    var availableMoves = getAvailableMoves(board);

    var moveToMake = -1;

    moveToMake = impossible
      ? pickAiMoveHard(board)
      : pickAiMoveEasy(availableMoves);

    await new Promise((resolve) => setTimeout(resolve, 500));

    handleMove(moveToMake, aiMoves);

    playerTurn = true;

    return moveToMake;
  };

  const pickAiMoveEasy = (available) => {
    var moveToMake = -1;

    let maxMatchCount = -1;
    let bestMatchSubarray = [];

    for (const condition of winConditions) {
      let matchCount = 0;

      for (const move of aiMoves) {
        if (condition.includes(move)) {
          matchCount++;
        }
      }

      if (matchCount > maxMatchCount) {
        maxMatchCount = matchCount;
        bestMatchSubarray = condition;
      }
    }

    for (const item of available) {
      if (bestMatchSubarray.includes(item) && !playerMoves.includes(item)) {
        moveToMake = item;
      } else {
        moveToMake = available[Math.floor(Math.random() * available.length)];
      }
    }

    return moveToMake;
  };

  const minimax = (board, isMaximizing, playerMoves, aiMoves) => {
    const result = checkGameResult(board, playerMoves, aiMoves, true);

    if (result !== null) {
      return result;
    }

    if (!isMaximizing) {
      let bestScore = Infinity;
      for (let i = 0; i < board.length; i++) {
        if (board[i] === 0) {
          board[i] = 2;
          aiMoves.push(i);
          const score = minimax(board, !isMaximizing, playerMoves, aiMoves);

          board[i] = 0;
          aiMoves.pop();

          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = -Infinity;
      for (let i = 0; i < board.length; i++) {
        if (board[i] === 0) {
          board[i] = 1;
          playerMoves.push(i);
          const score = minimax(board, !isMaximizing, playerMoves, aiMoves);

          board[i] = 0;
          playerMoves.pop();

          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  const pickAiMoveHard = (board) => {
    let bestMove = -1;
    let bestScore = Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === 0) {
        board[i] = 2;
        aiMoves.push(i);
        const score = minimax(board, true, playerMoves, aiMoves);
        board[i] = 0;
        aiMoves.pop();

        if (score < bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    return bestMove;
  };

  const checkGameResult = (board, playerMoves, aiMoves, isMinimax) => {
    for (const condition of winConditions) {
      const [a, b, c] = condition;
      if (
        playerMoves.includes(a) &&
        playerMoves.includes(b) &&
        playerMoves.includes(c)
      ) {
        if (!isMinimax) {
          isPlaying = false;
          winCount++;
        }

        return 1;
      }
      if (aiMoves.includes(a) && aiMoves.includes(b) && aiMoves.includes(c)) {
        if (!isMinimax) {
          isPlaying = false;
          lossCount++;
        }
        return -1;
      }
    }

    if (playerMoves.length + aiMoves.length === board.length) {
      if (!isMinimax) {
        isPlaying = false;
        tieCount++;
      }
      return 0;
    }

    return null;
  };

  const handleMove = (id, moves) => {
    var madeMove = false;
    if (checkAvailableMove(id)) {
      board[id] = playerTurn ? 1 : 2;
      moves.push(parseInt(id, 10));
      madeMove = true;
    }
    return madeMove;
  };

  const getAvailableMoves = (arr) => {
    return arr.reduce((indices, element, index) => {
      if (element === 0) indices.push(index);
      return indices;
    }, []);
  };

  const checkAvailableMove = (id) => {
    return board[id] === 0;
  };

  const getGameState = () => isPlaying;

  const isPlayerTurn = () => playerTurn;

  const setDifficultyImpossible = (mode) => {
    impossible = mode;
  };

  const replay = () => {
    board = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    playerMoves = [];
    aiMoves = [];
    isPlaying = true;
    playerTurn = true;
    result = -1;
  };

  const getResult = () => {
    return checkGameResult(board, playerMoves, aiMoves, false);
  };

  const getScores = () => {
    return { wins: winCount, ties: tieCount, losses: lossCount };
  };

  return {
    setDifficultyImpossible,
    handlePlayerMove,
    handleAiMove,
    getGameState,
    isPlayerTurn,
    getResult,
    getScores,
    replay,
  };
})();

const uiManager = (function () {
  const tiles = document.querySelectorAll(".tile");
  const btnReplay = document.querySelector("#btnReplay");
  const btnChange = document.querySelector("#btnChange");
  const winCountText = document.querySelector("#winCount");
  const tieCountText = document.querySelector("#tieCount");
  const lossCountText = document.querySelector("#lossCount");
  const resultText = document.querySelector("#result");
  const aiWrapper = document.querySelector(".ai-wrapper");
  const gameWrapper = document.querySelector(".game-wrapper");
  const aiEasy = document.querySelector("#easy");
  const aiImpossible = document.querySelector("#impossible");

  tiles.forEach((x) =>
    x.addEventListener("click", async () => {
      if (!gameManager.getGameState() || !gameManager.isPlayerTurn) return;

      if (gameManager.handlePlayerMove(x.id)) {
        x.style.backgroundImage = "url('public/x.png')";
        checkVictory();

        if (gameManager.getGameState()) {
          var tileIndex = await gameManager.handleAiMove();
          if (tileIndex !== -1 && tileIndex !== undefined)
            tiles[tileIndex].style.backgroundImage = "url('public/o.png')";
          checkVictory();
        }
      }
    })
  );

  btnReplay.addEventListener("click", (e) => {
    e.preventDefault();
    resetBoard();
  });

  btnChange.addEventListener("click", (e) => {
    e.preventDefault();
  });

  [aiEasy, aiImpossible, btnChange].forEach((x) => {
    x.addEventListener("click", () => {
      gameManager.setDifficultyImpossible(x.id === "impossible");
      resetBoard();
      toggleView();
    });
  });

  const checkVictory = () => {
    var result = gameManager.getResult();
    if (result === null) return;
    resultText.classList.remove("hidden");
    switch (result) {
      case 1:
        resultText.innerText = "You win!";
        resultText.classList.toggle("win");
        break;
      case 0:
        resultText.innerText = "It's a tie.";
        resultText.classList.toggle("tie");
        break;
      default:
        resultText.innerText = "You lose...";
        resultText.classList.toggle("loss");
    }

    var scores = gameManager.getScores();

    winCountText.innerText = `Wins: ${scores["wins"]}`;
    tieCountText.innerText = `Ties: ${scores["ties"]}`;
    lossCountText.innerText = `Losses: ${scores["losses"]}`;
  };

  const toggleView = () => {
    aiWrapper.classList.toggle("invisible");
    gameWrapper.classList.toggle("invisible");
  };

  const resetBoard = () => {
    gameManager.replay();
    tiles.forEach((x) => {
      x.style.backgroundImage = null;
    });
    resultText.className = "hidden";
  };
})();

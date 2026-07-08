/* ==========================================================================
   Tic-Tac-Toe: Quantum Edition Logic & State
   ========================================================================== */

// --- Audio Controller via Web Audio API ---
class SoundController {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('quantum-ttt-muted') === 'true';
    this.updateAudioButtonUI();
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('quantum-ttt-muted', this.muted);
    this.updateAudioButtonUI();
    
    // Play a test beep if unmuted
    if (!this.muted) {
      this.init();
      this.playPlace();
    }
  }

  updateAudioButtonUI() {
    const btn = document.getElementById('btn-audio');
    if (!btn) return;
    const soundOnIcon = btn.querySelector('.audio-on-icon');
    const soundOffIcon = btn.querySelector('.audio-off-icon');
    if (this.muted) {
      soundOnIcon.classList.add('hidden');
      soundOffIcon.classList.remove('hidden');
    } else {
      soundOnIcon.classList.remove('hidden');
      soundOffIcon.classList.add('hidden');
    }
  }

  playPlace() {
    if (this.muted) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(640, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playFade() {
    if (this.muted) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.22);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playWin() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    // Ascending arpeggio
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C4, E4, G4, C5, E5
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.06 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.35);
    });
  }

  playDraw() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    const freqs = [220.00, 233.08]; // A3 and A#3 dissonance
    freqs.forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.35);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(now + 0.35);
    });
  }
}

// --- Game Logic ---
class QuantumTicTacToe {
  constructor() {
    this.sound = new SoundController();
    this.initElements();
    this.loadState();
    this.resetBoardState();
    this.registerEvents();
    this.updateUI();
  }

  initElements() {
    // Buttons & Toggles
    this.btnPvP = document.getElementById('btn-pvp');
    this.btnPvC = document.getElementById('btn-pvc');
    this.btnClassic = document.getElementById('btn-classic');
    this.btnQuantum = document.getElementById('btn-quantum');
    this.btnReset = document.getElementById('btn-reset');
    this.btnClearScores = document.getElementById('btn-clear-scores');
    this.btnAudio = document.getElementById('btn-audio');
    this.btnInfo = document.getElementById('btn-info');
    
    // Modal
    this.rulesModal = document.getElementById('rules-modal');
    this.btnCloseModal = document.getElementById('btn-close-modal');
    this.btnModalGotIt = document.getElementById('btn-modal-got-it');

    // Panels
    this.difficultyGroup = document.getElementById('difficulty-group');
    this.difficultyBtns = document.querySelectorAll('#ai-difficulty .control-btn');
    this.quantumBanner = document.getElementById('quantum-banner');
    
    // Scores & Stats
    this.scoreXEl = document.getElementById('score-x');
    this.scoreOEl = document.getElementById('score-o');
    this.scoreTiesEl = document.getElementById('score-ties');
    this.labelOEl = document.getElementById('label-o');
    this.cardX = document.querySelector('.player-x-card');
    this.cardO = document.querySelector('.player-o-card');
    
    // Board & Info Banner
    this.boardEl = document.getElementById('board');
    this.cells = document.querySelectorAll('.cell');
    this.winLine = document.getElementById('win-strike-line');
    this.statusMessage = document.getElementById('status-message');
  }

  loadState() {
    // Load config from localStorage or fallback
    this.mode = localStorage.getItem('quantum-ttt-mode') || 'pvp';
    this.difficulty = localStorage.getItem('quantum-ttt-diff') || 'medium';
    this.ruleset = localStorage.getItem('quantum-ttt-ruleset') || 'classic';
    
    // Load scores
    const savedScores = localStorage.getItem('quantum-ttt-scores');
    if (savedScores) {
      this.scores = JSON.parse(savedScores);
    } else {
      this.scores = { X: 0, O: 0, ties: 0 };
    }
  }

  saveConfig() {
    localStorage.setItem('quantum-ttt-mode', this.mode);
    localStorage.setItem('quantum-ttt-diff', this.difficulty);
    localStorage.setItem('quantum-ttt-ruleset', this.ruleset);
  }

  saveScores() {
    localStorage.setItem('quantum-ttt-scores', JSON.stringify(this.scores));
  }

  resetBoardState() {
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X';
    this.gameActive = true;
    this.quantumQueues = { X: [], O: [] };
    
    document.body.classList.remove('game-over');
    
    // Reset Win Line
    this.winLine.style.transform = 'scaleX(0)';
    this.winLine.style.opacity = '0';
    this.winLine.className = 'win-strike-line';

    // Clear cells in DOM
    this.cells.forEach(cell => {
      cell.innerHTML = '';
      cell.className = 'cell';
      cell.setAttribute('aria-label', `Cell ${parseInt(cell.dataset.index) + 1}, empty`);
    });

    this.updateStatusMessage(`Player X's turn!`);
    this.updateTurnCards();
  }

  registerEvents() {
    // PvP vs PvC Modes
    this.btnPvP.addEventListener('click', () => this.changeOpponent('pvp'));
    this.btnPvC.addEventListener('click', () => this.changeOpponent('pvc'));

    // AI Difficulties
    this.difficultyBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.difficultyBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.difficulty = e.target.dataset.diff;
        this.saveConfig();
        this.updateUI();
        this.resetBoardState();
      });
    });

    // Classic vs Quantum Rulesets
    this.btnClassic.addEventListener('click', () => this.changeRuleset('classic'));
    this.btnQuantum.addEventListener('click', () => this.changeRuleset('quantum'));

    // Audio Toggle
    this.btnAudio.addEventListener('click', () => this.sound.toggleMute());

    // Reset Board / Scores
    this.btnReset.addEventListener('click', () => {
      this.sound.init();
      this.resetBoardState();
    });
    this.btnClearScores.addEventListener('click', () => {
      this.scores = { X: 0, O: 0, ties: 0 };
      this.saveScores();
      this.updateScoreboardUI();
      this.resetBoardState();
    });

    // Rules Info Modal
    const showModal = () => this.rulesModal.classList.add('open');
    const closeModal = () => this.rulesModal.classList.remove('open');
    this.btnInfo.addEventListener('click', showModal);
    this.btnCloseModal.addEventListener('click', closeModal);
    this.btnModalGotIt.addEventListener('click', closeModal);
    this.rulesModal.addEventListener('click', (e) => {
      if (e.target === this.rulesModal) closeModal();
    });

    // Click handler for Cells
    this.cells.forEach(cell => {
      cell.addEventListener('click', (e) => {
        this.sound.init();
        const index = parseInt(e.currentTarget.dataset.index);
        this.handleCellClick(index);
      });
    });
  }

  changeOpponent(mode) {
    this.mode = mode;
    if (mode === 'pvp') {
      this.btnPvP.classList.add('active');
      this.btnPvC.classList.remove('active');
      this.difficultyGroup.classList.add('hidden');
    } else {
      this.btnPvP.classList.remove('active');
      this.btnPvC.classList.add('active');
      this.difficultyGroup.classList.remove('hidden');
    }
    this.saveConfig();
    this.updateUI();
    this.resetBoardState();
  }

  changeRuleset(ruleset) {
    this.ruleset = ruleset;
    if (ruleset === 'classic') {
      this.btnClassic.classList.add('active');
      this.btnQuantum.classList.remove('active');
      this.quantumBanner.style.display = 'none';
    } else {
      this.btnClassic.classList.remove('active');
      this.btnQuantum.classList.add('active');
      this.quantumBanner.style.display = 'flex';
    }
    this.saveConfig();
    this.resetBoardState();
  }

  updateUI() {
    // Mode UI Selectors
    if (this.mode === 'pvp') {
      this.btnPvP.classList.add('active');
      this.btnPvC.classList.remove('active');
      this.difficultyGroup.classList.add('hidden');
      this.labelOEl.textContent = 'PLAYER O';
    } else {
      this.btnPvP.classList.remove('active');
      this.btnPvC.classList.add('active');
      this.difficultyGroup.classList.remove('hidden');
      const formattedDiff = this.difficulty === 'impossible' ? 'MINIMAX' : this.difficulty.toUpperCase();
      this.labelOEl.textContent = `CPU (${formattedDiff})`;
    }

    // Ruleset UI Selectors
    if (this.ruleset === 'classic') {
      this.btnClassic.classList.add('active');
      this.btnQuantum.classList.remove('active');
      this.quantumBanner.style.display = 'none';
    } else {
      this.btnClassic.classList.remove('active');
      this.btnQuantum.classList.add('active');
      this.quantumBanner.style.display = 'flex';
    }

    // Difficulty Button Active State
    this.difficultyBtns.forEach(btn => {
      if (btn.dataset.diff === this.difficulty) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    this.updateScoreboardUI();
  }

  updateScoreboardUI() {
    this.scoreXEl.textContent = this.scores.X;
    this.scoreOEl.textContent = this.scores.O;
    this.scoreTiesEl.textContent = this.scores.ties;
  }

  updateStatusMessage(msg, className = '') {
    this.statusMessage.textContent = msg;
    this.statusMessage.className = className;
  }

  updateTurnCards() {
    if (!this.gameActive) {
      this.cardX.classList.remove('active');
      this.cardO.classList.remove('active');
      return;
    }

    if (this.currentPlayer === 'X') {
      this.cardX.classList.add('active');
      this.cardO.classList.remove('active');
    } else {
      this.cardX.classList.remove('active');
      this.cardO.classList.add('active');
    }
  }

  handleCellClick(index) {
    if (!this.gameActive || this.board[index] !== null) return;
    
    // Prevent human clicking during CPU's turn in vs Computer mode
    if (this.mode === 'pvc' && this.currentPlayer === 'O') return;

    this.makeMove(index);

    // If game is active and it's O's turn in PvC mode, trigger Computer AI move
    if (this.gameActive && this.mode === 'pvc' && this.currentPlayer === 'O') {
      setTimeout(() => this.makeComputerMove(), 650); // Fluid delayed CPU click
    }
  }

  makeMove(index) {
    const player = this.currentPlayer;
    
    // Quantum Fade Mode logic
    if (this.ruleset === 'quantum') {
      const playerQueue = this.quantumQueues[player];

      // If they already have 3 pieces, the oldest will be removed when they place this 4th
      if (playerQueue.length >= 3) {
        const oldestCellIndex = playerQueue.shift();
        
        // Remove from state board
        this.board[oldestCellIndex] = null;
        
        // Update DOM for faded-out cells
        const oldestCell = document.getElementById(`cell-${oldestCellIndex}`);
        oldestCell.classList.remove('x', 'o', 'will-fade');
        oldestCell.classList.add('faded-out');
        oldestCell.setAttribute('aria-label', `Cell ${oldestCellIndex + 1}, empty`);
        
        // Clean inner HTML after fade transition completes
        setTimeout(() => {
          if (this.board[oldestCellIndex] === null) {
            oldestCell.innerHTML = '';
            oldestCell.classList.remove('faded-out');
          }
        }, 300);

        this.sound.playFade();
      }
      
      // Add current cell to active queue
      playerQueue.push(index);
    }

    // Place piece on board
    this.board[index] = player;
    this.sound.playPlace();
    this.renderMarkSVG(index, player);

    // Check for Wins
    const winResult = this.checkWinState(this.board);
    if (winResult) {
      this.handleGameOver(winResult.winner, winResult.pattern);
      return;
    }

    // Check for Ties (Classic only)
    if (this.ruleset === 'classic' && !this.board.includes(null)) {
      this.handleGameOver('tie');
      return;
    }

    // Toggle Player
    this.currentPlayer = (player === 'X') ? 'O' : 'X';
    
    // Reset will-fade warning styling on all cells
    this.cells.forEach(c => c.classList.remove('will-fade'));

    // Highlight next fading piece in Quantum mode
    if (this.ruleset === 'quantum') {
      const nextPlayerQueue = this.quantumQueues[this.currentPlayer];
      if (nextPlayerQueue.length === 3) {
        const nextOldestIndex = nextPlayerQueue[0];
        document.getElementById(`cell-${nextOldestIndex}`).classList.add('will-fade');
      }
    }

    // Update messages
    if (this.mode === 'pvp') {
      this.updateStatusMessage(`Player ${this.currentPlayer}'s turn!`);
    } else {
      if (this.currentPlayer === 'O') {
        this.updateStatusMessage(`Computer is thinking...`);
      } else {
        this.updateStatusMessage(`Your turn!`);
      }
    }
    
    this.updateTurnCards();
  }

  renderMarkSVG(index, player) {
    const cell = document.getElementById(`cell-${index}`);
    cell.classList.add(player.toLowerCase());
    cell.setAttribute('aria-label', `Cell ${index + 1}, marked with ${player}`);

    let svgHTML = '';
    if (player === 'X') {
      svgHTML = `
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <line x1="20" y1="20" x2="80" y2="80" class="draw-path" />
          <line x1="80" y1="20" x2="20" y2="80" class="draw-path" style="animation-delay: 0.12s;" />
        </svg>
      `;
    } else {
      svgHTML = `
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="30" class="draw-path" />
        </svg>
      `;
    }
    cell.innerHTML = svgHTML;
  }

  checkWinState(boardState) {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    for (let pattern of winPatterns) {
      if (boardState[pattern[0]] && 
          boardState[pattern[0]] === boardState[pattern[1]] && 
          boardState[pattern[0]] === boardState[pattern[2]]) {
        return { winner: boardState[pattern[0]], pattern };
      }
    }
    return null;
  }

  handleGameOver(winner, pattern = null) {
    this.gameActive = false;
    document.body.classList.add('game-over');
    this.updateTurnCards();

    // Clear will-fade indicators
    this.cells.forEach(c => c.classList.remove('will-fade'));

    if (winner === 'tie') {
      this.scores.ties++;
      this.saveScores();
      this.updateScoreboardUI();
      this.updateStatusMessage(`It's a draw! Perfect moves.`, 'tie-text');
      this.sound.playDraw();
    } else {
      // Award winner
      this.scores[winner]++;
      this.saveScores();
      this.updateScoreboardUI();
      
      // Draw Win Line
      if (pattern) {
        this.drawWinningLine(pattern);
      }

      // Play victory sound & confetti
      this.sound.playWin();
      this.spawnConfetti();

      // Show Winner text
      if (this.mode === 'pvp') {
        this.updateStatusMessage(`PLAYER ${winner} WINS THE ROUND! 🏆`, `win-text-${winner.toLowerCase()}`);
      } else {
        if (winner === 'X') {
          this.updateStatusMessage(`YOU WIN! EXCELLENT PLAY! 🏆`, 'win-text-x');
        } else {
          this.updateStatusMessage(`COMPUTER WINS! TRY AGAIN. 🤖`, 'win-text-o');
        }
      }
    }
  }

  drawWinningLine(pattern) {
    const firstCell = document.getElementById(`cell-${pattern[0]}`);
    const lastCell = document.getElementById(`cell-${pattern[2]}`);
    
    const rect1 = firstCell.getBoundingClientRect();
    const rect3 = lastCell.getBoundingClientRect();
    const boardRect = this.boardEl.getBoundingClientRect();
    
    // Center coords relative to parent board
    const x1 = rect1.left - boardRect.left + rect1.width / 2;
    const y1 = rect1.top - boardRect.top + rect1.height / 2;
    const x2 = rect3.left - boardRect.left + rect3.width / 2;
    const y2 = rect3.top - boardRect.top + rect3.height / 2;
    
    const distance = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    
    this.winLine.style.width = `${distance}px`;
    this.winLine.style.left = `${x1}px`;
    this.winLine.style.top = `${y1}px`;
    this.winLine.style.transform = `rotate(${angle}deg) scaleX(0)`;
    this.winLine.style.opacity = '1';
    
    const winner = this.board[pattern[0]];
    this.winLine.classList.add(winner.toLowerCase() + '-win');

    // Smooth entry scale
    setTimeout(() => {
      this.winLine.style.transform = `rotate(${angle}deg) scaleX(1)`;
    }, 50);
  }

  spawnConfetti() {
    const colors = ['#00f0ff', '#ff007f', '#ffdf00', '#ffffff'];
    const boardRect = this.boardEl.getBoundingClientRect();
    const originX = boardRect.left + boardRect.width / 2;
    const originY = boardRect.top + boardRect.height / 2;

    for (let i = 0; i < 60; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti-particle';
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      
      // Center position offsets
      particle.style.left = `${originX}px`;
      particle.style.top = `${originY}px`;

      // Set destination coordinates using CSS Properties
      const angle = Math.random() * Math.PI * 2;
      const velocity = 80 + Math.random() * 200;
      const xDest = Math.cos(angle) * velocity;
      const yDest = Math.sin(angle) * velocity + 100; // gravity weight

      particle.style.setProperty('--x-dest', `${xDest}px`);
      particle.style.setProperty('--y-dest', `${yDest}px`);

      // Dynamic particle size
      const size = 6 + Math.random() * 8;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;

      document.body.appendChild(particle);

      // Self cleanup
      setTimeout(() => {
        particle.remove();
      }, 2000);
    }
  }

  makeComputerMove() {
    if (!this.gameActive) return;

    let moveIndex;
    if (this.difficulty === 'easy') {
      moveIndex = this.getEasyMove();
    } else if (this.difficulty === 'medium') {
      moveIndex = this.getMediumMove();
    } else {
      moveIndex = this.getImpossibleMove();
    }

    if (moveIndex !== null && moveIndex !== undefined) {
      this.makeMove(moveIndex);
    }
  }

  getEasyMove() {
    const emptyIndices = this.board
      .map((val, idx) => val === null ? idx : null)
      .filter(val => val !== null);
    
    if (emptyIndices.length === 0) return null;
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  }

  getMediumMove() {
    // 1. Can CPU (O) win this turn?
    for (let i = 0; i < 9; i++) {
      if (this.board[i] === null) {
        let testBoard = [...this.board];
        let testQueues = { X: [...this.quantumQueues.X], O: [...this.quantumQueues.O] };
        this.simulateStateMove(testBoard, testQueues, i, 'O');
        if (this.checkWinState(testBoard)) return i;
      }
    }

    // 2. Can Player (X) win? Block it!
    for (let i = 0; i < 9; i++) {
      if (this.board[i] === null) {
        let testBoard = [...this.board];
        let testQueues = { X: [...this.quantumQueues.X], O: [...this.quantumQueues.O] };
        this.simulateStateMove(testBoard, testQueues, i, 'X');
        if (this.checkWinState(testBoard)) return i;
      }
    }

    // 3. Take center if vacant
    if (this.board[4] === null) return 4;

    // 4. Take corners if vacant
    const corners = [0, 2, 6, 8].filter(c => this.board[c] === null);
    if (corners.length > 0) {
      return corners[Math.floor(Math.random() * corners.length)];
    }

    // 5. Fallback to random Easy choice
    return this.getEasyMove();
  }

  getImpossibleMove() {
    let bestScore = -Infinity;
    let bestMove = null;

    const emptySpots = [];
    for (let i = 0; i < 9; i++) {
      if (this.board[i] === null) emptySpots.push(i);
    }

    // Add random sort order so AI doesn't pick same pattern first on equal weights
    emptySpots.sort(() => Math.random() - 0.5);

    // Quantum limits minimax depth to prevent infinite paths/overflows
    const maxSearchDepth = (this.ruleset === 'quantum') ? 6 : 9;

    for (let move of emptySpots) {
      let testBoard = [...this.board];
      let testQueues = { X: [...this.quantumQueues.X], O: [...this.quantumQueues.O] };
      
      this.simulateStateMove(testBoard, testQueues, move, 'O');
      
      // Calculate branch scores
      let score = this.minimax(testBoard, testQueues, 0, false, maxSearchDepth);
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  simulateStateMove(boardState, queues, cellIndex, player) {
    const playerQueue = queues[player];
    if (playerQueue.length >= 3) {
      const oldest = playerQueue.shift();
      boardState[oldest] = null;
    }
    boardState[cellIndex] = player;
    playerQueue.push(cellIndex);
  }

  minimax(tempBoard, tempQueues, depth, isMaximizing, maxDepth) {
    // Check terminal nodes
    const winInfo = this.checkWinState(tempBoard);
    if (winInfo) {
      return winInfo.winner === 'O' ? (10 - depth) : (-10 + depth);
    }

    if (this.ruleset === 'classic' && !tempBoard.includes(null)) {
      return 0;
    }

    if (depth >= maxDepth) {
      return 0;
    }

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (tempBoard[i] === null) {
          let boardClone = [...tempBoard];
          let queuesClone = { X: [...tempQueues.X], O: [...tempQueues.O] };
          
          this.simulateStateMove(boardClone, queuesClone, i, 'O');
          let score = this.minimax(boardClone, queuesClone, depth + 1, false, maxDepth);
          
          bestScore = Math.max(bestScore, score);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (tempBoard[i] === null) {
          let boardClone = [...tempBoard];
          let queuesClone = { X: [...tempQueues.X], O: [...tempQueues.O] };
          
          this.simulateStateMove(boardClone, queuesClone, i, 'X');
          let score = this.minimax(boardClone, queuesClone, depth + 1, true, maxDepth);
          
          bestScore = Math.min(bestScore, score);
        }
      }
      return bestScore;
    }
  }
}

// Start Game instance on DOM Content Loaded
window.addEventListener('DOMContentLoaded', () => {
  new QuantumTicTacToe();
});

const gridSize = 15;
let grid = [];
let words = [];
let foundWords = [];
let hints = 3;
let selectedCells = [];
let isSelecting = false;
let timerInterval;
let startTime;
let elapsedTime = 0; // Track elapsed time

async function fetchWords() {
    try {
        const response = await fetch('https://random-word-api.herokuapp.com/word?number=10&length=5');
        if (!response.ok) {
            throw new Error('Failed to fetch words');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching words:', error);
        return ['ERROR', 'FETCH', 'WORDS', 'FAILED', 'USING', 'BACKUP', 'WORDS', 'FOR', 'GRID', 'FILL'];
    }
}

async function generatePuzzle() {
    words = (await fetchWords()).map(word => word.toUpperCase());
    grid = Array(gridSize).fill().map(() => Array(gridSize).fill(''));
    foundWords = [];
    selectedCells = [];
    
    words.forEach(word => {
        placeWord(word);
    });

    fillEmptyCells();
    renderGrid();
    renderWordList();
    startTimer();
    saveGameState();
}

function placeWord(word) {
    const directions = [
        [0, 1],  // right
        [1, 0],  // down
        [1, 1],  // diagonal
        [0, -1], // left
        [-1, 0], // up
        [-1, -1] // diagonal up-left
    ];

    let placed = false;
    while (!placed) {
        const direction = directions[Math.floor(Math.random() * directions.length)];
        const [dx, dy] = direction;
        const x = Math.floor(Math.random() * gridSize);
        const y = Math.floor(Math.random() * gridSize);

        if (canPlaceWord(word, x, y, dx, dy)) {
            for (let i = 0; i < word.length; i++) {
                grid[y + i * dy][x + i * dx] = word[i];
            }
            placed = true;
        }
    }
}

function canPlaceWord(word, x, y, dx, dy) {
    if (x + word.length * dx > gridSize || x + word.length * dx < 0 ||
        y + word.length * dy > gridSize || y + word.length * dy < 0) {
        return false;
    }

    for (let i = 0; i < word.length; i++) {
        const cellX = x + i * dx;
        const cellY = y + i * dy;
        if (grid[cellY][cellX] !== '' && grid[cellY][cellX] !== word[i]) {
            return false;
        }
    }

    return true;
}

function fillEmptyCells() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (grid[y][x] === '') {
                grid[y][x] = letters[Math.floor(Math.random() * letters.length)];
            }
        }
    }
}

function renderGrid() {
    const wordGrid = document.getElementById('word-grid');
    wordGrid.innerHTML = '';
    wordGrid.style.gridTemplateColumns = `repeat(${gridSize}, 30px)`;

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            cell.textContent = grid[y][x];
            cell.dataset.x = x;
            cell.dataset.y = y;
            wordGrid.appendChild(cell);
        }
    }

    wordGrid.addEventListener('mousedown', startSelection);
    wordGrid.addEventListener('mouseover', updateSelection);
    wordGrid.addEventListener('mouseup', endSelection);

    highlightFoundWords();
}

function renderWordList() {
    const wordList = document.getElementById('word-list');
    wordList.innerHTML = '';

    words.forEach(word => {
        const wordItem = document.createElement('div');
        wordItem.classList.add('word-item');
        wordItem.textContent = word;
        if (foundWords.includes(word)) {
            wordItem.style.textDecoration = 'line-through';
        }
        wordList.appendChild(wordItem);
    });
}

function startSelection(e) {
    if (e.target.classList.contains('grid-cell')) {
        isSelecting = true;
        selectedCells = [];
        updateSelection(e);
    }
}

function updateSelection(e) {
    if (!isSelecting || !e.target.classList.contains('grid-cell')) return;

    const x = parseInt(e.target.dataset.x);
    const y = parseInt(e.target.dataset.y);

    if (selectedCells.length === 0 || isAdjacent(selectedCells[selectedCells.length - 1], [x, y])) {
        if (!selectedCells.some(cell => cell[0] === x && cell[1] === y)) {
            selectedCells.push([x, y]);
            e.target.classList.add('selected');
        }
    }
}

function endSelection() {
    isSelecting = false;
    checkSelectedWord();
}

function isAdjacent(cell1, cell2) {
    const [x1, y1] = cell1;
    const [x2, y2] = cell2;
    const dx = Math.abs(x1 - x2);
    const dy = Math.abs(y1 - y2);
    return (dx <= 1 && dy <= 1) && (dx + dy > 0);
}

function checkSelectedWord() {
    const selectedWord = selectedCells.map(([x, y]) => grid[y][x]).join('');
    const reversedSelectedWord = selectedCells.map(([x, y]) => grid[y][x]).reverse().join('');

    if (words.includes(selectedWord) || words.includes(reversedSelectedWord)) {
        foundWords.push(selectedWord);
        highlightFoundWord(selectedCells);
        renderWordList();
        checkGameCompletion();
        saveGameState();
    }

    selectedCells.forEach(([x, y]) => {
        const cell = document.querySelector(`.grid-cell[data-x="${x}"][data-y="${y}"]`);
        cell.classList.remove('selected');
    });
    selectedCells = [];
}

function highlightFoundWord(cells) {
    cells.forEach(([x, y]) => {
        const cell = document.querySelector(`.grid-cell[data-x="${x}"][data-y="${y}"]`);
        cell.classList.add('found');
    });
}

function highlightFoundWords() {
    foundWords.forEach(word => {
        const wordPositions = getWordPositions(word);
        wordPositions.forEach(([x, y]) => {
            const cell = document.querySelector(`.grid-cell[data-x="${x}"][data-y="${y}"]`);
            cell.classList.add('found');
        });
    });
}

function getWordPositions(word) {
    const positions = [];
    const directions = [
        [0, 1],  // right
        [1, 0],  // down
        [1, 1],  // diagonal
        [0, -1], // left
        [-1, 0], // up
        [-1, -1] // diagonal up-left
    ];

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            for (const [dx, dy] of directions) {
                let match = true;
                const positions = [];
                for (let i = 0; i < word.length; i++) {
                    const nx = x + i * dx;
                    const ny = y + i * dy;
                    if (nx < 0 || ny < 0 || nx >= gridSize || ny >= gridSize || grid[ny][nx] !== word[i]) {
                        match = false;
                        break;
                    }
                    positions.push([nx, ny]);
                }
                if (match) return positions;
            }
        }
    }
    return positions;
}

function checkGameCompletion() {
    if (foundWords.length === words.length) {
        clearInterval(timerInterval);
        const timeTaken = elapsedTime + Math.floor((Date.now() - startTime) / 1000);
        const score = calculateScore(timeTaken);
        showCompletionPopup('Congratulations', `Time: ${timeTaken}s`, `Score: ${score}`);
        saveGameState(true);
    }
}

function calculateScore(timeTaken) {
    return Math.max(1000 - timeTaken * 10, 0);
}

function showCompletionPopup(title, timeText, scoreText = '') {
    document.getElementById('popup-title').textContent = title;
    document.getElementById('completion-time').textContent = timeText;
    document.getElementById('score').textContent = scoreText;
    document.getElementById('overlay').classList.remove('hidden');
    saveGameState(true);
}

function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const currentTime = Math.floor((Date.now() - startTime) / 1000);
        document.getElementById('timer').textContent = `Time: ${elapsedTime + currentTime}s`;
    }, 1000);
}

function getNextResetTime() {
    const now = new Date();
    const resetTime = new Date(now);
    resetTime.setUTCHours(0, 0, 0, 0);
    resetTime.setUTCDate(resetTime.getUTCDate() + 1);
    return resetTime;
}

function scheduleDailyReset() {
    const nextResetTime = getNextResetTime();
    const timeUntilReset = nextResetTime - new Date();
    setTimeout(() => {
        localStorage.removeItem('wordSearchGameState');
        location.reload();
    }, timeUntilReset);
}

function saveGameState(completed = false) {
    const gameState = {
        grid,
        words,
        foundWords,
        hints,
        elapsedTime: elapsedTime + Math.floor((Date.now() - startTime) / 1000),
        completed
    };
    localStorage.setItem('wordSearchGameState', JSON.stringify(gameState));
}

function loadGameState() {
    const savedState = localStorage.getItem('wordSearchGameState');
    if (savedState) {
        const gameState = JSON.parse(savedState);
        grid = gameState.grid;
        words = gameState.words;
        foundWords = gameState.foundWords;
        hints = gameState.hints;
        elapsedTime = gameState.elapsedTime || 0;
        if (gameState.completed) {
            showCompletionPopup('Congratulations', `Time: ${elapsedTime}s`, `Score: ${calculateScore(elapsedTime)}`);
        } else {
            renderGrid();
            renderWordList();
            startTimer();
        }
    } else {
        generatePuzzle();
    }
}

document.getElementById('hint').addEventListener('click', useHint);
document.getElementById('close-popup').addEventListener('click', () => {
    document.getElementById('overlay').classList.add('hidden');
});

document.getElementById('auto-complete').addEventListener('click', autoCompletePuzzle);

function useHint() {
    if (hints > 0) {
        const remainingWords = words.filter(word => !foundWords.includes(word));
        if (remainingWords.length > 0) {
            const randomWord = remainingWords[Math.floor(Math.random() * remainingWords.length)];
            alert(`Hint: Look for the word "${randomWord}"`);
            hints--;
            document.getElementById('hint-count').textContent = `Hints: ${hints}`;
            saveGameState();
        } else {
            alert('No more words to find!');
        }
    } else {
        alert('No more hints available!');
    }
}

function autoCompletePuzzle() {
    words.forEach(word => {
        if (!foundWords.includes(word)) {
            const wordPositions = getWordPositions(word);
            highlightFoundWord(wordPositions);
            foundWords.push(word);
        }
    });
    renderWordList();
    checkGameCompletion();
}

loadGameState();
scheduleDailyReset();
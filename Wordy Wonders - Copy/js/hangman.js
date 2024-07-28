const maxAttempts = 7;
let phrase = '';
let clue = '';
let guessedLetters = [];
let remainingAttempts = maxAttempts;
let hints = 3;
let timerInterval;
let startTime;
let gameCompleted = false;

// Initialize Howler sounds
const correctSound = new Howl({ src: ['sounds/correct.mp3'] });
const incorrectSound = new Howl({ src: ['sounds/incorrect.mp3'] });
const winSound = new Howl({ src: ['sounds/win.mp3'] });
const loseSound = new Howl({ src: ['sounds/lose.mp3'] });

async function fetchPhraseAndClue() {
    const phrases = [
        { phrase: "IT'S RAINING CATS AND DOGS", clue: "Extremely heavy rain" },
        { phrase: "BREAK A LEG", clue: "Good luck" },
        { phrase: "PIECE OF CAKE", clue: "Very easy task" },
        { phrase: "ONCE IN A BLUE MOON", clue: "Very rarely" },
        { phrase: "UNDER THE WEATHER", clue: "Feeling ill" }
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
}

async function startNewGame() {
    const savedState = JSON.parse(localStorage.getItem('hangmanGameState'));
    const currentDate = new Date().toDateString();

    if (savedState && savedState.date === currentDate && !localStorage.getItem('hangmanGameReset')) {
        // Load saved game state
        phrase = savedState.phrase;
        clue = savedState.clue;
        guessedLetters = savedState.guessedLetters;
        remainingAttempts = savedState.remainingAttempts;
        hints = savedState.hints;
        startTime = Date.now() - savedState.elapsedTime;
        gameCompleted = savedState.gameCompleted;
    } else {
        // Start a new game
        const { phrase: newPhrase, clue: newClue } = await fetchPhraseAndClue();
        phrase = newPhrase.toUpperCase();
        clue = newClue;
        guessedLetters = [];
        remainingAttempts = maxAttempts;
        hints = 3;
        startTime = Date.now();
        gameCompleted = false;
        localStorage.removeItem('hangmanGameReset');
    }

    document.getElementById('hint-count').textContent = `Hints: ${hints}`;
    updatePhraseDisplay();
    updateClueDisplay();
    renderKeyboard();
    updateAttemptIcons();
    if (!gameCompleted) {
        startTimer();
    } else {
        showCompletionPopup(savedState.popupTitle, savedState.popupTime, savedState.popupScore);
    }
}

function updatePhraseDisplay() {
    const phraseDisplay = document.getElementById('phrase-display');
    phraseDisplay.innerHTML = phrase.split('').map(char => 
        char === ' ' ? '&nbsp;' : (guessedLetters.includes(char) ? char : '_')
    ).join(' ');
}

function updateClueDisplay() {
    const clueDisplay = document.getElementById('clue-display');
    clueDisplay.textContent = `Clue: ${clue}`;
}

function renderKeyboard() {
    const keyboard = document.getElementById('keyboard');
    keyboard.innerHTML = '';
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(letter => {
        const button = document.createElement('button');
        button.textContent = letter;
        button.disabled = guessedLetters.includes(letter);
        button.classList.toggle('disabled', guessedLetters.includes(letter));
        button.addEventListener('click', () => handleGuess(letter));
        keyboard.appendChild(button);
    });
}

function handleGuess(letter) {
    guessedLetters.push(letter);
    if (!phrase.includes(letter)) {
        remainingAttempts--;
        incorrectSound.play();
        updateAttemptIcons();
    } else {
        correctSound.play();
    }
    updatePhraseDisplay();
    renderKeyboard();
    checkGameStatus();
    saveGameState();
}

function updateAttemptIcons() {
    const attemptsContainer = document.getElementById('attempt-icons');
    attemptsContainer.innerHTML = '';
    for (let i = 0; i < maxAttempts; i++) {
        const icon = document.createElement('div');
        icon.classList.add('attempt-icon');
        if (i >= remainingAttempts) {
            icon.classList.add('used');
        }
        attemptsContainer.appendChild(icon);
    }
}

function checkGameStatus() {
    if (remainingAttempts <= 0) {
        clearInterval(timerInterval);
        loseSound.play();
        showCompletionPopup('Failed', `The correct phrase was: ${phrase}`);
        gameCompleted = true;
    } else if (phrase.split('').every(char => char === ' ' || guessedLetters.includes(char))) {
        clearInterval(timerInterval);
        const timeTaken = Math.floor((Date.now() - startTime) / 1000);
        const score = calculateScore(timeTaken);
        winSound.play();
        showCompletionPopup('Congratulations', `Time: ${timeTaken}s`, `Score: ${score}`);
        gameCompleted = true;
    }
    saveGameState();
}

function calculateScore(timeTaken) {
    return Math.max(1000 - timeTaken * 10, 0);
}

function showCompletionPopup(title, timeText, scoreText = '') {
    document.getElementById('popup-title').textContent = title;
    document.getElementById('completion-time').textContent = timeText;
    document.getElementById('score').textContent = scoreText;
    document.getElementById('overlay').classList.remove('hidden');
    
    const gameState = JSON.parse(localStorage.getItem('hangmanGameState')) || {};
    gameState.popupTitle = title;
    gameState.popupTime = timeText;
    gameState.popupScore = scoreText;
    localStorage.setItem('hangmanGameState', JSON.stringify(gameState));
}

function startTimer() {
    timerInterval = setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        document.getElementById('timer').textContent = `Time: ${elapsedTime}s`;
        saveGameState();
    }, 1000);
}

function saveGameState() {
    const gameState = {
        date: new Date().toDateString(),
        phrase,
        clue,
        guessedLetters,
        remainingAttempts,
        hints,
        elapsedTime: Date.now() - startTime,
        gameCompleted
    };
    localStorage.setItem('hangmanGameState', JSON.stringify(gameState));
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
        resetGame();
    }, timeUntilReset);
}

function resetGame() {
    localStorage.removeItem('hangmanGameState');
    localStorage.setItem('hangmanGameReset', true);
    location.reload();
}

document.getElementById('hint').addEventListener('click', () => {
    if (hints > 0) {
        alert(`Hint: ${clue}`);
        hints--;
        document.getElementById('hint-count').textContent = `Hints: ${hints}`;
        saveGameState();
    } else {
        alert('No more hints available!');
    }
});

document.getElementById('close-popup').addEventListener('click', () => {
    document.getElementById('overlay').classList.add('hidden');
});

document.getElementById('auto-complete').addEventListener('click', autoCompletePuzzle);

function autoCompletePuzzle() {
    phrase.split('').forEach(char => {
        if (char !== ' ' && !guessedLetters.includes(char)) {
            guessedLetters.push(char);
        }
    });
    updatePhraseDisplay();
    renderKeyboard();
    checkGameStatus();
}

startNewGame();
scheduleDailyReset();
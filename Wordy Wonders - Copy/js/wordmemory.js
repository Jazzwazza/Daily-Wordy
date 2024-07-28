let images = [
    'image1.jpg', 'image2.jpg', 'image3.jpg', 'image4.jpg', 'image5.jpg',
    'image6.jpg', 'image7.jpg', 'image8.jpg', 'image9.jpg', 'image10.jpg',
    'image11.jpg', 'image12.jpg', 'image13.jpg', 'image14.jpg', 'image15.jpg',
    'image16.jpg', 'image17.jpg', 'image18.jpg', 'image19.jpg', 'image20.jpg'
];
let flippedCards = [];
let matchedPairs = 0;
let timerInterval;
let startTime;
let score = 0;
let gameCompleted = false;

async function startNewGame() {
    const savedState = JSON.parse(localStorage.getItem('wordMemoryGameState'));
    const currentDate = new Date().toDateString();

    if (savedState && savedState.date === currentDate && !localStorage.getItem('wordMemoryGameReset')) {
        // Load saved game state
        images = savedState.images;
        matchedPairs = savedState.matchedPairs;
        score = savedState.score;
        startTime = Date.now() - savedState.elapsedTime;
        gameCompleted = savedState.gameCompleted;
        renderGrid(savedState.flippedCards);
    } else {
        // Start a new game
        images = [...images, ...images]; // Duplicate images for pairs
        images.sort(() => Math.random() - 0.5); // Shuffle images
        matchedPairs = 0;
        score = 0;
        startTime = Date.now();
        gameCompleted = false;
        localStorage.removeItem('wordMemoryGameReset');
        renderGrid();
    }

    if (!gameCompleted) {
        startTimer();
    } else {
        const timeTaken = Math.floor((Date.now() - startTime) / 1000);
        showCompletionPopup(savedState.popupTitle, savedState.popupTime, savedState.popupScore);
    }
    updateScore();
}

function renderGrid(savedFlippedCards = []) {
    const grid = document.getElementById('memory-grid');
    grid.innerHTML = '';
    images.forEach((image, index) => {
        const card = document.createElement('div');
        card.classList.add('memory-card');
        card.dataset.image = image;
        card.dataset.index = index;
        
        const front = document.createElement('div');
        front.classList.add('front');
        front.textContent = '?';
        
        const back = document.createElement('div');
        back.classList.add('back');
        back.style.backgroundImage = `url('images/memory-cards/${image}')`;
        back.style.backgroundSize = 'cover';
        back.style.backgroundPosition = 'center';
        
        card.appendChild(front);
        card.appendChild(back);
        
        if (savedFlippedCards.includes(index)) {
            card.classList.add('flipped', 'matched');
        }
        
        card.addEventListener('click', flipCard);
        grid.appendChild(card);
    });
}

function flipCard() {
    if (flippedCards.length < 2 && !this.classList.contains('flipped') && !this.classList.contains('matched')) {
        this.classList.add('flipped');
        flippedCards.push(this);

        if (flippedCards.length === 2) {
            setTimeout(checkMatch, 1000);
        }
    }
}

function checkMatch() {
    const [card1, card2] = flippedCards;
    if (card1.dataset.image === card2.dataset.image) {
        card1.classList.add('matched');
        card2.classList.add('matched');
        matchedPairs++;
        score += 10;
        updateScore();
        checkGameCompletion();
    } else {
        card1.classList.remove('flipped');
        card2.classList.remove('flipped');
        score = Math.max(0, score - 1);
        updateScore();
    }
    flippedCards = [];
}

function updateScore() {
    document.getElementById('score').textContent = `Score: ${score}`;
}

function startTimer() {
    timerInterval = setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        document.getElementById('timer').textContent = `Time: ${elapsedTime}s`;
        saveGameState();
    }, 1000);
}

function checkGameCompletion() {
    if (matchedPairs === images.length / 2) {
        clearInterval(timerInterval);
        const timeTaken = Math.floor((Date.now() - startTime) / 1000);
        showCompletionPopup('Congratulations', `Time: ${timeTaken}s`, `Score: ${score}`);
        gameCompleted = true;
        saveGameState();
    }
}

function showCompletionPopup(title, timeText, scoreText) {
    document.getElementById('popup-title').textContent = title;
    document.getElementById('completion-time').textContent = timeText;
    document.getElementById('final-score').textContent = scoreText;
    document.getElementById('overlay').classList.remove('hidden');
    saveGameState(true, title, timeText, scoreText);
}

function saveGameState(completed = false, popupTitle = '', popupTime = '', popupScore = '') {
    const flippedCardsIndexes = Array.from(document.querySelectorAll('.memory-card.flipped')).map(card => parseInt(card.dataset.index));
    const gameState = {
        date: new Date().toDateString(),
        images,
        matchedPairs,
        score,
        elapsedTime: Date.now() - startTime,
        flippedCards: flippedCardsIndexes,
        gameCompleted: completed,
        popupTitle,
        popupTime,
        popupScore
    };
    localStorage.setItem('wordMemoryGameState', JSON.stringify(gameState));
}

function resetGame() {
    localStorage.removeItem('wordMemoryGameState');
    localStorage.setItem('wordMemoryGameReset', true);
    location.reload();
}

document.getElementById('close-popup').addEventListener('click', () => {
    document.getElementById('overlay').classList.add('hidden');
});

document.getElementById('auto-complete').addEventListener('click', autoCompleteGame);

function autoCompleteGame() {
    document.querySelectorAll('.memory-card').forEach(card => {
        if (!card.classList.contains('matched')) {
            card.classList.add('flipped', 'matched');
        }
    });
    matchedPairs = images.length / 2;
    checkGameCompletion();
}

startNewGame();
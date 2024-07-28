document.getElementById('reset-daily-games').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all daily games? This will clear your progress.')) {
        // Clear Word Search game state
        localStorage.removeItem('wordSearchGameState');
        
        // Clear Hangman game state
        localStorage.removeItem('hangmanGameState');

        // Clear Word Memory game state
        localStorage.removeItem('wordMemoryGameState');

        // Set reset flags
        localStorage.setItem('wordSearchGameReset', true);
        localStorage.setItem('hangmanGameReset', true);
        localStorage.setItem('wordMemoryGameReset', true);

        alert('All daily games have been reset. You can now start fresh!');
        location.reload();
    }
});
<script>
document.addEventListener('DOMContentLoaded', () => {
    const gridDisplay = document.querySelector('.grid');
    const scoreDisplay = document.getElementById('score');
    const highScoreDisplay = document.getElementById('highScore');
    const startButton = document.getElementById('startButton');
    const restartButton = document.getElementById('restartButton');
    const soundToggle = document.getElementById('soundToggle');
    const themeToggle = document.getElementById('themeToggle');
    const moveSound = document.getElementById('moveSound');
    const mergeSound = document.getElementById('mergeSound');
    const winSound = document.getElementById('winSound');
    const loseSound = document.getElementById('loseSound');

    // Tiles
    let squares = [];

    // Scoring and settings
    let score = 0;
    let highScore = parseInt(localStorage.getItem('highScore'), 10) || 0;
    let isSoundOn = true;

    // Theme
    let isDarkTheme = localStorage.getItem('theme') === 'dark';

    // Initialize UI on load
    highScoreDisplay.textContent = highScore;
    if (isDarkTheme) {
        document.body.classList.add('dark-theme');
        themeToggle.textContent = 'Theme: Dark';
    }

    // Start the game
    startButton.addEventListener('click', () => {
        startButton.style.display = 'none';
        restartButton.style.display = 'inline-block';
        initializeGame();
    });

    // Restart the game
    restartButton.addEventListener('click', initializeGame);

    /**
     * Initializes the game board by clearing old tiles, resetting the score,
     * and generating two initial tiles.
     */
    function initializeGame() {
        gridDisplay.innerHTML = '';
        squares = [];
        score = 0;
        scoreDisplay.textContent = score;

        // Create 16 tiles
        for (let i = 0; i < 16; i++) {
            const square = document.createElement('div');
            square.dataset.value = '0';
            gridDisplay.appendChild(square);
            squares.push(square);
        }
        generateNewTile();
        generateNewTile();
        document.addEventListener('keyup', handleKeyPress); // Reattach key listener
    }

    /**
     * Generates a new tile with a value of 2 or 4 in an empty square.
     */
    function generateNewTile() {
        const emptySquares = squares.filter(square => square.dataset.value === '0');
        if (emptySquares.length > 0) {
            const randomSquare = emptySquares[Math.floor(Math.random() * emptySquares.length)];
            const newValue = Math.random() > 0.9 ? '4' : '2';
            randomSquare.dataset.value = newValue;
            randomSquare.textContent = newValue;
            updateTileAppearance(randomSquare);
            checkLose();
        }
    }

    /**
     * Updates the tile's CSS classes based on its value.
     */
    function updateTileAppearance(tile) {
        const value = tile.dataset.value;
        tile.className = 'tile';
        tile.classList.add(`tile-${value}`);
    }

    /**
     * Moves (and possibly merges) all tiles in the given direction.
     */
    function moveTiles(direction) {
        if (isSoundOn) moveSound.play();

        const rowsOrColumns = [];

        // Collect rows or columns depending on move direction
        if (direction === 'left' || direction === 'right') {
            for (let i = 0; i < 16; i += 4) {
                let row = squares.slice(i, i + 4);
                if (direction === 'right') row.reverse();
                rowsOrColumns.push(row);
            }
        } else {
            for (let i = 0; i < 4; i++) {
                let column = [
                    squares[i],
                    squares[i + 4],
                    squares[i + 8],
                    squares[i + 12]
                ];
                if (direction === 'down') column.reverse();
                rowsOrColumns.push(column);
            }
        }

        let moved = false;

        // For each row/column grouping, merge values
        rowsOrColumns.forEach(group => {
            const oldValues = group.map(square => parseInt(square.dataset.value, 10));
            const newValues = mergeValues(oldValues);

            for (let i = 0; i < group.length; i++) {
                // Check if at least one tile changed
                if (oldValues[i] !== newValues[i]) {
                    moved = true;
                }
                group[i].dataset.value = newValues[i].toString();
                group[i].textContent = newValues[i] === 0 ? '' : newValues[i];
                updateTileAppearance(group[i]);
            }
        });

        if (moved) {
            generateNewTile();
        }
    }

    /**
     * Merges adjacent matching values (e.g., 2 + 2 -> 4) in an array of four.
     * Returns the new array of values after merging.
     */
    function mergeValues(values) {
        // Filter out zero values
        const filtered = values.filter(val => val !== 0);

        for (let i = 0; i < filtered.length - 1; i++) {
            if (filtered[i] === filtered[i + 1]) {
                filtered[i] *= 2;
                score += filtered[i];
                filtered[i + 1] = 0;
                if (isSoundOn) mergeSound.play();
                updateHighScore();
            }
        }

        // Filter again to remove zeros from merged pairs and pad with zeros
        const merged = filtered.filter(val => val !== 0);
        while (merged.length < 4) {
            merged.push(0);
        }
        return merged;
    }

    /**
     * Updates and saves the high score if the current score exceeds it.
     */
    function updateHighScore() {
        if (score > highScore) {
            highScore = score;
            highScoreDisplay.textContent = highScore;
            localStorage.setItem('highScore', highScore);
        }
    }

    /**
     * Checks if 2048 has been reached (win condition).
     */
    function checkWin() {
        const hasWon = squares.some(square => square.dataset.value === '2048');
        if (hasWon) {
            if (isSoundOn) winSound.play();
            triggerConfetti();
            alert('Congratulations! You won!');
            document.removeEventListener('keyup', handleKeyPress);
        }
    }

    /**
     * Checks if there are no empty squares left and ends game if so.
     * (Note: This doesn’t check for possible merges, which is an additional check some versions do.)
     */
    function checkLose() {
        const noEmptySquares = !squares.some(square => square.dataset.value === '0');
        if (noEmptySquares) {
            alert('Game Over!');
            if (isSoundOn) loseSound.play();
            document.removeEventListener('keyup', handleKeyPress);
        }
    }

    /**
     * Handles arrow key presses.
     */
    function handleKeyPress(event) {
        switch (event.key) {
            case 'ArrowRight':
                moveTiles('right');
                break;
            case 'ArrowLeft':
                moveTiles('left');
                break;
            case 'ArrowDown':
                moveTiles('down');
                break;
            case 'ArrowUp':
                moveTiles('up');
                break;
            default:
                return; // Ignore other keys
        }
        checkWin();
    }

    document.addEventListener('keyup', handleKeyPress);

    // Swipe gestures for mobile
    let touchStartX = 0;
    let touchStartY = 0;

    gridDisplay.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });

    gridDisplay.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;

        if (Math.abs(dx) > Math.abs(dy)) {
            moveTiles(dx > 0 ? 'right' : 'left');
        } else {
            moveTiles(dy > 0 ? 'down' : 'up');
        }
        checkWin();
    });

    /**
     * Renders and clears confetti on win.
     */
    function triggerConfetti() {
        // If confetti.js is loaded
        const confettiSettings = { target: 'confetti' };
        const confetti = new ConfettiGenerator(confettiSettings);
        confetti.render();
        setTimeout(() => confetti.clear(), 5000);
    }

    // Sound toggle
    soundToggle.addEventListener('click', () => {
        isSoundOn = !isSoundOn;
        soundToggle.textContent = `Sound: ${isSoundOn ? 'On' : 'Off'}`;
    });

    // Theme toggle
    themeToggle.addEventListener('click', () => {
        isDarkTheme = !isDarkTheme;
        document.body.classList.toggle('dark-theme', isDarkTheme);
        themeToggle.textContent = `Theme: ${isDarkTheme ? 'Dark' : 'Light'}`;
        localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
    });
});
</script>

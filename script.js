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
    let squares = [];
    let score = 0;
    let highScore = localStorage.getItem('highScore') || 0;
    let isSoundOn = true;
    let isDarkTheme = localStorage.getItem('theme') === 'dark';
    highScoreDisplay.innerHTML = highScore;

    // Apply saved theme
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

    // Initialize the game
    function initializeGame() {
        gridDisplay.innerHTML = '';
        squares = [];
        score = 0;
        scoreDisplay.innerHTML = score;
        for (let i = 0; i < 16; i++) {
            const square = document.createElement('div');
            square.setAttribute('data-value', '0');
            gridDisplay.appendChild(square);
            squares.push(square);
        }
        generateNewTile();
        generateNewTile();
    }

    // Generate a new tile with value 2 or 4
    function generateNewTile() {
        const emptySquares = squares.filter(square => square.getAttribute('data-value') === '0');
        if (emptySquares.length > 0) {
            const randomSquare = emptySquares[Math.floor(Math.random() * emptySquares.length)];
            const newValue = Math.random() > 0.9 ? '4' : '2';
            randomSquare.setAttribute('data-value', newValue);
            randomSquare.innerHTML = newValue;
            updateTileAppearance(randomSquare);
            checkLose();
        }
    }

    // Update tile appearance based on value
    function updateTileAppearance(tile) {
        const value = tile.getAttribute('data-value');
        tile.className = 'tile';
        tile.classList.add(`tile-${value}`);
    }

    // Combine tiles and move them in a direction
    function moveTiles(direction) {
        if (isSoundOn) moveSound.play();

        const rowsOrColumns = [];
        if (['left', 'right'].includes(direction)) {
            for (let i = 0; i < 16; i += 4) {
                let row = squares.slice(i, i + 4);
                if (direction === 'right') row = row.reverse();
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
                if (direction === 'down') column = column.reverse();
                rowsOrColumns.push(column);
            }
        }

        let moved = false;
        rowsOrColumns.forEach(group => {
            const values = group.map(square => parseInt(square.getAttribute('data-value')));
            const newValues = mergeValues(values);

            for (let i = 0; i < group.length; i++) {
                if (group[i].getAttribute('data-value') !== newValues[i].toString()) moved = true;
                group[i].setAttribute('data-value', newValues[i]);
                group[i].innerHTML = newValues[i] === 0 ? '' : newValues[i];
                updateTileAppearance(group[i]);
            }
        });

        if (moved) generateNewTile();
    }

    // Merge values in a row or column
    function mergeValues(values) {
        const filteredValues = values.filter(value => value !== 0);
        for (let i = 0; i < filteredValues.length - 1; i++) {
            if (filteredValues[i] === filteredValues[i + 1]) {
                filteredValues[i] *= 2;
                score += filteredValues[i];
                scoreDisplay.innerHTML = score;
                filteredValues[i + 1] = 0;
                if (isSoundOn) mergeSound.play();
                updateHighScore();
            }
        }
        return filteredValues.filter(value => value !== 0).concat(Array(4 - filteredValues.length).fill(0));
    }

    // Update high score
    function updateHighScore() {
        if (score > highScore) {
            highScore = score;
            highScoreDisplay.innerHTML = highScore;
            localStorage.setItem('highScore', highScore);
        }
    }

    // Check for win
    function checkWin() {
        if (squares.some(square => square.getAttribute('data-value') === '2048')) {
            if (isSoundOn) winSound.play();
            triggerConfetti();
            alert('Congratulations! You won!');
            document.removeEventListener('keyup', handleKeyPress);
        }
    }

    // Check for lose
    function checkLose() {
        if (!squares.some(square => square.getAttribute('data-value') === '0')) {
            alert('Game Over!');
            if (isSoundOn) loseSound.play();
            document.removeEventListener('keyup', handleKeyPress);
        }
    }

    // Handle keyboard input
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
        }
        checkWin();
    }

    document.addEventListener('keyup', handleKeyPress);

    // Restart the game
    restartButton.addEventListener('click', initializeGame);

    // Swipe gestures for mobile
    let touchStartX, touchStartY;
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

    // Confetti animation
    function triggerConfetti() {
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

document.getElementById('Start-button').addEventListener('click', function() {
    window.location.href = 'puzzelmemory.html';
});

document.getElementById('player-name').addEventListener('input', function() {
    const playerName = document.getElementById('player-name').value;
    const startButton = document.getElementById('Start-button');
    startButton.disabled = playerName.trim() === '';
});

const playerNameInput = document.getElementById('player-name');
const startButton = document.getElementById('Start-button');

playerNameInput.addEventListener('input', () => {
    const playerName = playerNameInput.value;
    localStorage.setItem('playerName', playerName);
    startButton.disabled = !playerName;
});

const entryScreen = document.getElementById('entry-screen');
const mindScreen = document.getElementById('mind-screen');
const enterBtn = document.getElementById('enter-btn');
const restartBtn = document.getElementById('restart-btn');
const quoteContainers = document.querySelectorAll('.quote-container');

// Enter mind screen
enterBtn.addEventListener('click', () => {
  entryScreen.classList.add('hidden');
  mindScreen.classList.add('active');
});

// Hover to play audio and reveal quote
quoteContainers.forEach(container => {
  const audio = container.querySelector('.quote-audio');
  
  container.addEventListener('mouseenter', () => {
    container.classList.add('revealed');
    audio.play();
  });
});

// Restart
restartBtn.addEventListener('click', () => {
  // Stop all audio
  document.querySelectorAll('.quote-audio').forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
  
  // Hide all quotes and show scribbles again
  quoteContainers.forEach(container => {
    container.classList.remove('revealed');
  });
  
  // Reset to entry screen
  mindScreen.classList.remove('active');
  entryScreen.classList.remove('hidden');
});
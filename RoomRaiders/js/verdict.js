// verdict.js — handles the date me or not interaction

const btnYes = document.getElementById('btn-yes');
const btnNo = document.getElementById('btn-no');
const questionEl = document.querySelector('.verdict-question');
const resultEl = document.getElementById('verdict-result');
const resultEmoji = document.getElementById('result-emoji');
const resultTitle = document.getElementById('result-title');
const resultMsg = document.getElementById('result-msg');

// ─── Response pools ──────────────────────────────────────

const yesResponses = [
  {
    emoji: '😌',
    title: 'I knew it.',
    msg: "You clearly have excellent taste.",
  },
];

const noResponses = [
  {
    emoji: '💀',
    title: 'Devastating.',
    msg: "My stuff and i will remember this. Good day.",
  },
  {
    emoji: '😮‍💨',
    title: 'Fair enough.',
    msg: "I respect it. We're probably not compatible anyway.",
  },
];

// ─── Helpers ─────────────────────────────────────────────

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function showResult(response) {
  resultEmoji.textContent = response.emoji;
  resultTitle.textContent = response.title;
  resultMsg.textContent = response.msg;

  questionEl.classList.add('hidden');
  resultEl.classList.remove('hidden');
}

// ─── Listeners ───────────────────────────────────────────

btnYes.addEventListener('click', () => {
  showResult(pickRandom(yesResponses));
});

btnNo.addEventListener('click', () => {
  showResult(pickRandom(noResponses));
});

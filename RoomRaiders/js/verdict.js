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
    title: 'i knew it.',
    msg: "you clearly have excellent taste. also thank you for not judging the mystery item in the corner.",
  },
  {
    emoji: '🫶',
    title: 'valid choice.',
    msg: "the objects spoke for themselves. i rest my case.",
  },
  {
    emoji: '🥹',
    title: 'wow okay.',
    msg: "you just agreed to date someone based on their stuff. that's kind of iconic of you.",
  },
];

const noResponses = [
  {
    emoji: '💀',
    title: 'devastating.',
    msg: "the objects and i will remember this. good day.",
  },
  {
    emoji: '😮‍💨',
    title: 'fair enough.',
    msg: "i respect it. my stuff is a lot. we're probably not compatible anyway.",
  },
  {
    emoji: '🫠',
    title: 'no?? really??',
    msg: "so the [object name here] didn't win you over? that's wild. truly wild.",
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

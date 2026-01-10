/**
 * Leben in Deutschland - Test Trainer
 * Main application logic
 */

// Global state
let questions = [];
let currentMode = null;
let currentQuestions = [];
let currentIndex = 0;
let correctCount = 0;
let wrongCount = 0;
let startTime = null;
let timerInterval = null;
let translationVisible = false;

// Load questions from JSON file
async function loadQuestions() {
  try {
    const response = await fetch('questions.json');
    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid questions format');
    }
    questions = data;
    updateStats();
    console.log('Loaded ' + questions.length + ' questions');
  } catch (error) {
    console.error('Failed to load questions:', error);
    const homeScreen = document.getElementById('home-screen');
    if (homeScreen) {
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = 'color:#DD0000;text-align:center;padding:20px;';
      errorDiv.textContent = 'Failed to load questions. Please refresh the page.';
      homeScreen.insertBefore(errorDiv, homeScreen.firstChild);
    }
  }
}

// Default progress structure
function getDefaultProgress() {
  return {
    learned: [],
    wrong: [],
    sessions: 0,
    streak: 0,
    lastDate: null
  };
}

// Progress management (localStorage) with error handling
function loadProgress() {
  try {
    const data = localStorage.getItem('lid-progress');
    if (!data) return getDefaultProgress();
    const parsed = JSON.parse(data);
    // Validate structure
    if (!Array.isArray(parsed.learned)) parsed.learned = [];
    if (!Array.isArray(parsed.wrong)) parsed.wrong = [];
    return parsed;
  } catch (error) {
    console.error('Progress load failed:', error);
    return getDefaultProgress();
  }
}

function saveProgress(progress) {
  localStorage.setItem('lid-progress', JSON.stringify(progress));
}

function updateStats() {
  const progress = loadProgress();
  document.getElementById('stat-learned').textContent = progress.learned.length;
  document.getElementById('stat-streak').textContent = progress.streak;
  document.getElementById('stat-total').textContent = questions.length;
}

// Screen navigation
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// Utility functions
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Navigation
function goHome() {
  if (timerInterval) clearInterval(timerInterval);
  updateStats();
  showScreen('home-screen');
}

// Quiz modes
function startPractice() {
  currentMode = 'practice';
  const progress = loadProgress();
  let pool = [];
  const wrongIds = new Set(progress.wrong);
  const learnedIds = new Set(progress.learned);

  // Priority 1: Wrong answers
  questions.forEach(q => {
    if (wrongIds.has(q.id)) pool.push(q);
  });

  // Priority 2: Unlearned questions
  questions.forEach(q => {
    if (!learnedIds.has(q.id) && !wrongIds.has(q.id)) pool.push(q);
  });

  // Fill with learned if needed
  if (pool.length < 20) {
    const learned = questions.filter(q => learnedIds.has(q.id));
    shuffleArray(learned);
    pool = pool.concat(learned.slice(0, 20 - pool.length));
  }

  shuffleArray(pool);
  currentQuestions = pool.slice(0, 20);
  startQuiz(15 * 60); // 15 minutes
}

function startExam() {
  currentMode = 'exam';
  const general = questions.filter(q => !q.isBerlin);
  const berlin = questions.filter(q => q.isBerlin);

  shuffleArray(general);
  shuffleArray(berlin);

  // 30 general + 3 Berlin = 33 questions (like real test)
  currentQuestions = [...general.slice(0, 30), ...berlin.slice(0, 3)];
  shuffleArray(currentQuestions);
  startQuiz(60 * 60); // 60 minutes
}

function startQuiz(seconds) {
  currentIndex = 0;
  correctCount = 0;
  wrongCount = 0;
  startTime = Date.now();
  showScreen('quiz-screen');
  startTimer(seconds);
  showQuestion();
}

// Timer
function startTimer(seconds) {
  let remaining = seconds;
  const element = document.getElementById('quiz-timer');

  function update() {
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    element.textContent = mins + ':' + secs.toString().padStart(2, '0');

    if (remaining <= 0) {
      clearInterval(timerInterval);
      endQuiz();
    }
    remaining--;
  }

  update();
  timerInterval = setInterval(update, 1000);
}

// Language toggle
function setLanguage(lang) {
  translationVisible = (lang === 'en');

  // Update toggle pill UI
  document.getElementById('lang-de').classList.toggle('active', !translationVisible);
  document.getElementById('lang-en').classList.toggle('active', translationVisible);

  // Show/hide translations
  document.getElementById('question-en').classList.toggle('visible', translationVisible);
  document.querySelectorAll('.answer-en').forEach(el =>
    el.classList.toggle('visible', translationVisible)
  );
}

// Question display
function showQuestion() {
  translationVisible = false;
  const q = currentQuestions[currentIndex];
  const total = currentQuestions.length;

  document.getElementById('quiz-progress').textContent = (currentIndex + 1) + '/' + total;
  document.getElementById('progress-fill').style.width = ((currentIndex + 1) / total * 100) + '%';
  document.getElementById('question-number').textContent = 'Frage ' + q.id;
  document.getElementById('question-de').textContent = q.questionDE;
  document.getElementById('question-en').textContent = q.questionEN;
  document.getElementById('question-en').classList.remove('visible');

  // Reset language toggle to DE
  document.getElementById('lang-de').classList.add('active');
  document.getElementById('lang-en').classList.remove('active');

  const answersContainer = document.getElementById('answers');
  answersContainer.innerHTML = '';

  q.answersDE.forEach((answerDE, index) => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';

    // Safe DOM creation (prevents XSS)
    const answerDEDiv = document.createElement('div');
    answerDEDiv.className = 'answer-de';
    answerDEDiv.textContent = answerDE;

    const answerENDiv = document.createElement('div');
    answerENDiv.className = 'answer-en';
    answerENDiv.textContent = q.answersEN[index];

    btn.appendChild(answerDEDiv);
    btn.appendChild(answerENDiv);
    btn.onclick = function() { selectAnswer(index); };
    answersContainer.appendChild(btn);
  });

  document.getElementById('next-btn').classList.remove('visible');
}

// Answer selection
function selectAnswer(index) {
  const q = currentQuestions[currentIndex];
  const buttons = document.querySelectorAll('.answer-btn');
  const progress = loadProgress();

  buttons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.correctIndex) {
      btn.classList.add('correct');
    } else if (i === index) {
      btn.classList.add('wrong');
    }
  });

  if (index === q.correctIndex) {
    correctCount++;
    if (!progress.learned.includes(q.id)) {
      progress.learned.push(q.id);
    }
    progress.wrong = progress.wrong.filter(id => id !== q.id);
  } else {
    wrongCount++;
    if (!progress.wrong.includes(q.id)) {
      progress.wrong.push(q.id);
    }
  }

  saveProgress(progress);
  document.getElementById('next-btn').classList.add('visible');
}

// Navigation
function nextQuestion() {
  currentIndex++;
  if (currentIndex >= currentQuestions.length) {
    showResults();
  } else {
    showQuestion();
  }
}

function endQuiz() {
  if (timerInterval) clearInterval(timerInterval);
  if (currentIndex > 0) {
    showResults();
  } else {
    goHome();
  }
}

// Results
function showResults() {
  if (timerInterval) clearInterval(timerInterval);

  const total = currentQuestions.length;
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  document.getElementById('results-score').textContent = correctCount;
  document.getElementById('results-total').textContent = total;
  document.getElementById('results-correct').textContent = correctCount;
  document.getElementById('results-wrong').textContent = wrongCount;
  document.getElementById('results-time').textContent = mins + ':' + secs.toString().padStart(2, '0');

  const statusEl = document.getElementById('results-status');
  const messageEl = document.getElementById('results-message');

  if (currentMode === 'exam') {
    const passed = correctCount >= 15;
    const citizenship = correctCount >= 17;

    statusEl.className = 'results-status ' + (passed ? 'pass' : 'fail');
    statusEl.textContent = passed ? (citizenship ? 'PASSED (Citizenship!)' : 'PASSED') : 'NOT YET';
    messageEl.textContent = passed
      ? (citizenship ? 'You qualify for citizenship (17+)!' : 'You passed for residency (15+)!')
      : 'Need 15+ correct. Keep practicing!';
  } else {
    statusEl.className = 'results-status pass';
    statusEl.textContent = 'COMPLETE';
    messageEl.textContent = 'Great session! ' + correctCount + '/' + total + ' correct.';
  }

  // Update streak
  const progress = loadProgress();
  const today = new Date().toDateString();

  if (progress.lastDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    progress.streak = (progress.lastDate === yesterday) ? progress.streak + 1 : 1;
    progress.lastDate = today;
  }

  progress.sessions++;
  saveProgress(progress);
  showScreen('results-screen');
}

// Catalog
function showCatalog() {
  showScreen('catalog-screen');
  filterCategory('all');
}

function filterCategory(category) {
  document.querySelectorAll('.category-tab').forEach(tab => {
    const isActive = tab.textContent.toLowerCase().includes(category) ||
                     (category === 'all' && tab.textContent.includes('All'));
    tab.classList.toggle('active', isActive);
  });

  const progress = loadProgress();
  const learned = new Set(progress.learned);

  let filtered = questions;
  if (category !== 'all') {
    if (category === 'berlin') {
      filtered = questions.filter(q => q.isBerlin);
    } else {
      filtered = questions.filter(q => q.category === category && !q.isBerlin);
    }
  }

  const list = document.getElementById('catalog-list');
  list.innerHTML = '';

  filtered.forEach(q => {
    const div = document.createElement('div');
    div.className = 'catalog-item' + (learned.has(q.id) ? ' learned' : '');

    // Safe DOM creation (prevents XSS)
    const textDiv = document.createElement('div');
    textDiv.className = 'catalog-item-text';
    textDiv.textContent = q.id + '. ' + q.questionDE.substring(0, 50) + '...';

    const statusDiv = document.createElement('div');
    statusDiv.className = 'catalog-item-status';
    statusDiv.textContent = learned.has(q.id) ? '\u2713' : '';

    div.appendChild(textDiv);
    div.appendChild(statusDiv);
    div.onclick = function() { showSingle(q); };
    list.appendChild(div);
  });
}

function showSingle(question) {
  currentMode = 'single';
  currentQuestions = [question];
  currentIndex = 0;
  correctCount = 0;
  wrongCount = 0;
  startTime = Date.now();
  showScreen('quiz-screen');
  document.getElementById('quiz-timer').textContent = '';
  if (timerInterval) clearInterval(timerInterval);
  showQuestion();
}

function resetProgress() {
  if (confirm('Reset all progress?')) {
    localStorage.removeItem('lid-progress');
    updateStats();
    alert('Reset complete!');
  }
}

// Expose functions globally for onclick handlers
window.startPractice = startPractice;
window.startExam = startExam;
window.showCatalog = showCatalog;
window.resetProgress = resetProgress;
window.goHome = goHome;
window.endQuiz = endQuiz;
window.nextQuestion = nextQuestion;
window.setLanguage = setLanguage;
window.filterCategory = filterCategory;

// Initialize app
loadQuestions();

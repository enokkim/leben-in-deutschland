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

// Browse mode state
let browseQuestions = [];      // Full filtered list for browsing
let browseIndex = 0;           // Current position in browse list
let browseFilter = 'all';      // Current category filter
let browseScrollPosition = 0;  // Scroll position to restore
let swipeHandlersInitialized = false;  // Prevent duplicate listeners

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
  updateReviewButtonState(progress.learned.length);
}

function updateReviewButtonState(learnedCount) {
  const reviewBtn = document.getElementById('review-btn');
  const reviewDesc = document.getElementById('review-btn-desc');
  if (!reviewBtn || !reviewDesc) return;

  if (learnedCount === 0) {
    reviewBtn.disabled = true;
    reviewBtn.classList.add('disabled');
    reviewDesc.textContent = 'Complete questions first to unlock';
  } else {
    reviewBtn.disabled = false;
    reviewBtn.classList.remove('disabled');
    reviewDesc.textContent = 'Practice ' + Math.min(learnedCount, 20) + ' questions you\'ve mastered';
  }
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

function startReview() {
  currentMode = 'review';
  const progress = loadProgress();
  const learnedIds = new Set(progress.learned);
  let pool = questions.filter(q => learnedIds.has(q.id));

  shuffleArray(pool);
  currentQuestions = pool.slice(0, 20);
  startQuizUntimed();
}

function startQuizUntimed() {
  currentIndex = 0;
  correctCount = 0;
  wrongCount = 0;
  startTime = Date.now();
  showScreen('quiz-screen');

  if (timerInterval) clearInterval(timerInterval);
  document.getElementById('quiz-timer').textContent = '';

  showQuestion();
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

  // Determine which question to show based on mode
  let q, displayIndex, totalQuestions;

  if (currentMode === 'browse') {
    q = browseQuestions[browseIndex];
    displayIndex = browseIndex + 1;
    totalQuestions = browseQuestions.length;
  } else {
    q = currentQuestions[currentIndex];
    displayIndex = currentIndex + 1;
    totalQuestions = currentQuestions.length;
  }

  // Update progress display
  let progressText = displayIndex + '/' + totalQuestions;
  if (currentMode === 'browse' && browseFilter !== 'all') {
    progressText += ' (' + browseFilter.charAt(0).toUpperCase() + browseFilter.slice(1) + ')';
  }

  document.getElementById('quiz-progress').textContent = progressText;
  document.getElementById('progress-fill').style.width = (displayIndex / totalQuestions * 100) + '%';
  document.getElementById('question-number').textContent = 'Frage ' + q.id;
  document.getElementById('question-de').textContent = q.questionDE;
  document.getElementById('question-en').textContent = q.questionEN;
  document.getElementById('question-en').classList.remove('visible');

  // Reset language toggle to DE
  document.getElementById('lang-de').classList.add('active');
  document.getElementById('lang-en').classList.remove('active');

  // Show status badge in browse mode
  const statusBadge = document.getElementById('status-badge');
  if (statusBadge && currentMode === 'browse') {
    const status = getQuestionStatus(q.id);
    statusBadge.className = 'status-badge status-' + status;

    if (status === 'learned') {
      statusBadge.textContent = '\u2713';
      statusBadge.setAttribute('aria-label', 'Previously answered correctly');
    } else if (status === 'wrong') {
      statusBadge.textContent = '\u2717';
      statusBadge.setAttribute('aria-label', 'Needs review');
    } else {
      statusBadge.textContent = '\u25CB';
      statusBadge.setAttribute('aria-label', 'New question');
    }

    statusBadge.style.display = 'flex';
  } else if (statusBadge) {
    statusBadge.style.display = 'none';
  }

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
  // Get correct question based on mode
  const q = (currentMode === 'browse') ? browseQuestions[browseIndex] : currentQuestions[currentIndex];
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

  // Handle browse mode
  if (currentMode === 'browse') {
    // Remove browse mode class
    document.getElementById('quiz-screen').classList.remove('browse-mode');
    returnToCatalog();
    return;
  }

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
  } else if (currentMode === 'review') {
    statusEl.className = 'results-status pass';
    statusEl.textContent = 'REVIEW COMPLETE';
    messageEl.textContent = 'Review session finished! ' + correctCount + '/' + total + ' correct.';
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

// Helper: Get question review status
function getQuestionStatus(questionId) {
  const progress = loadProgress();
  if (progress.learned.includes(questionId)) return 'learned';
  if (progress.wrong.includes(questionId)) return 'wrong';
  return 'new';
}

// Helper: Return to catalog with preserved state
function returnToCatalog() {
  showScreen('catalog-screen');
  filterCategory(browseFilter);

  // Restore scroll position
  const catalogList = document.getElementById('catalog-list');
  if (catalogList) {
    catalogList.scrollTop = browseScrollPosition;
  }
}

// Browse mode navigation
function prevBrowseQuestion() {
  if (currentMode !== 'browse') return;

  // Wrap around to last question
  browseIndex--;
  if (browseIndex < 0) {
    browseIndex = browseQuestions.length - 1;
  }

  showQuestion();
}

function nextBrowseQuestion() {
  if (currentMode !== 'browse') return;

  // Wrap around to first question
  browseIndex++;
  if (browseIndex >= browseQuestions.length) {
    browseIndex = 0;
  }

  showQuestion();
}

// Swipe gesture handling
function initSwipeHandlers() {
  // Prevent duplicate initialization
  if (swipeHandlersInitialized) return;
  swipeHandlersInitialized = true;

  const questionCard = document.querySelector('.question-card');
  if (!questionCard) return;

  let touchStartX = 0;
  let touchEndX = 0;
  let touchMoved = false;  // Track if user actually moved their finger

  questionCard.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchMoved = false;  // Reset on new touch
  }, { passive: true });

  questionCard.addEventListener('touchmove', function(e) {
    touchEndX = e.changedTouches[0].screenX;
    touchMoved = true;  // Mark that movement occurred

    // Visual feedback during swipe
    const diff = touchEndX - touchStartX;
    if (Math.abs(diff) > 10) {
      questionCard.classList.toggle('swiping-left', diff < 0);
      questionCard.classList.toggle('swiping-right', diff > 0);
    }
  }, { passive: true });

  questionCard.addEventListener('touchend', function() {
    // Only process if user actually moved their finger (not just a tap)
    if (!touchMoved) {
      touchStartX = 0;
      touchEndX = 0;
      return;
    }

    const diff = touchEndX - touchStartX;

    // Clear visual feedback
    questionCard.classList.remove('swiping-left', 'swiping-right');

    // Minimum swipe distance: 50px
    if (Math.abs(diff) > 50 && currentMode === 'browse') {
      if (diff > 0) {
        // Swiped right -> previous question
        prevBrowseQuestion();
      } else {
        // Swiped left -> next question
        nextBrowseQuestion();
      }
    }

    touchStartX = 0;
    touchEndX = 0;
  }, { passive: true });

  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (currentMode !== 'browse') return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevBrowseQuestion();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextBrowseQuestion();
    }
  });
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
  const wrong = new Set(progress.wrong);

  let filtered = questions;
  if (category !== 'all') {
    if (category === 'berlin') {
      filtered = questions.filter(q => q.isBerlin);
    } else {
      filtered = questions.filter(q => q.category === category && !q.isBerlin);
    }
  }

  // Store for browse mode
  browseQuestions = filtered;
  browseFilter = category;

  const list = document.getElementById('catalog-list');
  list.innerHTML = '';

  filtered.forEach((q, index) => {
    const div = document.createElement('div');

    // Three-state styling
    let statusClass = '';
    if (learned.has(q.id)) {
      statusClass = ' learned';
    } else if (wrong.has(q.id)) {
      statusClass = ' wrong';
    }

    div.className = 'catalog-item' + statusClass;

    // Safe DOM creation (prevents XSS)
    const textDiv = document.createElement('div');
    textDiv.className = 'catalog-item-text';
    textDiv.textContent = q.id + '. ' + q.questionDE.substring(0, 50) + '...';

    const statusDiv = document.createElement('div');
    statusDiv.className = 'catalog-item-status';

    // Show appropriate icon
    if (learned.has(q.id)) {
      statusDiv.textContent = '\u2713';
      statusDiv.classList.add('status-learned');
    } else if (wrong.has(q.id)) {
      statusDiv.textContent = '\u2717';
      statusDiv.classList.add('status-wrong');
    }

    div.appendChild(textDiv);
    div.appendChild(statusDiv);

    // Enter browse mode at this index
    div.onclick = function() {
      // Save scroll position before leaving
      browseScrollPosition = list.scrollTop;
      showBrowse(index);
    };

    list.appendChild(div);
  });
}

// Enter browse mode at specific question index
function showBrowse(index) {
  currentMode = 'browse';
  browseIndex = index;
  correctCount = 0;
  wrongCount = 0;
  startTime = Date.now();
  showScreen('quiz-screen');
  document.getElementById('quiz-timer').textContent = '';
  if (timerInterval) clearInterval(timerInterval);

  // Add browse mode class to quiz screen
  document.getElementById('quiz-screen').classList.add('browse-mode');

  showQuestion();
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
window.startReview = startReview;
window.showCatalog = showCatalog;
window.resetProgress = resetProgress;
window.goHome = goHome;
window.endQuiz = endQuiz;
window.nextQuestion = nextQuestion;
window.setLanguage = setLanguage;
window.filterCategory = filterCategory;
window.prevBrowseQuestion = prevBrowseQuestion;
window.nextBrowseQuestion = nextBrowseQuestion;

// Initialize app
loadQuestions();

// Initialize swipe handlers after DOM loads
document.addEventListener('DOMContentLoaded', function() {
  initSwipeHandlers();
});

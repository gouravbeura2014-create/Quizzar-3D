/**
 * PRO Active Session Engine with Live API Integration
 */

// Utility to safely decode HTML entities from the API
function htmlDecode(input) {
  const doc = new DOMParser().parseFromString(input, "text/html");
  return doc.documentElement.textContent;
}

class GameSession {
  constructor(topic) {
    this.topic = topic;
    this.questions =;
    this.currentIndex = 0;
    this.correctAnswersCount = 0;
    this.score = 0;
    this.timer = null;
    this.timeLimit = 15;
    this.timeLeft = this.timeLimit;
    
    this.radius = 52;
    this.circumference = 2 * Math.PI * this.radius;

    this.timerRing = document.getElementById('timer-ring');
    if (this.timerRing) {
      this.timerRing.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
    }
  }

  async start() {
    const titleEl = document.getElementById('current-arena-name');
    if (titleEl) titleEl.textContent = "ESTABLISHING UPLINK...";

    // Map internal topics to Open Trivia DB category IDs
    const categoryMap = { science: 17, tech: 18, history: 23 };
    const categoryId = categoryMap[this.topic] || 17;
    
    try {
      // Fetch dynamic questions from the Open Trivia API
      const response = await fetch(`https://opentdb.com/api.php?amount=10&category=${categoryId}&type=multiple`);
      const data = await response.json();
      
      this.questions = data.results.map(q => {
        const decodedCorrect = htmlDecode(q.correct_answer);
        const options =;
        
        // Shuffle options array randomly
        options.sort(() => Math.random() - 0.5);
        
        return {
          q: htmlDecode(q.question),
          a: options,
          c: options.indexOf(decodedCorrect)
        };
      });

      if (titleEl) titleEl.textContent = this.topic.toUpperCase();
      this.renderQuestion();
    } catch (error) {
      console.error("API Error:", error);
      if (titleEl) titleEl.textContent = "CONNECTION FAILED";
      document.getElementById('question-text').textContent = "Failed to load database. Please return to lobby.";
    }
  }

  renderQuestion() {
    this.resetTimer();
    
    if (this.currentIndex >= this.questions.length) {
      this.finishSession();
      return;
    }

    const tracker = document.getElementById('question-tracker');
    if (tracker) tracker.textContent = `SEC_0${this.currentIndex + 1} // SEC_10`;

    const progressFill = document.getElementById('gameplay-progress-fill');
    if (progressFill) {
      const percentCompleted = (this.currentIndex / this.questions.length) * 100;
      progressFill.style.width = `${percentCompleted}%`;
    }

    const qData = this.questions[this.currentIndex];
    const textEl = document.getElementById('question-text');
    if (textEl) textEl.textContent = qData.q;

    const container = document.getElementById('responses-container');
    if (container) {
      container.innerHTML = '';
      qData.a.forEach((choice, idx) => {
        const btn = document.createElement('button');
        btn.className = 'clicky-button color-cyan response-option';
        btn.innerHTML = `
          <span class="button-edge"></span>
          <span class="button-front">${choice}</span>
        `;
        btn.addEventListener('click', () => this.evaluateAnswer(idx, btn));
        container.appendChild(btn);
      });
    }

    this.startTimer();
  }

  startTimer() {
    const textNumber = document.getElementById('countdown-text');
    this.timer = setInterval(() => {
      this.timeLeft--;
      if (textNumber) textNumber.textContent = this.timeLeft;

      const elapsed = this.timeLimit - this.timeLeft;
      const offset = (elapsed / this.timeLimit) * this.circumference;
      if (this.timerRing) this.timerRing.style.strokeDashoffset = offset;

      if (this.timeLeft <= 3) {
        if (this.timerRing) this.timerRing.style.stroke = '#ff007f';
        if (window.App && window.App.synth) App.synth.play('tick');
      } else {
        if (this.timerRing) this.timerRing.style.stroke = '#00f3ff';
      }

      if (this.timeLeft <= 0) {
        clearInterval(this.timer);
        this.evaluateAnswer(-1, null);
      }
    }, 1000);
  }

  resetTimer() {
    clearInterval(this.timer);
    this.timeLeft = this.timeLimit;
    const textNumber = document.getElementById('countdown-text');
    if (textNumber) textNumber.textContent = this.timeLeft;
    if (this.timerRing) {
      this.timerRing.style.strokeDashoffset = 0;
      this.timerRing.style.stroke = '#00f3ff';
    }
  }

  evaluateAnswer(selectedIndex, selectedButton) {
    clearInterval(this.timer);
    const qData = this.questions[this.currentIndex];
    
    document.querySelectorAll('.response-option').forEach(btn => btn.style.pointerEvents = 'none');

    let answerIsCorrect = selectedIndex === qData.c;

    if (answerIsCorrect) {
      this.correctAnswersCount++;
      this.score += 100;
      const scoreEl = document.getElementById('live-score');
      if (scoreEl) scoreEl.textContent = this.score;
      if (selectedButton) selectedButton.classList.add('correct');
      if (window.App && window.App.synth) App.synth.play('correct');
    } else {
      if (selectedButton) selectedButton.classList.add('incorrect');
      if (window.App && window.App.synth) App.synth.play('incorrect');
    }

    this.currentIndex++;
    
    setTimeout(() => {
      this.renderQuestion();
    }, 1200);
  }

  finishSession() {
    const finalAccuracy = Math.round((this.correctAnswersCount / this.questions.length) * 100);
    const xpReward = this.correctAnswersCount * 25;

    const payload = {
      topic: this.topic,
      score: finalAccuracy,
      xpGained: xpReward,
      rawScore: this.score
    };

    if (window.App && window.App.saveSessionResult) {
      App.saveSessionResult(payload);
    } else {
      localStorage.setItem('active_session', JSON.stringify(payload));
    }

    setTimeout(() => {
      window.location.href = 'results.html';
    }, 500);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.App && window.App.init) App.init();
  const activeTopic = localStorage.getItem('selected_topic') || 'science';
  const game = new GameSession(activeTopic);
  game.start();

  const abortBtn = document.getElementById('exit-game-btn');
  if (abortBtn) {
    abortBtn.addEventListener('click', () => {
      if (window.App && window.App.synth) App.synth.play('click');
      if (confirm("ABORT ACTIVE EXPEDITION?")) {
        window.location.href = 'index.html';
      }
    });
  }
});
      

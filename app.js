/* ==========================================================================
   DIMENSION3D ENGINE CONTROLLER (app.js)
   ========================================================================== */

/**
 * 1. Global State Management Utility Module (LocalStorage Database Serialization)
 * Encapsulates full game states and tracks historic profiles.[18, 19]
 */
const AppStorage = {
  PROFILE_KEY: 'dim3d_userProfile',

  initializeState: function() {
    if (!window.localStorage) return;

    if (!localStorage.getItem(this.PROFILE_KEY)) {
      const defaultProfile = {
        username: "Explorer_" + Math.floor(1000 + Math.random() * 9000),
        totalLifetimeScore: 0,
        quizzesCompleted: 0
      };
      localStorage.setItem(this.PROFILE_KEY, JSON.stringify(defaultProfile));
    }
  },

  getProfile: function() {
    const data = localStorage.getItem(this.PROFILE_KEY);
    return data? JSON.parse(data) : null;
  },

  updateUsername: function(newUsername) {
    let profile = this.getProfile();
    if (profile) {
      profile.username = newUsername;
      localStorage.setItem(this.PROFILE_KEY, JSON.stringify(profile));
    }
  },

  updateProfileScore: function(sessionScore) {
    let profile = this.getProfile();
    if (profile) {
      profile.totalLifetimeScore += sessionScore;
      profile.quizzesCompleted += 1;
      localStorage.setItem(this.PROFILE_KEY, JSON.stringify(profile));
    }
  },

  launchQuiz: function(topicKey) {
    sessionStorage.setItem('dim3d_activeTopic', topicKey);
    window.location.href = 'quiz.html'; // Relocates user across the multi-file schema [2]
  }
};

/**
 * 2. Static Content Modules (Decoupled Game Content Arrays) [20]
 */
const QuizQuestions = {
  science:,
      correct: 1,
      hint: "It has its own DNA and converts organic materials into ATP molecules."
    },
    {
      question: "What light wave speed constant defines cosmic physics calculations?",
      choices: ["299,792 km/s", "150,000 km/s", "343 m/s", "500,000 km/s"],
      correct: 0,
      hint: "Denoted in formulas as 'c', it takes roughly 8 minutes for sunlight to strike Earth."
    },
    {
      question: "What physical force acts on objects submerged in fluid mediums?",
      choices:,
      correct: 2,
      hint: "First calculated by Archimedes, it matches the weight of displaced liquid."
    }
  ],
  space:,
      correct: 2,
      hint: "It is the largest celestial body in our solar system, named after the Roman king of gods."
    },
    {
      question: "What is the boundary surrounding a black hole where light cannot escape?",
      choices:,
      correct: 2,
      hint: "Once you cross this surface, the required escape velocity exceeds speed limits."
    },
    {
      question: "What galactic structure is positioned at the exact core of the Milky Way?",
      choices:,
      correct: 0,
      hint: "It is a supermassive black hole with a mass roughly four million times larger than our sun."
    }
  ],
  tech:,
      correct: 1,
      hint: "Constructed in Bletchley Park, this electronic design relied on hundreds of vacuum tubes."
    },
    {
      question: "What historic solid-state semiconductor replaced delicate vacuum tubes?",
      choices:,
      correct: 0,
      hint: "Co-invented in Bell Labs in 1947, this single invention birthed modern silicon processors."
    },
    {
      question: "What storage device used rotating magnetic platters to archive file systems?",
      choices:,
      correct: 2,
      hint: "Often connected via SATA interfaces, its internal mechanical arms seek sectors to parse bits."
    }
  ]
};

/**
 * 3. Client-Side Web Audio Sound Synthesis Engine
 * Dynamically synthesizes high-fidelity beep patterns directly within the browser tab.
 */
const SoundSynth = {
  playTone: function(isCorrect) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    const currentTime = ctx.currentTime;

    if (isCorrect) {
      // Correct answer: Major high-pitch melodic feedback sequence
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, currentTime); // C5 tone
      osc.frequency.setValueAtTime(659.25, currentTime + 0.08); // E5 tone
      osc.frequency.setValueAtTime(783.99, currentTime + 0.16); // G5 tone
      
      gainNode.gain.setValueAtTime(0.12, currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.35); // Smooth release curve
      
      osc.start(currentTime);
      osc.stop(currentTime + 0.35);
    } else {
      // Incorrect answer: Low descending synthetic buzz tone
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140.00, currentTime); // D3 pitch
      osc.frequency.linearRampToValueAtTime(80.00, currentTime + 0.25); // Pitch drop
      
      gainNode.gain.setValueAtTime(0.15, currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.25);
      
      osc.start(currentTime);
      osc.stop(currentTime + 0.25);
    }
  }
};

/**
 * 4. Active Quiz Gameplay Controller Loop
 * Orchestrates the active gameplay progression, visual state updates, and timers. [2]
 */
const QuizController = {
  activeTopic: '',
  questions:,
  currentIndex: 0,
  score: 0,
  timerInterval: null,
  secondsRemaining: 10,

  startQuiz: function() {
    this.activeTopic = sessionStorage.getItem('dim3d_activeTopic') || 'science';
    this.questions = QuizQuestions || QuizQuestions.science;
    this.currentIndex = 0;
    this.score = 0;

    // Set topic badges
    const badge = document.getElementById("activeTopicBadge");
    if (badge) {
      badge.textContent = `${this.activeTopic} Dimension`;
    }

    this.renderQuestion();
    document.getElementById("nextQuestionBtn").addEventListener("click", () => this.advanceProgress());
  },

  renderQuestion: function() {
    this.clearTimer();
    this.secondsRemaining = 10;
    this.animateTimerRing(100);

    // Hide hints and show front of card
    const hintField = document.getElementById("hintField");
    if (hintField) {
      hintField.classList.add("hidden");
    }
    document.getElementById("questionCard").classList.remove("flipped");

    const activeQ = this.questions[this.currentIndex];
    
    // Update question progress indicators
    document.getElementById("questionCounter").textContent = `${this.currentIndex + 1} / ${this.questions.length}`;
    document.getElementById("questionField").textContent = activeQ.question;
    document.getElementById("hintField").textContent = activeQ.hint;

    // Render choice list
    const choicesBox = document.getElementById("choicesBox");
    choicesBox.innerHTML = "";

    activeQ.choices.forEach((choice, index) => {
      const btn = document.createElement("button");
      btn.className = "pushable-3d-btn";
      btn.innerHTML = `
        <span class="shadow"></span>
        <span class="edge"></span>
        <span class="front">${choice}</span>
      `;
      btn.addEventListener("click", () => this.handleSelection(index));
      choicesBox.appendChild(btn);
    });

    this.startCountdown();
  },

  startCountdown: function() {
    const timerDisplay = document.getElementById("timerSeconds");
    timerDisplay.textContent = this.secondsRemaining;

    this.timerInterval = setInterval(() => {
      this.secondsRemaining--;
      timerDisplay.textContent = this.secondsRemaining;
      
      const percent = (this.secondsRemaining / 10) * 100;
      this.animateTimerRing(percent);

      if (this.secondsRemaining <= 0) {
        this.handleSelection(-1); // Automatically submit empty answer on clock drain
      }
    }, 1000);
  },

  clearTimer: function() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  },

  animateTimerRing: function(percent) {
    const ring = document.getElementById("timerRing");
    if (!ring) return;
    const radius = ring.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;

    ring.style.strokeDasharray = `${circumference} ${circumference}`;
    const offset = circumference - (percent / 100) * circumference;
    ring.style.strokeDashoffset = offset;
  },

  handleSelection: function(chosenIndex) {
    this.clearTimer();

    // Lock interaction elements on dashboard choice lists
    const choiceButtons = document.querySelectorAll("#choicesBox button");
    choiceButtons.forEach(btn => btn.style.pointerEvents = "none");

    const activeQ = this.questions[this.currentIndex];
    const isCorrect = (chosenIndex === activeQ.correct);

    // Apply color modifications to correct / incorrect buttons [8]
    choiceButtons.forEach((btn, idx) => {
      if (idx === activeQ.correct) {
        btn.className = "pushable-3d-btn success-btn"; // Make correct target neon green
      } else if (idx === chosenIndex) {
        btn.className = "pushable-3d-btn wrong-btn"; // Make selected incorrect target red
      }
    });

    // Trigger synth beep feedback
    SoundSynth.playTone(isCorrect);

    // Update feedback panel on reverse of card
    const header = document.getElementById("feedbackHeader");
    const text = document.getElementById("feedbackText");

    if (isCorrect) {
      this.score += 10;
      document.getElementById("currentScore").textContent = this.score;
      header.textContent = "SYNAPSE MATCHED!";
      header.style.color = "var(--success-color)";
      text.textContent = `Correct! +10 Points mapped to state matrices.`;
      
      // Fire confetti burst! [17, 21]
      this.fireConfetti();
    } else {
      header.textContent = "SIGNAL DECAYED";
      header.style.color = "var(--error-color)";
      if (chosenIndex === -1) {
        text.textContent = `Out of time! The correct target was: ${activeQ.choices[activeQ.correct]}`;
      } else {
        text.textContent = `Incorrect path. The correct answer is: ${activeQ.choices[activeQ.correct]}`;
      }
    }

    // Flip the question card over 3D space with a delay [12]
    setTimeout(() => {
      document.getElementById("questionCard").classList.add("flipped");
    }, 450);
  },

  advanceProgress: function() {
    this.currentIndex++;
    if (this.currentIndex < this.questions.length) {
      this.renderQuestion();
    } else {
      this.concludeSession();
    }
  },

  concludeSession: function() {
    // Write active session parameters to Profile database [18, 19]
    AppStorage.updateProfileScore(this.score);

    const accuracyPercent = Math.round((this.score / (this.questions.length * 10)) * 100);

    // Render modal statistics overlays [6]
    document.getElementById("finalRawScore").textContent = this.score;
    document.getElementById("finalPercentage").textContent = `${accuracyPercent}%`;
    document.getElementById("analyticsModal").classList.remove("hidden");

    // Double fire celebratory sparks on a master finish!
    if (accuracyPercent === 100) {
      this.fireConfetti();
      setTimeout(() => this.fireConfetti(), 400);
    }
  },

  fireConfetti: function() {
    // Harness canvas-confetti via loaded client libraries [17, 21]
    if (typeof confetti === "function") {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#30c9e8', '#30e849', '#a866ee'],
        disableForReducedMotion: true // Respect global accessibility rules! [17]
      });
    }
  }
};
  

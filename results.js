/**
 * Results and Celebratory Particle Physics Engine
 */

class ConfettiSimulation {
  constructor() {
    this.canvas = document.getElementById('celebration-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.particles =;
    this.animationId = null;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  spawn(count) {
    const colors = ['#00f3ff', '#ff007f', '#ffd700', '#2ec4b6', '#ffffff'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: -20,
        size: Math.random() * 6 + 4,
        speedX: (Math.random() - 0.5) * 4,
        speedY: Math.random() * 4 + 3,
        rotation: (Math.random() - 0.5) * 5,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
        gravity: 0.15,
        drag: 0.985
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach((p, idx) => {
      p.speedY += p.gravity;
      p.speedX *= p.drag;
      p.speedY *= p.drag;
      p.x += p.speedX;
      p.y += p.speedY;
      p.rotation += p.rotationSpeed;

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.fillStyle = p.color;
      
      this.ctx.fillRect(-p.size, -p.size / 2, p.size * 2, p.size);
      this.ctx.restore();

      if (p.y > this.canvas.height + 20) {
        this.particles.splice(idx, 1);
      }
    });

    if (this.particles.length > 0) {
      this.animationId = requestAnimationFrame(() => this.animate());
    }
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.particles =;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.App && window.App.init) App.init();
  
  const session = JSON.parse(localStorage.getItem('active_session'));
  if (!session) {
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('results-accuracy').textContent = `${session.score}%`;
  document.getElementById('results-xp-gain').textContent = `+${session.xpGained} XP`;

  const ratingEl = document.getElementById('results-rating');
  if (session.score === 100) {
    ratingEl.textContent = 'PERFECT_SCORE';
    ratingEl.className = 'results-rating glowing-text';
  } else if (session.score >= 70) {
    ratingEl.textContent = 'MISSION_PASSED [A]';
    ratingEl.className = 'results-rating glowing-text-pink';
  } else {
    ratingEl.textContent = 'SESSION_COMPLETE [C]';
    ratingEl.className = 'results-rating text-cyan';
  }

  // Count-up Rollup Loop
  const scoreEl = document.getElementById('results-score');
  let currentCount = 0;
  const targetScore = session.rawScore || 0;
  const duration = 1000;
  const frameRate = 1000 / 60;
  const step = Math.max(1, Math.ceil(targetScore / (duration / frameRate)));

  const rollupInterval = setInterval(() => {
    currentCount += step;
    if (currentCount >= targetScore) {
      scoreEl.textContent = String(targetScore).padStart(4, '0');
      clearInterval(rollupInterval);
    } else {
      scoreEl.textContent = String(currentCount).padStart(4, '0');
    }
  }, frameRate);

  // Profile levels progress filling
  const profile = JSON.parse(localStorage.getItem('user_profile')) || { username: 'Agent_X', level: 1, xp: 0 };
  document.getElementById('user-p-name').textContent = profile.username;
  document.getElementById('results-level').textContent = `LVL ${profile.level}`;

  const currentLevelXP = profile.xp % 100;
  document.getElementById('results-xp-values').textContent = `${currentLevelXP} / 100 XP`;
  
  setTimeout(() => {
    const fillEl = document.getElementById('results-xp-fill');
    if (fillEl) fillEl.style.width = `${currentLevelXP}%`;
  }, 300);

  const celebration = new ConfettiSimulation();
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReducedMotion) {
    const burstCount = session.score === 100? 150 : (session.score >= 70? 80 : 30);
    celebration.spawn(burstCount);
    celebration.animate();
  }

  document.getElementById('btn-return-lobby').addEventListener('click', () => {
    if (window.App && window.App.synth) App.synth.play('click');
    celebration.stop();
    window.location.href = 'index.html';
  });

  document.getElementById('btn-restart-quiz').addEventListener('click', () => {
    if (window.App && window.App.synth) App.synth.play('click');
    celebration.stop();
    window.location.href = 'quiz.html';
  });
});
  

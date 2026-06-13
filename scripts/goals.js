/* goals.js */

document.addEventListener('DOMContentLoaded', () => {
  const state = window.AppState;
  if (!state) return;

  const claimGoalBtn = document.getElementById('claim-goal-btn');
  const claimFocusBtn = document.getElementById('claim-focus-reward-btn');
  const exploreParkLink = document.getElementById('explore-park-link');

  // Claim goal button
  if (claimGoalBtn) {
    claimGoalBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      state.claimGoalReward('readNotes');
    });
  }

  // Claim daily focus reward button
  if (claimFocusBtn) {
    claimFocusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      state.claimFocusReward();
    });
  }

  // Mascot easter egg: click on "Explore the park"
  if (exploreParkLink) {
    exploreParkLink.addEventListener('click', () => {
      state.trigger('speechChange', {
        text: "The park is lovely today! Work a bit more to unlock the 'Walk in Park' pet quest."
      });
      
      // Temporary flash animation
      exploreParkLink.style.transform = 'scale(1.1)';
      setTimeout(() => {
        exploreParkLink.style.transform = 'none';
      }, 150);
    });
  }

  // Handle goal claimed event
  state.on('goalClaimed', (data) => {
    if (data.goalKey === 'readNotes') {
      const footer = document.getElementById('read-notes-footer');
      if (footer) {
        footer.innerHTML = `
          <div class="retro-progress-bar">
            <div class="retro-progress-fill" style="width: 100%;"></div>
          </div>
          <div class="goal-progress-container" style="justify-content: center; color: var(--bg-green); font-weight: bold; font-size: 11px;">
            <span>✓ 15 Coins Claimed</span>
          </div>
        `;
      }
    }
  });

  // Handle focus claimed event
  state.on('focusClaimed', () => {
    const footer = document.getElementById('daily-focus-footer');
    if (footer) {
      footer.innerHTML = `
        <button class="retro-btn claim-reward-btn" style="background-color: var(--bg-green-soft); color: var(--color-brown-light); cursor: default; box-shadow: none; transform: none; border-color: var(--color-brown-light);" disabled>
          Reward Claimed!
        </button>
      `;
    }

    const envelope = document.getElementById('quest-envelope');
    if (envelope) {
      envelope.innerHTML = `
        <!-- Open Envelope SVG -->
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
          <path d="M2 18l7-6M22 18l-7-6"/>
        </svg>
      `;
    }
  });
});

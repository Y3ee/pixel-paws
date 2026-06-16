/* goals.js */

document.addEventListener('DOMContentLoaded', () => {
  const state = window.AppState;
  if (!state) return;

  const exploreParkLink = document.getElementById('explore-park-link');

  // Mascot easter egg: click on "Explore the park"
  if (exploreParkLink) {
    exploreParkLink.addEventListener('click', () => {
      state.trigger('speechChange', {
        text: "The park is lovely today! Keep up the good work!"
      });
      
      // Temporary flash animation
      exploreParkLink.style.transform = 'scale(1.1)';
      setTimeout(() => {
        exploreParkLink.style.transform = 'none';
      }, 150);
    });
  }

  // Event Delegation for Daily Goals Claim Buttons
  const goalsGrid = document.getElementById('goals-grid');
  if (goalsGrid) {
    goalsGrid.addEventListener('click', (e) => {
      const claimBtn = e.target.closest('.claim-btn, .claim-goal-btn');
      if (claimBtn) {
        const goalKey = claimBtn.getAttribute('data-goal');
        if (goalKey) {
          e.stopPropagation();
          state.claimGoalReward(goalKey);
        }
      }
    });
  }

  // Event Delegation for Daily Focus Claim Reward Button
  const dailyFocusCard = document.querySelector('.daily-focus-card');
  if (dailyFocusCard) {
    dailyFocusCard.addEventListener('click', (e) => {
      const claimBtn = e.target.closest('#claim-focus-reward-btn');
      if (claimBtn && !claimBtn.disabled) {
        e.stopPropagation();
        state.claimFocusReward();
      }
    });
  }

  // Dynamic daily goals UI update
  function updateGoalsUI() {
    const goals = state.goals;
    if (!goals) return;

    // 1. Daily Login
    const loginGoal = goals.dailyLogin;
    const loginFooter = document.getElementById('goal-daily-login-footer');
    if (loginFooter && loginGoal) {
      updateGoalFooter(loginFooter, loginGoal, 'dailyLogin');
    }

    // 2. Study for 30mins
    const studyGoal = goals.study30Mins;
    const studyFooter = document.getElementById('goal-study-30mins-footer');
    if (studyFooter && studyGoal) {
      updateGoalFooter(studyFooter, studyGoal, 'study30Mins');
    }

    // 3. Finish one task
    const taskGoal = goals.finishOneTask;
    const taskFooter = document.getElementById('goal-finish-task-footer');
    if (taskFooter && taskGoal) {
      updateGoalFooter(taskFooter, taskGoal, 'finishOneTask');
    }
  }

  function updateGoalFooter(footerEl, goal, goalKey) {
    const isCompleted = goal.completed;
    const isClaimed = goal.claimed;
    const percent = goal.percent || 0;
    const reward = goal.reward || 0;

    let progressHtml = `
      <div class="retro-progress-bar">
        <div class="retro-progress-fill" style="width: ${percent}%;"></div>
      </div>
    `;

    let actionHtml = '';
    if (isClaimed) {
      actionHtml = `
        <div class="goal-progress-container" style="justify-content: center; color: var(--bg-green); font-weight: bold; font-size: 11px; width: 100%;">
          <span>✓ ${reward} Coins Claimed</span>
        </div>
      `;
      progressHtml = `
        <div class="retro-progress-bar">
          <div class="retro-progress-fill" style="width: 100%;"></div>
        </div>
      `;
    } else if (isCompleted) {
      actionHtml = `
        <div class="goal-progress-container" style="width: 100%;">
          <span>100%</span>
          <button class="retro-btn claim-btn claim-goal-btn" data-goal="${goalKey}">Claim ${reward} Coins</button>
        </div>
      `;
    } else {
      actionHtml = `
        <div class="goal-progress-container" style="width: 100%;">
          <span>${percent}%</span>
          <span class="goal-reward">Reward: ${reward} Coins</span>
        </div>
      `;
    }

    footerEl.innerHTML = progressHtml + actionHtml;
  }

  // Dynamic daily focus quest UI update
  function updateDailyFocusUI() {
    const focusGoal = state.goals.dailyFocus;
    if (!focusGoal) return;

    const pointsText = document.getElementById('focus-points-text');
    const progressFill = document.getElementById('focus-progress-fill');
    const envelope = document.getElementById('quest-envelope');
    const statusText = document.querySelector('.quest-complete-text');
    const footer = document.getElementById('daily-focus-footer');

    const currentPoints = state.focusPoints !== undefined ? state.focusPoints : 0;
    const maxPoints = state.maxFocusPoints || 30;
    
    // Force 100% progress and max points if quest is claimed
    const pct = focusGoal.claimed ? 100 : Math.min(100, Math.floor((currentPoints / maxPoints) * 100));
    const displayedPoints = focusGoal.claimed ? maxPoints : currentPoints;

    // Update stats text
    if (pointsText) {
      pointsText.textContent = `${displayedPoints} / ${maxPoints} mins`;
    }

    // Update progress bar
    if (progressFill) {
      progressFill.style.width = `${pct}%`;
    }

    if (focusGoal.claimed) {
      if (statusText) statusText.textContent = 'Reward Claimed!';
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
      if (footer) {
        footer.innerHTML = `
          <button class="retro-btn claim-reward-btn" style="background-color: var(--bg-green-soft); color: var(--color-brown-light); cursor: default; box-shadow: none; transform: none; border-color: var(--color-brown-light); width: 100%;" disabled>
            Reward Claimed!
          </button>
        `;
      }
    } else if (focusGoal.completed) {
      if (statusText) statusText.textContent = 'Quest Complete!';
      if (envelope) {
        envelope.innerHTML = `
          <span class="envelope-star">⭐</span>
          <!-- Envelope SVG -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        `;
      }
      if (footer) {
        footer.innerHTML = `
          <button class="retro-btn claim-reward-btn" id="claim-focus-reward-btn" style="width: 100%;">Claim Reward</button>
        `;
      }
    } else {
      if (statusText) statusText.textContent = `study in progress... (focus ${displayedPoints}mins/30mins)`;
      if (envelope) {
        envelope.innerHTML = `
          <!-- Closed Envelope SVG -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        `;
      }
      if (footer) {
        footer.innerHTML = `
          <button class="retro-btn claim-reward-btn" style="opacity: 0.6; cursor: not-allowed; width: 100%;" disabled>
            Claim Reward
          </button>
        `;
      }
    }
  }

  // Dynamic study records card UI update
  function updateStatsRecordUI() {
    const totalStudyEl = document.getElementById('record-total-study-time');
    const totalTasksEl = document.getElementById('record-total-tasks');

    if (totalStudyEl) {
      totalStudyEl.textContent = formatTime(state.totalStudyTime || 0);
    }

    if (totalTasksEl) {
      const count = state.totalTasksCompleted || 0;
      totalTasksEl.textContent = `${count} ${count === 1 ? 'task' : 'tasks'}`;
    }
  }

  // Register events to trigger goals and focus quest updates
  state.on('goalsUpdated', updateGoalsUI);
  state.on('goalClaimed', updateGoalsUI);
  state.on('focusProgressUpdated', updateDailyFocusUI);
  state.on('focusClaimed', updateDailyFocusUI);
  state.on('studyTimeChange', () => {
    state.recalculateGoalsProgress();
    updateGoalsUI();
    updateDailyFocusUI();
    updateStatsRecordUI();
  });
  state.on('tasksChange', () => {
    state.recalculateGoalsProgress();
    updateGoalsUI();
    updateDailyFocusUI();
    updateStatsRecordUI();
  });
  state.on('stateLoaded', () => {
    state.recalculateGoalsProgress();
    updateGoalsUI();
    updateDailyFocusUI();
    updateStatsRecordUI();
  });

  // =====================================================
  // FOCUS DASHBOARD & CAROUSEL LOGIC
  // =====================================================

  const carouselContainer = document.getElementById('dashboard-carousel-container');
  const carouselTrack = document.getElementById('dashboard-carousel-track');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');

  let currentScrollIndex = 0;
  let isDragging = false;
  let startX = 0;
  let currentTranslate = 0;
  let prevTranslate = 0;

  function updateCarouselControls() {
    if (!carouselContainer || !carouselTrack || !prevBtn || !nextBtn) return;
    const containerWidth = carouselContainer.getBoundingClientRect().width;
    const trackWidth = carouselTrack.scrollWidth;
    if (trackWidth <= containerWidth + 4) {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
      carouselTrack.style.transform = 'translateX(0px)';
      currentScrollIndex = 0;
      prevTranslate = 0;
      currentTranslate = 0;
    } else {
      prevBtn.style.display = '';
      nextBtn.style.display = '';
    }
  }

  function scrollCarousel() {
    const cards = document.querySelectorAll('.dashboard-card');
    if (cards.length === 0 || !carouselTrack) return;
    const cardWidth = cards[0].getBoundingClientRect().width;
    const gap = 16;
    const offset = -currentScrollIndex * (cardWidth + gap);
    carouselTrack.style.transform = `translateX(${offset}px)`;
    prevTranslate = offset;
    currentTranslate = offset;
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const cards = document.querySelectorAll('.dashboard-card');
      if (currentScrollIndex < cards.length - 1) {
        currentScrollIndex++;
        scrollCarousel();
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentScrollIndex > 0) {
        currentScrollIndex--;
        scrollCarousel();
      }
    });
  }

  // Swipe and Drag logic for mouse / trackpad / touch
  if (carouselTrack && carouselContainer) {
    carouselTrack.addEventListener('mousedown', dragStart);
    carouselTrack.addEventListener('touchstart', dragStart, { passive: true });
    carouselTrack.addEventListener('mousemove', dragMove);
    carouselTrack.addEventListener('touchmove', dragMove, { passive: true });
    carouselTrack.addEventListener('mouseup', dragEnd);
    carouselTrack.addEventListener('touchend', dragEnd);
    carouselTrack.addEventListener('mouseleave', dragEnd);
  }

  function dragStart(e) {
    isDragging = true;
    startX = getPositionX(e);
    if (carouselTrack) {
      carouselTrack.style.transition = 'none';
      carouselTrack.style.cursor = 'grabbing';
    }
  }

  function dragMove(e) {
    if (!isDragging || !carouselTrack || !carouselContainer) return;
    const currentX = getPositionX(e);
    const diff = currentX - startX;
    const cards = document.querySelectorAll('.dashboard-card');
    if (cards.length === 0) return;
    const cardWidth = cards[0].getBoundingClientRect().width + 16;
    const containerWidth = carouselContainer.getBoundingClientRect().width;
    const maxOffset = -(cards.length * cardWidth - 16 - containerWidth);
    
    let nextTranslate = prevTranslate + diff;
    // Add resistance at bounds
    if (nextTranslate > 0) nextTranslate = nextTranslate / 3;
    if (nextTranslate < maxOffset) nextTranslate = maxOffset + (nextTranslate - maxOffset) / 3;
    
    carouselTrack.style.transform = `translateX(${nextTranslate}px)`;
    currentTranslate = nextTranslate;
  }

  function dragEnd() {
    if (!isDragging) return;
    isDragging = false;
    if (carouselTrack && carouselContainer) {
      carouselTrack.style.cursor = 'grab';
      carouselTrack.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
      
      const cards = document.querySelectorAll('.dashboard-card');
      if (cards.length === 0) return;
      const cardWidth = cards[0].getBoundingClientRect().width + 16;
      
      let targetIndex = Math.round(-currentTranslate / cardWidth);
      targetIndex = Math.max(0, Math.min(targetIndex, cards.length - 1));
      currentScrollIndex = targetIndex;
      
      const containerWidth = carouselContainer.getBoundingClientRect().width;
      const trackWidth = carouselTrack.scrollWidth;
      if (trackWidth <= containerWidth + 4) {
        currentScrollIndex = 0;
      }
      
      const offset = -currentScrollIndex * cardWidth;
      carouselTrack.style.transform = `translateX(${offset}px)`;
      prevTranslate = offset;
    }
  }

  function getPositionX(e) {
    return e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
  }

  window.addEventListener('resize', () => {
    updateCarouselControls();
  });

  // =====================================================
  // STUDY & REST TIMES DISPLAY
  // =====================================================

  function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  function updateDashboardTimes() {
    const studyDisplay = document.getElementById('study-time-display');
    const restDisplay = document.getElementById('rest-time-display');
    if (studyDisplay) studyDisplay.textContent = formatTime(state.totalStudyTime || 0);
    if (restDisplay) restDisplay.textContent = formatTime(state.totalRestTime || 0);
  }

  state.on('studyTimeChange', () => {
    updateDashboardTimes();
  });

  state.on('restTimeChange', () => {
    updateDashboardTimes();
  });

  state.on('stateLoaded', () => {
    updateDashboardTimes();
    renderTasks();
    setTimeout(updateCarouselControls, 100);
  });

  // =====================================================
  // CUSTOM TASKS WIDGET
  // =====================================================

  const todoForm = document.getElementById('todo-form');
  const todoInput = document.getElementById('todo-input');
  const todoList = document.getElementById('todo-list');
  const tasksProgress = document.getElementById('tasks-progress');

  if (todoForm) {
    todoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = todoInput.value.trim();
      if (text) {
        state.addTask(text);
        todoInput.value = '';
      }
    });
  }

  const fadingTasks = new Set();
  const activeTimeouts = new Map();

  function renderTasks() {
    if (!todoList) return;
    todoList.innerHTML = '';
    const tasks = state.customTasks || [];
    let completedCount = 0;
    
    tasks.forEach(task => {
      if (task.completed) completedCount++;
      
      const li = document.createElement('li');
      li.className = `todo-item ${task.completed ? 'completed' : ''}`;
      li.innerHTML = `
        <div class="todo-item-left">
          <input type="checkbox" class="todo-checkbox" ${task.completed ? 'checked' : ''}>
          <span class="todo-text">${escapeHtml(task.text)}</span>
        </div>
        <button class="todo-delete-btn" aria-label="Delete task">&times;</button>
      `;
      
      const checkbox = li.querySelector('.todo-checkbox');
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          li.classList.add('completed');
          state.completeTask(task.id);
        } else {
          li.classList.remove('completed');
          state.toggleTask(task.id);
        }
      });
      
      // Auto-delete fadeout animation handling for completed tasks
      if (task.completed) {
        if (!fadingTasks.has(task.id)) {
          fadingTasks.add(task.id);
          const timeoutId = setTimeout(() => {
            li.style.transition = 'opacity 0.5s ease';
            li.style.opacity = '0';
            const deleteTimeoutId = setTimeout(() => {
              state.deleteTask(task.id);
              fadingTasks.delete(task.id);
              activeTimeouts.delete(task.id);
              activeTimeouts.delete(task.id + '_delete');
            }, 500);
            activeTimeouts.set(task.id + '_delete', deleteTimeoutId);
          }, 2000);
          activeTimeouts.set(task.id, timeoutId);
        } else if (activeTimeouts.has(task.id + '_delete')) {
          li.style.opacity = '0';
        }
      } else {
        if (fadingTasks.has(task.id)) {
          clearTimeout(activeTimeouts.get(task.id));
          clearTimeout(activeTimeouts.get(task.id + '_delete'));
          fadingTasks.delete(task.id);
          activeTimeouts.delete(task.id);
          activeTimeouts.delete(task.id + '_delete');
        }
      }
      
      const delBtn = li.querySelector('.todo-delete-btn');
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.deleteTask(task.id);
      });
      
      todoList.appendChild(li);
    });
    
    if (tasksProgress) {
      tasksProgress.textContent = `(${completedCount}/${tasks.length})`;
    }
  }

  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
  }

  state.on('tasksChange', () => {
    renderTasks();
  });

  // Initialization
  setTimeout(() => {
    updateCarouselControls();
    updateDashboardTimes();
    renderTasks();
    updateGoalsUI();
    updateDailyFocusUI();
    updateStatsRecordUI();
  }, 100);
});

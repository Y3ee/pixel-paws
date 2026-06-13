/* state.js */

const AppState = {
  xp: 120,
  coins: 45, // starting coin balance
  streak: 2,
  badges: 3,
  rank: 'Bronze',
  petLevel: 1,
  focusPoints: 30,
  maxFocusPoints: 30,
  
  goals: {
    morningBrew: { completed: false, claimed: false, percent: 25, reward: 10 },
    readNotes: { completed: true, claimed: false, percent: 100, reward: 15 },
    walkPark: { completed: false, claimed: false, percent: 0, locked: true, reward: 'Rare Item' },
    dailyFocus: { completed: true, claimed: false, reward: 20 }
  },

  // Listeners for state changes
  listeners: {},

  // Subscribe to state change events
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  },

  // Notify subscribers
  trigger(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (e) {
          console.error(`Error in state listener for event: ${event}`, e);
        }
      });
    }
  },

  // State mutations
  addXp(amount) {
    this.xp += amount;
    this.trigger('xpChange', { xp: this.xp });
    
    // Check level up (every 100 XP is a level)
    const newLevel = Math.floor(this.xp / 100) + 1;
    if (newLevel > this.petLevel) {
      this.petLevel = newLevel;
      this.trigger('levelUp', { level: this.petLevel });
      this.trigger('speechChange', { text: `Yay! ScholarPaws reached Level ${this.petLevel}! Keep it up!` });
    }
  },

  addCoins(amount) {
    this.coins += amount;
    this.trigger('coinsChange', { coins: this.coins });
  },

  claimGoalReward(goalKey) {
    const goal = this.goals[goalKey];
    if (goal && goal.completed && !goal.claimed) {
      goal.claimed = true;
      
      // Award reward
      if (typeof goal.reward === 'number') {
        this.addCoins(goal.reward);
        this.addXp(goal.reward * 2); // XP reward is 2x coin reward
        this.trigger('speechChange', { text: `Nice job! You earned ${goal.reward} coins and ${goal.reward * 2} XP!` });
      } else {
        // Special rewards
        this.trigger('speechChange', { text: `Amazing! You claimed a: ${goal.reward}!` });
      }
      
      this.trigger('goalClaimed', { goalKey });
      return true;
    }
    return false;
  },

  claimFocusReward() {
    const focus = this.goals.dailyFocus;
    if (focus && focus.completed && !focus.claimed) {
      focus.claimed = true;
      this.addCoins(focus.reward);
      this.addXp(focus.reward * 2);
      this.trigger('speechChange', { text: `Quest complete! You claimed the Daily Focus reward of ${focus.reward} coins!` });
      this.trigger('focusClaimed');
      return true;
    }
    return false;
  },

  editPetName(newName) {
    if (newName && newName.trim()) {
      this.trigger('nameChange', { name: newName.trim() });
      this.trigger('speechChange', { text: `Hello, I am now called ${newName.trim()}! Woof!` });
    }
  }
};

// Expose state globally
window.AppState = AppState;

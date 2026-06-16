/* state.js */
import { db, auth, isFirebaseEnabled, signInAnonymously, onAuthStateChanged, doc, setDoc, getDoc } from './firebase.js';

const AppState = {
  xp: 120,
  coins: 45, // starting coin balance
  streak: 2,
  badges: 0,
  rank: 'Bronze',
  petLevel: 1,
  focusPoints: 30,
  maxFocusPoints: 30,
  selectedAvatarIndex: 0,
  selectedPetIndex: 0,
  petName: 'Companion',
  onboardingComplete: false,
  username: 'ScholarPaws',
  age: 20,
  totalStudyTime: 0,
  totalRestTime: 0,
  customTasks: [
    { id: 'starting-1', text: 'Review math study slides', completed: false },
    { id: 'starting-2', text: 'Write draft introduction paragraph', completed: false }
  ],
  totalTasksCompleted: 0,
  
  // Tamagotchi stats
  petHunger: 100,
  petHealth: 100,
  petIsDead: false,
  
  goals: {
    dailyLogin: { completed: true, claimed: false, percent: 100, reward: 10 },
    study30Mins: { completed: false, claimed: false, percent: 0, reward: 15 },
    finishOneTask: { completed: false, claimed: false, percent: 0, reward: 20 },
    dailyFocus: { completed: false, claimed: false, reward: 20 }
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

  // LocalStorage & Firestore Persistence
  save(isBackground = false) {
    const data = {
      xp: this.xp,
      coins: this.coins,
      streak: this.streak,
      badges: this.badges,
      rank: this.rank,
      petLevel: this.petLevel,
      focusPoints: this.focusPoints,
      maxFocusPoints: this.maxFocusPoints,
      selectedAvatarIndex: this.selectedAvatarIndex,
      selectedPetIndex: this.selectedPetIndex,
      petName: this.petName,
      onboardingComplete: this.onboardingComplete,
      username: this.username,
      age: this.age,
      petHunger: this.petHunger,
      petHealth: this.petHealth,
      petIsDead: this.petIsDead,
      goals: this.goals,
      totalStudyTime: this.totalStudyTime,
      totalRestTime: this.totalRestTime,
      customTasks: this.customTasks,
      totalTasksCompleted: this.totalTasksCompleted
    };

    // Save to localStorage as a fallback/backup
    try {
      localStorage.setItem('study_lounge_state', JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save state to localStorage", e);
    }

    // Save to Firestore if enabled and authenticated
    if (isFirebaseEnabled && auth && auth.currentUser) {
      const docRef = doc(db, "users", auth.currentUser.uid);
      
      // Add email and uid helpers so the user can easily identify documents in the Firebase console
      const firestoreData = {
        ...data,
        email: auth.currentUser.isAnonymous ? "Guest" : auth.currentUser.email,
        isAnonymous: auth.currentUser.isAnonymous,
        uid: auth.currentUser.uid,
        updatedAt: new Date().toISOString()
      };

      setDoc(docRef, firestoreData, { merge: true })
        .then(() => {
          console.log("State successfully synced with Firestore!");
          this.trigger('syncSuccess', { isBackground });
        })
        .catch(err => {
          console.error("Firestore sync failed:", err);
          this.trigger('syncError', err);
        });
    }
  },

  load() {
    // First try loading from LocalStorage for immediate UI response
    try {
      const serialized = localStorage.getItem('study_lounge_state');
      if (serialized) {
        this.applyStateData(JSON.parse(serialized));
      }
    } catch (e) {
      console.error("Failed to load state from localStorage", e);
    }
  },

  async loadFromFirestore(uid) {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        this.applyStateData(data);
        console.log("Successfully loaded state from Firestore!");
        this.trigger('stateLoaded');
        this.trigger('syncSuccess', { isBackground: true }); // trigger background sync success on initial load
      } else {
        console.log("No state found in Firestore. Creating initial save.");
        this.save();
      }
    } catch (e) {
      console.error("Failed to load state from Firestore", e);
      this.trigger('syncError', e);
    }
  },

  applyStateData(data) {
    if (data.xp !== undefined) this.xp = data.xp;
    if (data.coins !== undefined) this.coins = data.coins;
    if (data.streak !== undefined) this.streak = data.streak;
    if (data.badges !== undefined) this.badges = data.badges;
    if (data.rank !== undefined) this.rank = data.rank;
    if (data.petLevel !== undefined) this.petLevel = data.petLevel;
    if (data.focusPoints !== undefined) this.focusPoints = data.focusPoints;
    if (data.maxFocusPoints !== undefined) this.maxFocusPoints = data.maxFocusPoints;
    if (data.selectedAvatarIndex !== undefined) this.selectedAvatarIndex = data.selectedAvatarIndex;
    if (data.selectedPetIndex !== undefined) this.selectedPetIndex = data.selectedPetIndex;
    if (data.petName !== undefined) this.petName = data.petName;
    if (data.onboardingComplete !== undefined) this.onboardingComplete = data.onboardingComplete;
    if (data.username !== undefined) this.username = data.username;
    if (data.age !== undefined) this.age = data.age;
    if (data.petHunger !== undefined) this.petHunger = data.petHunger;
    if (data.petHealth !== undefined) this.petHealth = data.petHealth;
    if (data.petIsDead !== undefined) this.petIsDead = data.petIsDead;
    if (data.totalStudyTime !== undefined) this.totalStudyTime = data.totalStudyTime;
    if (data.totalRestTime !== undefined) this.totalRestTime = data.totalRestTime;
    if (data.customTasks !== undefined) this.customTasks = data.customTasks;
    if (data.totalTasksCompleted !== undefined) this.totalTasksCompleted = data.totalTasksCompleted;
    if (data.goals !== undefined) {
      if (data.goals.morningBrew || data.goals.readNotes || data.goals.walkPark) {
        this.goals = {
          dailyLogin: { completed: true, claimed: false, percent: 100, reward: 10 },
          study30Mins: { completed: false, claimed: false, percent: 0, reward: 15 },
          finishOneTask: { completed: false, claimed: false, percent: 0, reward: 20 },
          dailyFocus: data.goals.dailyFocus || { completed: false, claimed: false, reward: 20 }
        };
      } else {
        this.goals = {
          dailyLogin: data.goals.dailyLogin || { completed: true, claimed: false, percent: 100, reward: 10 },
          study30Mins: data.goals.study30Mins || { completed: false, claimed: false, percent: 0, reward: 15 },
          finishOneTask: data.goals.finishOneTask || { completed: false, claimed: false, percent: 0, reward: 20 },
          dailyFocus: data.goals.dailyFocus || { completed: false, claimed: false, reward: 20 }
        };
      }
    }
    this.recalculateGoalsProgress();

    // Force heal pet to 100% on load/sync to restore it
    this.petHunger = 100;
    this.petHealth = 100;
    this.petIsDead = false;
    this.save();
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
    this.save();
  },

  addCoins(amount) {
    this.coins += amount;
    this.trigger('coinsChange', { coins: this.coins });
    this.save();
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
      
      // Unlock badge on claim
      if (goalKey === 'study30Mins' || goalKey === 'finishOneTask') {
        this.badges += 1;
        this.trigger('badgesChange', { badges: this.badges });
      }
      
      this.trigger('goalClaimed', { goalKey });
      this.save();
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
      this.save();
      return true;
    }
    return false;
  },

  editPetName(newName) {
    if (newName && newName.trim()) {
      this.petName = newName.trim();
      this.trigger('nameChange', { name: this.petName });
      this.trigger('speechChange', { text: `Hello, I am now called ${this.petName}! 🐾` });
      this.save();
    }
  },

  completeOnboarding(avatarIndex, petIndex, username) {
    this.selectedAvatarIndex = avatarIndex;
    this.selectedPetIndex = petIndex;
    if (username && username.trim()) {
      this.username = username.trim();
    }
    this.onboardingComplete = true;
    
    // Unlock onboarding badge
    this.badges += 1;
    this.trigger('badgesChange', { badges: this.badges });
    
    const petNames = ["Puppy", "Kitty", "Bunny", "Frog", "Owl"];
    const chosenPetName = petNames[petIndex] || "Pet";
    
    this.trigger('onboardingFinished', { 
      avatarIndex: this.selectedAvatarIndex, 
      petIndex: this.selectedPetIndex,
      petName: chosenPetName,
      username: this.username
    });
    this.save();
  },

  updateProfileInfo(name, age, avatarIdx, petIdx, petName) {
    if (name && name.trim()) this.username = name.trim();
    if (age) this.age = parseInt(age) || this.age;
    this.selectedAvatarIndex = avatarIdx;
    
    // If pet index changed, reset default name unless petName is customized
    const petNames = ["Puppy", "Kitty", "Bunny", "Frog", "Owl"];
    if (this.selectedPetIndex !== petIdx) {
      this.selectedPetIndex = petIdx;
      this.petName = petName && petName.trim() ? petName.trim() : (petNames[petIdx] || "Pet");
    } else if (petName && petName.trim()) {
      this.petName = petName.trim();
    }

    this.trigger('profileUpdated', {
      username: this.username,
      age: this.age,
      avatarIndex: this.selectedAvatarIndex,
      petIndex: this.selectedPetIndex,
      petName: this.petName
    });

    this.trigger('nameChange', { name: this.petName });

    this.trigger('speechChange', {
      text: `Got it! I've updated your profile details.`
    });
    this.save();
  },

  // Tamagotchi stats changes
  decayPetStats(hungerAmount, healthAmount) {
    if (this.petIsDead) return;
    this.petHunger = Math.max(0, this.petHunger - hungerAmount);
    
    // If hunger is 0, health decays twice as fast
    let actualHealthDecay = healthAmount;
    if (this.petHunger <= 0) {
      actualHealthDecay += hungerAmount * 1.5;
    }
    this.petHealth = Math.max(0, this.petHealth - actualHealthDecay);
    
    if (this.petHealth <= 0 && !this.petIsDead) {
      this.petIsDead = true;
      this.trigger('speechChange', { text: "Oh no! Your pet has fainted/passed away because it wasn't cared for. Pay 100 coins to revive it!" });
    }
    
    this.trigger('petStatsChange', { 
      hunger: this.petHunger, 
      health: this.petHealth, 
      isDead: this.petIsDead 
    });
    this.save();
  },

  feedPet(itemName, cost, hungerBoost, xpBoost) {
    if (this.coins < cost) {
      this.trigger('speechChange', { text: `Not enough coins to buy a ${itemName}! You need ${cost} coins.` });
      return false;
    }
    if (this.petIsDead) {
      this.trigger('speechChange', { text: "Your pet has fainted! You must revive it first." });
      return false;
    }
    
    this.coins -= cost;
    this.petHunger = Math.min(100, this.petHunger + hungerBoost);
    this.petHealth = Math.min(100, this.petHealth + 15); // feeding boosts health too
    
    this.trigger('coinsChange', { coins: this.coins });
    this.trigger('petStatsChange', { 
      hunger: this.petHunger, 
      health: this.petHealth, 
      isDead: this.petIsDead 
    });
    this.addXp(xpBoost);
    this.trigger('speechChange', { text: `You fed your pet a ${itemName}! Yummy! (+${hungerBoost}% hunger)` });
    this.save();
    return true;
  },

  revivePet(cost) {
    if (this.coins < cost) {
      this.trigger('speechChange', { text: `Not enough coins to revive your pet! You need ${cost} coins.` });
      return false;
    }
    
    this.coins -= cost;
    this.petHunger = 60;
    this.petHealth = 60;
    this.petIsDead = false;
    
    this.trigger('coinsChange', { coins: this.coins });
    this.trigger('petStatsChange', { 
      hunger: this.petHunger, 
      health: this.petHealth, 
      isDead: this.petIsDead 
    });
    this.trigger('speechChange', { text: "Woohoo! Your pet is back on its feet, healthy and happy! Let's keep studying!" });
    this.save();
    return true;
  },

  recalculateGoalsProgress() {
    if (!this.goals) return;

    // 1. Daily Login
    if (this.goals.dailyLogin) {
      this.goals.dailyLogin.completed = true;
      this.goals.dailyLogin.percent = 100;
    }

    // 2. Study for 30mins
    if (this.goals.study30Mins) {
      const studyGoal = this.goals.study30Mins;
      const targetSec = 1800; // 30 minutes
      const pct = Math.min(100, Math.floor((this.totalStudyTime / targetSec) * 100));
      studyGoal.percent = pct;
      if (pct >= 100) {
        studyGoal.completed = true;
      } else if (!studyGoal.claimed) {
        studyGoal.completed = false;
      }
    }

    // 3. Finish one task
    if (this.goals.finishOneTask) {
      const taskGoal = this.goals.finishOneTask;
      const anyCompleted = (this.customTasks || []).some(t => t.completed);
      taskGoal.percent = anyCompleted ? 100 : 0;
      if (anyCompleted) {
        taskGoal.completed = true;
      } else if (!taskGoal.claimed) {
        taskGoal.completed = false;
      }
    }

    // 4. Daily Focus Quest
    if (this.goals.dailyFocus) {
      const focusGoal = this.goals.dailyFocus;
      this.focusPoints = Math.min(30, Math.floor(this.totalStudyTime / 60));
      this.maxFocusPoints = 30;
      
      const isComplete = this.focusPoints >= this.maxFocusPoints;
      focusGoal.percent = Math.floor((this.focusPoints / this.maxFocusPoints) * 100);
      
      if (isComplete) {
        focusGoal.completed = true;
      } else if (!focusGoal.claimed) {
        focusGoal.completed = false;
      }
    }
  },

  addStudySecond(amount = 1) {
    this.totalStudyTime += amount;
    this.trigger('studyTimeChange', { totalStudyTime: this.totalStudyTime });
    
    // Update study30Mins goal progress
    if (this.goals && this.goals.study30Mins) {
      const studyGoal = this.goals.study30Mins;
      const targetSec = 1800;
      const pct = Math.min(100, Math.floor((this.totalStudyTime / targetSec) * 100));
      
      let changed = false;
      if (pct !== studyGoal.percent) {
        studyGoal.percent = pct;
        changed = true;
      }
      
      if (pct >= 100 && !studyGoal.completed) {
        studyGoal.completed = true;
        this.trigger('speechChange', { text: "Goal complete: Study for 30mins! Go claim your reward!" });
        changed = true;
        this.save();
      }
      
      if (changed) {
        this.trigger('goalsUpdated');
      }
    }

    // Update dailyFocus quest progress
    if (this.goals && this.goals.dailyFocus) {
      const focusGoal = this.goals.dailyFocus;
      const prevPoints = this.focusPoints;
      this.focusPoints = Math.min(30, Math.floor(this.totalStudyTime / 60));
      this.maxFocusPoints = 30;
      
      if (this.focusPoints !== prevPoints) {
        const pct = Math.floor((this.focusPoints / this.maxFocusPoints) * 100);
        focusGoal.percent = pct;
        
        if (this.focusPoints >= this.maxFocusPoints && !focusGoal.completed) {
          focusGoal.completed = true;
          this.trigger('speechChange', { text: "Quest complete: Daily Focus! Claim your reward!" });
          this.save();
        }
        this.trigger('focusProgressUpdated');
      }
    }

    if (this.totalStudyTime % 10 === 0 || amount > 1) {
      this.save(true);
    }
  },

  addRestSecond(amount = 1) {
    this.totalRestTime += amount;
    this.trigger('restTimeChange', { totalRestTime: this.totalRestTime });
    if (this.totalRestTime % 10 === 0 || amount > 1) {
      this.save(true);
    }
  },

  addTask(text) {
    const task = {
      id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
      text: text,
      completed: false
    };
    if (!this.customTasks) this.customTasks = [];
    this.customTasks.push(task);
    this.trigger('tasksChange', { tasks: this.customTasks });
    this.save();
    return task;
  },

  completeTask(id) {
    if (!this.customTasks) this.customTasks = [];
    const task = this.customTasks.find(t => t.id === id);
    if (task && !task.completed) {
      task.completed = true;
      this.totalTasksCompleted = (this.totalTasksCompleted || 0) + 1;
      
      // Reward 15 coins and 10 XP
      this.addCoins(15);
      this.addXp(10);
      this.trigger('speechChange', { text: "Awesome! Task complete! Earned 15 coins & 10 XP! 💰🎉" });
      
      // Trigger hearts effect
      this.trigger('taskCompletedEffect');

      // Update finishOneTask daily goal progress
      if (this.goals && this.goals.finishOneTask) {
        const taskGoal = this.goals.finishOneTask;
        const prevCompleted = taskGoal.completed;
        taskGoal.percent = 100;
        
        if (!taskGoal.claimed) {
          taskGoal.completed = true;
        }
        
        if (taskGoal.completed && !prevCompleted) {
          this.trigger('speechChange', { text: "Goal complete: Finish one task! Go claim your reward!" });
        }
        this.trigger('goalsUpdated');
      }

      this.trigger('tasksChange', { tasks: this.customTasks });
      this.save();
    }
  },

  toggleTask(id) {
    if (!this.customTasks) this.customTasks = [];
    const task = this.customTasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.trigger('tasksChange', { tasks: this.customTasks });
      
      // Update finishOneTask goal progress
      if (this.goals && this.goals.finishOneTask) {
        const taskGoal = this.goals.finishOneTask;
        const anyCompleted = this.customTasks.some(t => t.completed);
        const prevCompleted = taskGoal.completed;
        taskGoal.percent = anyCompleted ? 100 : 0;
        
        if (!taskGoal.claimed) {
          taskGoal.completed = anyCompleted;
        }
        
        if (taskGoal.completed && !prevCompleted) {
          this.trigger('speechChange', { text: "Goal complete: Finish one task! Go claim your reward!" });
        }
        this.trigger('goalsUpdated');
      }
      
      this.save();
    }
  },

  deleteTask(id) {
    if (!this.customTasks) this.customTasks = [];
    this.customTasks = this.customTasks.filter(t => t.id !== id);
    this.trigger('tasksChange', { tasks: this.customTasks });
    
    // Update finishOneTask goal progress
    if (this.goals && this.goals.finishOneTask) {
      const taskGoal = this.goals.finishOneTask;
      const anyCompleted = this.customTasks.some(t => t.completed);
      const prevCompleted = taskGoal.completed;
      taskGoal.percent = anyCompleted ? 100 : 0;
      
      if (!taskGoal.claimed) {
        taskGoal.completed = anyCompleted;
      }
      
      if (taskGoal.completed && !prevCompleted) {
        this.trigger('speechChange', { text: "Goal complete: Finish one task! Go claim your reward!" });
      }
      this.trigger('goalsUpdated');
    }
    
    this.save();
  },

  resetToDefault(shouldSave = true) {
    this.xp = 120;
    this.coins = 45;
    this.streak = 2;
    this.badges = 0;
    this.rank = 'Bronze';
    this.petLevel = 1;
    this.focusPoints = 30;
    this.maxFocusPoints = 30;
    this.selectedAvatarIndex = 0;
    this.selectedPetIndex = 0;
    this.petName = 'Companion';
    this.onboardingComplete = false;
    this.username = 'ScholarPaws';
    this.age = 20;
    this.totalStudyTime = 0;
    this.totalRestTime = 0;
    this.customTasks = [
      { id: 'starting-1', text: 'Review math study slides', completed: false },
      { id: 'starting-2', text: 'Write draft introduction paragraph', completed: false }
    ];
    this.totalTasksCompleted = 0;
    this.petHunger = 100;
    this.petHealth = 100;
    this.petIsDead = false;
    this.goals = {
      dailyLogin: { completed: true, claimed: false, percent: 100, reward: 10 },
      study30Mins: { completed: false, claimed: false, percent: 0, reward: 15 },
      finishOneTask: { completed: false, claimed: false, percent: 0, reward: 20 },
      dailyFocus: { completed: false, claimed: false, reward: 20 }
    };
    if (shouldSave) {
      this.save();
    }
    this.trigger('stateLoaded');
  }
};

// Initial state load
AppState.load();

// Expose state globally
window.AppState = AppState;

if (isFirebaseEnabled && auth) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("Authenticated as:", user.uid, "Anonymous:", user.isAnonymous);
      await AppState.loadFromFirestore(user.uid);
      AppState.trigger('authStateChanged', user);
    } else {
      console.log("Signing in anonymously...");
      signInAnonymously(auth).catch(err => console.error("Anon auth failed", err));
      AppState.trigger('authStateChanged', null);
    }
  });
}

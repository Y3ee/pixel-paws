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
  
  // Tamagotchi stats
  petHunger: 100,
  petHealth: 100,
  petIsDead: false,
  
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

  // LocalStorage & Firestore Persistence
  save() {
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
      goals: this.goals
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
      setDoc(docRef, data, { merge: true })
        .then(() => console.log("State successfully synced with Firestore!"))
        .catch(err => console.error("Firestore sync failed:", err));
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
      } else {
        console.log("No state found in Firestore. Creating initial save.");
        this.save();
      }
    } catch (e) {
      console.error("Failed to load state from Firestore", e);
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
    if (data.goals !== undefined) this.goals = data.goals;
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
      if (goalKey === 'readNotes' || goalKey === 'morningBrew') {
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
      this.trigger('speechChange', { text: `Hello, I am now called ${this.petName}! Woof!` });
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
  }
};

// Initial state load
AppState.load();

// Expose state globally
window.AppState = AppState;

if (isFirebaseEnabled && auth) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("Authenticated anonymously as:", user.uid);
      await AppState.loadFromFirestore(user.uid);
    } else {
      console.log("Signing in anonymously...");
      signInAnonymously(auth).catch(err => console.error("Anon auth failed", err));
    }
  });
}

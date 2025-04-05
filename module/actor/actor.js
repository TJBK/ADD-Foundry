/**
 * Extend the basic Actor class for AD&D 2e.
 * @extends {Actor}
 */
export class ADD2EActor extends Actor {
  /**
   * @override
   * Augment the basic actor data with additional dynamic data.
   */
  prepareData() {
    // Prepare data for the actor
    super.prepareData();

    // Get the Actor's data
    const actorData = this;
    const system = actorData.system || {};
    const flags = actorData.flags || {};

    // Make sure we have the basic structures to avoid errors
    if (!system.details) system.details = {};
    if (!system.abilities) system.abilities = {};
    if (!system.combat) system.combat = {};
    if (!system.saves) system.saves = {};

    // Initialize properties if not present
    for (let abl of ["str", "dex", "con", "int", "wis", "cha"]) {
      if (!system.abilities[abl]) system.abilities[abl] = {};
      if (!system.abilities[abl].value) system.abilities[abl].value = 10;
    }

    // Prepare character data
    if (actorData.type === 'character') {
      this._prepareCharacterData(actorData);
    }

    // Prepare NPC data
    if (actorData.type === 'npc') {
      this._prepareNPCData(actorData);
    }

    // Prepare monster data
    if (actorData.type === 'monster') {
      this._prepareMonsterData(actorData);
    }
  }

  /**
   * Prepare Character type specific data
   * @param {Object} actorData The actor data object
   * @private
   */
  _prepareCharacterData(actorData) {
    const system = actorData.system || {};

    // Calculate ability modifiers
    this._calculateAbilityModifiers(system);

    // Calculate THAC0 based on class and level
    this._calculateTHAC0(system);

    // Calculate saving throws based on class and level
    this._calculateSavingThrows(system);

    // Calculate AC adjustments from Dexterity
    this._calculateArmorClass(system);

    // Calculate HP adjustments from Constitution
    this._calculateHitPoints(system);
  }

  /**
   * Prepare NPC type specific data
   * @param {Object} actorData The actor data object
   * @private
   */
  _prepareNPCData(actorData) {
    const system = actorData.system || {};

    // NPCs use the same calculations as characters for now
    this._calculateAbilityModifiers(system);
    this._calculateTHAC0(system);
    this._calculateSavingThrows(system);
    this._calculateArmorClass(system);
    this._calculateHitPoints(system);
  }

  /**
   * Prepare Monster type specific data
   * @param {Object} actorData The actor data object
   * @private
   */
  _prepareMonsterData(actorData) {
    const system = actorData.system || {};

    // Monsters use simplified calculations
    // You might want to implement these based on HD or other monster stats
  }

  /**
   * Calculate ability modifiers based on AD&D 2e rules
   * @param {Object} system The system data for the actor
   * @private
   */
  _calculateAbilityModifiers(system) {
    // This is a simplified version - implement the full AD&D 2e modifiers
    if (!system.abilityMods) system.abilityMods = {};

    for (let abl of Object.keys(system.abilities || {})) {
      const ability = system.abilities[abl] || {};
      let mod = 0;

      // Example calculation, not accurate to AD&D 2e
      const value = ability.value || 10;
      if (value <= 3) mod = -3;
      else if (value <= 5) mod = -2;
      else if (value <= 8) mod = -1;
      else if (value <= 12) mod = 0;
      else if (value <= 15) mod = 1;
      else if (value <= 17) mod = 2;
      else if (value >= 18) mod = 3;

      // Special handling for exceptional strength
      if (abl === "str" && value === 18 && ability.exceptional) {
        // Implement the exceptional strength table here
        // This is a simplified example
        const excStr = ability.exceptional || 0;
        if (excStr <= 50) mod = 3;
        else if (excStr <= 75) mod = 4;
        else if (excStr <= 90) mod = 5;
        else if (excStr <= 99) mod = 6;
        else if (excStr === 100) mod = 7;
      }

      system.abilityMods[abl] = mod;
    }
  }

  /**
   * Calculate THAC0 based on class and level
   * @param {Object} system The system data for the actor
   * @private
   */
  _calculateTHAC0(system) {
    // Default THAC0 is 20 (worst possible)
    let baseThac0 = 20;

    // Example calculation - not accurate to AD&D 2e
    // You would want to implement the proper THAC0 tables
    let characterClass = "";
    if (system.details && system.details.class) {
      characterClass = system.details.class.toLowerCase();
    }

    const level = (system.details && system.details.level) ? system.details.level : 1;

    if (["fighter", "paladin", "ranger"].includes(characterClass)) {
      baseThac0 = 21 - Math.floor(level);
    } else if (["cleric", "druid", "monk"].includes(characterClass)) {
      baseThac0 = 21 - Math.floor(level * 2 / 3);
    } else if (["thief", "bard", "assassin"].includes(characterClass)) {
      baseThac0 = 21 - Math.floor(level * 2 / 3);
    } else if (["mage", "illusionist"].includes(characterClass)) {
      baseThac0 = 21 - Math.floor(level * 1 / 2);
    }

    // Ensure THAC0 doesn't go below 1
    baseThac0 = Math.max(1, baseThac0);

    // Apply STR modifier to THAC0
    let strMod = 0;
    if (system.abilityMods && system.abilityMods.str !== undefined) {
      strMod = system.abilityMods.str;
    }

    // Make sure we have the combat structure
    if (!system.combat) system.combat = {};
    if (!system.combat.thac0) system.combat.thac0 = {};

    system.combat.thac0.value = baseThac0 - strMod;
  }

  /**
   * Calculate saving throws based on class and level
   * @param {Object} system The system data for the actor
   * @private
   */
  _calculateSavingThrows(system) {
    // This is a simplified placeholder
    // You would want to implement the proper saving throw tables from AD&D 2e
    let characterClass = "";
    if (system.details && system.details.class) {
      characterClass = system.details.class.toLowerCase();
    }

    const level = (system.details && system.details.level) ? system.details.level : 1;

    // Default values (these are not accurate to AD&D 2e)
    let paralyze = 16;
    let poison = 15;
    let breath = 17;
    let magical = 16;
    let spell = 18;

    // Example calculation based on class and level
    // These values are not accurate to AD&D 2e
    if (["fighter", "paladin", "ranger"].includes(characterClass)) {
      paralyze = 16 - Math.floor(level / 3);
      poison = 15 - Math.floor(level / 3);
      breath = 17 - Math.floor(level / 3);
      magical = 16 - Math.floor(level / 4);
      spell = 18 - Math.floor(level / 4);
    } else if (["cleric", "druid", "monk"].includes(characterClass)) {
      paralyze = 14 - Math.floor(level / 3);
      poison = 13 - Math.floor(level / 3);
      breath = 16 - Math.floor(level / 3);
      magical = 15 - Math.floor(level / 4);
      spell = 17 - Math.floor(level / 4);
    } else if (["thief", "bard", "assassin"].includes(characterClass)) {
      paralyze = 15 - Math.floor(level / 4);
      poison = 14 - Math.floor(level / 4);
      breath = 16 - Math.floor(level / 4);
      magical = 15 - Math.floor(level / 5);
      spell = 17 - Math.floor(level / 5);
    } else if (["mage", "illusionist"].includes(characterClass)) {
      paralyze = 15 - Math.floor(level / 5);
      poison = 14 - Math.floor(level / 5);
      breath = 16 - Math.floor(level / 5);
      magical = 13 - Math.floor(level / 3);
      spell = 14 - Math.floor(level / 3);
    }

    // Ensure we have the saves structure
    if (!system.saves) system.saves = {};
    if (!system.saves.paralyze) system.saves.paralyze = {};
    if (!system.saves.poison) system.saves.poison = {};
    if (!system.saves.breath) system.saves.breath = {};
    if (!system.saves.magical) system.saves.magical = {};
    if (!system.saves.spell) system.saves.spell = {};

    // Set the values
    system.saves.paralyze.value = Math.max(1, paralyze);
    system.saves.poison.value = Math.max(1, poison);
    system.saves.breath.value = Math.max(1, breath);
    system.saves.magical.value = Math.max(1, magical);
    system.saves.spell.value = Math.max(1, spell);
  }

  /**
   * Calculate AC adjustments from Dexterity
   * @param {Object} system The system data for the actor
   * @private
   */
  _calculateArmorClass(system) {
    // Apply DEX adjustment to AC
    // In AD&D 2e, lower AC is better
    let dexMod = 0;
    if (system.abilityMods && system.abilityMods.dex !== undefined) {
      dexMod = system.abilityMods.dex;
    }

    // Apply DEX mod to base AC
    let baseAC = 10;

    // Ensure we have the necessary structures
    if (!system.combat) system.combat = {};
    if (!system.combat.ac) system.combat.ac = {};

    // Iterate through items to find armor
    const armorItems = [];
    if (this.items) {
      for (let item of this.items) {
        if (item.type === "armor" &&
          item.system &&
          item.system.equipped) {
          armorItems.push(item);
        }
      }
    }

    if (armorItems.length > 0) {
      // Use the best AC value from equipped armor
      let bestAC = 10;
      for (let armor of armorItems) {
        const armorAC = armor.system && armor.system.ac ? armor.system.ac : 10;
        if (armorAC < bestAC) bestAC = armorAC;
      }
      baseAC = bestAC;
    }

    // In AD&D 2e, negative modifiers improve AC
    system.combat.ac.value = baseAC - dexMod;
  }

  /**
   * Calculate HP adjustments from Constitution
   * @param {Object} system The system data for the actor
   * @private
   */
  _calculateHitPoints(system) {
    // Apply CON adjustment to HP maximum
    // This is a simplified version
    let conMod = 0;
    if (system.abilityMods && system.abilityMods.con !== undefined) {
      conMod = system.abilityMods.con;
    }

    const level = system.details && system.details.level ? system.details.level : 1;

    // Ensure we have the necessary structures
    if (!system.combat) system.combat = {};
    if (!system.combat.hp) system.combat.hp = {};

    // Base HP calculation would typically be more complex in AD&D 2e
    // This is just a placeholder
    const baseHP = 10; // Would normally be based on class/level/roll history

    // Apply CON modifier per level
    const bonusHP = conMod * level;

    // Set max HP (ensuring at least 1)
    system.combat.hp.max = Math.max(1, baseHP + bonusHP);

    // If current HP is not set or exceeds max, set it to max
    if (!system.combat.hp.value || system.combat.hp.value > system.combat.hp.max) {
      system.combat.hp.value = system.combat.hp.max;
    }
  }
}
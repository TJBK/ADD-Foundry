/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class ADD2EItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();

    // Get the Item's data
    const itemData = this;
    const system = itemData.system;
    const flags = itemData.flags;

    // Handle specific item types
    if (itemData.type === 'weapon') this._prepareWeaponData(itemData);
    if (itemData.type === 'armor') this._prepareArmorData(itemData);
    if (itemData.type === 'spell') this._prepareSpellData(itemData);
  }

  /**
   * Prepare weapon specific data
   */
  _prepareWeaponData(itemData) {
    const system = itemData.system;

    // Example weapon preparation
    // Check if damage is specified
    if (!system.damage || system.damage === "") {
      system.damage = "1d6"; // Default damage
    }
  }

  /**
   * Prepare armor specific data
   */
  _prepareArmorData(itemData) {
    const system = itemData.system;

    // Example armor preparation
    // Make sure AC is properly set
    if (!system.ac || system.ac === 0) {
      system.ac = 10; // Default AC
    }
  }

  /**
   * Prepare spell specific data
   */
  _prepareSpellData(itemData) {
    const system = itemData.system;

    // Example spell preparation
    // Default values for spells
    if (!system.level) system.level = 1;
    if (!system.castingTime) system.castingTime = "1 round";
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    // Basic template rendering
    const token = this.actor.token;
    const item = this;
    const actorData = this.actor.system;
    const itemData = item.system;

    // Handle different item types
    switch (item.type) {
      case 'weapon':
        return this._rollWeapon(itemData);
      case 'spell':
        return this._rollSpell(itemData);
    }
  }

  /**
   * Handle weapon rolls
   * @param {Object} itemData   The item data to roll
   * @private
   */
  async _rollWeapon(itemData) {
    // Get THAC0
    const thac0 = this.actor.system.combat.thac0.value || 20;

    // Roll attack
    const attackRoll = new Roll("1d20");
    await attackRoll.evaluate({ async: true });

    // Calculate AC hit
    const acHit = thac0 - attackRoll.total;

    // Roll damage
    const damageRoll = new Roll(itemData.damage || "1d6");
    await damageRoll.evaluate({ async: true });

    // Prepare chat message data
    const messageData = {
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `${this.name} - Attack Roll`,
      content: `
        <div class="add2e weapon-roll">
          <div class="roll-info">
            <h3>${this.name}</h3>
            <div>THAC0: ${thac0}</div>
          </div>
          <div class="roll-result">
            <div>Attack Roll: ${attackRoll.total}</div>
            <div>Hits AC: ${acHit}</div>
            <div>Damage: ${damageRoll.total} (${damageRoll.formula})</div>
          </div>
        </div>
      `
    };

    // Send to chat
    return ChatMessage.create(messageData);
  }

  /**
   * Handle spell rolls
   * @param {Object} itemData   The item data to roll
   * @private
   */
  async _rollSpell(itemData) {
    // Prepare chat message data
    const messageData = {
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `${this.name} - Level ${itemData.level} ${itemData.school} Spell`,
      content: `
        <div class="add2e spell-roll">
          <div class="roll-info">
            <h3>${this.name}</h3>
            <div><strong>Casting Time:</strong> ${itemData.castingTime}</div>
            <div><strong>Range:</strong> ${itemData.range}</div>
            <div><strong>Duration:</strong> ${itemData.duration}</div>
            <div><strong>Area of Effect:</strong> ${itemData.area}</div>
            <div><strong>Components:</strong> ${itemData.components}</div>
            <div><strong>Saving Throw:</strong> ${itemData.savingThrow}</div>
          </div>
          <div class="spell-description">
            ${itemData.description}
          </div>
        </div>
      `
    };

    // Send to chat
    return ChatMessage.create(messageData);
  }
}
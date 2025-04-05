/**
 * AD&D 2e Character Sheet
 */
export class ADD2ECharacterSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["add2e", "sheet", "actor"],
      template: "systems/add2e/templates/actor/character-sheet.html",
      width: 720,
      height: 680,
      tabs: [{
        navSelector: ".sheet-tabs",
        contentSelector: ".sheet-body",
        initial: "attributes"
      }]
    });
  }

  /** @override */
  getData() {
    const data = super.getData();

    // Initialize data structures if needed
    if (!data.system) data.system = {};
    if (!data.system.abilities) data.system.abilities = {};
    if (!data.system.details) data.system.details = {};
    if (!data.system.combat) data.system.combat = {};
    if (!data.system.saves) data.system.saves = {};
    if (!data.system.wealth) data.system.wealth = {};

    // Add dark mode class if setting is enabled
    // Note: We'll handle classList in the render method instead since element might not exist yet
    this._darkMode = game.settings.get("add2e", "useDarkMode");

    // Prepare spell lists by level
    if (data.actor.type === "character") {
      data.spellLevels = {};

      // Get all spells
      const spells = data.items.filter(item => item.type === "spell");

      // Group spells by level
      for (let spell of spells) {
        let lvl = 0;
        if (spell.system && spell.system.level) {
          lvl = spell.system.level;
        }
        if (!data.spellLevels[lvl]) data.spellLevels[lvl] = [];
        data.spellLevels[lvl].push(spell);
      }

      // Sort spell levels
      for (let lvl in data.spellLevels) {
        data.spellLevels[lvl].sort((a, b) => a.name.localeCompare(b.name));
      }
    }

    return data;
  }

  /** @override */
  render(force = false, options = {}) {
    // Call the parent render method but don't try to manipulate the element yet
    return super.render(force, options);
  }

  /** @override */
  _renderInner(data) {
    // Use _renderInner which is called after the HTML is generated
    return super._renderInner(data).then(html => {
      // Apply dark mode here if needed - at this point we have HTML content
      if (this._darkMode) {
        html.addClass("dark-mode");
      } else {
        html.removeClass("dark-mode");
      }
      return html;
    });
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Make sure we manually add our tab listeners
    html.find('.sheet-tabs .item').click(this._onTabClick.bind(this));

    // Add roll listeners
    html.find('.ability-score').click(this._onAbilityRoll.bind(this));
    html.find('.save').click(this._onSavingThrowRoll.bind(this));
    html.find('.combat-stat.thac0').click(this._onAttackRoll.bind(this));

    // Item management
    html.find('.item-create').click(this._onItemCreate.bind(this));
    html.find('.item-edit').click(this._onItemEdit.bind(this));
    html.find('.item-delete').click(this._onItemDelete.bind(this));

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Make sure we activate the initial tab
    const activeTab = html.find('.sheet-tabs .item.active').data('tab');
    if (activeTab) {
      this._activateTab(activeTab);
    } else {
      this._activateTab('attributes');
    }
  }

  /**
   * Handle tab clicks manually
   */
  _onTabClick(event) {
    event.preventDefault();
    const tab = event.currentTarget.dataset.tab;
    this._activateTab(tab);
  }

  /**
   * Activate a tab
   */
  _activateTab(tabName) {
    if (!this.element) return;

    // Update the tab navigation
    this.element.find('.sheet-tabs .item').removeClass('active');
    this.element.find(`.sheet-tabs .item[data-tab="${tabName}"]`).addClass('active');

    // Update the tab content
    this.element.find('.tab-content').removeClass('active');
    this.element.find(`.tab-content[data-tab="${tabName}"]`).addClass('active');

    console.log(`ADD2E | Tab activated: ${tabName}`);
  }

  /**
   * Handle creating a new Item
   * @param {Event} event
   * @private
   */
  _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type;
    const data = { name: `New ${type.capitalize()}`, type };

    // Create the item
    return this.actor.createEmbeddedDocuments("Item", [data]);
  }

  /**
   * Handle editing an existing Item
   * @param {Event} event
   * @private
   */
  _onItemEdit(event) {
    event.preventDefault();
    const li = event.currentTarget.closest(".item");
    const itemId = li.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (item) {
      item.sheet.render(true);
    }
  }

  /**
   * Handle deleting an Item
   * @param {Event} event
   * @private
   */
  _onItemDelete(event) {
    event.preventDefault();
    const li = event.currentTarget.closest(".item");
    const itemId = li.dataset.itemId;

    // Show confirmation dialog
    new Dialog({
      title: `Delete Item`,
      content: `<p>Are you sure you want to delete this item?</p>`,
      buttons: {
        yes: {
          icon: '<i class="fas fa-trash"></i>',
          label: "Yes",
          callback: () => this.actor.deleteEmbeddedDocuments("Item", [itemId])
        },
        no: {
          icon: '<i class="fas fa-times"></i>',
          label: "No"
        }
      },
      default: "no"
    }).render(true);
  }

  /**
   * Handle ability score rolls
   * @param {Event} event
   * @private
   */
  _onAbilityRoll(event) {
    event.preventDefault();

    // Get the ability from the dataset
    const ability = event.currentTarget.dataset.ability;
    if (!ability) return;

    // Make sure we have the ability data before proceeding
    if (!this.actor || !this.actor.system || !this.actor.system.abilities || !this.actor.system.abilities[ability]) {
      console.warn(`Actor missing ability data for ${ability}`);
      return;
    }

    const abilityData = this.actor.system.abilities[ability];

    // Calculate modifier based on AD&D 2e rules
    const value = abilityData.value || 10;
    let modifier = 0;

    // This is a simplified example - you'd want to use the proper AD&D 2e ability modifiers
    if (value <= 3) modifier = -3;
    else if (value <= 5) modifier = -2;
    else if (value <= 8) modifier = -1;
    else if (value <= 12) modifier = 0;
    else if (value <= 15) modifier = 1;
    else if (value <= 17) modifier = 2;
    else if (value >= 18) modifier = 3;

    // Roll the check
    const roll = new Roll("1d20");
    roll.evaluate({ async: false });

    // Construct the message
    const messageData = {
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `${ability.toUpperCase()} Check (Modifier: ${modifier > 0 ? '+' : ''}${modifier})`,
      content: `<div class="roll-result">
                  <div class="dice-roll">
                    <div class="dice-result">
                      <div class="dice-formula">${roll.formula}</div>
                      <div class="dice-tooltip">${roll.total}</div>
                    </div>
                  </div>
                  <div class="roll-text">Result: ${roll.total} + ${modifier} = <strong>${roll.total + modifier}</strong></div>
                </div>`
    };

    // Send to chat
    ChatMessage.create(messageData);
  }

  /**
   * Handle saving throw rolls
   * @param {Event} event
   * @private
   */
  _onSavingThrowRoll(event) {
    event.preventDefault();
    const saveType = event.currentTarget.dataset.save;
    if (!saveType) return;

    if (!this.actor || !this.actor.system || !this.actor.system.saves || !this.actor.system.saves[saveType]) {
      console.warn(`Actor missing saving throw data for ${saveType}`);
      return;
    }

    const saveValue = this.actor.system.saves[saveType].value || 20;

    // Roll the saving throw
    const roll = new Roll("1d20");
    roll.evaluate({ async: false });

    // Determine success/failure
    const success = roll.total <= saveValue;

    // Construct the message
    const messageData = {
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `${saveType.charAt(0).toUpperCase() + saveType.slice(1)} Saving Throw (Target: ${saveValue})`,
      content: `<div class="roll-result">
                  <div class="dice-roll">
                    <div class="dice-result">
                      <div class="dice-formula">${roll.formula}</div>
                      <div class="dice-tooltip">${roll.total}</div>
                    </div>
                  </div>
                  <div class="roll-text">Result: ${roll.total} vs ${saveValue} - <strong>${success ? "Success!" : "Failure!"}</strong></div>
                </div>`
    };

    // Send to chat
    ChatMessage.create(messageData);
  }

  /**
   * Handle attack rolls
   * @param {Event} event
   * @private
   */
  _onAttackRoll(event) {
    event.preventDefault();
    if (!this.actor || !this.actor.system || !this.actor.system.combat || !this.actor.system.combat.thac0) {
      console.warn("Actor missing THAC0 data");
      return;
    }

    const thac0 = this.actor.system.combat.thac0.value || 20;

    // Roll the attack
    const roll = new Roll("1d20");
    roll.evaluate({ async: false });

    // Calculate the AC hit
    const acHit = thac0 - roll.total;

    // Construct the message
    const messageData = {
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `Attack Roll (THAC0: ${thac0})`,
      content: `<div class="roll-result">
                  <div class="dice-roll">
                    <div class="dice-result">
                      <div class="dice-formula">${roll.formula}</div>
                      <div class="dice-tooltip">${roll.total}</div>
                    </div>
                  </div>
                  <div class="roll-text">Result: ${roll.total} - Hits AC ${acHit}</div>
                </div>`
    };

    // Send to chat
    ChatMessage.create(messageData);
  }

  /** @override */
  async _updateObject(event, formData) {
    // Handle the core update
    console.log("ADD2E | _updateObject called with formData:", formData);
    return super._updateObject(event, formData);
  }
}
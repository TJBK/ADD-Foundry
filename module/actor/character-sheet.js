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
      }],
      // This ensures data is submitted on change rather than requiring a submit button
      submitOnChange: true,
      // This makes sure we don't close on submit
      closeOnSubmit: false
    });
  }

  /** @override */
  getData() {
    // Get the basic data
    const context = super.getData();
    const actorData = this.actor.toObject(false);

    // Add the actor's data to context.system for easier access
    context.system = actorData.system;

    // Prepare character data and items
    if (actorData.type === 'character') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Add dark mode class if setting is enabled
    this._darkMode = game.settings.get("add2e", "useDarkMode");

    // Add roll data for TinyMCE editors to use
    context.rollData = context.actor.getRollData();

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} context The actor data being prepared.
   * @private
   */
  _prepareItems(context) {
    // Initialize containers
    const weapons = [];
    const equipment = [];
    const armor = [];
    const proficiencies = {
      weapon: [],
      nonweapon: []
    };
    const spells = {};

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      // Set item data
      i.img = i.img || DEFAULT_TOKEN;

      // Sort items by type
      if (i.type === 'weapon') {
        weapons.push(i);
      }
      else if (i.type === 'equipment') {
        equipment.push(i);
      }
      else if (i.type === 'armor') {
        armor.push(i);
      }
      else if (i.type === 'proficiency') {
        if (i.system.type === 'weapon') proficiencies.weapon.push(i);
        else proficiencies.nonweapon.push(i);
      }
      else if (i.type === 'spell') {
        if (!spells[i.system.level]) spells[i.system.level] = [];
        spells[i.system.level].push(i);
      }
    }

    // Sort spells by level
    for (let level in spells) {
      spells[level].sort((a, b) => a.name.localeCompare(b.name));
    }

    // Assign to context
    context.weapons = weapons;
    context.equipment = equipment;
    context.armor = armor;
    context.proficiencies = proficiencies;
    context.spellLevels = spells;
  }

  /**
   * Prepare Character type specific data
   * @param {Object} context The actor data being prepared.
   * @private
   */
  _prepareCharacterData(context) {
    // Make modifications to data here that depend on character data fields
    // For example, you might compute derived values or modify properties for display
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

    // Add roll listeners
    html.find('.ability-score').click(this._onAbilityRoll.bind(this));
    html.find('.save').click(this._onSavingThrowRoll.bind(this));
    html.find('.combat-stat.thac0').click(this._onAttackRoll.bind(this));

    // Item management
    html.find('.item-create').click(this._onItemCreate.bind(this));
    html.find('.item-edit').click(this._onItemEdit.bind(this));
    html.find('.item-delete').click(this._onItemDelete.bind(this));

    // Add specific listeners for form inputs to ensure they update immediately
    if (this.isEditable) {
      // Checkbox changes
      html.find('input[type="checkbox"]').change(this._onChangeCheckbox.bind(this));

      // Make sure numeric inputs are properly handled
      html.find('input[type="number"]').change(this._onChangeInput.bind(this));
    }
  }

  /**
   * Handle checkbox changes to immediately update the actor
   * @param {Event} event The originating change event
   * @private
   */
  _onChangeCheckbox(event) {
    event.preventDefault();
    const checkbox = event.currentTarget;
    const field = checkbox.name;

    // Create update data with the checkbox value
    const updateData = {};
    updateData[field] = checkbox.checked;

    // Update the actor
    return this.actor.update(updateData);
  }

  /**
   * Handle input changes to ensure numbers are properly processed
   * @param {Event} event The originating change event
   * @private
   */
  _onChangeInput(event) {
    event.preventDefault();
    const input = event.currentTarget;
    const field = input.name;
    let value = input.value;

    // Make sure numeric values are treated as numbers
    if (input.type === "number") {
      value = Number(value);
    }

    // Create update data with the input value
    const updateData = {};
    updateData[field] = value;

    // Log the update for debugging
    console.log(`Updating ${field} to ${value}`);

    // Update the actor
    return this.actor.update(updateData);
  }

  /**
   * Handle creating a new Item
   * @param {Event} event The originating click event
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
   * @param {Event} event The originating click event
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
   * @param {Event} event The originating click event
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
   * @param {Event} event The originating click event
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
   * @param {Event} event The originating click event
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
   * @param {Event} event The originating click event
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
    // Log the data being saved for debugging
    console.log("ADD2E | Updating character with form data:", formData);

    // Don't interfere with the standard Foundry update process
    return super._updateObject(event, formData);
  }
}
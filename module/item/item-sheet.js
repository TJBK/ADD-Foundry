/**
 * Base item sheet class for AD&D 2e items
 */
export class ADD2EItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 520,
      height: 480,
      classes: ["add2e", "sheet", "item"],
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  /** @override */
  get template() {
    const path = "systems/add2e/templates/item";
    // Return a different sheet for each item type
    return `${path}/item-${this.item.type}-sheet.html`;
  }

  /** @override */
  getData() {
    const data = super.getData();

    // Add additional data
    data.config = CONFIG.ADD2E;

    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;
  }
}
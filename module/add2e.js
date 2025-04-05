// Import necessary modules
import { ADD2EActor } from "./actor/actor.js";
import { ADD2ECharacterSheet } from "./actor/character-sheet.js";
import { ADD2EItem } from "./item/item.js";
import { ADD2EItemSheet } from "./item/item-sheet.js";
import { ADD2E } from "./helpers/config.js";

// For backwards compatibility with Foundry VTT 12
const ActorSheet = globalThis.ActorSheet;
const ItemSheet = globalThis.ItemSheet;

/* -------------------------------------------- */
/*  Initialize System                           */
/* -------------------------------------------- */
Hooks.once('init', async function () {
  console.log("ADD2E | Initializing AD&D 2nd Edition System");

  // Define custom Document classes
  CONFIG.Actor.documentClass = ADD2EActor;
  CONFIG.Item.documentClass = ADD2EItem;

  console.log("ADD2E | Registering sheet applications");

  // Register sheet application classes
  // Don't try to unregister the core sheet - this is causing errors
  // Instead, just register our sheet with makeDefault: true
  Actors.registerSheet("add2e", ADD2ECharacterSheet, {
    types: ["character"],
    makeDefault: true
  });

  // Register Item sheets - same approach
  Items.registerSheet("add2e", ADD2EItemSheet, {
    makeDefault: true
  });

  // Store configuration in CONFIG
  CONFIG.ADD2E = ADD2E;

  // Register system settings
  registerSystemSettings();

  // Register Handlebars helpers
  registerHandlebarsHelpers();
});

/* -------------------------------------------- */
/*  Register System Settings                    */
/* -------------------------------------------- */
function registerSystemSettings() {
  // Register any system settings here
  game.settings.register("add2e", "useExceptionalStrength", {
    name: "Use Exceptional Strength",
    hint: "Enable the use of exceptional strength (18/xx) for fighter-type classes",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register("add2e", "useDarkMode", {
    name: "Dark Mode",
    hint: "Use a darker color scheme for character sheets",
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
    onChange: value => {
      // Refresh all rendered sheets
      Object.values(ui.windows).forEach(w => {
        if (w.options.sheetClass?.prototype?.template?.includes("add2e")) {
          w.render();
        }
      });
    }
  });
}

/* -------------------------------------------- */
/*  Register Handlebars Helpers                 */
/* -------------------------------------------- */
function registerHandlebarsHelpers() {
  // Register any Handlebars helpers here
  Handlebars.registerHelper('eq', function (a, b) {
    return a === b;
  });

  Handlebars.registerHelper('and', function () {
    return Array.prototype.slice.call(arguments, 0, -1).every(Boolean);
  });

  Handlebars.registerHelper('or', function () {
    return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
  });

  Handlebars.registerHelper('not', function (a) {
    return !a;
  });
}

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */
Hooks.once("ready", async function () {
  // Wait for game to be ready
  console.log("ADD2E | System Ready");
});

/* -------------------------------------------- */
/*  Sheet Render Hook                           */
/* -------------------------------------------- */
Hooks.on("renderADD2ECharacterSheet", (app, html, data) => {
  console.log("ADD2E | Rendering character sheet");

  // Apply dark mode if setting is enabled
  if (game.settings.get("add2e", "useDarkMode")) {
    html.addClass("dark-mode");
  }

  // IMPORTANT: Do not manually manipulate tab classes here
  // Let Foundry's built-in tab system handle it

  // NOTE: We're REMOVING the explicit tab activation code
  // that was conflicting with Foundry's tab system
});
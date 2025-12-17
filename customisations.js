console.log("customizations loading");

// ========================================
// MENU CUSTOMIZATION SYSTEM
// ========================================

// Default hidden menus (for backward compatibility)
const DEFAULT_HIDDEN_MENUS = [
  "Сер. номера",
  "Внутренние заказы",
  "Перемещения",
  "Отчеты комиссионера",
  "Товары на реализации",
  "Воронка продаж"
];

// Storage key for menu preferences
const MENU_PREFS_KEY = 'moysklad_menu_preferences';

// Get menu preferences from localStorage
function getMenuPreferences() {
  try {
    const stored = localStorage.getItem(MENU_PREFS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error loading menu preferences:', e);
  }
  
  // Initialize with defaults
  const defaultPrefs = {};
  DEFAULT_HIDDEN_MENUS.forEach(menu => {
    defaultPrefs[menu] = false; // false means hidden
  });
  return defaultPrefs;
}

// Save menu preferences to localStorage
function saveMenuPreferences(preferences) {
  try {
    localStorage.setItem(MENU_PREFS_KEY, JSON.stringify(preferences));
  } catch (e) {
    console.error('Error saving menu preferences:', e);
  }
}

// Parse menu items from the page
function parseMenuItems() {
  const menuItems = [];
  
  // Find all subMenu items
  const subMenuItems = document.querySelectorAll('span.subMenuItem-new[title]');
  subMenuItems.forEach(item => {
    const title = item.getAttribute('title');
    if (title) {
      menuItems.push({
        title: title,
        element: item,
        type: 'submenu'
      });
    }
  });
  
  // Find top menu items
  const topMenuItems = document.querySelectorAll('.topMenuItem-new');
  topMenuItems.forEach((item, index) => {
    const textContent = item.textContent.trim();
    if (textContent) {
      menuItems.push({
        title: textContent,
        element: item,
        type: 'topmenu',
        index: index + 1 // nth-child is 1-based
      });
    }
  });
  
  return menuItems;
}

// Escape CSS attribute selector value
function escapeCssAttributeValue(value) {
  // Escape special characters that could break CSS attribute selectors
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

// Apply menu preferences by generating dynamic CSS
function applyMenuPreferences() {
  const preferences = getMenuPreferences();
  let cssRules = [];
  
  // Apply preferences for submenus
  Object.keys(preferences).forEach(menuTitle => {
    const isVisible = preferences[menuTitle];
    if (!isVisible) {
      // Hide this menu - escape menuTitle to prevent CSS injection
      const escapedTitle = escapeCssAttributeValue(menuTitle);
      cssRules.push(`span.subMenuItem-new[title="${escapedTitle}"] { display: none; }`);
    }
  });
  
  // Keep the static form customizations
  const formTable = '#site > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td:nth-child(2) > table > tbody > tr > td > div > div > table > tbody > tr:nth-child(2) > td > div > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td:nth-child(2) > table > tbody ';
  cssRules.push(`
    /* Удаление Упаковка */
    ${formTable} > tr:nth-child(10) > td > table,
    /* Удаление Алкогольная продукция */
    ${formTable} > tr:nth-child(19) > td > table > tbody > tr:nth-child(1) > td > div > div,
    ${formTable} > tr:nth-child(19) > td > table > tbody > tr:nth-child(4) > td > table > tbody > tr > td > table > tbody > tr > td > table > tbody > tr:nth-child(1),
    /* Удаление Табачная продукция */
    .column > tbody:nth-child(2) > tr:nth-child(23),
    .column > tbody:nth-child(2) > tr:nth-child(24),
    .column > tbody:nth-child(2) > tr:nth-child(25) {
      display: none;
    }
    /* Удаление НДС */
    ${formTable} > tr:nth-child(25) > td:nth-child(1) > div > span {
      display: none;
    }
  `);
  
  appendStyle(cssRules.join('\n'));
}

// Sanitize menu title for use in HTML IDs
function sanitizeForId(title) {
  // Encodes title to base64 for uniqueness, then sanitizes the base64 result for use as HTML ID
  return 'menu-' + btoa(encodeURIComponent(title)).replace(/[^a-zA-Z0-9]/g, '-');
}

// Create customization overlay UI
function createCustomizationOverlay() {
  // Remove existing overlay if present
  const existing = document.getElementById('moysklad-customization-overlay');
  if (existing) {
    existing.remove();
  }
  
  const menuItems = parseMenuItems();
  const preferences = getMenuPreferences();
  
  // Create overlay container
  const overlay = document.createElement('div');
  overlay.id = 'moysklad-customization-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  // Create dialog
  const dialog = document.createElement('div');
  dialog.style.cssText = `
    background: white;
    padding: 30px;
    border-radius: 8px;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  `;
  
  // Create title
  const title = document.createElement('h2');
  title.textContent = 'Настройка меню';
  title.style.cssText = 'margin-top: 0; margin-bottom: 20px; font-size: 24px;';
  dialog.appendChild(title);
  
  // Create description
  const description = document.createElement('p');
  description.textContent = 'Выберите, какие пункты меню вы хотите видеть:';
  description.style.cssText = 'margin-bottom: 20px; color: #666;';
  dialog.appendChild(description);
  
  // Create menu items list
  const menuList = document.createElement('div');
  menuList.style.cssText = 'margin-bottom: 20px;';
  
  // Get unique menu titles
  const uniqueMenus = new Set();
  menuItems.forEach(item => {
    if (item.type === 'submenu') {
      uniqueMenus.add(item.title);
    }
  });
  
  // Create checkboxes for each menu
  uniqueMenus.forEach(menuTitle => {
    const itemDiv = document.createElement('div');
    itemDiv.style.cssText = 'margin-bottom: 12px; display: flex; align-items: center;';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = sanitizeForId(menuTitle);
    checkbox.checked = preferences[menuTitle] !== false; // default to visible
    checkbox.style.cssText = 'margin-right: 10px; width: 18px; height: 18px; cursor: pointer;';
    
    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.textContent = menuTitle;
    label.style.cssText = 'cursor: pointer; font-size: 16px;';
    
    itemDiv.appendChild(checkbox);
    itemDiv.appendChild(label);
    menuList.appendChild(itemDiv);
  });
  
  dialog.appendChild(menuList);
  
  // Create button container
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end;';
  
  // Create save button
  const saveButton = document.createElement('button');
  saveButton.textContent = 'Сохранить';
  saveButton.style.cssText = `
    padding: 10px 20px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
  `;
  saveButton.addEventListener('click', () => {
    // Collect preferences from checkboxes
    const newPreferences = {};
    uniqueMenus.forEach(menuTitle => {
      const checkbox = document.getElementById(sanitizeForId(menuTitle));
      newPreferences[menuTitle] = checkbox.checked;
    });
    
    saveMenuPreferences(newPreferences);
    overlay.remove();
    
    // Show reload message
    if (confirm('Настройки сохранены! Перезагрузить страницу для применения изменений?')) {
      window.location.reload();
    }
  });
  
  // Create cancel button
  const cancelButton = document.createElement('button');
  cancelButton.textContent = 'Отмена';
  cancelButton.style.cssText = `
    padding: 10px 20px;
    background: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
  `;
  cancelButton.addEventListener('click', () => {
    overlay.remove();
  });
  
  buttonContainer.appendChild(cancelButton);
  buttonContainer.appendChild(saveButton);
  dialog.appendChild(buttonContainer);
  
  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });
  
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
}

// Register keyboard shortcut for customization overlay
function registerCustomizationShortcut() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+M or Cmd+Shift+M
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'M') {
      e.preventDefault();
      createCustomizationOverlay();
    }
  });
}

function appendStyle(styles) {
  var css = document.createElement("style");
  css.type = "text/css";

  css.appendChild(document.createTextNode(styles));

  document.getElementsByTagName("head")[0].appendChild(css);
}

function onReady() {
  applyMenuPreferences();
  registerCustomizationShortcut();
  setTimeout(createMovementOfGoodsButton, 5000);
}

function onUrlChange() {
  setTimeout(createMovementOfGoodsButton, 5000);
}
window.addEventListener("hashchange", onUrlChange, false);
document.addEventListener("DOMContentLoaded", onReady, false);

function getGoodId(url) {
  const attributeIdentifier = "id=";
  const indexOfId = url.indexOf(attributeIdentifier);
  return url.substring(indexOfId + attributeIdentifier.length);
}

function $(selector) {
  return document.querySelector(selector);
}
function getGoodsData() {
  // https://online.moysklad.ru/app/#turnover?goodIdFilter=3d161263-81e7-11e8-9ff4-3150002dabda,%D0%92%D0%BB%D0%B0%D0%B3%D0%BE%D0%B7%D0%B0%D1%89%D0%B8%D1%82%D0%BD%D1%8B%D0%B9%20%D1%81%D0%BE%D1%81%D1%82%D0%B0%D0%B2%20%22%D0%9F%D0%BE%D0%BB%D0%B8%D1%84%D0%BB%D1%8E%D0%B8%D0%B4%22%20%20%2019%D0%BB.,8855,Good
  const id = getGoodId(window.location.href);
  const name = $(
    ".tutorial-stage-sales-fourth-step > td:nth-child(2) > input:nth-child(1)",
  ).value;
  const nameEncoded = encodeURIComponent(name);
  const code = $(
    ".column > tbody:nth-child(2) > tr:nth-child(1) > td:nth-child(2) > input:nth-child(1)",
  ).value;
  return { id, name, nameEncoded, code };
}

function createUrlForMovementOfGoods(data) {
  const urlParts = [data.id, data.nameEncoded, data.code, "Good"];
  return `https://online.moysklad.ru/app/#turnover?goodIdFilter=${urlParts.join(
    ",",
  )}`;
}

function createNewButton(buttonText) {
  return htmlToElement(
    `<div role="button" class="b-popup-button b-popup-button-enabled b-popup-button-gray" tabindex="0">
      <table><colgroup><col></colgroup>
        <tbody>
          <tr><td></td><td><span class="text">${buttonText}</span></td></tr>
        </tbody>
       </table>
     </div>`,
  );
}

function getEndOfParentForm() {
  return $(
    `${formTable} > tr:last-child`,
  );
}
function htmlToElement(html) {
  var template = document.createElement("template");
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return template.content.firstChild;
}

function redirectTo(url) {
  window.location = url;
}
function createMovementOfGoodsButton() {
  const form = getEndOfParentForm();
  if (form) {
    const button = createNewButton("Движения по товару");
    button.addEventListener(
      "click",
      compose(
        redirectTo,
        createUrlForMovementOfGoods,
        getGoodsData,
      ),
    );
    form.parentElement.append(button);
  }
}
const compose = (...fns) =>
  fns.reduceRight(
    (prevFn, nextFn) => (...args) => nextFn(prevFn(...args)),
    value => value,
  );

// Export for Node.js/Electron context
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getGoodsData,
    htmlToElement,
    createNewButton,
    createUrlForMovementOfGoods,
  };
}

// Export for browser context
if (typeof window !== 'undefined') {
  window.exports = {
    getGoodsData,
    htmlToElement,
    createNewButton,
    createUrlForMovementOfGoods,
  };
}

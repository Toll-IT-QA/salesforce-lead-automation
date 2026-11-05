const { chromium } = require('playwright');
const fs = require('fs');

// ---------------------------------------------------------------------------
// Config: change these (or set env vars) instead of editing the code below.
//   BASE_URL     page the script returns to before each lead
//   CDP_URL      the Chrome you started with --remote-debugging-port=9222
//   PAGE_READY_TIMEOUT  max ms to wait for the "New Lead" button to appear
// ---------------------------------------------------------------------------
const BASE_URL =
  process.env.BASE_URL ||
  'https://tollbros--cvpy.sandbox.lightning.force.com/lightning/page/home';
const CDP_URL = process.env.CDP_URL || 'http://localhost:9222';
const PAGE_READY_TIMEOUT = Number(process.env.PAGE_READY_TIMEOUT || 30000);

const COMMUNITIES = [
  'Cinnamon Ridge',
  'Quilici - Palovista Collection (Quilici - Palovista Collection) - 7807000'
];
const MAX_NAME_ATTEMPTS = 4; // first choice + 3 fallbacks if duplicates are found
const NO_DUPLICATES_TEXT = 'We found no potential duplicates';
const DUPLICATE_CHECK_DEBOUNCE_MS = 1000; // Salesforce checks duplicates after typing stops

// Selectors that depend on your org. Adjust here if something isn't found.
const SELECTORS = {
  newLeadButton: '[aria-label="New Lead"]',
  duplicateMessage: '.messageClass',
  successToast: '.slds-notify_toast.slds-theme_success',
};

// Number of leads to create
const NUM_LEADS_TO_CREATE = 1;

const consumerSegments = ['Segment A', 'Segment B', 'Segment C', 'Segment D'];

// Names from across the world, plus inverted celebrity and historical figure names
const firstNames = [
  // European
  'James', 'William', 'George', 'Oliver', 'Benjamin', 'Lucas', 'Henry', 'Alexander', 'Sofia', 'Emma', 'Olivia', 'Ava', 'Isabella', 'Charlotte',
  // African
  'Kwame', 'Amara', 'Kofi', 'Zainab', 'Aisha', 'Jabari', 'Adeyemi', 'Nia', 'Kamau',
  // Latin American
  'Diego', 'Carlos', 'Miguel', 'Juan', 'Maria', 'Rosa', 'Carmen', 'Elena', 'Roberto', 'Fernando',
  // Asian
  'Raj', 'Arjun', 'Priya', 'Anil', 'Deepak', 'Chen', 'Wei', 'Li', 'Jun', 'Yuki', 'Kenji', 'Hana', 'Akira', 'Sakura',
  // Middle Eastern
  'Ahmed', 'Hassan', 'Omar', 'Ali', 'Fatima', 'Layla', 'Noor', 'Amira', 'Karim',
  // Nordic
  'Lars', 'Johan', 'Erik', 'Soren', 'Bjorn', 'Ingrid', 'Astrid', 'Greta',
  // Eastern European
  'Dimitri', 'Sergei', 'Ivan', 'Natasha', 'Svetlana', 'Andrei', 'Viktor', 'Olga',
  // Mediterranean
  'Marco', 'Giovanni', 'Paolo', 'Francesco', 'Leila', 'Giulia', 'Lucia', 'Cristina',
  // South Asian
  'Ravi', 'Sanjay', 'Vikram', 'Anand', 'Priya', 'Neha', 'Anjali', 'Kavya',
  // East Asian
  'Ming', 'Zhang', 'Liu', 'Yang', 'Wang', 'Lee', 'Park', 'Kim', 'Taro', 'Yuki', 'Hiroshi', 'Emiko',
  // Southeast Asian
  'Somchai', 'Thanh', 'Arjun', 'Budi', 'Putra', 'Siti', 'Noor', 'Ketut',
  // Inverted Celebrity & Historical Figures
  'Einstein', 'Caesar', 'Napoleon', 'Cleopatra', 'Leonardo', 'Michelangelo', 'Galileo', 'Newton', 'Darwin', 'Edison',
  'Tesla', 'Mozart', 'Beethoven', 'Shakespeare', 'Confucius', 'Socrates', 'Aristotle', 'Plato', 'Archimedes', 'Euclid',
  'Curie', 'Pasteur', 'Hawking', 'Feynman', 'Oppenheimer', 'Bohr', 'Schrödinger', 'Heisenberg', 'Dirac', 'Planck',
  'Lincoln', 'Washington', 'Franklin', 'Kennedy', 'Churchill', 'Gandhi', 'Mandela', 'King', 'Jobs', 'Gates',
  'Disney', 'Carnegie', 'Rockefeller', 'Vanderbilt', 'Ford', 'Musk', 'Bezos', 'Buffett', 'Branson', 'Ellison',
  'Hitchcock', 'Spielberg', 'Kubrick', 'Kubrick', 'Scorsese', 'Tarantino', 'Nolan', 'Anderson', 'Sorkin', 'Winslet'
];

const lastNames = [
  // European
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas',
  // African
  'Okonkwo', 'Mensah', 'Osei', 'Abdullahi', 'Kamau', 'Njoroge', 'Hassan', 'Ahmed', 'Diallo', 'Koroma',
  // Latin American
  'González', 'Silva', 'Rodriguez', 'Martinez', 'López', 'García', 'Hernández', 'Pérez', 'Gutierrez', 'Castro',
  // Asian
  'Patel', 'Kumar', 'Singh', 'Sharma', 'Gupta', 'Desai', 'Wang', 'Chen', 'Liu', 'Li', 'Zhang', 'Yang',
  // Middle Eastern
  'Al-Rashid', 'Al-Malik', 'Al-Farsi', 'Abdullah', 'Ibrahim', 'Al-Zahrani', 'Mansouri', 'Khalil',
  // Nordic
  'Andersson', 'Bergstrom', 'Johansson', 'Larsson', 'Holm', 'Lundström', 'Nilsson', 'Svensson',
  // Eastern European
  'Petrov', 'Ivanov', 'Sokolov', 'Lebedev', 'Volkov', 'Orlov', 'Romanov', 'Popov',
  // Mediterranean
  'Rossi', 'Ferrari', 'Bianchi', 'Russo', 'Marino', 'Ricci', 'Ferrara', 'Moretti',
  // South Asian
  'Kapoor', 'Verma', 'Chatterjee', 'Banerjee', 'Rao', 'Iyer', 'Nair', 'Reddy',
  // East Asian
  'Tanaka', 'Suzuki', 'Yamamoto', 'Watanabe', 'Nakamura', 'Park', 'Kim', 'Lee', 'Choi', 'Jung',
  // Southeast Asian
  'Thakur', 'Singh', 'Das', 'Chakra', 'Basu', 'Ghosh', 'Mukherjee', 'Pillai', 'Nambiar', 'Raman',
  // Inverted Celebrity & Historical Figures (first name becomes last)
  'Albert', 'Julius', 'Bonaparte', 'Fitzgerald', 'da Vinci', 'Buonarroti', 'Galilei', 'Isaac', 'Charles', 'Thomas',
  'Nikola', 'Wolfgang', 'Ludwig', 'William', 'Kong', 'Plato', 'Aristotle', 'Plato', 'Archimedes', 'Euclid',
  'Marie', 'Louis', 'Stephen', 'Richard', 'Julius', 'Niels', 'Erwin', 'Werner', 'Paul', 'Max',
  'Abraham', 'George', 'Benjamin', 'John', 'Winston', 'Mohandas', 'Nelson', 'Martin', 'Steve', 'Bill',
  'Walt', 'Andrew', 'John', 'John', 'Henry', 'Elon', 'Jeff', 'Warren', 'Richard', 'Lawrence',
  'Alfred', 'Steven', 'Stanley', 'Stanley', 'Martin', 'Quentin', 'Christopher', 'Paul', 'Aaron', 'Kate'
];

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Keeps the closest plain letter for accented characters (ö -> o, é -> e, ß -> ss)
// and drops anything else that is not a-z, 0-9 or underscore.
const SPECIAL_LETTERS = { 'ß': 'ss', 'æ': 'ae', 'œ': 'oe', 'ø': 'o', 'đ': 'd', 'ð': 'd', 'þ': 'th', 'ł': 'l', 'ı': 'i' };

function cleanEmailPart(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[ßæœøđðþłı]/g, (c) => SPECIAL_LETTERS[c])
    .replace(/[^a-z0-9_]/g, '');
}

function generateRandomLead() {
  const firstName = getRandomItem(firstNames);
  const lastName = getRandomItem(lastNames);
  
  // Email: first_namelast_name@testy.com, with accents and special characters removed
  const email = `${cleanEmailPart(firstName)}_${cleanEmailPart(lastName)}@testy.com`;
  
  // NANP Format: (ABC) DEF-GHIJ
  // ABC = area code (200-999, never 555)
  // DEF = exchange (D must be 2-9, E and F are 0-9)
  // GHIJ = line number (0001-9999, avoid 0000)

  // Generate area code (200-999, avoid 555)
  let areaCode = Math.floor(Math.random() * 800) + 200;
  if (areaCode === 555) areaCode = 556;

  // Generate exchange (NXX format: first digit 2-9, next two digits 0-9)
  const exchangeFirst = Math.floor(Math.random() * 8) + 2; // 2-9
  const exchangeSecond = Math.floor(Math.random() * 10); // 0-9
  const exchangeThird = Math.floor(Math.random() * 10); // 0-9
  const exchange = `${exchangeFirst}${exchangeSecond}${exchangeThird}`;

  // Generate line number (0001-9999, avoid 0000)
  const lineNumber = (Math.floor(Math.random() * 9999) + 1).toString().padStart(4, '0');

  const phone = `(${areaCode}) ${exchange}-${lineNumber}`;
  
  return { firstName, lastName, email, phone };
}

// Picks an option from a Lightning combobox (picklist) by its field label.
async function selectPicklist(page, label, optionName) {
  await page.getByRole('combobox', { name: label }).first().click();
  await page.getByRole('option', { name: optionName, exact: true }).first().click();
}

// Returns the text of visible error messages on the page (inline field errors and error toasts).
async function getErrorMessages(page) {
  const selectors = [
    '.slds-form-element__help.slds-text-color_error',
    '.slds-has-error .slds-form-element__help',
    '.slds-notify_toast.slds-theme_error',
    '.slds-notify_toast.slds-theme_warning',
    '[role="alert"]',
  ];
  const found = new Set();
  for (const sel of selectors) {
    const items = page.locator(sel);
    const count = await items.count().catch(() => 0);
    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      if (!(await item.isVisible().catch(() => false))) continue;
      const text = ((await item.textContent().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
      if (text) found.add(text);
    }
  }
  return [...found];
}

// Rewrites the Personal Email field without special characters. Returns true if the value changed.
async function fixPersonalEmail(page, lead) {
  const emailInput = page.locator('input[placeholder*="site.com"]').first();
  const current = (await emailInput.inputValue().catch(() => '')) || lead.email;
  const at = current.indexOf('@');
  if (at < 1) return false;
  const cleaned = `${cleanEmailPart(current.slice(0, at))}${current.slice(at)}`;
  if (cleaned === current || cleaned.startsWith('@')) return false;
  await emailInput.fill(cleaned);
  await page.waitForTimeout(500);
  lead.email = cleaned;
  console.log(`  ✓ Personal Email changed to ${cleaned}`);
  return true;
}

/**
 * Creates one lead. Generates random names until it finds one with no duplicates.
 * Returns the lead that was created, or null.
 */
async function createLead(page) {
  const firstNameInput = page.locator('input[placeholder="Search by First Name"]').first();
  const lastNameInput = page.locator('input[placeholder="Search by Last Name"]').first();
  await firstNameInput.waitFor();

  // Find a first/last name combo with no duplicates.
  let lead = null;
  for (let attempt = 0; attempt < MAX_NAME_ATTEMPTS; attempt++) {
    const candidate = generateRandomLead();
    await firstNameInput.fill(candidate.firstName);
    await lastNameInput.fill(candidate.lastName);
    await page.waitForTimeout(DUPLICATE_CHECK_DEBOUNCE_MS);

    const noDuplicates = page
      .locator(SELECTORS.duplicateMessage)
      .filter({ hasText: NO_DUPLICATES_TEXT });

    try {
      await noDuplicates.first().waitFor({ state: 'visible', timeout: 8000 });
      console.log(`  ✓ No duplicates for ${candidate.firstName} ${candidate.lastName}`);
      lead = candidate;
      break;
    } catch {
      console.log(`  ✗ Duplicates for ${candidate.firstName} ${candidate.lastName}, retrying...`);
      await firstNameInput.fill('');
      await lastNameInput.fill('');
    }
  }

  if (!lead) {
    console.log('  Could not find a non-duplicate name after retries, skipping this lead');
    await page.keyboard.press('Escape');
    return null;
  }

  await page.getByRole('button', { name: 'Create a new Lead' }).click();
  await page.waitForTimeout(1500);

  // Fill First Name and Last Name on the form
  try {
    await page.getByLabel('First Name').fill(lead.firstName);
    await page.getByLabel('Last Name').fill(lead.lastName);
  } catch {
    console.log('  Could not fill First/Last Name by label, trying by input selector...');
    const inputs = await page.locator('input').all();
    let firstFilled = false;
    for (let input of inputs) {
      const placeholder = await input.getAttribute('placeholder');
      if (placeholder && !firstFilled) {
        await input.fill(lead.firstName);
        firstFilled = true;
      } else if (firstFilled) {
        await input.fill(lead.lastName);
        break;
      }
    }
  }
  await page.waitForTimeout(500);

  // Consumer Segment (random choice from available options)
  try {
    await page.getByRole('combobox', { name: 'Consumer Segment' }).click();
    await page.waitForTimeout(500);
    
    // Get all available options in the dropdown
    const options = await page.getByRole('option').all();
    if (options.length > 0) {
      const randomOption = getRandomItem(options);
      await randomOption.click();
      await page.waitForTimeout(500);
    } else {
      console.log('  No options found in Consumer Segment dropdown');
    }
  } catch {
    console.log('  Could not select Consumer Segment');
  }

  // Personal Email: first_namelast_name@testy.com
  try {
    const personalEmailInput = page.locator('input[placeholder*="site.com"]').first();
    await personalEmailInput.fill(lead.email);
    await page.waitForTimeout(500);
  } catch {
    console.log('  Could not fill Personal Email');
  }

  // Mobile Phone: just fill with the initial phone, validation happens after save
  // This handles the iti (International Telephone Input) component used in Salesforce
  try {
    // Use the unique data-id + type attributes to find the exact phone input (avoid matching hidden duplicates)
    const mobilePhoneInput = page.locator('input[data-id="phoneNumber"][type="tel"]').first();

    console.log(`  Entering initial phone ${lead.phone}...`);
    await mobilePhoneInput.clear();
    await page.waitForTimeout(300);
    await mobilePhoneInput.fill(lead.phone);
    await page.waitForTimeout(500);
    console.log(`  ✓ Phone field filled: ${lead.phone}`);
  } catch (e) {
    console.log(`  ✗ Error with phone field: ${e.message.split('\n')[0]}`);
  }
  await page.waitForTimeout(500);

  // Click the checkmark/save button to save this section
  // IMPORTANT: Avoid clicking the top search button!
  try {
    // Find buttons with SVG but exclude the search button
    const buttons = await page.locator('button').all();
    for (const btn of buttons) {
      const ariaLabel = await btn.getAttribute('aria-label');
      const className = await btn.getAttribute('class');

      // Skip the search button
      if (ariaLabel === 'Search' || (className && className.includes('search-button'))) {
        continue;
      }

      // Look for a button with an SVG (checkmark/save button)
      const svg = btn.locator('svg');
      const svgCount = await svg.count();
      if (svgCount > 0 && ariaLabel !== 'Search') {
        await btn.click();
        await page.waitForTimeout(1000);
        console.log('  ✓ Clicked save button');
        break;
      }
    }
  } catch {
    console.log('  First save button not found, continuing...');
  }

  // Scroll down to see Prospect Communities, Working with an Agent, and other fields
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(1000);

  // Press Escape to ensure no search bar or other element has focus
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // Prospect Communities: click the multi-select combobox
  const selectedCommunity = getRandomItem(COMMUNITIES);
  try {
    console.log('  Searching for Prospect Communities combobox...');

    // For readonly combobox, we need to click the dropdown ICON to open it, not the input
    const commInput = page.locator('input.multi-select-combobox__input[placeholder="Choose a Community of interest"]').first();
    await commInput.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);

    console.log('  Clicking dropdown icon to open combobox...');

    // Find the dropdown icon - it's a sibling element with the down arrow
    // The icon has class "multi-select-combobox__icon" and title "Click to open the dropdown"
    const icon = page.locator('.multi-select-combobox__icon').first();
    await icon.click({ force: true });
    await page.waitForTimeout(1200);

    console.log('  Dropdown opened, now finding Search Options field...');

    // Find the "Search Options" textbox inside the dropdown and type into it
    const searchOptions = page.getByRole('textbox', { name: 'Search Options' });
    await searchOptions.fill(selectedCommunity);
    await page.waitForTimeout(800);

    console.log(`  Clicking the ${selectedCommunity} option from the list...`);

    // Click the matching option from the filtered results (handle both short and full names)
    const communityPattern = selectedCommunity.includes('Quilici') ? /Quilici/i : /Cinnamon Ridge/i;
    await page.getByRole('option', { name: communityPattern }).first().click();
    await page.waitForTimeout(500);
    console.log(`  ✓ Selected ${selectedCommunity}`);
  } catch (e) {
    console.log(`  ✗ Could not select ${selectedCommunity}: ${e.message.split('\n')[0]}`);
  }

  // After selecting a community, a form appears - need to select "Walk-in" from the Select dropdown
  try {
    console.log('  Handling Select dropdown for Walk-in...');

    // First, click the Select dropdown to open the menu (it might show "Fut..." or "Wal...")
    // Find the button showing "Fut..." or "Wal..." but avoid the search button
    const selectButton = page.locator('button').filter({ hasText: /Fut|Wal/ });
    const buttons = await selectButton.all();
    let clicked = false;

    for (const btn of buttons) {
      const ariaLabel = await btn.getAttribute('aria-label');
      const className = await btn.getAttribute('class');

      // Skip the search button explicitly
      if (ariaLabel === 'Search' || (className && className.includes('search-button'))) {
        continue;
      }

      // This should be the Select dropdown
      await btn.click();
      clicked = true;
      break;
    }

    if (!clicked) {
      console.log('  ⚠ Could not find Select button, skipping Walk-in...');
    }
    await page.waitForTimeout(1000);

    // Now the dropdown menu should be open, look for Walk-in option and click it
    // It could be in role="option", or just as a menu item
    try {
      // Try to find by role="option" first
      await page.getByRole('option', { name: /Walk.?in/i }).first().click();
      console.log('  ✓ Selected Walk-in from option');
    } catch {
      try {
        // If not found as option, try finding any element with Walk-in text that's visible
        await page.locator('span, li, div').filter({ hasText: /^Walk.?in$/i }).first().click();
        console.log('  ✓ Selected Walk-in from visible element');
      } catch {
        // Last resort: use keyboard to navigate
        console.log('  Using keyboard navigation for Walk-in...');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        console.log('  ✓ Selected with keyboard');
      }
    }

    await page.waitForTimeout(500);
  } catch (e) {
    console.log(`  ✗ Issue with Walk-in selection: ${e.message.split('\n')[0]}`);
  }

  // Working with an Agent? dropdown - always choose No
  try {
    console.log('  Clicking "Working with an Agent?" dropdown...');

    // Use getByRole which is very specific to combobox role
    const agentCombo = page.getByRole('combobox', { name: 'Working with an Agent?' });
    await agentCombo.click();
    await page.waitForTimeout(800);

    console.log('  Selecting "No" option...');

    // Try multiple approaches to select "No"
    try {
      await page.getByRole('option', { name: /^No$/i }).first().click({ timeout: 3000 });
      console.log('  ✓ Selected No');
    } catch {
      // Fallback: keyboard navigation
      console.log('  Using keyboard for No selection...');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      console.log('  ✓ Selected No (keyboard)');
    }

    await page.waitForTimeout(500);
  } catch (e) {
    console.log(`  ⚠ Working with an Agent? selection: ${e.message.split('\n')[0]}`);
  }

  // Click the blue "Save" button at the bottom with RETRY LOGIC for phone validation
  // If phone validation fails after save, we'll clear it and try a new number
  let saveSuccess = false;
  let saveAttempts = 0;
  const maxSaveAttempts = 15;

  while (!saveSuccess && saveAttempts < maxSaveAttempts) {
    try {
      console.log(`  Save Attempt ${saveAttempts + 1}/${maxSaveAttempts}: Clicking Save button...`);

      const saveButtons = await page.getByRole('button', { name: /^Save$/i }).all();
      console.log(`  Found ${saveButtons.length} Save button(s)`);

      if (saveButtons.length > 0) {
        // Use the last (bottom) Save button
        const bottomSave = saveButtons[saveButtons.length - 1];

        // Scroll to ensure it's visible
        await bottomSave.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);

        await bottomSave.click();
        await page.waitForTimeout(2500);

        // **POST-SAVE VALIDATION**: Check if errors appeared after clicking save
        try {
          console.log('  Checking for errors after save...');

          // Read any error messages Salesforce shows after Save (inline field errors and toasts)
          const errorMessages = await getErrorMessages(page);
          if (errorMessages.length > 0) {
            console.log(`  Error messages after save: ${errorMessages.join(' | ')}`);
          }

          // Salesforce rejected the email: remove the special characters and save again
          if (errorMessages.some((m) => /email/i.test(m) && /invalid/i.test(m))) {
            const fixed = await fixPersonalEmail(page, lead);
            if (fixed && saveAttempts < maxSaveAttempts - 1) {
              console.log('  🔄 Retrying save with the corrected email...');
              saveAttempts++;
              continue;
            }
            console.log('  ✗ Email could not be fixed automatically, skipping this lead');
            await page.screenshot({ path: `screenshots/save-error-${lead.firstName}-${lead.lastName}.png` }).catch(() => {});
            return null;
          }

          // Look for inputs with error class (most reliable indicator)
          const errorInputs = await page.locator('input.slds-has-error, textarea.slds-has-error, select.slds-has-error').all();
          const errorCount = await page.locator('input.slds-has-error, textarea.slds-has-error, select.slds-has-error').count();

          if (errorCount > 0) {
            console.log(`  ✗ POST-SAVE ERROR: ${errorCount} field(s) have validation errors`);

            // Check if the phone field specifically has an error
            const phoneInputError = await page.locator('input[data-id="phoneNumber"].slds-has-error').count();

            if (phoneInputError > 0) {
              console.log(`  ✗ Phone field has validation error`);

              if (saveAttempts < maxSaveAttempts - 1) {
                console.log(`  🔄 Retrying with a new phone number...`);

                // Scroll back up to phone field
                await page.evaluate(() => window.scrollBy(0, -500));
                await page.waitForTimeout(800);

                // Generate new phone number
                const newPhone = generateRandomLead().phone;
                console.log(`  📱 New phone number: ${newPhone}`);

                // Clear and refill the phone field
                const mobilePhoneInput = page.locator('input[data-id="phoneNumber"][type="tel"]').first();
                await mobilePhoneInput.clear();
                await page.waitForTimeout(300);
                await mobilePhoneInput.fill(newPhone);
                await page.waitForTimeout(500);

                // Scroll back down to save button
                await page.evaluate(() => window.scrollBy(0, 500));
                await page.waitForTimeout(800);

                saveAttempts++;
                continue; // Try save again with new phone
              } else {
                console.log(`  ✗ Max save attempts reached, giving up`);
                await page.screenshot({ path: `screenshots/save-error-${lead.firstName}-${lead.lastName}.png` });
                return null;
              }
            } else {
              // Other field has error (not phone), can't retry - skip this lead
              console.log(`  ✗ Non-phone field(s) have validation errors, skipping this lead`);
              await page.screenshot({ path: `screenshots/save-error-${lead.firstName}-${lead.lastName}.png` });
              return null;
            }
          } else {
            // Success - no errors!
            console.log('  ✓ No validation errors - Lead saved successfully!');
            saveSuccess = true;
          }
        } catch (e) {
          console.log(`  Error checking post-save state: ${e.message.split('\n')[0]}`);
        }
      }
    } catch (e) {
      console.log(`  ✗ Error during save attempt: ${e.message.split('\n')[0]}`);
    }
  }

  if (!saveSuccess) {
    console.log(`  ✗ Could not save lead after ${maxSaveAttempts} attempts`);
    return null;
  }

  return lead;
}

async function runLeadCreation() {
  // Attach to the Chrome you already started and logged in to (Option A).
  let browser;
  try {
    browser = await chromium.connectOverCDP(CDP_URL);
  } catch {
    console.error(
      `Could not connect to Chrome at ${CDP_URL}.\n` +
        'Start Chrome with --remote-debugging-port=9222 and a dedicated --user-data-dir, ' +
        'log in to the sandbox, then run this script again.'
    );
    process.exit(1);
  }
  const context = browser.contexts()[0];
  // Reuse your open Salesforce tab if there is one, otherwise open a new tab.
  const page =
    context.pages().find((p) => p.url().includes('lightning.force.com')) ??
    (await context.newPage());
  fs.mkdirSync('screenshots', { recursive: true });

  const total = NUM_LEADS_TO_CREATE;
  let created = 0;
  const failed = [];

  try {
    await page.goto(BASE_URL);

    console.log(`Opened ${page.url()}`);

    // Click on the Leads chevron (dropdown arrow) to reveal the New Lead button
    const leadsChevron = page.locator('svg[data-key="chevrondown"]').first();
    try {
      await leadsChevron.waitFor({ timeout: 10000 });
      console.log('Clicking Leads chevron...');
      await leadsChevron.click();
      await page.waitForTimeout(1000);
    } catch {
      console.log('Leads chevron not found, proceeding anyway...');
    }

    // Now click the "New Lead" option from the dropdown menu
    try {
      const newLeadOption = page.locator('span:has-text("New Lead")').first();
      await newLeadOption.waitFor({ timeout: PAGE_READY_TIMEOUT });
      console.log('Found New Lead option, clicking it to open the form...');
      await newLeadOption.click();
      await page.waitForTimeout(2000);
    } catch {
      await page.screenshot({ path: 'screenshots/start-page.png', fullPage: true });
      throw new Error(
        `"New Lead" option not found in the dropdown. ` +
          'Check that you are logged in and on the Leads page ' +
          '(see screenshots/start-page.png, or run dump-dom.js).'
      );
    }

    for (let i = 1; i <= total; i++) {
      console.log(`\n--- Creating Lead ${i} of ${total} ---`);
      try {
        const lead = await createLead(page);
        if (lead) {
          created++;
          console.log(`✓ Lead ${i} created: ${lead.firstName} ${lead.lastName}`);
        } else {
          failed.push(i);
        }
      } catch (error) {
        failed.push(i);
        console.error(`✗ Lead ${i} failed: ${error.message.split('\n')[0]}`);
        await page.screenshot({ path: `screenshots/lead-${i}-error.png`, fullPage: true });
      }

      // Reset to a clean list view for the next lead (also closes any stuck modal)
      if (i < total) {
        await page.goto(BASE_URL);
        await page.waitForTimeout(2000);
        
        // Click Leads chevron and New Lead again for the next iteration
        const leadsChevron2 = page.locator('svg[data-key="chevrondown"]').first();
        await leadsChevron2.waitFor({ timeout: 10000 });
        await leadsChevron2.click();
        await page.waitForTimeout(1000);
        
        const newLeadOption2 = page.locator('span:has-text("New Lead")').first();
        await newLeadOption2.waitFor({ timeout: 10000 });
        await newLeadOption2.click();
        await page.waitForTimeout(2000);
      }
    }

    console.log(`\nDone: ${created} of ${total} leads created.`);
    if (failed.length) {
      console.log(`Failed/skipped lead numbers: ${failed.join(', ')} (see ./screenshots for errors)`);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    await page.screenshot({ path: 'screenshots/fatal-error.png', fullPage: true }).catch(() => {});
  } finally {
    // For a CDP connection this only disconnects; your Chrome window stays open.
    await browser.close();
  }
}

runLeadCreation();

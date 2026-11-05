# Salesforce Lead Creation Automation

Fully automated Playwright script for creating Salesforce leads with realistic random data. Designed for the Toll Brothers sandbox environment with robust error handling, duplicate detection, and intelligent phone number validation with automatic retry.

## ✨ Features

- **Automated Lead Creation**: Creates multiple leads with randomly generated names, emails, and phone numbers
- **Duplicate Detection**: Automatically checks for duplicate records and retries with different names
- **Smart Phone Validation**: 
  - Generates valid North American Numbering Plan phone numbers
  - Validates during save (when Salesforce actually validates)
  - **Automatic retry with new phone numbers** if validation fails after save
  - Intelligently regenerates and refills phone field up to 5 times
  - Scrolls intelligently to adjust phone field and retry save
- **Prospect Communities**: Randomly selects from available communities (Cinnamon Ridge, Quilici - Palovista Collection)
- **Smart Form Automation**:
  - Fills Consumer Segment with random selection
  - Enters Personal Email in format `firstname_lastname@testy.com`
  - Selects "Walk-in" for interaction type
  - Sets "Working with an Agent?" to "No"
- **Search Bar Protection**: Explicitly avoids clicking the global search bar
- **Error Handling**: Comprehensive retry logic with detailed logging
- **Screenshot Capture**: Saves page snapshots on errors for debugging

## 📋 Prerequisites

- Node.js 14+ with npm
- Playwright installed (`npm install playwright`)
- Google Chrome/Chromium with remote debugging enabled
- Access to Toll Brothers Salesforce sandbox at `https://tollbros--cvpy.sandbox.lightning.force.com`
- Valid Salesforce sandbox credentials

## 🚀 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd salesforce-lead-automation
```

2. Install dependencies:
```bash
npm install playwright
```

3. Verify Chrome/Chromium is installed on your system

## ⚙️ Setup

### Step 1: Start Chrome with Remote Debugging

Start Chrome with remote debugging enabled before running the script:

**Windows:**
```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir=C:\temp\chrome-debug
```

**macOS:**
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug
```

**Linux:**
```bash
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug
```

### Step 2: Log In to Salesforce

1. Chrome will open to the home page
2. Use this link for the SSO: `https://oktaportal.tollbrothersinc.com/enduser/app-settings/auc1cvrr8abKnErqx2p8`
3. Navigate to the sandbox URL: `https://tollbros--cvpy.sandbox.lightning.force.com`
4. Log in with your Toll Brothers sandbox credentials
5. **Keep the browser open** while the script runs

### Step 3: Configure the Script

Edit `create-leads.js` to customize:

```javascript
// Number of leads to create per run
const NUM_LEADS_TO_CREATE = 1;

// Change if your Salesforce URL differs
const BASE_URL = 'https://tollbros--cvpy.sandbox.lightning.force.com/lightning/page/home';

// Chrome remote debugging port (must match --remote-debugging-port above)
const CDP_URL = 'http://localhost:9222';

// Maximum wait time for page elements
const PAGE_READY_TIMEOUT = 30000;
```

## 🏃 Usage

Run the script:

```bash
node create-leads.js
```

### Output Example - Successful Lead

```
Opened https://tollbros--cvpy.sandbox.lightning.force.com/lightning/page/home
Clicking Leads chevron...
Found New Lead option, clicking it to open the form...

--- Creating Lead 1 of 1 ---
  ✓ No duplicates for Yuki Chakra
  Entering initial phone (538) 701-3051...
  ✓ Phone field filled: (538) 701-3051
  Searching for Prospect Communities combobox...
  Clicking dropdown icon to open combobox...
  Dropdown opened, now finding Search Options field...
  Clicking the Cinnamon Ridge option from the list...
  ✓ Selected Cinnamon Ridge
  Handling Select dropdown for Walk-in...
  ✓ Selected Walk-in from option
  Clicking "Working with an Agent?" dropdown...
  Selecting "No" option...
  ✓ Selected No
  Clicking final Save button...
  Found 2 Save button(s)
  Save Attempt 1/5: Clicking Save button...
  Checking for errors after save...
  ✓ No validation errors - Lead saved successfully!
✓ Lead 1 created: Yuki Chakra

Done: 1 of 1 leads created.
```

### Output Example - With Phone Retry

```
--- Creating Lead 1 of 1 ---
  ✓ No duplicates for Ava Orlov
  Entering initial phone (968) 512-2689...
  ✓ Phone field filled: (968) 512-2689
  [... other field selections ...]
  Clicking final Save button...
  Found 2 Save button(s)
  Save Attempt 1/5: Clicking Save button...
  Checking for errors after save...
  ✗ POST-SAVE ERROR: 1 field(s) have validation errors
  ✗ Phone field has validation error
  🔄 Retrying with a new phone number...
  📱 New phone number: (432) 678-1234
  Save Attempt 2/5: Clicking Save button...
  Checking for errors after save...
  ✓ No validation errors - Lead saved successfully!
✓ Lead 1 created: Ava Orlov

Done: 1 of 1 leads created.
```

## 📱 Phone Number Validation

The script implements intelligent phone validation with automatic retry:

### Generation
- **Format**: `(ABC) DEF-GHIJ` (NANP compliant)
- **Area Code (ABC)**: 200-999, excluding 555
- **Exchange (DEF)**: First digit 2-9, remaining 0-9
- **Line Number (GHIJ)**: 0001-9999

### Validation Flow (NEW in v1.2)

1. **Phone is filled** with the initial generated number
2. **Form is completed** with all other fields (Prospect Communities, Walk-in, Agent preference)
3. **Save button is clicked** - Salesforce validates the phone at this point
4. **Post-save check** - Script detects if phone field has validation error
   - ✅ **No error** → Lead saved successfully!
   - ❌ **Phone field has error** → Retry loop begins:
     - Scroll back up to phone field
     - Generate a new random phone number
     - Clear the invalid phone field
     - Fill with the new phone number
     - Scroll back down
     - Click save again
5. **Retry up to 5 times** - If phone keeps failing, skip the lead after 5 attempts

### Why This Approach?

- **Accurate validation**: Salesforce doesn't validate phone until you try to save
- **Avoids false positives**: No pre-save checks that might block valid numbers
- **Automatic recovery**: Invalid phones are transparently retried with new numbers
- **User transparency**: Console output shows exactly when/why retries happen

### Example Valid Numbers
- `(234) 567-8901`
- `(538) 701-3051`
- `(999) 234-5678`

## 👥 Lead Data Generated

Each lead includes:

| Field | Format | Example |
|-------|--------|---------|
| First Name | Global name pool | Yuki |
| Last Name | Global name pool | Chakra |
| Personal Email | `firstname_lastname@testy.com` | yuki_chakra@testy.com |
| Mobile Phone | NANP format, validated | (538) 701-3051 |
| Consumer Segment | Random from available | Young Families |
| Prospect Communities | Randomly selected | Cinnamon Ridge OR Quilici - Palovista Collection |
| Interaction Type | Always selected | Walk-in |
| Working with Agent? | Always selected | No |

### Name Generation Diversity
The script uses a diverse pool of first and last names from:
- European, African, Latin American, Asian
- Middle Eastern, Nordic, Eastern European
- Mediterranean, South Asian, Southeast Asian
- Historical figures and celebrities (inverted names)

This ensures realistic, varied test data.

## 🐛 Troubleshooting

### "Could not connect to Chrome"
- ✓ Ensure Chrome is running with `--remote-debugging-port=9222`
- ✓ Verify port in script matches (default: 9222)
- ✓ Check that Chrome window is open and responsive

### "New Lead option not found"
- ✓ Verify you're logged into the Salesforce sandbox
- ✓ Confirm you're on the Home Sales page
- ✓ Check that you have permission to create leads

### Phone validation keeps failing after 5 retries
- ✓ Script automatically retries up to 5 times with different phone numbers
- ✓ If all attempts fail, check Salesforce's phone format requirements
- ✓ Verify the phone field validation rules haven't changed
- ✓ Check console for the exact error message details
- ✓ See `screenshots/save-error-{name}.png` for visual debugging

### Clicks search bar instead of form fields
- ✓ Script now explicitly avoids search button
- ✓ Uses specific aria-labels and class selectors
- ✓ Checks `aria-label="Search"` and `search-button` class

### Screenshots not being saved
- ✓ Create `screenshots/` directory: `mkdir screenshots`
- ✓ Verify write permissions in current directory
- ✓ Error screenshots saved to `screenshots/save-error-{name}.png`

## 🛡️ Safety Features

✅ **Search Bar Protection**: Never clicks the global search button
✅ **Duplicate Checking**: Validates names before lead creation
✅ **Phone Validation**: Detects invalid numbers AFTER save and automatically retries
✅ **Smart Retry Logic**: Adjusts only the phone field and retries save up to 5 times
✅ **Error Logging**: Detailed console output showing retry attempts
✅ **Screenshot Capture**: Saves page state on errors for debugging
✅ **Graceful Failures**: Continues or retries on most errors
✅ **Session Management**: Properly closes browser connection

## ⚙️ Environment Variables

Override defaults with environment variables:

```bash
# Create 5 leads
NUM_LEADS_TO_CREATE=5 node create-leads.js

# Use different Salesforce URL
BASE_URL=https://your-org.sandbox.lightning.force.com node create-leads.js

# Use different Chrome debugging port
CDP_URL=http://localhost:9333 node create-leads.js
```

## 📝 Configuration Options

Key settings in `create-leads.js`:

```javascript
const NUM_LEADS_TO_CREATE = 1;                    // Leads to create per run
const MAX_NAME_ATTEMPTS = 4;                      // Retry attempts for duplicates
const DUPLICATE_CHECK_DEBOUNCE_MS = 1000;        // Wait for Salesforce validation
const maxSaveAttempts = 5;                        // Retry attempts for phone validation after save
const PAGE_READY_TIMEOUT = 30000;                 // Max wait for page elements

// Communities pool - add or remove to customize which communities are selected
const COMMUNITIES = [
  'Cinnamon Ridge',
  'Quilici - Palovista Collection (Quilici - Palovista Collection) - 7807000'
];
```

### Customizing Communities

To change which communities the script can select from, edit the `COMMUNITIES` array in `create-leads.js`:

```javascript
// Example: Only use Cinnamon Ridge
const COMMUNITIES = ['Cinnamon Ridge'];

// Example: Add a third community
const COMMUNITIES = [
  'Cinnamon Ridge',
  'Quilici - Palovista Collection (Quilici - Palovista Collection) - 7807000',
  'Your Community Name'
];
```

Each time a lead is created, the script randomly selects one community from this list.

## ✅ What the Script Does (Step-by-Step)

1. **Connect** to Chrome via CDP
2. **Navigate** to Salesforce sandbox
3. **Open** New Lead form
4. **Validate** first/last name for duplicates (retry if found)
5. **Create** lead with validated name
6. **Fill** first and last name
7. **Select** random Consumer Segment
8. **Enter** Personal Email
9. **Generate & fill** phone number (no pre-validation)
10. **Select** random community from Prospect Communities (Cinnamon Ridge or Quilici - Palovista Collection)
11. **Select** Walk-in as interaction type
12. **Select** "No" for "Working with an Agent?"
13. **Click Save button** - Salesforce validates all fields including phone
14. **Check for post-save errors**:
    - ✅ If no errors → Lead saved successfully!
    - ❌ If phone field has error → Retry (up to 5 times):
      - Scroll to phone field
      - Generate new phone number
      - Clear and refill phone field
      - Scroll back down
      - Try save again
    - ❌ If other field error → Skip lead (can't auto-retry other fields)
15. **Log** result and move to next lead

## ❌ What the Script Does NOT Do

- Create related records (Opportunities, Contacts)
- Assign leads to users or teams
- Support international phone numbers
- Modify existing leads
- Delete leads

## 🚀 Performance

- **Lead creation time**: ~30-45 seconds per lead (without retries)
- **With phone retry**: +15-20 seconds per retry attempt
- **Phone validation**: Automatic retry up to 5 times
- **Duplicate checking**: ~2-3 seconds per name attempt
- **Sequential processing**: One lead at a time

## 📚 Limitations

- Requires Chrome with remote debugging enabled
- Only works with Toll Brothers sandbox configuration
- US-based phone numbers only
- Sequential processing (not parallel)
- Requires manual Salesforce login first

## 🔮 Future Enhancements

- [ ] Parallel lead creation for faster processing
- [ ] Support for international phone formats
- [ ] Configurable field mappings for different orgs
- [ ] Bulk lead import from CSV
- [ ] Lead assignment to users/teams
- [ ] Custom field population
- [ ] Configuration file support
- [ ] Webhook notifications on completion

## 📄 License

This project is provided as-is for internal Toll Brothers use.

## 💬 Support & Feedback

For issues or improvements:
1. Check the **Troubleshooting** section above
2. Review **console output** and **screenshots/** directory
3. Verify Chrome is running with correct debugging port
4. Confirm Salesforce credentials are valid
5. Check that form fields match expected selectors

## 📖 Version History

### v1.3 (Latest - October 30, 2026)
- ✅ **NEW: Multiple community selection** - Randomly selects between Cinnamon Ridge and Quilici - Palovista Collection
- ✅ Enhanced community selection logic with dynamic regex pattern matching
- ✅ Same Walk-in and form flow works for all communities
- ✅ Improved console logging to show selected community

### v1.2
- ✅ **NEW: Post-save phone retry loop** - Automatically retries with new phone numbers if validation fails
- ✅ Removed pre-save phone validation (Salesforce doesn't validate until save)
- ✅ Simplified phone fill (no strict pre-validation)
- ✅ Intelligent scroll-and-retry for phone field adjustments
- ✅ Enhanced console output showing retry attempts with emoji indicators
- ✅ Improved error detection post-save

### v1.1
- ✅ Fixed phone validation error detection
- ✅ Added search bar protection
- ✅ Improved error message handling
- ✅ Enhanced console logging
- ✅ Added retry logic for phone validation

### v1.0
- Initial release
- Basic lead creation automation
- Duplicate checking
- Phone validation

---

**Last Updated**: October 30, 2026  
**Status**: Production Ready  
**Tested On**: Toll Brothers Sandbox CVPY  
**Author**: Automation Team

---

## 🎯 Quick Start Checklist

- [ ] Chrome started with `--remote-debugging-port=9222`
- [ ] Logged into Salesforce sandbox
- [ ] Playwright installed (`npm install playwright`)
- [ ] `NUM_LEADS_TO_CREATE` set to desired number
- [ ] Run: `node create-leads.js`
- [ ] Monitor console for progress (watch for "Save Attempt" and retry messages)
- [ ] Check `screenshots/` for any errors

---

## 💡 Key Insights

**Why does the script wait to validate phone?**
- Salesforce's phone validation happens when you click Save, not while typing
- Pre-save validation would be inaccurate and cause false positives
- The new post-save retry approach catches real validation errors only

**What happens when a phone number fails?**
- Script detects the `slds-has-error` class on the phone input field
- Automatically generates a completely new NANP-compliant phone number
- Refills the phone field and retries the save (up to 5 times total)
- All other fields remain intact - only phone is adjusted

**Can I see when retries are happening?**
- Yes! Console shows detailed output:
  - `✗ Phone field has validation error` - Error detected
  - `🔄 Retrying with a new phone number...` - Starting retry
  - `📱 New phone number: (###) ###-####` - New number generated
  - `Save Attempt N/5:` - Showing which attempt this is

**Which community will be selected?**
- The script randomly picks one community from the `COMMUNITIES` array each time
- Console output shows which community was selected: `Clicking the {selectedCommunity} option from the list...`
- You can customize the pool of communities by editing the `COMMUNITIES` array in the script
- All communities go through the same Walk-in and form-filling process

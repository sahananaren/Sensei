# Sensei - Habit Tracking App MVP Plan

## UI Development Plan

### 1. AUTH & ONBOARDING FLOW

**Sign In / Sign Up**
- Email & Password fields
- Continue with Google (optional)

**On first signup →**
- **Upgrade Prompt Page:**
  - Try Pro for 15 Days (highlight: 4 Visions, Productivity Analytics)
  - Or: "Continue with Free Plan"

---

### 2. TAB NAVIGATION

**Tabs:**
- **Today** (Home, default tab)
- **Mastery** (Vision dashboards)
- **Productivity** (Analytics – Pro only)
- **Profile** (Plan, settings)

---

### 🗓️ TODAY TAB

**Header:**
- Title: "Time to Focus"
- Subtitle: "Pick a habit to focus on"
- Top-right: ➕ Add Menu
  - → Add Vision (Triggers Vision Creation Flow)
  - → Add Habit (Inline form with Vision dropdown)

**Body:**
- **If visions exist:**
  - Sections grouped by vision
  - Each shows Habit Card:
    - Streak circle
    - Habit name
    - Time today
    - Tap → Start Focus Session

- **If no visions:**
  - Centered CTA: "Create your First Vision"

---

### 🔁 VISION CREATION FLOW

# ✅ Screen 1: Define Vision

### Title:
**Create Your Vision**

### Fields:
- **Vision Name**  
  - Label: “What do you want to gain mastery over?”  
  - Placeholder: *Public Speaking...*

- **Vision Description**  
  - Label: “Describe it in a few words”  
  - Placeholder: *I want to confidently speak in conferences and social media platforms...*  
  - Style: Italic gray placeholder text

### UI Elements:
- 3-step progress dots: ●○○ (first one filled)
- **Next** button (bottom-right corner)  
  - Active **only** when both fields are filled

- **close icon button (top-right corner)  
  - Triggers exit warning modal if form is not empty

### Exit Warning Modal:
- **Title:** “Your progress will be lost”
- **Options:** Cancel / Exit


# ✅ Screen 2: Add Milestones

### Title:
**Add Milestones**

### Prompt:
*When do you know you’ve made progress?*

### Fields:
- Text input 1  
  - Placeholder: *First Speech on Toastmasters…*

- When filled, show another input  
  - Placeholder: *Another milestone...*

- Allow up to a reasonable max (e.g. **5 milestones**)

### UI Elements:
- Progress dots: ●●○
- **Next / Skip** button  
  - If **at least one milestone** is filled → **Next** (Active)  
  - If **none** filled → **Skip** (Active)

- close icon (top-right, same exit logic as above)


# ✅ Screen 3: Add Habits

### Title:
**Add Habits**

### Prompt:
*How will you achieve this vision?*

### Fields:
- Text input 1  
  - Placeholder: *1 Practice Speech a Week...*

- When filled, show another input  
  - Placeholder: *Another habit...*

- Allow up to **3 habits max**

### UI Elements:
- Progress dots: ●●●
- **Create Vision** button  
  - Active only when **at least one habit** is filled

-  close icon (top-right, same exit logic)


# ✅ Pop-up: Congrats

### Pop-up Duration:
- Auto-dismiss after **5 seconds**
- Option to manually dismiss via top-right close icon

### Content:
- **Bold message:**  
  *Congrats on creating your new vision ‘Insert vision Name’*

### Styling:
- Centered text
- Minimalist, celebratory but clean
- Simple animation (fade in/out)


---

### 🧘 DAILY FOCUS FLOW

## ✅ Screen 1: Set an Intention

**Title:**  
Set intention for this session

**Subtitle:**  
Set an intention to stay focused

**Input Box:**  
- Multiline input  
- Placeholder:  
  `I will write the first draft for my speech in 500 words`

**Buttons (Bottom):**  
- `Set Intention` (Primary) — Active only when input is filled  
- `Skip Intention` (Secondary) — Always active  

**Close Icon (Top-right):**  
- On click: Show confirmation modal  
  - Message: “Your progress will be lost. Are you sure?”  
  - Options: `Cancel` | `Close`


## ⏱️ Screen 2: Focus Timer

**Title:**  
Start Focusing

**Center Timer UI:**  
- Large visual circle  
- Timer below — Counts upward (mm:ss)  
- Starts automatically when screen loads

**Buttons (Bottom):**  
- `Save Session` (Primary) — Active after 10 seconds  
- `Skip Timer` (Secondary) — Always active  

**Close Icon (Top-right):**  
- On click: Show confirmation modal  
  - Message: “Your progress will be lost. Are you sure?”  
  - Options: `Cancel` | `Close`


## 📝 Screen 3: Complete Session

**Pre-filled Time Spent:**  
- Read-only input with session time (e.g., `17:45 mins`)

**Input Fields:**  
- **What did you accomplish today?**  
  - Multiline input  
  - Placeholder:  
    `I completed the first draft  
    Shot a video of me speaking it  
    Noted down places that need changing for draft 2`

- **Major Wins (Optional):**  
  - Placeholder: `Anything for your wall of fame?`

- **Milestones Contributed To (Optional):**  
  - Checkbox list from selected Vision’s milestones  
  - Multiple selection allowed

**Button:**  
- `Complete Session` (Primary) — Active when:  
  - Time Spent is filled (auto)  
  - Accomplishment input is filled

**Close Icon (Top-right):**  
- On click: Show confirmation modal  
  - Message: “Your progress will be lost. Are you sure?”  
  - Options: `Cancel` | `Close`


## 🔁 Common Daily Flow Features

**Error Handling:**  
- If user tries to exit mid-way on any screen:  
  - Show confirmation modal:  
    - Message: `Your progress will be lost. Are you sure you want to exit?`  
    - Options: `Cancel` | `Close`

## 🧠 Data Handling MVP Notes

- Track **streak per habit** → update if session completed today  
- Track **total minutes completed per habit** → reset daily  
- Store the following session data:  
  - `intention`  
  - `session length`  
  - `accomplishment`  
  - `major win`  
  - `milestones contributed to`

---

### 🧠 MASTERY TAB


## 🔝 1. Vision Header Section

**✅ Quote-style Description**  
Displayed at the top of the Mastery tab, above the stats.

_Shown like a quote or mission statement:_  
> “Become someone who never misses a workout again.”

**✏️ Editable**  
When user taps/clicks on it, allow inline editing.

**Placeholder if empty:**  
> “Write a motivating description for your Vision...”


## 📈 2. Mastery Summary Stats

**🕒 Title**  
`<# of hours> in <# of months>`

- **Hours**: Sum of all time logged across habits in this Vision.  
- **Months**:
  - If `< 60 days`: show as `x days`  
  - If `≥ 60 days`: show rounded to nearest 0.5 month (e.g., `2.5 months`, `3 months`, etc.)

**📆 Subtitle**  
`That's <x> full days!`  
- x = total hours / 24, rounded to nearest integer


## 📊 3. Stats Cards

Display three summary cards:

- **Engaged Days**:  
  `x out of y days`  
  - x = number of days user did any habit under this Vision  
  - y = total number of days in the date range

- **Daily Average (mins)**:  
  `Total minutes spent / total number of days`

- **Current Streak**:  
  `Number of consecutive days of engagement`


## 🪜 4. Milestones Section

**🧩 Accordion Container**  
- Titled: `Milestones (x/y completed)`
- Open by default
- Can be collapsed/expanded

**🛠 Editable**  
Allow users to:
- ✅ Add new milestones  
- 📝 Edit text of existing milestones  
- ❌ Remove milestones

**🌈 Visual Status States**  
Use color & styling to show progress:
- **Completed**: filled + bright color  
- **In Progress**: partially filled + faded color  
- **Not Started**: outlined only, no fill

> ⚠️ There’s no cap on how many milestones can be created.


## 📅 5. Calendar Heatmap

**🔍 Functionality**  
- Default view: current month  
- Navigation arrows for past/future months  
- Heat intensity = minutes logged each day

**🎚 Filter Dropdown**  
- Default: `All Habits`  
- Options: Each individual habit under this Vision


## 🏆 6. Wall of Fame

**🎖 Layout**  
_Title in italics_: `Wall of Fame`

Displays:
- Achievement title
- Date

**📂 Filtering**  
Dynamically filtered by the same filter as Calendar:
- Habit-specific or all habits


---

### 📊 PRODUCTIVITY TAB (Pro Only)

# Productivity

## 📍 Heading

**Text:** "<x> mastery hours in <y> months"  
- `x` = total hours spent across all habits (auto-calculated from logs)  
- `y` = number of months since account creation or first log  

---

## 📊 Stats Snapshot

**Active Days:**  
- `X` = number of unique days the user has logged activity  
- `Y` = number of days since joining  
- Format: “X active days out of Y”

**Daily Average:**  
- Calculated average in minutes per day over total active period  

---

## 🔥 Vision Cards

**Ranking Logic:**  
- Rank visions by number of active days (descending)  

**Card Info:**  
- Rank (1st, 2nd, etc.)  
- Vision Name  
- Total Active Days  
- View CTA → Navigates to that vision’s Mastery Page  

---

## 📈 Productivity Graph

**Type:**  
- Stacked bar chart (one bar per day of the current week)  

**X-axis:**  
- Days of the current week (Mon–Sun)  

**Y-axis:**  
- Total time (mins or hrs)  

**Stack Colors:**  
- One color per habit  

**Legend:**  
- Maps each color to its habit name  
- Includes checkboxes to toggle visibility per habit *(optional in V2)*  

---

## 🗓️ Productivity Summary (Daily Logs Viewer)

**Scrollable Week Bar:**  
- Horizontal list of date numbers (Mon–Sun)  
- Today is highlighted  

**On Select:**  
- List all activity for that day grouped by Vision  

### Grouped Details:  
- Vision Name  
- Habit Name  
- “What did you accomplish today?” text  
- Time spent on that habit (mins or hrs)  

**Empty State:**  
- “No logs for this day yet.”





---

### 👤 PROFILE TAB

- Name, email, password change
- Plan Status: Free, Trial, Pro
- "Upgrade to Pro" / "Manage Plan"
- Log out

---

### 💡 FEATURE GATES & TRIAL LOGIC

**Free:**
- 1 Vision only
- No Productivity tab
- Basic mastery view

**Trial / Pro:**
- Up to 4 Visions
- Productivity tab
- Full mastery tracking

**Trial Entry Points:**
- At onboarding → Try Pro modal
- Add 2nd vision → Upgrade modal
- Open Productivity → Glass overlay + trial prompt

---

### 💵 PRICING STRUCTURE

**Free Plan:**
- 1 Vision
- No productivity analytics
- Basic tracking only

**Pro Plan:**
- Monthly: $4
- Yearly: $40

---

## Implementation Notes

- Focus on clean, intuitive UI/UX
- Ensure smooth transitions between flows
- Implement proper error handling and loading states
- Design for both iOS and Android platforms
- Consider accessibility features
- Plan for offline functionality where applicable
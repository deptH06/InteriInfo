# Interior Designer Inventory & Quotation App — V3

A responsive, glassmorphism-style inventory and customer management starter website.

## Stack
- HTML5
- CSS3
- Vanilla JavaScript
- localStorage for browser-based persistence
- No backend/framework required for this starter

## Workflow
Login/Register → Customers → Customer Workspace → Inventory → Add/Edit Materials → Summary/Quotation

## Important
This version stores data in the browser's localStorage. It is suitable for a personal prototype/single-device workflow.
For real multi-device use, replace the storage layer with a backend/database and secure authentication.

## Run
Open `index.html` with VS Code Live Server, or simply open it in a modern browser.

## Main files
- `index.html` — application shell
- `styles.css` — responsive glassmorphism UI
- `app.js` — authentication, customers, inventory, summary and persistence

### V2 change
The Material Unit field has been completely removed from the form, inventory table, edit logic, and summary.

### V3 change
Added a password-change/reset option on the login screen. If the email exists but the password is incorrect, the password-change panel opens automatically. Users can also open it manually through “Forgot / Change password?”.

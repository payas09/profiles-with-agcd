# AGCD Public Preview - Admin Experience Specification

## Overview

This document outlines the admin experience requirements for the Orchestration Agent (Preview) feature, including playbook creation, editing, validation, and publishing workflows.

---

## 1. Playbook Edit Experience

### 1.1 Page Structure
- **Top Menu Bar**: Back button, Save button, Publish/Save & publish button
- **Playbook Name**: Editable text field
- **Queues Section**: Channel selector, queue selection panel
- **Template Editor**: Interactive dropdowns for configuring playbook behavior

### 1.2 Template Editors Available
| Template | Editor | Trigger Event |
|----------|--------|---------------|
| Wait Time Escalation | Priority Escalation Editor | Conversation is waiting in queue |
| Queue Transfer Escalation | Priority Escalation Editor | Conversation is transferred to queue |
| Overflow Handling | Overflow Handling Editor | Conversation is waiting in queue |

---

## 2. Save & Publish Flow

### 2.1 Save Behavior
- **No auto-save**: Changes are only saved on explicit user action
- **Save button**: Disabled for published (Active) playbooks
- **Save button tooltip** (when disabled for Active playbooks):
  > "Save is disabled for a published policy as it will change the playbook state from Active to Draft. Do Save & publish once the playbook is updated"

### 2.2 Publish Flow - New/Draft Playbooks
1. User clicks "Publish"
2. Confirmation dialog appears:
   > "This will make the playbook active and the conversations will be routed as per this playbook for the selected queues."
3. User confirms or cancels
4. On confirm: Status changes to "Active", success banner shown

### 2.3 Publish Flow - Already Published Playbooks
1. User clicks "Save & publish"
2. Confirmation dialog appears with two messages:
   > "If you do Save & publish, the playbook will get updated and published with the latest changes and the conversations will be routed as per this updated playbook for the selected queues."
   >
   > ⚠️ "If you Cancel, then the latest changes will be lost and the playbook will be reverted to the last published version."
3. **On Confirm**: Saves changes and keeps Active status
4. **On Cancel**: Reverts all changes to last published state, user stays on edit page

### 2.4 Unsaved Changes Warning
When navigating away (Back button, Home/Playbook tabs) with unsaved changes, a warning dialog appears for **all playbooks** (both Draft and Active):

**Dialog Message**: "You have unsaved changes. Do you want to save them before leaving?"

**Buttons (2-button design)**:
| Button | Action |
|--------|--------|
| Discard changes | Discards all unsaved changes and navigates away to the intended destination |
| Save | (For Draft playbooks) Saves changes, shows success banner, user **stays on edit page** |
| Save & publish | (For Active playbooks) Publishes changes, shows success banner, user **stays on edit page** |

**Behavior Notes**:
- The "Save" / "Save & publish" button keeps the user on the current edit page after saving
- A success banner is displayed: "Playbook saved successfully!" or "Playbook published successfully!"
- The "Discard changes" button navigates to the originally intended destination
- For Active playbooks, "Save & publish" is shown instead of "Save" because a regular Save would change the playbook from Active to Draft state

---

## 3. Playbook Management

### 3.1 Playbook Page Layout
The Playbook page displays all playbooks in a table with the following columns:
| Column | Width | Description |
|--------|-------|-------------|
| Playbook Name | 30% | Name with content preview, "New" tag for recently saved |
| Trigger | 20% | Event that activates the playbook |
| Status | 8% | Draft or Active badge |
| Queue | 15% | Selected queues with expand/collapse |
| Channel | 8% | Voice or Messaging badge |
| Last Modified | 12% | Timestamp of last change |
| Action | 7% | Menu with Edit, Duplicate, Delete |

**Layout Features**:
- Fixed column widths for consistent layout
- Text overflow with ellipsis for long names/triggers
- Expandable queue list for multiple queues

### 3.2 Playbook Actions
| Action | Description |
|--------|-------------|
| Edit | Opens playbook in edit mode |
| Duplicate | Creates a copy with "(Copy)" suffix |
| Delete | Opens delete confirmation dialog |

### 3.3 Delete Confirmation
When deleting a playbook, a confirmation modal appears:

**Dialog Title**: "Delete Playbook"

**Dialog Message**: "Are you sure you want to delete the playbook "[Playbook Name]"? This action cannot be undone."

**Buttons**:
| Button | Style | Action |
|--------|-------|--------|
| Cancel | Secondary (outlined) | Closes dialog, no action taken |
| Delete | Danger (red) | Deletes the playbook permanently |

---

## 4. Validations

### 4.1 Validation Trigger
- Validations are triggered **only on Save or Publish** (not during real-time editing)
- Errors are displayed in the editor area as a bulleted list

### 4.2 Button States on Validation Errors
| Button | State | Tooltip |
|--------|-------|---------|
| Save | Disabled | "Resolve the errors before you can save the playbook" |
| Publish / Save & publish | Disabled | "Resolve the errors before you can publish the playbook" |

### 4.3 Error Message Format
- Use "Condition X" terminology (not "Rule X")
- Display as simple bulleted list without badges/tabs
- Clear errors when user makes changes

### 4.4 Blank Field Validation
| Field | Error Message |
|-------|---------------|
| Priority Score | "Condition X: Priority score is required" |
| Time Interval | "Condition X: Time interval is required" |
| Variable Value | "Condition X: Value for [Variable Name] is required" |
| Default Priority Score | "Default priority score is required" |
| Overflow Action | "Condition X: An action must be selected" |
| Transfer Queue | "Condition X: A queue must be selected for transfer" |
| External Phone Number | "Condition X: A phone number is required for external transfer" |

### 4.5 Range Validation
| Field | Valid Range | Error Message |
|-------|-------------|---------------|
| Priority Score | 0 - 10,000 | "Condition X: Priority score must be between 0 and 10,000" |
| Default Priority Score | 0 - 10,000 | "Default priority score must be between 0 and 10,000" |
| Time Interval | > 0 | "Condition X: Time interval must be a positive number" |

### 4.6 Phone Number Validation
- Required for "Transfer to external number" action
- Must be a valid phone number format
- Error: "Condition X: Please enter a valid phone number"

### 4.7 Duplicate Condition Detection
- Detects when two conditions have identical variable-value combinations
- Error: "Condition X and Condition Y have identical conditions"

### 4.8 Conflicting Condition Detection
- Detects when conditions overlap (one is subset of another)
- Error: "Condition X conflicts with Condition Y - [Variable] values overlap"

---

## 5. Public Preview Limitations

### 5.1 Variable Restrictions
- **Maximum 2 Customer Variables** per playbook
- **Conversation Attributes hidden** (not available in preview)
- Popup message when limit reached:
  > "In the public preview, you can add a maximum of 2 customer variables."

### 5.2 Branch Restrictions
- **Maximum 12 Condition Branches** per playbook
- "+" button disabled when limit reached
- Popup message when limit reached:
  > "In the public preview, you can create a maximum of 12 condition branches."

### 5.3 Overflow Condition
- Fixed to "no agents are available"
- Not configurable in public preview

---

## 6. UI Components

### 6.1 Number Input Fields
- Priority score and timer inputs: **No spinner arrows** (increment/decrement buttons hidden)
- Manual number entry only

### 6.2 Variable Description Placeholder
- Placeholder text: "Describe how this appears in playbook (e.g., Customer is a Gold member)"

### 6.3 Status Badge
| Status | Appearance |
|--------|------------|
| Draft | Yellow badge |
| Active | Green badge |

### 6.4 Success Banners
- "Playbook saved successfully!" with link to Playbook page
- "Playbook published successfully!" with link to Playbook page
- Dismissible via close button

---

## 7. Data Isolation

- Playbooks created in Public Preview flow are **isolated** from regular Agentic routing
- `isPublicPreview` flag stored with each playbook
- Each flow maintains separate playbook lists

---

*Document Version: 1.1*
*Last Updated: March 2026*

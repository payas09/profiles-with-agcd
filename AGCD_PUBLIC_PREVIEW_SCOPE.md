# AGCD Public Preview - Scope Documentation

## Overview

The **Orchestration Agent (Preview)** is a feature within Dynamics 365 Contact Center that enables administrators to create and manage routing playbooks using natural language prompting. This document outlines the complete scope of the public preview, including all user flows, features, and limitations.

---

## Table of Contents

1. [Entry Point & Navigation](#entry-point--navigation)
2. [Home Screen](#home-screen)
3. [Template Gallery](#template-gallery)
4. [Available Templates](#available-templates)
5. [Edit Experience](#edit-experience)
6. [Variables & Conditions](#variables--conditions)
7. [Public Preview Limitations](#public-preview-limitations)
8. [Save & Publish Flow](#save--publish-flow)
9. [Playbook Management](#playbook-management)
10. [Queue Selection](#queue-selection)
11. [Data Isolation](#data-isolation)

---

## 1. Entry Point & Navigation

### Access Path
- **URL**: `/agcd-preview`
- **Feature Name**: "Agentic routing public preview" (differentiated from the full "Agentic routing" experience)

### Navigation Structure
The public preview has two main tabs:
- **Home** - Landing page with getting started guide and template gallery
- **Playbook** - List of all created playbooks with management options

Users can switch between tabs using the tab switcher at the top of the page.

---

## 2. Home Screen

### Page Header
- **Title**: "Orchestration Agent (Preview)"
- **Preview Badge**: Visual indicator showing this is a preview feature
- **Description**: Explains the purpose of natural language prompting for routing scenarios

### Getting Started Section
A two-step guide for new users:

**Step 1: Start with a prompt template**
> Select one of the pre-configured templates below. These templates provide starting points for common routing scenarios, which you can customize using natural language. Edit the prompt and fine-tune it to match your exact needs and business requirements.

**Step 2: Create and Edit playbooks**
> Create or add to existing playbooks using natural language. A playbook cannot work out of the box without any user instruction (customization).

### Template Cards
The home screen displays template cards directly below the getting started section. Each card shows:
- Template title
- Description
- Feedback buttons (thumbs up/down)

Clicking a card navigates to the edit experience for that template.

### Template Gallery Button
A "Template Gallery" button opens a modal with:
- Search functionality (positioned on the right side)
- Scenario filter dropdown (narrower width)
- Orchestrator/Assignment tabs (Assignment is disabled in preview)
- Grid of template cards with "Use this template →" action buttons

---

## 3. Template Gallery

### Layout
- **Header**: "Template Gallery" with close button
- **Tabs Row**: Orchestrator (active) | Assignment (disabled - "Coming soon")
- **Search Box**: Positioned to the right of the tabs
- **Scenario Filter**: Dropdown to filter by scenario category
- **Cards Grid**: Filterable template cards

### Filtering
- **By Scenario**: "All scenarios", "Dynamic prioritization", "Overflow handling"
- **By Search**: Searches across title, description, and category

### Card Actions
Each card has:
- Thumbs up/down feedback buttons
- "Use this template →" button to start editing

---

## 4. Available Templates

### Orchestrator Templates (3 total)

#### 1. Escalate priority based on wait time
- **ID**: `wait-time-escalation`
- **Category**: Dynamic prioritization
- **Description**: Automatically increase the priority of conversations that have been waiting in the queue for an extended period of time.
- **Trigger**: "Conversation is waiting in queue"
- **Editor**: Priority Escalation Editor

#### 2. Escalate priority based on transfer to queue
- **ID**: `queue-transfer-escalation`
- **Category**: Dynamic prioritization
- **Description**: Increase priority when a conversation is transferred to a specific queue, ensuring faster resolution.
- **Trigger**: "Conversation is transferred to the queue"
- **Editor**: Priority Escalation Editor

#### 3. Configure overflow based on agent availability in queue
- **ID**: `overflow-agent-availability` (maps to `overflow-conditions-actions`)
- **Category**: Overflow handling
- **Description**: Set up overflow rules based on agent availability conditions with different overflow actions (transfer, callback, voicemail etc).
- **Trigger**: "Conversation is waiting in queue"
- **Editor**: Overflow Handling Editor
- **Note**: Overflow condition is fixed to "no agents are available" in public preview

### Assignment Templates
- **Status**: Disabled ("Coming soon")
- Not available in public preview

---

## 5. Edit Experience

### Page Structure
1. **Top Menu Bar**
   - Back button (returns to Playbook page)
   - Save button (disabled for published playbooks)
   - Publish button
   - Auto-save indicator

2. **Breadcrumb Navigation**
   - Orchestration Agent > [Playbook Name or "New playbook"]

3. **Playbook Details Card**
   - Playbook Name (editable text field)
   - Trigger (read-only, derived from template)
   - Queues section with Edit option

4. **Template Editor**
   - Tips & Presets accordion (collapsible)
   - Main editing area with interactive dropdowns
   - Generated Playbook preview
   - Variables accordion (collapsible)

### Interactive Editing
Users edit playbooks by:
- Clicking on **blue dropdowns** to select values
- Adding/removing condition branches with +/× buttons
- Selecting variable values using multi-select dropdowns
- Choosing overflow actions and their parameters

### Overflow Handling Editor (Public Preview)
- **Fixed Condition**: "no agents are available" (not editable)
- **Available Actions**:
  - Transfer to another queue
  - Transfer to external number
  - Offer direct callback
  - Send to voicemail
  - Offer scheduled callback
  - End the conversation

### Priority Escalation Editor
- **Wait Time Escalation**: Configure priority score increase per time interval
- **Queue Transfer Escalation**: Configure priority score on transfer
- Both support adding variables for conditional priority rules

---

## 6. Variables & Conditions

### Customer Attributes (Available in Public Preview)
| Variable ID | Label | Available Values |
|-------------|-------|------------------|
| IsVIP | Is VIP Customer | True, False |
| CustomerTier | Customer Tier | Gold, Silver, Bronze, Standard, Platinum, Diamond, Enterprise, SMB, Startup |
| Language | Preferred Language | English, Spanish, French, German, Mandarin, Japanese, Portuguese |
| Region | Customer Region | North America, Europe, Asia Pacific, Latin America, Middle East, Africa |
| AccountType | Account Type | Premium, Standard, Trial, Free, Enterprise, Government, Education |

### Conversation Attributes (NOT Available in Public Preview)
The following are hidden in public preview:
- Conversation Intent
- Channel
- Priority
- Customer Sentiment

### Variable Selection
- Users can select values using Include or Exclude mode
- Multi-select dropdowns allow choosing multiple values
- "All" option available in Include mode

---

## 7. Public Preview Limitations

### Variable Restrictions
- **Maximum 2 Customer Variables**: Users can add up to 2 customer attributes
- **No Conversation Attributes**: The "Conversation Attributes" section is hidden
- When attempting to add a 3rd variable, a popup explains:
  > "In the public preview, you can add a maximum of **2 customer variables**."
  >
  > This allows you to create up to 12 condition branches using combinations like:
  > - 4 values × 3 values = 12 branches
  > - 3 values × 4 values = 12 branches
  > - Or up to 12 values from a single variable

### Branch Restrictions
- **Maximum 12 Branches**: Users can create up to 12 condition branches
- The "+" button is disabled when limit is reached
- When attempting to add more branches, a popup explains:
  > "In the public preview, you can create a maximum of **12 condition branches**."
  >
  > This limit supports common use cases such as:
  > - 2 variables with 4×3 value combinations
  > - 2 variables with 3×4 value combinations
  > - 1 variable with up to 12 different values

### Overflow Condition
- Fixed to "no agents are available"
- Not configurable in public preview (full version allows selecting from multiple overflow conditions)

### Feature Restrictions
- Assignment templates are disabled
- Only Orchestrator templates are available

---

## 8. Save & Publish Flow

### Save Behavior
- **No auto-save**: Changes are only saved on explicit user action
- Click "Save" button to manually save
- Success banner appears: "Playbook saved successfully!"
- **Save button disabled** for published (Active) playbooks to prevent changing status to Draft

### Publish Flow - New/Draft Playbooks
1. Click "Publish" button
2. Confirmation modal appears:
   - Title: "Publish Playbook"
   - Message: "This will make the playbook active and the conversations will be routed as per this playbook for the selected queues."
3. Click "Publish" to confirm or "Cancel" to abort
4. Success banner appears: "Playbook published successfully!"
5. Status changes from "Draft" to "Active"

### Publish Flow - Already Published Playbooks
1. Click "Save & publish" button
2. Confirmation modal appears with warning:
   - Message: "If you do Save & publish, the playbook will get updated and published with the latest changes."
   - Warning: "If you Cancel, then the latest changes will be lost and the playbook will be reverted to the last published version."
3. **On Confirm**: Saves changes and keeps Active status
4. **On Cancel**: Reverts all changes to last published state

### Unsaved Changes Warning
When navigating away (Back button, Home/Playbook tabs) with unsaved changes:
- Warning dialog appears: "You have unsaved changes. Do you want to save them before leaving?"
- **Discard changes**: Discards changes and navigates away
- **Save** (or **Save & publish** for Active playbooks): Saves/publishes then navigates

### Status Types
| Status | Description |
|--------|-------------|
| Draft | Saved but not active, does not affect routing |
| Active | Published and actively affecting conversation routing |

---

## 9. Playbook Management

### Playbook Page
- **URL**: `/agcd-preview/playbook`
- Shows only playbooks created in the public preview flow

### View Modes
- **List View**: Table format with columns
- **Grid View**: Card-based layout
- Toggle between views using buttons

### List View Columns
| Column | Description |
|--------|-------------|
| Playbook Name | Name with "New" tag for recently saved (< 24 hours) |
| Trigger | The event that activates the playbook |
| Status | Draft or Active |
| Queue | Selected queues (expandable if multiple) |
| Last Modified | Timestamp of last change |
| Action | Menu with Edit, Duplicate, Delete options |

### Grid View Cards
Each card displays:
- Playbook name with "New" tag
- Content preview
- Trigger
- Status
- Last Modified
- Action menu

### Actions Menu
- **Edit**: Opens the playbook in edit mode
- **Duplicate**: Creates a copy of the playbook
- **Delete**: Removes the playbook (with confirmation)

### Search & Filter
- Search box to find playbooks by name or trigger
- Filter pills: Orchestrator (active), Assignment (disabled)
- "New playbook" button to navigate back to Home

### Results Counter
Shows count of filtered results: "X of Y"

---

## 10. Queue Selection

### Queue vs Profile
- Public preview uses **Queues** instead of Engagement Profiles
- Terminology is adapted throughout the UI

### Selection Modes
| Mode | Description |
|------|-------------|
| All queues | Applies to all queues in the system |
| List of queues | Applies only to specifically selected queues |
| All queues except | Applies to all queues except those selected |

### Queue Selection Panel
- Opens as a side drawer
- Shows available queues with checkboxes
- Queue columns: Queue Name, Queue Type, Operating Hours
- Cancel and Save buttons

### Queue Display in Playbook List
- Shows first queue name
- "+X more" button expands to show all selected queues
- "Show less" button collapses the expanded list

---

## 11. Data Isolation

### Flow Separation
- Playbooks created in "Agentic routing public preview" flow are **NOT visible** in the regular "Agentic routing" flow
- Playbooks created in regular "Agentic routing" flow are **NOT visible** in the public preview
- Each flow maintains its own separate list of playbooks

### Implementation
- `isPublicPreview` flag is stored with each playbook
- Playbook pages filter by this flag:
  - Public Preview: `filter(p => p.isPublicPreview === true)`
  - Regular: `filter(p => p.isPublicPreview !== true)`

---

## Summary

The AGCD Public Preview provides a focused subset of the full Orchestration Agent capabilities:

| Feature | Public Preview | Full Version |
|---------|---------------|--------------|
| Templates | 3 Orchestrator | All templates |
| Customer Variables | Max 2 | Unlimited |
| Conversation Variables | Hidden | Available |
| Condition Branches | Max 12 | Unlimited |
| Overflow Conditions | Fixed (agent availability) | Configurable |
| Assignment Templates | Disabled | Available |
| Queue/Profile | Queues only | Profiles and Queues |

This scoped approach allows organizations to pilot the natural language prompting capabilities with safeguards in place, while the full feature set is available in the complete "Agentic routing" experience.

---

*Document Version: 1.0*
*Last Updated: March 2026*

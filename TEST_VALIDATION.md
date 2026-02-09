# Test Validation Checklist

## Issue 1: Left Navigation Panel
✅ **Fixed**: Updated App.tsx Layout component to show sidebar on all pages except edit pages
- Sidebar now appears on `http://localhost:5173/agcd-with-profiles/agcd/`
- Sidebar appears on `http://localhost:5173/agcd-with-profiles/`
- "Agentic routing" link in sidebar navigates to `/agcd` correctly

### Test Steps:
1. Navigate to `http://localhost:5173/agcd-with-profiles/`
2. Verify left sidebar is visible
3. Click "Agentic routing" in sidebar
4. Verify you land on AgCD page with sidebar still visible
5. Click any prompt to edit
6. Verify sidebar is hidden on edit page

## Issue 2: Header Banner & Page Positioning
✅ **Fixed**: Updated App.css and component structure
- Header is fixed at top with z-index: 100
- All content starts below header with margin-top: 48px
- Sidebar positioned with top: 48px
- No content overlaps with header banner

### Test Steps:
1. Navigate to any page
2. Verify "Copilot Service admin center" banner is visible at top
3. Scroll page content
4. Verify header stays fixed at top
5. Verify no content overlaps with header
6. Check AgCD Home, Playbook, and Edit pages

## Issue 3: Edit Page Layout - Trigger & Status Alignment
✅ **Fixed**: Updated AgCDPromptEdit.css
- Changed trigger-status-section-right from flex-direction: column to row
- Trigger Event and Status now appear side by side on same line
- All three elements in same row: "Describe Policy Behavior" (left), "Trigger Event" (middle-right), "Status" (right)

### Test Steps:
1. Navigate to AgCD prompt edit page
2. Verify "Describe Policy Behavior" section is on the left
3. Verify "Trigger Event" and "Status" are on the right, side by side
4. Verify all three sections are aligned horizontally

## Issue 4: Action Dropdown Menu Visibility
✅ **Fixed**: Updated AgCDPlaybook.css
- Increased z-index of action-dropdown-menu to 1000
- Set overflow-y: visible on policies-table-wrapper
- Added position: relative to table td elements
- Dropdown menu now appears above table footer

### Test Steps:
1. Navigate to AgCD Playbook page
2. Scroll to see policy rows
3. Click 3-dot menu (⋮) on any policy row
4. Verify dropdown menu appears fully visible
5. Verify menu is not clipped by table footer or borders
6. Click outside to close menu
7. Test with rows near bottom of table

## Additional Changes Made:

### Sample Policies
✅ Added 4 sample policies in promptStorage.ts:
- "Overflow routing policy" (Published, Orchestrator)
- "VIP customer routing" (Published, Assignment)
- "After hours automated response" (Draft, Orchestrator)
- "Prioritize for technical issues" (Draft, Assignment)

### Test Steps:
1. Navigate to AgCD Playbook page
2. Verify 4 sample policies appear in table
3. Verify filters work (All, Orchestrator, Assignment)
4. Verify search functionality works

## Files Modified:
1. `src/App.tsx` - Fixed Layout component structure
2. `src/App.css` - Updated layout with flex and margins
3. `src/utils/promptStorage.ts` - Added sample policies
4. `src/components/AgCDPromptEdit.css` - Fixed Trigger/Status alignment
5. `src/components/AgCDPlaybook.css` - Fixed action dropdown z-index

## Testing Commands:
```bash
# Start dev server
npm run dev

# Test URLs:
# - http://localhost:5173/agcd-with-profiles/
# - http://localhost:5173/agcd-with-profiles/agcd
# - http://localhost:5173/agcd-with-profiles/agcd/playbook
# - http://localhost:5173/agcd-with-profiles/agcd/prompt/overflow
```

## Expected Results:
✅ All pages show header banner at top
✅ Left sidebar visible on Home and Playbook pages
✅ Sidebar hidden on Edit pages
✅ No content overlaps with header
✅ Edit page shows Trigger and Status side by side
✅ Action dropdown menu fully visible without clipping
✅ Sample policies display in Playbook table
✅ All navigation works correctly

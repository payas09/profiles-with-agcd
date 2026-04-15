# Prompt Gallery

This document lists all prompts configured in the Conversation Orchestration Prompt Gallery.

## Orchestration Tab (5 prompts)

### Dynamic prioritization

| ID | Title | Description |
|---|---|---|
| `wait-time-escalation` | Escalate priority based on wait time | Automatically increase the priority of conversations that have been waiting in the queue for an extended period of time. |
| `queue-transfer-escalation` | Escalate priority based on transfer to queue | Increase priority when a conversation is transferred to a specific queue, ensuring faster resolution. |

### Overflow handling

| ID | Title | Description |
|---|---|---|
| `overflow-conditions-actions` | Configure combination of overflow conditions and actions | Set up overflow rules combining multiple conditions (wait time, agent availability, queue status) with actions (transfer, callback, voicemail). |

### Automated messages

| ID | Title | Description |
|---|---|---|
| `interval-messages` | Play message at specific time intervals | Deliver automated messages to customers at defined time intervals during their wait. |
| `frequent-messages-overflow` | Combine frequent messages with overflow actions | Coordinate automated messaging with overflow routing to keep customers informed. |


---

## Assignment Tab (2 prompts)

### Assign to a predicted expert

| ID | Title | Description |
|---|---|---|
| `preferred-then-last-expert` | Assign to previous or preferred expert | Assign conversations to a preferred expert mapped to customer or to an expert who previously interacted with customer, for improved customer experience |


### Assignment using User group expansion

| ID | Title | Description |
|---|---|---|
| `user-group-expansion` | Assign to expert using User group expansion | Assign conversations to specific user groups first, then progressively expand to additional groups if the conversation remains unassigned. |

---

## Summary

**Total: 7 prompts** (5 Orchestration + 2 Assignment)

### Categories

| Category | Count | Tab |
|---|---|---|
| Dynamic prioritization | 2 | Orchestration |
| Overflow handling | 1 | Orchestration |
| Automated messages | 2 | Orchestration |
| Assign to a predicted expert | 1 | Assignment |
| Assignment using User group expansion | 1 | Assignment |

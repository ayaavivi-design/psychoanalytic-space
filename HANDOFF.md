# HANDOFF — Agent-to-Agent Communication Template

_Use this format whenever you complete work that another agent needs to act on.
Write it in the last section of your output, or as a standalone file in the relevant report folder._

---

## Template

```
## HANDOFF

FROM:     [Your agent name]
TO:       [Receiving agent name]
DATE:     [YYYY-MM-DD]
SUBJECT:  [One line — what this is about]

### What I did
[Brief summary of the work you completed]

### What I found
[Key findings, issues, or decisions — bullet points, specific]

### What I need from you
[Exact action required — not "please review", but "run QA on theorist X" or "approve release Y"]

### Relevant files
[List files the receiving agent should read]

### Urgency
[ ] Blocking — do not proceed without resolving this
[ ] High — address before next release
[ ] Normal — address in next cycle
[ ] FYI — no action needed, for awareness only
```

---

## Escalation path

If the receiving agent cannot resolve the handoff:
1. Flag it in `OPEN_DECISIONS.md` with both agent names
2. Escalate to **Adam** for cross-domain decisions
3. Escalate to **Aya** if it affects product direction or release timing

---

## Example — Eitan → Sam

```
## HANDOFF

FROM:     Eitan (QA)
TO:       Sam (Release Manager)
DATE:     2026-05-09
SUBJECT:  QA sign-off for v1.4.2 — conditional

### What I did
Ran full QA on all 8 theorists after Winnicott prompt update.

### What I found
- Winnicott: PASS — voice restored, opening variety improved
- Klein: WARNING — one response had two questions instead of one (non-critical)
- All others: PASS

### What I need from you
Hold release until Klein warning is reviewed by Lia.
If Lia approves, release can proceed.

### Relevant files
- qa-reports/2026-05-09.md
- judge-analysis/ (latest)

### Urgency
[x] Blocking — do not proceed without resolving this
```

---

## Example — Lia → Eitan

```
## HANDOFF

FROM:     Lia (Clinical Quality)
TO:       Eitan (QA)
DATE:     2026-05-09
SUBJECT:  Klein warning — clinical review complete

### What I did
Reviewed the Klein double-question instance from QA report 2026-05-09.

### What I found
The double question was structurally a violation but clinically appropriate in context.
Klein would ask both. It is not a prompt failure — it is correct Kleinian behavior.

### What I need from you
Remove the warning flag. Release can proceed.

### Relevant files
- judge-analysis/2026-05-09.md

### Urgency
[x] High — address before next release
```

---

_Every agent reads HANDOFF.md before starting. Every agent uses this format when passing work._

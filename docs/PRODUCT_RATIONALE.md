# Product Rationale

## Why Next.js App Router

Pulse has a mixed surface:

- marketing-style public pages
- authenticated private flows
- server-side safety checks
- dynamic protected rooms

Next.js App Router gives a clean way to keep public pages fast while still handling server actions, protected routes, and server-rendered moderation views in one codebase.

## Why a Repository Boundary

The user asked for a Supabase-oriented MVP, but this workspace had no live backend credentials. To keep the app fully working end to end, the codebase uses a repository interface:

- `demo` mode: file-backed local persistence so reporting, matching, auth, rooms, and moderation all work immediately
- future `supabase` mode: same domain contract, different storage implementation

This keeps the MVP shippable now without hardcoding fake network paths into the main product logic.

## Why Explainable Matching

The core promise is “am I alone, or is this part of a pattern?” That needed a matching model people can understand and trust.

The MVP uses four transparent factors:

- same category
- nearby geography
- overlapping keywords
- similar timing

Results are banded into `Strong match`, `Likely match`, and `Weak match`, with human-readable reasons instead of vague “AI confidence” language.

## Why Private Rooms Instead of a Feed

The product direction explicitly rejected social media dynamics. The room model is intentionally narrow:

- limited membership
- factual thread
- evidence checklist
- voting on lawful next steps

That supports coordination without rewarding outrage, pile-ons, or public accusation loops.

## Why Public Aggregates Are Approximate

Public pattern visibility is useful, but privacy is the first constraint. The pattern explorer therefore:

- groups by coarse area and context
- hides exact private report details
- uses “reported pattern” wording
- suppresses weak clusters and flagged unsafe items

This preserves situational awareness without exposing individual residents.

## Why the Moderation Model Is Lightweight

This is an MVP for one local region, so moderation is intentionally practical:

- pre-submit warnings
- automated doxxing/threat checks
- user flagging
- a queue for moderator review

That gives the product basic safety guardrails without pretending to solve every trust-and-safety edge case in version one.


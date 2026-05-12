# Toneek: Clinical Intelligence & Control Tower Manual

This document provides a comprehensive A-Z walkthrough of how the Toneek platform manages clinical safety, intelligence, and population health at scale.

---

## 1. The Onboarding (Intelligent Assessment)
The journey begins with the **Intelligent Assessment Form**. 
*   **The Mechanism:** The system evaluates the user across 40+ variables including Skin Type, Fitzpatrick Scale, Climate Zone, and sensitivity history.
*   **Formula Assignment:** The `assign-formula` logic (`/api/assign-formula/route.ts`) calculates a specific **Formula Code** (e.g., `LG-OA-01`).
*   **Safety Check:** Before assignment, the system cross-references the user's history for any "Blacklisted Ingredients" from previous reactions.

## 2. Activation (The Intelligence Handshake)
To "unlock the intelligence," the user must log the delivery on their dashboard.
*   **The Safety Gate:** The Clinical Loop (Day 0) does not start until the user has the product in hand.
*   **The Signal:** Once delivery is logged, the system transitions the user to "Active Protocol" status.

## 3. The Emergency Scenario (The Day 3 Reaction)
*Scenario: A user (e.g., Sarah) experiences redness on Day 3 and clicks "Report a Concern."*

1.  **Immediate Response:** Sarah submits the report via `/api/report-concern/submit/route.ts`.
2.  **Automated Safety Brake:**
    *   **Flagging:** The system immediately flags Sarah's profile as "High-Risk."
    *   **Formula Blacklisting:** The system automatically blacklists the current formula code (`LG-OA-01`) for Sarah's profile so it can never be assigned to her again.
    *   **Tier Reset:** The formula engine looks at the `ADVERSE_SAFE_MAP`. If Sarah reacted to a Level 1 formula, the system automatically generates a **Level 0 (Sensitive/Safe Tier)** formula for her next batch.
3.  **The Control Tower Alert:** On the Admin Dashboard (`admin/page.tsx`), Sarah appears instantly in the **Active Signal Center** as a **"High-Risk Reporter."**
4.  **The Clinical Journey Timeline:** The Admin opens Sarah's profile and sees a visual vertical timeline (`admin/customers/[id]/page.tsx`) showing:
    *   *Day 0:* Intake (Formula A)
    *   *Day 3:* 🚨 Emergency Concern (Redness) -> Auto-switched to Formula B.
5.  **Human Verification:** The Admin adds a **Clinical Note** to Sarah's profile, providing chemist advice that Sarah can see on her dashboard.

## 4. Iterative Evolution (The Check-in Loop)
If no emergency occurs, the system maintains a proactive monitoring schedule:
*   **Week 2 (Tolerance Check):** User logs a score. High scores (e.g., 8/10) signal "Success."
*   **Week 4 (Stagnation Check):** If a user logs a low score (e.g., < 4) without a reaction, the system identifies **Stagnation**.
*   **The Signal:** Stagnant users appear on the Admin Dashboard under **"⚠️ Stagnant Check-ins."**
*   **The Evolution:** The system suggests a higher concentration for the next batch to ensure continuous progress.

## 5. Macro-Intelligence (Population Health)
This is where the system learns from thousands of users to protect future ones.

1.  **Data Aggregation:** Every success and reaction is logged in the `rule_performance` table.
2.  **The Analytics Hub:** The Admin uses the **Analytics** page (`admin/analytics/page.tsx`) to monitor the "Global Success Rate" vs "Adverse Rate" for every formula code.
3.  **The Global Flag:** If a formula (e.g., `LG-OA-05`) crosses an adverse threshold (e.g., > 10% reactions), the system triggers a **"Master Chemist Flag."**
4.  **Systemic Refinement:** The Chemist adjusts the "Master Rule" for that formula (e.g., lowering the active ingredient concentration for specific climates).
5.  **Self-Correction:** Every new customer who joins now receives the "Learned" version of the formula, making the platform smarter with every single report.

---

## Technical File References

| Component | File Path | Purpose |
|---|---|---|
| **Mismatch Check** | `admin/production/page.tsx` | Prevents shipping old formulas if a clinical change occurred after batching. |
| **Journey Timeline** | `admin/customers/[id]/page.tsx` | Visualizes the patient evolution from Day 1 to Today. |
| **Signal Center** | `admin/page.tsx` | Exception-based management dashboard for daily admin priority. |
| **Global Analytics** | `admin/analytics/page.tsx` | Population-level monitoring of formula efficacy. |
| **Formula Engine** | `api/assign-formula/route.ts` | The core logic that calculates and blacklists formula codes. |

---
**Manual Status:** Final Version (Phase H Complete)
**Scope:** Global Platform (Non-Regional)

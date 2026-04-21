-- Migration: Create and seed subscription_tiers table for dynamic pricing

CREATE TABLE IF NOT EXISTS subscription_tiers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    features JSONB NOT NULL DEFAULT '[]',
    prices JSONB NOT NULL DEFAULT '{}',
    highlight BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0
);

-- Seed with the existing hardcoded plans from the frontend
INSERT INTO subscription_tiers (id, name, description, features, prices, highlight, sort_order)
VALUES 
(
    'essentials',
    'Essentials',
    'Your personalised formula. Monthly delivery.',
    '["Monthly personalised formula", "Full active ingredient breakdown", "Climate-matched formulation", "WhatsApp delivery updates"]'::jsonb,
    '{
        "NGN": { "amount": 18000, "display": "₦18,000" },
        "GBP": { "amount": 35, "display": "£35" },
        "USD": { "amount": 45, "display": "$45" },
        "EUR": { "amount": 38, "display": "€38" },
        "GHS": { "amount": 250, "display": "GH₵250" },
        "CAD": { "amount": 55, "display": "CA$55" }
    }'::jsonb,
    false,
    1
),
(
    'full_protocol',
    'Full Protocol',
    'Formula + clinical outcome tracking + priority reformulation.',
    '["Everything in Essentials", "Skin OS Score tracking every 4 weeks", "Priority formula reformulation", "Skin response monitoring"]'::jsonb,
    '{
        "NGN": { "amount": 22000, "display": "₦22,000" },
        "GBP": { "amount": 42, "display": "£42" },
        "USD": { "amount": 55, "display": "$55" },
        "EUR": { "amount": 48, "display": "€48" },
        "GHS": { "amount": 320, "display": "GH₵320" },
        "CAD": { "amount": 70, "display": "CA$70" }
    }'::jsonb,
    true,
    2
),
(
    'restoration',
    'Restoration Protocol',
    'Three-phase barrier repair. 12-month programme.',
    '["Everything in Full Protocol", "3-phase progressive formula system", "12-month barrier restoration plan", "Dedicated clinical review at month 3 and 6"]'::jsonb,
    '{
        "NGN": { "amount": 35000, "display": "₦35,000" },
        "GBP": { "amount": 68, "display": "£68" },
        "USD": { "amount": 88, "display": "$88" },
        "EUR": { "amount": 75, "display": "€75" },
        "GHS": { "amount": 500, "display": "GH₵500" },
        "CAD": { "amount": 110, "display": "CA$110" }
    }'::jsonb,
    false,
    3
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    prices = EXCLUDED.prices,
    highlight = EXCLUDED.highlight,
    sort_order = EXCLUDED.sort_order;

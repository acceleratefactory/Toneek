'use client'
// src/components/dashboard/ScoreSparkline.tsx
// Minimal SVG sparkline for Skin OS Score history on the formula page.

interface Point {
    label: string
    score: number | null
}

interface ScoreSparklineProps {
    points: Point[]
    colour: string
}

export default function ScoreSparkline({ points, colour }: ScoreSparklineProps) {
    const valid = points.filter(p => p.score !== null) as { label: string; score: number }[]
    if (valid.length < 2) return null

    const W = 120
    const H = 48
    const PAD = 4

    const scores  = valid.map(p => p.score)
    const minS    = Math.min(...scores) - 5
    const maxS    = Math.max(...scores) + 5
    const range   = maxS - minS || 1
    const stepX   = (W - PAD * 2) / (valid.length - 1)

    const toX = (i: number) => PAD + i * stepX
    const toY = (s: number) => H - PAD - ((s - minS) / range) * (H - PAD * 2)

    const pathD = valid
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(p.score).toFixed(1)}`)
        .join(' ')

    const areaD = `${pathD} L ${toX(valid.length - 1).toFixed(1)} ${H} L ${toX(0).toFixed(1)} ${H} Z`

    return (
        <div aria-label="Score history sparkline" role="img">
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
                {/* Area fill */}
                <defs>
                    <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={colour} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={colour} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d={areaD} fill="url(#sparkGrad)" />

                {/* Line */}
                <path d={pathD} fill="none" stroke={colour} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                {/* End dot */}
                <circle
                    cx={toX(valid.length - 1)}
                    cy={toY(valid[valid.length - 1].score)}
                    r="3"
                    fill={colour}
                />
            </svg>
            <p style={{ textAlign: 'right', color: colour, fontSize: '0.68rem', marginTop: '2px' }}>
                {valid.length} data points
            </p>
        </div>
    )
}

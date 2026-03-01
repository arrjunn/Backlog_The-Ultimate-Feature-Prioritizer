/**
 * WorkspaceAvatar — deterministic, unique SVG icon for each workspace.
 * Uses the workspace ID to derive a gradient + geometric shape combo,
 * so every workspace always gets the same icon, but they all look distinct.
 */

// --- Gradient palettes — muted, editorial tones ---
const GRADIENTS = [
    ['#6d5a9c', '#8e76c1'],   // muted violet
    ['#3d6b9e', '#5b8fc7'],   // slate blue
    ['#2e7d78', '#4aada7'],   // teal
    ['#3a7d5c', '#5aad82'],   // sage green
    ['#7a6040', '#a88b62'],   // warm caramel
    ['#8b4c3f', '#b57163'],   // dusty terracotta
    ['#6b4c7a', '#9470a8'],   // plum
    ['#3d5e8f', '#5e85c2'],   // ink blue
    ['#556b4f', '#7ea076'],   // olive
    ['#7a3d5e', '#a85c82'],   // mauve
    ['#3d6b6b', '#5aadad'],   // petrol
    ['#7a5c3d', '#a88060'],   // sienna
]

// --- SVG shapes (centered in a 32×32 viewBox) ---
type ShapeFn = (color: string) => JSX.Element

const SHAPES: ShapeFn[] = [
    // Star / asterisk
    (c) => (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            {[0, 45, 90, 135].map((deg) => (
                <line key={deg} x1="16" y1="7" x2="16" y2="25"
                    stroke={c} strokeWidth="2.5" strokeLinecap="round"
                    transform={`rotate(${deg} 16 16)`} />
            ))}
        </svg>
    ),
    // Hexagon
    (c) => (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="16,6 25,11 25,21 16,26 7,21 7,11" stroke={c} strokeWidth="2" fill="none" />
        </svg>
    ),
    // Triangle
    (c) => (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="16,7 26,24 6,24" stroke={c} strokeWidth="2" fill="none" />
        </svg>
    ),
    // Diamond / rotated square
    (c) => (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="11" y="11" width="10" height="10" stroke={c} strokeWidth="2"
                fill="none" transform="rotate(45 16 16)" />
        </svg>
    ),
    // Circle + inner dot
    (c) => (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="9" stroke={c} strokeWidth="2" fill="none" />
            <circle cx="16" cy="16" r="3" fill={c} />
        </svg>
    ),
    // Cross / plus
    (c) => (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="16" y1="7" x2="16" y2="25" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="7" y1="16" x2="25" y2="16" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    ),
    // Wave / zigzag
    (c) => (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polyline points="5,16 10,10 15,16 20,10 25,16 30,10"
                stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
    ),
    // Arrow / chevron up
    (c) => (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polyline points="8,20 16,12 24,20" stroke={c} strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
    ),
    // Spiral / arc segments
    (c) => (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 7 A9 9 0 1 1 7 16" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M16 11 A5 5 0 1 1 11 16" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
    ),
    // Three dots diagonal
    (c) => (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="2.5" fill={c} />
            <circle cx="16" cy="16" r="2.5" fill={c} />
            <circle cx="22" cy="22" r="2.5" fill={c} />
        </svg>
    ),
    // Lightning bolt
    (c) => (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polyline points="19,7 13,17 17,17 13,25" stroke={c} strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
    ),
    // Hash / grid
    (c) => (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="12" y1="8" x2="12" y2="24" stroke={c} strokeWidth="2" strokeLinecap="round" />
            <line x1="20" y1="8" x2="20" y2="24" stroke={c} strokeWidth="2" strokeLinecap="round" />
            <line x1="8" y1="13" x2="24" y2="13" stroke={c} strokeWidth="2" strokeLinecap="round" />
            <line x1="8" y1="19" x2="24" y2="19" stroke={c} strokeWidth="2" strokeLinecap="round" />
        </svg>
    ),
]

/** Derive a stable integer from a string (simple djb2 hash) */
function hashId(id: string): number {
    let h = 5381
    for (let i = 0; i < id.length; i++) {
        h = (h * 33) ^ id.charCodeAt(i)
    }
    return Math.abs(h)
}

interface WorkspaceAvatarProps {
    id: string
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function WorkspaceAvatar({ id, size = 'md', className = '' }: WorkspaceAvatarProps) {
    const hash = hashId(id)
    const [from, to] = GRADIENTS[hash % GRADIENTS.length]
    const ShapeComponent = SHAPES[(hash >> 4) % SHAPES.length]

    const sizeMap = {
        sm: 'h-7 w-7',
        md: 'h-9 w-9',
        lg: 'h-10 w-10',
    }

    return (
        <div
            className={`${sizeMap[size]} rounded-xl flex items-center justify-center shrink-0 ${className}`}
            style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
        >
            <div className="w-[60%] h-[60%]">
                {ShapeComponent('rgba(255,255,255,0.92)')}
            </div>
        </div>
    )
}

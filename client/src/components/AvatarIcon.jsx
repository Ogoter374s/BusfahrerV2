/**
 * @fileoverview Avatar Component
 * <br><br>
 * This component displays a user's avatar image. <br>
 * It supports both local and remote images, with optional click handling and styling.
 */

// Utilities
import BASE_URL from '../utils/config';
import { SoundManager } from '../utils/soundManager';

// React
import { useLayoutEffect, useRef, useState } from 'react';

const multiplier = {
    'level_10.png': 0.15,
    'level_20.png': 0.1,
    'level_30.png': 0.27,
    'level_40.png': 0.34,
    'level_50.png': 0.34,
    'level_60.png': 0.27,
    'level_70.png': 0.34,
    'level_80.png': 0.3,
    'level_90.png': 0.63,
    'level_100.png': 0.76,
}

const scaler = {
    'level_10.png': 2.92,
    'level_20.png': 3.29,
    'level_30.png': 3.29,
    'level_40.png': 2.92,
    'level_50.png': 2.92,
    'level_60.png': 3.29,
    'level_70.png': 2.92,
    'level_80.png': 3.38,
    'level_90.png': 3.29,
    'level_100.png': 2.88,
}

const Avatar = ({
    src,
    name = 'Avatar',
    isLocal = false,
    onClick,
    className,
    frame,
    frameScale = 1,
}) => {
    if (!src) return null;

    const [hovered, setHovered] = useState(false);
    const [pushDown, setPushDown] = useState(0);

    const avatarBoxRef = useRef(null);

    /**
     * Handles the click event on the avatar image.
     * If the avatar is local, it plays a click sound.
     * If an `onClick` handler is provided, it calls that function as well.
     */
    const handleClick = () => {
        if (isLocal) SoundManager.playClickSound();
        if (onClick) onClick();
    };

    const imageSrc =
        src.startsWith('http') || src.startsWith('/')
            ? src
            : `${BASE_URL}avatars/${src}`;

    const avatarClass = className || (isLocal ? 'avatar' : 'player-avatar');

    // Hover scaling values
    const avatarHoverScale = 1.05;
    const frameHoverScale = 1.05;
    const scalerValue = scaler[frame] * frameScale;

    /**
     * Pushes the avatar down if the scaled frame would extend above the container top.
     *
     * The frame extends beyond the avatar by (scalerValue - 1) * height.
     * Half of that extension is above the top, so we add that as padding-top.
     */
    useLayoutEffect(() => {
        if (!frame) {
            setPushDown(0);
            return;
        }

        const el = avatarBoxRef.current;
        if (!el) return;

        const calc = () => {
            const h = el.getBoundingClientRect().height || 0;

            const multiplierValue = multiplier[frame]

            // How much frame goes above the avatar top
            const extraTop = Math.max(0, ((scalerValue - 1) / 2) * h * multiplierValue);

            // Small safety margin so it's never barely clipped
            setPushDown(Math.ceil(extraTop));
        };

        calc();

        const ro = new ResizeObserver(calc);
        ro.observe(el);

        return () => ro.disconnect();
    }, [frame, scalerValue, className]);

    return (
        <button
            type="button"
            onClick={handleClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="relative inline-flex items-center justify-center p-0 bg-transparent border-0 mb-1 group"
            style={{ marginTop: pushDown }}
        >
            {/* FRAME */}
            {frame && (
                <img
                    src={frame.startsWith('/') ? frame : `/frames/${frame}`}
                    alt="Avatar Frame"
                    draggable="false"
                    className="absolute left-1/2 top-1/2 pointer-events-none select-none transition-transform duration-200 -z-5"
                    style={{
                        transform: `translate(-50%, -50%) scale(${scalerValue * (hovered ? frameHoverScale : 1)})`,
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                    }}
                />
            )}

            {/* AVATAR */}
            <div
                ref={avatarBoxRef}
                className="overflow-hidden rounded-full transition-transform duration-200 -z-8"
                style={{ transform: `scale(${hovered ? avatarHoverScale : 1})` }}
            >
                <img
                    src={imageSrc}
                    alt={`${name}'s Avatar`}
                    draggable="false"
                    className={avatarClass}
                />
            </div>
        </button>
    );
};

export default Avatar;

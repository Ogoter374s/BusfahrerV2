
// Utilities
import { SoundManager } from "../utils/soundManager";

// React
import { useState } from 'react';

function CardSettings({setShowCardThemeModal, cardThemes, selectedTheme}) {
    const [collapsed, setCollapsed] = useState(false);

    const toggleCollapse = () => {
        SoundManager.playClickSound();
        setCollapsed(!collapsed);
    };

    return (
        <div className="flex flex-col gap-1 w-full items-center mt-2">

            {/* Header and Collapse Control */}
            <div
                onClick={toggleCollapse}
                className="flex items-center justify-center cursor-pointer border-b-3 border-[#f5e1a4] select-none gap-2 w-[400px]"
            >
                {/* Collapse Icon */}
                <img
                    src="/icons/arrow_right.svg"
                    alt="toggle"
                    className={`w-8 h-8 transition-transform duration-200 filter-sand ${collapsed ? '' : 'rotate-90'}`}
                />

                <h2 className="text-[2rem] text-[#f5e1a4] font-bold">
                    Card Settings
                </h2>
            </div>

            {!collapsed && (
                <>
                    {/* Card Theme selection dropdown */}
                    <div className="select-wrapper">
                        <label
                            htmlFor="optionsSelect"
                            className="select-label">
                            Select Card Theme:
                        </label>
                        <div
                            className="options-theme"
                            onClick={() => {
                                SoundManager.playClickSound();
                                setShowCardThemeModal(true);
                            }}
                        >
                            {cardThemes.find((theme) => theme.path === selectedTheme)?.name || 'Classic'}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default CardSettings;
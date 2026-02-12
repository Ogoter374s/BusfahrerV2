
// Components
import MenuSelect from '../components/MenuSelect';

// Utilities
import { SoundManager } from "../utils/soundManager";

// React
import { useState } from 'react';

function TitleSettings({titles, selectedTitle, selectedColor, onTitleChange, frames, selectedFrame, onFrameChange}) {
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
                    Title Settings
                </h2>
            </div>

            {!collapsed && (
                <div className="text-white">
                    {/* Title selection dropdown */}
                    <MenuSelect
                        label="Select Title:"
                        id="optionsSelect"
                        value={selectedTitle}
                        onChange={onTitleChange}
                        selectStyle={{ color: selectedColor }}
                        options={titles.map((title) => ({
                            name: title.name,
                            value: title.name,
                            color: title.color,
                        }))}
                    />

                    {/* Frame selection dropdown */}
                    <MenuSelect
                        label="Select Frame:"
                        id="frameSelect"
                        value={selectedFrame}
                        onChange={onFrameChange}
                        options={frames.map((frame) => ({
                            name: frame.name,
                            value: frame.name,
                        }))}
                    />
                </div>
            )}
        </div>
    );
}

export default TitleSettings;
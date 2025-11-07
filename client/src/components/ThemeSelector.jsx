/**
 * @fileoverview Component to select and customize card themes.
 * <br><br>
 * This component renders a modal that allows users to select a card theme and customize its colors.<br>
 * It receives the current theme, available themes, and color options as props and provides callbacks for saving or closing the modal.
 */

// Utilities
import { SoundManager } from '../utils/soundManager';

// Features
import { GetCardTheme } from '../features/CardThemes';

// React
import { useState, useEffect } from 'react';

/**
 * A component that allows users to select and customize card themes. <br>
 * It receives the current theme, available themes, and color options as props and provides callbacks for saving or closing the modal.
 * <br><br>
 * The component is styled using Tailwind CSS classes for a consistent look and feel. <br>
 * It includes a title, a list of available themes, color pickers for customization, and buttons to save or quit.
 * <br><br>
 * <strong>useEffect:</strong> <br>
 * This hook updates the temporary theme and colors whenever the modal is opened or the selected theme/colors change.
 * <br><br>
 * @function ThemeSelector
 * @param {boolean} isOpen - A boolean indicating whether the modal is open.
 * @param {function} onClose - A callback function to close the modal.
 * @param {function} onSave - A callback function to save the selected theme and colors.
 * @param {Array} themes - An array of available themes, each containing a path and name.
 * @param {string} selectedTheme - The currently selected theme path.
 * @param {string} color1 - The primary color for the theme.
 * @param {string} color2 - The pattern color for the theme.
 * @returns {JSX.Element|null} The rendered theme selector modal component or null if the modal is closed.
 */
const ThemeSelector = ({
    isOpen,
    onClose,
    onSave,
    themes,
    selectedTheme,
    color1,
    color2
}) => {
    const [tempTheme, setTempTheme] = useState(selectedTheme);
    const [tempColor1, setTempColor1] = useState(color1);
    const [tempColor2, setTempColor2] = useState(color2);

    /**
     * Updates the temporary theme and colors whenever the modal is opened or the selected theme/colors change.
     * This ensures that the user sees the current selections when they open the modal.
     */
    useEffect(() => {
        if (isOpen) {
            setTempTheme(selectedTheme);
            setTempColor1(color1);
            setTempColor2(color2);
        }
    }, [isOpen, selectedTheme, color1, color2]);

    if (!isOpen) return null;

    return (
        <div className="modal-style">
            <div className="theme-wrapper">
                <h2 className="theme-title">
                    Select Card Theme
                </h2>

                {/* Selection of Theme Styles */}
                <div className="theme-styles">
                    {themes.map((theme) => (
                        <div
                            key={theme.path}
                            onClick={() => {
                                SoundManager.playClickSound();
                                setTempTheme(theme.path);
                            }}
                            className="flex flex-col items-center cursor-pointer"
                        >
                            <div className={`
                                theme-item
                                ${tempTheme === theme.path ? 'border-[#15c42c]' : 'border-[#a65e2e]'}
                                hover:${tempTheme == theme.path ? 'border-[#15c42c]' : 'border-[#e33e3e]'}
                            `}>
                                <GetCardTheme
                                    id={theme.path}
                                    color1={tempColor1}
                                    color2={tempColor2}
                                    draggable="false"
                                />
                            </div>
                            <p className="
                                text-[2rem] sm:text-[0.75rem] lg:text-[1.5rem] xl:text-[1.75rem]
                            ">
                                {theme.name}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Color Pickers Section */}
                <div className="picker-wrapper">
                    <label className="picker-text">
                        Primary Color:
                    </label>

                    <input
                        type="color"
                        value={tempColor1}
                        onChange={(e) => setTempColor1(e.target.value)}
                        className="picker-color rounded-color-fix"
                    />

                    <label className="picker-text">
                        Pattern Color:
                    </label>
                    <input
                        type="color"
                        value={tempColor2}
                        onChange={(e) => setTempColor2(e.target.value)}
                        className="picker-color rounded-color-fix"
                    />
                </div>
                
                {/* Action Buttons */}
                <div className="theme-btns">
                    <button
                        onClick={() => {
                            SoundManager.playClickSound();
                            onClose();
                        }}
                        className="modal-btn"
                    >
                        Quit
                    </button>
                    <button
                        onClick={async () => {
                            SoundManager.playClickSound();
                            const success = await onSave(tempTheme, tempColor1, tempColor2);
                            if (success) onClose();
                        }}
                        className="modal-btn"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ThemeSelector;
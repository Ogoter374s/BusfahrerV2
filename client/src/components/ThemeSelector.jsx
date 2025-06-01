/**
 * ThemeSelector.jsx — Modal interface for customizing and selecting card themes.
 *
 * Allows players to visually select a card theme, adjust primary and pattern colors,
 * preview the result, and save their preferences. Includes sound feedback for interaction.
 */

// Utilities
import { SoundManager } from '../utils/soundManager';

// Features
import { GetCardTheme } from '../features/CardThemes';

// React
import React, { useState, useEffect } from 'react';

/**
 * ThemeSelector component function.
 *
 * Renders a modal with selectable card theme previews and color pickers.
 * Temporarily stores selections and updates the persistent values on save.
 *
 * @function ThemeSelector
 * @param {Object} props - Component properties.
 * @param {boolean} props.isOpen - Whether the modal is currently visible.
 * @param {Function} props.onClose - Function to close the modal.
 * @param {Function} props.onSave - Function to save the selected theme and colors.
 * @param {Array<Object>} props.themes - Available card theme definitions to choose from.
 * @param {string} props.selectedTheme - Currently applied theme path.
 * @param {string} props.color1 - Current primary color setting.
 * @param {string} props.color2 - Current pattern color setting.
 * @param {Function} props.setSelectedTheme - Setter for applied theme.
 * @param {Function} props.setColor1 - Setter for primary color.
 * @param {Function} props.setColor2 - Setter for pattern color.
 * @returns {JSX.Element|null} The rendered theme customization modal or null if closed.
 */
const ThemeSelector = ({
    isOpen,
    onClose,
    onSave,
    themes,
    selectedTheme,
    color1,
    color2,
    setSelectedTheme,
    setColor1,
    setColor2,
}) => {
    const [tempTheme, setTempTheme] = useState(selectedTheme);
    const [tempColor1, setTempColor1] = useState(color1);
    const [tempColor2, setTempColor2] = useState(color2);

    /**
     * useEffect — Resets temporary theme and color values when modal opens.
     *
     * Ensures that the modal reflects current saved selections when reopened.
     *
     * @function useEffect (sync on open)
     */
    useEffect(() => {
        if (isOpen) {
            setTempTheme(selectedTheme);
            setTempColor1(color1);
            setTempColor2(color2);
        }
    }, [isOpen, selectedTheme, color1, color2]);

    if (!isOpen) return null;

    /**
     * Renders the full theme selector interface.
     *
     * Includes:
     * - Grid of theme previews (with selection and sound on click)
     * - Color pickers for primary and pattern hues
     * - Buttons for quitting or saving theme changes
     */
    return (
        <div className="modal-backdrop">
            <div className="theme-modal">
                <h2>Select Card Theme</h2>

                <div className="theme-selection">
                    {themes.map((theme) => (
                        <div
                            key={theme.path}
                            className="card-theme-option"
                            onClick={() => {
                                SoundManager.playClickSound();
                                setTempTheme(theme.path);
                            }}
                        >
                            <div className={`card-container ${tempTheme === theme.path ? 'selected' : ''}`}>
                                <GetCardTheme
                                    id={theme.path}
                                    color1={tempColor1}
                                    color2={tempColor2}
                                    draggable="false"
                                />
                            </div>
                            <p>{theme.name}</p>
                        </div>
                    ))}
                </div>

                <div className="color-picker-container">
                    <label>Primary Color:</label>
                    <input
                        type="color"
                        value={tempColor1}
                        onChange={(e) => setTempColor1(e.target.value)}
                    />

                    <label>Pattern Color:</label>
                    <input
                        type="color"
                        value={tempColor2}
                        onChange={(e) => setTempColor2(e.target.value)}
                    />
                </div>

                <div className="modal-buttons">
                    <button 
                        className="modal-btn" 
                        onClick={() => {
                            SoundManager.playClickSound();
                            onClose();
                        }}
                    >
                        Quit
                    </button>
                    <button
                        className="modal-btn"
                        onClick={async () => {
                            SoundManager.playClickSound();
                            const success = await onSave(tempTheme, tempColor1, tempColor2);
                            if (success) onClose();
                        }}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ThemeSelector;
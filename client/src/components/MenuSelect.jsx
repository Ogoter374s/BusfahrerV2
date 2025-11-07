/**
 * @fileoverview MenuSelect Component
 * <br><br>
 * This component renders a styled dropdown select menu with sound effects on interaction. <br>
 * It accepts various props to customize its label, options, styles, and behavior.
 */

// Utilities
import { SoundManager } from "../utils/soundManager";

/**
 * A styled dropdown select menu component with sound effects on interaction.
 * <br><br>
 * This component renders a styled dropdown select menu with sound effects on interaction. <br>
 * It accepts various props to customize its label, options, styles, and behavior.
 * <br><br>
 * @function MenuSelect
 * @param {string} label - The label text for the select menu.
 * @param {string} id - The unique identifier for the select element.
 * @param {string|number} value - The currently selected value of the select menu.
 * @param {function} onChange - Callback function to handle changes to the selected value.
 * @param {Array} options - An array of option objects for the select menu. Each object should have `name`, `value`, and optional `color` properties.
 * @param {Object} selectStyle - An object containing inline styles to apply to the select element.
 * @returns {JSX.Element} The rendered MenuSelect component.
 */
const MenuSelect = ({ label, id, value, onChange, options = {}, selectStyle = {} }) => {
    return (
        <div className="select-wrapper">
            <label className="select-label">
                {label}
            </label>

            <select
                id={id}
                value={value}
                onChange={onChange}
                style={selectStyle}
                onClick={() => SoundManager.playClickSound()}
                className="select-style"
            >
                {options.map((opt, idx) => (
                    <option
                        key={opt.value || opt.name || idx}
                        value={opt.value || opt.name}
                        style={{ color: opt.color }}
                        data-name={opt.name}
                        data-path={opt.path}
                        className="select-option"
                    >
                        {opt.name}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default MenuSelect;
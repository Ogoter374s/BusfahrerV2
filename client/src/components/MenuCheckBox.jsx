/**
 * @fileoverview MenuCheckBox component
 * <br><br>
 * A reusable checkbox component for menus. <br>
 */

// Utilities
import { SoundManager } from "../utils/soundManager";

/**
 * MenuCheckBox component
 * <br><br>
 * A reusable checkbox component for menus. <br>
 * Different from a standard checkbox, this component integrates sound effects and custom styling to enhance user interaction. <br>
 * It is designed to be flexible and easily integrated into various menu systems within the application. <br>
 * 
 * @param {string} label - The label for the checkbox
 * @param {boolean} value - The current value of the checkbox
 * @param {function} onChange - Function to call when the checkbox value changes
 * @param {Object} [selectType={}] - The type of selection (e.g., 'checkbox' or 'radio')
 * @returns {JSX.Element} The rendered MenuCheckBox component
 */
const MenuCheckBox = ({
    label,
    value,
    onChange,
    selectType = {},
}) => {
    return (
        <div>
            <label className="checkbox-label">
                <input
                    type={selectType}
                    checked={value}
                    onChange={onChange}
                    onClick={() => SoundManager.playClickSound()}
                    className="checkbox-input"
                />
                {label}
            </label>
        </div>
    );
};

export default MenuCheckBox;
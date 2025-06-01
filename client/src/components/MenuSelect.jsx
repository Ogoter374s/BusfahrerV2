/**
 * MenuSelect.jsx — Reusable select dropdown component for menu forms and option settings.
 *
 * Displays a labeled dropdown list with customizable styling and option values.
 * Accepts an array of options that can include labels, values, and optional colors.
 */

// Utilities
import { SoundManager } from "../utils/soundManager";

/**
 * MenuSelect component function.
 *
 * Renders a styled label and <select> element populated from a dynamic option list.
 * Supports external change handling, custom class styling, and inline style overrides.
 *
 * @function MenuSelect
 * @param {Object} props - Component properties.
 * @param {string} props.label - Text label for the select element.
 * @param {string} props.id - ID for linking the label and select element.
 * @param {string} props.value - Currently selected value.
 * @param {Function} props.onChange - Handler for selection change events.
 * @param {Array<Object>} props.options - Array of option objects with `name`, `value`, and optional `color`.
 * @param {string} [props.className="options-selection"] - CSS class applied to the container div.
 * @param {Object} [props.selectStyle={}] - Inline styles for the <select> element.
 * @returns {JSX.Element} The rendered select dropdown with label.
 */
const MenuSelect = ({
    label,
    id,
    value,
    onChange,
    options,
    className = "options-selection",
    selectStyle = {},
}) => {

    /**
     * Renders the labeled dropdown layout.
     *
     * Maps provided options into selectable <option> elements with support for color styling.
     * Links the label to the dropdown via matching `id` and `htmlFor` attributes.
     */
    return (
        <div className={className}>
            <label htmlFor={id}>{label}</label>
            <select
                id={id}
                value={value}
                onChange={onChange}
                style={selectStyle}
                onClick={() => SoundManager.playClickSound()}
            >
                {options.map((opt, idx) => (
                    <option
                        key={opt.value || opt.name || idx}
                        value={opt.value || opt.name}
                        style={{ color: opt.color }}
                        data-name={opt.name}
                        data-path={opt.path}
                    >
                        {opt.name}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default MenuSelect;
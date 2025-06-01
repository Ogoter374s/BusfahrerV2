/**
 * MenuInput.jsx — Reusable input component for authentication and menu forms.
 *
 * Provides a styled input field with dynamic type, value, placeholder, and change handling.
 * Used for user input such as username and password fields within the game's access system.
 */

/**
 * MenuInput component function.
 *
 * Renders a styled input element that handles user input events.
 * Passes the input's event data to a parent-defined callback for state updates.
 *
 * @function MenuInput
 * @param {Object} props - Component properties.
 * @param {string} props.type - The input type (e.g., "text", "password").
 * @param {string} props.placeholder - Placeholder text for the input field.
 * @param {string} props.value - Current value of the input field.
 * @param {Function} props.onChange - Callback for handling input changes.
 * @param {string} props.cssName - CSS class name for styling the input field.
 * @param {boolean} [props.required=false] - Whether the input is required for submission.
 * @returns {JSX.Element} The rendered input field.
 */
function MenuInput({ type, placeholder, value, onChange, cssName, required = false }) {
    /**
     * Renders the input field element.
     *
     * Binds the provided value, placeholder, and change event.
     * Applies a predefined rustic style class for consistent visual appearance.
     */
    return (
        <input
            className={cssName}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={(e) => {
                onChange(e);
            }}
            required={required}
        />
    );
}

export default MenuInput;

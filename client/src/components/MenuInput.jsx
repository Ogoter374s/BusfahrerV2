/**
 * @fileoverview MenuInput component for user input fields in the menu.
 * <br><br>
 * This component renders an input field with customizable properties such as type, placeholder, value, and onChange handler. <br>
 * It also supports an image background and optional required validation.
 */

/**
 * A component that renders an input field with customizable properties such as type, placeholder, value, and onChange handler. <br>
 * It supports an image background and optional required validation.
 * 
 * @function MenuInput
 * @param {string} type - The type of the input field (e.g., "text", "password").
 * @param {string} placeholder - The placeholder text for the input field.
 * @param {string} value - The current value of the input field.
 * @param {function} onChange - The function to call when the input value changes.
 * @param {string} img - The name of the image to use as the background for the input field.
 * @param {boolean} [required=false] - Whether the input field is required.
 * @returns {JSX.Element} The rendered input field component.
 */
function MenuInput({ type, placeholder, value, onChange, img, required = false }) {
    return (
        // Input field with customizable properties
        <input
            className="input-style"
            style={{
                backgroundImage: `url('/components/${img}.svg')`,
                boxShadow: "inset 2px 2px 4px rgba(0, 0, 0, 0.6)",
                textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)"
            }}
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

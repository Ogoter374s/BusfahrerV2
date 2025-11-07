/**
 * @fileoverview LeaveButton component
 * <br><br>
 * This component renders a leave button that allows users to leave a game or lobby. <br>
 * It plays a click sound effect on interaction and handles the leave logic via an API call.
 */

/**
 * A button component that allows users to leave a game or lobby.
 * <br><br>
 * @function LeaveButton
 * @param {Function} handleClick - The function to call when the button is clicked.
 * @returns {JSX.Element} The rendered LeaveButton component.
 */
function LeaveButton({ handleClick }) {
    return (
        <button
            className="backBtn-style"
            style={{ backgroundImage: `url('/icons/back.svg')` }}
            onClick={() => {
                handleClick("lobbies");
            }}
        />
    );
}

export default LeaveButton;

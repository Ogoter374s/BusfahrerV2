/**
 * @fileoverview FriendInput component for sending friend requests.
 * <br><br>
 * This component includes an input field for entering a friend's code and a button to send the request. <br>
 * It handles the submission of the friend request and displays a popup notification based on the response.
 */

/**
 * FriendInput component allows users to send friend requests by entering a friend's code.
 * <br><br>
 * It includes an input field for the friend code and a button to submit the request. <br>
 * The component manages the state of the friend code input and handles the submission of the request. <br>
 * It also utilizes the PopupManager to display notifications based on the success or failure of the request
 * 
 * @function FriendInput
 * @param {string} friendCode - The current value of the friend code input.
 * @param {Function} setFriendCode - Function to update the friend code state.
 * @returns {JSX.Element} The rendered FriendInput component.
 */
const FriendInput = ({ friendCode, setFriendCode, sendFriendRequest }) => {
    return (
        <>
            {/* Add Friend Wrapper */}
            <form
                onSubmit={sendFriendRequest}
                className="friendAdd-wrapper"
            >

                {/* Add Friend Code Input */}
                <input
                    type="text"
                    className="friendAdd-input"
                    placeholder="Enter friend code..."
                    value={friendCode}
                    onChange={(e) => setFriendCode(e.target.value)}
                />

                {/* Add Friend Button */}
                <button 
                    className="friendAdd-btn">
                    Add Friend
                </button>
            </form>
        </>
    );
};

export default FriendInput;
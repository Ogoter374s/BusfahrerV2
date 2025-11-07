/**
 * @fileoverview FriendRequestList component that displays a list of pending friend requests.
 * <br><br>
 * This component renders a list of friend requests with options to accept or decline each request. <br>
 * It uses the SoundManager utility to play click sounds when buttons are clicked.
 */

/**
 * A component that displays a list of pending friend requests.
 * <br><br>
 * It renders each request with the username and provides buttons to accept or decline the request. <br>
 * The buttons are styled with colors indicating their actions (green for accept, red for decline). <br>
 * It also plays a click sound when the buttons are clicked.
 * <br><br>
 * <strong>playClickSound:</strong> <br>
 * Plays a click sound when the accept or decline button is clicked. <br>
 * This enhances user experience by providing auditory feedback for interactions.
 * 
 * @function FriendRequestList
 * @param {Array} pendingRequests - An array of pending friend requests, each containing `userId` and `username`.
 * @returns {JSX.Element|null} The rendered FriendRequestList component or null if there are no pending requests.
 */
const FriendRequestList = ({ pendingRequests, handleAccept, handleDecline }) => {
    if (!pendingRequests || pendingRequests.length === 0) return null;

    return (
        // Container for the list of pending friend requests
        <div className="friendRequest-wrapper">
            {pendingRequests.map((request, index) => (
                // Each request is displayed with a username and buttons to accept or decline
                <div 
                    key={index} 
                    className="friendRequest-item">

                    {/* Username display */}
                    <span className="friendRequest-txt">
                        {request.username} wants to be friends
                    </span>

                    {/* Buttons for accepting or declining the request */}
                    <div className="flex gap-2 self-center">

                        {/* Accept button */}
                        <button
                            onClick={() => handleAccept(request.userId)}
                            className="friendRequest-btn
                                bg-[#4caf50] text-white
                                hover:bg-[#3e8e41]
                        ">
                            ✔
                        </button>

                        {/* Decline button */}
                        <button
                            onClick={() => handleDecline(request.userId)}
                            className="friendRequest-btn
                                bg-[#e74c3c] text-white
                                hover:bg-[#c0392b]
                        ">
                            ✖
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default FriendRequestList;

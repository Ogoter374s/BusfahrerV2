/**
 * @fileoverview FriendList Component
 * <br><br>
 * This component displays a list of friends with options to select a friend or remove them from the list. <br>
 * It uses the SoundManager utility to play click sounds when buttons are clicked
 */

// Utilities
import BASE_URL from "../utils/config";

// React
import { useParams } from "react-router-dom";

/**
 * A component that displays a list of friends with options to select a friend or remove them from the list. <br>
 * It uses the SoundManager utility to play click sounds when buttons are clicked.
 * <br><br>
 * <strong>useEffect:</strong> <br>
 * Initializes the PopupManager and sets the popup state when the component mounts. <br>
 * This ensures that the PopupManager is ready to handle popups throughout the application.
 * <br><br>
 * <strong>playClickSound:</strong> <br>
 * Plays a click sound when the remove friend button is clicked. <br>
 * This enhances user experience by providing auditory feedback for interactions.
 * <br><br>
 * <strong>removeFriend:</strong> <br>
 * Sends a POST request to remove a friend from the list. <br>
 * It prompts the user for confirmation before proceeding with the removal. <br>
 * If the request is successful, it shows a success message; otherwise, it shows an error message.
 * 
 * @function FriendList
 * @param {Array} friends - An array of friend objects, each containing `userId`, `username`, `avatar`, and `unreadCount`.
 * @returns {JSX.Element} The rendered FriendList component.
 */
const FriendList = ({ friends, onSelect, removeFriend, inviteFriend }) => {
    const { lobbyId } = useParams();

    return (
        <>
            {/* Friendlist Wrapper */}
            <div className="friendList-wrapper">
                {friends.map((friend) => (

                    // Friend Item
                    <div
                        key={friend.userId}
                        onClick={() => onSelect(friend.userId)}
                        className="friendList-item scrollbar-thin scrollbar-thumb-white/30"
                    >
                        { /* Avatar and Username */}
                        <div className="flex items-center
                            gap-2.5 sm:gap-1 lg:gap-3 xl:gap-3 2xl:gap-2.5"
                        >
                            <img
                                src={`${BASE_URL}avatars/${friend.avatar}`}
                                alt="Avatar"
                                className="friendList-avatar"
                            />

                            <p className="friendList-txt">
                                {friend.username}
                            </p>
                            {friend.unreadCount > 0 && (
                                <div className="friendList-msg">
                                    <span className="mb-[0.45px] sm:mb-[0.45px] lg:mb-[2.5px] xl:mb-[5px] 2xl:mb-[2.5px]">
                                        {friend.unreadCount}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            {/* Invite Friend to Lobby */}
                            {lobbyId && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        inviteFriend(friend.userId, lobbyId);
                                    }}
                                    className="friendList-btn
                                        bg-[url('/icons/join.svg')] bg-no-repeat bg-center
                                        bg-[85%_auto]
                                        bg-[#469ff1]
                                    "
                                />
                            )}

                            {/* Remove Friend Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeFriend(friend.userId);
                                }}
                                className="friendList-btn
                                    bg-[url('/icons/remove.svg')] bg-no-repeat bg-center
                                    bg-[85%_auto]
                                    bg-[#c1272d]
                                "
                            />
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

export default FriendList;

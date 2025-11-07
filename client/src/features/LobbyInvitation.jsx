/**
 * @fileoverview LobbyInvitation component to display pending lobby invitations.
 * <br><br>
 * This component shows a list of pending invitations with options to accept or decline each invitation.
 */

// React
import { useParams } from "react-router-dom";

/**
 * A component that displays pending lobby invitations. <br>
 * Each invitation includes the inviter's username and buttons to accept or decline the invitation.
 * <br><br>
 * 
 * @function LobbyInvitation
 * @param {Array} pendingInvitations - An array of pending invitation objects.
 * @param {function} handleAccept - Function to handle accepting an invitation.
 * @param {function} handleDecline - Function to handle declining an invitation.
 * @returns {JSX.Element|null} The rendered lobby invitation component or null if there are no invitations.
 */
const LobbyInvitation = ({ pendingInvitations, handleAccept, handleDecline }) => {
    if (!pendingInvitations || pendingInvitations.length === 0) return null;

    const { lobbyId } = useParams();

    // Do not show invitations if the user is already in a lobby
    if(lobbyId) return null;

    return (
        <div className="lobby-invitation-wrapper">
            {pendingInvitations.map((invitation, index) => (
                // Each invitation is displayed with a username and buttons to accept or decline
                <div
                    key={index}
                    className="lobby-invitation-item">

                    {/* Invitation display */}
                    <span className="lobby-invitation-txt">
                        <span className="text-red-600"> {invitation.player} </span> invited you to a Game
                    </span>

                    {/* Buttons for accepting or declining the request */}
                    <div className="flex gap-3 self-center">

                        {/* Accept button */}
                        <button
                            onClick={() => handleAccept(invitation.lobbyId)}
                            className="lobby-invitation-btn
                                bg-[#4caf50] text-white
                                hover:bg-[#3e8e41]
                        ">
                            ✔
                        </button>

                        {/* Decline button */}
                        <button
                            onClick={() => handleDecline(invitation.lobbyId)}
                            className="lobby-invitation-btn
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
}

export default LobbyInvitation;
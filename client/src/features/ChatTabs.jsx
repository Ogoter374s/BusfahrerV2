/**
 * @fileoverview ChatTabs component that renders the tabs for the chat interface.
 * <br><br>
 * This component allows users to switch between the Friends and Game tabs. <br>
 * It handles the active tab state and applies styles based on the active tab.
 */

/**
 * Renders the chat tabs for Friends and Game.
 * <br><br>
 * This component allows users to switch between the Friends and Game tabs. <br>
 * It handles the active tab state and applies styles based on the active tab.
 * 
 * @function ChatTabs
 * @param {string} activeTab - The currently active tab ('friends' or 'game').
 * @param {Function} setActiveTab - Function to set the active tab.
 * @param {boolean} showGameTab - Flag to determine if the Game tab should be shown.
 * @returns {JSX.Element} The rendered ChatTabs component.
 */
const ChatTabs = ({ activeTab, setActiveTab, showChatTab }) => {
    return (
        //* Container for the chat tabs */
        <div className="chatTab-wrapper">

            {/* Button for Friends tab */}
            <button
                onClick={() => setActiveTab('friends')}
                className={`chatTab
                    ${activeTab === 'friends' 
                        ? 'bg-[#333] border-b-2 border-[#c1272d]' 
                        : 'border-b-2 border-[#444]'}
                `}
            >
                Friends
            </button>

            {/* Conditional rendering of Game tab button */}
            {showChatTab && (
                <button
                    onClick={() => setActiveTab('chat')}    
                    className={`chatTab
                        ${activeTab === 'chat' 
                            ? 'bg-[#333] border-b-2 border-[#c1272d]' 
                            : 'border-b-2 border-[#444]'}
                    `}   
                >
                    Game
                </button>
            )}
        </div>
    );
};

export default ChatTabs;

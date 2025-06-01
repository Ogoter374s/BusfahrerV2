/**
 * ChatTabs.jsx — Provides tabbed navigation for the chat sidebar.
 *
 * Allows users to switch between "Friends" and "Game" tabs within the chat interface.
 * Supports conditional rendering of the game tab based on props.
 */

/**
 * ChatTabs component function.
 *
 * Renders tab buttons for toggling between chat sections.
 * Applies an active state style to the currently selected tab.
 *
 * @function ChatTabs
 * @param {Object} props - Component properties.
 * @param {string} props.activeTab - The currently active tab key.
 * @param {Function} props.setActiveTab - Function to update the active tab state.
 * @param {boolean} props.showGameTab - Flag to conditionally show the "Game" tab.
 * @returns {JSX.Element} The rendered tab buttons container.
 */
const ChatTabs = ({ activeTab, setActiveTab, showGameTab }) => {
    /**
     * Renders the chat tab buttons.
     *
     * Includes a "Friends" tab by default and optionally a "Game" tab.
     * Highlights the currently active tab and updates state on click.
     */
    return (
        <div className="chat-tabs">
            <button
                className={`chat-tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
                onClick={() => setActiveTab('friends')}
            >
                Friends
            </button>

            {showGameTab && (
                <button
                    className={`chat-tab-btn ${activeTab === 'game' ? 'active' : ''}`}
                    onClick={() => setActiveTab('game')}
                >
                    Game
                </button>
            )}
        </div>
    );
};

export default ChatTabs;

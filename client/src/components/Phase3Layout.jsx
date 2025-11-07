/**
 * @fileoverview Phase 3 Layout Component
 * <br><br>
 * This component arranges and displays the game cards for phase 3 of the game. <br>
 * It uses the Card feature component to render each card with the appropriate styling and theme. <br>
 * The layout is responsive and centers the cards with spacing.
 */

// Features
import Card from '../features/Card';

// Utilities
import BASE_URL from '../utils/config';
import { SoundManager } from '../utils/soundManager';
import { PopupManager } from '../utils/popupManager';

// React
import { useState } from 'react';
import { useParams } from 'react-router-dom';

/**
 * A layout component for displaying game cards in phase 3 of the game. <br>
 * It arranges the cards in rows with specific shifts for the first and last rows. <br>
 * Each card can display action buttons on hover, allowing players to interact with the cards.
 * <br><br>
 * <strong>handleClick:</strong> <br>
 * This function handles click events on the action buttons. <br>
 * It sends the selected action to the server and updates the game state accordingly. <br>
 * 
 * @function Phase3Layout
 * @param {Object[][]} gameCards - A 2D array of game card objects to be displayed in rows.
 * @param {Object} gameInfo - An object containing the current game state information.
 * @param {string} color1 - The first color used for styling the cards.
 * @param {string} color2 - The second color used for styling the cards.
 * @param {string} theme - The theme applied to the cards.
 * @returns {JSX.Element} The rendered phase 3 layout component with game cards.
 */
function Phase3Layout({
    gameCards,
    gameInfo,
    color1,
    color2,
    theme,
}) {
    const { lobbyId } = useParams();

    const [hoverCard, setHoverCard] = useState(null);
    const [firstAction, setFirstAction] = useState({});

    /**
     * Handles the click event on action buttons for a card. <br>
     * It sends the selected action to the server and updates the game state accordingly.
     */
    const handleClick = async (cardIdx, action, secondAction = null) => {
        if (gameInfo.tryOver || gameInfo.gameOver) return;
        try {
            const response = await fetch(`${BASE_URL}card-action/${lobbyId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ cardIdx, action, secondAction }),
            });

            const data = await response.json();

            if (!data.success) {
                PopupManager.showPopup({
                    title: data.title,
                    message: data.message,
                    icon: '❌',
                });
            }
        } catch (error) {
            PopupManager.showPopup({
                title: "Error",
                message: "An error occurred while processing your action.",
                icon: '❌',
            });
            console.error('Error handling card action:', error);
        }
    }

    return (
        <div className="phase3-cards-wrapper">
            {/* Render each row of game cards */}
            {gameCards.map((row, rowIdx) => {
                const isFirst = rowIdx === 0;
                const isLast = rowIdx === gameCards.length - 1;
                const shiftY = isFirst ? "translateY(70px)" : isLast ? "translateY(-70px)" : "none";

                return (
                    // Render each row with appropriate shift
                    <div key={rowIdx} className="phase3-cards-row" style={{ transform: shiftY }}>
                        {row.map((card, colIdx) => {
                            const cardIdx = `${rowIdx}-${colIdx}`;
                            const showButtons =
                                hoverCard === cardIdx
                                && !card.flipped
                                && gameInfo.currentRow === rowIdx
                                && !gameInfo.tryOver
                                && !gameInfo.gameOver
                                && gameInfo.isCurrentPlayer;

                            let buttons = [];

                            if (isFirst) {
                                buttons = [
                                    { label: '=', action: 'equal' },
                                    { label: '≠', action: 'unequal' },
                                ];
                            } else if (isLast) {
                                const selected = firstAction[cardIdx];
                                if (!selected) {
                                    buttons = [
                                        { label: '∧', action: 'higher' },
                                        { label: '=', action: 'same' },
                                        { label: '∨', action: 'lower' },
                                    ];
                                } else {
                                    buttons = [
                                        { label: '=', action: 'equal', second: selected },
                                        { label: '≠', action: 'unequal', second: selected },
                                    ];
                                }
                            } else {
                                buttons = [
                                    { label: '∧', action: 'higher' },
                                    { label: '=', action: 'same' },
                                    { label: '∨', action: 'lower' },
                                ];
                            }

                            const hoverButtons = (
                                <div className={`card-action-btn-wrapper
                                        ${showButtons ? 'opacity-100' : 'opacity-0'}
                                    `}
                                >
                                    {/* Render action buttons */}
                                    {buttons.map(({ label, action, second }) => (
                                        <button
                                            key={action}
                                            className="card-action-btn"
                                            onClick={() => {
                                                SoundManager.playClickSound();

                                                if (isLast && !second && !firstAction[cardIdx]) {
                                                    setFirstAction(prev => ({ ...prev, [cardIdx]: action }));
                                                } else if (isLast && second) {
                                                    handleClick(cardIdx, second, action);
                                                } else {
                                                    handleClick(cardIdx, action);
                                                }
                                            }}
                                            disabled={!showButtons}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            );

                            return (
                                <Card
                                    key={cardIdx}
                                    index={cardIdx}
                                    card={card}
                                    theme={theme}
                                    color1={color1}
                                    color2={color2}
                                    backHover={false}
                                    hoverButtons={hoverButtons}
                                    onMouseEnter={() => setHoverCard(cardIdx)}
                                    onMouseLeave={() => setHoverCard(null)}
                                />
                            );
                        })}
                    </div>
                );
            }
            )}
        </div>
    );
};

export default Phase3Layout;
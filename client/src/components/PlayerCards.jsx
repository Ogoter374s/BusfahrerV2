/**
 * @fileoverview PlayerCards component to render player's cards.
 * <br><br>
 * This component displays the cards held by a player. <br>
 * It filters out played cards and renders each unplayed card using the Card feature component.
 */

// Features
import Card from "../features/Card";

/**
 * A component that renders the cards held by a player. <br>
 * It filters out played cards and renders each unplayed card using the Card feature component.
 * <br><br>
 * 
 * @function PlayerCards
 * @param {Array} playerCards - The array of card objects held by the player.
 * @param {function} handleLayCard - The function to handle laying down a card when clicked.
 * @param {string} theme - The theme to be applied to the card components.
 * @param {string} color1 - The primary color for the card components.
 * @param {string} color2 - The secondary color for the card components.
 * @returns {JSX.Element} The rendered player cards component.
 */
function PlayerCards({ playerCards, handleLayCard, theme, color1, color2 }) {
    return (
        <div className="player-cards-wrapper">
            {/* Render each unplayed card */}
            {playerCards?.map((card, originalIndex) =>
                ({ card, originalIndex }))
                .filter(({ card }) => !card.played)
                .map(({ card, originalIndex }) => (
                    <Card
                        index={originalIndex}
                        key={originalIndex}
                        card={card}
                        onClick={handleLayCard}
                        theme={theme}
                        color1={color1}
                        color2={color2}
                    />
                ))
            }
        </div>
    );
};

export default PlayerCards;
/**
 * @fileoverview Phase 2 Layout Component
 * <br><br>
 * This component arranges and displays the game cards for phase 2 of the game. <br>
 * It uses the Card feature component to render each card with the appropriate styling and theme. <br>
 * The layout is responsive and centers the cards with spacing.
 */

// Features
import Card from '../features/Card';

/**
 * A layout component for displaying game cards in phase 2 of the game. <br>
 * It arranges the cards in a centered layout with spacing between them.
 * <br><br>
 * 
 * @function Phase2Layout
 * @param {Object[]} gameCards - An array of game card objects to be displayed.
 * @param {string} color1 - The first color used for styling the cards.
 * @param {string} color2 - The second color used for styling the cards.
 * @param {string} theme - The theme applied to the cards.
 * @returns {JSX.Element} The rendered phase 2 layout component with game cards.
 */
function Phase2Layout({ gameCards, color1, color2, theme }) {
    return (
        <div className="phase2-cards-wrapper">
            {/* Render each game card or placeholder */}
            {gameCards?.map((card, colIdx) =>
                card[0] ? (
                    <Card
                        key={colIdx}
                        index={colIdx}
                        card={card[0]}
                        color1={color1}
                        color2={color2}
                        theme={theme}
                    />
                ) : null,
            )}
        </div>
    );
};

export default Phase2Layout;
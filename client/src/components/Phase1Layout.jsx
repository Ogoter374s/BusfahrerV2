/**
 * @fileoverview Phase1Layout.jsx is a React component that renders the layout for Phase 1 of the game.
 * <br><br>
 * It displays a grid of game cards arranged in rows, with each card being clickable to trigger an action. <br>
 * The layout is styled based on the provided theme and colors.
 */

// Features
import Card from '../features/Card';

/**
 * Renders the layout for Phase 1 of the game. <br>
 * It displays a grid of game cards arranged in rows, with each card being clickable to trigger an action. <br>
 * The layout is styled based on the provided theme and colors.
 * <br><br>
 * 
 * @function Phase1Layout
 * @param {Object[]} gameCards - An array of arrays representing the rows and columns of game cards.
 * @param {string} color1 - The first color used for styling the cards.
 * @param {string} color2 - The second color used for styling the cards.
 * @param {string} theme - The theme used for styling the cards.
 * @param {function} handleRowClick - A function that is called when a row of cards is clicked.
 * @returns {JSX.Element} The rendered Phase 1 layout component.
 */
function Phase1Layout({
    gameCards,
    color1,
    color2,
    theme,
    handleRowClick
}) {
    return (
        <div className="phase1-cards-wrapper">

            {/* Render each row of game cards */}
            {gameCards?.map((row, rowIdx) => (
                <div
                    key={rowIdx}
                    className="phase1-cards-row"
                >

                    {/* Render the cards for the current row */}
                    {row.map((card, colIdx) => {
                        const cardIdx = (rowIdx * (rowIdx + 1)) / 2 + colIdx;
                        return (
                            <Card
                                key={cardIdx}
                                index={cardIdx}
                                card={card}
                                theme={theme}
                                color1={color1}
                                color2={color2}
                                recline={true}
                                onClick={() => !card.flipped && handleRowClick(rowIdx + 1)}
                            />
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default Phase1Layout;
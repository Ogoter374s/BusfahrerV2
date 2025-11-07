/**
 * @fileoverview Phase 1 component rendering the game layout for phase 1.
 * <br><br>
 * This component displays the card pyramid, turn information, and drink count for phase 1 of the game. <br>
 * It conditionally renders based on the current game phase.
 */

// Components
import Phase1Layout from '../components/Phase1Layout';
import TurnInfo from '../components/TurnInfo';

/**
 * Phase 1 component rendering the game layout for phase 1.
 * <br><br>
 * This component displays the card pyramid, turn information, and drink count for phase 1 of the game. <br>
 * It conditionally renders based on the current game phase.
 * <br><br>
 * <strong>info:</strong> <br>
 * An object containing the current game information, including the phase, player row, drink row, and drinks received.
 * <br><br>
 * <strong>theme:</strong> <br>
 * An object containing the current theme settings, including selected theme and colors.
 * <br><br>
 * <strong>gCards:</strong> <br>
 * An object containing the game cards to be displayed in the layout.
 * <br><br>
 * 
 * @function Phase1
 * @param {object} gCards - The game cards to be displayed.
 * @param {object} info - The current game information.
 * @param {object} theme - The current theme settings.
 * @param {function} event - The event handler for row clicks.
 * @returns {JSX.Element} The rendered Phase 1 component.
 */
function Phase1({gCards, info, theme, event}) {
    const {
        phase
    } = info;

    // Only render if the current phase is 1
    if (phase !== 1) return <></>;

    const {
        selectedTheme,
        color1,
        color2,
    } = theme;

    const {
        cards,
    } = gCards;

    const {
        playerRow,
        drinkRow,
        drinksReceived,
    } = info;

    return (
        <div className="@container/phase1 flex flex-col items-center justify-start h-screen">

            {/* Overlay image for the game phase */}
            <div className="phase1-wrapper">

                {/* Card pyramid displaying all game cards */}
                <Phase1Layout
                    gameCards={cards}
                    handleRowClick={event}
                    theme={selectedTheme}
                    color1={color1}
                    color2={color2}
                />

                {/* Display turn information*/}
                <TurnInfo
                    playerRow={playerRow}
                    drinkRow={drinkRow}
                />

                {/* Display the number of drinks given */}
                <div className="give-drink-wrapper">
                    {drinksReceived > 0 && (
                        <>
                            <span className="highlight-player">Du </span> musst
                            <span className="highlight-count">{' '} {drinksReceived} </span> Schlucke trinken
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Phase1;

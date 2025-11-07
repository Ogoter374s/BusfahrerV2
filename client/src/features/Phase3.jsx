/**
 * @fileoverview Phase 3 component rendering the game layout for phase 3.
 * <br><br>
 * This component displays the driver information, game cards, and turn information for phase 3 of the game. <br>
 * It conditionally renders based on the current game phase.
 */

// Components
import Phase3Layout from '../components/Phase3Layout';
import TurnInfo from '../components/TurnInfo';

/**
 * Phase 3 component rendering the game layout for phase 3.
 * <br><br>
 * This component displays the driver information, game cards, and turn information for phase 3 of the game. <br>
 * It conditionally renders based on the current game phase.
 * <br><br>
 * <strong>info:</strong> <br>
 * An object containing the current game information, including the phase, driver name, player row, and drink row.
 * <br><br>
 * <strong>theme:</strong> <br>
 * An object containing the current theme settings, including selected theme and colors.
 * <br><br>
 * <strong>gCards:</strong> <br>
 * An object containing the game cards to be displayed in the layout.
 * <br><br>
 * 
 * @function Phase3
 * @param {object} gCards - The game cards to be displayed.
 * @param {object} info - The current game information.
 * @param {object} theme - The current theme settings.
 * @returns {JSX.Element} The rendered Phase 3 component.
 */
function Phase3({ gCards, info, theme }) {
    const {
        phase
    } = info;

    // Only render if the current phase is 3
    if (phase !== 3) return <></>;

    const {
        selectedTheme,
        color1,
        color2,
    } = theme;

    const {
        cards
    } = gCards;

    const {
        busfahrerName,
        playerRow,
        drinkRow,
    } = info;

    return (
        <div className="@container/phase3 flex flex-col items-center justify-start h-screen">

            {/* Overlay image for the game phase */}
            <div className="phase3-wrapper">

                {/* Display Busfahrer name */}
                <h2 className="phase3-busfahrer">
                    Busfahrer:{' '}
                    <span className="highlight-player">{busfahrerName}</span>
                </h2>

                {/* Render the diamond-shaped card layout */}
                <Phase3Layout
                    gameCards={cards}
                    gameInfo={info}
                    color1={color1}
                    color2={color2}
                    theme={selectedTheme}
                />

                <TurnInfo
                    playerRow={playerRow}
                    drinkRow={drinkRow}
                />
            </div>
        </div>
    );
}

export default Phase3;

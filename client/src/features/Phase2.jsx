/**
 * @fileoverview Phase 2 component rendering the game layout for phase 2.
 * <br><br>
 * This component displays the driver information, game cards, and turn information for phase 2 of the game. <br>
 * It conditionally renders based on the current game phase.
 */

// Components
import Phase2Layout from '../components/Phase2Layout';
import TurnInfo from '../components/TurnInfo';

/**
 * Phase 2 component rendering the game layout for phase 2.
 * <br><br>
 * This component displays the driver information, game cards, and turn information for phase 2 of the game. <br>
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
 * @function Phase2
 * @param {object} gCards - The game cards to be displayed.
 * @param {object} info - The current game information.
 * @param {object} theme - The current theme settings.
 * @returns {JSX.Element} The rendered Phase 2 component.
 */
function Phase2({ gCards, info, theme }) {
    const {
        phase
    } = info;

    // Only render if the current phase is 2
    if (phase !== 2) return <></>;

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
        <div className="@container/phase2 flex flex-col items-center justify-start h-screen">

            {/* Overlay image for the game phase */}
            <div className="phase2-wrapper">

                {/* Busfahrer (Driver) section displaying player name and drinking rules */}
                <div className="text-center select-none font-[Vollkorn] text-[#1b0e1e]">
                    <h2 className="phase2-busfahrer">
                        Busfahrer:{' '}
                        <span className="highlight-player">{busfahrerName}</span>
                    </h2>

                    <p className="phase2-instructions">
                        Trinke für deine Übrigen Karten
                    </p>

                    <ul className="phase2-rules">
                        <li>Pro 2-10: Trinke 2-10 Schluck</li>
                        <li>Pro J: Alle Burschen trinken einen Schluck</li>
                        <li>Pro Q: Alle Damen trinken einen Schluck</li>
                        <li>Pro K: Alle trinken einen Schluck</li>
                        <li>Pro A: Ex dein Glas</li>
                    </ul>
                </div>

                {/* Displaying game cards */}
                <Phase2Layout
                    gameCards={cards}
                    color1={color1}
                    color2={color2}
                    theme={selectedTheme}
                />

                {/* Display turn information*/}
                <TurnInfo
                    playerRow={playerRow}
                    drinkRow={drinkRow}
                />
            </div>
        </div>
    );
}

export default Phase2;

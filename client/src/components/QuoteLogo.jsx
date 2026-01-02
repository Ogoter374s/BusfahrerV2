/**
 * @fileoverview Displays a random drink-related quote alongside the game logo.
 * <br><br>
 * This component randomly selects a quote from a predefined list of drink-related quotes and displays it above the game logo.<br> 
 * The quotes are humorous and related to coding and drinking culture, adding a fun element to the game's branding.
 */

// Utilities
import { drinkQuotes } from '../utils/constants';

// React
import { useState } from 'react';

/**
 * GameLogo component displays the game logo with a random drink-related quote.
 * <br><br>
 * It randomly selects a quote from the `drinkQuotes` array and displays it above the logo. <br>
 * The logo is styled to be responsive and visually appealing, with the quote having a pulsating animation.
 * <br><br>
 * <strong>useState:</strong>
 * State hook to manage the quote displayed with the game logo. <br>
 * Initializes with a random quote from the `drinkQuotes` array. <br>
 * This ensures that each time the component is rendered, a different quote is displayed. <br>
 * The quote is selected using a random index based on the length of the `drinkQuotes` array. <br>
 * This approach provides a fun and dynamic element to the game logo, enhancing user engagement.
 * 
 * @function GameLogo
 * @returns {JSX.Element} The rendered GameLogo component with a random drink-related quote and the game logo.
 */
function GameLogo() {
    /**
     * State hook to manage the quote displayed with the game logo.
     * Initializes with a random quote from the `drinkQuotes` array.
     * This ensures that each time the component is rendered, a different quote is displayed.
     * The quote is selected using a random index based on the length of the `drinkQuotes` array.
     * This approach provides a fun and dynamic element to the game logo, enhancing user engagement.
     */
    const [quote] = useState(() => {
        const random = Math.floor(Math.random() * drinkQuotes.length);
        return drinkQuotes[random];
    });

    return (
        // Main wrapper for the logo and quote
        <div className="quote-wrapper">

            {/* Quote text displayed above the logo */}
            <p className="quote-txt">
                {quote}
            </p>

            {/* Game logo image */}
            <div className="logo-mask relative inline-block">
                <img
                    src="/logos/logo.svg"
                    alt="Game Logo"
                    className="pointer-events-none select-none mx-auto block w-full h-auto"
                />

                <div className="logo-sweep"></div>
            </div>
        </div>
    );
}

export default GameLogo;

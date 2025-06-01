/**
 * QuoteLogo.jsx — Displays the game logo along with a random drink-related quote.
 *
 * Enhances the visual identity of the game with humorous, themed quotes shown above the logo.
 * Quotes are randomly selected upon component mount and do not change afterward.
 */

// React
import { useState } from 'react';

const drinkQuotes = [
    "Don't drink and code 🍺",
    'Ctrl + Brew 🍻',
    'Debug responsibly!',
    'Commit, push, exen 🍷',
    'Drunk on features!',
    'Refactoring with rum!',
    'Ship it and sip it!',
    'Code hard, drink harder 🍹',
    'Escape() to the pub',
    'Raise a glass, not exceptions!',
    "Import beer from 'fridge' 🍺",
    "console.beer('Cheers!')",
    'While(alive) { drink(); } 🍻',
    'Docs and Draughts 📖🍺',
    'Your build is buzzed 🛠️🍷',
    'Async, await... another round 🍻',
    '404: Beer Not Found 🚫🍺',
    'Happy hour = merge conflicts 🍹',
    'Git pull, then pour 🍾',
    'Deploy, then decant 🍷',
    'Ping me at the pub 🍻',
    'TypeError: Too sober to function 🥴',
    'sudo apt-get install beer 🍺',
    'brew install chill 🍺',
    'Add shot; commit; blame 🥃',
];

/**
 * GameLogo component function.
 *
 * Initializes with a randomly selected quote from a predefined list.
 * Renders the selected quote along with the main logo image in a styled container.
 *
 * @function GameLogo
 * @returns {JSX.Element} The rendered logo and drink quote.
 */
function GameLogo() {
    /**
     * Selects a random quote on initial render.
     *
     * Uses a `useState` initializer function to compute a single quote
     * from the `drinkQuotes` array. This quote persists for the component's lifecycle.
     */
    const [quote] = useState(() => {
        const random = Math.floor(Math.random() * drinkQuotes.length);
        return drinkQuotes[random];
    });

    /**
     * Renders the logo and quote layout.
     *
     * Displays the random quote in a paragraph element above the logo image,
     * both wrapped in a container for styling consistency.
     */
    return (
        <div className="game-logo-wrapper">
            <p className="drink-quote">{quote}</p>
            <img src="logo.svg" alt="Game Logo" className="home-logo" />
        </div>
    );
}

export default GameLogo;

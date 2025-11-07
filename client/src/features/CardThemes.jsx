/**
 * @fileoverview CardThemes Component
 * <br><br>
 * This component provides various card background themes using SVG patterns. <br>
 * It includes functions to generate different card themes based on provided colors and theme IDs.
 * <br><br>
 * The component exports two main functions: `GetCardTheme` and `GetCardThemeURL`. <br>
 * `GetCardTheme` returns a JSX element with the selected card theme as a background image. <br>
 * `GetCardThemeURL` returns the URL string of the selected card theme background image.
 */

/**
 * Default card theme using a diagonal checkerboard pattern.
 */
const DefaultCard = ({ color1, color2 }) => {
    return `data:image/svg+xml,${encodeURIComponent(`
        <svg id="patternId" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="a" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="scale(1) rotate(45)">
                    <rect x="0" y="0" width="100%" height="100%" fill="${color1}"/>
                    <path d="M0 0h10v10H0z" stroke-width="1" stroke="none" fill="${color2}"/>
                    <path d="M10 10h10v10H10z" stroke-width="1" stroke="none" fill="${color2}"/>
                </pattern>
            </defs>
            <rect width="800%" height="800%" transform="translate(0,0)" fill="url(#a)"/>
        </svg>
    `)}`;
};

/**
 * Bricks card theme using a brick-like pattern.
 */
const BricksCard = ({ color1, color2 }) => {
    return `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="a" width="60" height="30" patternTransform="rotate(45) scale(0.75)" patternUnits="userSpaceOnUse">
                    <rect width="100%" height="100%" fill="#2b2b31"/>
                    <path fill="${color1}" d="M1-6.5v13h28v-13zm15 15v13h28v-13zm-15 15v13h28v-13z"/>
                    <path fill="${color2}" d="M31-6.5v13h28v-13zm-45 15v13h28v-13zm60 0v13h28v-13zm-15 15v13h28v-13z"/>
                </pattern>
            </defs>
            <rect width="800%" height="800%" fill="url(#a)"/>
        </svg>
    `)}`;
};

/**
 * Hexagon card theme using a hexagonal pattern.
 */
const HexagonCard = ({ color1, color2 }) => {
    return `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="a" width="58" height="66.981" patternTransform="rotate(15) scale(0.5)" patternUnits="userSpaceOnUse">
                    <rect width="100%" height="100%" fill="${color1}"/>
                    <path fill="${color2}" d="m57.994 92.097-14.498-8.37.002-16.745 14.5-8.373 14.498 8.37-.002 16.745zm-58 0-14.498-8.37.002-16.745 14.5-8.374 14.498 8.37-.002 16.745zM29.002 8.372 14.504.002l.002-16.745 14.5-8.373 14.498 8.37-.002 16.744zm29 16.748-14.498-8.37.002-16.745 14.5-8.373L72.504.002l-.002 16.744zm-58 0-14.498-8.37.002-16.745 14.5-8.374L14.504.001l-.002 16.745zm57.996 33.489L43.5 50.239l.002-16.745 14.5-8.374L72.5 33.49l-.002 16.745zm-29.004 16.74-14.498-8.37.002-16.744 14.5-8.374 14.498 8.37-.002 16.745zm.004-33.488L14.5 33.49l.002-16.745 14.5-8.374 14.498 8.37-.002 16.745zm-29 16.747-14.498-8.37.002-16.744 14.5-8.374L14.5 33.49l-.002 16.745z"/>
                </pattern>
            </defs>
            <rect width="800%" height="800%" fill="url(#a)"/>
        </svg>
    `)}`;
};

/**
 * Shingles card theme using a shingle-like pattern.
 */
const ShinglesCard = ({ color1, color2 }) => {
    return `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="a" width="20" height="20" patternTransform="scale(0.8) rotate(-45)" patternUnits="userSpaceOnUse">
                    <rect width="100%" height="100%" fill="#2b2b31"/>
                    <path fill="${color1}" d="M20 20v-9.334c-4.931 0-8.979 3.845-9.309 8.694 1.048.068 2.053.291 2.997.64ZM6.312 20a10.6 10.6 0 0 1 2.997-.64C8.98 14.511 4.931 10.666 0 10.666V20ZM20 6.29V0h-6.312A10.7 10.7 0 0 1 20 6.29m-20 0A10.7 10.7 0 0 1 6.312 0H0Z"/>
                    <path fill="${color2}" d="M10 16.29c1.434-3.852 5.033-6.654 9.31-6.93C18.98 4.511 14.93.666 10 .666S1.021 4.511.691 9.36c4.276.276 7.875 3.078 9.309 6.93"/>
                </pattern>
            </defs>
            <rect width="800%" height="800%" fill="url(#a)"/>
        </svg>
    `)}`;
};

/**
 * Square card theme using a square grid pattern.
 */
const SquareCard = ({ color1, color2 }) => {
    return `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="a" width="40" height="40" patternTransform="scale(0.6) rotate(45)" patternUnits="userSpaceOnUse">
                    <rect width="100%" height="100%" fill="${color2}"/>
                    <path fill="${color1}" d="M30 25c-1.108 0-2 .892-2 2v1h-1c-1.108 0-2 .892-2 2s.892 2 2 2h1v1c0 1.108.892 2 2 2s2-.892 2-2v-1h1c1.108 0 2-.892 2-2s-.892-2-2-2h-1v-1c0-1.108-.892-2-2-2M10 5c-1.108 0-2 .892-2 2v1H7c-1.108 0-2 .892-2 2s.892 2 2 2h1v1c0 1.108.892 2 2 2s2-.892 2-2v-1h1c1.108 0 2-.892 2-2s-.892-2-2-2h-1V7c0-1.108-.892-2-2-2m10 15h20v20H20zM0 0h20v20H0zm10 25c-1.108 0-2 .892-2 2v1H7c-1.108 0-2 .892-2 2s.892 2 2 2h1v1c0 1.108.892 2 2 2s2-.892 2-2v-1h1c1.108 0 2-.892 2-2s-.892-2-2-2h-1v-1c0-1.108-.892-2-2-2M30 5c-1.108 0-2 .892-2 2v1h-1c-1.108 0-2 .892-2 2s.892 2 2 2h1v1c0 1.108.892 2 2 2s2-.892 2-2v-1h1c1.108 0 2-.892 2-2s-.892-2-2-2h-1V7c0-1.108-.892-2-2-2"/>
                </pattern>
            </defs>
            <rect width="800%" height="800%" fill="url(#a)"/>
        </svg>
    `)}`;
};

/**
 * Leafs card theme using a leafy pattern.
 */
const LeafsCard = ({ color1, color2 }) => {
    return `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="a" width="50" height="50" patternTransform="scale(0.65)" patternUnits="userSpaceOnUse">
                    <rect width="100%" height="100%" fill="${color2}"/>
                    <path fill="${color1}" d="M36.445 4.336q4.57-2.226 8.282-1.406.312.039.507.312l.118.586q-.743 3.75-4.649 7.07l-.351.157q-2.735.468-4.258-1.836h-.04q-1.445-2.265.04-4.57zM50 23.125q-2.734-1.836-4.453-5.742l-.078-.39q.273-2.736 2.89-3.595L50 13.203zM29.766 0q-1.954 2.812-6.211 4.414l-.39.04q-2.736-.43-3.438-3.126L19.609 0zM0 13.203q1.564.04 2.812 1.445l.196.391q.937 5-.82 8.36l-.47.39-.585-.039L0 23.086zM19.61 50q.076-1.757 1.68-3.008l.39-.156q5.078-.625 8.28 1.367l.352.469-.078.586-.468.742zm17.54-18.36q-.978-2.538.976-4.492a.7.7 0 0 1 .352-.195q4.96-1.29 8.398.313l.43.43v.585q-1.485 3.555-5.977 5.938l-.39.078q-2.814-.078-3.79-2.617zm7.883 15.43q-5.117.47-8.281-1.68a.71.71 0 0 1-.313-.507.66.66 0 0 1 .079-.547q2.03-3.281 6.914-4.883h.39q2.735.508 3.32 3.203.509 2.696-1.718 4.297l-.39.117m-10.93-13.086q2.734.547 3.32 3.243v.039q.468 2.656-1.797 4.257l-.39.118q-5.157.39-8.243-1.797a.71.71 0 0 1-.312-.508.77.77 0 0 1 .078-.586q2.07-3.242 6.953-4.766zM10.86 6.054q-3.045 4.063-6.757 5.04l-.586-.078-.352-.47q-1.095-3.67.938-8.358l.234-.313q2.265-1.68 4.61-.352h.038q2.383 1.446 2.032 4.18l-.157.352m2.149 11.836q-1.368-4.922.078-8.399a.7.7 0 0 1 .39-.43q.274-.156.587 0 3.593 1.329 6.132 5.782l.078.39q0 2.734-2.5 3.868-2.539.975-4.53-.86zm22.383-3.868q.351 5.04-1.758 8.204l-.508.351-.586-.117q-3.242-2.07-4.805-6.914v-.39q.547-2.735 3.204-3.282h.039q2.656-.508 4.257 1.758zM1.68 43.008q3.827-3.36 7.617-3.555l.547.195.273.547q.314 3.828-2.578 8.008l-.312.234q-2.54 1.211-4.61-.585-2.031-1.875-1.172-4.493zm9.922-10.82q-5.079-.978-7.5-3.907a.63.63 0 0 1-.196-.547.8.8 0 0 1 .274-.547q2.85-2.577 7.968-2.812.235 0 .43.117 2.422 1.25 2.266 3.985v.039q-.234 2.734-2.852 3.632zm13.437-10.743q4.766 1.758 6.719 5l.117.586-.352.469q-3.202 2.148-8.242 1.523l-.39-.156q-2.228-1.68-1.641-4.336v-.039q.665-2.656 3.398-3.086zm-7.773 14.452q2.617-1.015 4.53.86h.04q1.876 1.953.898 4.57l-.273.313q-4.024 3.125-7.813 3.086l-.546-.196a.75.75 0 0 1-.235-.547q-.117-3.867 3.086-7.851z"/>
                </pattern>
            </defs>
            <rect width="800%" height="800%" fill="url(#a)"/>
        </svg>
    `)}`;
};

/**
 * Function to get the card theme component based on the provided ID and colors.
 * <br><br>
 * This function returns a div with the appropriate background image based on the selected theme ID.
 * <br><br>
 * @function GetCardTheme
 * @param {string} color1 - The first color for the card theme.
 * @param {string} color2 - The second color for the card theme.
 * @param {string} id - The ID of the card theme to retrieve.
 * @returns {JSX.Element} The card theme component with the specified background image.
 */
export const GetCardTheme = ({
    color1 = '#ffffff',
    color2 = '#ff4538',
    id,
}) => {
    let backgroundImage;

    switch (id) {
        case 'default':
            backgroundImage = `url("${DefaultCard({ color1, color2 })}")`;
            break;
        case 'bricks':
            backgroundImage = `url("${BricksCard({ color1, color2 })}")`;
            break;
        case 'hexagon':
            backgroundImage = `url("${HexagonCard({ color1, color2 })}")`;
            break;
        case 'shingles':
            backgroundImage = `url("${ShinglesCard({ color1, color2 })}")`;
            break;
        case 'square':
            backgroundImage = `url("${SquareCard({ color1, color2 })}")`;
            break;
        case 'leafs':
            backgroundImage = `url("${LeafsCard({ color1, color2 })}")`;
            break;
        default:
            backgroundImage = `url("${DefaultCard({ color1, color2 })}")`;
    }

    return (
        <div
            className="w-full h-full bg-cover bg-center shadow-[2px_2px_10px_rgba(0,0,0,0.2)]"
            style={{
                backgroundImage,
            }}
        ></div>
    );
};

/**
 * Function to get the card theme URL based on the provided ID and colors.
 * <br><br>
 * This function returns the background image URL string based on the selected theme ID.
 * <br><br>
 * @function GetCardThemeURL
 * @param {string} color1 - The first color for the card theme.
 * @param {string} color2 - The second color for the card theme.
 * @param {string} id - The ID of the card theme to retrieve.
 * @returns {string} The background image URL string for the specified card theme.
 */
export const GetCardThemeURL = ({
    color1 = '#ffffff',
    color2 = '#ff4538',
    id,
}) => {
    let backgroundImage;

    switch (id) {
        case 'default':
            backgroundImage = `url("${DefaultCard({ color1, color2 })}")`;
            break;
        case 'bricks':
            backgroundImage = `url("${BricksCard({ color1, color2 })}")`;
            break;
        case 'hexagon':
            backgroundImage = `url("${HexagonCard({ color1, color2 })}")`;
            break;
        case 'shingles':
            backgroundImage = `url("${ShinglesCard({ color1, color2 })}")`;
            break;
        case 'square':
            backgroundImage = `url("${SquareCard({ color1, color2 })}")`;
            break;
        case 'leafs':
            backgroundImage = `url("${LeafsCard({ color1, color2 })}")`;
            break;
        default:
            backgroundImage = `url("${DefaultCard({ color1, color2 })}")`;
    }

    return backgroundImage;
};

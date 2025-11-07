/**
 * @fileoverview Card component to display a playing card with front and back sides.
 * <br><br>
 * This component handles the rendering of a card, including its front and back images,
 * as well as hover and click interactions.
 */

// Features
import { GetCardThemeURL } from "./CardThemes";

/**
 * A component that displays a playing card with front and back sides.
 * <br><br>
 * It handles the rendering of a card, including its front and back images,
 * as well as hover and click interactions.
 * <br><br>
 * 
 * @function Card
 * @param {number} index - The index of the card in the deck or hand.
 * @param {object} card - The card object containing its properties (number, type, flipped).
 * @param {function} onClick - The function to call when the card is clicked.
 * @param {function} onMouseEnter - The function to call when the mouse enters the card area.
 * @param {function} onMouseLeave - The function to call when the mouse leaves the card area.
 * @param {string} theme - The theme identifier for the card back design.
 * @param {string} color1 - The first color for the card back theme.
 * @param {string} color2 - The second color for the card back theme.
 * @param {boolean} [recline=false] - Whether the card should be displayed in a reclined position.
 * @param {boolean} [backHover=true] - Whether the back side of the card should have hover effects.
 * @param {JSX.Element} [hoverButtons=null] - Optional overlay buttons to display on hover.
 * @returns {JSX.Element} The rendered card component.
 */
function Card({ index, card, onClick, onMouseEnter, onMouseLeave, theme, color1, color2, recline=false, backHover=true, hoverButtons=null}) {
    const cardBackStyle = GetCardThemeURL({ color1, color2, id: theme });
    
    const wrapperTransform = card.flipped ? "rotateY(0deg)" : "rotateY(180deg)";
    const frontTransform = recline ? "rotate(90deg)" : "rotate(0deg)";
    const backSideHover = backHover ? "[transform:rotateY(180deg)] hover:[transform:rotateY(180deg)_translateX(2.5px)]" : "[transform:rotateY(180deg)]";

    /**
     * Handles the card hover and click effects based on the `recline` prop.
     */
    let cardTransform = !recline ? `
        hover:[transform:translateY(-20px)] 
        active:shadow-[2px_2px_4px_rgba(0,0,0,0.3)]
        active:[transform:translateY(-10px)]
    ` : "";

    /**
     * Default no-op function for onClick if not provided.
     */
    if(onClick === undefined) {
        onClick = () => {};
        cardTransform = "";
    }

    if(onMouseEnter === undefined) onMouseEnter = () => {};
    if(onMouseLeave === undefined) onMouseLeave = () => {};

    return (
        <>
            <div
                key={index}
                onClick={() => onClick(index)}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                className="card-wrapper"
                style={{
                    transform: `${wrapperTransform} ${frontTransform}`,
                }}
            >
                {/* Front */}
                <div
                    className={`card-front ${cardTransform}`}
                    style={{
                        backgroundImage: `url(/cards/${card.number}${card.type[0].toUpperCase()}.svg)`,
                    }}
                />

                {/* Back */}
                <div
                    className={`card-back ${backSideHover}`}
                    style={{
                        backgroundImage: cardBackStyle
                    }}
                />

                {/* Optional hover button overlay */}
                {hoverButtons && hoverButtons}
            </div>
        </>
    );
}

export default Card;

/**
 * @fileoverview Component to display turn information with highlighted player and drink details.
 * <br><br>
 * This component renders a paragraph that highlights the current player's name and drink count using specific CSS classes. <br>
 * It receives player and drink information as props.
 */

/**
 * A component that displays turn information with highlighted player and drink details. <br>
 * It receives player and drink information as props.
 * <br><br>
 * 
 * @function TurnInfo
 * @param {Object} playerRow - An object containing the current player's name and info.
 * @param {Object} drinkRow - An object containing the current drink's name and info.
 * @returns {JSX.Element} The rendered turn information component.
 */
function TurnInfo({ playerRow, drinkRow }) {
    return (
        <p className="turn-info-wrapper">
            <span className="highlight-player"> {playerRow.name} </span> {playerRow.info}
            <span className="highlight-count"> {drinkRow.name} </span> {drinkRow.info}
        </p>
    );
};

export default TurnInfo;
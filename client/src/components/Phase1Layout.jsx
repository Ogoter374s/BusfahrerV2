// Features
import { GetCardThemeURL } from '../features/CardThemes';

function Phase1Layout({ 
    gameCards, 
    color1, 
    color2, 
    theme, 
    handleRowClick 
}) {
    return (
        <div className="phase1-cards">
            {gameCards.map((row, rowIdx) => (
                <div key={rowIdx} className="phase-row">
                    {row.map((card, colIdx) => {
                        const cardIdx = (rowIdx * (rowIdx + 1)) / 2 + colIdx;
                        return (
                            <div
                                key={cardIdx}
                                className={`card ${card.flipped ? "flipped" : ""}`}
                                onClick={() => handleRowClick(rowIdx + 1)}
                            >
                                <img
                                    className="front"
                                    src={`/cards/${card.number}${card.type[0].toUpperCase()}.svg`}
                                    alt="Card Front"
                                />
                                <img
                                    className="back"
                                    style={{
                                        backgroundImage: GetCardThemeURL({
                                            color1,
                                            color2,
                                            id: theme,
                                        }),
                                    }}
                                    draggable={false}
                                />
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default Phase1Layout;
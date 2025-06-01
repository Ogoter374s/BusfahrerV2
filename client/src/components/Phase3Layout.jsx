
// Features
import { GetCardThemeURL } from '../features/CardThemes';

// React
import { useState } from 'react';

function Phase3Layout({ 
    gameCards,
    color1,
    color2,
    theme,
    round,
    isLast,
    isBusfahrer,
    checkCard,
 }) {
    const [hoverCard, setHoverCard] = useState(null);

    const getCardIdx = (rowIdx, colIdx) => {
        const rowSizes = [2, 2, 3, 4, 5, 4, 3, 2, 2];

        let totalCardsBefore = 0;
        // Sum up the number of cards before the target row
        for (let i = 0; i < rowIdx; i++) {
            totalCardsBefore += rowSizes[i];
        }

        // Compute and return the absolute card index
        return totalCardsBefore + colIdx;
    };

    return (
        <div className="phase3-cards">
            {gameCards.map((row, rowIdx) => (
                <div key={rowIdx} className="phase3-row">
                    {row.map((card, colIdx) => {
                        const cardIdx = getCardIdx(rowIdx, colIdx);

                        return (
                            <div
                                key={cardIdx}
                                className={`card ${card.flipped ? 'flipped' : ''} ${cardIdx}`}
                                onMouseEnter={() => setHoverCard(cardIdx)}
                                onMouseLeave={() => setHoverCard(null)}
                            >
                                {/* Card Front */}
                                <img
                                    className="front"
                                    src={`/cards/${card.number}${card.type[0].toUpperCase()}.svg`}
                                    alt="Card Front"
                                />

                                {/* Card Back */}
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

                                {/* Action buttons */}
                                {hoverCard === cardIdx &&
                                    isBusfahrer &&
                                    !card.flipped &&
                                    round === rowIdx + 1 && (
                                        <div className="card-buttons">
                                            {round === 9 || isLast ? (
                                                <>
                                                    <button
                                                        className="card-btn"
                                                        onClick={() =>
                                                            checkCard(
                                                                cardIdx,
                                                                'equal'
                                                            )
                                                        }
                                                    >
                                                        =
                                                    </button>
                                                    <button
                                                        className="card-btn"
                                                        onClick={() =>
                                                            checkCard(
                                                                cardIdx,
                                                                'unequal'
                                                            )
                                                        }
                                                    >
                                                        ≠
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        className="card-btn higher"
                                                        onClick={() =>
                                                            checkCard(
                                                                cardIdx,
                                                                'higher'
                                                            )
                                                        }
                                                    >
                                                        &lt;
                                                    </button>
                                                    <button
                                                        className="card-btn"
                                                        onClick={() =>
                                                            checkCard(
                                                                cardIdx,
                                                                'same'
                                                            )
                                                        }
                                                    >
                                                        =
                                                    </button>
                                                    <button
                                                        className="card-btn lower"
                                                        onClick={() =>
                                                            checkCard(
                                                                cardIdx,
                                                                'lower'
                                                            )
                                                        }
                                                    >
                                                        &gt;
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default Phase3Layout;
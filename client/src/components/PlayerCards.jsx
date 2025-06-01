function PlayerCards({ playerCards, handleLayCard }) {
    return (
        <div className="player-cards">
            {playerCards
                .map((card, originalIndex) => ({ card, originalIndex }))
                .filter(({ card }) => !card.played)
                .map(({ card, originalIndex }) => (
                    <div
                        key={originalIndex}
                        className="card show"
                        onClick={() => handleLayCard(originalIndex)}
                    >
                        <img
                            className="front"
                            src={`/cards/${card.number}${card.type[0].toUpperCase()}.svg`}
                            alt="Card Front"
                        />
                        <img className="back" draggable={false} />
                    </div>
                ))}
        </div>
    );
};

export default PlayerCards;
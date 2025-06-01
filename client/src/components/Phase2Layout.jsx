
function Phase2Layout({ gameCards }) {
    return (
        <div className="phase2-cards">
            {gameCards.map((card, colIdx) =>
                card[0] && card[0].type ? (
                    <div key={colIdx} className="card show">
                        {/* Front image of the card */}
                        <img
                            className="front"
                            src={`/cards/${card[0].number}${card[0].type[0].toUpperCase()}.svg`}
                            alt="Card Front"
                        />
                        {/* Back of the card */}
                        <img className="back" draggable={false} />
                    </div>
                ) : null,
            )}
        </div>
    );
};

export default Phase2Layout;
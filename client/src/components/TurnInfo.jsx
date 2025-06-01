function TurnInfo({ 
    phase = "phase1",
    isNextPhase, 
    currentName, 
    drinkCount, 
    currentRound = 1, 
    hasToEx = false
 }) {
    if (phase === "phase2") {
        return (
            <p className="turn-info-phase2">
                {isNextPhase ? (
                    <>
                        <span className="current-player">Phase 3 </span> kann
                        <span className="drink-count"> gestartet </span> werden!
                    </>
                ) : currentRound === 3 ? (
                    <>
                        <span className="current-player"> {currentName} </span> muss das Glas
                        <span className="drink-count"> {hasToEx ? 'exen' : 'nicht exen'} </span>
                    </>
                ) : (
                    <>
                        <span className="current-player"> {currentName} </span> muss
                        <span className="drink-count"> {drinkCount} </span> Schlucke trinken
                    </>
                )}
            </p>
        );
    }

    return (
        <p className="turn-info">
            {isNextPhase ? (
                <>
                    <span className="current-player">Phase 2 </span> kann
                    <span className="drink-count"> gestartet </span> werden!
                </>
            ) : (
                <>
                    <span className="current-player"> {currentName} </span> darf
                    <span className="drink-count"> {drinkCount} </span> Schlucke verteilen
                </>
            )}
        </p>
    );
};

export default TurnInfo;
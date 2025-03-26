import React from "react";
import BASE_URL from "./config";

function AvatarInfo({ players, currentPlayerId }) {
    if (!players?.length) return null;

    return (
        <div className="player-avatars">
            {players.map((player) => (
                <div
                    key={player.id}
                    className={`avatar-container ${player.id === currentPlayerId ? "active-player" : ""}`}
                >
                    <img
                        src={`${BASE_URL}avatars/${player.avatar}`}
                        alt={player.name}
                        className="avatar-image"
                    />
                </div>
            ))}
        </div>
    );
}

export default AvatarInfo;
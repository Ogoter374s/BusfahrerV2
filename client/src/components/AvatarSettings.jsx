import { SoundManager } from "../utils/soundManager";
import Avatar from "./AvatarIcon";

function AvatarSettings({ selectedAvatar, accountInfo, setShowAvatarModal, setShowLevelModal }) {

    const {
        playerName,
        playerLevel,
        playerXp,
        xpPoints,
        levels
    } = accountInfo;

    const pointsActive = xpPoints > 0 ? 'points-active' : '';

    let xpPrecentage = 0;
    if(levels && levels.length !== 0) {
        xpPrecentage = ((playerXp / levels[playerLevel - 1].xpRequired) * 100 || 0).toFixed(1);
    }

    return (
        <div className="flex flex-col items-center text-center">
            {/* Avatar selection and upload */}
            <Avatar
                src={selectedAvatar}
                isLocal
                onClick={() => setShowAvatarModal(true)}
            />

            <div className="flex flex-row justify-between">
                <p className="text-[2rem] text-white mr-4">
                    {playerName}
                </p>

                <p className="text-[2rem] text-[#FF9CA3] mr-1.5">
                    {playerLevel}
                </p>

                <p className="text-[2rem]">
                    lvl
                </p>
            </div>

            <div className="xp-frame" onClick={() => {SoundManager.playClickSound(); setShowLevelModal(true)}}>
                {xpPoints > 0 &&
                    <div className="xp-points">+{xpPoints}</div>
                }

                <div className={`xp-bar ${pointsActive}`}>
                    <div className="xp-fill" style={{ width: `${xpPrecentage}%` }}></div>
                    {xpPoints <= 0 &&
                        <span className="xp-text">{xpPrecentage}%</span>
                    }
                </div>
            </div>
        </div>
    );
}

export default AvatarSettings;
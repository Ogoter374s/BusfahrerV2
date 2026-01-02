
// Features
import UpgradeGrid from "../features/UpgradeGrid";
import Octagon from "../features/Octagon";

// Utilities
import { SoundManager } from '../utils/soundManager';
import { REWARD_TYPES } from "../utils/constants";

// React
import { useEffect, useRef, useState } from "react";

function XPBar({ current, required }) {
    const percentage = Math.min(100, Math.round((current / required) * 100));

    let xpText = "";
    if(current < required) {
        xpText = `${current} / ${required} XP`;
    } else {
        xpText = required + ' XP';
    }
    

    return (
        <div className="
            relative
            w-[400px]
            mt-3
            flex flex-col
            items-center
            mb-3
            transition-transform duration-250 ease-in-out origin-right
        ">
            <div className="xp-bar">
                <div className="xp-fill" style={{ width: `${percentage}%` }}></div>

                <span className="absolute
                    top-1/2 left-1/2
                    transform -translate-x-1/2 -translate-y-1/2
                    font-sans
                    text-white
                    font-bold
                    text-[1.5rem]
                    w-full
                    pointer-events-none
                    select-none
                ">
                    {xpText}
                </span>
            </div>
        </div>
    );
}

function LevelDisplay({
    isOpen, onClose, accountInfo, unlockNode
}) {
    if (!isOpen) return null;

    const tabs = ['upgrades', 'levels'];

    const scrollRef = useRef(null);
    
    const [savedScrollPos, setSavedScrollPos] = useState(0);
    const [selectedNode, setSelectedNode] = useState(null);
    const [expandedLevel, setExpandedLevel] = useState(null);
    const [activeTab, setActiveTab] = useState(0);

    const {
        playerLevel,
        xpPoints,
        upgrades,
        modifiers,
        perks,
        levels,
    } = accountInfo;

    const handleNodeClick = (node) => {
        SoundManager.playClickSound();
        setSelectedNode(node);
    };

    const changeTab = () => {
        SoundManager.playClickSound();
        setActiveTab((prevTab) => (prevTab + 1) % tabs.length);
    };

    useEffect(() => {
        if(tabs[activeTab] === 'levels' && scrollRef.current) {
            scrollRef.current.scrollTop = savedScrollPos;
        }
    }, [activeTab])

    return (
        <div className="modal-style">
            <div className="level-display-wrapper">
                {/* Left Tab Button */}
                <button
                    onClick={changeTab}
                    className="
                        absolute 
                        left-4
                        top-4
                        bg-[#e33e3e]
                        text-white
                        text-[2.5rem]
                        rounded
                        transition-all duration-200
                        z-40
                    "
                >
                    <img src="/icons/arrow_left.svg" className="w-30 h-20" />
                </button>

                {/* Right Tab Button */}
                <button
                    onClick={changeTab}
                    className="
                        absolute 
                        right-4
                        top-4
                        bg-[#e33e3e]
                        text-white
                        text-[2.5rem]
                        rounded
                        transition-all duration-200
                        transform scale-x-[-1]
                        z-40
                    "
                >
                    <img src="/icons/arrow_left.svg" className="w-30 h-20" />
                </button>

                {tabs[activeTab] === 'upgrades' && (
                    <>
                        <h2 className="cropper-h2">
                            Spend Your Level Points
                        </h2>

                        {/* Display Level Tree */}
                        <div className="level-tree-wrapper">
                            <div className="upgrade-grid">
                                <UpgradeGrid
                                    upgrades={upgrades}
                                    xpPoints={xpPoints}
                                    onNodeClick={handleNodeClick}
                                />
                            </div>
                        </div>

                        {selectedNode && (
                            <>
                                <div
                                    className="
                                        absolute 
                                        bottom-30 left-1/2 
                                        w-[450px] 
                                        transform -translate-x-1/2 
                                        p-3
                                    "
                                >
                                    {/* Title */}
                                    <h2 className="text-[1.75rem] font-bold text-orange-300 mb-1">
                                        {selectedNode.node.name ?? "Unnamed Node"}
                                    </h2>

                                    {/* Icon */}
                                    <img
                                        src={`icons/${selectedNode.node.icon}`}
                                        alt=""
                                        className="w-20 h-20 mx-auto mb-1"
                                    />

                                    {/* Description */}
                                    <p className="text-[1.5rem] text-gray-200 mb-1">
                                        {selectedNode.node.description ?? "No description available"}
                                    </p>

                                    {/* Modifier info */}
                                    {selectedNode.type === "modifier" && (
                                        <p className="text-green-400 font-semibold mb-2 text-[1.25rem]">
                                            Current Modifier: {selectedNode.node.multiplier}%
                                        </p>
                                    )}
                                </div>

                                {/* Unlock button */}
                                {!selectedNode.unlocked ? (
                                    <button
                                        onClick={() => unlockNode(selectedNode)}
                                        className="
                                            absolute
                                            bottom-23 left-1/2
                                            transform -translate-x-1/2
                                            w-[450px]
                                            py-2 
                                            rounded-lg 
                                            bg-red-800 hover:bg-red-500 
                                            text-black font-bold 
                                            text-[1.35rem] 
                                            hover:scale-105
                                            active:scale-100
                                            transition-all duration-200
                                            z-25
                                "
                                    >
                                        Unlock (Cost: 1 point)
                                    </button>
                                ) : (
                                    <p className="
                                        text-yellow-300 text-center font-bold

                            ">
                                        Already Unlocked
                                    </p>
                                )}
                            </>
                        )}
                    </>
                )}

                {tabs[activeTab] === 'levels' && (
                    <>
                        <h2 className="cropper-h2">
                            Level Progression
                        </h2>

                        <div
                            ref = {scrollRef}
                            onScroll={(e) => setSavedScrollPos(e.target.scrollTop)}
                            className="
                                relative
                                flex flex-col items-center justify-start
                                mt-2
                                mb-2
                                w-[1050px]
                                min-h-[750px]
                                max-h-[750px]
                                auto-scrollbar
                                overflow-y-auto
                                pr-4
                            "
                        >
                            {levels.map((lvl) => {
                                const isOpen = expandedLevel === lvl.level;

                                return (
                                    <div
                                        key={lvl.level}
                                        className="
                                            w-full 
                                            border-2 
                                            border-[#a65a2e]
                                            rounded-xl 
                                            bg-[#1e1e1e]/80
                                            mb-4
                                            px-4 py-3 transition-all duration-300
                                    ">
                                        <div
                                            className="flex flex-row items-center justify-between cursor-pointer"
                                            onClick={() => {
                                                if (lvl.type === REWARD_TYPES.PERK) {
                                                    SoundManager.playClickSound();
                                                    setExpandedLevel(isOpen ? null : lvl.level);
                                                }
                                            }}
                                        >
                                            {/* Level Badge */}
                                            <div className="flex items-center gap-3 w-1/4">
                                                <div className="relative w-24 h-24">
                                                    <img
                                                        src="/icons/level.svg"
                                                        alt="Level Icon"
                                                    />

                                                    <span className="
                                                        absolute inset-0 flex items-center justify-center
                                                        text-black font-bold text-[1.25rem]
                                                        mb-0.5
                                                        select-none
                                                    ">
                                                        {lvl.level}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Reward or No Reward */}
                                            <div className="flex flex-col w-1/3 items-center">
                                                <div className="flex items-center gap-2 group select-none">
                                                    {lvl.type !== REWARD_TYPES.NONE ? (
                                                        <>
                                                            {lvl.type !== REWARD_TYPES.TITLE && (
                                                                <img
                                                                    src={`${lvl.type === REWARD_TYPES.FRAME
                                                                        ? `/frames/${lvl.reward.icon}`
                                                                        : `/icons/${lvl.reward.icon}`}`}
                                                                    alt="Reward Icon"
                                                                    className="w-30 h-30 transition-transform group-hover:scale-110"
                                                                />
                                                            )}

                                                            {lvl.type !== REWARD_TYPES.FRAME && (
                                                                <p
                                                                    className="text-white text-[1.85rem] font-semibold"
                                                                    style={{
                                                                        color: lvl.type === REWARD_TYPES.TITLE ? lvl.reward.color : "white",
                                                                        textShadow:
                                                                            lvl.type === REWARD_TYPES.TITLE
                                                                                ? `0 0 1px ${lvl.reward.color}, 0 0 40px ${lvl.reward.color}AA`
                                                                                : lvl.type === REWARD_TYPES.PERK
                                                                                    ? `0 0 1px #FCD34D, 0 0 40px #FCD34DAA`
                                                                                    : "none"
                                                                    }}
                                                                >
                                                                    {lvl.reward.name}
                                                                </p>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <p className="text-gray-500 text-[1.85rem] font-semibold select-none">
                                                            No Reward
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Level XP Info */}
                                            <div className="w-1/4 flex justify-end">
                                                <XPBar
                                                    current={xpPoints}
                                                    required={lvl.xpRequired}
                                                />
                                            </div>
                                        </div>

                                        {/* Expanded Reward Details */}
                                        {expandedLevel === lvl.level && lvl.reward && (
                                            <div className="
                                            mt-2 p-3
                                            bg-black/40 border border-[#a65a2e] rounded-lg
                                            text-white text-[1.65rem] leading-relaxed
                                            animate-fadeIn
                                        ">
                                                {lvl.reward.description}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="modal-btn"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default LevelDisplay;

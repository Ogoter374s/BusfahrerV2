
// Components
import MenuSelect from "./MenuSelect";

// Utilities
import { SoundManager } from "../utils/soundManager";
import { SOUND_TYPES } from "../utils/constants";
import BASE_URL from '../utils/config';

// React
import { useState, useRef } from "react";

function SoundSettings({ soundSettings, uploadedSounds, setSoundSettings }) {
    const uploadRef = useRef(null);
    const typeRef = useRef(null);

    const [collapsed, setCollapsed] = useState(false);
    const [collapsedSound, setCollapsedSound] = useState(false);

    const [toggleSound, setToggleSound] = useState(SoundManager.isEnabled());
    const [toggleEventSound, setToggleEventSound] = useState(SoundManager.isEventEnabled());

    const clickSoundOptions = [
        ...SoundManager.getClickSounds(),
        ...uploadedSounds
            .filter(s => s.type === SOUND_TYPES.CLICK && s.name !== "")
            .map(s => ({ name: "Custom Click", value: s.name, path: s.name })),
        { name: "Upload Custom Sound", value: "upload", path: "custom_click_sound.mp3" },
    ]

    const layCardSoundOptions = [
        ...SoundManager.getLayCardSounds(),
        ...uploadedSounds
            .filter(s => s.type === SOUND_TYPES.LAY_CARD && s.name !== "")
            .map(s => ({ name: "Custom Lay Card", value: s.name, path: s.name })),
        { name: "Upload Custom Sound", value: "upload", path: "custom_lay_card_sound.mp3" },
    ]

    const rowFlipSoundOptions = [
        ...SoundManager.getRowFlipSounds(),
        ...uploadedSounds
            .filter(s => s.type === SOUND_TYPES.ROW_FLIP && s.name !== "")
            .map(s => ({ name: "Custom Row Flip", value: s.name, path: s.name })),
        { name: "Upload Custom Sound", value: "upload", path: "custom_row_flip_sound.mp3" },
    ]

    const exSoundOptions = [
        ...SoundManager.getExSounds(),
        ...uploadedSounds
            .filter(s => s.type === SOUND_TYPES.EX && s.name !== "")
            .map(s => ({ name: "Custom Ex", value: s.name, path: s.name })),
        { name: "Upload Custom Sound", value: "upload", path: "custom_ex_sound.mp3" },
    ]

    const loseSoundOptions = [
        ...SoundManager.getLoseSounds(),
        ...uploadedSounds
            .filter(s => s.type === SOUND_TYPES.LOSE && s.name !== "")
            .map(s => ({ name: "Custom Lose", value: s.name, path: s.name })),
        { name: "Upload Custom Sound", value: "upload", path: "custom_lose_sound.mp3" },
    ]

    const winSoundOptions = [
        ...SoundManager.getWinSounds(),
        ...uploadedSounds
            .filter(s => s.type === SOUND_TYPES.WIN && s.name !== "")
            .map(s => ({ name: "Custom Win", value: s.name, path: s.name })),
        { name: "Upload Custom Sound", value: "upload", path: "custom_win_sound.mp3" },
    ]

    const toggleSoundOption = () => {
        SoundManager.toggleSound(!SoundManager.isEnabled());
        setToggleSound(SoundManager.isEnabled());
        SoundManager.playClickSound();
    };

    const toggleEventSoundOption = () => {
        SoundManager.toggleEventSound(!SoundManager.isEventEnabled());
        setToggleEventSound(SoundManager.isEventEnabled());
        SoundManager.playClickSound();
    };

    const handleSoundSelection = (e, soundType) => {
        const value = e.target.value;

        if (value === "upload") {
            uploadRef.current.click();
            typeRef.current = soundType;
            return;
        }

        changeClickSound(e, soundType);
    }

    const changeClickSound = (e, soundType) => {
        const selectedOption = e.target.selectedOptions[0];
        const soundPath = selectedOption.getAttribute('data-path');

        setSoundSettings(prev => ({
            ...prev,
            [soundType]: soundPath,
        }));

        SoundManager.userSoundChange(soundType, soundPath);
    };

    const toggleCollapse = () => {
        SoundManager.playClickSound();
        setCollapsed(!collapsed);
    };

    const toggleCollapseSound = () => {
        SoundManager.playClickSound();
        setCollapsedSound(!collapsedSound);
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const audio = document.createElement('audio');
        audio.src = URL.createObjectURL(file);

        audio.onloadedmetadata = async () => {
            if (audio.duration > 10) {
                alert("Please upload a sound file shorter than 10 seconds.");
                return;
            }

            const formData = new FormData();
            formData.append('soundType', typeRef.current);
            formData.append('sound', file);

            try {
                const response = await fetch(`${BASE_URL}upload-sound`, {
                    method: 'POST',
                    credentials: 'include',
                    body: formData,
                });

                const data = await response.json();
            }
            catch (error) {
                console.error("Error uploading sound file:", error);
            }
        };
    };

    return (
        <div className="flex flex-col gap-1 w-full items-center">

            {/* Header and Collapse Control */}
            <div
                onClick={toggleCollapse}
                className="flex items-center justify-center cursor-pointer border-b-3 border-[#f5e1a4] select-none gap-2 w-[400px]"
            >
                {/* Collapse Icon */}
                <img
                    src="/icons/arrow_right.svg"
                    alt="toggle"
                    className={`w-8 h-8 transition-transform duration-200 filter-sand ${collapsed ? '' : 'rotate-90'}`}
                />

                <h2 className="text-[2rem] text-[#f5e1a4] font-bold">
                    Sound Settings
                </h2>
            </div>

            {!collapsed && (
                <>

                    {/* Enable/Disable all sounds */}
                    <div
                        className="flex items-center gap-3 cursor-pointer select-none"
                        onClick={() => {
                            toggleSoundOption();
                        }}
                    >
                        <img
                            src={toggleSound ? "/icons/sound_enabled.svg" : "/icons/sound_disabled.svg"}
                            alt="Toggle Sound"
                            className="w-12 h-12 hover:scale-110 active:scale-90 transition-transform duration-300"
                            draggable={false}
                        />

                        <p className="text-white text-[1.5rem]">
                            {toggleSound ? 'Disable Sounds' : 'Enable Sounds'}
                        </p>
                    </div>

                    {/* Enable/Disable all Super Events */}
                    <div
                        className="flex items-center gap-3 cursor-pointer select-none"
                        onClick={() => {
                            toggleEventSoundOption();
                        }}
                    >
                        <img
                            src={toggleEventSound ? "/icons/sound_enabled.svg" : "/icons/sound_disabled.svg"}
                            alt="Toggle Sound"
                            className="w-12 h-12 hover:scale-110 active:scale-90 transition-transform duration-300"
                            draggable={false}
                        />

                        <p className="text-white text-[1.5rem]">
                            {toggleEventSound ? 'Disable Event Sounds' : 'Enable Event Sounds'}
                        </p>
                    </div>

                    <div
                        onClick={toggleCollapseSound}
                        className="flex items-center justify-center border-b-3 border-white w-[350px] mb-2 gap-2"
                    >
                        {/* Collapse Sound Icon */}
                        <img
                            src="/icons/arrow_right.svg"
                            alt="toggle"
                            className={`w-6 h-6 transition-transform duration-200 filter-white ${collapsedSound ? '' : 'rotate-90'}`}
                        />

                        <h2 className="text-[1.8rem] text-white font bold">
                            Sound Options
                        </h2>
                    </div>

                    {!collapsedSound && (
                        <>

                            {/* Click Sound selection dropdown */}
                            <MenuSelect
                                label="Select Click Sound:"
                                id="optionsSelect"
                                value={soundSettings.click}
                                onChange={(e) => {
                                    handleSoundSelection(e, SOUND_TYPES.CLICK);
                                }}
                                options={clickSoundOptions}
                                labelClass="sound-label"
                                playSound={false}
                            />

                            {/* Card Lay Sound selection dropdown */}
                            <MenuSelect
                                label="Select Card Lay Sound:"
                                id="optionsSelect"
                                value={soundSettings.layCard}
                                onChange={(e) => {
                                    handleSoundSelection(e, SOUND_TYPES.LAY_CARD);
                                }}
                                options={layCardSoundOptions}
                                labelClass="sound-label"
                                playSound={false}
                            />

                            {/* Row Flip Sound selection dropdown */}
                            <MenuSelect
                                label="Select Row Flip Sound:"
                                id="optionsSelect"
                                value={soundSettings.flipRow}
                                onChange={(e) => {
                                    handleSoundSelection(e, SOUND_TYPES.ROW_FLIP);
                                }}
                                options={rowFlipSoundOptions}
                                labelClass="sound-label"
                                playSound={false}
                            />

                            {/* Ex Sound selection dropdown */}
                            <MenuSelect
                                label="Select Ex Sound:"
                                id="optionsSelect"
                                value={soundSettings.ex}
                                onChange={(e) => {
                                    handleSoundSelection(e, SOUND_TYPES.EX);
                                }}
                                options={exSoundOptions}
                                labelClass="sound-label"
                                playSound={false}
                            />

                            {/* Lose Sound selection dropdown */}
                            <MenuSelect
                                label="Select Lose Sound:"
                                id="optionsSelect"
                                value={soundSettings.lose}
                                onChange={(e) => {
                                    handleSoundSelection(e, SOUND_TYPES.LOSE);
                                }}
                                options={loseSoundOptions}
                                labelClass="sound-label"
                                playSound={false}
                            />

                            {/* Win Sound selection dropdown */}
                            <MenuSelect
                                label="Select Win Sound:"
                                id="optionsSelect"
                                value={soundSettings.win}
                                onChange={(e) => {
                                    handleSoundSelection(e, SOUND_TYPES.WIN);
                                }}
                                options={winSoundOptions}
                                labelClass="sound-label"
                                playSound={false}
                            />

                        </>
                    )}
                </>
            )}

            <input
                type="file"
                accept="audio/*"
                ref={uploadRef}
                className="hidden"
                onChange={handleFileUpload}
            />
        </div>
    );
}

export default SoundSettings;
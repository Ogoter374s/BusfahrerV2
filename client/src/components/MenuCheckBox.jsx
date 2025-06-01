// Utilities
import { SoundManager } from "../utils/soundManager";

// React
import React from "react";

const MenuCheckBox = ({
    label,
    value,
    onChange,
    className = "options-selection",
    selectType = {},
}) => {
    return (
        <div className={className}>
            <label className="rustic-checkbox">
                <input
                    type={selectType}
                    checked={value}
                    onChange={onChange}
                    onClick={() => SoundManager.playClickSound()}
                />
                {label}
            </label>
        </div>
    );
};

export default MenuCheckBox;
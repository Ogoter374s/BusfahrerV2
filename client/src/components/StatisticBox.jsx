/**
 * @fileoverview Component to display user statistics in a styled box.
 * <br><br>
 * This component renders a box containing user statistics with labels and values.<br>
 * It receives statistics data and labels as props and displays them in a scrollable list.
 */

// Utilities
import { SoundManager } from '../utils/soundManager';

// React
import { useMemo, useState } from 'react';

/**
 * A component that displays user statistics in a styled box. <br>
 * It receives statistics data and labels as props and displays them in a scrollable list.
 * <br><br>
 * The component is styled using Tailwind CSS classes for a consistent look and feel. <br>
 * It includes a title and a list of statistics, each with a label and its corresponding value. <br>
 * The list is scrollable to accommodate a large number of statistics.
 * <br><br>
 * @function StatisticBox
 * @param {Object} statistics - An object containing user statistics where keys are statistic names and values are their corresponding values.
 * @param {Array} statLabels - An array of objects defining statistic keys and their corresponding labels.
 * @returns {JSX.Element} The rendered statistics box component.
 */
const StatisticBox = ({ statistics, statLabels }) => {
    const [collapsed, setCollapsed] = useState({});
    const labelMap = useMemo(
        () =>
            Object.fromEntries(
                statLabels.map(({ key, label }) => [key, label]),
            ),
        [statLabels],
    );

    const toggleCollapse = (groupKey) => {
        SoundManager.playClickSound();
        setCollapsed((prev) => ({
            ...prev,
            [groupKey]: !prev[groupKey],
        }));
    };

    return (
        <div className="statistics-wrapper">
            <h2 className="statistics-title">Statistics</h2>

            <div className="statistics-list">
                {/* Grouping statistics by category */}
                {Object.entries(statistics).map(([groupKey, groupStats]) => {
                    const isCollapsed = collapsed[groupKey] ?? false;

                    return (
                        <div key={groupKey} className="mb-4">
                            {/* Group header with collapse control */}
                            <div
                                onClick={() => toggleCollapse(groupKey)}
                                className="
                                flex items-center cursor-pointer 
                                border-b-3 border-[#f5e1a4] select-none 
                                gap-2
                                w-[450px]
                            "
                            >
                                <img
                                    src="/icons/arrow_right.svg"
                                    alt="toggle"
                                    className={`w-8 h-8 transition-transform duration-200 filter-sand ${
                                        isCollapsed ? '' : 'rotate-90'
                                    }`}
                                />

                                <h2 className="text-[2rem] text-[#f5e1a4] font-bold">
                                    {labelMap[groupKey] ?? groupKey}
                                </h2>
                            </div>

                            {/* Group content */}
                            {!isCollapsed && (
                                <div className="text-white">
                                    {Object.entries(groupStats)
                                        .sort(([a], [b]) =>
                                            (labelMap[a] ?? a).localeCompare(
                                                labelMap[b] ?? b,
                                            ),
                                        )
                                        .map(([key, value]) => (
                                            <p
                                                key={key}
                                                className="statistics-item"
                                            >
                                                <span>
                                                    {labelMap[key] ?? key}:
                                                </span>{' '}
                                                {value ?? 0}
                                            </p>
                                        ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StatisticBox;

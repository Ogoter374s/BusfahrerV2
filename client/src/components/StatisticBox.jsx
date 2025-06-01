/**
 * StatisticBox.jsx — Displays a formatted list of player statistics.
 *
 * Dynamically renders stat values paired with their corresponding labels.
 * Commonly used in user profiles or account settings panels.
 */

// React
import React from 'react';

/**
 * StatisticBox component function.
 *
 * Renders a labeled list of statistics using provided keys and labels.
 * Falls back to zero if a stat value is missing or undefined.
 *
 * @function StatisticBox
 * @param {Object} props - Component properties.
 * @param {Object} props.statistics - Object mapping stat keys to their values.
 * @param {Array<Object>} props.statLabels - Array of { key, label } pairs to display.
 * @returns {JSX.Element} A container element with heading and stat entries.
 */
const StatisticBox = ({ statistics, statLabels }) => {

    /**
     * Renders the statistics layout.
     *
     * Includes a header and iterates over each `statLabel` to display its label and corresponding value.
     * Ensures every displayed key has a fallback value if not present in the `statistics` object.
     */
    return (
        <div className="stats-box">
            <h2>Statistics</h2>
            <div className="stats-content">
                {statLabels.map(({ key, label }) => (
                    <p key={key}>
                        <span>{label}:</span> {statistics[key] ?? 0}
                    </p>
                ))}
            </div>
        </div>
    );
};

export default StatisticBox;
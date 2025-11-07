/**
 * @fileoverview Component to display user statistics in a styled box.
 * <br><br>
 * This component renders a box containing user statistics with labels and values.<br>
 * It receives statistics data and labels as props and displays them in a scrollable list.
 */

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

    return (
        <div className="statistics-wrapper">
            <h2 className="statistics-title">
                Statistics
            </h2>

            <div className="statistics-list">
                {statLabels.map(({ key, label }) => (
                    <p 
                        key={key}
                        className="statistics-item"
                    >
                        <span>{label}:</span> {statistics[key] ?? 0}
                    </p>
                ))}
            </div>
        </div>
    );
};

export default StatisticBox;
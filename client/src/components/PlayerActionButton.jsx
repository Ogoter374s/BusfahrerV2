/**
 * @fileoverview PlayerActionButton component to render action buttons based on player features.
 * <br><br>
 * This component dynamically generates action buttons for player actions using the
 * playerActionFeatures utility function. <br>
 * It retrieves the relevant features for the player and lobby, filters them based on visibility,
 * and renders the corresponding components with their respective props.
 */

// Utilities
import { playerActionFeatures } from '../utils/constants';

// React
import { useParams } from 'react-router-dom';

/**
 * A component that renders action buttons for player actions based on their features. <br>
 * It retrieves the relevant features for the player and lobby, filters them based on visibility,
 * and renders the corresponding components with their respective props.
 * <br><br>
 * 
 * @function PlayerActionButton
 * @param {Object} manager - The player manager object containing player information and state.
 * @returns {JSX.Element} The rendered player action buttons component.
 */
function PlayerActionButton({ manager }) {
    const { lobbyId } = useParams();

    /**
     * Retrieve and filter player action features based on visibility.
     * Each visible feature is then rendered with its corresponding component and props.
     */
    const features = playerActionFeatures(manager, lobbyId).filter(f => f.visible);

    return (
        <>
            {features.map(f => {
                const FeatureComponent = f.component;
                return <FeatureComponent key={f.key}  {...f.props} />;
            })}
        </>
    );
};

export default PlayerActionButton;
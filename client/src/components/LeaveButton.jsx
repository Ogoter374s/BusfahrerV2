
// Utilities
import BASE_URL from '../utils/config'; 
import { SoundManager } from '../utils/soundManager';

// React
import { useNavigate, useParams } from 'react-router-dom';

function LeaveButton({isSpectator = false}) {
    const { gameId } = useParams();
    const navigate = useNavigate();

    const handleClick = async () => {
        SoundManager.playClickSound();
        try {
            console.log(isSpectator);
            const response = await fetch(`${BASE_URL}leave-game`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ gameId, isSpectator }),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.message === 'userLeft') {
                    navigate('/lobbys');
                }
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error leaving game:', error);
            alert('An unexpected error occurred. Please try again.');
        }
    };

    return (
        <div className="back-cont">
            <button className="btn-back" onClick={handleClick}>
                <img src="/back.svg" alt="Back Button" className="back-icon" />
            </button>
        </div>
    );
}

export default LeaveButton;

// Utilities
import BASE_URL from "../utils/config";

// React
import { useState } from 'react';
import { useParams } from "react-router-dom";

const useBusfahrer = () => {
    const { gameId } = useParams();

    const [busfahrerName, setBusfahrerName] = useState('');
    const [isBusfahrer, setIsBusfahrer] = useState(false);

    const fetchBusfahrer = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}get-busfahrer?gameId=${gameId}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                },
            );

            if (!response.ok) {
                throw new Error('Failed to fetch busfahrer details');
            }

            const busfahrer = await response.json();
            setIsBusfahrer(busfahrer.isBusfahrer);
            setBusfahrerName(busfahrer.busfahrerName);
        } catch (error) {
            console.error('Error fetching busfahrer:', error);
        }
    };

    return {
        busfahrerName,
        setBusfahrerName,
        isBusfahrer,
        setIsBusfahrer,
        fetchBusfahrer,       
    }
};

export default useBusfahrer;
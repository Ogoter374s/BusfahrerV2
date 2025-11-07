/**
 * @fileoverview Custom hook for managing chat functionality.
 * <br><br>
 * This hook provides functionality to fetch chat information and messages, <br>
 * send new chat messages, and handle real-time updates via WebSocket.
 */

// Hooks
import useWebSocketConnector from "./useWebSocketConnector";

// Utilities
import BASE_URL from "../utils/config";
import { PopupManager } from "../utils/popupManager";

// React
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";

/**
 * A custom React hook for managing chat functionality. <br>
 * This hook provides functionality to fetch chat information and messages, <br>
 * send new chat messages, and handle real-time updates via WebSocket.
 * <br><br>
 * <strong>fetchChatInfo:</strong> <br>
 * This function fetches the chat name and code from the backend and updates the state variables.
 * <br><br>
 * <strong>fetchChatMessages:</strong> <br>
 * This function fetches the chat messages from the backend and updates the state variable.
 * <br><br>
 * <strong>sendChatMessage:</strong> <br>
 * This function sends a new chat message to the backend. <br>
 * It accepts the message content from the `newChatMessage` state variable.
 * <br><br>
 * <strong>useEffect:</strong> <br>
 * This effect runs once when the component mounts to fetch chat information and messages.
 * <br><br>
 * 
 * @function useChatManager
 * @param {boolean} active - Whether the chat manager should be active and fetch data.
 * @returns {Object} An object containing chat information, messages, and functions to manage chat.
 */
function useChatManager(active) {
    const [chatName, setChatName] = useState("");
    const [chatCode, setChatCode] = useState("");
    const [chatMessages, setChatMessages] = useState([]);
    const [newChatMessage, setNewChatMessage] = useState("");
    const { lobbyId } = useParams();

    const init = useRef(false);

    /**
     * Fetches the chat name and code from the backend and updates state variables.
     * This function makes a GET request to retrieve chat information based on the `lobbyId`.
     * If the request is successful, it updates the `chatName` and `chatCode` state variables.
     * If the request fails, it logs an error to the console.
     */
    const fetchChatInfo = async () => {
        const respone = await fetch(
            `${BASE_URL}get-chat-info/${lobbyId}`, {
            method: "GET",
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        }
        );

        const data = await respone.json();

        setChatName(data.name);
        setChatCode(data.code);
    };

    /**
     * Fetches the chat messages from the backend and updates the state variable.
     * This function makes a GET request to retrieve chat messages based on the `lobbyId`.
     * If the request is successful, it updates the `chatMessages` state variable.
     * If the request fails, it logs an error to the console.
     */
    const fetchChatMessages = async () => {
        const respone = await fetch(
            `${BASE_URL}get-chat-messages/${lobbyId}`, {
            method: "GET",
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        }
        );

        const data = await respone.json();

        setChatMessages(data.messages);
    };

    /**
     * Sends a new chat message to the backend. <br>
     * It accepts the message content from the `newChatMessage` state variable.
     * If the request fails, it shows a popup with the error message.
     */
    const sendChatMessage = async () => {
        if (newChatMessage.trim() === "") return;

        const response = await fetch(
            `${BASE_URL}send-chat-message/${lobbyId}`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                message: newChatMessage.trim(),
            }),
        }
        );

        const data = await response.json();

        if (!data.success) {
            PopupManager.showPopup({
                title: data.title,
                message: data.error,
                icon: '❌',
            });
            console.error(data.error);
        }
    };

    // Effect to fetch chat info and messages on mount
    if (active) {
        /**
         * Effect hook to load chat info and messages when the component mounts.
         * This effect runs once on component mount to fetch and set the chat name, code, and messages.
         */
        useEffect(() => {
            if (init.current) return;
            init.current = true;

            fetchChatInfo();
            fetchChatMessages();
        }, []);

        /**
         * WebSocket connector for real-time chat updates.
         * This hook establishes a WebSocket connection to receive chat updates.
         * When a 'chatUpdate' message is received, it updates the `chatMessages` state variable.
         */
        useWebSocketConnector("chat", { lobbyId }, init.current, (message) => {
            if (message.type === 'chatUpdate') {
                setChatMessages(message.data.messages || []);
            }
        });
    }

    return {
        chatName,
        chatCode,
        chatMessages,

        newChatMessage,
        setNewChatMessage,

        sendChatMessage
    };
}

export default useChatManager;
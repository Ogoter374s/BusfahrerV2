/**
 * @fileoverview PopupManager Utility
 * <br><br>
 * This utility manages popups in the application, allowing for easy display and handling of user notifications and confirmations.
 */

let popupSetter = null;
let navigator = null;
let currentTo = '';
let resolver = null;

/**
 * The default popup state object.
 * <br> <br>
 * <strong>defaultPopup:</strong> <br>
 * - `show`: Whether the popup is currently visible. <br>
 * - `title`: The title of the popup. <br>
 * - `message`: The message to display in the popup. <br>
 * - `icon`: An optional icon to display in the popup (default is ⚠️). <br>
 * - `to`: An optional route to navigate to when the popup is confirmed. <br>
 * - `ok`: Whether the popup has to been confirmed (default is false). <br>
 * - `useCancel`: Whether to show a cancel button (default is false). 
 * <br> <br>
 * <strong> initPopupManager:</strong> <br>
 * Initializes the PopupManager with a setter function to update the popup state and an optional navigation function.
 * <br> <br>
 * <strong>showPopup:</strong> <br>
 * Displays a popup with the specified options and returns a promise that resolves when the popup is confirmed or canceled.
 * <br> <br>
 * <strong>okPopup:</strong> <br>
 * Confirms the popup, updates the state, and resolves the promise with `true`. <br>
 * If a navigation route is specified, it navigates to that route.
 * <br> <br> 
 * <strong>cancelPopup:</strong> <br>
 * Cancels the popup, updates the state, and resolves the promise with `false`.
 * 
 * @function PopupOptions
 * @returns {Object} The PopupManager object with methods to manage popups.
 */
export const PopupManager = {
    // The default popup state object
    defaultPopup : {
        show: false,
        title: '',
        message: '',
        icon: '',
        to: '',
        ok: false,
        useCancel: false,
    },

    // Initializes the PopupManager with a setter function and an optional navigation function
    initPopupManager(setter, navigateFn=null) {
        popupSetter = setter;
        navigator = navigateFn;
    },

    /** 
     * Displays a popup with the specified options
     * Returns a promise that resolves when the popup is confirmed or canceled
     */ 
    showPopup({ title, message, icon = '⚠️', to = '', useCancel = false }) {
        return new Promise((resolve) => {
            resolver = resolve;
            if (popupSetter) {
                popupSetter({
                    show: true,
                    title,
                    message,
                    icon,
                    to,
                    ok: false,
                    useCancel,
                });
                currentTo = to;
            }
        });
    },

    /**
     * Confirms the popup, updates the state, and resolves the promise with `true`.
     * If a navigation route is specified, it navigates to that route.
     */
    okPopup() {
        if (popupSetter) {
            popupSetter((prev) => ({
                ...prev,
                ok: true,
                show: false,
            }));
            if(resolver) resolver(true);
            resolver = null;
            if(currentTo !== '' && navigator) {
                navigator(currentTo);
            }
        }
    },

    // Cancels the popup, updates the state, and resolves the promise with `false`
    cancelPopup() {
        if(popupSetter) {
            popupSetter((prev) => ({
                ...prev,
                ok: false,
                show: false,
            }));
            if(resolver) resolver(false);
            resolver = null;
        }
    },
};
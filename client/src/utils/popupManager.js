
let popupSetter = null;
let navigator = null;
let currentTo = '';

export const PopupManager = {
    defaultPopup : {
        show: false,
        title: '',
        message: '',
        icon: '',
        to: '',
    },

    initPopupManager(setter, navigateFn=null) {
        popupSetter = setter;
        navigator = navigateFn;
    },

    showPopup({ title, message, icon = '⚠️', to = '' }) {
        if (popupSetter) {
            popupSetter({
                show: true,
                title,
                message,
                icon,
                to,
            });
            currentTo = to;
        }
    },

    closePopup() {
        if (popupSetter) {
            popupSetter((prev) => ({
                ...prev,
                show: false,
            }));
            if(currentTo !== '' && navigator) {
                navigator(currentTo);
            }
        }
    }
};
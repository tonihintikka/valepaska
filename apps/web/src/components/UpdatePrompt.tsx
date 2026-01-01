import { useRegisterSW } from 'virtual:pwa-register/react';

export function UpdatePrompt() {
    const {
        needRefresh: [needRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(registration) {
            console.log('SW Registered:', registration);
        },
        onRegisterError(error) {
            console.log('SW registration error:', error);
        },
    });

    if (!needRefresh) return null;

    return (
        <div className="update-prompt">
            <div className="update-prompt-content">
                <span className="update-prompt-text">🔄 Uusi versio saatavilla!</span>
                <button
                    className="update-prompt-button"
                    onClick={() => updateServiceWorker(true)}
                >
                    Päivitä nyt
                </button>
                <button
                    className="update-prompt-dismiss"
                    onClick={() => window.location.reload()}
                >
                    Myöhemmin
                </button>
            </div>
        </div>
    );
}

// ============================================
// WEB PUSH NOTIFICATIONS
// ============================================

// VAPID public key will be injected from Django template
const VAPID_PUBLIC_KEY = document.querySelector('meta[name="vapid-key"]')?.content || '';

async function initNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Push notifications not supported');
        return;
    }
    
    try {
        const registration = await navigator.serviceWorker.register('/static/js/sw.js');
        console.log('Service Worker registered');
        
        // Check if already subscribed
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            console.log('Already subscribed to push');
            return;
        }
        
        // Ask for permission after a delay (better UX)
        setTimeout(() => askNotificationPermission(registration), 5000);
    } catch (e) {
        console.log('Service Worker registration failed:', e);
    }
}

async function askNotificationPermission(registration) {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        subscribeToPush(registration);
    }
}

async function subscribeToPush(registration) {
    if (!VAPID_PUBLIC_KEY) return;
    
    try {
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
        
        // Send subscription to server
        await fetch('/api/subscribe-push/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription: subscription.toJSON() }),
        });
        
        console.log('Push subscription successful');
    } catch (e) {
        console.log('Push subscription failed:', e);
    }
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Bell button click handler
document.addEventListener('DOMContentLoaded', () => {
    const bellBtn = document.getElementById('notification-bell');
    if (bellBtn) {
        bellBtn.addEventListener('click', async () => {
            if (!('serviceWorker' in navigator)) {
                showToast('Les notifications ne sont pas supportées sur ce navigateur.', 'warning');
                return;
            }
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                showToast('Tu es déjà abonné aux notifications ! 🔔', 'info');
            } else {
                await askNotificationPermission(registration);
                showToast('Notifications activées ! 🔔', 'success');
            }
        });
    }
    
    // Auto-init
    initNotifications();
});

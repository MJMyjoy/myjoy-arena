from django.conf import settings


def vapid_key(request):
    """Inject VAPID public key into all templates for push notifications."""
    return {
        'vapid_public_key': getattr(settings, 'VAPID_PUBLIC_KEY', ''),
    }

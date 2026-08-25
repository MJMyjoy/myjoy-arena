from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET
import json
from .models import Project, Category, PushSubscription
from .forms import ProjectForm
from django.conf import settings

def home(request):
    badged_projects = Project.objects.filter(is_badged=True)[:6]
    recent_projects = Project.objects.all()[:20]
    categories = Category.objects.all()
    return render(request, 'home.html', {
        'badged_projects': badged_projects,
        'recent_projects': recent_projects,
        'categories': categories,
    })

def create_project(request):
    categories = Category.objects.all()
    return render(request, 'create_project.html', {
        'categories': categories,
    })

def project_detail(request, pk):
    project = get_object_or_404(Project, pk=pk)
    return render(request, 'project_detail.html', {'project': project})

@csrf_exempt
@require_POST
def save_project(request):
    try:
        data = json.loads(request.body)
        category = None
        if data.get('category'):
            try:
                category = Category.objects.get(pk=data['category'])
            except Category.DoesNotExist:
                pass
        project = Project.objects.create(
            author_name=data.get('author_name', 'Anonyme'),
            title=data.get('title', 'Sans titre'),
            code=data.get('code', ''),
            notes=data.get('notes', ''),
            category=category,
            output=data.get('output', ''),
        )
        # Send push notifications to all subscribers
        send_push_notifications(project)
        return JsonResponse({
            'success': True,
            'project_id': project.pk,
            'message': 'Projet enregistré avec succès !'
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)

def send_push_notifications(project):
    """Send push notification to all subscribers about new project."""
    try:
        from pywebpush import webpush, WebPushException
        subscriptions = PushSubscription.objects.all()
        payload = json.dumps({
            'title': '🆕 Nouveau projet sur Myjoy Arena !',
            'body': f'{project.author_name} a publié "{project.title}"',
            'url': f'/project/{project.pk}/',
            'icon': '/static/img/icon-192.png',
        })
        vapid_private_key = settings.VAPID_PRIVATE_KEY
        vapid_claims = {'sub': f'mailto:{settings.VAPID_ADMIN_EMAIL}'}
        for sub in subscriptions:
            try:
                webpush(
                    subscription_info=sub.subscription_info,
                    data=payload,
                    vapid_private_key=vapid_private_key,
                    vapid_claims=vapid_claims,
                )
            except WebPushException:
                sub.delete()  # Remove invalid subscriptions
            except Exception:
                pass
    except ImportError:
        pass  # pywebpush not installed

@csrf_exempt
@require_POST
def subscribe_push(request):
    try:
        data = json.loads(request.body)
        subscription_info = data.get('subscription')
        if subscription_info:
            PushSubscription.objects.get_or_create(
                subscription_info=subscription_info
            )
            return JsonResponse({'success': True})
        return JsonResponse({'success': False, 'message': 'Données manquantes'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)

@require_GET
def api_categories(request):
    categories = Category.objects.all().values('id', 'name', 'icon', 'slug')
    return JsonResponse(list(categories), safe=False)

@require_GET
def api_projects(request):
    projects = Project.objects.select_related('category').all()[:50]
    data = []
    for p in projects:
        data.append({
            'id': p.pk,
            'title': p.title,
            'author_name': p.author_name,
            'category': str(p.category) if p.category else None,
            'is_badged': p.is_badged,
            'created_at': p.created_at.isoformat(),
            'notes': p.notes[:100] if p.notes else '',
        })
    return JsonResponse(data, safe=False)

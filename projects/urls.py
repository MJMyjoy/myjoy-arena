from django.urls import path
from . import views
from django.views.generic import TemplateView


app_name = 'projects'

urlpatterns = [
    path(
        '.well-known/assetlinks.json', 
        TemplateView.as_view(
            template_name="assetlinks.json", 
            content_type="application/json"  # Très important pour que Google le reconnaisse
        ), 
        name='assetlinks'
    ),
    
    path('', views.home, name='home'),
    path('create/', views.create_project, name='create'),
    path('project/<int:pk>/', views.project_detail, name='detail'),
    path('api/save-project/', views.save_project, name='save_project'),
    path('api/categories/', views.api_categories, name='api_categories'),
    path('api/projects/', views.api_projects, name='api_projects'),
    path('api/subscribe-push/', views.subscribe_push, name='subscribe_push'),
]

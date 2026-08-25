from django.urls import path
from . import views

app_name = 'projects'

urlpatterns = [
    path('', views.home, name='home'),
    path('create/', views.create_project, name='create'),
    path('project/<int:pk>/', views.project_detail, name='detail'),
    path('api/save-project/', views.save_project, name='save_project'),
    path('api/categories/', views.api_categories, name='api_categories'),
    path('api/projects/', views.api_projects, name='api_projects'),
    path('api/subscribe-push/', views.subscribe_push, name='subscribe_push'),
]

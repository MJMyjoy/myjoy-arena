from django.contrib import admin
from .models import Category, Project, PushSubscription

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['icon', 'name', 'slug', 'description']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name', 'description']

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'author_name', 'category', 'is_badged', 'created_at']
    list_filter = ['is_badged', 'category', 'created_at']
    search_fields = ['title', 'author_name']
    readonly_fields = ['created_at', 'updated_at']
    actions = ['add_badge', 'remove_badge']

    @admin.action(description='⭐ Attribuer le badge')
    def add_badge(self, request, queryset):
        queryset.update(is_badged=True)
        
    @admin.action(description='Retirer le badge')
    def remove_badge(self, request, queryset):
        queryset.update(is_badged=False)

@admin.register(PushSubscription)
class PushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['pk', 'created_at']
    readonly_fields = ['subscription_info', 'created_at']

admin.site.site_header = 'Myjoy Arena — Administration'
admin.site.site_title = 'Myjoy Arena Admin'
admin.site.index_title = 'Gestion de la plateforme'

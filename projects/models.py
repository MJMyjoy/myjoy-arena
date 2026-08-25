from django.db import models
from django.utils.text import slugify
import json

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    icon = models.CharField(max_length=10, default='📁', help_text='Emoji icon')
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Catégorie'
        verbose_name_plural = 'Catégories'
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.icon} {self.name}'


class Project(models.Model):
    author_name = models.CharField('Nom de l\'auteur', max_length=150)
    title = models.CharField('Titre du projet', max_length=200)
    code = models.TextField('Code Python')
    notes = models.TextField('Notes / Explications', blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Catégorie')
    is_badged = models.BooleanField('Badge ⭐', default=False, help_text='Projet validé par l\'administrateur')
    output = models.TextField('Résultat de l\'exécution', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Projet'
        verbose_name_plural = 'Projets'
        ordering = ['-created_at']

    def __str__(self):
        badge = '⭐ ' if self.is_badged else ''
        return f'{badge}{self.title} — par {self.author_name}'


class PushSubscription(models.Model):
    subscription_info = models.JSONField('Informations d\'abonnement')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Abonnement Push'
        verbose_name_plural = 'Abonnements Push'

    def __str__(self):
        return f'Abonnement #{self.pk}'

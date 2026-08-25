from django.core.management.base import BaseCommand
from projects.models import Category

class Command(BaseCommand):
    help = 'Seed default project categories'

    def handle(self, *args, **options):
        categories = [
            {'name': 'Exercice', 'icon': '📝', 'description': 'Exercices de cours et travaux pratiques'},
            {'name': 'Projet Personnel', 'icon': '🚀', 'description': 'Projets personnels et créatifs'},
            {'name': 'Challenge', 'icon': '🏆', 'description': 'Défis de programmation et compétitions'},
            {'name': 'Mini-jeu', 'icon': '🎮', 'description': 'Petits jeux et projets ludiques'},
            {'name': 'Algorithme', 'icon': '🧮', 'description': 'Algorithmes et structures de données'},
        ]
        for cat_data in categories:
            obj, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults=cat_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Category "{obj.name}" created.'))
            else:
                self.stdout.write(self.style.WARNING(f'Category "{obj.name}" already exists.'))

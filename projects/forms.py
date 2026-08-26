from django import forms
from .models import Project

class ProjectForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Définit la valeur initiale du 3ème champ ('code')
        self.fields['code'].initial = "initial="# Tapez votre code ici ...\n\n# Ceci est un exemple :\nprint("Hello world !")\n"

    class Meta:
        model = Project
        fields = ['author_name', 'title', 'code', 'notes', 'category', 'output']
        widgets = {
            'author_name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Votre nom ou pseudo'}),
            'title': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Titre de votre projet'}),
            'code': forms.Textarea(attrs={'class': 'form-control', 'placeholder': 'Collez votre code Python ici'}),
            'notes': forms.Textarea(attrs={'class': 'form-control', 'placeholder': 'Quelques explications (optionnel)', 'rows': 3}),
            'category': forms.Select(attrs={'class': 'form-control'}),
            'output': forms.HiddenInput(),
        }

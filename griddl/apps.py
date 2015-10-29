from django.apps import AppConfig


class GriddlConfig(AppConfig):
    name = 'griddl'
    verbose_name = 'Griddl'

    def ready(self):
        from griddl import signals

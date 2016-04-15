# flake8: noqa
import os
import sys
sys.path.append('/var/www/griddl/.venv/griddl-web/lib/site-packages')
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__),'mysite')))
os.environ['DJANGO_SETTINGS_MODULE'] = 'mysite.settings'


from django.core.wsgi import get_wsgi_application
from whitenoise.django import DjangoWhiteNoise


application = get_wsgi_application()
application = DjangoWhiteNoise(application)

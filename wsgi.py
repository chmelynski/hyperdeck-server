import os
import sys
from django.core.wsgi import get_wsgi_application
from whitenoise.django import DjangoWhiteNoise

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__),'mysite')))
os.environ['DJANGO_SETTINGS_MODULE'] = 'mysite.settings'

application = get_wsgi_application()
application = DjangoWhiteNoise(application)

#!/usr/bin/env python
from wsgi import *
from django.contrib.auth.models import User
u, created = User.objects.get_or_create(username='adam')
if created:
    u.set_password('supremo')
    u.is_superuser = True
    u.is_staff = True
    u.save()

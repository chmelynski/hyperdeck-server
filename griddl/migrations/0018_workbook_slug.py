# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('griddl', '0017_auto_20160101_1642'),
    ]

    operations = [
        migrations.AddField(
            model_name='workbook',
            name='slug',
            field=models.SlugField(default=''),
            preserve_default=False,
        ),
    ]

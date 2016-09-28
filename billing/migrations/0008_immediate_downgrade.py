# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('billing', '0007_auto_20160226_1528'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='subscription',
            name='_period_end',
        ),
        migrations.RemoveField(
            model_name='subscription',
            name='status_detail',
        ),
    ]


# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('billing', '0004_billingredirect'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='subscription',
            name='status_reason',
        ),
        migrations.AddField(
            model_name='subscription',
            name='status_detail',
            field=models.CharField(max_length=255, null=True),
        ),
    ]

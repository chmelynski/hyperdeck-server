# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('billing', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='subscription',
            name='details_url',
            field=models.CharField(default=b'', help_text=b'FastSpring details link', max_length=255),
        ),
        migrations.AlterField(
            model_name='subscription',
            name='plan',
            field=models.ForeignKey(to='billing.Plan', to_field=b'name'),
        ),
        migrations.AlterField(
            model_name='subscription',
            name='reference_id',
            field=models.CharField(default=b'', help_text=b'FastSpring reference ID', max_length=255),
        ),
    ]

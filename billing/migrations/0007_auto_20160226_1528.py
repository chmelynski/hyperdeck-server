# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('billing', '0006_auto_20160129_1600'),
    ]

    operations = [
        migrations.AlterField(
            model_name='subscription',
            name='plan',
            field=models.ForeignKey(related_name='plan', to='griddl.Plan', to_field=b'name'),
        ),
    ]

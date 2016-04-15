# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('griddl', '0003_auto_20151023_1658'),
        ('billing', '0002_auto_20151023_1604'),
    ]

    operations = [
        migrations.AlterField(
            model_name='subscription',
            name='plan',
            field=models.ForeignKey(to='griddl.Plan', to_field=b'name'),
        ),
        migrations.DeleteModel(
            name='Plan',
        ),
    ]

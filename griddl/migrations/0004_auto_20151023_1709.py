# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('griddl', '0003_auto_20151023_1658'),
    ]

    operations = [
        migrations.AlterField(
            model_name='myuser',
            name='subscription',
            field=models.ForeignKey(to='billing.Subscription', null=True),
        ),
    ]

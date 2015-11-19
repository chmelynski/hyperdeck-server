# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('griddl', '0011_auto_20151119_1701'),
        ('billing', '0003_auto_20151023_1658'),
    ]

    operations = [
        migrations.CreateModel(
            name='BillingRedirect',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('created', models.DateTimeField()),
                ('referrer', models.CharField(max_length=32)),
                ('updated', models.DateTimeField(auto_now=True)),
                ('status', models.IntegerField(default=0, choices=[(0, b'Sent'), (1, b'Completed')])),
                ('account', models.ForeignKey(to='griddl.Account')),
                ('plan', models.ForeignKey(to='griddl.Plan')),
            ],
        ),
    ]

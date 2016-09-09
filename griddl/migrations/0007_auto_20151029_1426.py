# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('billing', '0003_auto_20151023_1658'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('griddl', '0006_auto_20151029_1153'),
    ]

    operations = [
        migrations.CreateModel(
            name='Account',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('plan', models.ForeignKey(default=0, to='griddl.Plan')),
                ('subscription', models.ForeignKey(to='billing.Subscription', null=True)),
                ('user', models.OneToOneField(to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.RemoveField(
            model_name='myuser',
            name='plan',
        ),
        migrations.RemoveField(
            model_name='myuser',
            name='subscription',
        ),
        migrations.RemoveField(
            model_name='myuser',
            name='user',
        ),
        migrations.AlterField(
            model_name='workbook',
            name='owner',
            field=models.ForeignKey(to='griddl.Account'),
        ),
        migrations.DeleteModel(
            name='MyUser',
        ),
    ]

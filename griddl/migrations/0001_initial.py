# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('billing', '0002_auto_20151023_1604'),
    ]

    operations = [
        migrations.CreateModel(
            name='DefaultWorkbook',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(max_length=255)),
                ('type', models.CharField(max_length=255)),
                ('text', models.TextField(blank=True)),
            ],
        ),
        migrations.CreateModel(
            name='MyUser',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('appsUsed', models.IntegerField()),
                ('appsAllowed', models.IntegerField()),
                ('plan', models.ForeignKey(to='billing.Plan')),
                ('subscription', models.ForeignKey(default=None, to='billing.Subscription')),
                ('user', models.ForeignKey(to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Workbook',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(max_length=200)),
                ('type', models.CharField(max_length=255)),
                ('text', models.TextField(blank=True)),
                ('public', models.BooleanField()),
                ('filetype', models.CharField(blank=True, max_length=1, choices=[(b'F', b'File'), (b'D', b'Dir'), (b'L', b'Link')])),
                ('path', models.CharField(max_length=2000, blank=True)),
                ('owner', models.ForeignKey(to=settings.AUTH_USER_MODEL)),
                ('parent', models.ForeignKey(blank=True, to='griddl.Workbook', null=True)),
            ],
        ),
    ]

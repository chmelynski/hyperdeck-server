# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('griddl', '0027_add_Copy'),
    ]

    operations = [
        migrations.CreateModel(
            name='Preferences',
            fields=[
                ('id', models.AutoField(serialize=False, auto_created=True, verbose_name='ID', primary_key=True)),
                ('editorKeymap', models.CharField(blank=True, null=True, max_length=255, choices=[(b'vim', b'vim'), (b'emacs', b'emacs'), (b'sublime', b'sublime')])),
                ('editorTheme', models.CharField(blank=True, max_length=255, null=True)),
                ('editorAddons', models.TextField(blank=True)),
                ('style', models.TextField(blank=True)),
                ('script', models.TextField(blank=True)),
                ('showTooltips', models.BooleanField(default=True)),
                ('user', models.OneToOneField(to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddField(
            model_name='workbook',
            name='version',
            field=models.IntegerField(default=0),
        ),
    ]


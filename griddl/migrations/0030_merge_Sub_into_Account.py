from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('griddl', '0029_auto_20160901_1452'),
    ]

    operations = [
        migrations.DeleteModel(
            name='DefaultWorkbook',
        ),
        migrations.RemoveField(
            model_name='account',
            name='subscription',
        ),
        migrations.AddField(
            model_name='account',
            name='details_url',
            field=models.CharField(max_length=255, default='', help_text='FastSpring details link'),
        ),
        migrations.AddField(
            model_name='account',
            name='locked',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='account',
            name='plan_size',
            field=models.IntegerField(default=2),
        ),
        migrations.AddField(
            model_name='account',
            name='reference_id',
            field=models.CharField(max_length=255, default='', help_text='FastSpring reference ID'),
        ),
        migrations.AlterField(
            model_name='workbook',
            name='text',
            field=models.TextField(default=b'{"components": [], "metadata": {"version": 1, "view": "all"}}', blank=True),
        ),
        migrations.AlterField(
            model_name='workbook',
            name='version',
            field=models.IntegerField(default=1),
        ),
    ]


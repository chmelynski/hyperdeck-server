
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('griddl', '0033_add_noncompliant_to_Account'),
    ]

    operations = [
        migrations.CreateModel(
            name='Log',
            fields=[
                ('id', models.AutoField(verbose_name='ID', auto_created=True, primary_key=True, serialize=False)),
                ('category', models.CharField(max_length=50)),
                ('time', models.DateTimeField(auto_now=True)),
                ('text', models.CharField(max_length=255)),
                ('viewed', models.BooleanField(default=False)),
            ],
        ),
        migrations.AlterField(
            model_name='account',
            name='plan',
            field=models.ForeignKey(on_delete=django.db.models.deletion.SET_NULL, default=1, null=True, blank=True, to='griddl.Plan'),
        ),
        migrations.AlterField(
            model_name='workbook',
            name='owner',
            field=models.ForeignKey(on_delete=django.db.models.deletion.SET_NULL, null=True, blank=True, to='griddl.Account'),
        ),
        migrations.AlterField(
            model_name='workbook',
            name='parent',
            field=models.ForeignKey(on_delete=django.db.models.deletion.SET_NULL, null=True, blank=True, to='griddl.Workbook'),
        ),
        migrations.AddField(
            model_name='log',
            name='account',
            field=models.ForeignKey(on_delete=django.db.models.deletion.SET_NULL, null=True, blank=True, to='griddl.Account'),
        ),
    ]


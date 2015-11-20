from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

from griddl.models import Account, DefaultWorkbook, Workbook


@receiver(post_save, sender=User)
def account_setup(sender, created, instance, **kwargs):
    '''
    When saving a new User, give it an account & a default workbook.

    if user creation is triggered by saveas(),
        this Workbook will be deleted later,
        and the intended WB will be saved.
    '''
    if created:
        account = Account(user=instance)
        account.save()
        wb = Workbook()
        wb.owner = account
        wb.name = 'My First Workbook'
        default = DefaultWorkbook.objects.filter(name='bubble-chart')[0]
        wb.type = default.type
        wb.text = default.text
        wb.public = False
        wb.save()

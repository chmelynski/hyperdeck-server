from django.contrib.auth.models import User
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .management import workbook_locks
from .models import Account, Workbook


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
        wb.public = False
        wb.save()


@receiver(pre_save, sender=Workbook)
def check_size(sender, instance, **kwargs):
    '''
    check whether size of WB has changed and if so,
    manage lock status across account WBs

    this way we only run the lock manager if size changes.
    (so, avoid dumb recursion!)
    '''
    if instance.pk:
        orig = Workbook.objects.get(pk=instance.pk)
        if instance.size == orig.size:
            return

    workbook_locks(instance.owner)


@receiver(post_save, sender=Account)
def account_size(sender, created, instance, **kwargs):
    workbook_locks(instance)

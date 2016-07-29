import logging

from django.contrib.auth.models import User
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import Account, Workbook, AccountSizeError

logger = logging.getLogger(__name__)


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
    determine post-save account size and if it's too big, raise the exception
    '''
    try:
        orig = Workbook.objects.get(pk=instance.pk)
        new_size = (instance.owner.size - orig.size) + instance.size
    except:
        new_size = instance.size + instance.owner.size
    if new_size > instance.owner.plan_size:
        logger.debug("plan size: {}, account owner size: {}".format(instance.owner.plan_size, new_size))
        logger.debug("instance size: {}".format(instance.size))
        raise AccountSizeError("Saving this workbook would cause your account\
                                to exceed its storage limit.")

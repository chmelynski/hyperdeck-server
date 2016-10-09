import logging

from datetime import datetime

from django.contrib import messages
from django.contrib.auth.models import User
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import Account, Workbook, AccountSizeError
from .views import DEFAULT_WORKBOOK

import stored_messages

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
        wb.text = DEFAULT_WORKBOOK
        wb.save()


@receiver(pre_save, sender=Workbook)
def check_size(sender, instance, **kwargs):
    '''
    determine post-save account size and if it's too big, raise the exception
    '''
    account = instance.owner
    try:
        orig = Workbook.objects.get(pk=instance.pk)
        new_size = (account.size - orig.size) + instance.size
    except:
        new_size = instance.size + account.size
    if new_size > account.plan_size * 1024 * 1024:
        logger.debug("plan size: {} MB".format(account.plan_size))
        logger.debug("account owner size: {}".format(new_size))
        logger.debug("instance size: {}".format(instance.size))
        if not account.noncompliant:
            account.noncompliant = True
            account.noncompliantSince = datetime.now()
            account.save()
            msg = "Notice: your account size has gone over the \
                   allowed size of your subscription plan.  Please upgrade at \
                   %s to maintain the ability to save workbooks." % account.details_url
            stored_messages.api.add_message_for([account.user], messages.WARNING, msg)
    else:
        if account.noncompliant:
            account.noncompliant = False
            account.save()


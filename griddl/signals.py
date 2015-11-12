from django.contrib.auth.models import User
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver

from griddl.models import Account, DefaultWorkbook, Plan, Workbook


class WorkbookSizeException(Exception):
    pass


@receiver(post_save, sender=User)
def account_setup(sender, created, instance, **kwargs):
    '''
    When saving a new User, give it an account & a default workbook.
    todo: figure out how this interacts with account creation via saveas
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


@receiver(pre_save, sender=Workbook)
def check_size(sender, instance, **kwargs):
    '''
    When saving a workbook, check account size against plan size.
    Reject saves that go over the limit with a link to upgrade plan

    Future warning: much more complicated in python3 -- see:
    http://stackoverflow.com/questions/4013230/how-many-bytes-does-a-string-have
    '''
    size = len(instance.text)
    acct = instance.owner
    print "size: %d" % size
    print "plan size: %d" % (acct.plan_size * 1024)
    if size > (acct.plan_size * 1024):
        '''
        todo: figure out how to actually handle this behind the scenes
        e.g. what to save, do we deactivate things, etc.

        find smallest plan big enough for workbook, and send to billing
        '''

        print 'oversize! send to billing.'
        raise WorkbookSizeException()

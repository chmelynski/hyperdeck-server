import operator

from .models import Plan, Workbook


def workbook_locks(account):
    '''
    needed to centralize this behavior:
    check an account's current size and allowed plan size,
    then adjust workbook locks accordingly.
    '''
    # don't even bother if they're on the big plan already, yeah?
    if account.plan == (len(Plan.SIZES) - 1):
        return

    wbs = Workbook.objects.filter(owner=account).exclude(deleted=True,
                                                         locked=True)
    account_size = sum([wb.size for wb in wbs])
    plan_size = account.plan_size * 1024

    print "account size: %d" % account_size
    print "plan size: %d" % plan_size

    if account_size > plan_size:
        '''
        lock workbooks in descending size order until
        the unlocked size is under plan limit.
        '''
        print 'oversize! locking stuff.'
        wbs = sorted(wbs, key=operator.attrgetter('size'))
        while account_size > plan_size:
            biggest = wbs.pop()
            biggest.locked = True
            biggest.save()
            account_size -= biggest.size
    else:
        '''
        check for opposite case & unlock workbooks
        '''
        locks = Workbook.objects.filter(owner=account, locked=True)
        if locks:
            locks = sorted(locks, key=operator.attrgetter('size'))
            while account_size < plan_size:
                wb = locks.pop(0)
                if (account_size + wb.size) > plan_size:
                    break
                else:
                    wb.locked = False
                    wb._stop_recur = True
                    wb.save()
                    account_size += wb.size

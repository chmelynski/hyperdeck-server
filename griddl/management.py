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
        lock the smallest workbooks necessary to bring
        the unlocked size under plan limit
        '''
        print 'oversize! locking stuff.'
        diff = account_size - plan_size
        wbs = sorted(wbs, key=operator.attrgetter('size'))
        while account_size > plan_size:
            found = False
            for wb in wbs:
                if wb.size > diff:
                    found = True
                    wb.locked = True
                    wb.save()
                    account_size -= wb.size
            if not found:
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

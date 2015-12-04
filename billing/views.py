import hashlib
import json
import logging
from django.db import transaction
from django.http import HttpResponse, HttpResponseRedirect
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.generic import View
from django.views.decorators.csrf import csrf_exempt

from mysite import settings
from griddl.models import Account, Plan
from .models import BillingRedirect, Subscription

logger = logging.getLogger(__name__)


def billing_redirect(request, planid, userid):
    '''
    track redirects to fastspring to ensure accuracy wrt subscriptions
    this lets us use a hash rather than just pk or anything
    lots of other possible benefits, including analytics on abandonment
    '''
    timestamp = timezone.now()
    redirect = BillingRedirect.create(accountid=userid, planid=planid,
                                      created=timestamp)
    redirect.save()
    return HttpResponseRedirect(redirect.url)


class FastSpringNotificationView(View):
    '''base view class for FS notification views.'''

    private_key = ''  # all child views must define this value

    # this block allows notifications to bypass CSRF protection
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super(FastSpringNotificationView, self) \
            .dispatch(*args, **kwargs)

    def verify(self, private_key, request):
        '''
        Verify message authenticity using FS's private key scheme
        (done this way bc i'm not sure how to do as decorator)
        todo: apparently mixins are the trick for class-based views
        also todo: prob should raise an exception on fail
        '''

        if not request.META['User-Agent'] == "FS":
            return False

        msg_data = request.META['X-Security-Data']
        msg_hash = request.META['X-Security-Hash']
        challenge = hashlib.md5(msg_data + private_key).hexdigest()
        return (challenge == msg_hash)

    def get(self, request):
        logger.debug(request)
        if not settings.DEBUG:
            resp = HttpResponse(405)
            resp['Allow'] = 'POST'
            return resp

        return self.process(request.GET)

    def post(self, request):
        logger.debug(request)
        if not settings.DEBUG:
            logger.debug('apparently not debug')
            if not self.verify_msg(self.private_key, request):
                logger.warn('bad POST to FS notification endpoint' + request)
                return HttpResponse(403)

        return self.process(json.loads(request.body))

    def process(self, data):
        logger.debug(data)
        return HttpResponse()


class Create(FastSpringNotificationView):
    '''FastSpring Notifications endpoint -- Subscription Creation'''

    private_key = 'c0620c2ae55d510aa18f4db913db0bcf'

    def process(self, data):
        logger.debug("Creation! " + json.dumps(data))
        with transaction.atomic():
            referrer = BillingRedirect.objects.get(referrer=data['referrer'])
            referrer.status = 1
            referrer.save()
            referrer.account.plan = referrer.plan

            subscription = Subscription()
            subscription.reference_id = data['id']
            subscription.status = 'created'
            plan = Plan.objects.get(
                name=getattr(Plan, data['items'][0]['productName'].upper())
                )
            subscription.plan = plan
            subscription.save()
            referrer.account.subscription = subscription

            referrer.account.save()

        return HttpResponse()


class Activate(FastSpringNotificationView):
    '''FastSpring Notifications endpoint -- Subscription Activation'''

    private_key = 'f0a75700bbcdf7e6d59284bec01b38f9'

    def process(self, data):
        logger.debug("Activation! " + json.dumps(data))
        return HttpResponse()


class Change(FastSpringNotificationView):
    '''FastSpring Notifications endpoint -- Subscription Change'''

    private_key = 'ff0900d231708326e5788a9fb87ba211'

    def process(self, data):
        logger.debug("Status change! " + json.dumps(data))
        return HttpResponse()


class Deactivate(FastSpringNotificationView):
    '''FastSpring Notifications endpoint -- Subscription Deactivation'''

    private_key = '693bfb0a4dab24da21334cd6dbac6bb2'

    def process(self, data):
        logger.debug("Deactivation! " + json.dumps(data))
        with transaction.atomic():
            sub = Subscription.objects.get(reference_id=data.id)
            if not sub:  # weird, bail
                return
            sub.status = 'inactive'
            sub.status_reason = 'FS Deactivate'
            sub.save()

            acct = Account.objects.get(subscription=sub)
            if not acct:  # huh? bail.
                return
            acct.plan = Plan.FREE
            acct.save()  # note - auto-triggers workbook locking

        return HttpResponse()


class PayFail(FastSpringNotificationView):
    '''
    FastSpring Notifications endpoint -- Subscription Payment Failure

    FS takes care of dunning so... maybe we set a message?
    would require that message lib mentioned on Trello since async.
    todo: check what data is in this notification
    '''

    private_key = '228287fcc1faa140bf4b820e700b3ec2'

    def process(self, data):
        logger.debug("Payment failure! " + json.dumps(data))
        return HttpResponse()

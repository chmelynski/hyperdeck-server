import hashlib
import json
import logging
from django.http import HttpResponse
from django.shortcuts import render
from django.utils.decorators import method_decorator
from django.views.generic import View
from django.views.decorators.csrf import csrf_exempt
from mysite import settings

logger = logging.getLogger(__name__)

class FastSpringNotificationView(View):
    '''base view class for FS notification views.'''

    private_key = '' # all child views should define this value

    # this block allows notifications to bypass CSRF protection
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super(FastSpringNotificationView, self).dispatch(*args, **kwargs)


    def verify(self, private_key, request):
        '''
        Verify message authenticity using FS's private key scheme
        (done this way bc i'm not sure how to do as decorator)
        todo: apparently mixins are the trick for class-based views
        '''

        if not request.META['User-Agent'] == "FS":
            return false

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
        return HttpResponse()


class PayFail(FastSpringNotificationView):
    '''FastSpring Notifications endpoint -- Subscription Payment Failure'''
    
    private_key = '228287fcc1faa140bf4b820e700b3ec2'
    
    def process(self, data):
        logger.debug("Payment failure! " + json.dumps(data))
        return HttpResponse()


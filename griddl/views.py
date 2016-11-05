from __future__ import unicode_literals

import logging
import traceback
import boto3
import os
import datetime
import re

from django import forms
from django.db import transaction
from django.db.models import Sum
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.http import HttpResponseNotFound
from django.shortcuts import render
from django.template import loader
from django.contrib import messages
from django.core.exceptions import ValidationError, PermissionDenied
from django.core.urlresolvers import reverse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.template.defaultfilters import slugify

from mysite.settings import SUBDOMAINS, MAX_WORKBOOK_SIZE

from .decorators import require_subdomain, exclude_subdomain
from .models import Workbook, Account, Log
from .models import AccountSizeError, MaxWorkbookSizeError
from .utils import resolve_ancestry

logger = logging.getLogger(__name__)

DEFAULT_WORKBOOK = '{"metadata":{"version":1,"view":"all"},"components":[]}'

s3 = boto3.client('s3')
S3_BUCKET = os.environ.get('S3_BUCKET')
S3_WORKBOOK_FOLDER = os.environ.get('S3_WORKBOOK_FOLDER')
PROTOCOL = os.environ.get('PROTOCOL')


class DuplicateError(Exception):
    pass


class SelfParentError(Exception):
    pass


class InvalidNameError(Exception):
    pass


class AccountLockedError(Exception):
    pass


# called by workbook
def s3get(wb, versionId):
    if len(wb.text) > 0: # text is stored in wb.text on failed puts to S3
        return wb.text
    else:
        key = S3_WORKBOOK_FOLDER+'/'+str(wb.id).zfill(9)
        if versionId:
            response = s3.get_object(Bucket=S3_BUCKET,Key=key,VersionId=versionId)
        else:
            response = s3.get_object(Bucket=S3_BUCKET,Key=key)
        logger.debug(response)
        #if response['ResponseMetadata']['HTTPStatusCode'] != 200:
        #    raise Exception('S3 Error')
        body = response['Body'] # botocore.response.StreamingBody
        binarystring = body.read()
        text = binarystring.decode('utf-8')
        return text


# called by save, saveas, directory (for save/saveas resolution)
def s3put(wb):
    # this is a best-efforts function
    # the caller is responsible for setting wb.text before calling s3put and then calling wb.save() afterwards
    # if the put to S3 is successful, wb.text will be cleared before returning
    key = S3_WORKBOOK_FOLDER+'/'+str(wb.id).zfill(9)
    response = s3.put_object(Bucket=S3_BUCKET,Key=key,Body=wb.text) # what if we don't get a response?  maybe a bSuccess flag
    logger.debug(response)
    responseMetadata = response['ResponseMetadata']
    statusCode = responseMetadata['HTTPStatusCode']
    if statusCode == 200 or statusCode == 204:
        Log.objects.create(account=wb.owner, category='S3 Put', text='S3 Put success - ' + key)
        wb.text = ''
        return True
    else:
        Log.objects.create(account=wb.owner, category='S3 Put', text='S3 Put failure - ' + key)
        return False

def s3versions(wb):
    # with zfill(9), prefix collisions won't happen for a long time
    prefix = S3_WORKBOOK_FOLDER+'/'+str(wb.id).zfill(9)
    response = s3.list_object_versions(Bucket=S3_BUCKET,Prefix=prefix)
    logger.debug(response)
    responseMetadata = response['ResponseMetadata']
    statusCode = responseMetadata['HTTPStatusCode']
    if statusCode == 200 or statusCode == 204:
        Log.objects.create(account=wb.owner, category='S3 Versions', text='S3 Versions success - ' + prefix)
        return filter(lambda v: v['Key'] == prefix, response['Versions'])
    else:
        Log.objects.create(account=wb.owner, category='S3 Versions', text='S3 Versions failure - ' + prefix)
        return []
    
# slugify() converts to ASCII if allow_unicode is False (default - allow_unicode param added in django 1.9)
# strips leading and trailing whitespace
# converts spaces to hyphens
# removes characters that aren't alphanumeric, underscores, or hyphens
# converts to lowercase

# permitted characters: A-Za-z0-9-_\s
# previous validation was name.strip('/').replace('/', '-')
def isValidName(name):
    return re.match('^[A-Za-z0-9-_ ]+$', name) is not None

# called by saveas, create, createDir, rename, move
# the standard response to duplicate names is to send an error message and let the user correct it
def checkForDuplicate(account, parent, slug):
    bDuplicate = Workbook.objects.filter(owner=account, parent=parent, slug=slug, deleted=False).exists()
    if bDuplicate:
        raise DuplicateError()

# however, in some situations like save/saveas resolution, you have to complete the transaction - so add suffixes
# called by save/saveas resolution
# what about invalid names - what exactly does slugify do?
# for saveas, will need to sanitize automatically or just replace with a dummy name)
def getNonduplicateName(account, name):
    wbs = Workbook.objects.filter(owner=account, parent=None, deleted=False)
    slug = slugify(name)
    while True:
        bNameCollision = wbs.filter(slug=slug).exists()
        if bNameCollision:
            name += '-copy'
            slug = slugify(name)
        else:
            return name


def root(request):
    kwargs = {}
    kwargs['userid'] = request.user.account.pk
    kwargs['path'] = ''
    # reverse returns the relative uri - /d/2
    url = reverse(directory, kwargs=kwargs)
    return url


def logoutView(request):
    logout(request)
    return HttpResponseRedirect("/")  # Redirect to a success page.


def login_redirect(request):
    # we are having trouble getting login and logout to use HTTPS
    # so for now, do this:
    if PROTOCOL == 'https':
        url = 'https://www.hyperdeck.io/d/' + str(request.user.account.pk)
    else:
        url = '/d/' + str(request.user.account.pk)
    # url = root(request)
    return HttpResponseRedirect(url)


def unique_username(username):
    '''
    validator for username so we can use more standard form stuff and less
    hand-written boilerplate
    '''
    existingUser = User.objects.filter(username=username)
    if existingUser:
        raise ValidationError('Username already exists')


class SignupForm(forms.Form):
    from passwords.fields import PasswordField

    username = forms.CharField(max_length=100, label="Username",
                               validators=[unique_username])
    password = PasswordField(label="Password")
    email = forms.EmailField(max_length=254, label="Email Address")


def saveasForm(request):
    context = {"workbook": request.GET['workbook']}
    return render(request, 'griddl/saveasForm.htm', context)


def newcsrftoken(request):
    return render(request, 'griddl/newcsrftoken.htm', {"userid": request.user})


def ajaxlogin(request):
    username = request.POST['username']
    password = request.POST['password']
    user = authenticate(username=username, password=password)
    if user is None:
        return HttpResponseNotFound('Username and password do not match')
    login(request, user)
    # must replace csrftokens with a new one
    return HttpResponseRedirect("/newcsrftoken")


@exclude_subdomain(SUBDOMAINS['sandbox'])
@exclude_subdomain('staging')
def register(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        form = SignupForm(request.POST)
        context = {'form': form}
        if form.is_valid():
            email = form.cleaned_data['email']
            password = form.cleaned_data['password']
            user = User.objects.create_user(username, email, password)
            user = authenticate(username=username, password=password)
            login(request, user)
            msg = "Congratulations, your account has been created!"
            messages.success(request, msg)
            return HttpResponseRedirect(root(request))
    else:
        form = SignupForm()
        context = {'form': form, 'next': request.GET.get('next', '')}

    return render(request, 'griddl/signup.htm', context)


@exclude_subdomain(SUBDOMAINS['sandbox'])
@exclude_subdomain('dev')
@exclude_subdomain('staging')
def ajaxregister(request):
    username = request.POST['username']
    password = request.POST['password']
    email = 'foo@bar.com'
    # email = request.POST['email']
    # form = SignupForm(request.POST)
    # use if form.is_valid(): and do this to access the fields:
    #    form.cleaned_data['username']
    existingUser = User.objects.filter(username=username)
    if existingUser.count() > 0:
        msg = 'Already a user with this username - please pick a new one'
        return HttpResponseNotFound(msg)
    else:
        user = User.objects.create_user(username, email, password)
        user = authenticate(username=username, password=password)
        login(request, user)
        msg = "Congratulations, your account has been created!"
        messages.success(request, msg)
        # must replace csrftokens with a new one
        return HttpResponseRedirect("/newcsrftoken")


@login_required
@exclude_subdomain(SUBDOMAINS['sandbox'])
def password_change_redirect(request):
    messages.success(request, "Your password has been changed.")
    return HttpResponseRedirect(reverse('account', args=(request.user.pk,)))

@login_required
def directoryRedirect(request):
    return HttpResponseRedirect(root(request))


@login_required
def directory(request, userid, path=None):
    if request.user.account.pk != int(userid):
        return HttpResponseRedirect(root(request))
    # save/saveas resolution for logged-out users
    # open question: is there a better place for this?
    # what if the user's account is locked?  right now we just let it go through
    # we could permit the workbook to be saved but then lock reading for the workbook
    # if we're willing to interpret wb.locked as a read-lock rather than a write-lock
    # or create a new readLocked field
    if 'save' in request.session:
        with transaction.atomic():
            data = request.session['save']
            wb = Workbook.objects.get(pk=data['wb'])
            if wb.owner != request.user.account:
                wb.owner = request.user.account
                wb.public = False
                wb.pk = None # copy wb if non-owner tries to save
                wb.name = getNonduplicateName(account=request.user.account, name=wb.name)
            wb.text = data['text']
            wb.size = len(wb.text)
            wb.save() # the first save sets a new pk, if called for
            s3put(wb)
            wb.save() # the second save saves the blanked textfield (if the s3put worked)
            del(request.session['save'])
            
    if 'saveas' in request.session:
        with transaction.atomic():
            data = request.session['saveas']
            wb = Workbook.objects.get(pk=data['wb'])
            wb.owner = request.user.account
            wb.public = False
            wb.pk = None
            wb.name = getNonduplicateName(account=request.user.account, name=data['name'])
            wb.text = data['text']
            wb.size = len(wb.text)
            wb.save() # the first save sets a new pk
            s3put(wb)
            wb.save() # the second save saves the blanked textfield (if the s3put worked)
            del(request.session['saveas'])

    try:
        this = resolve_ancestry(userid, path)[0]
    except TypeError:  # NoneType has no indices -- returned no ancestry
        this = None

    wbs = Workbook.objects.filter(owner=request.user.account.pk, parent=this, deleted=False) \
        .order_by('filetype', 'name')

    dirs = Workbook.objects.filter(owner=request.user.account.pk, filetype='D', deleted=False)

    acctdirs = []
    
    for d in dirs:
        path = d.path_to_file
        display = '/' + path + ('' if (path == '') else '/') + d.name
        acctdirs.append({'val': d.pk, 'display': display})
        
    acctdirs = sorted(acctdirs, key=lambda d: d['display'])
    acctdirs.insert(0, {'val': 'root', 'display': 'Account Root'})

    context = {
        "workbooks": wbs,
        "acctdirs": acctdirs,
        "protocol": PROTOCOL,
        "workbookSubdomain": SUBDOMAINS['workbook']
        }
    try:
        context['path'] = this.path
        context['parentdir'] = this.parent.uri
    except:
        uri = root(request)
        if request.path != uri:  # set "Up" link if not root dir
            context['parentdir'] = uri
            context['path'] = this.path

    return render(request, 'griddl/directory.htm', context)

@login_required
@exclude_subdomain(SUBDOMAINS['sandbox'])
def account(request, userid):
    acct = Account.objects.select_related('plan')\
        .get(user=request.user.account.pk)
    plan_pk = acct.plan.pk
    context = {}
    context['size'] = acct.size
    context['plan_size'] = acct.plan_size
    context['pct'] = (100 * context['size']) // (context['plan_size'] * 1024 * 1024)
    context['noncompliant'] = acct.noncompliant
    context['plan'] = acct.plan.get_name_display()
    context['action'] = ('billing' if (plan_pk == 1) else 'sub_change')
    return render(request, 'griddl/account.htm', context)


@login_required
@exclude_subdomain(SUBDOMAINS['sandbox'])
def togglepublic(request):
    try:
        pk = request.POST.get('pk', False)
        if not pk:
            raise ValidationError('bad request')
        wb = Workbook.objects.get(pk=pk)
        if wb.owner != request.user.account:
            return JsonResponse({'success': False,
                                 'message': 'Access denied'})
        wb.public = not wb.public
        wb.save()
        return JsonResponse({'success': True, 'message': 'saved'})
    except ValidationError as e:
        return JsonResponse({'success': False, 'message': e.message})
    except Exception:
        logger.error(traceback.format_exc())
        msg = "Error: please try again."
        return JsonResponse({'success': False, 'message': msg})

@exclude_subdomain(SUBDOMAINS['sandbox'])
def save(request):
    pk = request.POST.get('id', False)
    wb = Workbook.objects.get(pk=pk)
    if request.user.is_authenticated():
        try:
            if wb.owner != request.user.account:
                return JsonResponse({'success': False,
                                     'message': 'Access denied'})
            if request.user.account.locked:
                raise AccountLockedError()
            wb.text = request.POST.get('text', '') # todo: is this ok?
            wb.size = len(wb.text)
            if wb.size > MAX_WORKBOOK_SIZE:
                raise MaxWorkbookSizeError()
            s3put(wb)
            wb.save()
            return JsonResponse({'success': True, 'message': 'saved',
                                 'wb_size': wb.size,
                                 'acct_size': request.user.account.size,
                                 'plan_size': request.user.account.plan_size})
        except MaxWorkbookSizeError as e:
            msg = e.message + " Please delete some data to save this workbook."
            return JsonResponse({'success': False, 'message': msg})
        except AccountLockedError as e:
            msg = 'Error: Your account is over your plan size limit and must be upgraded before saving.'
            return JsonResponse({'success':False, 'message': msg})
        except AccountSizeError as e:
            msg = e.message + " Please <a target='_blank' href='/subscriptions'>upgrade\
                                             to a larger plan</a> or delete\
                                             some data to save this workbook."
            return JsonResponse({'success': False, 'message': msg})
        except ValidationError as e:
            msg = e.message
            return JsonResponse({'success': False, 'message': msg})
        except Exception:
            logger.error(traceback.format_exc())
            msg = "An error occurred. Please try again."
            return JsonResponse({'success': False, 'message': msg})
    else:
        try:
            text = request.POST.get('text')
            if len(text) > MAX_WORKBOOK_SIZE:
                    raise MaxWorkbookSizeError()
            request.session['save'] = {
                'wb': wb.pk,
                'text': text
            }
            messages.info(
                request,
                'Please log in or create an account to save\
                your copy of the workbook "%s"' %
                wb.name
                )
            return JsonResponse({'success':True, 'redirect': '/signup'})
        except MaxWorkbookSizeError as e:
            msg = e.message
            return JsonResponse({'success': False, 'message': msg})

@exclude_subdomain(SUBDOMAINS['sandbox'])
def saveas(request):
    pk = request.POST.get('id')
    wb = Workbook.objects.get(pk=pk)
    if request.user.is_authenticated():
        try:
            if request.user.account.locked:
                raise AccountLockedError()
            original = wb.name
            wb.owner = request.user.account
            wb.name = request.POST.get('newname')
            wb.slug = slugify(wb.name)
            checkForDuplicate(account=request.user.account, parent=None, slug=wb.slug)
            wb.text = request.POST.get('text')
            wb.size = len(wb.text)
            wb.public = False  # for now, don't copy public status
            wb.pk = None
            if wb.size > MAX_WORKBOOK_SIZE:
                raise MaxWorkbookSizeError()
            s3put(wb)
            wb.save()
            response = {}
            response['success'] = True
            response['redirect'] = ''.join([PROTOCOL,'://',SUBDOMAINS['workbook'],'.hyperdeck.io',wb.uri])
            messages.success(request, "Successfully copied workbook {}.".format(original))
            return JsonResponse(response)
        except AccountLockedError as e:
            msg = 'Error: Your account is over your plan size limit and must be upgraded before saving.'
            return JsonResponse({'success':False, 'message': msg})
        except DuplicateError as e:
            msg = 'Error: duplicate name - please pick another name/destination.'
            return JsonResponse({'success':False, 'message': msg})
        except MaxWorkbookSizeError as e:
            msg = 'Error: workbook is over maximum allowed size.'
            return JsonResponse({'success':False, 'message': msg})
        except Exception:
            logger.error(traceback.format_exc())
            msg = "Error: please try again."
            return JsonResponse({'success': False, 'message': msg})
    else:
        try:
            text = request.POST.get('text')
            if len(text) > MAX_WORKBOOK_SIZE:
                    raise MaxWorkbookSizeError()
            request.session['saveas'] = {
                'wb': wb.pk,
                'name': request.POST.get('newname'),
                'text': text
                }
            messages.info(
                request,
                'Please log in or create an account to save\
                your copy of the workbook "%s"' %
                wb.name
                )
            return JsonResponse({'success':True, 'redirect': '/signup'})
        except MaxWorkbookSizeError as e:
            msg = 'Error: workbook is over maximum allowed size.'
            return JsonResponse({'success':False, 'message': msg})

@login_required
@exclude_subdomain(SUBDOMAINS['sandbox'])
def create(request):
    '''
    specifically, create a workbook file, not a "dir"
    '''
    try:
        name = request.POST.get('name')
        if not name:
            raise ValidationError('request missing param "name"')
        if not isValidName(name):
            raise InvalidNameError()
        path = request.POST.get('path', '')
        try:
            parent = resolve_ancestry(request.user.account.pk, path)[0]
        except TypeError:
            parent = None
        slug = slugify(name)
        checkForDuplicate(account=request.user.account, parent=parent, slug=slug)
        wb = Workbook()
        wb.owner = request.user.account
        wb.name = name
        wb.public = False
        wb.parent = parent
        wb.filetype = 'F'
        wb.text = DEFAULT_WORKBOOK
        wb.size = len(DEFAULT_WORKBOOK)
        wb.save()
        redirectUri = ''.join([PROTOCOL,'://',SUBDOMAINS['workbook'],'.hyperdeck.io',wb.uri])
        return JsonResponse({'success': True, 'redirect': redirectUri})
    except InvalidNameError as e:
        msg = 'Error: workbook and directory names can only contain alphanumeric characters, dashes, underscores, and spaces.'
        return JsonResponse({'success': False, 'message': msg})
    except ValidationError as e:
        msg = 'Error: request is missing some parameters.'
        return JsonResponse({'success': False, 'message': msg})
    except DuplicateError as e:
        msg = 'Error: duplicate name - please pick another name/destination.'
        return JsonResponse({'success': False, 'message': msg})
    except Exception:
        logger.error(traceback.format_exc())
        msg = 'Error: please try again.'
        return JsonResponse({'success': False, 'message': msg})

@login_required
@exclude_subdomain(SUBDOMAINS['sandbox'])
def createDir(request):
    try:
        name = request.POST.get('name', False)
        if not name:
            raise ValidationError('request missing param "name"')
        if not isValidName(name):
            raise InvalidNameError()
        path = request.POST.get('path', None) # parent path - e.g. 2/foo/bar
        family = resolve_ancestry(request.user.account.pk, path)
        if family:
            parent = family[0]
        else:
            parent = None
        slug = slugify(name)
        checkForDuplicate(account=request.user.account, parent=parent, slug=slug)
        wb = Workbook()
        wb.owner = request.user.account
        wb.name = name
        wb.type = 'directory'
        wb.text = ''
        wb.parent = parent
        wb.filetype = 'D'
        wb.save()
        return JsonResponse({'success': True, 'redirect': wb.uri})
    except DuplicateError as e:
        msg = 'Error: duplicate name - please pick another name/destination.'
        return JsonResponse({'success': False, 'message': msg})
    except InvalidNameError as e:
        msg = 'Error: workbook and directory names can only contain alphanumeric characters, dashes, underscores, and spaces.'
        return JsonResponse({'success': False, 'message': msg})
    except ValidationError as e:
        msg = e.message
        return JsonResponse({'success': False, 'message': msg})
    except Exception:
        logger.error(traceback.format_exc())
        msg = 'An error occured - please try again.'
        return JsonResponse({'success': False, 'message': msg})


@login_required
@exclude_subdomain(SUBDOMAINS['sandbox'])
def rename(request):
    try:
        pk = request.POST.get('id', False)
        if not pk:
            raise ValidationError('request missing param "id"')
        name = request.POST.get('newname', False).strip('/').replace('/', '-')
        if not name:
            raise ValidationError('request missing param "newname"')
        if not isValidName(name):
            raise InvalidNameError()
        wb = Workbook.objects.get(pk=pk)
        if wb.owner != request.user.account:
            raise PermissionDenied('user is not workbook owner')
        slug = slugify(name)    
        checkForDuplicate(account=request.user.account, parent=wb.parent, slug=slug)
        wb.name = name
        wb.save()
        return JsonResponse({'success': True, 'uri': wb.uri})
    except PermissionDenied:
        return JsonResponse({'success': False, 'redirect': '/login'})
    except ValidationError as e:
        msg = e.message
        return JsonResponse({'success': False, 'message': msg})
    except InvalidNameError as e:
        msg = 'Error: workbook and directory names can only contain alphanumeric characters, dashes, underscores, and spaces.'
        return JsonResponse({'success': False, 'message': msg})
    except DuplicateError as e:
        msg = 'Error: duplicate name - please pick another name/destination.'
        return JsonResponse({'success': False, 'message': msg})
    except Exception:
        logger.error(traceback.format_exc())
        mes = 'Error: please try again.'
        return JsonResponse({'success': False, 'message': msg})

@login_required
@exclude_subdomain(SUBDOMAINS['sandbox'])
def move(request):
    try:
        pk = request.POST.get('id', False)
        if not pk:
            raise ValidationError('request missing param "id"')
        wb = Workbook.objects.get(pk=pk)
        if wb.owner != request.user.account:
            raise PermissionDenied('user is not workbook owner')
        parentId = request.POST.get('parent', False)
        if not parentId:
            raise ValidationError('request missing param "parent"')
        if parentId == 'root':
            parent = None
            dstFolder = '/'
        else:
            parent = Workbook.objects.get(pk=parentId)
            if parent.isDescendantOf(wb):
                raise SelfParentError()
            dstFolder = parent.path
        checkForDuplicate(account=request.user.account, parent=parent, slug=wb.slug)
        wb.parent = parent
        wb.save()
        return JsonResponse({'success': True, 'slug': wb.slug, 'dstFolder': dstFolder})
    except PermissionDenied:
        return JsonResponse({'success': False, 'redirect': '/login'})
    except ValidationError as e:
        msg = e.message
        return JsonResponse({'success': False, 'message': msg})
    except DuplicateError as e:
        msg = 'Error: duplicate name - please pick another name/destination.'
        return JsonResponse({'success': False, 'message': msg})
    except SelfParentError as e:
        msg = 'Error: directories are not allowed to contain themselves - please pick another destination.'
        return JsonResponse({'success': False, 'message': msg})
    except Exception:
        logger.error(traceback.format_exc())
        msg = 'An error occurred - please try again.'
        return JsonResponse({'success': False, 'message': msg})

@login_required
@exclude_subdomain(SUBDOMAINS['sandbox'])
def delete(request):
    try:
        pk = request.POST.get('id', False)
        if not pk:
            raise ValidationError('request missing param "id"')
        wb = Workbook.objects.get(pk=pk)
        if wb.owner != request.user.account:
            raise PermissionDenied('user is not workbook owner')
        if wb.filetype == 'D':
            allwbs = Workbook.objects.filter(owner=request.user.account, deleted=False)
            for w in allwbs:
                if w.isDescendantOf(wb):
                    w.deleted = True
                    w.size = 0
                    w.save() # should these saves be batched?
        else:
            wb.deleted = True
            wb.size = 0
            wb.save()
        return JsonResponse({'success': True})
    except PermissionDenied:
        return JsonResponse({'success': False, 'redirect': '/login'})
    except ValidationError as e:
        msg = e.message
        return JsonResponse({'success': False, 'message': msg})
    except Exception:
        logger.error(traceback.format_exc())
        msg = 'Error: please try again.'
        return JsonResponse({'success': False, 'message': msg})

class Version():
    def __init__(self, name, timestamp):
        self.id = name
        self.datetime = timestamp
    
@login_required
@exclude_subdomain(SUBDOMAINS['sandbox'])
def versions(request, userid, path, slug):
    try:
        family = resolve_ancestry(userid, '/'.join([path, slug]))
        wb = family[0]
        versions = s3versions(wb)
        #versions = []
        #versions.append(Version('foo', datetime.datetime.now()))
        #versions.append(Version('bar', datetime.datetime.now()))
        context = {}
        context['wb'] = wb
        context['versions'] = versions
        context['parentdir'] = parentdir(request, wb)
        return render(request, 'griddl/versions.htm', context)
    except Exception:
        logger.error(traceback.format_exc())
        return HttpResponse('Not found')

def workbook(request, userid, path, slug):
    try:
        family = resolve_ancestry(userid, '/'.join([path, slug]))
        wb = family[0]
        if 'version' in request.GET:
            versionId = request.GET['version']
        else:
            versionId = None
        text = s3get(wb, versionId)
    except Exception:
        logger.error(traceback.format_exc())
        return HttpResponse('Not found')
    if not wb.public:
        if request.user.is_authenticated():
            if not request.user.account == wb.owner:
                return HttpResponse('Not found')
        else:
            return HttpResponse('Not found')
    context = {}
    context["text"] = text
    context["workbook"] = wb
    context["path"] = path
    context["userid"] = userid
    context["protocol"] = PROTOCOL
    context["sandbox"] = SUBDOMAINS['sandbox']
    tpl = loader.get_template('griddl/workbook.htm').render(context, request)
    response = HttpResponse(tpl, content_type='text/html')
    csp = "script-src 'self' https://code.jquery.com/"
    response['Content-Security-Policy'] = csp
    return response


@require_subdomain(SUBDOMAINS['sandbox'])
def results(request, userid, path, slug):
    try:
        family = resolve_ancestry(userid, '/'.join([path, slug]))
        wb = family[0]
    except Exception:
        return HttpResponse('Not found')
    if not wb.public:
        if request.user.is_authenticated():
            if not request.user.account == wb.owner:
                return HttpResponse('Not found')
        else:
            return HttpResponse('Not found')
    context = {"workbook": wb}
    if request.user.is_authenticated() and request.user.account == wb.owner:
        context['parentdir'] = parentdir(request, wb)
    return render(request, 'griddl/results.htm', context)

# this could be made a property of the Workbook model?
def parentdir(request, wb):
    notWorkbookSubdomain = SUBDOMAINS['notWorkbook']
    period = ('' if (notWorkbookSubdomain == '') else '.')
    if wb.parent != None:
        uri = wb.parent.uri # /d/2/foo/bar
    else:
        uri = root(request)
    return ''.join([PROTOCOL,'://',notWorkbookSubdomain,period,'hyperdeck.io',uri])

@require_subdomain(SUBDOMAINS['sandbox'])
def raw(request, userid, path, slug):
    try:
        family = resolve_ancestry(userid, '/'.join([path, slug]))
        wb = family[0]
        text = s3get(wb, None)
    except Exception:
        return HttpResponse('Not found')
    if not wb.public:
        if request.user.is_authenticated():
            if not request.user.account == wb.owner:
                return HttpResponse('Not found')
        else:
            return HttpResponse('Not found')
    context = {}
    context["text"] = text
    context["workbook"] = wb
    return render(request, 'griddl/raw.htm', context)


@login_required
def export(request):
    import datetime
    import json
    import StringIO
    import tarfile

    workbooks = Workbook.objects.filter(owner=request.user.account)
    mem = StringIO.StringIO() # how about ByteIO instead?  how do we construct from string w/ explicit conversion to utf-8?
    with tarfile.open('export.tar.gz', 'w:gz', mem) as archive:
        for wb in workbooks:
            if wb.size > 0:
                text = json.dumps(json.loads(wb.text), indent=4,
                                  separators=(',', ': '), sort_keys=True)
                buff = StringIO.StringIO(text)
                info = tarfile.TarInfo(wb.path)
                info.size = len(text)
                archive.addfile(info, buff)

    response = HttpResponse(mem.getvalue(),
                            content_type="application/zip")
    datestr = datetime.datetime.now().isoformat()
    header = 'attachment; filename=archive{}.tar.gz'.format(datestr)
    response['Content-Disposition'] = header
    response['Content-Encoding'] = 'gzip'
    return response


def sign_s3(request):
    file_name = request.GET.get('file_name', '')
    file_type = request.GET.get('file_type', '')
    
    presigned_post = s3.generate_presigned_post(
      Bucket = S3_BUCKET,
      Key = file_name,
      Fields = {"acl": "private", "Content-Type": file_type},
      Conditions = [
        {"acl": "private"},
        {"Content-Type": file_type}
      ],
      ExpiresIn = 3600
    )

    return JsonResponse({
      'data': presigned_post,
      #'url': 'https://%s.s3.amazonaws.com/%s' % (S3_BUCKET, file_name)
      'url': 'https://s3.amazonaws.com/%s/%s' % (S3_BUCKET, file_name)
    })


def index(request):
    context = {'scrollable':'scrollable'}
    return render(request, 'griddl/index.htm', context)
    
def jslog(request):
    msg = "JSLOG - {} - {}"
    msg.format(request.get_post('file', '(no file)'), request.get_post('msg'))
    logger.error(msg)

def logs(request):
    if not request.user.is_superuser:
        return HttpResponse('<h1>Not Found</h1><p>The requested URL /logs was not found on this server.</p>')
    lgs = Log.objects.all()
    lgs.update(viewed=True)
    context = {'logs': lgs}
    return render(request, 'griddl/logs.htm', context)

def clearViewedLogs(request):
    if not request.user.is_superuser:
        return HttpResponse('<h1>Not Found</h1><p>The requested URL /clearViewedLogs was not found on this server.</p>')
    # delete() return value (intNumberDeleted, {}) added in django 1.9
    Log.objects.filter(viewed=True).delete()
    return HttpResponse('logs cleared')

def lockAccounts(request):
    if not request.user.is_superuser:
        return HttpResponse('<h1>Not Found</h1><p>The requested URL /lockAccounts was not found on this server.</p>')
    cutoff = datetime.datetime.now() - datetime.timedelta(days=14)
    logger.debug(cutoff)
    accounts = Account.objects.filter(noncompliant=True, locked=False, noncompliantSince__lt=cutoff)
    numberLocked = accounts.update(locked=True)
    for account in accounts:
        # put up message
        pass
    return HttpResponse(str(numberLocked) + ' accounts locked')

def stats(request):
    if not request.user.is_superuser:
        return HttpResponse('<h1>Not Found</h1><p>The requested URL /stats was not found on this server.</p>')
    context = {}
    context['nUsers'] = User.objects.count()
    context['nWorkbooks'] = Workbook.objects.count()
    accounts = Account.objects.all()
    context['storageUsed'] = Workbook.objects.aggregate(Sum('size'))['size__sum']
    context['storageAllowed'] = accounts.aggregate(Sum('plan_size'))['plan_size__sum']
    context['capacityFactor'] = context['storageUsed'] / (context['storageAllowed'] * 1024 * 1024)
    context['avgWorkbookSize'] = context['storageUsed'] / context['nWorkbooks']
    context['freePlans'] = accounts.filter(plan=1).count()
    context['smallPlans'] = accounts.filter(plan=2).count()
    context['mediumPlans'] = accounts.filter(plan=3).count()
    context['largePlans'] = accounts.filter(plan=4).count()
    context['nAccountsNoncompliant'] = accounts.filter(noncompliant=True).count()
    context['nAccountsLocked'] = accounts.filter(locked=True).count()
    context['MRR'] = context['smallPlans'] * 10 + context['mediumPlans'] * 20 + context['largePlans'] * 50
    return render(request, 'griddl/stats.htm', context)

def backup(request):
    if not request.user.is_superuser:
        return HttpResponse('<h1>Not Found</h1><p>The requested URL /backup was not found on this server.</p>')
    ls = []
    users = User.objects.all()
    for user in users:
        ls.append("User.objects.create(id=" + str(user.id) +
                  ", username='" + str(user.username) +
                  "', email='" + str(user.email) +
                  "', password='" + str(user.password) + 
                  "')")
    wbs = Workbook.objects.all()
    for wb in wbs:
        ls.append("Workbook.objects.create(id=" + str(wb.id) +
                  ", owner='" + str(wb.owner) +
                  "', parent='" + str(wb.parent) +
                  "', slug='" + str(wb.slug) +
                  "', name='" + str(wb.name) +
                  "', filetype='" + str(wb.filetype) +
                  "', public=" + str(wb.public) + ")")
    context = {'text':"\n".join(ls)}
    return render(request, 'griddl/backup.htm', context)


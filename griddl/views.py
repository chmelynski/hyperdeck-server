from __future__ import unicode_literals

import logging
import traceback

from django import forms
from django.db import transaction
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.http import HttpResponseNotFound, HttpResponseServerError
from django.shortcuts import render
from django.template import loader
from django.contrib import messages
from django.core import exceptions
from django.core.urlresolvers import reverse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User

from crispy_forms.helper import FormHelper
from crispy_forms.layout import Submit

from mysite.settings import SUBDOMAINS

from .decorators import require_subdomain, exclude_subdomain
from .models import Workbook, Account, Plan, Copy
from .models import AccountSizeError, MaxWorkbookSizeError
from .utils import resolve_ancestry

logger = logging.getLogger(__name__)


def logoutView(request):
    logout(request)
    return HttpResponseRedirect("/")  # Redirect to a success page.


def login_redirect(request):
    return HttpResponseRedirect(
        reverse(directory, kwargs={'userid': request.user.account.pk,
                                   'path': ''}))


class SignupForm(forms.Form):
    def __init__(self, *args, **kwargs):
        super(SignupForm, self).__init__(*args, **kwargs)
        self.helper = FormHelper()
        self.helper.form_method = 'post'
        self.helper.form_class = 'form-horizontal'
        self.helper.form_action = '/register'
        self.helper.label_class = 'col-md-2'
        self.helper.field_class = 'col-md-10'
        self.helper.add_input(Submit('submit', 'Register'))

    username = forms.CharField(max_length=100, label="Username")
    password = forms.CharField(max_length=100, label="Password",
                               widget=forms.PasswordInput)
    email = forms.EmailField(max_length=254, label="Email Address")


def signup(request):
    form = SignupForm()
    context = {'form': form, 'next': request.GET.get('next', '')}
    return render(request, 'griddl/signup.htm', context)


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
@exclude_subdomain('dev')
@exclude_subdomain('staging')
def register(request):
    username = request.POST.get('username')
    password = request.POST.get('password')
    email = request.POST.get('email')
    # form = SignupForm(request.POST)
    # use if form.is_valid(): and do this to access the fields:
    #     form.cleaned_data['username']
    existingUser = User.objects.filter(username=username)
    if existingUser.count() > 0:
        form = SignupForm()
        return render(request,
                      'griddl/signup.htm',
                      {
                          'errorMessage': 'Already a user with this username \
                                       - please pick a new one',
                          'form': form
                      })
    else:
        user = User.objects.create_user(username, email, password)

        user = authenticate(username=username, password=password)
        login(request, user)

        # change to return directoryRedirect(request) ?
        messages.success(request,
                         "Congratulations, your account has been created!")
        return HttpResponseRedirect(
            reverse(directory, kwargs={'userid': user.pk, 'path': ''}))


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
        return HttpResponseNotFound(
            'Already a user with this username - please pick a new one')
    else:
        user = User.objects.create_user(username, email, password)

        user = authenticate(username=username, password=password)
        login(request, user)
        messages.success(request,
                         "Congratulations, your account has been created!")

        # must replace csrftokens with a new one
        return HttpResponseRedirect("/newcsrftoken")


@login_required
def directoryRedirect(request):
    return HttpResponseRedirect(reverse(directory,
                                        args=(request.user.account.pk, '',)))


@login_required
def directory(request, userid, path=None):
    if request.user.account.pk != int(userid):
        return HttpResponseRedirect(reverse(directory,
                                            args=(request.user.account.pk,
                                                  '',)))

    # open question: is there a better place for this?
    if 'saveas' in request.session:  # saveas resolution for logged-out users
        with transaction.atomic():
            wbs = Workbook.objects.filter(pk=request.user.account.pk)
            data = request.session['saveas']
            clone = Workbook.objects.get(pk=data['wb'])
            clone.owner = request.user.account
            clone.name = data['name']
            clone.text = data['text']
            clone.public = False
            clone.pk = None
            clone.save()
            del(request.session['saveas'])

    try:
        this = resolve_ancestry(userid, path)[0]
    except TypeError:  # NoneType has no indices -- returned no ancestry
        this = None

    wbs = Workbook.objects.filter(owner=request.user.account.pk, parent=this) \
        .order_by('filetype', 'name')

    dirs = Workbook.objects.filter(owner=request.user.account.pk, filetype='D')

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
        "workbookSubdomain": SUBDOMAINS['workbook']
        }
    try:
        context['path'] = this.path
        context['parentdir'] = this.parent.uri
    except:
        uri = reverse(directory, kwargs={'userid': request.user.account.pk,
                                         'path': ''})
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
    
    context = {};
    context['copy'] = Copy.objects.get(key='account').val
    context['plan'] = acct.plan.get_name_display()
    context['action'] = ('billing' if (plan_pk == 1) else 'sub_change')

    return render(request, 'griddl/account.htm', context)


@login_required
@exclude_subdomain(SUBDOMAINS['sandbox'])
def togglepublic(request):
    try:
        pk = request.POST.get('pk', False)
        if not pk:
            raise exceptions.ValidationError('bad request')
        wb = Workbook.objects.get(pk=pk)
        if wb.owner != request.user.account:
            return JsonResponse({'success': False,
                                 'message': 'Access denied'})
        wb.public = not wb.public
        wb.save()
        return JsonResponse({'success': True, 'message': 'saved'})
    except exceptions.ValidationError as e:
        return JsonResponse({'success': False, 'message': e.message})
    except Exception:
        logger.error(traceback.format_exc())
        msg = "An error occurred. Please try again."
        return JsonResponse({'success': False, 'message': msg})


@exclude_subdomain(SUBDOMAINS['sandbox'])
def save(request):
    # todo: this comment does not match the current behavior :(
    #       - actually not even close, would take some effort.
    # if user is looking at a workbook belonging to another user:
    #   if user is logged in:
    #     redirect to create_new_workbook, prompt for a name
    #   else:
    #     prompt for login or signup
    # else: # if user is looking at his own workbook
    #   if workbook is read-only:
    #     redirect to save_workbook_as
    #   else:
    #     save (note: until we have some sort of version control,
    #     this involves overwriting the old data.
    if request.user.is_authenticated():
        try:
            pk = request.POST.get('id', False)
            if not pk:
                raise exceptions.ValidationError('bad request')

            wb = Workbook.objects.get(pk=pk)
            if wb.owner != request.user.account:
                return JsonResponse({'success': False,
                                     'message': 'Access denied'})
            wb.text = request.POST.get('text', '')  # todo: is this ok?
            wb.save()
            return JsonResponse({'success': True, 'message': 'saved',
                                 'wb_size': wb.size,
                                 'acct_size': request.user.account.size,
                                 'plan_size': request.user.account.plan_size})
        except (AccountSizeError, MaxWorkbookSizeError) as e:
            msg = e.message + " Please <a target='_blank' href='/subscriptions'>upgrade\
                                             to a larger plan</a> or delete\
                                             some data to save this workbook."
            return JsonResponse({'success': False, 'message': msg})
        except exceptions.ValidationError as e:
            return JsonResponse({'success': False, 'message': e.message})
        except Exception:
            logger.error(traceback.format_exc())
            msg = "An error occurred. Please try again."
            return JsonResponse({'success': False, 'message': msg})
    else:
        return JsonResponse({'success': False, 'message': 'Access denied'})


@exclude_subdomain(SUBDOMAINS['sandbox'])
def saveas(request):
    # prompt for a name (with a popup or something)
    # save as that new name
    # similar login/signup prompts necessary if no user
    # todo: fixup for better error handling, messages, etc

    wb = Workbook.objects.get(pk=request.POST.get('id'))
    original = wb.name

    if request.user.is_authenticated():
        fork = (request.user != wb.owner)
        wb.owner = request.user.account
        wb.name = request.POST.get('newname')
        wb.text = request.POST.get('text')
        wb.public = False  # for now, don't copy public status
        wb.pk = None
        try:
            wb.save()
        except (AccountSizeError, MaxWorkbookSizeError) as e:
            # todo: actually save wb just in case?
            messages.error(e.message)
            return JsonResponse({'redirect': '/subscriptions?billing=true'})

        response = {'success': True}
        if fork:
            response['redirect'] = ''.join(['http://',SUBDOMAINS['workbook'],'.hyperdeck.io',wb.uri])
            messages.success(
                request, "Successfully copied workbook {}.".format(original))
        return JsonResponse(response)
    else:
        request.session['saveas'] = {
            'wb': wb.pk,
            'name': request.POST.get('newname'),
            'text': request.POST.get('text')
            }
        messages.info(
            request,
            'Please log in or create an account to save\
            your copy of the workbook "%s"' %
            wb.name
            )
        return JsonResponse({'redirect': '/signup'})


@login_required
@exclude_subdomain(SUBDOMAINS['sandbox'])
def create(request):
    '''
    specifically, create a workbook file, not a "dir"
    '''
    try:
        wb = Workbook()
        wb.owner = request.user.account
        wb.name = request.POST.get('name')
        if not wb.name:
            raise exceptions.ValidationError('request missing param "name"')

        wb.public = False
        path = request.POST.get('path', '')

        try:
            wb.parent = resolve_ancestry(wb.owner.pk, path)[0]
        except TypeError:
            wb.parent = None

        wb.filetype = 'F'
        wb.save()
        return HttpResponseRedirect(''.join(['http://',SUBDOMAINS['workbook'],'.hyperdeck.io',wb.uri]))
    except Exception:
        logger.error(traceback.format_exc())
        return HttpResponseServerError()


@login_required
@exclude_subdomain(SUBDOMAINS['sandbox'])
def password_change_redirect(request):
    messages.success(request, "Your password has been changed.")
    return HttpResponseRedirect(reverse('account', args=(request.user.pk,)))


@login_required
@exclude_subdomain(SUBDOMAINS['sandbox'])
def createDir(request):
    try:
        # no slashes pls
        name = request.POST.get('name', False).strip('/').replace('/', '-')
        if not name:
            raise exceptions.ValidationError('request missing param "name"')

        # note: this is "path" in the griddl.urls sense --
        #     i.e. everything between "/d/" and the last piece
        path = request.POST.get('path', None)
        logger.debug(path)

        family = resolve_ancestry(request.user.account.pk, path)
        if family:
            logger.debug("family yes - path = ".format(path))
            parent = family[0]
        else:
            logger.debug("family no :( - path = ".format(path))
            parent = None

        wb = Workbook()
        wb.owner = request.user.account
        wb.name = name
        wb.type = 'directory'
        wb.text = ''
        wb.parent = parent
        wb.filetype = 'D'
        wb.save()
        return JsonResponse({'success': True, 'redirect': wb.uri})
    except exceptions.ValidationError:
        return JsonResponse({'success': False})  # todo: send error message
    except Exception:
        logger.error(traceback.format_exc())
        return JsonResponse({'success': False})


@login_required
@exclude_subdomain(SUBDOMAINS['sandbox'])
def rename(request):
    try:
        pk = request.POST.get('id', False)
        if not pk:
            raise exceptions.ValidationError('request missing param "id"')

        wb = Workbook.objects.get(pk=pk)
        if wb.owner != request.user.account:
            raise exceptions.PermissionDenied('user is not workbook owner')

        wb.name = request.POST.get('newname', False) \
            .strip('/').replace('/', '-')
        if not wb.name:
            raise exceptions.ValidationError('request missing param "newname"')

        wb.save()
        return JsonResponse({'success': True, 'uri': wb.uri})
    except exceptions.PermissionDenied:
        return JsonResponse({'success': False, 'redirect': '/login'})
    except Exception:
        logger.error(traceback.format_exc())
        return JsonResponse({'success': False})


@login_required
@exclude_subdomain(SUBDOMAINS['sandbox'])
def delete(request):
    try:
        pk = request.POST.get('id', False)
        if not pk:
            raise exceptions.ValidationError('request missing param "id"')

        wb = Workbook.objects.get(pk=pk)
        if wb.owner != request.user.account:
            raise exceptions.PermissionDenied('user is not workbook owner')
        wb.delete()
        return JsonResponse({'success': True})
    except exceptions.PermissionDenied:
        return JsonResponse({'success': False, 'redirect': '/login'})
    except Exception:
        logger.error(traceback.format_exc())
        return JsonResponse({'success': False})


@login_required
@exclude_subdomain(SUBDOMAINS['sandbox'])
def move(request):
    try:
        pk = request.POST.get('id', False)
        if not pk:
            raise exceptions.ValidationError('request missing param "id"')

        wb = Workbook.objects.get(pk=pk)
        if wb.owner != request.user.account:
            raise exceptions.PermissionDenied('user is not workbook owner')

        parent = request.POST.get('parent', False)
        if not parent:
            raise exceptions.ValidationError('request missing param "parent"')

        dstFolder = '/'
        
        if parent == 'root':  # special case, sorry
            wb.parent = None
        else:
            dst = Workbook.objects.get(pk=parent)
            if wb == dst:
                raise Exception()
            wb.parent = dst
            dstFolder = wb.parent.path

        wb.save()
        return JsonResponse({'success': True, 'slug': wb.slug, 'dstFolder': dstFolder })
    except exceptions.PermissionDenied:
        return JsonResponse({'success': False, 'redirect': '/login'})
    except Exception:
        logger.error(traceback.format_exc())
        return JsonResponse({'success': False})


def workbook(request, userid, path, slug):
    try:
        family = resolve_ancestry(userid, '/'.join([path, slug]))
        wb = family[0]
    except Exception:
        return HttpResponse('Not found')  # todo? more specific maybe.

    if not wb.public:
        if request.user.is_authenticated():
            if not request.user.account == wb.owner:
                return HttpResponse('Access denied')
        else:
            return HttpResponse('Access denied')

    context = {
        "workbook": wb,
        "path": path,
        "userid": userid,
        "sandbox": SUBDOMAINS['sandbox']
        }

    tpl = loader.get_template('griddl/workbook.htm').render(context, request)
    response = HttpResponse(tpl, content_type='text/html')
    csp = "script-src 'self' https://code.jquery.com/"
    response['Content-Security-Policy'] = csp
    return response


@require_subdomain(SUBDOMAINS['sandbox'])
def results(request, userid, path, slug):
    # todo: this is now WET wrt views.workbook :'(
    #        AND views.directory ;_;
    #        well, tbh it was probably worse before
    try:
        family = resolve_ancestry(userid, '/'.join([path, slug]))
        wb = family[0]
    except Exception:
        return HttpResponse('Not found')  # todo? more specific maybe.

    if not wb.public:
        if request.user.is_authenticated():
            if not request.user.account == wb.owner:
                return HttpResponse('Access denied')
        else:
            return HttpResponse('Access denied')

    context = {
        "workbook": wb
    }
    if request.user.is_authenticated() and request.user.account == wb.owner:
        notWorkbookSubdomain = SUBDOMAINS['notWorkbook']
        period = '.'
        if notWorkbookSubdomain == '':
            period = ''
        if wb.parent != None:
            context['parentdir'] = ''.join(['http://',notWorkbookSubdomain,period,'hyperdeck.io',wb.parent.uri])
        else:
            uri = reverse(directory,
                          kwargs={'userid': request.user.account.pk,
                                  'path': ''})
            # reverse returns the relative url
            context['parentdir'] = ''.join(['http://',notWorkbookSubdomain,period,'hyperdeck.io',uri])

    return render(request, 'griddl/results.htm', context)


@require_subdomain(SUBDOMAINS['sandbox'])
def raw(request, userid, path, slug):
    try:
        family = resolve_ancestry(userid, '/'.join([path, slug]))
        wb = family[0]
    except Exception:
        return HttpResponse('Not found')  # todo? more specific maybe.

    if not wb.public:
        if request.user.is_authenticated():
            if not request.user.account == wb.owner:
                return HttpResponse('Access denied')
        else:
            return HttpResponse('Access denied')

    context = {
        "workbook": wb
    }

    return render(request, 'griddl/raw.htm', context)


@login_required  # is it though?
def export(request):
    import datetime
    import json
    import StringIO
    import tarfile

    workbooks = Workbook.objects.filter(owner=request.user.account)
    mem = StringIO.StringIO()
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


def index(request):
    copy = Copy.objects.get(key='index')
    context = {'content': copy.val}
    return render(request, 'griddl/index.htm', context)


def jslog(request):
    msg = "JSLOG - {} - {}"
    msg.format(request.get_post('file', '(no file)'), request.get_post('msg'))
    logger.error(msg)

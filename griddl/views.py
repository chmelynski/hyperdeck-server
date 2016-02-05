import logging

from django import forms
from django.db import transaction
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.http import HttpResponseNotFound, HttpResponseBadRequest
from django.shortcuts import render
from django.contrib import messages
from django.core.urlresolvers import reverse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User

from crispy_forms.helper import FormHelper
from crispy_forms.layout import Submit

from .models import Workbook, Account, DefaultWorkbook, Plan
from .models import AccountSizeException, MaxWorkbookSizeException

logger = logging.getLogger(__name__)


def logoutView(request):
    logout(request)
    return HttpResponseRedirect("/")  # Redirect to a success page.


def login_redirect(request):
    return HttpResponseRedirect(
        reverse(directory, kwargs={'userid': request.user.account.pk}))


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


def register(request):
    username = request.POST['username']
    password = request.POST['password']
    email = request.POST['email']
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
        # change to return directoryRedirect(request)
        messages.success(request,
                         "Congratulations, your account has been created!")
        return HttpResponseRedirect(
            reverse(directory, kwargs={'userid': user.pk}))


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
                                        args=(request.user.account.pk,)))


@login_required
def directory(request, userid, path=None):
    if request.user.account.pk != int(userid):
        return HttpResponseRedirect(reverse(directory,
                                            args=(request.user.account.pk,)))

    wbs = Workbook.objects.filter(owner=request.user.account.pk, path=path) \
        .order_by('filetype', 'name')

    if saveas in request.session:  # hack for saveas for new account
        with transaction.atomic():
            wbs.filter(name='My First Workbook').delete()
            data = request.session['saveas']
            clone = Workbook.objects.get(pk=data['wb'])
            clone.owner = request.user.account
            clone.name = data['name']
            clone.text = data['text']
            clone.public = False
            clone.pk = None
            clone.save()
            del(request.session['saveas'])

    dwbs = DefaultWorkbook.objects.filter()
    context = {
        "workbooks": wbs,
        "defaultWorkbooks": dwbs,
        }
    if path:
        context.update({
            "parentdir": path[:-(len(path.split('/')[-1])+1)],  # todo: model
            "path": path
        })
    return render(request, 'griddl/directory.htm', context)


@login_required
def account(request, userid):
    acct = Account.objects.get(user=request.user.account.pk)
    if acct.plan.pk == Plan.SIZES[0]:
        action = 'billing'
    elif acct.plan.pk == Plan.SIZES[:-1]:
        action = False
    else:
        action = 'sub_change'
    context = {
        'acct': acct,
        'action': action
        }
    return render(request, 'griddl/account.htm', context)


@login_required
def togglepublic(request):
    wb = Workbook.objects.get(pk=request.GET['pk'])
    if wb.owner != request.user.account:
        return HttpResponse('Access denied')
    wb.public = not wb.public
    wb.save()
    return HttpResponse('toggled')


def save(request):
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
        wb = Workbook.objects.filter(pk=request.POST['id'])[0]
        if wb.owner != request.user.account:
            return JsonResponse({'success': False, 'message': 'Access denied'})
        wb.text = request.POST['text']
        try:
            wb.save()
            return JsonResponse({'success': True, 'message': 'saved',
                                 'wb_size': wb.size,
                                 'acct_size': request.user.account.size,
                                 'plan_size': request.user.account.plan_size})
        except AccountSizeException:
            return JsonResponse({'success': False,
                                 'message': 'This workbook is too large for\
                                             your current plan. Please\
                                             <a href="/subscriptions">upgrade\
                                             to a larger plan</a> or delete\
                                             some data to save this workbook.'
                                 })
        except MaxWorkbookSizeException:
            msg = "Sorry, your workbook is too large and cannot be saved."
            return JsonResponse({'success': False, 'message': msg})
    else:
        return JsonResponse({'success': False, 'message': 'Access denied'})


def saveas(request):
    # prompt for a name (with a popup or something)
    # save as that new name
    # similar login/signup prompts necessary if no user

    wb = Workbook.objects.get(pk=request.POST['id'])

    if request.user.is_authenticated():
        wb.owner = request.user.account
        wb.name = request.POST['newname']
        wb.text = request.POST['text']
        wb.public = False  # for now, don't copy public status
        wb.pk = None
        try:
            wb.save()
        except:
            # todo: actually save wb just in case, or whatever.
            return JsonResponse({'redirect': '/subscriptions?billing=true'})

        urlparts = ['/f', str(request.user.account.pk), wb.name]
        if wb.path:
            urlparts.insert(2, wb.path)
        urlpath = '/'.join(urlparts)
        return JsonResponse({'redirect': urlpath})
    else:
        request.session['saveas'] = {
            'wb': wb.pk,
            'name': request.POST['newname'],
            'text': request.POST['text']
            }
        messages.info(
            request,
            'Please create an account to save your copy of the workbook "%s"' %
            wb.name
            )
        return JsonResponse({'redirect': '/signup'})


def create(request):
    '''
    lawd we gotta refactor this at some point. not at all DRY
    '''
    if request.user.is_authenticated():
        # todo: var name should be changed to something other than 'type';
        #  - it is just a DefaultWorkbook handle
        dwb = DefaultWorkbook.objects.filter(name=request.POST['type'])[0]
        wb = Workbook()
        wb.owner = request.user.account
        wb.name = request.POST['name']
        wb.type = dwb.type
        wb.text = dwb.text
        wb.public = False
        wb.parent = None  # todo: need to figure this one out
        wb.filetype = 'F'
        wb.path = request.POST['path']
        wb.save()
        return HttpResponseRedirect(wb.uri)
    else:
        return HttpResponse('Log in to create workbook')


@login_required
def password_change_redirect(request):
    messages.success(request, "Your password has been changed.")
    return HttpResponseRedirect(reverse('account', args=(request.user.pk,)))


@login_required
def createDir(request):
    wb = Workbook()
    wb.owner = request.user
    wb.name = request.POST['name']
    wb.type = 'directory'
    wb.text = ''
    wb.public = False
    wb.parent = None  # need to figure this one out
    wb.filetype = 'D'
    wb.path = request.POST['path']
    wb.save()
    return HttpResponseRedirect(wb.uri)


@login_required
def rename(request):
    wb = Workbook.objects.filter(pk=request.POST['id'])[0]
    if wb.owner != request.user.account:
        return HttpResponse('Access denied')
    wb.name = request.POST['newname']
    wb.save()
    return HttpResponseRedirect(wb.uri)


@login_required
def delete(request):
    pk = request.POST.get('id', False)
    if not pk:
        return HttpResponseBadRequest()
    wb = Workbook.objects.filter(pk=request.POST['id'])[0]
    if wb.owner != request.user.account:
        return HttpResponse('Access denied')
    wb.delete()
    return HttpResponseRedirect(
        reverse(directory, kwargs={'userid': request.user.account.pk}))


@login_required
def move(request):
    wb = Workbook.objects.filter(pk=request.POST['id'])[0]
    if wb.owner != request.user.account:
        return HttpResponse('Access denied')
    wb.path = request.POST['newpath']
    wb.save()
    return HttpResponseRedirect(wb.uri)


def workbook(request, userid, path, filename):
    try:
        user = User.objects.get(account=userid)
        wb = Workbook.objects.filter(owner=user.account,
                                     path=path, name=filename)[0]
    except:
        return HttpResponse('Not found')  # todo :D

    context = {
        "workbook": wb,
        "parentdir": path[:-(len(path.split('/')[-1])+1)],
        "path": path,
        "userid": userid
        }

    if wb.public:
        return render(request, 'griddl/' + wb.type + '.htm', context)
    else:
        if request.user.is_authenticated():
            if request.user.account == wb.owner:
                return render(request, 'griddl/' + wb.type + '.htm', context)
            else:
                return HttpResponse('Access denied')
        else:
            return HttpResponse('Access denied')


def index(request):
    context = {}
    return render(request, 'griddl/index.htm', context)

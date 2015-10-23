import os
from os.path import join

from django import forms
from django.db import transaction
from django.http import HttpResponse, HttpResponseRedirect
from django.http import HttpResponseNotFound
from django.shortcuts import render
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User

from crispy_forms.helper import FormHelper
from crispy_forms.layout import Submit

from griddl.models import Workbook, MyUser, DefaultWorkbook


def logoutView(request):
    logout(request)
    return HttpResponseRedirect("/")  # Redirect to a success page.


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
    context = {'form': form}
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
        with transaction.atomic():
            user = User.objects.create_user(username, email, password)
            myuser = MyUser(user=user)
            myuser.save()

        user = authenticate(username=username, password=password)
        login(request, user)
        # change to return profileRedirect(request)
        messages.success(request,
                         "Congratulations, your account has been created!")
        return HttpResponseRedirect("/" + str(user.pk))


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
        with transaction.atomic():
            user = User.objects.create_user(username, email, password)
            myuser = MyUser(user=user)
            myuser.save()

        user = authenticate(username=username, password=password)
        login(request, user)
        messages.success(request,
                         "Congratulations, your account has been created!")

        # must replace csrftokens with a new one
        return HttpResponseRedirect("/newcsrftoken")


def profile(request, userid):
    # todo: a weird bug: if you go to a profile url that is not yours,
    # it will just show your profile page, but with the wrong url
    if request.user.is_authenticated():
        wbs = Workbook.objects.filter(owner=request.user.pk)
        dwbs = DefaultWorkbook.objects.filter()
        context = {"workbook": wbs, "defaultWorkbooks": dwbs}
        return render(request, 'griddl/profile.htm', context)
    else:
        return HttpResponse("Access denied")


def profileRedirect(request):
    return HttpResponseRedirect("/d/" + str(request.user.pk) + "/")


def directory(request, userid, path):
    if request.user.is_authenticated():
        wbs = Workbook.objects.filter(owner=request.user.pk, path=path) \
            .order_by('filetype', 'name')
        dwbs = DefaultWorkbook.objects.filter()
        context = {
            "workbooks": wbs,
            "defaultWorkbooks": dwbs,
            "parentdir": path[:-(len(path.split('/')[-1])+1)],
            "path": path
            }
        return render(request, 'griddl/profile.htm', context)
    else:
        return HttpResponse("Access denied")


def editProfile(request):
    if request.user.is_authenticated():
        appsUsed = Workbook.objects.filter(owner=request.user.pk).count()
        myUser = MyUser.objects.filter(user=request.user.pk)[0]
        context = {
            'plan': myUser.plan,
            'appsUsed': appsUsed,
            'appsAllowed': myUser.appsAllowed
            }
        return render(request, 'griddl/editProfile.htm', context)
    else:
        return HttpResponse("Log in to edit profile")


def oldsave(request, bookid):
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
    #       this involves creating a new database row -
    #       we save every revision whole
    wb = Workbook.objects.filter(name=bookid)[0]
    wb.text = request.GET['text']
    wb.save()
    return HttpResponse('saved')


def togglepublic(request):
    if request.user.is_authenticated():
        wb = Workbook.objects.filter(pk=request.GET['pk'])[0]
        if wb.owner != request.user:
            return HttpResponse('Access denied')
        wb.public = not wb.public
        wb.save()
        return HttpResponse('toggled')
    else:
        return HttpResponse('Log in to save workbook')


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
    #     this involves creating a new database row
    #     - we save every revision whole
    if request.user.is_authenticated():
        wb = Workbook.objects.filter(pk=request.POST['id'])[0]
        if wb.owner != request.user:
            return HttpResponse('Access denied')
        wb.text = request.POST['text']
        wb.save()
        return HttpResponse('saved')
    else:
        return HttpResponse('Log in to save workbook')


def saveas(request):
    # prompt for a name (with a popup or something)
    # save as that new name
    # similar login/signup prompts necessary if no user

    # but this check should take place before the form is presented
    if request.user.is_authenticated():
        oldwb = Workbook.objects.filter(pk=request.POST['id'])[0]
        wb = Workbook()
        wb.owner = request.user
        wb.name = request.POST['newname']
        wb.type = oldwb.type
        wb.filetype = 'F'
        wb.text = request.POST['text']
        wb.public = False
        wb.path = oldwb.path
        wb.save()
        return HttpResponse('/f/' + str(request.user.pk) + '/' + wb.path +
                            '/' + wb.name)
    else:
        return HttpResponse('Log in to save workbook')


def create(request):
    if request.user.is_authenticated():
        # todo: var name should be changed to something other than 'type';
        #  - it is just a DefaultWorkbook handle
        dwb = DefaultWorkbook.objects.filter(name=request.POST['type'])[0]
        wb = Workbook()
        wb.owner = request.user
        wb.name = request.POST['name']
        wb.type = dwb.type
        wb.text = dwb.text
        wb.public = False
        wb.parent = None  # todo: need to figure this one out
        wb.filetype = 'F'
        wb.path = request.POST['path']
        wb.save()
        return HttpResponseRedirect("/d/" + str(request.user.pk) +
                                    "/" + request.POST['path'])
    else:
        return HttpResponse('Log in to create workbook')


def createDir(request):
    if request.user.is_authenticated():
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
        return HttpResponseRedirect("/d/" + str(request.user.pk) +
                                    "/" + request.POST['path'])
    else:
        return HttpResponse('Log in to create directory')


def rename(request):
    wb = Workbook.objects.filter(pk=request.POST['id'])[0]
    if wb.owner != request.user:
        return HttpResponse('Access denied')
    wb.name = request.POST['newname']
    wb.save()
    return HttpResponseRedirect("/d/" + str(request.user.pk) +
                                "/" + request.POST['path'])


def delete(request):
    wb = Workbook.objects.filter(pk=request.POST['id'])[0]
    if wb.owner != request.user:
        return HttpResponse('Access denied')
    wb.delete()
    return HttpResponseRedirect("/d/" + str(request.user.pk) +
                                "/" + request.POST['path'])


def move(request):
    wb = Workbook.objects.filter(pk=request.POST['id'])[0]
    if wb.owner != request.user:
        return HttpResponse('Access denied')
    wb.path = request.POST['newpath']
    wb.save()
    return HttpResponseRedirect("/d/" + str(request.user.pk) +
                                "/" + request.POST['path'])


def workbook(request, userid, bookid):
    try:
        # this should just be a pk, not an (owner,name) pair
        wb = Workbook.objects.filter(owner=userid, name=bookid)[0]
    except:
        return HttpResponse('Not found')
    context = {"workbook": wb}
    if wb.public:
        return render(request, 'griddl/' + wb.type + '.htm', context)
    else:
        if request.user.is_authenticated():
            if request.user == wb.owner:
                return render(request, 'griddl/' + wb.type + '.htm', context)
            else:
                return HttpResponse('Access denied')
        else:
            return HttpResponse('Access denied')


def workbook2(request, userid, path):
    try:
        name = path.split('/')[-1]
        dirs = path[:-len(name) - 1]
        wb = Workbook.objects.filter(owner=userid, path=dirs, name=name)[0]
    except:
        return HttpResponse('Not found')
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
            if request.user == wb.owner:
                return render(request, 'griddl/' + wb.type + '.htm', context)
            else:
                return HttpResponse('Access denied')
        else:
            return HttpResponse('Access denied')


def index(request):
    context = {}
    return render(request, 'griddl/index.htm', context)


def image(request):
    context = {}
    return render(request, 'griddl/image.htm', context)


def path(request, username):
    # request.path = '/griddl/chmelynski/path/to/workbook'
    # query the database for the requested resource and its permissions
    # check permissions against the requesting user
    # if a folder (username is just the name of the root folder), folder view
    # if a workbook, assemble the workbook (this may involve a template)
    # if an asset, just deliver the asset (this doesn't involve a template)

    # todo: this needs to be a setting, something like BASEDIR
    prefix = 'c:\\Users\\Adam\\Desktop\\DAZ Assets\\'

    filelist = []

    for root, dirs, files in os.walk(prefix):
        for file in files:
            filelist.append(join(root, file))

    context = {'filelist': filelist}  # 'path' : thepath
    return render(request, 'griddl/filereport.htm', context)


def drawing(request):
    context = {}
    context['text'] = '/static/griddl/drawingdata/' + request.GET['text']
    context['table'] = '/static/griddl/drawingdata/' + request.GET['table']
    return render(request, 'griddl/drawing.htm', context)


def music(request):
    context = {}
    context['song'] = '/static/griddl/musicdata/' + request.GET['song']
    return render(request, 'griddl/music.htm', context)


def scrubber(request):
    context = {}
    context['type'] = request.GET['type']
    context['json'] = '/static/griddl/scrubberdata/' + request.GET['json']
    return render(request, 'griddl/scrubber.htm', context)


def filereport(request):
    # prefix = 'C:\\Users\\Adam\\Desktop\\DAZ Assets'
    # prefix = 'C:\\Program Files\\DAZ 3D\\DAZStudio4'
    # prefix = 'C:\\Users\\Public\\Documents\\My DAZ 3D Library'
    # prefix = 'C:\\Users\\Adam\\Documents\\DAZ 3D'
    # prefix = 'C:\\Users\\Adam\\Downloads\\DAZ'
    # prefix = 'C:\\Users\\Adam\\AppData\\Roaming\\DAZ 3D'
    # prefix = 'C:\\Users\\Adam\\Desktop\\django'
    # prefix = 'C:\\Users\\Adam\\Downloads\\python-2.6.6'
    # prefix = 'C:\\cygwin'
    prefix = request.GET['dir']
    filelist = []
    for root, dirs, files in os.walk(prefix):
        for file in files:
            filelist.append(root + '\\' + file)
    context = {'filelist': filelist}
    return render(request, 'griddl/filereport.htm', context)

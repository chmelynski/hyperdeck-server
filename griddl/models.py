import json
import logging

from django.db import models
from django.template.defaultfilters import slugify
from django.utils.functional import cached_property

from mysite import settings

FILE_TYPES = (
    ('F', 'File'),
    ('D', 'Dir'),
    ('L', 'Link')
)

BASE_WORKBOOK = [{
    'type': 'md',
    'visible': 'true',
    'name': 'md1',
    'text': '# Welcome to your first workbook!\n\n \
             Edit this component or add more to get started.'
}]

MY_FIRST_WORKBOOK = json.dumps(BASE_WORKBOOK)

logger = logging.getLogger(__name__)


class AccountSizeError(Exception):
    """
    Your account has exceeded the storage allowed by your plan. Please
    upgrade your account or delete some workbooks to make more space.
    """
    pass


class MaxWorkbookSizeError(Exception):
    pass


class Workbook(models.Model):
    owner = models.ForeignKey("Account")
    filetype = models.CharField(max_length=1, choices=FILE_TYPES,
                                default='F')
    parent = models.ForeignKey('self', null=True, blank=True,
                               on_delete=models.CASCADE,
                               limit_choices_to={'filetype': 'D'})
    contentType = models.CharField(blank=True, max_length=200)
    version = models.IntegerField(default=0)
    name = models.CharField(max_length=200)
    slug = models.SlugField()
    text = models.TextField(blank=True, default=MY_FIRST_WORKBOOK)
    modified = models.DateTimeField(null=True, auto_now=True)
    public = models.BooleanField(default=False)
    deleted = models.BooleanField(default=False)  # user-initiated removal
    locked = models.BooleanField(default=False)  # automated/administrative

    class Meta:
        unique_together = ("owner", "parent", "slug")

    @cached_property
    def path_to_file(self):
        """climb the inheritance tree to build filepath"""
        if self.parent:
            current_wb = self.parent
            parents = [self.parent.slug]
            while current_wb.parent is not None:
                parents.insert(0, current_wb.parent.slug)
                current_wb = current_wb.parent
            return '/'.join(parents).replace('//', '/')
        else:
            return ''

    @property
    def path(self):
        return '/'.join([self.path_to_file, self.slug]).replace('//', '/')

    @property
    def uri(self):
        """convenience for redirects & such"""
        return '/'.join(['', self.filetype.lower(),
                         str(self.owner.pk), self.path])\
                  .replace('//', '/')

    @property
    def size(self):
        return len(self.text)

    def __unicode__(self):
        return self.uri

    def save(self, *args, **kwargs):
        '''
        Before saving a workbook, check account size against plan size.
        If saving would break plan size limit, lock stuff as needed.
        Unresolved so far: notifications regarding account size stuff.

        ALSO: convert name to slug for URI

        Future warning: much more complicated in python3 -- see:
        http://stackoverflow.com/questions/4013230/how-many-bytes-does-a-string-have
        '''

        # deal with the hard nopes first
        if len(self.text) >= settings.MAX_WORKBOOK_SIZE:
            raise MaxWorkbookSizeError("Sorry, this workbook is too big for\
                                        your current account.")
        if len(self.text) >= self.owner.plan_size * 1024 * 1024:
            raise AccountSizeError("Sorry, this workbook is too big for your\
                                    current account.")

        self.slug = slugify(self.name)

        # save before handling size restrictions other than hard nopes
        # this means everything below should be careful re: recursion?
        super(Workbook, self).save(*args, **kwargs)

        # surprise! actually now we're doing both signal and override.
        # pre_save signal for workbooks handles workbook/account size checks.


class Plan(models.Model):
    '''
    Details about each plan available
    Unfortunately, tied pretty heavily to FastSpring settings.

    Maybe we need to re-rethink this?

    NB: table contents managed by a custom migration
    '''

    FREE, SMALL, MEDIUM, LARGE = range(1, 5)

    NAMES = (
        (0, 'Placeholder'),
        (FREE, 'Free'),
        (SMALL, 'Small'),
        (MEDIUM, 'Medium'),
        (LARGE, 'Large')
    )

    # in MB
    # note: changes here *require* changes in FastSpring settings,
    #       and vice versa.
    SIZES = (
        (0, 0),  # placeholder (i know, and i'm sorry)
        (FREE,     2),
        (SMALL,   50),
        (MEDIUM, 200),
        (LARGE,  500)
    )
    
    PRICES = (
        (0, 0),
        (FREE,    0.00),
        (SMALL,   9.99),
        (MEDIUM, 19.99),
        (LARGE,  49.99)
    )

    name = models.IntegerField(choices=NAMES, default=FREE, unique=True)

    def _get_size(self):
        return self.SIZES[self.name][1]

    size = property(_get_size)
    
    def _get_price(self):
        return self.PRICES[self.name][1]

    price = property(_get_price)

    def details(self):
        details = {
            'name': self.get_name_display(),
            'size': '%d MB' % self.size,
            'price': '$%.2f/month' % self.price,
            'id': self.pk
        }
        return details

    def __unicode__(self):
        return "%s Plan (%d MB)" % (self.get_name_display(), self.size)


class Account(models.Model):
    '''
    extend User model with Account info
    '''
    user = models.OneToOneField(settings.AUTH_USER_MODEL)
    plan = models.ForeignKey(Plan, default=Plan.FREE)
    subscription = models.ForeignKey('billing.Subscription', null=True,
                                     on_delete=models.SET_NULL, blank=True)

    def _get_size(self):
        return sum([wb.size for wb in Workbook.objects.filter(owner=self)])

    size = property(_get_size)

    def _get_plan_size(self):
        return self.plan.size * 1024 * 1024  # maybe not the best way for this to work

    plan_size = property(_get_plan_size)

    def _get_upgrade_link(self):
        return "/billing/%d/%d" % (self.plan + 1, self.pk)

    upgrade_link = property(_get_upgrade_link)

    def __unicode__(self):
        return self.user.username

class Preferences(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL)
    editorKeymap = models.CharField(max_length=255, null=True, blank=True, choices=(("vim","vim"),("emacs","emacs"),("sublime","sublime")))
    editorTheme = models.CharField(max_length=255, null=True, blank=True)
    editorAddons = models.TextField(blank=True)
    style = models.TextField(blank=True)
    script = models.TextField(blank=True)
    showTooltips = models.BooleanField(default=True)

    def __unicode__(self):
        return self.user.username
        

class DefaultWorkbook(models.Model):
    '''
    Define base/standard workbooks; data in fixtures/initial_data.
    '''
    # this is not the same as Workbook.name
    # - it is a handle that corresponds to options in a select box
    name = models.CharField(max_length=255)

    # different 'name' handles can have the same template type
    # but different text (like bar-chart and line-chart both use svg)
    type = models.CharField(max_length=255)

    text = models.TextField(blank=True)

    def __unicode__(self):
        return self.name

class Copy(models.Model):
    key = models.CharField(max_length=255)
    val = models.TextField(blank=True)


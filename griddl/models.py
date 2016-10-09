from __future__ import unicode_literals

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

logger = logging.getLogger(__name__)


class AccountSizeError(Exception):
    """
    Your account has exceeded the storage allowed by your plan. Please
    upgrade your account or delete some workbooks to make more space.
    """
    pass


class MaxWorkbookSizeError(Exception):
    """
    This workbook exceeds the maximum workbook size: please make it smaller before saving.
    """
    # settings.MAX_WORKBOOK_SIZE, but how do we get that into the triple-quoted string?
    pass


class Workbook(models.Model):
    owner = models.ForeignKey("Account")
    filetype = models.CharField(max_length=1, choices=FILE_TYPES,
                                default='F')
    parent = models.ForeignKey('self', null=True, blank=True,
                               on_delete=models.CASCADE,
                               limit_choices_to={'filetype': 'D'})
    contentType = models.CharField(blank=True, max_length=200)
    version = models.IntegerField(default=1)
    name = models.CharField(max_length=200)
    slug = models.SlugField()
    size = models.IntegerField(default=0)
    text = models.TextField(blank=True)
    modified = models.DateTimeField(null=True, auto_now=True)
    public = models.BooleanField(default=False)
    deleted = models.BooleanField(default=False)  # user-initiated removal
    locked = models.BooleanField(default=False)  # automated/administrative

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

    def __unicode__(self):
        return self.uri
    
    def isDescendantOf(self, ancestor):
        if self == ancestor:
            return True
        elif self.parent == None:
            return False
        else:
            return self.parent.isDescendantOf(ancestor)

    def save(self, *args, **kwargs):
        
        # trim leading and trailing whitespace
        # convert spaces to hyphens
        # remove all characters except alphanumeric, hyphen, and underscore
        # convert to lower case
        self.slug = slugify(self.name)

        super(Workbook, self).save(*args, **kwargs)



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
    #subscription = models.ForeignKey('billing.Subscription', null=True,
    #                                 on_delete=models.SET_NULL, blank=True)
                 
    reference_id = models.CharField(max_length=255,
                                    blank=True,
                                    help_text="FastSpring reference ID",
                                    default=''
                                    )
    details_url = models.CharField(max_length=255,
                                   blank=True,
                                   help_text="FastSpring details link",
                                   default=''
                                   )
    
    def _get_size(self):
        return sum([wb.size for wb in Workbook.objects.filter(owner=self)])

    size = property(_get_size)

    plan_size = models.IntegerField(default=2) # in MB
    noncompliant = models.BooleanField(default=False)
    noncompliantSince = models.DateTimeField(null=True)
    locked = models.BooleanField(default=False)

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

class Copy(models.Model):
    key = models.CharField(max_length=255)
    val = models.TextField(blank=True)

class DefaultWorkbook:
    pass


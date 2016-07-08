import logging

from .models import Workbook

logger = logging.getLogger(__name__)


def resolve_ancestry(userid, path):
    '''
    resolve chains of ancestry and return either:
    - a list of objects where list-index = nth-ancestor
    - None (for root dir)

    (valid return example: [target_wb, parent_wb, grandparent_wb])
    '''

    if path:
        logger.debug("in resolver: {}".format(path))
        ancestors = []
        path = path.strip('/')
        last = None
        if '/' in path:
            parts = path.split('/')
            logger.debug("parts: {}".format(parts))
        else:
            parts = [path]

        for obj in parts:
            logger.debug("obj: {}".format(obj))
            this = Workbook.objects.get(owner=userid,
                                        name=obj,
                                        parent=last
                                        )
            last = this
            ancestors.append(this)

        ancestors.reverse()
        return ancestors

    else:
        return None


def reflow(wb):
    '''
    invalidate all cached paths of wb's descendents
    NB: may be completely unnecessary for our use-cases

    WARNING: recursion lol
    '''
    children = wb.parent_set.all()
    for child in children:
        del child.path_to_file
        reflow(child)

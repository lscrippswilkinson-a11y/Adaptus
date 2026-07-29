import ui1 from './ui1'
import ui2 from './ui2'
import coach from './coach'
import biz from './biz'
import type { Dict } from '@/i18n'

/** Merged in load order; a later chunk wins on a duplicate key. */
const dict: Dict = { ...ui1, ...ui2, ...coach, ...biz }

export default dict

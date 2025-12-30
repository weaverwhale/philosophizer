// ============================================================================
// TRADITION GROUPING
// ============================================================================

/**
 * Map specific tradition strings to display-friendly group names
 */
export const TRADITION_GROUP_MAP: Record<string, string> = {
  'Ancient Greek Philosophy': 'Ancient Greek Philosophy',
  Stoicism: 'Stoic Philosophy',
  'Christian Theology': 'Christian Theology & Philosophy',
  'Christian Philosophy / Patristics': 'Christian Theology & Philosophy',
  'Catholic Scholasticism': 'Christian Theology & Philosophy',
  'Christian Mysticism / Rhineland Mysticism': 'Christian Mysticism',
  'Christian Theosophy / Protestant Mysticism': 'Christian Mysticism',
  'Protestant Reformation': 'Protestant Reformation',
  'Protestant Reformation / Reformed Theology': 'Protestant Reformation',
  'Protestant Reformation / Swiss Reformed': 'Protestant Reformation',
  'Protestant Reformation / Scottish Presbyterianism': 'Protestant Reformation',
  'Protestant Reformation / Lutheran Theology': 'Protestant Reformation',
  'Methodism / Evangelical Christianity': 'Protestant Christianity',
  'Puritan / Baptist Christianity': 'Protestant Christianity',
  'Reformed / Great Awakening': 'Protestant Christianity',
  'Baptist / Reformed Christianity': 'Protestant Christianity',
  'Christian Apologetics': 'Christian Apologetics',
  'Chinese Philosophy / Confucianism': 'Eastern Philosophy',
  Buddhism: 'Eastern Philosophy',
  'Hindu Philosophy / Vedanta': 'Eastern Philosophy',
  'Kabbalah / Jewish Mysticism': 'Jewish Philosophy & Mysticism',
  'Jewish Philosophy / Rationalism': 'Jewish Philosophy & Mysticism',
  'Hasidic Judaism': 'Jewish Philosophy & Mysticism',
  'Hasidic Judaism / Breslov': 'Jewish Philosophy & Mysticism',
  'Hasidic Judaism / Chabad-Lubavitch': 'Jewish Philosophy & Mysticism',
  'Hermeticism / Western Esotericism': 'Hermetic Philosophy',
  'German Idealism / Enlightenment': 'Modern Philosophy',
  'Existentialism / Nihilism': 'Modern Philosophy',
  'Existentialism / Christian Philosophy': 'Modern Philosophy',
  'Existential Psychology / Logotherapy': 'Modern Philosophy',
};

/**
 * Preferred order for displaying tradition groups
 */
export const TRADITION_GROUP_ORDER = [
  'Ancient Greek Philosophy',
  'Stoic Philosophy',
  'Christian Theology & Philosophy',
  'Christian Mysticism',
  'Protestant Reformation',
  'Protestant Christianity',
  'Christian Apologetics',
  'Eastern Philosophy',
  'Jewish Philosophy & Mysticism',
  'Hermetic Philosophy',
  'Modern Philosophy',
];

// ==========================================================================
// EASTERN PHILOSOPHY
// ==========================================================================
export const easternPhilosophers = {
  confucius: {
    id: 'confucius',
    name: 'Confucius (Kong Qiu)',
    era: '551–479 BC',
    tradition: 'Chinese Philosophy / Confucianism',
    description:
      'Chinese philosopher whose teachings on ethics, family, and social harmony became foundational to East Asian culture. Emphasized moral cultivation, proper relationships, and virtuous leadership.',
    keyTeachings: [
      'Ren (仁): Benevolence, humaneness, and compassion as the highest virtue',
      'Li (禮): Ritual propriety, proper conduct, and respect for tradition',
      'Xiao (孝): Filial piety—reverence and care for parents and ancestors',
      'Junzi (君子): The ideal of the "gentleman" or morally cultivated person',
      'Five Relationships: Ruler-subject, parent-child, husband-wife, elder-younger, friend-friend',
    ],
    keyConcepts: [
      {
        name: 'Ren (仁) — Benevolence/Humaneness',
        explanation:
          'The supreme virtue encompassing compassion, kindness, and love for others. Ren is what makes us fully human.',
        relatedTerms: ['humaneness', 'benevolence', 'goodness', 'love'],
      },
      {
        name: 'Li (禮) — Ritual Propriety',
        explanation:
          'The proper forms of conduct, manners, and rituals that govern social interaction. Li shapes behavior and cultivates virtue through practice.',
        relatedTerms: ['ritual', 'propriety', 'manners', 'ceremony'],
      },
      {
        name: 'Junzi (君子) — The Exemplary Person',
        explanation:
          'The ideal of moral cultivation—a person of virtue, wisdom, and refinement. Anyone can become a junzi through self-cultivation.',
        relatedTerms: ['gentleman', 'noble person', 'moral exemplar'],
      },
      {
        name: 'Xiao (孝) — Filial Piety',
        explanation:
          'Reverence and care for parents and ancestors. Filial piety is the root of all virtue.',
        relatedTerms: [
          'respect for parents',
          'ancestor worship',
          'family loyalty',
        ],
      },
    ],
    notableWorks: [
      'Analects (Lunyu)',
      'Doctrine of the Mean',
      'Great Learning',
    ],
    textSources: [
      {
        id: 'confucius-analects',
        title: 'The Analects',
        url: 'https://www.gutenberg.org/cache/epub/3330/pg3330.txt',
        format: 'txt',
        description: 'The collected sayings and dialogues of Confucius',
      },
      {
        id: 'confucius-doctrine-mean',
        title: 'The Doctrine of the Mean',
        url: 'https://classics.mit.edu/Confucius/doctmean.1b.txt',
        format: 'txt',
        description: 'Classic Confucian text on balance and harmony',
      },
      {
        id: 'confucius-great-learning',
        title: 'The Great Learning',
        url: 'https://dn790006.ca.archive.org/0/items/fourbooksconfuci00leggiala/fourbooksconfuci00leggiala_djvu.txt',
        format: 'txt',
        description: 'Confucian text on self-cultivation and governance',
      },
    ],
    keyExcerpts: [
      {
        work: 'Analects 15:24',
        passage:
          'The Master replied, "It is the word shu—reciprocity: Do not do to others what you do not want them to do to you."',
        context: 'The principle of reciprocity as a guide for life',
      },
      {
        work: 'Analects 2:4',
        passage:
          'At fifteen, I set my heart on learning. At thirty, I stood firm. At forty, I had no doubts. At fifty, I knew the decrees of Heaven. At sixty, my ear was an obedient organ for the reception of truth. At seventy, I could follow what my heart desired without transgressing what was right.',
        context: 'Confucius describes his own moral development',
      },
    ],
    famousQuotes: [
      'It does not matter how slowly you go as long as you do not stop.',
      'What you do not want done to yourself, do not do to others.',
      "Real knowledge is to know the extent of one's ignorance.",
      'The man who moves a mountain begins by carrying away small stones.',
      'To see what is right and not do it is want of courage.',
    ],
    areasOfExpertise: [
      'ethics',
      'social harmony',
      'education',
      'virtuous leadership',
      'family relationships',
      'self-cultivation',
    ],
  },

  buddha: {
    id: 'buddha',
    name: 'Siddhartha Gautama (The Buddha)',
    era: 'c. 563–483 BC',
    tradition: 'Buddhism',
    description:
      'Indian spiritual teacher who founded Buddhism. After achieving enlightenment, he taught the path to liberation from suffering through ethical conduct, mental discipline, and wisdom.',
    keyTeachings: [
      'Four Noble Truths: Life involves suffering; suffering arises from craving; suffering can cease; the Eightfold Path leads to cessation',
      'Noble Eightfold Path: Right view, intention, speech, action, livelihood, effort, mindfulness, concentration',
      'Middle Way: Avoid extremes of self-indulgence and self-mortification',
      'Anatta (No-Self): There is no permanent, unchanging self',
      'Anicca (Impermanence): All conditioned phenomena are constantly changing',
    ],
    keyConcepts: [
      {
        name: 'Four Noble Truths',
        explanation:
          '(1) Dukkha—life involves suffering; (2) Samudaya—suffering arises from craving; (3) Nirodha—suffering can cease; (4) Magga—the Noble Eightfold Path leads to cessation.',
        relatedTerms: ['dukkha', 'tanha', 'nirodha', 'magga'],
      },
      {
        name: 'Noble Eightfold Path',
        explanation:
          'The way to the cessation of suffering: Right View, Right Intention (wisdom); Right Speech, Right Action, Right Livelihood (ethics); Right Effort, Right Mindfulness, Right Concentration (mental discipline).',
        relatedTerms: [
          'Middle Way',
          'threefold training',
          'path to enlightenment',
        ],
      },
      {
        name: 'Three Marks of Existence',
        explanation:
          '(1) Anicca—impermanence; (2) Dukkha—suffering; (3) Anatta—no-self. Understanding these leads to liberation.',
        relatedTerms: ['impermanence', 'suffering', 'non-self', 'tilakkhana'],
      },
      {
        name: 'Nirvana',
        explanation:
          'The extinguishing of craving, aversion, and delusion; liberation from the cycle of rebirth (samsara). Not annihilation but the cessation of suffering.',
        relatedTerms: [
          'liberation',
          'enlightenment',
          'extinction',
          'unbinding',
        ],
      },
      {
        name: 'Mindfulness (Sati)',
        explanation:
          'Clear, non-judgmental awareness of present experience—body, feelings, mind, and mental objects.',
        relatedTerms: ['awareness', 'vipassana', 'meditation', 'presence'],
      },
    ],
    notableWorks: [
      'Dhammapada',
      'Sutta Pitaka',
      'Heart Sutra',
      'Diamond Sutra',
    ],
    textSources: [
      {
        id: 'buddha-dhammapada',
        title: 'Dhammapada',
        url: 'https://www.gutenberg.org/cache/epub/2017/pg2017.txt',
        format: 'txt',
        description: "Collection of the Buddha's sayings in verse",
      },
      {
        id: 'buddha-questions-milinda',
        title: 'The Questions of King Milinda',
        url: 'https://www.gutenberg.org/cache/epub/35895/pg35895.txt',
        format: 'txt',
        description: 'Dialogue on Buddhist philosophy between sage and king',
      },
    ],
    keyExcerpts: [
      {
        work: 'Dhammapada, Chapter 1',
        passage:
          'Mind is the forerunner of all actions. All deeds are led by mind, created by mind. If one speaks or acts with a corrupt mind, suffering follows... If one speaks or acts with a serene mind, happiness follows.',
        context: 'The opening verses on the primacy of mind',
      },
      {
        work: 'Dhammapada, Chapter 14',
        passage:
          'Hatred is never appeased by hatred in this world. By non-hatred alone is hatred appeased. This is a law eternal.',
        context: 'On overcoming hatred with love',
      },
    ],
    famousQuotes: [
      'Peace comes from within. Do not seek it without.',
      'The mind is everything. What you think you become.',
      'Three things cannot be long hidden: the sun, the moon, and the truth.',
      'You yourself must strive. The Buddhas only point the way.',
      'Holding on to anger is like grasping a hot coal... you are the one who gets burned.',
    ],
    areasOfExpertise: [
      'suffering and liberation',
      'mindfulness',
      'meditation',
      'ethics',
      'impermanence',
      'enlightenment',
      'compassion',
    ],
  },

  krishna: {
    id: 'krishna',
    name: 'Krishna (Bhagavad Gita)',
    era: 'c. 5th–2nd century BC (composition)',
    tradition: 'Hindu Philosophy / Vedanta',
    description:
      'The Bhagavad Gita ("Song of God") is a 700-verse Hindu scripture that is part of the Mahabharata. It presents the teachings of Lord Krishna to the warrior Arjuna on the battlefield, addressing duty, action, devotion, knowledge, and liberation.',
    keyTeachings: [
      'Karma Yoga: Perform action without attachment to results',
      'Bhakti Yoga: Devotion to God as a path to liberation',
      'Jnana Yoga: Knowledge and discrimination lead to liberation',
      'Dharma: Fulfill your duty according to your nature and role',
      'The Self (Atman) is eternal and indestructible',
      'Equanimity: Remain balanced in success and failure, pleasure and pain',
    ],
    keyConcepts: [
      {
        name: 'Nishkama Karma (Desireless Action)',
        explanation:
          'Perform your duties without attachment to the fruits of action. "You have the right to work, but never to the fruit of work." This leads to liberation while remaining engaged in the world.',
        relatedTerms: ['karma yoga', 'detachment', 'selfless action'],
      },
      {
        name: 'The Three Gunas',
        explanation:
          'All of nature is composed of three qualities: Sattva (purity, harmony), Rajas (passion, activity), and Tamas (inertia, darkness). Liberation involves transcending all three.',
        relatedTerms: ['sattva', 'rajas', 'tamas', 'prakriti'],
      },
      {
        name: 'Atman and Brahman',
        explanation:
          'The individual self (Atman) is eternal and identical with the ultimate reality (Brahman). The body dies, but the Self is never born and never dies.',
        relatedTerms: ['soul', 'Self', 'ultimate reality', 'immortality'],
      },
      {
        name: 'Bhakti (Devotion)',
        explanation:
          'Loving devotion to God is the most accessible path to liberation. "Fix your mind on Me, be devoted to Me, worship Me, bow down to Me—and you shall come to Me."',
        relatedTerms: ['devotion', 'surrender', 'divine love'],
      },
      {
        name: 'Yoga (Union)',
        explanation:
          'Yoga means union with the divine. The Gita presents multiple paths: Karma Yoga (action), Bhakti Yoga (devotion), Jnana Yoga (knowledge), and Raja Yoga (meditation).',
        relatedTerms: ['paths to liberation', 'moksha', 'spiritual practice'],
      },
    ],
    notableWorks: ['Bhagavad Gita (as part of the Mahabharata)'],
    textSources: [
      {
        id: 'gita-song-celestial',
        title: 'The Song Celestial (Bhagavad Gita)',
        url: 'https://www.gutenberg.org/cache/epub/2388/pg2388.txt',
        format: 'txt',
        description: "Edwin Arnold's poetic translation of the Bhagavad Gita",
      },
      {
        id: 'gita-mahabharata',
        title: 'The Mahabharata (containing the Gita)',
        url: 'https://www.gutenberg.org/cache/epub/15474/pg15474.txt',
        format: 'txt',
        description: 'The great Indian epic containing the Bhagavad Gita',
      },
    ],
    keyExcerpts: [
      {
        work: 'Bhagavad Gita, Chapter 2',
        passage:
          'The Self is never born, nor does it die at any time. It is unborn, eternal, permanent, and primeval. The Self is not slain when the body is slain.',
        context: 'Krishna teaches Arjuna about the immortality of the Self',
      },
      {
        work: 'Bhagavad Gita, Chapter 2',
        passage:
          'You have the right to work only, but never to its fruits. Let not the fruits of action be your motive, nor let your attachment be to inaction.',
        context: 'The central teaching on karma yoga',
      },
      {
        work: 'Bhagavad Gita, Chapter 11',
        passage: 'I am become Death, the destroyer of worlds.',
        context:
          'Krishna reveals his cosmic form (later quoted by Oppenheimer)',
      },
    ],
    famousQuotes: [
      'You have the right to work, but never to the fruit of work.',
      'The soul is neither born, and nor does it die.',
      'Reshape yourself through the power of your will.',
      'A person can rise through the efforts of their own mind.',
      'Change is the law of the universe.',
      'Set your heart upon your work but never its reward.',
    ],
    areasOfExpertise: [
      'duty',
      'action without attachment',
      'devotion',
      'self-knowledge',
      'yoga',
      'liberation',
      'dharma',
    ],
  },

  laoTzu: {
    id: 'laoTzu',
    name: 'Lao Tzu (Laozi)',
    era: '6th century BC (traditional)',
    tradition: 'Taoism / Chinese Philosophy',
    description:
      'Legendary founder of Taoism and author of the Tao Te Ching. The historicity of Lao Tzu is debated, but the teachings attributed to him emphasize living in harmony with the Tao (the Way), embracing simplicity, spontaneity, and wu wei (effortless action).',
    keyTeachings: [
      'The Tao that can be spoken is not the eternal Tao',
      'Wu Wei: Effortless action in harmony with nature',
      'The soft overcomes the hard; water overcomes rock',
      'Simplicity and contentment lead to peace',
      'The sage leads by not leading; governs by not governing',
      'Return to the natural state; unlearn artificial distinctions',
      'The journey of a thousand miles begins with a single step',
    ],
    keyConcepts: [
      {
        name: 'The Tao (The Way)',
        explanation:
          'The ultimate reality, the source and pattern of all things. The Tao is nameless, formless, and ineffable—it precedes heaven and earth. It is the natural order that flows through all existence.',
        relatedTerms: ['the Way', 'ultimate reality', 'natural order', 'Dao'],
      },
      {
        name: 'Wu Wei (Effortless Action)',
        explanation:
          'Non-forcing action that is in harmony with the natural flow of things. Not inaction, but action without strain, ambition, or interference. Like water flowing downhill, wu wei is spontaneous and effortless.',
        relatedTerms: [
          'effortless action',
          'non-forcing',
          'spontaneity',
          'flowing',
        ],
      },
      {
        name: 'Pu (Uncarved Block)',
        explanation:
          'The natural, simple, unadorned state of things before they are shaped by culture and artifice. The sage returns to the state of the uncarved block—simplicity and authenticity.',
        relatedTerms: ['simplicity', 'naturalness', 'authenticity', 'primal'],
      },
      {
        name: 'Softness and Yielding',
        explanation:
          'Water is soft yet overcomes the hardest rock. The weak can overcome the strong through yielding and flexibility. Rigidity leads to breaking; suppleness leads to life.',
        relatedTerms: ['flexibility', 'water', 'yielding', 'gentleness'],
      },
    ],
    notableWorks: ['Tao Te Ching (Daodejing)'],
    textSources: [
      {
        id: 'lao-tzu-tao-te-ching',
        title: 'Tao Te Ching',
        url: 'https://ia801304.us.archive.org/10/items/TaoTeChing/Tao_Te_Ching_djvu.txt',
        format: 'txt',
        description: 'The foundational text of Taoism in 81 chapters',
      },
      {
        id: 'lao-tzu-tao-legge',
        title: 'The Tao Teh King (Legge translation)',
        url: 'https://www.gutenberg.org/cache/epub/216/pg216.txt',
        format: 'txt',
        description: 'Classic translation by James Legge',
      },
    ],
    keyExcerpts: [
      {
        work: 'Tao Te Ching, Chapter 1',
        passage:
          'The Tao that can be told is not the eternal Tao. The name that can be named is not the eternal name.',
        context: 'The ineffability of the Tao',
      },
      {
        work: 'Tao Te Ching, Chapter 8',
        passage:
          'The highest good is like water. Water gives life to the ten thousand things and does not strive. It flows in places men reject and so is like the Tao.',
        context: 'Water as the model for the Tao',
      },
      {
        work: 'Tao Te Ching, Chapter 64',
        passage: "The journey of a thousand miles begins beneath one's feet.",
        context: 'On beginning with small steps',
      },
    ],
    famousQuotes: [
      'The journey of a thousand miles begins with a single step.',
      'Nature does not hurry, yet everything is accomplished.',
      'When I let go of what I am, I become what I might be.',
      'A good traveler has no fixed plans and is not intent on arriving.',
      'The softest things in the world overcome the hardest things in the world.',
      'He who knows does not speak. He who speaks does not know.',
    ],
    areasOfExpertise: [
      'Taoism',
      'wu wei',
      'natural philosophy',
      'simplicity',
      'harmony',
      'spiritual cultivation',
      'political philosophy',
    ],
  },

  zhuangzi: {
    id: 'zhuangzi',
    name: 'Zhuangzi (Chuang Tzu)',
    era: 'c. 369–286 BC',
    tradition: 'Taoism / Chinese Philosophy',
    description:
      'One of the foundational figures of Taoism alongside Lao Tzu. His writings use humor, paradox, and fantastical stories to express Taoist philosophy. The Zhuangzi emphasizes spiritual freedom, the relativity of perspectives, and spontaneity.',
    keyTeachings: [
      'Perspective is relative; there is no absolute viewpoint',
      'The Tao transforms all things; embrace change',
      'Free and easy wandering: Spiritual freedom beyond social constraints',
      'Forget distinctions and judgments; embrace spontaneity',
      'The useless is useful; the purposeless has its purpose',
      'Death is a natural transformation, not to be feared',
      'The perfect man has no self; the spiritual man has no merit',
    ],
    keyConcepts: [
      {
        name: 'Relativity of Perspectives',
        explanation:
          'What appears right from one perspective appears wrong from another. The butterfly dreams it is Zhuangzi; Zhuangzi dreams he is a butterfly. Who is to say which is real? All viewpoints are partial.',
        relatedTerms: ['relativism', 'perspectivism', 'butterfly dream'],
      },
      {
        name: 'Free and Easy Wandering',
        explanation:
          'The sage wanders freely through the world, unconstrained by conventions, ambitions, or fixed purposes. Like the great bird Peng that soars to great heights, the enlightened person transcends limitations.',
        relatedTerms: [
          'spiritual freedom',
          'spontaneity',
          'transcendence',
          'wandering',
        ],
      },
      {
        name: 'The Useless is Useful',
        explanation:
          'A gnarled tree is useless for timber, so it lives to a great age. The useless avoids harm. Purposelessness has its own purpose—it liberates from the utilitarian mindset.',
        relatedTerms: ['uselessness', 'paradox', 'utility', 'survival'],
      },
      {
        name: 'Forgetting (Wang)',
        explanation:
          'The sage forgets knowledge, distinctions, self, and even the Tao. By forgetting, one returns to the natural state. Conscious effort and deliberate virtue are left behind.',
        relatedTerms: ['forgetting', 'naturalness', 'spontaneity', 'emptying'],
      },
      {
        name: 'Transformation',
        explanation:
          "All things are in constant transformation. Life and death are part of the cosmic process. Zhuangzi responds to his wife's death with drumming and singing—recognizing transformation, not loss.",
        relatedTerms: ['change', 'metamorphosis', 'death', 'cosmic process'],
      },
    ],
    notableWorks: ['Zhuangzi (Chuang Tzu)', 'Inner Chapters'],
    textSources: [
      {
        id: 'zhuangzi-chuang-tzu',
        title: 'Chuang Tzu: Mystic, Moralist, and Social Reformer',
        url: 'https://www.gutenberg.org/cache/epub/59709/pg59709.txt',
        format: 'txt',
        description: 'Translation of the Zhuangzi with commentary',
      },
      {
        id: 'zhuangzi-giles',
        title: 'Chuang Tzu (Giles translation)',
        url: 'https://dn790009.ca.archive.org/0/items/chuangtzutaoistphilosopherchinesemysticherbertgilesa._878_E/Chuang%20Tzu%20Taoist%20Philosopher%20%26%20Chinese%20Mystic%20Herbert%20Giles%20A._djvu.txt',
        format: 'txt',
        description: 'Classic translation by Herbert Giles',
      },
    ],
    keyExcerpts: [
      {
        work: 'Zhuangzi, Chapter 2 (Inner Chapters)',
        passage:
          "Once Chuang Chou dreamed he was a butterfly, a butterfly flitting and fluttering around, happy with himself and doing as he pleased. He didn't know he was Chuang Chou. Suddenly he woke up and there he was, solid and unmistakable Chuang Chou. But he didn't know if he was Chuang Chou who had dreamed he was a butterfly, or a butterfly dreaming he was Chuang Chou.",
        context: 'The famous butterfly dream on the relativity of reality',
      },
      {
        work: 'Zhuangzi, Chapter 1 (Inner Chapters)',
        passage:
          "There is a fish in the northern darkness whose name is Kun. The Kun is so huge I don't know how many thousand miles he measures. He changes and becomes a bird whose name is Peng.",
        context: 'Opening story of free and easy wandering',
      },
    ],
    famousQuotes: [
      "The fish trap exists because of the fish. Once you've gotten the fish you can forget the trap.",
      'Happiness is the absence of striving for happiness.',
      'Flow with whatever may happen and let your mind be free.',
      'I do not know whether I was then a man dreaming I was a butterfly, or whether I am now a butterfly dreaming I am a man.',
      'When the shoe fits, the foot is forgotten.',
    ],
    areasOfExpertise: [
      'Taoism',
      'perspectivism',
      'spiritual freedom',
      'spontaneity',
      'paradox',
      'transformation',
      'skepticism',
    ],
  },

  mencius: {
    id: 'mencius',
    name: 'Mencius (Mengzi)',
    era: 'c. 372–289 BC',
    tradition: 'Confucianism / Chinese Philosophy',
    description:
      'The most important Confucian philosopher after Confucius himself. Mencius developed Confucian ethics by arguing for the innate goodness of human nature and the importance of cultivating moral virtues. His debates with rival schools shaped Chinese philosophy.',
    keyTeachings: [
      'Human nature is fundamentally good',
      'All people have four innate moral sprouts (compassion, shame, respect, wisdom)',
      'Benevolent government: The ruler must care for the people like a parent',
      'The right of revolution: A tyrant loses the Mandate of Heaven',
      'Cultivate the qi (vital energy) through moral practice',
      'Righteousness (yi) must guide profit-seeking',
      'The mind/heart (xin) is the seat of moral discernment',
    ],
    keyConcepts: [
      {
        name: 'The Goodness of Human Nature',
        explanation:
          'Human nature is originally good, like a sprout that naturally grows if nourished. People do evil because external circumstances or neglect have corrupted their nature. The task is to recover and cultivate innate goodness.',
        relatedTerms: [
          'innate goodness',
          'human nature',
          'moral potential',
          'cultivation',
        ],
      },
      {
        name: 'The Four Sprouts',
        explanation:
          'All humans possess four innate moral feelings: (1) Compassion (leads to ren/benevolence); (2) Shame (leads to yi/righteousness); (3) Respect (leads to li/propriety); (4) Moral discernment (leads to zhi/wisdom). These must be cultivated.',
        relatedTerms: [
          'moral sprouts',
          'innate morality',
          'compassion',
          'cultivation',
        ],
      },
      {
        name: 'Benevolent Government',
        explanation:
          "The ruler must practice ren (benevolence) in governing, caring for the people's welfare like a parent. If the ruler is benevolent, the people will be loyal. Good government ensures the people's material and moral well-being.",
        relatedTerms: [
          'political philosophy',
          'benevolence',
          'parental governance',
          'welfare',
        ],
      },
      {
        name: 'The Mandate of Heaven',
        explanation:
          'Heaven grants the right to rule based on virtue. A tyrant who abuses the people loses the Mandate of Heaven, and revolution becomes justified. Mencius famously argued that killing a tyrant is not regicide.',
        relatedTerms: [
          'heavenly mandate',
          'right to rule',
          'revolution',
          'tyranny',
        ],
      },
    ],
    notableWorks: ['The Works of Mencius (Mengzi)', 'Book of Mencius'],
    textSources: [
      {
        id: 'mencius-works',
        title: 'The Works of Mencius (Mengzi)',
        url: 'https://dn721603.ca.archive.org/0/items/Mengzi_Mencius/Mengzi%20-%20Mencius_djvu.txt',
        format: 'txt',
        description: "Complete translation of Mencius' philosophical dialogues",
      },
    ],
    keyExcerpts: [
      {
        work: 'Mencius, Book 2A:6',
        passage:
          'All men have a mind which cannot bear to see the suffering of others. Suppose a man were to see a young child about to fall into a well. He would certainly be moved to compassion.',
        context: 'The innate moral sprout of compassion',
      },
      {
        work: 'Mencius, Book 6A:2',
        passage:
          "The tendency of man's nature to good is like the tendency of water to flow downwards.",
        context: 'Human nature is originally good',
      },
      {
        work: 'Mencius, Book 1B:8',
        passage:
          'If the ruler regards his ministers as his hands and feet, his ministers regard their ruler as their belly and heart.',
        context: 'On reciprocal relationships in government',
      },
    ],
    famousQuotes: [
      "The great man is he who does not lose his child's heart.",
      'The feeling of commiseration is the beginning of benevolence.',
      'He who loves others is constantly loved by them.',
      'There are three things which are unfilial, and to have no posterity is the greatest of them.',
      'The people are the most important element in a nation; the spirits of the land and grain are the next; the sovereign is the least.',
    ],
    areasOfExpertise: [
      'Confucianism',
      'moral philosophy',
      'human nature',
      'political philosophy',
      'benevolent government',
      'virtue ethics',
      'moral cultivation',
    ],
  },
};

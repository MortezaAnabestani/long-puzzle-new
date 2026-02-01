/**
 * Content Variety Manager
 *
 * Prevents repetitive content by tracking recent topics and adding variation
 * Uses LocalStorage for persistence across browser sessions
 */

interface TopicHistory {
  categoryId: string;
  timestamp: number;
}

const HISTORY_SIZE = 8; // Track last 8 topics
const STORAGE_KEY = 'puzzle_maker_topic_history';

/**
 * Load topic history from LocalStorage
 */
const loadTopicHistory = (): TopicHistory[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate and filter old entries (older than 7 days)
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      return parsed.filter((item: TopicHistory) => item.timestamp > weekAgo);
    }
  } catch (error) {
    console.warn('Failed to load topic history from LocalStorage:', error);
  }
  return [];
};

/**
 * Save topic history to LocalStorage
 */
const saveTopicHistory = (history: TopicHistory[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.warn('Failed to save topic history to LocalStorage:', error);
  }
};

// Initialize from LocalStorage
const recentTopics: TopicHistory[] = loadTopicHistory();

/**
 * Select a category that hasn't been used recently
 */
export const selectFreshCategory = <T extends { id: string }>(
  categories: T[],
  minGap: number = 5
): T => {
  // Get list of recently used category IDs
  const recentIds = recentTopics.map(h => h.categoryId);

  // Find categories that haven't been used recently
  const freshCategories = categories.filter(cat => {
    const lastIndex = recentIds.lastIndexOf(cat.id);
    // Category is fresh if: never used OR used more than minGap items ago
    return lastIndex === -1 || (recentIds.length - lastIndex) > minGap;
  });

  // If all categories were used recently, pick the oldest one
  const candidatePool = freshCategories.length > 0 ? freshCategories : categories;

  // Random selection from fresh pool
  const selected = candidatePool[Math.floor(Math.random() * candidatePool.length)];

  // Record this selection
  recordTopicUsage(selected.id);

  // Log variety stats
  console.log(`🎲 Content Variety: Selected "${selected.id}" | Pool size: ${candidatePool.length}/${categories.length} | Recent: [${recentIds.slice(-5).join(', ')}]`);

  return selected;
};

/**
 * Record that a topic was just used
 */
const recordTopicUsage = (categoryId: string): void => {
  recentTopics.push({
    categoryId,
    timestamp: Date.now()
  });

  // Keep only recent history
  if (recentTopics.length > HISTORY_SIZE) {
    recentTopics.shift();
  }

  // Save to localStorage after each change
  saveTopicHistory(recentTopics);
};

/**
 * Add unique variation details to a topic prompt
 * This ensures even the same category generates different content
 */
export const addTopicVariation = (basePrompt: string): string => {
  const variations = [
    // Perspective variations
    "from an unusual angle with dramatic perspective",
    "in extreme close-up detail showing intricate textures",
    "in an epic wide-angle establishing shot",
    "from a bird's eye view looking down",
    "at ground level with a worm's eye view",

    // Lighting variations
    "during golden hour with warm atmospheric lighting",
    "at blue hour with cool twilight tones",
    "with dramatic rim lighting and strong shadows",
    "in soft diffused natural light",
    "with cinematic high-contrast lighting",
    "under starlight with bioluminescent glow",

    // Mood variations
    "with a mysterious and enigmatic atmosphere",
    "with an awe-inspiring majestic quality",
    "with serene peaceful ambiance",
    "with dynamic energetic composition",
    "with haunting ethereal beauty",

    // Color variations
    "with rich saturated colors and vivid tones",
    "in muted desaturated earth tones",
    "with vibrant complementary color scheme",
    "in monochromatic color palette with subtle variations",
    "with jewel-tone colors and metallic accents",

    // Composition variations
    "using the rule of thirds for balanced composition",
    "with symmetrical centered framing",
    "using leading lines to guide the eye",
    "with negative space for dramatic effect",
    "using frame-within-frame composition",

    // Detail variations
    "showing weathered aged textures and patina",
    "with pristine perfect condition and clarity",
    "revealing hidden microscopic details",
    "emphasizing geometric patterns and shapes",
    "highlighting organic flowing forms",

    // Time variations
    "frozen in a split-second moment",
    "showing the passage of time through motion blur",
    "capturing the essence of a specific historical era",
    "depicting a timeless eternal quality",

    // Environment variations
    "surrounded by atmospheric fog or mist",
    "in crystal clear air with sharp visibility",
    "amid swirling dust particles and light rays",
    "reflected in still water creating mirror symmetry",
    "framed by natural environmental elements"
  ];

  // Select 1-2 random variations
  const numVariations = Math.random() > 0.6 ? 2 : 1;
  const selectedVariations: string[] = [];

  const shuffled = [...variations].sort(() => Math.random() - 0.5);
  for (let i = 0; i < numVariations; i++) {
    selectedVariations.push(shuffled[i]);
  }

  return `${basePrompt}, ${selectedVariations.join(', ')}`;
};

/**
 * Get statistics about topic usage
 */
export const getTopicStats = () => {
  const categoryCount: Record<string, number> = {};

  recentTopics.forEach(h => {
    categoryCount[h.categoryId] = (categoryCount[h.categoryId] || 0) + 1;
  });

  return {
    totalTracked: recentTopics.length,
    uniqueCategories: Object.keys(categoryCount).length,
    distribution: categoryCount,
    recentHistory: recentTopics.map(h => h.categoryId)
  };
};

/**
 * Clear topic history (useful for testing)
 */
export const clearTopicHistory = (): void => {
  recentTopics.length = 0;
};
import type { AchievementDef, GamificationStats } from '@/types/gamification';

// ── Achievement Categories ──────────────────────────────────────────────────

export type AchievementCategory =
  | 'task_completion'
  | 'task_creation'
  | 'time_speed'
  | 'consistency'
  | 'organization'
  | 'xp_leveling'
  | 'study'
  | 'events'
  | 'finance'
  | 'wellness'
  | 'collaboration'
  | 'notes'
  | 'advanced'
  | 'mastery';

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  task_completion: 'Task Completion',
  task_creation: 'Task Creation',
  time_speed: 'Time & Speed',
  consistency: 'Consistency & Streaks',
  organization: 'Organization',
  xp_leveling: 'XP & Leveling',
  study: 'Study & Learning',
  events: 'Event Management',
  finance: 'Finance Tracking',
  wellness: 'Wellness',
  collaboration: 'Collaboration',
  notes: 'Notes & Research',
  advanced: 'Advanced Consistency',
  mastery: 'Master Class',
};

export const CATEGORY_ICONS: Record<AchievementCategory, string> = {
  task_completion: '✅',
  task_creation: '📝',
  time_speed: '⚡',
  consistency: '🔥',
  organization: '📂',
  xp_leveling: '⭐',
  study: '📚',
  events: '📅',
  finance: '💰',
  wellness: '🧘',
  collaboration: '🤝',
  notes: '📓',
  advanced: '💎',
  mastery: '👑',
};

// ── Helper ──────────────────────────────────────────────────────────────────

function def(
  id: string,
  title: string,
  description: string,
  icon: string,
  category: AchievementCategory,
  xpReward: number,
  condition: (s: GamificationStats) => boolean,
): AchievementDef {
  return { id, title, description, icon, category, xpReward, condition };
}

// ── The 100 Achievements ────────────────────────────────────────────────────

export const ACHIEVEMENTS: AchievementDef[] = [
  // ─── Task Completion (1–9) ──────────────────────────────────────────────
  def('task_complete_1', 'First Steps', 'Complete your first task', '🎯', 'task_completion', 10,
    (s) => s.totalItemsCompleted >= 1),
  def('task_complete_5', 'Getting the Hang of It', 'Complete 5 tasks', '🔧', 'task_completion', 20,
    (s) => s.totalItemsCompleted >= 5),
  def('task_complete_15', 'Task Manager', 'Complete 15 tasks', '📋', 'task_completion', 50,
    (s) => s.totalItemsCompleted >= 15),
  def('task_complete_30', 'Productivity Machine', 'Complete 30 tasks', '⚙️', 'task_completion', 100,
    (s) => s.totalItemsCompleted >= 30),
  def('task_complete_50', 'Half-Century', 'Complete 50 tasks', '🏅', 'task_completion', 150,
    (s) => s.totalItemsCompleted >= 50),
  def('task_complete_75', 'Diamond Focus', 'Complete 75 tasks', '💎', 'task_completion', 200,
    (s) => s.totalItemsCompleted >= 75),
  def('task_complete_100', 'Centurion', 'Complete 100 tasks', '🏆', 'task_completion', 300,
    (s) => s.totalItemsCompleted >= 100),
  def('task_complete_250', 'Unstoppable', 'Complete 250 tasks', '🚀', 'task_completion', 500,
    (s) => s.totalItemsCompleted >= 250),
  def('task_complete_500', 'Dashboard Deity', 'Complete 500 tasks', '👑', 'task_completion', 1000,
    (s) => s.totalItemsCompleted >= 500),

  // ─── Task Creation (10–12) ──────────────────────────────────────────────
  def('task_create_10', 'The Architect', 'Create 10 tasks', '🏗️', 'task_creation', 20,
    (s) => s.totalItemsCreated >= 10),
  def('task_create_50', 'Master Planner', 'Create 50 tasks', '📐', 'task_creation', 50,
    (s) => s.totalItemsCreated >= 50),
  def('task_create_100', 'Endless Backlog', 'Create 100 tasks', '📚', 'task_creation', 100,
    (s) => s.totalItemsCreated >= 100),

  // ─── Time & Speed (13–18) ──────────────────────────────────────────────
  def('speed_demon', 'Speed Demon', 'Complete a task within 1 hour of creating it', '⚡', 'time_speed', 30,
    (s) => s.hasSpeedCompletion),
  def('deep_work', 'Deep Work', 'Complete 5 tasks in a single day', '🧠', 'time_speed', 50,
    (s) => s.dailyItemsCompleted >= 5),
  def('overdrive', 'Overdrive', 'Complete 10 tasks in a single day', '🔥', 'time_speed', 100,
    (s) => s.dailyItemsCompleted >= 10),
  def('early_bird', 'Early Bird', 'Complete a task before 7:00 AM', '🌅', 'time_speed', 20,
    (s) => s.hasEarlyBirdCompletion),
  def('night_owl', 'Night Owl', 'Complete a task after 11:00 PM', '🦉', 'time_speed', 20,
    (s) => s.hasNightOwlCompletion),
  def('clutch', 'Clutch', 'Complete a task on its due date', '⏰', 'time_speed', 40,
    (s) => s.hasClutchCompletion),

  // ─── Consistency & Streaks (19–23) ─────────────────────────────────────
  def('streak_3', 'Warming Up', 'Log in for 3 consecutive days', '🌡️', 'consistency', 30,
    (s) => s.streak >= 3),
  def('streak_7', 'Weekly Warrior', 'Log in for 7 consecutive days', '🗓️', 'consistency', 70,
    (s) => s.streak >= 7),
  def('streak_14', 'Habit Former', 'Log in for 14 consecutive days', '🔗', 'consistency', 150,
    (s) => s.streak >= 14),
  def('streak_30', 'Monthly Master', 'Log in for 30 consecutive days', '📆', 'consistency', 300,
    (s) => s.streak >= 30),
  def('streak_100', 'Iron Will', 'Log in for 100 consecutive days', '🛡️', 'consistency', 1000,
    (s) => s.streak >= 100),

  // ─── Organization & Features (24–27) ───────────────────────────────────
  def('importance_10', 'Categorical', 'Set importance level on 10 different tasks', '🏷️', 'organization', 20,
    (s) => s.totalItemsCreated >= 10),
  def('long_description', 'Detail Oriented', 'Write a task description longer than 100 words', '📝', 'organization', 15,
    (s) => s.hasLongDescription),
  def('delete_10', 'Declutter', 'Delete 10 old or unnecessary tasks', '🗑️', 'organization', 10,
    (s) => s.totalItemsDeleted >= 10),
  def('reschedule_5', 'Rescheduler', 'Create tasks on 5 different dates', '🔄', 'organization', 10,
    (s) => s.uniqueTaskDates >= 5),

  // ─── XP & Leveling (28–37) ─────────────────────────────────────────────
  def('level_2', 'Rookie', 'Reach Level 2', '⬆️', 'xp_leveling', 10,
    (s) => s.level >= 2),
  def('level_5', 'Rising Star', 'Reach Level 5', '🌟', 'xp_leveling', 30,
    (s) => s.level >= 5),
  def('level_10', 'Experienced', 'Reach Level 10', '💪', 'xp_leveling', 75,
    (s) => s.level >= 10),
  def('level_15', 'Veteran', 'Reach Level 15', '🎖️', 'xp_leveling', 100,
    (s) => s.level >= 15),
  def('level_20', 'Elite', 'Reach Level 20', '🏰', 'xp_leveling', 200,
    (s) => s.level >= 20),
  def('level_30', 'Legend', 'Reach Level 30', '🐉', 'xp_leveling', 400,
    (s) => s.level >= 30),
  def('level_50', 'Mythic', 'Reach Level 50', '🌌', 'xp_leveling', 800,
    (s) => s.level >= 50),
  def('xp_1000', 'XP Hoarder', 'Earn 1,000 total XP', '💰', 'xp_leveling', 50,
    (s) => s.totalXP >= 1000),
  def('xp_5000', 'XP Mogul', 'Earn 5,000 total XP', '💎', 'xp_leveling', 150,
    (s) => s.totalXP >= 5000),
  def('xp_25000', 'XP Overlord', 'Earn 25,000 total XP', '👑', 'xp_leveling', 500,
    (s) => s.totalXP >= 25000),

  // ─── Study & Learning (38–47) ──────────────────────────────────────────
  def('study_first', 'Scholar', 'Complete your first study session', '📖', 'study', 10,
    (s) => s.totalStudyCompleted >= 1),
  def('study_5', 'Bookworm', 'Complete 5 study sessions', '📗', 'study', 25,
    (s) => s.totalStudyCompleted >= 5),
  def('study_15', 'Academic', 'Complete 15 study sessions', '🎓', 'study', 60,
    (s) => s.totalStudyCompleted >= 15),
  def('study_30', 'Professor', 'Complete 30 study sessions', '👨‍🏫', 'study', 120,
    (s) => s.totalStudyCompleted >= 30),
  def('study_50', 'Sage', 'Complete 50 study sessions', '🧙', 'study', 200,
    (s) => s.totalStudyCompleted >= 50),
  def('notebook_first', 'Notebook Novice', 'Create your first notebook', '📒', 'study', 15,
    (s) => s.notebooksCreated >= 1),
  def('sources_5', 'Source Collector', 'Upload 5 sources to Study Hub', '📎', 'study', 25,
    (s) => s.sourcesUploaded >= 5),
  def('flashcards_10', 'Flashcard Fan', 'Create 10 flashcards', '🃏', 'study', 20,
    (s) => s.flashcardsCreated >= 10),
  def('quiz_20', 'Quiz Whiz', 'Have 20 quiz questions generated', '❓', 'study', 30,
    (s) => s.quizQuestionsCount >= 20),
  def('study_marathon', 'Study Marathon', 'Complete 3 study sessions in one day', '🏃', 'study', 50,
    (s) => s.dailyStudyCompleted >= 3),

  // ─── Event Management (48–55) ──────────────────────────────────────────
  def('event_first', 'Event Planner', 'Complete your first event', '📅', 'events', 10,
    (s) => s.totalEventsCompleted >= 1),
  def('event_5', 'Social Butterfly', 'Complete 5 events', '🦋', 'events', 25,
    (s) => s.totalEventsCompleted >= 5),
  def('event_15', 'Event Pro', 'Complete 15 events', '🎪', 'events', 60,
    (s) => s.totalEventsCompleted >= 15),
  def('event_30', 'Calendar King', 'Complete 30 events', '👑', 'events', 120,
    (s) => s.totalEventsCompleted >= 30),
  def('schedule_5', 'Schedule Master', 'Create 5 schedule entries', '🗓️', 'events', 20,
    (s) => s.scheduleEntriesCount >= 5),
  def('schedule_days_5', 'Time Blocker', 'Have schedule entries covering 5 different days', '📊', 'events', 25,
    (s) => s.scheduleEntriesCount >= 3),
  def('event_create_10', 'Event Organizer', 'Create 10 events', '🎭', 'events', 30,
    (s) => s.totalEventsCreated >= 10),
  def('event_50', 'Event Legend', 'Complete 50 events', '🌟', 'events', 200,
    (s) => s.totalEventsCompleted >= 50),

  // ─── Finance Tracking (56–63) ──────────────────────────────────────────
  def('finance_first', 'Penny Pincher', 'Log your first transaction', '🪙', 'finance', 10,
    (s) => s.transactionsLogged >= 1),
  def('budget_set', 'Budget Setter', 'Set a monthly budget', '📊', 'finance', 15,
    (s) => s.hasMonthlyBudget),
  def('finance_10', 'Expense Tracker', 'Log 10 transactions', '💳', 'finance', 25,
    (s) => s.transactionsLogged >= 10),
  def('finance_25', 'Financial Planner', 'Log 25 transactions', '📈', 'finance', 50,
    (s) => s.transactionsLogged >= 25),
  def('finance_50', 'Money Manager', 'Log 50 transactions', '💼', 'finance', 100,
    (s) => s.transactionsLogged >= 50),
  def('budget_5', 'Budget Balancer', 'Set budgets for 5 categories', '⚖️', 'finance', 30,
    (s) => s.budgetsSet >= 5),
  def('income_setup', 'Income Logger', 'Set up your income settings', '💵', 'finance', 15,
    (s) => s.hasIncomeSetup),
  def('finance_100', 'Century Spender', 'Log 100 transactions', '🏦', 'finance', 200,
    (s) => s.transactionsLogged >= 100),

  // ─── Wellness (64–70) ──────────────────────────────────────────────────
  def('wellness_visit', 'Self Care', 'Visit the Wellness page', '💚', 'wellness', 10,
    (s) => s.hasVisitedWellness),
  def('journal_first', 'Journal Starter', 'Write your first journal entry', '📔', 'wellness', 15,
    (s) => s.journalEntriesCount >= 1),
  def('habit_first', 'Habit Builder', 'Create your first habit', '🌱', 'wellness', 15,
    (s) => s.habitsCreated >= 1),
  def('habit_streak_3', 'Mindful Streak', 'Track habits for 3 days', '🧘', 'wellness', 30,
    (s) => s.habitTrackingDays >= 3),
  def('habit_streak_7', 'Wellness Warrior', 'Track habits for 7 days', '🏋️', 'wellness', 50,
    (s) => s.habitTrackingDays >= 7),
  def('journal_10', 'Journal Keeper', 'Write 10 journal entries', '📕', 'wellness', 40,
    (s) => s.journalEntriesCount >= 10),
  def('habit_5', 'Habit Master', 'Create 5 different habits', '🎯', 'wellness', 30,
    (s) => s.habitsCreated >= 5),

  // ─── Collaboration (71–77) ─────────────────────────────────────────────
  def('group_join', 'Team Player', 'Join your first group', '🤝', 'collaboration', 10,
    (s) => s.groupsJoined >= 1),
  def('group_create', 'Group Creator', 'Create a group', '👥', 'collaboration', 15,
    (s) => s.groupsJoined >= 1),
  def('messages_10', 'Chatterbox', 'Send 10 group messages', '💬', 'collaboration', 20,
    (s) => s.groupMessagesCount >= 10),
  def('friends_3', 'Social Network', 'Have 3 friends', '🌐', 'collaboration', 25,
    (s) => s.friendsCount >= 3),
  def('link_share', 'Link Sharer', 'Share a link in a group', '🔗', 'collaboration', 15,
    (s) => s.linksSharedCount >= 1),
  def('messages_50', 'Communicator', 'Send 50 group messages', '📢', 'collaboration', 50,
    (s) => s.groupMessagesCount >= 50),
  def('friends_5', 'Popular', 'Have 5 friends', '⭐', 'collaboration', 40,
    (s) => s.friendsCount >= 5),

  // ─── Notes & Research (78–83) ──────────────────────────────────────────
  def('note_first', 'Note Taker', 'Generate notes in Study Hub', '📝', 'notes', 10,
    (s) => s.generatedNotesCount >= 1),
  def('mind_map', 'Mind Mapper', 'Generate a mind map', '🗺️', 'notes', 20,
    (s) => s.mindMapsCount >= 1),
  def('notebook_chat', 'AI Student', 'Use the notebook chat feature', '🤖', 'notes', 15,
    (s) => s.notebookChatCount >= 1),
  def('flashcard_master', 'Flashcard Master', 'Master 10 flashcards', '🏆', 'notes', 40,
    (s) => s.flashcardsMastered >= 10),
  def('notebooks_3', 'Multi-Notebook', 'Create 3 notebooks', '📚', 'notes', 25,
    (s) => s.notebooksCreated >= 3),
  def('sources_10', 'Source Scholar', 'Upload 10 sources', '🔬', 'notes', 50,
    (s) => s.sourcesUploaded >= 10),

  // ─── Advanced Consistency (84–93) ──────────────────────────────────────
  def('weekend_warrior', 'Weekend Warrior', 'Complete a task on both Saturday and Sunday', '🎉', 'advanced', 25,
    (s) => s.hasWeekendCompletion),
  def('full_week', 'Full Week', 'Complete at least 1 task every day for a week', '📅', 'advanced', 60,
    (s) => s.streak >= 7 && s.totalItemsCompleted >= 7),
  def('two_week_titan', 'Two Week Titan', 'Maintain a 14-day streak', '🏔️', 'advanced', 120,
    (s) => s.streak >= 14),
  def('monthly_marathon', 'Monthly Marathon', 'Maintain a 30-day streak', '🏃‍♂️', 'advanced', 250,
    (s) => s.streak >= 30),
  def('quarterly_champion', 'Quarterly Champion', 'Log in for 90 consecutive days', '🏅', 'advanced', 500,
    (s) => s.streak >= 90),
  def('yearly_legend', 'Yearly Legend', 'Log in for 365 consecutive days', '🌍', 'advanced', 2000,
    (s) => s.streak >= 365),
  def('morning_person', 'Morning Person', 'Complete 10 tasks before 9 AM', '☀️', 'advanced', 50,
    (s) => s.morningCompletions >= 10),
  def('night_shift', 'Night Shift', 'Complete 10 tasks after 9 PM', '🌙', 'advanced', 50,
    (s) => s.nightCompletions >= 10),
  def('lunch_break', 'Lunch Break', 'Complete a task between 12–1 PM', '🍱', 'advanced', 15,
    (s) => s.hasLunchCompletion),
  def('golden_hour', 'Golden Hour', 'Complete 3 tasks within a single hour', '✨', 'advanced', 40,
    (s) => s.dailyItemsCompleted >= 3),

  // ─── Master Class (94–100) ─────────────────────────────────────────────
  def('jack_of_all', 'Jack of All Trades', 'Complete a task, event, and study session', '🃏', 'mastery', 30,
    (s) => s.hasCompletedTaskType && s.hasCompletedEventType && s.hasCompletedStudyType),
  def('perfectionist', 'Perfectionist', 'Complete all tasks for 3 days straight', '✅', 'mastery', 50,
    (s) => s.streak >= 3 && s.totalItemsCompleted >= 10),
  def('renaissance', 'Renaissance', 'Use Tasks, Finance, Study Hub, and Wellness features', '🎭', 'mastery', 75,
    (s) => s.totalItemsCompleted >= 1 && s.transactionsLogged >= 1 && s.totalStudyCompleted >= 1 && s.hasVisitedWellness),
  def('zero_inbox', 'Zero Inbox', 'Clear all todo tasks (have none remaining)', '📭', 'mastery', 40,
    (s) => s.todoCount === 0 && s.totalItemsCompleted >= 5),
  def('multitasker', 'Multitasker', 'Have 10+ tasks in progress simultaneously', '🔀', 'mastery', 25,
    (s) => s.inProgressCount >= 10),
  def('the_grind', 'The Grind', 'Earn XP on 50 different days', '⛏️', 'mastery', 200,
    (s) => s.uniqueActiveDays >= 50),
  def('completionist', 'Completionist', 'Unlock 50 other achievements', '🌈', 'mastery', 1000,
    (s) => s.unlockedCount >= 50),
];

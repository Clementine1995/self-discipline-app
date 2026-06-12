import type { CheckIn, Habit, RepeatRule, Weekday } from '@/types/habit';
import { eachDateKeyBetween, getWeekRange, parseDateKey } from '@/utils/date';

export const weekdayOptions: { value: Weekday; label: string }[] = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 0, label: '周日' },
];

export const defaultRepeatRule: RepeatRule = {
  type: 'daily',
};

export const normalizeRepeatRule = (repeatRule?: RepeatRule): RepeatRule => {
  if (!repeatRule) {
    return defaultRepeatRule;
  }

  if (repeatRule.type === 'weeklyTarget') {
    return {
      type: 'weeklyTarget',
      timesPerWeek: clampWeeklyTarget(repeatRule.timesPerWeek),
    };
  }

  if (repeatRule.type !== 'weekly') {
    return repeatRule;
  }

  const daysOfWeek = [...new Set(repeatRule.daysOfWeek)].filter(isWeekday);

  return {
    type: 'weekly',
    daysOfWeek: daysOfWeek.length > 0 ? daysOfWeek : [1],
  };
};

export const shouldHabitRunOnDate = (habit: Pick<Habit, 'createdAt' | 'repeatRule'>, dateKey: string) => {
  if (dateKey < habit.createdAt.slice(0, 10)) {
    return false;
  }

  const repeatRule = normalizeRepeatRule(habit.repeatRule);

  if (repeatRule.type === 'weeklyTarget') {
    return true;
  }

  return doesRepeatRuleMatchDate(repeatRule, dateKey);
};

export const shouldHabitBeActiveOnDate = (
  habit: Pick<Habit, 'id' | 'createdAt' | 'repeatRule'>,
  checkIns: CheckIn[],
  dateKey: string,
) => {
  if (!shouldHabitRunOnDate(habit, dateKey)) {
    return false;
  }

  const repeatRule = normalizeRepeatRule(habit.repeatRule);

  if (repeatRule.type !== 'weeklyTarget') {
    return true;
  }

  if (checkIns.some((checkIn) => checkIn.habitId === habit.id && checkIn.date === dateKey)) {
    return true;
  }

  return countWeeklyTargetCheckInsUntilDate(habit.id, checkIns, dateKey) < repeatRule.timesPerWeek;
};

export const doesRepeatRuleMatchDate = (repeatRule: RepeatRule, dateKey: string) => {
  const weekday = parseDateKey(dateKey).getDay() as Weekday;

  if (repeatRule.type === 'daily') {
    return true;
  }

  if (repeatRule.type === 'weekdays') {
    return weekday >= 1 && weekday <= 5;
  }

  if (repeatRule.type === 'weekends') {
    return weekday === 0 || weekday === 6;
  }

  const normalizedRule = normalizeRepeatRule(repeatRule);
  return normalizedRule.type === 'weekly' && normalizedRule.daysOfWeek.includes(weekday);
};

export const getRepeatRuleWeekdays = (repeatRule: RepeatRule): Weekday[] => {
  const normalizedRule = normalizeRepeatRule(repeatRule);

  if (normalizedRule.type === 'daily') {
    return [0, 1, 2, 3, 4, 5, 6];
  }

  if (normalizedRule.type === 'weekdays') {
    return [1, 2, 3, 4, 5];
  }

  if (normalizedRule.type === 'weekends') {
    return [0, 6];
  }

  if (normalizedRule.type === 'weeklyTarget') {
    return [0, 1, 2, 3, 4, 5, 6];
  }

  return normalizedRule.type === 'weekly' ? normalizedRule.daysOfWeek : [1];
};

export const formatRepeatRule = (repeatRule?: RepeatRule) => {
  const normalizedRule = normalizeRepeatRule(repeatRule);

  if (normalizedRule.type === 'daily') {
    return '每天重复';
  }

  if (normalizedRule.type === 'weekdays') {
    return '工作日重复';
  }

  if (normalizedRule.type === 'weekends') {
    return '周末重复';
  }

  if (normalizedRule.type === 'weeklyTarget') {
    return `每周 ${normalizedRule.timesPerWeek} 次`;
  }

  if (normalizedRule.type !== 'weekly') {
    return '每天重复';
  }

  return normalizedRule.daysOfWeek
    .map((weekday: Weekday) => weekdayOptions.find((option) => option.value === weekday)?.label)
    .filter(Boolean)
    .join('、')
    .concat('重复');
};

export const countWeeklyTargetCheckIns = (habitId: string, checkIns: CheckIn[], dateKey: string) => {
  const weekRange = getWeekRange(dateKey);

  return checkIns.filter(
    (checkIn) =>
      checkIn.habitId === habitId && checkIn.date >= weekRange.start && checkIn.date <= weekRange.end,
  ).length;
};

export const countWeeklyTargetCheckInsUntilDate = (habitId: string, checkIns: CheckIn[], dateKey: string) => {
  const weekRange = getWeekRange(dateKey);

  return checkIns.filter(
    (checkIn) =>
      checkIn.habitId === habitId && checkIn.date >= weekRange.start && checkIn.date <= dateKey,
  ).length;
};

export const getWeeklyTargetFailureCount = (habit: Pick<Habit, 'id' | 'createdAt' | 'repeatRule'>, checkIns: CheckIn[], today: string) => {
  const repeatRule = normalizeRepeatRule(habit.repeatRule);

  if (repeatRule.type !== 'weeklyTarget') {
    return 0;
  }

  const createdDate = habit.createdAt.slice(0, 10);
  const todayWeek = getWeekRange(today);
  const weekStarts = eachDateKeyBetween(getWeekRange(createdDate).start, todayWeek.start).filter(
    (dateKey) => parseDateKey(dateKey).getDay() === 1 && dateKey < todayWeek.start,
  );

  return weekStarts.reduce((total, weekStart) => {
    const weekEnd = getWeekRange(weekStart).end;
    const effectiveStart = weekStart < createdDate ? createdDate : weekStart;
    const possibleDays = eachDateKeyBetween(effectiveStart, weekEnd).length;
    const target = Math.min(repeatRule.timesPerWeek, possibleDays);
    const completed = checkIns.filter(
      (checkIn) => checkIn.habitId === habit.id && checkIn.date >= effectiveStart && checkIn.date <= weekEnd,
    ).length;

    return total + Math.max(0, target - completed);
  }, 0);
};

const isWeekday = (value: number): value is Weekday => value >= 0 && value <= 6;

const clampWeeklyTarget = (value: number) => Math.min(7, Math.max(1, Math.round(Number(value) || 1)));
